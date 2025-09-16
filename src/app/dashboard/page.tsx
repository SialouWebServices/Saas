'use client'

import { useState } from 'react'

// Types temporaires pour le développement (en attendant Prisma)
type StatEmploye = {
  total: number
  actifs: number
  cdi: number
  cdd: number
  stagiaires: number
}

type StatFinanciere = {
  masseSalariale: number
  cotisationsCNPS: number
  impots: number
  coutTotal: number
}

type Echeance = {
  id: string
  type: 'paie' | 'cnps' | 'contrat'
  description: string
  date: string
  urgent: boolean
}

// Page dashboard principal
export default function DashboardPage() {
  const [currentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear] = useState(new Date().getFullYear())

  // Données simulées pour la démonstration
  const statsEmployes: StatEmploye = {
    total: 45,
    actifs: 43,
    cdi: 38,
    cdd: 5,
    stagiaires: 2
  }

  const statsFinancieres: StatFinanciere = {
    masseSalariale: 18750000, // 18,75M CFA
    cotisationsCNPS: 3562500, // ~19% du salaire brut
    impots: 1125000,
    coutTotal: 23437500
  }

  const prochaines_echeances: Echeance[] = [
    {
      id: '1',
      type: 'paie',
      description: 'Traitement de la paie de janvier 2024',
      date: '2024-01-31',
      urgent: true
    },
    {
      id: '2', 
      type: 'cnps',
      description: 'Déclaration CNPS janvier 2024',
      date: '2024-02-15',
      urgent: false
    },
    {
      id: '3',
      type: 'contrat',
      description: 'Fin de contrat CDD - Marie KONE',
      date: '2024-02-28',
      urgent: false
    }
  ]

  const evolutionMasseSalariale = [
    { mois: 'Oct', montant: 17200000 },
    { mois: 'Nov', montant: 18100000 },
    { mois: 'Déc', montant: 18750000 },
    { mois: 'Jan', montant: 18750000 }
  ]

  const formatCFA = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant)
  }

  const isDateUrgente = (dateStr: string): boolean => {
    const date = new Date(dateStr)
    const aujourd_hui = new Date()
    const diffJours = Math.ceil((date.getTime() - aujourd_hui.getTime()) / (1000 * 3600 * 24))
    return diffJours <= 3
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="container-desktop py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">RH</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">SaaS RH CI</h1>
                <p className="text-sm text-gray-500">SARL TECH SOLUTIONS</p>
              </div>
            </div>
            
            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/dashboard" className="text-primary font-medium">Tableau de bord</a>
              <a href="/dashboard/employes" className="text-gray-600 hover:text-primary">Employés</a>
              <a href="/dashboard/paie" className="text-gray-600 hover:text-primary">Paie</a>
              <a href="/dashboard/cnps" className="text-gray-600 hover:text-primary">CNPS</a>
              <a href="/dashboard/parametres" className="text-gray-600 hover:text-primary">Paramètres</a>
            </nav>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12h5v12z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container-desktop py-6">
        {/* Titre et actions rapides */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Tableau de bord
            </h2>
            <p className="text-gray-600">
              Vue d'ensemble de votre gestion RH - {currentMonth}/{currentYear}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <button className="btn-secondary">
              Traiter la paie
            </button>
            <button className="btn-outline">
              Ajouter un employé
            </button>
          </div>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total employés */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total employés</p>
                <p className="text-3xl font-bold text-gray-900">{statsEmployes.total}</p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">{statsEmployes.actifs}</span> actifs
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Masse salariale */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Masse salariale</p>
                <p className="text-2xl font-bold text-gray-900">{formatCFA(statsFinancieres.masseSalariale)}</p>
                <p className="text-sm text-gray-500">Ce mois</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Cotisations CNPS */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cotisations CNPS</p>
                <p className="text-2xl font-bold text-gray-900">{formatCFA(statsFinancieres.cotisationsCNPS)}</p>
                <p className="text-sm text-gray-500">À déclarer</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Coût total */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Coût total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCFA(statsFinancieres.coutTotal)}</p>
                <p className="text-sm text-gray-500">Charges incluses</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal en deux colonnes */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Graphique évolution (2/3 de la largeur) */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Évolution de la masse salariale</h3>
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1">
                <option>6 derniers mois</option>
                <option>12 derniers mois</option>
              </select>
            </div>
            
            {/* Graphique simple en barres */}
            <div className="space-y-4">
              {evolutionMasseSalariale.map((data, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-12 text-sm text-gray-600">{data.mois}</div>
                  <div className="flex-1 ml-4">
                    <div className="bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className="bg-primary rounded-full h-6 flex items-center justify-end pr-2"
                        style={{ width: `${(data.montant / 20000000) * 100}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {formatCFA(data.montant)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Répartition des employés (1/3 de la largeur) */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition employés</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CDI</span>
                <span className="font-medium">{statsEmployes.cdi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CDD</span>
                <span className="font-medium">{statsEmployes.cdd}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stagiaires</span>
                <span className="font-medium">{statsEmployes.stagiaires}</span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: '84%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">84% en CDI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prochaines échéances */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Prochaines échéances</h3>
            <a href="/dashboard/calendrier" className="text-primary text-sm hover:underline">
              Voir tout le calendrier
            </a>
          </div>
          
          <div className="space-y-4">
            {prochaines_echeances.map((echeance) => (
              <div key={echeance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    echeance.urgent ? 'bg-red-500' : 
                    echeance.type === 'paie' ? 'bg-blue-500' :
                    echeance.type === 'cnps' ? 'bg-orange-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{echeance.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(echeance.date).toLocaleDateString('fr-FR')}
                      {isDateUrgente(echeance.date) && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Urgent
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button className="text-primary hover:text-primary/80">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Navigation mobile */}
      <nav className="mobile-nav md:hidden">
        <div className="flex justify-around py-2">
          <a href="/dashboard" className="flex flex-col items-center p-2 text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <span className="text-xs mt-1">Accueil</span>
          </a>
          <a href="/dashboard/employes" className="flex flex-col items-center p-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-xs mt-1">Employés</span>
          </a>
          <a href="/dashboard/paie" className="flex flex-col items-center p-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-xs mt-1">Paie</span>
          </a>
          <a href="/dashboard/cnps" className="flex flex-col items-center p-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs mt-1">CNPS</span>
          </a>
          <a href="/dashboard/plus" className="flex flex-col items-center p-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span className="text-xs mt-1">Plus</span>
          </a>
        </div>
      </nav>
    </div>
  )
}