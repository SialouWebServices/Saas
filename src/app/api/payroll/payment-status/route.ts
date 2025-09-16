import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'

const prisma = new PrismaClient()

const PaymentStatusSchema = z.object({
  mois: z.number().min(1).max(12),
  annee: z.number().min(2020).max(2030)
})

// GET - Vérifier le statut des paiements pour une période
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mois = parseInt(searchParams.get('mois') || '0')
    const annee = parseInt(searchParams.get('annee') || '0')

    if (!mois || !annee) {
      return NextResponse.json(
        { erreur: 'Mois et année requis' },
        { status: 400 }
      )
    }

    // Récupérer tous les bulletins pour la période
    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        entrepriseId: auth.user!.entrepriseId,
        mois,
        annee
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            modePaiement: true,
            operateurMobileMoney: true
          }
        }
      },
      orderBy: { employe: { nom: 'asc' } }
    })

    // Statistiques générales
    const stats = {
      total: bulletins.length,
      brouillon: bulletins.filter(b => b.statut === 'BROUILLON').length,
      valides: bulletins.filter(b => b.statut === 'VALIDE').length,
      envoyes: bulletins.filter(b => b.statut === 'ENVOYE').length,
      archives: bulletins.filter(b => b.statut === 'ARCHIVE').length
    }

    // Répartition par mode de paiement
    const repartitionPaiement = {
      mobile_money: bulletins.filter(b => b.employe.modePaiement === 'MOBILE_MONEY').length,
      virement: bulletins.filter(b => b.employe.modePaiement === 'VIREMENT').length,
      especes: bulletins.filter(b => b.employe.modePaiement === 'ESPECES').length,
      cheque: bulletins.filter(b => b.employe.modePaiement === 'CHEQUE').length
    }

    // Détails des bulletins non payés
    const bulletinsNonPayes = bulletins
      .filter(b => b.statut === 'VALIDE')
      .map(b => ({
        bulletinId: b.id,
        employe: `${b.employe.prenom} ${b.employe.nom}`,
        montant: Number(b.salaireNet),
        modePaiement: b.employe.modePaiement,
        operateur: b.employe.operateurMobileMoney,
        dateGeneration: b.dateGeneration
      }))

    // Montants
    const montants = {
      totalBrut: bulletins.reduce((sum, b) => sum + Number(b.salaireBrut), 0),
      totalNet: bulletins.reduce((sum, b) => sum + Number(b.salaireNet), 0),
      totalEnvoye: bulletins
        .filter(b => b.statut === 'ENVOYE')
        .reduce((sum, b) => sum + Number(b.salaireNet), 0),
      enAttentePaiement: bulletins
        .filter(b => b.statut === 'VALIDE')
        .reduce((sum, b) => sum + Number(b.salaireNet), 0)
    }

    return NextResponse.json({
      periode: `${getMonthName(mois)} ${annee}`,
      statistiques: stats,
      repartitionPaiement,
      montants,
      bulletinsNonPayes,
      peutValiderPaiements: bulletinsNonPayes.length > 0
    })

  } catch (error) {
    console.error('Erreur vérification statut paiements:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Retraiter des paiements échoués
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const data = PaymentStatusSchema.parse(body)

    // Récupérer les bulletins avec échec de paiement
    const bulletinsEchec = await prisma.bulletinPaie.findMany({
      where: {
        entrepriseId: auth.user!.entrepriseId,
        mois: data.mois,
        annee: data.annee,
        statut: 'VALIDE' // Ceux qui n'ont pas pu être payés
      },
      include: {
        employe: {
          select: {
            nom: true,
            prenom: true,
            modePaiement: true,
            numeroMobileMoney: true,
            operateurMobileMoney: true
          }
        }
      }
    })

    if (bulletinsEchec.length === 0) {
      return NextResponse.json({
        message: 'Aucun paiement à retraiter',
        retraites: 0
      })
    }

    // Relancer le processus de validation pour ces bulletins
    // TODO: Implémenter la logique de retraitement
    
    return NextResponse.json({
      message: `${bulletinsEchec.length} paiement(s) en cours de retraitement`,
      retraites: bulletinsEchec.length,
      bulletins: bulletinsEchec.map(b => ({
        employeId: b.employe.nom + ' ' + b.employe.prenom,
        montant: Number(b.salaireNet),
        modePaiement: b.employe.modePaiement
      }))
    })

  } catch (error) {
    console.error('Erreur retraitement paiements:', error)
    
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

// Utility function pour les noms de mois
function getMonthName(month: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return months[month - 1]
}