// Module de calcul de paie pour la Côte d'Ivoire
// Conforme aux réglementations CNPS et code du travail ivoirien

// Types pour le calcul de paie
export type ElementsPaieEmploye = {
  salaireBase: number
  heuresSupplementaires?: number
  tauxHeureSupplementaire?: number
  primeTransport?: number
  primesVariables?: number
  primesFixes?: number
  avances?: number
  autresDeductions?: number
}

export type ResultatCalculPaie = {
  // Éléments de base
  salaireBase: number
  heuresSupplementaires: number
  montantHeuresSupp: number
  primeTransport: number
  primesVariables: number
  primesFixes: number
  
  // Salaire brut
  salaireBrut: number
  
  // Cotisations sociales
  cotisationCNPSEmploye: number    // 3.2% du salaire brut
  cotisationCNPSEmployeur: number  // 16.4% du salaire brut
  totalCotisationsCNPS: number
  
  // Impôts
  salaireImposable: number
  impotSurSalaire: number
  
  // Déductions
  avances: number
  autresDeductions: number
  totalDeductions: number
  
  // Résultat final
  salaireNet: number
  coutTotalEmployeur: number
  
  // Détails pour vérification
  details: {
    baseCotisationsCNPS: number
    baseImposition: number
    tranchesImpot: TrancheImpot[]
  }
}

export type TrancheImpot = {
  min: number
  max: number | null
  taux: number
  montantTranche: number
  impotTranche: number
}

// Barème d'imposition ivoirien 2024 (à vérifier et mettre à jour)
const BAREME_IMPOT_IVOIRIEN: TrancheImpot[] = [
  { min: 0, max: 50000, taux: 0, montantTranche: 0, impotTranche: 0 },
  { min: 50001, max: 120000, taux: 0.1, montantTranche: 0, impotTranche: 0 },
  { min: 120001, max: 300000, taux: 0.15, montantTranche: 0, impotTranche: 0 },
  { min: 300001, max: 1000000, taux: 0.20, montantTranche: 0, impotTranche: 0 },
  { min: 1000001, max: null, taux: 0.25, montantTranche: 0, impotTranche: 0 }
]

// Taux de cotisations CNPS Côte d'Ivoire
export const TAUX_CNPS = {
  EMPLOYE: 0.032,    // 3.2%
  EMPLOYEUR: 0.164,  // 16.4%
  TOTAL: 0.196       // 19.6%
} as const

// Plafonds et seuils
export const SEUILS_PAIE = {
  SALAIRE_MINIMUM_SMIG: 60000,  // SMIG Côte d'Ivoire (à vérifier)
  PLAFOND_CNPS: 1800000,        // Plafond annuel CNPS (à vérifier)
  SEUIL_IMPOSITION: 50000       // Seuil d'exonération fiscale
} as const

/**
 * Calcule la paie d'un employé selon la réglementation ivoirienne
 */
export function calculerPaieEmploye(elements: ElementsPaieEmploye): ResultatCalculPaie {
  // 1. Calcul du salaire brut
  const montantHeuresSupp = calculerMontantHeuresSupplementaires(
    elements.salaireBase,
    elements.heuresSupplementaires || 0,
    elements.tauxHeureSupplementaire
  )
  
  const salaireBrut = 
    elements.salaireBase +
    montantHeuresSupp +
    (elements.primeTransport || 0) +
    (elements.primesVariables || 0) +
    (elements.primesFixes || 0)

  // 2. Calcul des cotisations CNPS
  const cotisations = calculerCotisationsCNPS(salaireBrut)

  // 3. Calcul de l'impôt sur le salaire
  const { impotSurSalaire, tranchesImpot } = calculerImpotSurSalaire(salaireBrut)

  // 4. Calcul des déductions totales
  const totalDeductions = 
    cotisations.employe +
    impotSurSalaire +
    (elements.avances || 0) +
    (elements.autresDeductions || 0)

  // 5. Salaire net
  const salaireNet = salaireBrut - totalDeductions

  // 6. Coût total pour l'employeur
  const coutTotalEmployeur = salaireBrut + cotisations.employeur

  return {
    // Éléments de base
    salaireBase: elements.salaireBase,
    heuresSupplementaires: elements.heuresSupplementaires || 0,
    montantHeuresSupp,
    primeTransport: elements.primeTransport || 0,
    primesVariables: elements.primesVariables || 0,
    primesFixes: elements.primesFixes || 0,
    
    // Salaire brut
    salaireBrut,
    
    // Cotisations sociales
    cotisationCNPSEmploye: cotisations.employe,
    cotisationCNPSEmployeur: cotisations.employeur,
    totalCotisationsCNPS: cotisations.total,
    
    // Impôts
    salaireImposable: salaireBrut,
    impotSurSalaire,
    
    // Déductions
    avances: elements.avances || 0,
    autresDeductions: elements.autresDeductions || 0,
    totalDeductions,
    
    // Résultat final
    salaireNet,
    coutTotalEmployeur,
    
    // Détails
    details: {
      baseCotisationsCNPS: salaireBrut,
      baseImposition: salaireBrut,
      tranchesImpot
    }
  }
}

/**
 * Calcule le montant des heures supplémentaires
 */
function calculerMontantHeuresSupplementaires(
  salaireBase: number,
  heuresSupp: number,
  tauxPersonnalise?: number
): number {
  if (heuresSupp <= 0) return 0
  
  // Calcul du taux horaire de base (base mensuelle / 173.33 heures)
  const tauxHoraireBase = salaireBase / 173.33
  
  // Taux des heures supplémentaires (par défaut 125% = 1.25)
  const tauxHeuresSupp = tauxPersonnalise || 1.25
  
  return heuresSupp * tauxHoraireBase * tauxHeuresSupp
}

/**
 * Calcule les cotisations CNPS employé et employeur
 */
function calculerCotisationsCNPS(salaireBrut: number) {
  // Application du plafond CNPS si nécessaire
  const salaireRetenu = Math.min(salaireBrut, SEUILS_PAIE.PLAFOND_CNPS / 12)
  
  const employe = Math.round(salaireRetenu * TAUX_CNPS.EMPLOYE)
  const employeur = Math.round(salaireRetenu * TAUX_CNPS.EMPLOYEUR)
  
  return {
    employe,
    employeur,
    total: employe + employeur
  }
}

/**
 * Calcule l'impôt sur le salaire selon le barème ivoirien
 */
function calculerImpotSurSalaire(salaireBrut: number): {
  impotSurSalaire: number
  tranchesImpot: TrancheImpot[]
} {
  const tranchesCalculees: TrancheImpot[] = []
  let impotTotal = 0
  let salaireRestant = salaireBrut

  for (const tranche of BAREME_IMPOT_IVOIRIEN) {
    if (salaireRestant <= 0) break

    const montantTranche = tranche.max 
      ? Math.min(salaireRestant, tranche.max - tranche.min + 1)
      : salaireRestant

    const impotTranche = montantTranche * tranche.taux

    tranchesCalculees.push({
      ...tranche,
      montantTranche,
      impotTranche
    })

    impotTotal += impotTranche
    salaireRestant -= montantTranche

    if (tranche.max && salaireBrut <= tranche.max) break
  }

  return {
    impotSurSalaire: Math.round(impotTotal),
    tranchesImpot: tranchesCalculees
  }
}

/**
 * Valide les éléments de paie avant calcul
 */
export function validerElementsPaie(elements: ElementsPaieEmploye): {
  valide: boolean
  erreurs: string[]
} {
  const erreurs: string[] = []

  // Validation du salaire de base
  if (elements.salaireBase <= 0) {
    erreurs.push("Le salaire de base doit être supérieur à 0")
  }

  if (elements.salaireBase < SEUILS_PAIE.SALAIRE_MINIMUM_SMIG) {
    erreurs.push(`Le salaire de base ne peut pas être inférieur au SMIG (${SEUILS_PAIE.SALAIRE_MINIMUM_SMIG} CFA)`)
  }

  // Validation des heures supplémentaires
  if (elements.heuresSupplementaires && elements.heuresSupplementaires < 0) {
    erreurs.push("Les heures supplémentaires ne peuvent pas être négatives")
  }

  if (elements.heuresSupplementaires && elements.heuresSupplementaires > 60) {
    erreurs.push("Les heures supplémentaires ne peuvent pas dépasser 60h par mois")
  }

  // Validation des primes
  if (elements.primeTransport && elements.primeTransport < 0) {
    erreurs.push("La prime de transport ne peut pas être négative")
  }

  if (elements.primesVariables && elements.primesVariables < 0) {
    erreurs.push("Les primes variables ne peuvent pas être négatives")
  }

  // Validation des avances
  if (elements.avances && elements.avances < 0) {
    erreurs.push("Les avances ne peuvent pas être négatives")
  }

  if (elements.avances && elements.avances > elements.salaireBase * 0.5) {
    erreurs.push("Les avances ne peuvent pas dépasser 50% du salaire de base")
  }

  return {
    valide: erreurs.length === 0,
    erreurs
  }
}

/**
 * Génère un récapitulatif de paie pour affichage
 */
export function genererRecapitulatifPaie(calcul: ResultatCalculPaie): string {
  const formatCFA = (montant: number) => 
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant)

  return `
RÉCAPITULATIF DE PAIE
=====================

ÉLÉMENTS DE RÉMUNÉRATION:
- Salaire de base: ${formatCFA(calcul.salaireBase)}
- Heures supplémentaires (${calcul.heuresSupplementaires}h): ${formatCFA(calcul.montantHeuresSupp)}
- Prime de transport: ${formatCFA(calcul.primeTransport)}
- Primes variables: ${formatCFA(calcul.primesVariables)}
- Primes fixes: ${formatCFA(calcul.primesFixes)}

SALAIRE BRUT: ${formatCFA(calcul.salaireBrut)}

COTISATIONS ET DÉDUCTIONS:
- Cotisation CNPS employé (3.2%): ${formatCFA(calcul.cotisationCNPSEmploye)}
- Impôt sur salaire: ${formatCFA(calcul.impotSurSalaire)}
- Avances: ${formatCFA(calcul.avances)}
- Autres déductions: ${formatCFA(calcul.autresDeductions)}

TOTAL DÉDUCTIONS: ${formatCFA(calcul.totalDeductions)}

SALAIRE NET À PAYER: ${formatCFA(calcul.salaireNet)}

CHARGES EMPLOYEUR:
- Cotisation CNPS employeur (16.4%): ${formatCFA(calcul.cotisationCNPSEmployeur)}
- COÛT TOTAL EMPLOYEUR: ${formatCFA(calcul.coutTotalEmployeur)}
  `
}

/**
 * Calcule la paie pour plusieurs employés
 */
export function calculerPaieMasse(
  employes: Array<{ id: string, elements: ElementsPaieEmploye }>
): {
  calculsIndividuels: Array<{ employeId: string, calcul: ResultatCalculPaie }>
  totaux: {
    nombreEmployes: number
    masseSalarialeBase: number
    masseSalarialeBrute: number
    totalCotisationsEmploye: number
    totalCotisationsEmployeur: number
    totalImpots: number
    masseSalarialeNette: number
    coutTotalEmployeur: number
  }
} {
  const calculsIndividuels = employes.map(employe => ({
    employeId: employe.id,
    calcul: calculerPaieEmploye(employe.elements)
  }))

  const totaux = calculsIndividuels.reduce(
    (acc, { calcul }) => ({
      nombreEmployes: acc.nombreEmployes + 1,
      masseSalarialeBase: acc.masseSalarialeBase + calcul.salaireBase,
      masseSalarialeBrute: acc.masseSalarialeBrute + calcul.salaireBrut,
      totalCotisationsEmploye: acc.totalCotisationsEmploye + calcul.cotisationCNPSEmploye,
      totalCotisationsEmployeur: acc.totalCotisationsEmployeur + calcul.cotisationCNPSEmployeur,
      totalImpots: acc.totalImpots + calcul.impotSurSalaire,
      masseSalarialeNette: acc.masseSalarialeNette + calcul.salaireNet,
      coutTotalEmployeur: acc.coutTotalEmployeur + calcul.coutTotalEmployeur
    }),
    {
      nombreEmployes: 0,
      masseSalarialeBase: 0,
      masseSalarialeBrute: 0,
      totalCotisationsEmploye: 0,
      totalCotisationsEmployeur: 0,
      totalImpots: 0,
      masseSalarialeNette: 0,
      coutTotalEmployeur: 0
    }
  )

  return { calculsIndividuels, totaux }
}