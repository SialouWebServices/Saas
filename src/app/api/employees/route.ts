import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'

const prisma = new PrismaClient()

const CreateEmployeeSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide').optional(),
  telephone: z.string().min(8, 'Téléphone requis'),
  adresse: z.string().min(5, 'Adresse requise'),
  dateNaissance: z.string().transform(str => new Date(str)),
  lieuNaissance: z.string().min(2, 'Lieu de naissance requis'),
  nationalite: z.string().default('Ivoirienne'),
  genre: z.enum(['MASCULIN', 'FEMININ']),
  situationMatrimoniale: z.enum(['CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF']),
  nombreEnfants: z.number().min(0).default(0),
  numeroSecuriteSociale: z.string().optional(),
  numeroCNPS: z.string().optional(),
  poste: z.string().min(2, 'Poste requis'),
  departement: z.string().min(2, 'Département requis'),
  typeContrat: z.enum(['CDI', 'CDD', 'STAGE', 'CONSULTANT']),
  dateEmbauche: z.string().transform(str => new Date(str)),
  dateFinContrat: z.string().transform(str => new Date(str)).optional(),
  salaireBrut: z.number().min(0, 'Salaire requis'),
  devise: z.string().default('XOF'),
  modePaiement: z.enum(['VIREMENT', 'CHEQUE', 'ESPECES', 'MOBILE_MONEY']),
  numeroCompteBancaire: z.string().optional(),
  numeroMobileMoney: z.string().optional(),
  operateurMobileMoney: z.enum(['ORANGE_MONEY', 'WAVE', 'MTN_MOMO']).optional(),
  statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).default('ACTIF')
})

const UpdateEmployeeSchema = CreateEmployeeSchema.partial()

// GET - Récupérer tous les employés
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const statut = searchParams.get('statut') || ''
    const departement = searchParams.get('departement') || ''

    const where: any = {
      entrepriseId: auth.user!.entrepriseId
    }

    if (search) {
      where.OR = [
        { prenom: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { poste: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (statut) {
      where.statut = statut
    }

    if (departement) {
      where.departement = departement
    }

    const [employes, total] = await Promise.all([
      prisma.employe.findMany({
        where,
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          telephone: true,
          poste: true,
          departement: true,
          typeContrat: true,
          dateEmbauche: true,
          salaireBrut: true,
          statut: true,
          photoUrl: true
        },
        orderBy: { dateCreation: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.employe.count({ where })
    ])

    return NextResponse.json({
      employes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur récupération employés:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Créer un nouvel employé
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const data = CreateEmployeeSchema.parse(body)

    // Vérifier si l'email existe déjà
    if (data.email) {
      const employeExistant = await prisma.employe.findFirst({
        where: {
          email: data.email,
          entrepriseId: auth.user!.entrepriseId
        }
      })

      if (employeExistant) {
        return NextResponse.json(
          { erreur: 'Un employé avec cet email existe déjà' },
          { status: 409 }
        )
      }
    }

    // Générer matricule unique
    const dernierEmploye = await prisma.employe.findFirst({
      where: { entrepriseId: auth.user!.entrepriseId },
      orderBy: { dateCreation: 'desc' }
    })

    const prochainNumero = dernierEmploye ? 
      parseInt(dernierEmploye.matricule.split('-')[1]) + 1 : 1
    const matricule = `EMP-${prochainNumero.toString().padStart(4, '0')}`

    // Créer l'employé
    const employe = await prisma.employe.create({
      data: {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        adresse: data.adresse,
        dateNaissance: data.dateNaissance,
        lieuNaissance: data.lieuNaissance,
        nationalite: data.nationalite,
        genre: data.genre,
        situationMatrimoniale: data.situationMatrimoniale,
        nombreEnfants: data.nombreEnfants,
        numeroSecuriteSociale: data.numeroSecuriteSociale,
        numeroCNPS: data.numeroCNPS,
        poste: data.poste,
        departement: data.departement,
        typeContrat: data.typeContrat,
        dateEmbauche: data.dateEmbauche,
        dateFinContrat: data.dateFinContrat,
        salaireBrut: data.salaireBrut,
        devise: data.devise,
        modePaiement: data.modePaiement,
        numeroCompteBancaire: data.numeroCompteBancaire,
        numeroMobileMoney: data.numeroMobileMoney,
        operateurMobileMoney: data.operateurMobileMoney,
        statut: data.statut,
        matricule,
        entrepriseId: auth.user!.entrepriseId
      }
    })

    return NextResponse.json({
      employe,
      message: 'Employé créé avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur création employé:', error)
    
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