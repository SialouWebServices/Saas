import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatage des montants en CFA
export function formatCFA(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(num)
}

// Formatage des dates pour le contexte ivoirien
export function formatDateCI(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// Calcul des cotisations CNPS
export function calculerCotisationsCNPS(salaireBase: number) {
  const cotisationEmploye = salaireBase * 0.032 // 3.2%
  const cotisationEmployeur = salaireBase * 0.164 // 16.4%
  
  return {
    employe: Math.round(cotisationEmploye),
    employeur: Math.round(cotisationEmployeur),
    total: Math.round(cotisationEmploye + cotisationEmployeur)
  }
}

// Calcul de l'impôt sur le salaire (barème ivoirien simplifié)
export function calculerImpotSurSalaire(salaireImposable: number): number {
  // Barème progressif simplifié pour la Côte d'Ivoire
  // À ajuster selon les derniers barèmes officiels
  
  if (salaireImposable <= 50000) return 0
  if (salaireImposable <= 120000) return (salaireImposable - 50000) * 0.1
  if (salaireImposable <= 300000) return 7000 + (salaireImposable - 120000) * 0.15
  if (salaireImposable <= 1000000) return 34000 + (salaireImposable - 300000) * 0.20
  
  return 174000 + (salaireImposable - 1000000) * 0.25
}

// Génération de numéros uniques
export function genererNumeroEmploye(entrepriseId: string, compteur: number): string {
  const prefixe = entrepriseId.slice(-3).toUpperCase()
  return `EMP-${prefixe}-${compteur.toString().padStart(4, '0')}`
}

export function genererNumeroBulletin(entrepriseId: string, mois: number, annee: number, employeId: string): string {
  const prefixe = entrepriseId.slice(-3).toUpperCase()
  const emp = employeId.slice(-3).toUpperCase()
  return `BP-${prefixe}-${annee}${mois.toString().padStart(2, '0')}-${emp}`
}

// Validation des données
export function validerNumeroCNPS(numero: string): boolean {
  // Format CNPS: XXXXXXXXX (9 chiffres)
  return /^\d{9}$/.test(numero)
}

export function validerNumeroRCCM(numero: string): boolean {
  // Format RCCM simplifié pour validation de base
  return numero.length >= 8 && numero.length <= 20
}

// Utilitaires pour les noms de mois en français
export const MOIS_FRANCAIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export function obtenirNomMois(mois: number): string {
  return MOIS_FRANCAIS[mois - 1] || 'Mois inconnu'
}

// Constantes locales
export const DEVISES = {
  CFA: 'XOF',
  EURO: 'EUR',
  DOLLAR: 'USD'
}

export const OPERATEURS_MOBILE_MONEY = [
  'Orange Money',
  'MTN Mobile Money',
  'Wave'
]

export const BANQUES_IVOIRIENNES = [
  'SGBCI',
  'BICICI',
  'UBA Côte d\'Ivoire',
  'Ecobank',
  'BOA',
  'Société Générale',
  'Standard Chartered',
  'NSIA Banque',
  'CORIS Bank',
  'Atlantic Bank'
]