'use client'

/**
 * Page offline affichée quand l'utilisateur n'a pas de connexion internet
 * Optimisée pour le contexte ivoirien (data mobile coûteux)
 */
export default function OfflinePage() {
  const rechargerPage = () => {
    window.location.reload()
  }

  const allerAuDashboard = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icône offline */}
        <div className="text-6xl mb-4">📡</div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Mode hors ligne
        </h1>
        
        <p className="text-gray-600 mb-6">
          Vous n'êtes pas connecté à Internet. Certaines fonctionnalités 
          sont disponibles en mode offline.
        </p>

        {/* Fonctionnalités disponibles offline */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">
            Disponible sans connexion :
          </h3>
          <ul className="text-sm text-green-700 space-y-2 text-left">
            <li>✅ Consulter les données employés mises en cache</li>
            <li>✅ Calculer des paies (sauvegarde locale)</li>
            <li>✅ Voir les bulletins déjà générés</li>
            <li>✅ Préparer des déclarations CNPS</li>
          </ul>
        </div>

        {/* Fonctionnalités nécessitant une connexion */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-800 mb-3">
            Nécessite une connexion :
          </h3>
          <ul className="text-sm text-orange-700 space-y-2 text-left">
            <li>❌ Synchronisation des données</li>
            <li>❌ Envoi des bulletins par SMS/Email</li>
            <li>❌ Paiements mobile money</li>
            <li>❌ Sauvegarde dans le cloud</li>
          </ul>
        </div>

        {/* Conseils pour économiser la data */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-3">
            💡 Conseils pour économiser votre data :
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• Synchronisez en WiFi quand possible</li>
            <li>• Préparez vos bulletins offline</li>
            <li>• Utilisez le mode offline pour les calculs</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={rechargerPage}
            className="btn-primary w-full"
          >
            🔄 Vérifier la connexion
          </button>
          
          <button 
            onClick={allerAuDashboard}
            className="btn-outline w-full"
          >
            📊 Dashboard (mode offline)
          </button>
        </div>

        {/* Statut de connexion */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Hors ligne</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Vos données seront synchronisées dès le retour de la connexion
          </p>
        </div>
      </div>
    </div>
  )
}