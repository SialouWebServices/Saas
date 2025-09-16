// Service de notifications pour la plateforme SaaS RH CI
// SMS, WhatsApp et Email pour les employés et entreprises

export type TypeNotification = 'SMS' | 'WHATSAPP' | 'EMAIL'
export type CanalNotification = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH'

export interface DestinataireNotification {
  nom: string
  prenom: string
  telephone?: string
  email?: string
  numeroWhatsApp?: string
}

export interface MessageNotification {
  sujet?: string
  contenu: string
  type: 'BULLETIN_PAIE' | 'RAPPEL_DOCUMENTS' | 'BIENVENUE' | 'ALERTE_SYSTEME' | 'PAIEMENT_SALAIRE'
  priorite: 'NORMALE' | 'HAUTE' | 'URGENTE'
  lienAction?: string
  pieceJointe?: {
    nom: string
    url: string
    typeMime: string
  }
}

export interface ParametresNotification {
  canaux: CanalNotification[]
  differee?: boolean
  dateEnvoi?: Date
  tentativesMax?: number
}

export interface ResultatNotification {
  succes: boolean
  canal: CanalNotification
  messageId?: string
  erreur?: string
  dateEnvoi: Date
  coutXOF?: number
}

/**
 * Service SMS via Orange SMS CI et MTN SMS
 */
export class ServiceSMS {
  private apiKeyOrange: string
  private apiKeyMTN: string
  private baseUrlOrange: string
  private baseUrlMTN: string

  constructor(config: {
    apiKeyOrange: string
    apiKeyMTN: string
    baseUrlOrange: string
    baseUrlMTN: string
  }) {
    this.apiKeyOrange = config.apiKeyOrange
    this.apiKeyMTN = config.apiKeyMTN
    this.baseUrlOrange = config.baseUrlOrange
    this.baseUrlMTN = config.baseUrlMTN
  }

  async envoyerSMS(
    destinataire: DestinataireNotification,
    message: MessageNotification
  ): Promise<ResultatNotification> {
    if (!destinataire.telephone) {
      return {
        succes: false,
        canal: 'SMS',
        erreur: 'Numéro de téléphone manquant',
        dateEnvoi: new Date()
      }
    }

    // Déterminer l'opérateur selon le préfixe
    const operateur = this.detecterOperateur(destinataire.telephone)
    
    try {
      if (operateur === 'ORANGE') {
        return await this.envoyerSMSOrange(destinataire, message)
      } else {
        return await this.envoyerSMSMTN(destinataire, message)
      }
    } catch (error) {
      return {
        succes: false,
        canal: 'SMS',
        erreur: `Erreur envoi SMS: ${error}`,
        dateEnvoi: new Date()
      }
    }
  }

  private async envoyerSMSOrange(
    destinataire: DestinataireNotification,
    message: MessageNotification
  ): Promise<ResultatNotification> {
    const payload = {
      outboundSMSMessageRequest: {
        address: [`tel:+${this.normaliserNumero(destinataire.telephone!)}`],
        senderAddress: 'tel:+2250000000', // Numéro expéditeur configuré
        outboundSMSTextMessage: {
          message: this.formaterMessageSMS(message, destinataire)
        },
        receiptRequest: {
          notifyURL: `${process.env.NEXTAUTH_URL}/api/webhooks/sms/orange`,
          callbackData: 'SMS_BULLETIN_PAIE'
        }
      }
    }

    const response = await fetch(`${this.baseUrlOrange}/smsmessaging/v1/outbound/tel%3A%2B2250000000/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeyOrange}`
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (response.ok) {
      return {
        succes: true,
        canal: 'SMS',
        messageId: result.outboundSMSMessageRequest.requestIdentifier,
        dateEnvoi: new Date(),
        coutXOF: 25 // Coût approximatif SMS Orange CI
      }
    } else {
      return {
        succes: false,
        canal: 'SMS',
        erreur: result.requestError?.serviceException?.text || 'Erreur Orange SMS',
        dateEnvoi: new Date()
      }
    }
  }

  private async envoyerSMSMTN(
    destinataire: DestinataireNotification,
    message: MessageNotification
  ): Promise<ResultatNotification> {
    const payload = {
      message: this.formaterMessageSMS(message, destinataire),
      recipients: [this.normaliserNumero(destinataire.telephone!)],
      sender: 'SaaS-RH-CI'
    }

    const response = await fetch(`${this.baseUrlMTN}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeyMTN}`
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (response.ok) {
      return {
        succes: true,
        canal: 'SMS',
        messageId: result.messageId,
        dateEnvoi: new Date(),
        coutXOF: 30 // Coût approximatif SMS MTN CI
      }
    } else {
      return {
        succes: false,
        canal: 'SMS',
        erreur: result.error || 'Erreur MTN SMS',
        dateEnvoi: new Date()
      }
    }
  }

  private detecterOperateur(numero: string): 'ORANGE' | 'MTN' {
    const numeroClean = numero.replace(/[^0-9]/g, '')
    // Orange: 07, 05 / MTN: 04, 06
    if (numeroClean.match(/^(225)?(0[57])/)) {
      return 'ORANGE'
    }
    return 'MTN'
  }

  private normaliserNumero(numero: string): string {
    return numero.replace(/[^0-9]/g, '').replace(/^0/, '225')
  }

  private formaterMessageSMS(message: MessageNotification, destinataire: DestinataireNotification): string {
    const prenom = destinataire.prenom
    
    switch (message.type) {
      case 'BULLETIN_PAIE':
        return `Bonjour ${prenom}, votre bulletin de paie est disponible. Consultez-le via: ${message.lienAction}`
      
      case 'PAIEMENT_SALAIRE':
        return `Bonjour ${prenom}, votre salaire a été traité. Vérifiez votre compte Mobile Money.`
      
      case 'RAPPEL_DOCUMENTS':
        return `Bonjour ${prenom}, merci de compléter vos documents manquants sur la plateforme RH.`
      
      case 'BIENVENUE':
        return `Bienvenue ${prenom} ! Votre compte RH est actif. Connectez-vous: ${message.lienAction}`
      
      default:
        return message.contenu
    }
  }
}

/**
 * Service WhatsApp Business via Twilio ou API directe
 */
export class ServiceWhatsApp {
  private apiKey: string
  private baseUrl: string
  private numeroExpéditeur: string

  constructor(config: { apiKey: string, baseUrl: string, numeroExpéditeur: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.numeroExpéditeur = config.numeroExpéditeur
  }

  async envoyerWhatsApp(
    destinataire: DestinataireNotification,
    message: MessageNotification
  ): Promise<ResultatNotification> {
    if (!destinataire.numeroWhatsApp) {
      return {
        succes: false,
        canal: 'WHATSAPP',
        erreur: 'Numéro WhatsApp manquant',
        dateEnvoi: new Date()
      }
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.normaliserNumeroWhatsApp(destinataire.numeroWhatsApp),
        type: 'template',
        template: {
          name: this.obtenirTemplateWhatsApp(message.type),
          language: { code: 'fr' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: destinataire.prenom },
                { type: 'text', text: message.contenu }
              ]
            }
          ]
        }
      }

      // Si lien d'action, ajouter un bouton
      if (message.lienAction) {
        payload.template.components.push({
          type: 'button',
          sub_type: 'url',
          parameters: [{ type: 'text', text: message.lienAction }]
        })
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
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
          canal: 'WHATSAPP',
          messageId: result.messages[0].id,
          dateEnvoi: new Date(),
          coutXOF: 15 // Coût approximatif WhatsApp Business
        }
      } else {
        return {
          succes: false,
          canal: 'WHATSAPP',
          erreur: result.error?.message || 'Erreur WhatsApp',
          dateEnvoi: new Date()
        }
      }

    } catch (error) {
      return {
        succes: false,
        canal: 'WHATSAPP',
        erreur: `Erreur technique WhatsApp: ${error}`,
        dateEnvoi: new Date()
      }
    }
  }

  private normaliserNumeroWhatsApp(numero: string): string {
    return numero.replace(/[^0-9]/g, '').replace(/^0/, '225')
  }

  private obtenirTemplateWhatsApp(type: string): string {
    // Templates pré-approuvés WhatsApp Business
    switch (type) {
      case 'BULLETIN_PAIE': return 'bulletin_paie_pret'
      case 'PAIEMENT_SALAIRE': return 'salaire_traite'
      case 'BIENVENUE': return 'bienvenue_employe'
      case 'RAPPEL_DOCUMENTS': return 'rappel_documents'
      default: return 'notification_generale'
    }
  }
}

/**
 * Service Email via SendGrid ou autre fournisseur
 */
export class ServiceEmail {
  private apiKey: string
  private emailExpéditeur: string
  private nomExpéditeur: string

  constructor(config: { apiKey: string, emailExpéditeur: string, nomExpéditeur: string }) {
    this.apiKey = config.apiKey
    this.emailExpéditeur = config.emailExpéditeur
    this.nomExpéditeur = config.nomExpéditeur
  }

  async envoyerEmail(
    destinataire: DestinataireNotification,
    message: MessageNotification
  ): Promise<ResultatNotification> {
    if (!destinataire.email) {
      return {
        succes: false,
        canal: 'EMAIL',
        erreur: 'Email manquant',
        dateEnvoi: new Date()
      }
    }

    try {
      const emailData = {
        personalizations: [{
          to: [{
            email: destinataire.email,
            name: `${destinataire.prenom} ${destinataire.nom}`
          }],
          subject: message.sujet || this.genererSujetEmail(message.type)
        }],
        from: {
          email: this.emailExpéditeur,
          name: this.nomExpéditeur
        },
        content: [{
          type: 'text/html',
          value: this.genererContenuHTML(message, destinataire)
        }]
      }

      // Ajouter pièce jointe si présente
      if (message.pieceJointe) {
        emailData.attachments = [{
          content: await this.obtenirContenuFichierBase64(message.pieceJointe.url),
          filename: message.pieceJointe.nom,
          type: message.pieceJointe.typeMime,
          disposition: 'attachment'
        }]
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(emailData)
      })

      if (response.ok) {
        return {
          succes: true,
          canal: 'EMAIL',
          messageId: response.headers.get('X-Message-Id') || undefined,
          dateEnvoi: new Date(),
          coutXOF: 5 // Coût approximatif email
        }
      } else {
        const error = await response.json()
        return {
          succes: false,
          canal: 'EMAIL',
          erreur: error.errors?.[0]?.message || 'Erreur envoi email',
          dateEnvoi: new Date()
        }
      }

    } catch (error) {
      return {
        succes: false,
        canal: 'EMAIL',
        erreur: `Erreur technique email: ${error}`,
        dateEnvoi: new Date()
      }
    }
  }

  private genererSujetEmail(type: string): string {
    switch (type) {
      case 'BULLETIN_PAIE': return 'Votre bulletin de paie est disponible'
      case 'PAIEMENT_SALAIRE': return 'Votre salaire a été traité'
      case 'BIENVENUE': return 'Bienvenue dans votre espace RH'
      case 'RAPPEL_DOCUMENTS': return 'Documents manquants - Action requise'
      default: return 'Notification de votre entreprise'
    }
  }

  private genererContenuHTML(message: MessageNotification, destinataire: DestinataireNotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>SaaS RH Côte d'Ivoire</h2>
        </div>
        <div class="content">
          <p>Bonjour ${destinataire.prenom},</p>
          <p>${message.contenu}</p>
          ${message.lienAction ? `<a href="${message.lienAction}" class="button">Accéder à la plateforme</a>` : ''}
        </div>
        <div class="footer">
          <p>SaaS RH CI - Plateforme de gestion RH pour PME ivoiriennes</p>
          <p>Abidjan, Côte d'Ivoire | support@saas-rh-ci.com</p>
        </div>
      </body>
      </html>
    `
  }

  private async obtenirContenuFichierBase64(url: string): Promise<string> {
    // Télécharger le fichier et le convertir en base64
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  }
}

/**
 * Service principal de notification multicanal
 */
export class ServiceNotificationMulticanal {
  private serviceSMS: ServiceSMS
  private serviceWhatsApp: ServiceWhatsApp
  private serviceEmail: ServiceEmail

  constructor() {
    this.serviceSMS = new ServiceSMS({
      apiKeyOrange: process.env.ORANGE_SMS_API_KEY!,
      apiKeyMTN: process.env.MTN_SMS_API_KEY!,
      baseUrlOrange: process.env.ORANGE_SMS_BASE_URL!,
      baseUrlMTN: process.env.MTN_SMS_BASE_URL!
    })

    this.serviceWhatsApp = new ServiceWhatsApp({
      apiKey: process.env.WHATSAPP_API_KEY!,
      baseUrl: process.env.WHATSAPP_BASE_URL!,
      numeroExpéditeur: process.env.WHATSAPP_NUMERO_EXPEDITEUR!
    })

    this.serviceEmail = new ServiceEmail({
      apiKey: process.env.SENDGRID_API_KEY!,
      emailExpéditeur: process.env.EMAIL_EXPEDITEUR!,
      nomExpéditeur: 'SaaS RH Côte d\'Ivoire'
    })
  }

  async envoyerNotification(
    destinataire: DestinataireNotification,
    message: MessageNotification,
    parametres: ParametresNotification
  ): Promise<ResultatNotification[]> {
    const resultats: ResultatNotification[] = []

    // Envoyer selon les canaux spécifiés
    for (const canal of parametres.canaux) {
      let resultat: ResultatNotification

      switch (canal) {
        case 'SMS':
          resultat = await this.serviceSMS.envoyerSMS(destinataire, message)
          break
        
        case 'WHATSAPP':
          resultat = await this.serviceWhatsApp.envoyerWhatsApp(destinataire, message)
          break
        
        case 'EMAIL':
          resultat = await this.serviceEmail.envoyerEmail(destinataire, message)
          break
        
        default:
          resultat = {
            succes: false,
            canal,
            erreur: 'Canal non supporté',
            dateEnvoi: new Date()
          }
      }

      resultats.push(resultat)

      // Délai entre envois pour éviter le spam
      if (parametres.canaux.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return resultats
  }

  async envoyerNotificationGroupee(
    destinataires: DestinataireNotification[],
    message: MessageNotification,
    parametres: ParametresNotification
  ): Promise<{ destinataire: DestinataireNotification, resultats: ResultatNotification[] }[]> {
    const resultatsGroupes = []

    for (const destinataire of destinataires) {
      const resultats = await this.envoyerNotification(destinataire, message, parametres)
      resultatsGroupes.push({ destinataire, resultats })

      // Délai entre destinataires
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    return resultatsGroupes
  }
}