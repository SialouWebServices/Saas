import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import * as XLSX from 'xlsx'
import { writeFileSync } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const UpdateDeclarationSchema = z.object({
  statut: z.enum(['BROUILLON', 'VALIDEE', 'DEPOSEE']).optional()
})

// GET - Récupérer une déclaration spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const declaration = await prisma.declarationCNPS.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      },
      include: {
        entreprise: {
          select: { 
            nom: true, 
            numeroCNPS: true,
            adresse: true,
            telephone: true
          }
        }
      }
    })

    if (!declaration) {
      return NextResponse.json(
        { erreur: 'Déclaration non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les détails des employés
    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        entrepriseId: auth.user!.entrepriseId,
        mois: declaration.mois,
        annee: declaration.annee,
        statut: 'VALIDE'
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            numeroCNPS: true,
            matricule: true
          }
        }
      },
      orderBy: { employe: { nom: 'asc' } }
    })

    const employes = bulletins.map(b => ({
      employeId: b.employe.id,
      matricule: b.employe.matricule,
      nom: b.employe.nom,
      prenom: b.employe.prenom,
      numeroCNPS: b.employe.numeroCNPS,
      salaireBase: Number(b.salaireBrut),
      cotisationEmploye: Number(b.cotisationCNPSEmploye),
      cotisationEmployeur: Number(b.cotisationCNPSEmployeur)
    }))

    return NextResponse.json({
      declaration,
      employes
    })

  } catch (error) {
    console.error('Erreur récupération déclaration:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mettre à jour une déclaration
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
    const data = UpdateDeclarationSchema.parse(body)

    // Vérifier que la déclaration existe
    const declarationExistante = await prisma.declarationCNPS.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      }
    })

    if (!declarationExistante) {
      return NextResponse.json(
        { erreur: 'Déclaration non trouvée' },
        { status: 404 }
      )
    }

    // Mettre à jour la déclaration
    const declarationMiseAJour = await prisma.declarationCNPS.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.statut === 'DEPOSEE' && { dateDepot: new Date() }),
        dateMiseAJour: new Date()
      }
    })

    return NextResponse.json({
      declaration: declarationMiseAJour,
      message: 'Déclaration mise à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur mise à jour déclaration:', error)
    
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

// DELETE - Supprimer une déclaration (seulement si BROUILLON)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const declaration = await prisma.declarationCNPS.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      }
    })

    if (!declaration) {
      return NextResponse.json(
        { erreur: 'Déclaration non trouvée' },
        { status: 404 }
      )
    }

    if (declaration.statut !== 'BROUILLON') {
      return NextResponse.json(
        { erreur: 'Seules les déclarations en brouillon peuvent être supprimées' },
        { status: 400 }
      )
    }

    await prisma.declarationCNPS.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Déclaration supprimée avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression déclaration:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}