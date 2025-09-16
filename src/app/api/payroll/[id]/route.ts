import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import { ServicePaiementMobile } from '@/lib/paiement-mobile'

const prisma = new PrismaClient()

// GET - Récupérer un bulletin spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const bulletin = await prisma.bulletinPaie.findFirst({
      where: {
        id: params.id,
        employe: {
          entrepriseId: auth.user.entrepriseId
        }
      },
      include: {
        employe: {
          select: {
            id: true,
            matricule: true,
            prenom: true,
            nom: true,
            poste: true,
            departement: true,
            dateEmbauche: true,
            numeroSecuriteSociale: true,
            numeroCNPS: true,
            numeroMobileMoney: true,
            operateurMobileMoney: true
          }
        }
      }
    })

    if (!bulletin) {
      return NextResponse.json(
        { erreur: 'Bulletin de paie non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ bulletin })

  } catch (error) {
    console.error('Erreur récupération bulletin:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mettre à jour le statut de paiement
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { statutPaiement, datePaiement, referenceTransaction } = await request.json()

    const bulletin = await prisma.bulletinPaie.findFirst({
      where: {
        id: params.id,
        employe: {
          entrepriseId: auth.user.entrepriseId
        }
      }
    })

    if (!bulletin) {
      return NextResponse.json(
        { erreur: 'Bulletin de paie non trouvé' },
        { status: 404 }
      )
    }

    const bulletinMisAJour = await prisma.bulletinPaie.update({
      where: { id: params.id },
      data: {
        statutPaiement,
        datePaiement: datePaiement ? new Date(datePaiement) : null,
        referenceTransaction
      }
    })

    return NextResponse.json({
      bulletin: bulletinMisAJour,
      message: 'Statut de paiement mis à jour'
    })

  } catch (error) {
    console.error('Erreur mise à jour bulletin:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}