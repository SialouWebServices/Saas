import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import { calculerPaieEmploye } from '@/lib/calcul-paie'

const prisma = new PrismaClient()

const GeneratePayrollSchema = z.object({
  mois: z.number().min(1).max(12),
  annee: z.number().min(2020).max(2030),
  employeIds: z.array(z.string()).optional(), // Si vide, génère pour tous les employés actifs
  options: z.object({
    inclurePrimes: z.boolean().default(true),
    inclureHeuresSupplementaires: z.boolean().default(true),
    appliquerRetenues: z.boolean().default(true)
  }).optional()
})

const PaymentSchema = z.object({
  bulletinIds: z.array(z.string()),
  modePaiement: z.enum(['VIREMENT', 'MOBILE_MONEY', 'CHEQUE']),
  datePaiement: z.string().transform(str => new Date(str))
})

// GET - Récupérer les bulletins de paie
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mois = searchParams.get('mois')
    const annee = searchParams.get('annee')
    const employeId = searchParams.get('employeId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      employe: {
        entrepriseId: auth.user.entrepriseId
      }
    }

    if (mois) {
      where.mois = parseInt(mois)
    }

    if (annee) {
      where.annee = parseInt(annee)
    }

    if (employeId) {
      where.employeId = employeId
    }

    const [bulletins, total] = await Promise.all([
      prisma.bulletinPaie.findMany({
        where,
        include: {
          employe: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              matricule: true,
              poste: true,
              departement: true
            }
          }
        },
        orderBy: [
          { annee: 'desc' },
          { mois: 'desc' },
          { dateCreation: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.bulletinPaie.count({ where })
    ])

    // Calculer les statistiques
    const stats = await prisma.bulletinPaie.aggregate({
      where,
      _sum: {
        salaireBrut: true,
        salaireNet: true,
        cotisationsCNPS: true,
        impotSurSalaire: true
      },
      _count: true
    })

    return NextResponse.json({
      bulletins,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      statistiques: {
        totalBulletins: stats._count,
        totalSalaireBrut: stats._sum.salaireBrut || 0,
        totalSalaireNet: stats._sum.salaireNet || 0,
        totalCotisationsCNPS: stats._sum.cotisationsCNPS || 0,
        totalImpotSurSalaire: stats._sum.impotSurSalaire || 0
      }
    })

  } catch (error) {
    console.error('Erreur récupération bulletins:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Générer les bulletins de paie
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const { mois, annee, employeIds, options } = GeneratePayrollSchema.parse(body)

    // Vérifier si les bulletins existent déjà pour ce mois
    const bulletinsExistants = await prisma.bulletinPaie.findMany({
      where: {
        mois,
        annee,
        employe: {
          entrepriseId: auth.user.entrepriseId,
          id: employeIds ? { in: employeIds } : undefined
        }
      }
    })

    if (bulletinsExistants.length > 0) {
      return NextResponse.json(
        { 
          erreur: 'Des bulletins existent déjà pour cette période',
          bulletinsExistants: bulletinsExistants.map(b => ({
            employeId: b.employeId,
            nom: b.employe?.nom || 'Inconnu'
          }))
        },
        { status: 409 }
      )
    }

    // Récupérer les employés à traiter
    const employes = await prisma.employe.findMany({
      where: {
        entrepriseId: auth.user.entrepriseId,
        statut: 'ACTIF',
        id: employeIds ? { in: employeIds } : undefined
      }
    })

    if (employes.length === 0) {
      return NextResponse.json(
        { erreur: 'Aucun employé actif trouvé' },
        { status: 400 }
      )
    }

    // Générer les bulletins
    const bulletinsGeneres = []
    const erreurs = []

    for (const employe of employes) {
      try {
        // Calculer la paie
        const calculPaie = calculerPaieEmploye({
          salaireBrut: employe.salaireBrut,
          nombreEnfants: employe.nombreEnfants,
          heuresSupplementaires: 0, // À implémenter selon les données
          primes: 0, // À implémenter selon les données
          avances: 0, // À implémenter selon les données
          retenues: 0 // À implémenter selon les données
        })

        // Créer le bulletin
        const bulletin = await prisma.bulletinPaie.create({
          data: {
            employeId: employe.id,
            mois,
            annee,
            salaireBrut: employe.salaireBrut,
            salaireNet: calculPaie.salaireNet,
            cotisationsCNPS: calculPaie.cotisationsCNPS.total,
            impotSurSalaire: calculPaie.impotSurSalaire,
            heuresNormales: 173.33, // 40h/semaine * 52 semaines / 12 mois
            heuresSupplementaires: 0,
            primes: 0,
            avances: 0,
            retenues: 0,
            statutPaiement: 'EN_ATTENTE',
            dateCreation: new Date(),
            detailsCalcul: calculPaie
          },
          include: {
            employe: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                matricule: true,
                poste: true
              }
            }
          }
        })

        bulletinsGeneres.push(bulletin)

      } catch (error) {
        erreurs.push({
          employeId: employe.id,
          nom: `${employe.prenom} ${employe.nom}`,
          erreur: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }

    return NextResponse.json({
      message: `${bulletinsGeneres.length} bulletins générés avec succès`,
      bulletinsGeneres: bulletinsGeneres.length,
      erreurs: erreurs.length,
      bulletins: bulletinsGeneres,
      detailsErreurs: erreurs
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur génération bulletins:', error)
    
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