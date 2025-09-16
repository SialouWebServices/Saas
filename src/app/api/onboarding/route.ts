import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const OnboardingSchema = z.object({
  // Étape 1: Informations entreprise
  entreprise: z.object({
    nom: z.string().min(2, 'Nom entreprise requis'),
    secteurActivite: z.string().min(2, 'Secteur d\'activité requis'),
    taille: z.enum(['MICRO', 'PETITE', 'MOYENNE']),
    adresse: z.string().min(5, 'Adresse requise'),
    ville: z.string().min(2, 'Ville requise'),
    codePostal: z.string().optional(),
    telephone: z.string().min(8, 'Téléphone requis'),
    email: z.string().email('Email invalide'),
    siteWeb: z.string().url().optional(),
    numeroRC: z.string().optional(),
    numeroCNPS: z.string().optional(),
    dateCreation: z.string().transform(str => new Date(str)).optional()
  }),
  
  // Étape 2: Administrateur principal
  administrateur: z.object({
    prenom: z.string().min(2, 'Prénom requis'),
    nom: z.string().min(2, 'Nom requis'),
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(8, 'Mot de passe minimum 8 caractères'),
    telephone: z.string().min(8, 'Téléphone requis'),
    poste: z.string().min(2, 'Poste requis')
  }),
  
  // Étape 3: Configuration paie
  configurationPaie: z.object({
    deviseParDefaut: z.string().default('XOF'),
    jourPaie: z.number().min(1).max(31).default(30),
    modePaiementParDefaut: z.enum(['VIREMENT', 'MOBILE_MONEY', 'CHEQUE', 'ESPECES']),
    operateurMobileMoneyParDefaut: z.enum(['ORANGE_MONEY', 'WAVE', 'MTN_MOMO']).optional(),
    activerCNPS: z.boolean().default(true),
    tauxCNPSEmploye: z.number().default(3.2),
    tauxCNPSEmployeur: z.number().default(16.4),
    primeTransportParDefaut: z.number().default(25000),
    activerImpotSurSalaire: z.boolean().default(true)
  }),
  
  // Étape 4: Préférences notifications
  preferencesNotifications: z.object({
    notifierNouveauBulletin: z.boolean().default(true),
    notifierPaiementSalaire: z.boolean().default(true),
    notifierDocumentsManquants: z.boolean().default(true),
    canauxParDefaut: z.array(z.enum(['SMS', 'EMAIL', 'WHATSAPP'])).default(['EMAIL']),
    languePrefere: z.enum(['fr', 'en']).default('fr')
  }),
  
  // Étape 5: Plan d'abonnement
  abonnement: z.object({
    planChoisi: z.enum(['GRATUIT', 'STARTER', 'PRO', 'ENTERPRISE']),
    modePaiement: z.enum(['MOBILE_MONEY', 'VIREMENT_BANCAIRE']).optional(),
    operateurPaiement: z.enum(['ORANGE_MONEY', 'WAVE', 'MTN_MOMO']).optional(),
    numeroMobileMoney: z.string().optional(),
    accepterConditions: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions')
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = OnboardingSchema.parse(body)

    // Vérifier si l'email administrateur existe déjà
    const adminExistant = await prisma.user.findUnique({
      where: { email: data.administrateur.email }
    })

    if (adminExistant) {
      return NextResponse.json(
        { erreur: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Vérifier si l'entreprise existe déjà
    const entrepriseExistante = await prisma.entreprise.findFirst({
      where: {
        OR: [
          { email: data.entreprise.email },
          { nom: data.entreprise.nom }
        ]
      }
    })

    if (entrepriseExistante) {
      return NextResponse.json(
        { erreur: 'Cette entreprise existe déjà dans notre système' },
        { status: 409 }
      )
    }

    // Transaction pour créer tout en même temps
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer l'entreprise
      const entreprise = await tx.entreprise.create({
        data: {
          nom: data.entreprise.nom,
          secteurActivite: data.entreprise.secteurActivite,
          adresse: data.entreprise.adresse,
          ville: data.entreprise.ville,
          codePostal: data.entreprise.codePostal,
          telephone: data.entreprise.telephone,
          email: data.entreprise.email,
          numeroRC: data.entreprise.numeroRC,
          numeroCNPS: data.entreprise.numeroCNPS,
          planAbonnement: data.abonnement.planChoisi,
          statutAbonnement: 'ACTIF',
          dateCreation: new Date(),
          // Configuration spécifique stockée en JSON
          configuration: {
            taille: data.entreprise.taille,
            siteWeb: data.entreprise.siteWeb,
            configurationPaie: data.configurationPaie,
            preferencesNotifications: data.preferencesNotifications,
            onboardingComplete: true,
            dateOnboarding: new Date()
          }
        }
      })

      // 2. Créer l'administrateur
      const motDePasseHashe = await bcrypt.hash(data.administrateur.motDePasse, 12)
      const administrateur = await tx.user.create({
        data: {
          prenom: data.administrateur.prenom,
          nom: data.administrateur.nom,
          email: data.administrateur.email,
          motDePasse: motDePasseHashe,
          telephone: data.administrateur.telephone,
          role: 'ADMIN',
          entrepriseId: entreprise.id,
          dateCreation: new Date(),
          metadata: {
            poste: data.administrateur.poste,
            creePenddantOnboarding: true
          }
        }
      })

      // 3. Créer les paramètres par défaut de l'entreprise
      const parametres = await tx.parametresEntreprise.create({
        data: {
          entrepriseId: entreprise.id,
          deviseParDefaut: data.configurationPaie.deviseParDefaut,
          jourPaieParDefaut: data.configurationPaie.jourPaie,
          modePaiementParDefaut: data.configurationPaie.modePaiementParDefaut,
          operateurMobileMoneyParDefaut: data.configurationPaie.operateurMobileMoneyParDefaut,
          configurationCNPS: {
            active: data.configurationPaie.activerCNPS,
            tauxEmploye: data.configurationPaie.tauxCNPSEmploye,
            tauxEmployeur: data.configurationPaie.tauxCNPSEmployeur,
            numeroCNPS: data.entreprise.numeroCNPS
          },
          configurationNotifications: data.preferencesNotifications,
          dateCreation: new Date()
        }
      })

      // 4. Si plan payant, créer la souscription
      if (data.abonnement.planChoisi !== 'GRATUIT') {
        const montantMensuel = {
          'STARTER': 15000,
          'PRO': 45000,
          'ENTERPRISE': 0 // Sur devis
        }[data.abonnement.planChoisi] || 0

        await tx.abonnement.create({
          data: {
            entrepriseId: entreprise.id,
            plan: data.abonnement.planChoisi,
            statut: 'ACTIF',
            montantMensuel,
            devise: 'XOF',
            modePaiement: data.abonnement.modePaiement || 'MOBILE_MONEY',
            operateurPaiement: data.abonnement.operateurPaiement,
            numeroMobileMoney: data.abonnement.numeroMobileMoney,
            dateDebut: new Date(),
            prochainePaiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            dateCreation: new Date()
          }
        })
      }

      return { entreprise, administrateur, parametres }
    })

    // 5. Envoyer l'email de bienvenue
    try {
      // TODO: Implémenter l'envoi d'email de bienvenue
      console.log(`Email de bienvenue à envoyer à: ${data.administrateur.email}`)
    } catch (emailError) {
      console.error('Erreur envoi email de bienvenue:', emailError)
      // Ne pas faire échouer l'onboarding pour un problème d'email
    }

    // Retourner le succès sans les mots de passe
    const { motDePasse: _, ...adminSansMotDePasse } = result.administrateur

    return NextResponse.json({
      message: 'Onboarding complété avec succès ! Bienvenue dans SaaS RH CI.',
      entreprise: result.entreprise,
      administrateur: adminSansMotDePasse,
      prochainesTout: [
        'Ajouter vos premiers employés',
        'Configurer les postes et départements',
        'Générer votre première paie',
        'Explorer le tableau de bord'
      ],
      // TODO: Générer JWT token pour connexion automatique
      redirectUrl: '/dashboard'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de l\'onboarding:', error)
    
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
      { erreur: 'Erreur interne du serveur lors de l\'onboarding' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET - Récupérer le statut de l'onboarding pour une entreprise
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { erreur: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'onboarding a déjà été complété
    const utilisateur = await prisma.user.findUnique({
      where: { email },
      include: {
        entreprise: {
          select: {
            id: true,
            nom: true,
            planAbonnement: true,
            configuration: true
          }
        }
      }
    })

    if (utilisateur) {
      return NextResponse.json({
        onboardingComplete: true,
        entreprise: utilisateur.entreprise,
        message: 'Onboarding déjà complété'
      })
    }

    return NextResponse.json({
      onboardingComplete: false,
      message: 'Onboarding non complété'
    })

  } catch (error) {
    console.error('Erreur vérification onboarding:', error)
    return NextResponse.json(
      { erreur: 'Erreur interne du serveur' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}