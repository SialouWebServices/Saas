import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'

const prisma = new PrismaClient()

const ParametresEntrepriseSchema = z.object({
  // Informations générales
  nom: z.string().min(2).optional(),
  secteurActivite: z.string().min(2).optional(),
  adresse: z.string().min(5).optional(),
  ville: z.string().min(2).optional(),
  codePostal: z.string().optional(),
  telephone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  siteWeb: z.string().url().optional(),
  numeroRC: z.string().optional(),
  numeroCNPS: z.string().optional(),
  
  // Configuration paie
  configurationPaie: z.object({
    deviseParDefaut: z.string().optional(),
    jourPaieParDefaut: z.number().min(1).max(31).optional(),
    modePaiementParDefaut: z.enum(['VIREMENT', 'MOBILE_MONEY', 'CHEQUE', 'ESPECES']).optional(),
    operateurMobileMoneyParDefaut: z.enum(['ORANGE_MONEY', 'WAVE', 'MTN_MOMO']).optional(),
    primeTransportParDefaut: z.number().min(0).optional(),
    activerHeuresSupplementaires: z.boolean().optional(),
    tauxHeuresSupplementaires: z.number().min(0).optional()
  }).optional(),
  
  // Configuration CNPS
  configurationCNPS: z.object({
    active: z.boolean().optional(),
    numeroCNPS: z.string().optional(),
    tauxEmploye: z.number().min(0).max(100).optional(),
    tauxEmployeur: z.number().min(0).max(100).optional(),
    declarationAutomatique: z.boolean().optional(),
    jourDeclaration: z.number().min(1).max(31).optional()
  }).optional(),
  
  // Préférences notifications
  preferencesNotifications: z.object({
    notifierNouveauBulletin: z.boolean().optional(),
    notifierPaiementSalaire: z.boolean().optional(),
    notifierDocumentsManquants: z.boolean().optional(),
    notifierEcheancesContrats: z.boolean().optional(),
    canauxParDefaut: z.array(z.enum(['SMS', 'EMAIL', 'WHATSAPP'])).optional(),
    languePrefere: z.enum(['fr', 'en']).optional(),
    heureEnvoiNotifications: z.string().optional() // Format "09:00"
  }).optional(),
  
  // Sécurité et accès
  parametresSecurite: z.object({
    exigerMotDePasseComplexe: z.boolean().optional(),
    dureeSessionMinutes: z.number().min(15).max(480).optional(),
    activerDoubleAuthentification: z.boolean().optional(),
    autoriserConnexionsMultiples: z.boolean().optional(),
    bloquerApresEchecsConnexion: z.number().min(3).max(10).optional()
  }).optional()
})

// GET - Récupérer les paramètres de l'entreprise
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Récupérer l'entreprise avec ses paramètres
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: auth.user!.entrepriseId },
      include: {
        parametres: true,
        abonnement: {
          select: {
            plan: true,
            statut: true,
            montantMensuel: true,
            prochainePaiement: true
          }
        },
        _count: {
          select: {
            employes: true,
            utilisateurs: true
          }
        }
      }
    })

    if (!entreprise) {
      return NextResponse.json(
        { erreur: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Calculer des statistiques utiles
    const statistiques = {
      nombreEmployes: entreprise._count.employes,
      nombreUtilisateurs: entreprise._count.utilisateurs,
      planActuel: entreprise.planAbonnement,
      limitesAtteintes: await calculerLimitesAtteintes(entreprise.id, entreprise.planAbonnement)
    }

    return NextResponse.json({
      entreprise: {
        id: entreprise.id,
        nom: entreprise.nom,
        secteurActivite: entreprise.secteurActivite,
        adresse: entreprise.adresse,
        ville: entreprise.ville,
        codePostal: entreprise.codePostal,
        telephone: entreprise.telephone,
        email: entreprise.email,
        numeroRC: entreprise.numeroRC,
        numeroCNPS: entreprise.numeroCNPS,
        dateCreation: entreprise.dateCreation,
        configuration: entreprise.configuration
      },
      parametres: entreprise.parametres,
      abonnement: entreprise.abonnement,
      statistiques
    })

  } catch (error) {
    console.error('Erreur récupération paramètres:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mettre à jour les paramètres de l'entreprise
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Vérifier les permissions admin
    if (auth.user!.role !== 'ADMIN') {
      return NextResponse.json(
        { erreur: 'Seuls les administrateurs peuvent modifier les paramètres' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = ParametresEntrepriseSchema.parse(body)

    // Vérifier que l'entreprise existe
    const entrepriseExistante = await prisma.entreprise.findUnique({
      where: { id: auth.user!.entrepriseId },
      include: { parametres: true }
    })

    if (!entrepriseExistante) {
      return NextResponse.json(
        { erreur: 'Entreprise non trouvée' },
        { status: 404 }
      )
    }

    // Transaction pour mettre à jour l'entreprise et ses paramètres
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour les informations de base de l'entreprise
      const entrepriseMiseAJour = await tx.entreprise.update({
        where: { id: auth.user!.entrepriseId },
        data: {
          nom: data.nom,
          secteurActivite: data.secteurActivite,
          adresse: data.adresse,
          ville: data.ville,
          codePostal: data.codePostal,
          telephone: data.telephone,
          email: data.email,
          numeroRC: data.numeroRC,
          numeroCNPS: data.numeroCNPS,
          dateMiseAJour: new Date(),
          // Mettre à jour la configuration JSON
          configuration: {
            ...entrepriseExistante.configuration as any,
            siteWeb: data.siteWeb,
            configurationPaie: {
              ...(entrepriseExistante.configuration as any)?.configurationPaie,
              ...data.configurationPaie
            },
            preferencesNotifications: {
              ...(entrepriseExistante.configuration as any)?.preferencesNotifications,
              ...data.preferencesNotifications
            },
            parametresSecurite: {
              ...(entrepriseExistante.configuration as any)?.parametresSecurite,
              ...data.parametresSecurite
            },
            derniereModification: new Date()
          }
        }
      })

      // Mettre à jour ou créer les paramètres détaillés
      let parametres
      if (entrepriseExistante.parametres) {
        parametres = await tx.parametresEntreprise.update({
          where: { id: entrepriseExistante.parametres.id },
          data: {
            deviseParDefaut: data.configurationPaie?.deviseParDefaut,
            jourPaieParDefaut: data.configurationPaie?.jourPaieParDefaut,
            modePaiementParDefaut: data.configurationPaie?.modePaiementParDefaut,
            operateurMobileMoneyParDefaut: data.configurationPaie?.operateurMobileMoneyParDefaut,
            configurationCNPS: data.configurationCNPS ? {
              ...(entrepriseExistante.parametres.configurationCNPS as any),
              ...data.configurationCNPS
            } : entrepriseExistante.parametres.configurationCNPS,
            configurationNotifications: data.preferencesNotifications ? {
              ...(entrepriseExistante.parametres.configurationNotifications as any),
              ...data.preferencesNotifications
            } : entrepriseExistante.parametres.configurationNotifications,
            dateMiseAJour: new Date()
          }
        })
      } else {
        parametres = await tx.parametresEntreprise.create({
          data: {
            entrepriseId: auth.user!.entrepriseId,
            deviseParDefaut: data.configurationPaie?.deviseParDefaut || 'XOF',
            jourPaieParDefaut: data.configurationPaie?.jourPaieParDefaut || 30,
            modePaiementParDefaut: data.configurationPaie?.modePaiementParDefaut || 'MOBILE_MONEY',
            operateurMobileMoneyParDefaut: data.configurationPaie?.operateurMobileMoneyParDefaut,
            configurationCNPS: data.configurationCNPS || { active: true, tauxEmploye: 3.2, tauxEmployeur: 16.4 },
            configurationNotifications: data.preferencesNotifications || { canauxParDefaut: ['EMAIL'] },
            dateCreation: new Date()
          }
        })
      }

      return { entreprise: entrepriseMiseAJour, parametres }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        entrepriseId: auth.user!.entrepriseId,
        utilisateurId: auth.user!.userId,
        action: 'MODIFICATION_PARAMETRES',
        details: {
          champsModifies: Object.keys(data),
          dateModification: new Date()
        },
        dateCreation: new Date()
      }
    })

    return NextResponse.json({
      message: 'Paramètres mis à jour avec succès',
      entreprise: result.entreprise,
      parametres: result.parametres
    })

  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          erreur: 'Données invalides',
          details: error.errors.map(err => ({
            champ: err.path.join('.'),
            message: err.message
          }))
        },
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

// Fonction utilitaire pour calculer les limites atteintes
async function calculerLimitesAtteintes(entrepriseId: string, plan: string) {
  const limits = {
    'GRATUIT': { employes: 5, stockage: 100 }, // 100 MB
    'STARTER': { employes: 25, stockage: 1000 }, // 1 GB
    'PRO': { employes: 100, stockage: 5000 }, // 5 GB
    'ENTERPRISE': { employes: Infinity, stockage: Infinity }
  }

  const limite = limits[plan as keyof typeof limits] || limits.GRATUIT

  const [nombreEmployes, tailleStockage] = await Promise.all([
    prisma.employe.count({ where: { entrepriseId } }),
    prisma.document.aggregate({
      where: { entrepriseId },
      _sum: { tailleFichier: true }
    })
  ])

  const stockageUtilise = (tailleStockage._sum.tailleFichier || 0) / (1024 * 1024) // En MB

  return {
    employes: {
      utilise: nombreEmployes,
      limite: limite.employes,
      pourcentage: limite.employes === Infinity ? 0 : (nombreEmployes / limite.employes) * 100,
      depasse: nombreEmployes > limite.employes
    },
    stockage: {
      utilise: Math.round(stockageUtilise),
      limite: limite.stockage,
      pourcentage: limite.stockage === Infinity ? 0 : (stockageUtilise / limite.stockage) * 100,
      depasse: stockageUtilise > limite.stockage
    }
  }
}