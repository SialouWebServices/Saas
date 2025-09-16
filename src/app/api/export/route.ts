import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'employes'
    const format = searchParams.get('format') || 'json'

    let data = []

    switch (type) {
      case 'employes':
        data = await exporterEmployes(auth.user!.entrepriseId)
        break
      case 'bulletins':
        data = await exporterBulletins(auth.user!.entrepriseId)
        break
      default:
        return NextResponse.json({ erreur: 'Type export non supporté' }, { status: 400 })
    }

    if (format === 'excel') {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, type)
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${type}-${Date.now()}.xlsx"`
        }
      })
    }

    return NextResponse.json({ data, count: data.length })

  } catch (error) {
    console.error('Erreur export:', error)
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

async function exporterEmployes(entrepriseId: string) {
  return await prisma.employe.findMany({
    where: { entrepriseId },
    select: {
      matricule: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      poste: true,
      departement: true,
      dateEmbauche: true,
      salaireBrut: true,
      statut: true
    }
  })
}

async function exporterBulletins(entrepriseId: string) {
  return await prisma.bulletinPaie.findMany({
    where: { entreprise: { id: entrepriseId } },
    include: {
      employe: {
        select: { matricule: true, nom: true, prenom: true }
      }
    }
  })
}