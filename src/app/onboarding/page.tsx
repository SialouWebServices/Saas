'use client'

import { useState } from 'react'

// Types pour l'onboarding
type EtapeOnboarding = 'entreprise' | 'admin' | 'employes' | 'paie' | 'finalisation'

type DonneesEntreprise = {
  nom: string
  rccm: string
  secteur: string
  adresse: string
  telephone: string
  email: string
}

type DonneesAdmin = {
  nom: string
  prenom: string
  email: string
  motDePasse: string
  confirmationMotDePasse: string
}

type EmployeImport = {
  nom: string
  prenom: string
  poste: string
  salaireBase: number
  email?: string
  telephone?: string
}

type ParametragePaie = {
  joursOuvrables: number
  heuresParJour: number
  tauxHeuresSupp: number
  primeTransportParDefaut: number
}

/**
 * Composant principal d'onboarding
 */
export default function OnboardingWizard() {
  const [etapeActuelle, setEtapeActuelle] = useState<EtapeOnboarding>('entreprise')
  const [progression, setProgression] = useState(0)
  
  // États des données collectées
  const [donneesEntreprise, setDonneesEntreprise] = useState<DonneesEntreprise>({
    nom: '',
    rccm: '',
    secteur: '',
    adresse: '',
    telephone: '',
    email: ''
  })
  
  const [donneesAdmin, setDonneesAdmin] = useState<DonneesAdmin>({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmationMotDePasse: ''
  })
  
  const [employes, setEmployes] = useState<EmployeImport[]>([])
  const [parametragePaie, setParametragePaie] = useState<ParametragePaie>({
    joursOuvrables: 22,
    heuresParJour: 8,
    tauxHeuresSupp: 1.25,
    primeTransportParDefaut: 25000
  })

  // Calcul de la progression
  const etapes: EtapeOnboarding[] = ['entreprise', 'admin', 'employes', 'paie', 'finalisation']
  const indexEtapeActuelle = etapes.indexOf(etapeActuelle)
  const progressionPourcentage = ((indexEtapeActuelle + 1) / etapes.length) * 100

  // Navigation entre étapes
  const allerEtapeSuivante = () => {
    const indexActuel = etapes.indexOf(etapeActuelle)
    if (indexActuel < etapes.length - 1) {
      setEtapeActuelle(etapes[indexActuel + 1])
    }
  }

  const allerEtapePrecedente = () => {
    const indexActuel = etapes.indexOf(etapeActuelle)
    if (indexActuel > 0) {
      setEtapeActuelle(etapes[indexActuel - 1])
    }
  }

  // Validation des étapes
  const validerEtapeEntreprise = (): boolean => {
    return !!(donneesEntreprise.nom && donneesEntreprise.rccm && 
             donneesEntreprise.secteur && donneesEntreprise.email)
  }

  const validerEtapeAdmin = (): boolean => {
    return !!(donneesAdmin.nom && donneesAdmin.prenom && donneesAdmin.email && 
             donneesAdmin.motDePasse && donneesAdmin.motDePasse === donneesAdmin.confirmationMotDePasse)
  }

  const ajouterEmploye = () => {
    setEmployes([...employes, {
      nom: '',
      prenom: '',
      poste: '',
      salaireBase: 0
    }])
  }

  const supprimerEmploye = (index: number) => {
    setEmployes(employes.filter((_, i) => i !== index))
  }

  const mettreAJourEmploye = (index: number, champ: keyof EmployeImport, valeur: string | number) => {
    const nouveauxEmployes = [...employes]
    nouveauxEmployes[index] = { ...nouveauxEmployes[index], [champ]: valeur }
    setEmployes(nouveauxEmployes)
  }

  const finaliserOnboarding = async () => {
    // TODO: Sauvegarder toutes les données en base
    console.log('Finalisation onboarding:', {
      entreprise: donneesEntreprise,
      admin: donneesAdmin,
      employes,
      parametragePaie
    })
    
    // Rediriger vers le dashboard
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Header avec progression */}
      <div className="bg-white shadow-sm">
        <div className="container-mobile py-4">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Configuration de votre entreprise</h1>
            <p className="text-sm text-gray-600">Temps estimé : 15 minutes</p>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressionPourcentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Étape {indexEtapeActuelle + 1}</span>
            <span>{Math.round(progressionPourcentage)}% terminé</span>
            <span>{etapes.length} étapes</span>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container-mobile py-6">
        {/* Étape 1: Informations entreprise */}
        {etapeActuelle === 'entreprise' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-center">
              📋 Informations de votre entreprise
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Nom de l'entreprise *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: SARL TECH SOLUTIONS"
                  value={donneesEntreprise.nom}
                  onChange={(e) => setDonneesEntreprise({...donneesEntreprise, nom: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">Numéro RCCM *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: CI-ABJ-2023-B-12345"
                  value={donneesEntreprise.rccm}
                  onChange={(e) => setDonneesEntreprise({...donneesEntreprise, rccm: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">Secteur d'activité *</label>
                <select
                  className="input-field"
                  value={donneesEntreprise.secteur}
                  onChange={(e) => setDonneesEntreprise({...donneesEntreprise, secteur: e.target.value})}
                >
                  <option value="">Sélectionner un secteur</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Construction">Construction</option>
                  <option value="Éducation">Éducation</option>
                  <option value="Finance">Finance</option>
                  <option value="Industrie">Industrie</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Santé">Santé</option>
                  <option value="Services">Services</option>
                  <option value="Transport">Transport</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="label">Adresse complète</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Ex: Cocody, Angré 7ème Tranche, Abidjan"
                  value={donneesEntreprise.adresse}
                  onChange={(e) => setDonneesEntreprise({...donneesEntreprise, adresse: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Téléphone</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+225 XX XX XX XX XX"
                    value={donneesEntreprise.telephone}
                    onChange={(e) => setDonneesEntreprise({...donneesEntreprise, telephone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="label">Email professionnel *</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="contact@entreprise.ci"
                    value={donneesEntreprise.email}
                    onChange={(e) => setDonneesEntreprise({...donneesEntreprise, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={allerEtapeSuivante}
                disabled={!validerEtapeEntreprise()}
                className="btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Compte administrateur */}
        {etapeActuelle === 'admin' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-center">
              👤 Compte administrateur
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Ce compte vous permettra de gérer la plateforme RH
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Votre nom"
                    value={donneesAdmin.nom}
                    onChange={(e) => setDonneesAdmin({...donneesAdmin, nom: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="label">Prénom *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Votre prénom"
                    value={donneesAdmin.prenom}
                    onChange={(e) => setDonneesAdmin({...donneesAdmin, prenom: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Email de connexion *</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="votre.email@entreprise.ci"
                  value={donneesAdmin.email}
                  onChange={(e) => setDonneesAdmin({...donneesAdmin, email: e.target.value})}
                />
              </div>
              
              <div>
                <label className="label">Mot de passe *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Minimum 8 caractères"
                  value={donneesAdmin.motDePasse}
                  onChange={(e) => setDonneesAdmin({...donneesAdmin, motDePasse: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>
              
              <div>
                <label className="label">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Retapez le mot de passe"
                  value={donneesAdmin.confirmationMotDePasse}
                  onChange={(e) => setDonneesAdmin({...donneesAdmin, confirmationMotDePasse: e.target.value})}
                />
                {donneesAdmin.motDePasse && donneesAdmin.confirmationMotDePasse && 
                 donneesAdmin.motDePasse !== donneesAdmin.confirmationMotDePasse && (
                  <p className="text-xs text-red-500 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button onClick={allerEtapePrecedente} className="btn-outline">
                ← Retour
              </button>
              <button
                onClick={allerEtapeSuivante}
                disabled={!validerEtapeAdmin()}
                className="btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Import employés */}
        {etapeActuelle === 'employes' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-center">
              👥 Vos employés
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Ajoutez vos employés un par un ou importez depuis Excel
            </p>
            
            {/* Options d'ajout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button onClick={ajouterEmploye} className="btn-primary">
                + Ajouter un employé
              </button>
              <button className="btn-outline">
                📄 Importer depuis Excel
              </button>
            </div>
            
            {/* Liste des employés */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {employes.map((employe, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium">Employé #{index + 1}</span>
                    <button
                      onClick={() => supprimerEmploye(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nom"
                      className="input-field"
                      value={employe.nom}
                      onChange={(e) => mettreAJourEmploye(index, 'nom', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Prénom"
                      className="input-field"
                      value={employe.prenom}
                      onChange={(e) => mettreAJourEmploye(index, 'prenom', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Poste"
                      className="input-field"
                      value={employe.poste}
                      onChange={(e) => mettreAJourEmploye(index, 'poste', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Salaire de base (CFA)"
                      className="input-field"
                      value={employe.salaireBase || ''}
                      onChange={(e) => mettreAJourEmploye(index, 'salaireBase', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {employes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun employé ajouté pour le moment</p>
                <p className="text-sm">Vous pourrez en ajouter plus tard depuis le dashboard</p>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <button onClick={allerEtapePrecedente} className="btn-outline">
                ← Retour
              </button>
              <button onClick={allerEtapeSuivante} className="btn-primary">
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Étape 4: Paramétrage paie */}
        {etapeActuelle === 'paie' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-center">
              💰 Paramètres de paie
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Configuration par défaut pour le calcul des salaires
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Jours ouvrables par mois</label>
                  <input
                    type="number"
                    className="input-field"
                    value={parametragePaie.joursOuvrables}
                    onChange={(e) => setParametragePaie({
                      ...parametragePaie, 
                      joursOuvrables: parseInt(e.target.value) || 22
                    })}
                  />
                </div>
                
                <div>
                  <label className="label">Heures par jour</label>
                  <input
                    type="number"
                    className="input-field"
                    value={parametragePaie.heuresParJour}
                    onChange={(e) => setParametragePaie({
                      ...parametragePaie, 
                      heuresParJour: parseInt(e.target.value) || 8
                    })}
                  />
                </div>
              </div>
              
              <div>
                <label className="label">Taux des heures supplémentaires</label>
                <select
                  className="input-field"
                  value={parametragePaie.tauxHeuresSupp}
                  onChange={(e) => setParametragePaie({
                    ...parametragePaie, 
                    tauxHeuresSupp: parseFloat(e.target.value)
                  })}
                >
                  <option value={1.25}>125% (recommandé)</option>
                  <option value={1.5}>150%</option>
                  <option value={2}>200%</option>
                </select>
              </div>
              
              <div>
                <label className="label">Prime de transport par défaut (CFA)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="25000"
                  value={parametragePaie.primeTransportParDefaut}
                  onChange={(e) => setParametragePaie({
                    ...parametragePaie, 
                    primeTransportParDefaut: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              
              {/* Aperçu des calculs CNPS */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Rappel CNPS</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Cotisation employé : 3,2% du salaire brut</li>
                  <li>• Cotisation employeur : 16,4% du salaire brut</li>
                  <li>• Total cotisations : 19,6% du salaire brut</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button onClick={allerEtapePrecedente} className="btn-outline">
                ← Retour
              </button>
              <button onClick={allerEtapeSuivante} className="btn-primary">
                Finaliser →
              </button>
            </div>
          </div>
        )}

        {/* Étape 5: Finalisation */}
        {etapeActuelle === 'finalisation' && (
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              Configuration terminée !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre plateforme SaaS RH est prête à être utilisée
            </p>
            
            {/* Récapitulatif */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-3">Récapitulatif :</h3>
              <ul className="space-y-2 text-sm">
                <li>✅ Entreprise : {donneesEntreprise.nom}</li>
                <li>✅ Administrateur : {donneesAdmin.prenom} {donneesAdmin.nom}</li>
                <li>✅ Employés ajoutés : {employes.length}</li>
                <li>✅ Paramètres de paie configurés</li>
              </ul>
            </div>
            
            {/* Prochaines étapes */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-3 text-blue-900">Prochaines étapes :</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>1. 📊 Consulter votre dashboard</li>
                <li>2. 💰 Traiter votre première paie</li>
                <li>3. 📄 Générer vos premiers bulletins</li>
                <li>4. 📋 Déclarer à la CNPS</li>
              </ul>
            </div>
            
            <div className="flex justify-between">
              <button onClick={allerEtapePrecedente} className="btn-outline">
                ← Modifier
              </button>
              <button onClick={finaliserOnboarding} className="btn-primary text-lg px-8">
                Accéder au dashboard →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer avec aide */}
      <div className="bg-white border-t mt-8">
        <div className="container-mobile py-4 text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide ? 
            <a href="tel:+225XXXXXXXX" className="text-primary ml-1 hover:underline">
              Appelez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}