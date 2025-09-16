import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const ResetRequestSchema = z.object({
  email: z.string().email('Email invalide')
})

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  nouveauMotDePasse: z.string().min(8, 'Mot de passe minimum 8 caractères')
})

// Demande de réinitialisation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = ResetRequestSchema.parse(body)

    // Vérifier si l'utilisateur existe
    const utilisateur = await prisma.user.findUnique({
      where: { email }
    })

    if (!utilisateur) {
      // Ne pas révéler si l'email existe ou non pour la sécurité
      return NextResponse.json({
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      })
    }

    // Générer token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 heure

    // Sauvegarder le token
    await prisma.user.update({
      where: { id: utilisateur.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // TODO: Envoyer email avec le lien de réinitialisation
    // Pour l'instant, on retourne le token (à supprimer en production)
    console.log(`Token de réinitialisation pour ${email}: ${resetToken}`)

    return NextResponse.json({
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      // TODO: Supprimer en production
      debug_token: resetToken
    })

  } catch (error) {
    console.error('Erreur demande réinitialisation:', error)
    
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

// Réinitialisation effective du mot de passe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, nouveauMotDePasse } = ResetPasswordSchema.parse(body)

    // Vérifier le token
    const utilisateur = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!utilisateur) {
      return NextResponse.json(
        { erreur: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const motDePasseHashe = await bcrypt.hash(nouveauMotDePasse, 12)

    // Mettre à jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: utilisateur.id },
      data: {
        motDePasse: motDePasseHashe,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès'
    })

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error)
    
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