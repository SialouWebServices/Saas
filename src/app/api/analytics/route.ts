import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'
    const nombreMois = parseInt(searchParams.get('periode') || '12')
    const entrepriseId = auth.user!.entrepriseId

    let analytics = {}

    switch (type) {
      case 'dashboard':
        analytics = await genererAnalyticsDashboard(entrepriseId, nombreMois)
        break
      case 'employes':
        analytics = await genererAnalyticsEmployes(entrepriseId, nombreMois)
        break
      case 'paie':
        analytics = await genererAnalyticsPaie(entrepriseId, nombreMois)
        break
      default:
        return NextResponse.json({ erreur: 'Type non supporté' }, { status: 400 })
    }

    return NextResponse.json({
      type,
      periode: nombreMois,
      dateGeneration: new Date(),
      analytics
    })

  } catch (error) {
    console.error('Erreur analytics:', error)
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

async function genererAnalyticsDashboard(entrepriseId: string, nombreMois: number) {
  const [totalEmployes, employesActifs, masseSalariale] = await Promise.all([
    prisma.employe.count({ where: { entrepriseId } }),
    prisma.employe.count({ where: { entrepriseId, statut: 'ACTIF' } }),
    prisma.bulletinPaie.aggregate({
      where: { entreprise: { id: entrepriseId } },
      _sum: { salaireBrut: true, salaireNet: true }
    })
  ])

  return {
    metriques: {
      totalEmployes,
      employesActifs,
      tauxActivite: totalEmployes > 0 ? (employesActifs / totalEmployes) * 100 : 0,
      masseSalariale: masseSalariale._sum.salaireBrut || 0
    }
  }
}

async function genererAnalyticsEmployes(entrepriseId: string, nombreMois: number) {
  const [repartitionDepartement, repartitionPoste] = await Promise.all([
    prisma.employe.groupBy({
      by: ['departement'],
      where: { entrepriseId },
      _count: { id: true }
    }),
    prisma.employe.groupBy({
      by: ['poste'],
      where: { entrepriseId },
      _count: { id: true }
    })
  ])

  return { repartitionDepartement, repartitionPoste }
}

async function genererAnalyticsPaie(entrepriseId: string, nombreMois: number) {
  const statistiques = await prisma.bulletinPaie.aggregate({
    where: { entreprise: { id: entrepriseId } },
    _avg: { salaireBrut: true, salaireNet: true },
    _sum: { salaireBrut: true, salaireNet: true }
  })

  return {
    salaireMoyen: statistiques._avg.salaireBrut || 0,
    masseTotale: statistiques._sum.salaireBrut || 0
  }
}