import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import { ServicePaiementMobile } from '@/lib/paiement-mobile'

const prisma = new PrismaClient()

const PaymentSchema = z.object({
  bulletinIds: z.array(z.string()),
  modePaiement: z.enum(['MOBILE_MONEY']),
  confirmerPaiement: z.boolean().default(false)
})

// POST - Traiter les paiements via Mobile Money
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { bulletinIds, modePaiement, confirmerPaiement } = PaymentSchema.parse(body)

    // Récupérer les bulletins avec les infos employés
    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        id: { in: bulletinIds },
        employe: {
          entrepriseId: auth.user.entrepriseId
        },
        statutPaiement: 'EN_ATTENTE'
      },
      include: {
        employe: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            numeroMobileMoney: true,
            operateurMobileMoney: true
          }
        }
      }
    })

    if (bulletins.length === 0) {
      return NextResponse.json(
        { erreur: 'Aucun bulletin éligible pour le paiement' },
        { status: 400 }
      )
    }

    // Vérifier que tous les employés ont un numéro Mobile Money
    const employesSansNumero = bulletins.filter(
      b => !b.employe.numeroMobileMoney || !b.employe.operateurMobileMoney
    )

    if (employesSansNumero.length > 0) {
      return NextResponse.json({
        erreur: 'Certains employés n\'ont pas de numéro Mobile Money configuré',
        employesSansNumero: employesSansNumero.map(b => ({
          employeId: b.employe.id,
          nom: `${b.employe.prenom} ${b.employe.nom}`
        }))
      }, { status: 400 })
    }

    // Calculer le montant total
    const montantTotal = bulletins.reduce((total, b) => total + b.salaireNet, 0)

    if (!confirmerPaiement) {
      // Mode prévisualisation - retourner les détails sans traiter
      return NextResponse.json({
        previsualisation: true,
        nombreEmployes: bulletins.length,
        montantTotal,
        fraisEstimes: 0, // À calculer selon les opérateurs
        bulletins: bulletins.map(b => ({
          bulletinId: b.id,
          employe: `${b.employe.prenom} ${b.employe.nom}`,
          montant: b.salaireNet,
          operateur: b.employe.operateurMobileMoney
        }))
      })
    }

    // Traitement effectif des paiements
    const servicePaiement = new ServicePaiementMobile()
    
    const employesPourPaiement = bulletins.map(b => ({
      id: b.employe.id,
      nom: b.employe.nom,
      prenom: b.employe.prenom,
      numeroTelephone: b.employe.numeroMobileMoney!,
      operateur: b.employe.operateurMobileMoney! as any,
      montantSalaire: b.salaireNet
    }))

    const resultats = await servicePaiement.traiterPaiementSalaire(employesPourPaiement)

    // Mettre à jour les statuts des bulletins
    const misesAJour = []
    const erreurs = []

    for (let i = 0; i < bulletins.length; i++) {
      const bulletin = bulletins[i]
      const resultat = resultats[i]

      try {
        const statutPaiement = resultat.succes ? 'EN_COURS' : 'ECHEC'
        
        await prisma.bulletinPaie.update({
          where: { id: bulletin.id },
          data: {
            statutPaiement,
            datePaiement: resultat.succes ? new Date() : null,
            referenceTransaction: resultat.referenceTransaction
          }
        })

        misesAJour.push({
          bulletinId: bulletin.id,
          employeNom: `${bulletin.employe.prenom} ${bulletin.employe.nom}`,
          statut: statutPaiement,
          referenceTransaction: resultat.referenceTransaction
        })

      } catch (error) {
        erreurs.push({
          bulletinId: bulletin.id,
          employeNom: `${bulletin.employe.prenom} ${bulletin.employe.nom}`,
          erreur: error instanceof Error ? error.message : 'Erreur mise à jour'
        })
      }
    }

    return NextResponse.json({
      message: `Traitement terminé: ${misesAJour.length} paiements initiés, ${erreurs.length} erreurs`,
      paiementsInitiés: misesAJour.length,
      erreurs: erreurs.length,
      montantTotal,
      details: {
        succès: misesAJour,
        erreurs
      }
    })

  } catch (error) {
    console.error('Erreur traitement paiements:', error)
    
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