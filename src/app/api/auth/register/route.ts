import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { sign } from 'jsonwebtoken'

const prisma = new PrismaClient()

const RegisterSchema = z.object({
  prenom: z.string().min(2, 'Prénom requis'),
  nom: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(8, 'Mot de passe minimum 8 caractères'),
  telephone: z.string().min(8, 'Numéro de téléphone requis'),
  entreprise: z.object({
    nom: z.string().min(2, 'Nom entreprise requis'),
    secteurActivite: z.string().min(2, 'Secteur d\'activité requis'),
    adresse: z.string().min(5, 'Adresse requise'),
    ville: z.string().min(2, 'Ville requise'),
    codePostal: z.string().optional(),
    telephone: z.string().min(8, 'Téléphone entreprise requis'),
    email: z.string().email('Email entreprise invalide'),
    numeroRC: z.string().optional(),
    numeroCNPS: z.string().optional()
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = RegisterSchema.parse(body)

    // Vérifier si l'email existe déjà
    const utilisateurExistant = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (utilisateurExistant) {
      return NextResponse.json(
        { erreur: 'Cet email est déjà utilisé' },
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
        { erreur: 'Cette entreprise existe déjà' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const motDePasseHashe = await bcrypt.hash(data.motDePasse, 12)

    // Créer l'entreprise et l'utilisateur en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'entreprise
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
          planAbonnement: 'GRATUIT',
          statutAbonnement: 'ACTIF',
          dateCreation: new Date()
        }
      })

      // Créer l'utilisateur administrateur
      const utilisateur = await tx.user.create({
        data: {
          prenom: data.prenom,
          nom: data.nom,
          email: data.email,
          motDePasse: motDePasseHashe,
          telephone: data.telephone,
          role: 'ADMIN',
          entrepriseId: entreprise.id,
          dateCreation: new Date()
        }
      })

      return { entreprise, utilisateur }
    })

    // Générer JWT token
    const token = sign(
      {
        userId: result.utilisateur.id,
        email: result.utilisateur.email,
        entrepriseId: result.entreprise.id,
        role: result.utilisateur.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Retourner les données (sans mot de passe)
    const { motDePasse: _, ...utilisateurSansMotDePasse } = result.utilisateur

    return NextResponse.json({
      utilisateur: utilisateurSansMotDePasse,
      entreprise: result.entreprise,
      token,
      message: 'Inscription réussie'
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    
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