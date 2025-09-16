import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'

const prisma = new PrismaClient()

const UpdateEmployeeSchema = z.object({
  prenom: z.string().min(2).optional(),
  nom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telephone: z.string().min(8).optional(),
  adresse: z.string().min(5).optional(),
  dateNaissance: z.string().transform(str => new Date(str)).optional(),
  lieuNaissance: z.string().min(2).optional(),
  nationalite: z.string().optional(),
  genre: z.enum(['MASCULIN', 'FEMININ']).optional(),
  situationMatrimoniale: z.enum(['CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF']).optional(),
  nombreEnfants: z.number().min(0).optional(),
  numeroSecuriteSociale: z.string().optional(),
  numeroCNPS: z.string().optional(),
  poste: z.string().min(2).optional(),
  departement: z.string().min(2).optional(),
  typeContrat: z.enum(['CDI', 'CDD', 'STAGE', 'CONSULTANT']).optional(),
  dateEmbauche: z.string().transform(str => new Date(str)).optional(),
  dateFinContrat: z.string().transform(str => new Date(str)).optional(),
  salaireBrut: z.number().min(0).optional(),
  devise: z.string().optional(),
  modePaiement: z.enum(['VIREMENT', 'CHEQUE', 'ESPECES', 'MOBILE_MONEY']).optional(),
  numeroCompteBancaire: z.string().optional(),
  numeroMobileMoney: z.string().optional(),
  operateurMobileMoney: z.enum(['ORANGE_MONEY', 'WAVE', 'MTN_MOMO']).optional(),
  statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional()
})

// GET - Récupérer un employé par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const employe = await prisma.employe.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user.entrepriseId
      },
      include: {
        bulletinsPaie: {
          select: {
            id: true,
            mois: true,
            annee: true,
            salaireBrut: true,
            salaireNet: true,
            datePaiement: true
          },
          orderBy: { dateCreation: 'desc' },
          take: 5
        },
        historiqueEmploye: {
          select: {
            id: true,
            typeModification: true,
            description: true,
            dateModification: true
          },
          orderBy: { dateModification: 'desc' },
          take: 10
        }
      }
    })

    if (!employe) {
      return NextResponse.json(
        { erreur: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ employe })

  } catch (error) {
    console.error('Erreur récupération employé:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mettre à jour un employé
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const body = await request.json()
    const data = UpdateEmployeeSchema.parse(body)

    // Vérifier que l'employé existe et appartient à l'entreprise
    const employeExistant = await prisma.employe.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user.entrepriseId
      }
    })

    if (!employeExistant) {
      return NextResponse.json(
        { erreur: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier unicité de l'email si modifié
    if (data.email && data.email !== employeExistant.email) {
      const emailExistant = await prisma.employe.findFirst({
        where: {
          email: data.email,
          entrepriseId: auth.user.entrepriseId,
          id: { not: params.id }
        }
      })

      if (emailExistant) {
        return NextResponse.json(
          { erreur: 'Un employé avec cet email existe déjà' },
          { status: 409 }
        )
      }
    }

    // Mettre à jour l'employé
    const employeMisAJour = await prisma.employe.update({
      where: { id: params.id },
      data: {
        ...data,
        dateMiseAJour: new Date()
      }
    })

    // Créer un historique de modification
    const modifications = []
    for (const [key, value] of Object.entries(data)) {
      if (employeExistant[key as keyof typeof employeExistant] !== value) {
        modifications.push(`${key}: ${employeExistant[key as keyof typeof employeExistant]} → ${value}`)
      }
    }

    if (modifications.length > 0) {
      await prisma.historiqueEmploye.create({
        data: {
          employeId: params.id,
          typeModification: 'MODIFICATION_DONNEES',
          description: modifications.join(', '),
          utilisateurId: auth.user.userId,
          dateModification: new Date()
        }
      })
    }

    return NextResponse.json({
      employe: employeMisAJour,
      message: 'Employé mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur mise à jour employé:', error)
    
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

// DELETE - Supprimer un employé (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Vérifier que l'employé existe et appartient à l'entreprise
    const employe = await prisma.employe.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user.entrepriseId
      }
    })

    if (!employe) {
      return NextResponse.json(
        { erreur: 'Employé non trouvé' },
        { status: 404 }
      )
    }

    // Soft delete - marquer comme inactif
    const employeSupprime = await prisma.employe.update({
      where: { id: params.id },
      data: {
        statut: 'INACTIF',
        dateFin: new Date(),
        dateMiseAJour: new Date()
      }
    })

    // Créer un historique
    await prisma.historiqueEmploye.create({
      data: {
        employeId: params.id,
        typeModification: 'SUPPRESSION',
        description: 'Employé supprimé (désactivé)',
        utilisateurId: auth.user.userId,
        dateModification: new Date()
      }
    })

    return NextResponse.json({
      message: 'Employé supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression employé:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}