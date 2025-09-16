import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import { calculerCotisationsCNPS } from '@/lib/utils'

const prisma = new PrismaClient()

const CreateDeclarationSchema = z.object({
  mois: z.number().min(1).max(12),
  annee: z.number().min(2020).max(2030),
  employes: z.array(z.object({
    employeId: z.string(),
    inclure: z.boolean().default(true)
  })).optional()
})

// GET - Récupérer toutes les déclarations CNPS
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const annee = searchParams.get('annee')

    const where: any = {
      entrepriseId: auth.user!.entrepriseId
    }

    if (annee) {
      where.annee = parseInt(annee)
    }

    const [declarations, total] = await Promise.all([
      prisma.declarationCNPS.findMany({
        where,
        orderBy: { dateGeneration: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          entreprise: {
            select: { nom: true, numeroCNPS: true }
          }
        }
      }),
      prisma.declarationCNPS.count({ where })
    ])

    return NextResponse.json({
      declarations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur récupération déclarations CNPS:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Créer une nouvelle déclaration CNPS
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateDeclarationSchema.parse(body)

    // Vérifier si déclaration existe déjà pour cette période
    const declarationExistante = await prisma.declarationCNPS.findUnique({
      where: {
        entrepriseId_mois_annee: {
          entrepriseId: auth.user!.entrepriseId,
          mois: data.mois,
          annee: data.annee
        }
      }
    })

    if (declarationExistante) {
      return NextResponse.json(
        { erreur: 'Une déclaration existe déjà pour cette période' },
        { status: 409 }
      )
    }

    // Récupérer les bulletins de paie validés pour la période
    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        entrepriseId: auth.user!.entrepriseId,
        mois: data.mois,
        annee: data.annee,
        statut: 'VALIDE',
        ...(data.employes && {
          employeId: {
            in: data.employes.filter(e => e.inclure).map(e => e.employeId)
          }
        })
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            numeroCNPS: true,
            salaireBrut: true
          }
        }
      }
    })

    if (bulletins.length === 0) {
      return NextResponse.json(
        { erreur: 'Aucun bulletin de paie validé trouvé pour cette période' },
        { status: 400 }
      )
    }

    // Calculer les totaux
    const nombreEmployes = bulletins.length
    const masseSalariale = bulletins.reduce((total, b) => total + Number(b.salaireBrut), 0)
    const totalCotisationsEmploye = bulletins.reduce((total, b) => total + Number(b.cotisationCNPSEmploye), 0)
    const totalCotisationsEmployeur = bulletins.reduce((total, b) => total + Number(b.cotisationCNPSEmployeur), 0)
    const totalCotisations = totalCotisationsEmploye + totalCotisationsEmployeur

    // Créer la déclaration
    const declaration = await prisma.declarationCNPS.create({
      data: {
        mois: data.mois,
        annee: data.annee,
        periode: `${getMonthName(data.mois)} ${data.annee}`,
        nombreEmployes,
        masseSalariale,
        totalCotisationsEmploye,
        totalCotisationsEmployeur,
        totalCotisations,
        statut: 'BROUILLON',
        entrepriseId: auth.user!.entrepriseId
      },
      include: {
        entreprise: {
          select: { nom: true, numeroCNPS: true }
        }
      }
    })

    return NextResponse.json({
      declaration,
      employes: bulletins.map(b => ({
        employeId: b.employe.id,
        nom: b.employe.nom,
        prenom: b.employe.prenom,
        numeroCNPS: b.employe.numeroCNPS,
        salaireBase: Number(b.salaireBrut),
        cotisationEmploye: Number(b.cotisationCNPSEmploye),
        cotisationEmployeur: Number(b.cotisationCNPSEmployeur)
      })),
      message: 'Déclaration CNPS créée avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur création déclaration CNPS:', error)
    
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