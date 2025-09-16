// Intégrations APIs de paiement mobile pour la Côte d'Ivoire
// Orange Money, Wave et MTN Mobile Money

export type TypePaiementMobile = 'orange_money' | 'wave' | 'mtn_momo'

export type DemandePaiement = {
  montant: number
  devise: string
  numeroDestinataire: string
  nomDestinataire: string
  motif: string
  referenceInterne: string
  operateur: TypePaiementMobile
  metadata?: Record<string, any>
}

export type ResultatPaiement = {
  succes: boolean
  referenceTransaction?: string
  statutTransaction: 'en_attente' | 'succes' | 'echec' | 'annule'
  messageErreur?: string
  frais?: number
  dateTraitement: Date
  metadata?: Record<string, any>
}

export type StatutTransactionMobile = {
  referenceTransaction: string
  statut: 'en_attente' | 'succes' | 'echec' | 'annule'
  montant: number
  frais: number
  dateInitiation: Date
  dateTraitement?: Date
  messageErreur?: string
}

/**
 * Interface pour les fournisseurs de paiement mobile
 */
export interface FournisseurPaiementMobile {
  initierPaiement(demande: DemandePaiement): Promise<ResultatPaiement>
  verifierStatutTransaction(referenceTransaction: string): Promise<StatutTransactionMobile>
  obtenirSolde(): Promise<{ solde: number, devise: string }>
  validerNumeroTelephone(numero: string): boolean
}

/**
 * Implémentation Orange Money API
 */
export class OrangeMoneyAPI implements FournisseurPaiementMobile {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  private accessToken?: string
  private tokenExpiry?: Date

  constructor(config: { apiKey: string, apiSecret: string, baseUrl: string }) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.baseUrl = config.baseUrl
  }

  private async obtenirAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      })

      if (!response.ok) {
        throw new Error(`Erreur authentification Orange Money: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000))
      
      return this.accessToken
    } catch (error) {
      throw new Error(`Impossible d'obtenir le token Orange Money: ${error}`)
    }
  }

  async initierPaiement(demande: DemandePaiement): Promise<ResultatPaiement> {
    try {
      const token = await this.obtenirAccessToken()
      
      const payload = {
        customer: {
          idType: 'MSISDN',
          id: this.normaliserNumeroTelephone(demande.numeroDestinataire)
        },
        partner: {
          idType: 'MSISDN', 
          id: process.env.ORANGE_MONEY_MERCHANT_MSISDN
        },
        amount: {
          value: demande.montant,
          currency: demande.devise || 'XOF'
        },
        description: demande.motif,
        requestToPay: {
          amount: demande.montant,
          currency: demande.devise || 'XOF',
          externalId: demande.referenceInterne,
          payer: {
            partyIdType: 'MSISDN',
            partyId: this.normaliserNumeroTelephone(demande.numeroDestinataire)
          },
          payerMessage: `Salaire - ${demande.motif}`,
          payeeNote: `Paiement salaire pour ${demande.nomDestinataire}`
        }
      }

      const response = await fetch(`${this.baseUrl}/omcoreapis/1.0.2/mp/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        return {
          succes: true,
          referenceTransaction: result.transactionId || result.externalId,
          statutTransaction: 'en_attente',
          dateTraitement: new Date(),
          metadata: result
        }
      } else {
        return {
          succes: false,
          statutTransaction: 'echec',
          messageErreur: result.message || 'Erreur lors du paiement Orange Money',
          dateTraitement: new Date()
        }
      }
    } catch (error) {
      return {
        succes: false,
        statutTransaction: 'echec',
        messageErreur: `Erreur technique Orange Money: ${error}`,
        dateTraitement: new Date()
      }
    }
  }

  async verifierStatutTransaction(referenceTransaction: string): Promise<StatutTransactionMobile> {
    try {
      const token = await this.obtenirAccessToken()
      
      const response = await fetch(`${this.baseUrl}/omcoreapis/1.0.2/mp/pay/${referenceTransaction}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
        }
      })

      const result = await response.json()

      return {
        referenceTransaction,
        statut: this.mapperStatutOrangeMoney(result.status),
        montant: result.amount,
        frais: result.fee || 0,
        dateInitiation: new Date(result.createdAt),
        dateTraitement: result.finishedAt ? new Date(result.finishedAt) : undefined,
        messageErreur: result.reason
      }
    } catch (error) {
      throw new Error(`Erreur vérification statut Orange Money: ${error}`)
    }
  }

  async obtenirSolde(): Promise<{ solde: number, devise: string }> {
    try {
      const token = await this.obtenirAccessToken()
      
      const response = await fetch(`${this.baseUrl}/omcoreapis/1.0.2/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
        }
      })

      const result = await response.json()
      
      return {
        solde: result.availableBalance,
        devise: result.currency
      }
    } catch (error) {
      throw new Error(`Erreur récupération solde Orange Money: ${error}`)
    }
  }

  validerNumeroTelephone(numero: string): boolean {
    // Format Orange Money Côte d'Ivoire: +225XXXXXXXX ou 07XXXXXXXX ou 05XXXXXXXX
    const regex = /^(\+225|225)?(0[57])\d{8}$|^(0[57])\d{8}$/
    return regex.test(numero)
  }

  private normaliserNumeroTelephone(numero: string): string {
    // Normalise le numéro au format international sans le +
    return numero.replace(/[\s\-\+]/g, '').replace(/^0/, '225')
  }

  private mapperStatutOrangeMoney(statut: string): 'en_attente' | 'succes' | 'echec' | 'annule' {
    switch (statut?.toLowerCase()) {
      case 'successful':
      case 'success':
        return 'succes'
      case 'failed':
      case 'rejected':
        return 'echec'
      case 'cancelled':
        return 'annule'
      default:
        return 'en_attente'
    }
  }
}

/**
 * Implémentation MTN Mobile Money API
 */
export class MTNMobileMoneyAPI implements FournisseurPaiementMobile {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  private accessToken?: string
  private tokenExpiry?: Date

  constructor(config: { apiKey: string, apiSecret: string, baseUrl: string }) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.baseUrl = config.baseUrl
  }

  private async obtenirAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    try {
      const response = await fetch(`${this.baseUrl}/collection/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64')}`,
          'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY!,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'mtncivoireco' : 'sandbox'
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur authentification MTN: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000))
      
      return this.accessToken
    } catch (error) {
      throw new Error(`Impossible d'obtenir le token MTN: ${error}`)
    }
  }

  async initierPaiement(demande: DemandePaiement): Promise<ResultatPaiement> {
    try {
      const token = await this.obtenirAccessToken()
      const referenceId = `SAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const payload = {
        amount: demande.montant.toString(),
        currency: demande.devise || 'XOF',
        externalId: demande.referenceInterne,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.normaliserNumeroTelephone(demande.numeroDestinataire)
        },
        payerMessage: `Salaire - ${demande.motif}`,
        payeeNote: `Paiement salaire pour ${demande.nomDestinataire}`
      }

      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'mtncivoireco' : 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY!
        },
        body: JSON.stringify(payload)
      })

      if (response.ok || response.status === 202) {
        return {
          succes: true,
          referenceTransaction: referenceId,
          statutTransaction: 'en_attente',
          dateTraitement: new Date(),
          metadata: { referenceId }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          succes: false,
          statutTransaction: 'echec',
          messageErreur: errorData.message || 'Erreur lors du paiement MTN Mobile Money',
          dateTraitement: new Date()
        }
      }
    } catch (error) {
      return {
        succes: false,
        statutTransaction: 'echec',
        messageErreur: `Erreur technique MTN: ${error}`,
        dateTraitement: new Date()
      }
    }
  }

  async verifierStatutTransaction(referenceTransaction: string): Promise<StatutTransactionMobile> {
    try {
      const token = await this.obtenirAccessToken()
      
      const response = await fetch(`${this.baseUrl}/collection/v1_0/requesttopay/${referenceTransaction}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'mtncivoireco' : 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY!
        }
      })

      const result = await response.json()

      return {
        referenceTransaction,
        statut: this.mapperStatutMTN(result.status),
        montant: parseFloat(result.amount),
        frais: 0, // MTN ne retourne pas les frais dans cette API
        dateInitiation: new Date(result.createdAt || Date.now()),
        dateTraitement: result.finishedAt ? new Date(result.finishedAt) : undefined,
        messageErreur: result.reason
      }
    } catch (error) {
      throw new Error(`Erreur vérification statut MTN: ${error}`)
    }
  }

  async obtenirSolde(): Promise<{ solde: number, devise: string }> {
    try {
      const token = await this.obtenirAccessToken()
      
      const response = await fetch(`${this.baseUrl}/collection/v1_0/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Environment': process.env.NODE_ENV === 'production' ? 'mtncivoireco' : 'sandbox',
          'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY!
        }
      })

      const result = await response.json()
      
      return {
        solde: parseFloat(result.availableBalance),
        devise: result.currency
      }
    } catch (error) {
      throw new Error(`Erreur récupération solde MTN: ${error}`)
    }
  }

  validerNumeroTelephone(numero: string): boolean {
    // Format MTN Mobile Money Côte d'Ivoire: +225XXXXXXXX ou 04XXXXXXXX ou 06XXXXXXXX
    const regex = /^(\+225|225)?(0[46])\d{8}$|^(0[46])\d{8}$/
    return regex.test(numero)
  }

  private normaliserNumeroTelephone(numero: string): string {
    // Normalise le numéro au format international sans le +
    return numero.replace(/[\s\-\+]/g, '').replace(/^0/, '225')
  }

  private mapperStatutMTN(statut: string): 'en_attente' | 'succes' | 'echec' | 'annule' {
    switch (statut?.toLowerCase()) {
      case 'successful':
      case 'success':
        return 'succes'
      case 'failed':
      case 'rejected':
        return 'echec'
      case 'cancelled':
        return 'annule'
      case 'pending':
      default:
        return 'en_attente'
    }
  }
}

/**
 * Implémentation Wave API
 */
export class WaveAPI implements FournisseurPaiementMobile {
  private apiKey: string
  private baseUrl: string

  constructor(config: { apiKey: string, baseUrl: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
  }

  async initierPaiement(demande: DemandePaiement): Promise<ResultatPaiement> {
    try {
      const payload = {
        amount: demande.montant,
        currency: demande.devise || 'XOF',
        error_url: `${process.env.NEXTAUTH_URL}/api/paiements/wave/error`,
        success_url: `${process.env.NEXTAUTH_URL}/api/paiements/wave/success`,
        customer_email: 'noreply@saas-rh-ci.com',
        customer_firstname: demande.nomDestinataire.split(' ')[0],
        customer_lastname: demande.nomDestinataire.split(' ').slice(1).join(' '),
        customer_phone: demande.numeroDestinataire
      }

      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        return {
          succes: true,
          referenceTransaction: result.id,
          statutTransaction: 'en_attente',
          dateTraitement: new Date(),
          metadata: {
            checkoutUrl: result.wave_launch_url,
            sessionId: result.id
          }
        }
      } else {
        return {
          succes: false,
          statutTransaction: 'echec',
          messageErreur: result.message || 'Erreur lors du paiement Wave',
          dateTraitement: new Date()
        }
      }
    } catch (error) {
      return {
        succes: false,
        statutTransaction: 'echec',
        messageErreur: `Erreur technique Wave: ${error}`,
        dateTraitement: new Date()
      }
    }
  }

  async verifierStatutTransaction(referenceTransaction: string): Promise<StatutTransactionMobile> {
    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions/${referenceTransaction}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      const result = await response.json()

      return {
        referenceTransaction,
        statut: this.mapperStatutWave(result.payment_status),
        montant: result.amount,
        frais: 0, // Wave ne facture pas de frais aux marchands
        dateInitiation: new Date(result.created_at),
        dateTraitement: result.completed_at ? new Date(result.completed_at) : undefined
      }
    } catch (error) {
      throw new Error(`Erreur vérification statut Wave: ${error}`)
    }
  }

  async obtenirSolde(): Promise<{ solde: number, devise: string }> {
    // Wave ne fournit pas d'API pour le solde marchand
    throw new Error('API solde non disponible pour Wave')
  }

  validerNumeroTelephone(numero: string): boolean {
    // Format Wave Côte d'Ivoire: +225XXXXXXXX
    const regex = /^(\+225|225)?\d{8,10}$/
    return regex.test(numero)
  }

  private mapperStatutWave(statut: string): 'en_attente' | 'succes' | 'echec' | 'annule' {
    switch (statut?.toLowerCase()) {
      case 'complete':
      case 'completed':
        return 'succes'
      case 'failed':
        return 'echec'
      case 'cancelled':
        return 'annule'
      default:
        return 'en_attente'
    }
  }
}

/**
 * Factory pour créer les fournisseurs de paiement
 */
export class FournisseurPaiementFactory {
  static creer(type: TypePaiementMobile): FournisseurPaiementMobile {
    switch (type) {
      case 'orange_money':
        return new OrangeMoneyAPI({
          apiKey: process.env.ORANGE_MONEY_API_KEY!,
          apiSecret: process.env.ORANGE_MONEY_API_SECRET!,
          baseUrl: process.env.ORANGE_MONEY_BASE_URL!
        })
      
      case 'wave':
        return new WaveAPI({
          apiKey: process.env.WAVE_API_KEY!,
          baseUrl: process.env.WAVE_BASE_URL!
        })
      
      case 'mtn_momo':
        return new MTNMobileMoneyAPI({
          apiKey: process.env.MTN_API_KEY!,
          apiSecret: process.env.MTN_API_SECRET!,
          baseUrl: process.env.MTN_BASE_URL!
        })
      
      default:
        throw new Error(`Fournisseur de paiement non supporté: ${type}`)
    }
  }
}

/**
 * Service principal de gestion des paiements mobiles
 */
export class ServicePaiementMobile {
  async traiterPaiementSalaire(
    employes: Array<{
      id: string
      nom: string
      prenom: string
      numeroTelephone: string
      operateur: TypePaiementMobile
      montantSalaire: number
    }>
  ): Promise<Array<{
    employeId: string
    succes: boolean
    referenceTransaction?: string
    erreur?: string
  }>> {
    const resultats = []

    for (const employe of employes) {
      try {
        const fournisseur = FournisseurPaiementFactory.creer(employe.operateur)
        
        if (!fournisseur.validerNumeroTelephone(employe.numeroTelephone)) {
          resultats.push({
            employeId: employe.id,
            succes: false,
            erreur: 'Numéro de téléphone invalide'
          })
          continue
        }

        const demande: DemandePaiement = {
          montant: employe.montantSalaire,
          devise: 'XOF',
          numeroDestinataire: employe.numeroTelephone,
          nomDestinataire: `${employe.prenom} ${employe.nom}`,
          motif: `Salaire ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
          referenceInterne: `SAL_${employe.id}_${Date.now()}`,
          operateur: employe.operateur
        }

        const resultat = await fournisseur.initierPaiement(demande)
        
        resultats.push({
          employeId: employe.id,
          succes: resultat.succes,
          referenceTransaction: resultat.referenceTransaction,
          erreur: resultat.messageErreur
        })

        // Délai entre les paiements pour éviter la surcharge des APIs
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        resultats.push({
          employeId: employe.id,
          succes: false,
          erreur: `Erreur technique: ${error}`
        })
      }
    }

    return resultats
  }

  async verifierStatutsTransactions(
    transactions: Array<{
      referenceTransaction: string
      operateur: TypePaiementMobile
    }>
  ): Promise<Array<StatutTransactionMobile>> {
    const resultats = []

    for (const transaction of transactions) {
      try {
        const fournisseur = FournisseurPaiementFactory.creer(transaction.operateur)
        const statut = await fournisseur.verifierStatutTransaction(transaction.referenceTransaction)
        resultats.push(statut)
      } catch (error) {
        console.error(`Erreur vérification transaction ${transaction.referenceTransaction}:`, error)
      }
    }

    return resultats
  }
}

/**
 * Utilitaires pour les paiements mobiles
 */
export const UtilitairesPaiementMobile = {
  /**
   * Détecte l'opérateur mobile à partir du numéro
   */
  detecterOperateur(numeroTelephone: string): TypePaiementMobile | null {
    const numero = numeroTelephone.replace(/[\s\-\+]/g, '')
    
    // Orange CI: 07XXXXXXXX ou 05XXXXXXXX
    if (/^(\+225|225)?(0[57])/.test(numero)) {
      return 'orange_money'
    }
    
    // MTN CI: 04XXXXXXXX ou 06XXXXXXXX
    if (/^(\+225|225)?(0[46])/.test(numero)) {
      return 'mtn_momo'
    }
    
    // Pour Wave, accepte tous les formats car c'est une app
    return 'wave'
  },

  /**
   * Calcule les frais de transaction par opérateur
   */
  calculerFraisTransaction(montant: number, operateur: TypePaiementMobile): number {
    switch (operateur) {
      case 'orange_money':
        // Frais Orange Money (à vérifier avec les tarifs actuels)
        if (montant <= 1000) return 0
        if (montant <= 2500) return 25
        if (montant <= 5000) return 50
        if (montant <= 10000) return 100
        return Math.max(200, montant * 0.02) // 2% avec minimum 200 CFA
        
      case 'wave':
        // Wave ne facture pas de frais aux marchands
        return 0
        
      case 'mtn_momo':
        // Frais MTN Mobile Money (tarifs à vérifier)
        if (montant <= 1000) return 0
        if (montant <= 2500) return 30
        if (montant <= 5000) return 60
        if (montant <= 10000) return 120
        return Math.max(250, montant * 0.025) // 2.5% avec minimum 250 CFA
        
      default:
        return 0
    }
  },

  /**
   * Valide si un montant est dans les limites de l'opérateur
   */
  validerLimitesMontant(montant: number, operateur: TypePaiementMobile): boolean {
    switch (operateur) {
      case 'orange_money':
        return montant >= 100 && montant <= 1000000 // 100 CFA à 1M CFA
      case 'wave':
        return montant >= 100 && montant <= 5000000 // 100 CFA à 5M CFA
      case 'mtn_momo':
        return montant >= 100 && montant <= 1000000
      default:
        return false
    }
  }
}