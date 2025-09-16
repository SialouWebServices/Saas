import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'

const prisma = new PrismaClient()

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

// POST - Upload d'un document
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Créer le dossier d'upload s'il n'existe pas
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const employeId = formData.get('employeId') as string
    const typeDocument = formData.get('typeDocument') as string
    const nom = formData.get('nom') as string || file.name

    if (!file) {
      return NextResponse.json(
        { erreur: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validation du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { erreur: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { erreur: 'Type de fichier non autorisé' },
        { status: 400 }
      )
    }

    // Vérifier que l'employé appartient à l'entreprise
    if (employeId) {
      const employe = await prisma.employe.findFirst({
        where: {
          id: employeId,
          entrepriseId: auth.user!.entrepriseId
        }
      })

      if (!employe) {
        return NextResponse.json(
          { erreur: 'Employé non trouvé' },
          { status: 404 }
        )
      }
    }

    // Générer nom de fichier unique
    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}${extension}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Sauvegarder en base de données
    const document = await prisma.document.create({
      data: {
        nom,
        typeDocument,
        nomFichier: fileName,
        cheminFichier: filePath,
        tailleFichier: file.size,
        typeMime: file.type,
        employeId: employeId || null,
        entrepriseId: auth.user!.entrepriseId,
        uploadePar: auth.user!.userId,
        dateUpload: new Date()
      }
    })

    return NextResponse.json({
      document: {
        id: document.id,
        nom: document.nom,
        typeDocument: document.typeDocument,
        tailleFichier: document.tailleFichier,
        typeMime: document.typeMime,
        dateUpload: document.dateUpload
      },
      message: 'Document uploadé avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur upload document:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET - Récupérer la liste des documents
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employeId')
    const typeDocument = searchParams.get('typeDocument')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      entrepriseId: auth.user!.entrepriseId
    }

    if (employeId) {
      where.employeId = employeId
    }

    if (typeDocument) {
      where.typeDocument = typeDocument
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          employe: {
            select: {
              id: true,
              prenom: true,
              nom: true,
              matricule: true
            }
          },
          uploadePar: {
            select: {
              id: true,
              prenom: true,
              nom: true
            }
          }
        },
        orderBy: { dateUpload: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.document.count({ where })
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erreur récupération documents:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}