import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { sign } from 'jsonwebtoken'

const prisma = new PrismaClient()

const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(6, 'Mot de passe requis')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, motDePasse } = LoginSchema.parse(body)

    // Vérifier si l'utilisateur existe
    const utilisateur = await prisma.user.findUnique({
      where: { email },
      include: {
        entreprise: {
          select: {
            id: true,
            nom: true,
            planAbonnement: true,
            statutAbonnement: true
          }
        }
      }
    })

    if (!utilisateur) {
      return NextResponse.json(
        { erreur: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse)
    if (!motDePasseValide) {
      return NextResponse.json(
        { erreur: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Générer JWT token
    const token = sign(
      {
        userId: utilisateur.id,
        email: utilisateur.email,
        entrepriseId: utilisateur.entrepriseId,
        role: utilisateur.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: utilisateur.id },
      data: { derniereConnexion: new Date() }
    })

    // Retourner les données utilisateur (sans mot de passe)
    const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur

    return NextResponse.json({
      utilisateur: utilisateurSansMotDePasse,
      token,
      message: 'Connexion réussie'
    })

  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    
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