import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import { FournisseurPaiementFactory } from '@/lib/paiement-mobile'

const prisma = new PrismaClient()

const ValidatePaymentsSchema = z.object({
  bulletinIds: z.array(z.string()).min(1, 'Au moins un bulletin requis'),
  confirmerValidation: z.boolean().default(false),
  notifierEmployes: z.boolean().default(true)
})

// POST - Valider les virements de salaires
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const data = ValidatePaymentsSchema.parse(body)

    // Récupérer les bulletins à valider
    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        id: { in: data.bulletinIds },
        entrepriseId: auth.user!.entrepriseId,
        statut: 'VALIDE' // Seuls les bulletins validés peuvent être payés
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            modePaiement: true,
            numeroMobileMoney: true,
            operateurMobileMoney: true,
            numeroCompteBancaire: true
          }
        }
      }
    })

    if (bulletins.length === 0) {
      return NextResponse.json(
        { erreur: 'Aucun bulletin éligible trouvé' },
        { status: 400 }
      )
    }

    // Séparer les paiements par méthode
    const paiementsMobileMoney = bulletins.filter(b => 
      b.employe.modePaiement === 'MOBILE_MONEY' && 
      b.employe.numeroMobileMoney && 
      b.employe.operateurMobileMoney
    )

    const virementsbancaires = bulletins.filter(b => 
      b.employe.modePaiement === 'VIREMENT' && 
      b.employe.numeroCompteBancaire
    )

    const paiementsEspeces = bulletins.filter(b => 
      b.employe.modePaiement === 'ESPECES'
    )

    const paiementsCheque = bulletins.filter(b => 
      b.employe.modePaiement === 'CHEQUE'
    )

    // Calculs des totaux
    const montantTotal = bulletins.reduce((sum, b) => sum + Number(b.salaireNet), 0)
    const montantMobileMoney = paiementsMobileMoney.reduce((sum, b) => sum + Number(b.salaireNet), 0)
    const montantVirements = virementsbancaires.reduce((sum, b) => sum + Number(b.salaireNet), 0)

    // Validation préliminaire
    const validationResults = {
      totalBulletins: bulletins.length,
      montantTotal,
      repartition: {
        mobileMoney: {
          nombre: paiementsMobileMoney.length,
          montant: montantMobileMoney,
          details: paiementsMobileMoney.map(b => ({
            employeId: b.employe.id,
            nom: `${b.employe.prenom} ${b.employe.nom}`,
            montant: Number(b.salaireNet),
            operateur: b.employe.operateurMobileMoney,
            numero: b.employe.numeroMobileMoney
          }))
        },
        virements: {
          nombre: virementsbancaires.length,
          montant: montantVirements,
          details: virementsbancaires.map(b => ({
            employeId: b.employe.id,
            nom: `${b.employe.prenom} ${b.employe.nom}`,
            montant: Number(b.salaireNet),
            compte: b.employe.numeroCompteBancaire
          }))
        },
        especes: {
          nombre: paiementsEspeces.length,
          montant: paiementsEspeces.reduce((sum, b) => sum + Number(b.salaireNet), 0)
        },
        cheques: {
          nombre: paiementsCheque.length,
          montant: paiementsCheque.reduce((sum, b) => sum + Number(b.salaireNet), 0)
        }
      },
      validationErrors: [] as string[]
    }

    // Vérifications de validation
    const employesSansMethodePaiement = bulletins.filter(b => {
      const employe = b.employe
      if (employe.modePaiement === 'MOBILE_MONEY') {
        return !employe.numeroMobileMoney || !employe.operateurMobileMoney
      }
      if (employe.modePaiement === 'VIREMENT') {
        return !employe.numeroCompteBancaire
      }
      return false
    })

    if (employesSansMethodePaiement.length > 0) {
      validationResults.validationErrors.push(
        `${employesSansMethodePaiement.length} employé(s) sans méthode de paiement configurée`
      )
    }

    // Vérifier les numéros Mobile Money
    for (const bulletin of paiementsMobileMoney) {
      const employe = bulletin.employe
      try {
        const fournisseur = FournisseurPaiementFactory.creer(
          employe.operateurMobileMoney as 'orange_money' | 'wave' | 'mtn_momo'
        )
        
        if (!fournisseur.validerNumeroTelephone(employe.numeroMobileMoney!)) {
          validationResults.validationErrors.push(
            `Numéro Mobile Money invalide pour ${employe.prenom} ${employe.nom}`
          )
        }
      } catch (error) {
        validationResults.validationErrors.push(
          `Opérateur Mobile Money non supporté: ${employe.operateurMobileMoney}`
        )
      }
    }

    // Mode preview - retourner validation sans traiter
    if (!data.confirmerValidation) {
      return NextResponse.json({
        preview: true,
        validation: validationResults,
        peutValider: validationResults.validationErrors.length === 0
      })
    }

    // Mode validation - traiter les paiements
    if (validationResults.validationErrors.length > 0) {
      return NextResponse.json({
        erreur: 'Validation échouée',
        details: validationResults.validationErrors
      }, { status: 400 })
    }

    const resultatsTraitement = {
      mobileMoneySuccess: 0,
      mobileMoneyErrors: [] as any[],
      virementsTraites: virementsbancaires.length,
      especesTraites: paiementsEspeces.length,
      chequesTraites: paiementsCheque.length,
      montantTotalTraite: 0
    }

    // Traiter les paiements Mobile Money
    for (const bulletin of paiementsMobileMoney) {
      try {
        const employe = bulletin.employe
        const fournisseur = FournisseurPaiementFactory.creer(
          employe.operateurMobileMoney as 'orange_money' | 'wave' | 'mtn_momo'
        )

        const resultatPaiement = await fournisseur.initierPaiement({
          montant: Number(bulletin.salaireNet),
          devise: 'XOF',
          numeroDestinataire: employe.numeroMobileMoney!,
          nomDestinataire: `${employe.prenom} ${employe.nom}`,
          motif: `Salaire ${bulletin.periode}`,
          referenceInterne: `SAL-${bulletin.id}`
        })

        if (resultatPaiement.succes) {
          resultatsTraitement.mobileMoneySuccess++
          resultatsTraitement.montantTotalTraite += Number(bulletin.salaireNet)
          
          // Marquer comme envoyé
          await prisma.bulletinPaie.update({
            where: { id: bulletin.id },
            data: { 
              statut: 'ENVOYE',
              dateEnvoi: new Date()
            }
          })
        } else {
          resultatsTraitement.mobileMoneyErrors.push({
            employe: `${employe.prenom} ${employe.nom}`,
            erreur: resultatPaiement.messageErreur
          })
        }

      } catch (error) {
        resultatsTraitement.mobileMoneyErrors.push({
          employe: `${bulletin.employe.prenom} ${bulletin.employe.nom}`,
          erreur: `Erreur technique: ${error}`
        })
      }
    }

    // Marquer les autres paiements comme traités
    const autresPaiements = [...virementsbancaires, ...paiementsEspeces, ...paiementsCheque]
    if (autresPaiements.length > 0) {
      await prisma.bulletinPaie.updateMany({
        where: {
          id: { in: autresPaiements.map(b => b.id) }
        },
        data: {
          statut: 'ENVOYE',
          dateEnvoi: new Date()
        }
      })
      
      resultatsTraitement.montantTotalTraite += autresPaiements.reduce(
        (sum, b) => sum + Number(b.salaireNet), 0
      )
    }

    // Envoyer notifications si demandé
    if (data.notifierEmployes) {
      // TODO: Implémenter envoi notifications (SMS/Email)
      console.log('Envoi notifications aux employés...')
    }

    return NextResponse.json({
      succes: true,
      message: 'Validation des virements terminée',
      resultats: {
        ...resultatsTraitement,
        totalTraite: bulletins.length,
        montantTotal: resultatsTraitement.montantTotalTraite,
        tauxSucces: ((resultatsTraitement.mobileMoneySuccess + resultatsTraitement.virementsTraites + 
                     resultatsTraitement.especesTraites + resultatsTraitement.chequesTraites) / 
                     bulletins.length * 100).toFixed(1)
      }
    })

  } catch (error) {
    console.error('Erreur validation virements:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { erreur: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}