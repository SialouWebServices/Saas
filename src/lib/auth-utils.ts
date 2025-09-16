import { verify } from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  email: string
  entrepriseId: string
  role: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

export async function verifyToken(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Token d\'authentification manquant'
      }
    }

    const token = authHeader.substring(7) // Enlever "Bearer "
    
    const decoded = verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret'
    ) as AuthUser

    return {
      success: true,
      user: decoded
    }

  } catch (error) {
    return {
      success: false,
      error: 'Token d\'authentification invalide'
    }
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const auth = await verifyToken(request)
    
    if (!auth.success) {
      return auth
    }

    if (!allowedRoles.includes(auth.user!.role)) {
      return {
        success: false,
        error: 'Permissions insuffisantes'
      }
    }

    return auth
  }
}

// Middleware pour vérifier les permissions admin
export const requireAdmin = requireRole(['ADMIN'])

// Middleware pour vérifier les permissions RH
export const requireRH = requireRole(['ADMIN', 'RH'])