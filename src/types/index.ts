// Types pour l'application SaaS RH Côte d'Ivoire

import type { 
  Entreprise, 
  User, 
  Employe, 
  BulletinPaie, 
  DeclarationCNPS,
  HistoriqueEmploye,
  PlanAbonnement,
  StatutAbonnement,
  StatutEmploye,
  ModePaiement,
  StatutBulletin,
  StatutDeclaration,
  TypeModificationEmploye,
  RoleUtilisateur
} from '@prisma/client'

// Types étendus avec relations
export type EntrepriseComplete = Entreprise & {
  utilisateurs: User[]
  employes: Employe[]
  bulletinsPaie: BulletinPaie[]
  declarationsCNPS: DeclarationCNPS[]
}

export type EmployeComplete = Employe & {
  entreprise: Entreprise
  bulletinsPaie: BulletinPaie[]
  historiqueEmploye: HistoriqueEmploye[]
}

export type BulletinPaieComplete = BulletinPaie & {
  employe: Employe
  entreprise: Entreprise
}

// Types pour les formulaires
export type CreerEntrepriseData = {
  nom: string
  rccm: string
  secteur: string
  adresse: string
  telephone: string
  email: string
  nomAdmin: string
  prenomAdmin: string
  emailAdmin: string
  motDePasseAdmin: string
}

export type CreerEmployeData = {
  nom: string
  prenom: string
  email?: string
  telephone?: string
  poste: string
  departement?: string
  statut: StatutEmploye
  dateEmbauche: Date
  dateFinContrat?: Date
  salaireBase: number
  primeTransport?: number
  primesFixes?: number
  modePaiement: ModePaiement
  numeroCompte?: string
  banque?: string
  numeroMobileMoney?: string
  operateurMobileMoney?: string
  numeroCNPS?: string
}

export type ModifierEmployeData = Partial<CreerEmployeData> & {
  id: string
}

// Types pour le calcul de paie
export type ElementsPaie = {
  salaireBase: number
  heuresSupp?: number
  tauxHeuresSupp?: number
  primeTransport?: number
  primesVariables?: number
  avances?: number
}

export type CalculPaieResult = {
  salaireBrut: number
  cotisationCNPSEmploye: number
  cotisationCNPSEmployeur: number
  impotSurSalaire: number
  salaireNet: number
  totalChargesSociales: number
  coutTotal: number // Pour l'employeur
}

// Types pour les déclarations CNPS
export type DeclarationCNPSData = {
  mois: number
  annee: number
  employes: {
    employeId: string
    nom: string
    prenom: string
    numeroCNPS: string
    salaireBase: number
    cotisationEmploye: number
    cotisationEmployeur: number
  }[]
  totaux: {
    nombreEmployes: number
    masseSalariale: number
    totalCotisationsEmploye: number
    totalCotisationsEmployeur: number
    totalCotisations: number
  }
}

// Types pour les statistiques du dashboard
export type StatistiquesEntreprise = {
  nombreEmployes: number
  masseSalarialeActuelle: number
  evolutionMasseSalariale: {
    mois: string
    montant: number
  }[]
  repartitionParDepartement: {
    departement: string
    nombre: number
    pourcentage: number
  }[]
  prochaines_echeances: {
    type: 'paie' | 'cnps' | 'contrat'
    description: string
    date: Date
    urgent: boolean
  }[]
}

// Types pour l'onboarding
export type EtapeOnboarding = {
  numero: number
  titre: string
  description: string
  terminee: boolean
  enCours: boolean
}

export type ProgressionOnboarding = {
  etapeActuelle: number
  totalEtapes: number
  pourcentageComplete: number
  etapes: EtapeOnboarding[]
}

// Types pour les plans d'abonnement
export type DetailsPlan = {
  nom: string
  prix: number
  devise: string
  maxEmployes: number
  fonctionnalites: string[]
  populaire?: boolean
}

export type PlansAbonnement = {
  [key in PlanAbonnement]: DetailsPlan
}

// Types pour les notifications
export type TypeNotification = 'success' | 'error' | 'warning' | 'info'

export type Notification = {
  id: string
  type: TypeNotification
  titre: string
  message: string
  dateCreation: Date
  lue: boolean
  action?: {
    texte: string
    url: string
  }
}

// Types pour l'import/export
export type FormatImportEmploye = {
  nom: string
  prenom: string
  email?: string
  telephone?: string
  poste: string
  departement?: string
  dateEmbauche: string // Format DD/MM/YYYY
  salaireBase: number
  numeroCNPS?: string
  modePaiement: string
  numeroCompte?: string
  banque?: string
}

export type ResultatImport = {
  totalLignes: number
  importesAvecSucces: number
  erreurs: {
    ligne: number
    erreur: string
  }[]
  donneesImportees: CreerEmployeData[]
}

// Types pour les APIs de paiement mobile
export type TransactionPaiement = {
  id: string
  employeId: string
  montant: number
  devise: string
  modePaiement: ModePaiement
  numeroDestinataire: string
  statut: 'en_attente' | 'succes' | 'echec'
  referenceTransaction?: string
  dateCreation: Date
  dateTraitement?: Date
  messageErreur?: string
}

// Types pour la localisation
export type LocaleCI = {
  langue: 'fr'
  pays: 'CI'
  fuseau: 'GMT+0'
  devise: 'XOF'
  formatDate: 'DD/MM/YYYY'
}

// Types pour les erreurs de validation
export type ErreurValidation = {
  champ: string
  message: string
  code: string
}

// Export des enums Prisma pour utilisation dans les composants
export {
  PlanAbonnement,
  StatutAbonnement,
  StatutEmploye,
  ModePaiement,
  StatutBulletin,
  StatutDeclaration,
  TypeModificationEmploye,
  RoleUtilisateur
}