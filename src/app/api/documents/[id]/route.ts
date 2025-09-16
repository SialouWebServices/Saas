import { NextRequest, NextResponse } from 'next/server'
import { readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'

const prisma = new PrismaClient()

// GET - Télécharger un document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Récupérer le document
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      }
    })

    if (!document) {
      return NextResponse.json(
        { erreur: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le fichier existe
    if (!existsSync(document.cheminFichier)) {
      return NextResponse.json(
        { erreur: 'Fichier physique introuvable' },
        { status: 404 }
      )
    }

    // Lire le fichier
    const fileBuffer = await readFile(document.cheminFichier)

    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.typeMime,
        'Content-Disposition': `attachment; filename="${document.nom}"`,
        'Content-Length': document.tailleFichier.toString()
      }
    })

  } catch (error) {
    console.error('Erreur téléchargement document:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Supprimer un document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Récupérer le document
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      }
    })

    if (!document) {
      return NextResponse.json(
        { erreur: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le fichier physique
    if (existsSync(document.cheminFichier)) {
      await unlink(document.cheminFichier)
    }

    // Supprimer de la base de données
    await prisma.document.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Document supprimé avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression document:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mettre à jour les métadonnées d'un document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { nom, typeDocument } = await request.json()

    // Vérifier que le document existe et appartient à l'entreprise
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      }
    })

    if (!document) {
      return NextResponse.json(
        { erreur: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour
    const documentMisAJour = await prisma.document.update({
      where: { id: params.id },
      data: {
        nom: nom || document.nom,
        typeDocument: typeDocument || document.typeDocument,
        dateMiseAJour: new Date()
      }
    })

    return NextResponse.json({
      document: documentMisAJour,
      message: 'Document mis à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur mise à jour document:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}