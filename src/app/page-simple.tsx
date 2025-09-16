export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #ea580c 100%)',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.4375rem' // Réduit de moitié selon préférence utilisateur
    }}>
      {/* Header */}
      <header style={{ marginBottom: '3rem' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#1e3a8a', fontWeight: 'bold', fontSize: '1rem' }}>RH</span>
            </div>
            <span style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600' }}>SaaS RH CI</span>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ textAlign: 'center', color: 'white' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem',
          lineHeight: '1.2'
        }}>
          Gestion RH simplifiée<br />
          <span style={{ color: '#fed7aa' }}>pour PME ivoiriennes</span>
        </h1>
        
        <p style={{ 
          fontSize: '1rem', 
          marginBottom: '2rem', 
          maxWidth: '600px', 
          margin: '0 auto 2rem auto',
          lineHeight: '1.6',
          color: '#e0e7ff'
        }}>
          Digitalisez votre gestion RH avec calcul de paie automatisé, 
          conformité CNPS et paiements mobile money. Spécialement conçu 
          pour les entreprises de 20 à 100 employés en Côte d'Ivoire.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <button style={{
            backgroundColor: '#ea580c',
            color: 'white',
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Démonstration gratuite
          </button>
          <button style={{
            backgroundColor: 'transparent',
            color: 'white',
            padding: '0.75rem 2rem',
            border: '2px solid white',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Commencer gratuitement
          </button>
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>
          ✓ Gratuit jusqu'à 5 employés ✓ Configuration en 15 minutes ✓ Support français
        </p>

        {/* Statistiques clés */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '2rem', 
          marginTop: '3rem',
          maxWidth: '600px',
          margin: '3rem auto 0'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>100k</div>
            <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>CFA/mois objectif</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>15min</div>
            <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>Configuration</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CNPS</div>
            <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>100% conforme</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>24/7</div>
            <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>Support dédié</div>
          </div>
        </div>
      </main>

      {/* Fonctionnalités principales */}
      <section style={{ 
        backgroundColor: 'white', 
        margin: '4rem -2rem 0', 
        padding: '3rem 2rem',
        color: '#1f2937'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Tout ce dont vous avez besoin pour gérer vos employés
          </h2>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Une solution complète pensée pour le contexte ivoirien et les besoins des PME locales.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem'
        }}>
          {/* Gestion des employés */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#dbeafe',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              👥
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Gestion des Employés
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
              Profils complets, documents, historique des modifications. 
              Support CDI, CDD, stagiaires et consultants.
            </p>
            <ul style={{ fontSize: '0.625rem', color: '#9ca3af', textAlign: 'left' }}>
              <li>✓ Upload documents (CV, contrats)</li>
              <li>✓ Numéros CNPS intégrés</li>
              <li>✓ Historique promotions/sanctions</li>
            </ul>
          </div>

          {/* Calcul de paie */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#fed7aa',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              💰
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Paie Automatisée
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
              Calcul automatique conformité CNPS (3.2% + 16.4%) et barème fiscal ivoirien.
            </p>
            <ul style={{ fontSize: '0.625rem', color: '#9ca3af', textAlign: 'left' }}>
              <li>✓ Bulletins conformes code du travail</li>
              <li>✓ Heures sup, primes, avances</li>
              <li>✓ Export PDF + Excel</li>
            </ul>
          </div>

          {/* Paiements mobile */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#d1fae5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              📱
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Mobile Money
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
              Intégration Orange Money, Wave, MTN pour paiements directs des salaires.
            </p>
            <ul style={{ fontSize: '0.625rem', color: '#9ca3af', textAlign: 'left' }}>
              <li>✓ Virement automatique</li>
              <li>✓ Notifications SMS</li>
              <li>✓ Tracking en temps réel</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ 
        textAlign: 'center', 
        marginTop: '4rem', 
        color: 'white' 
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Prêt à simplifier votre gestion RH ?
        </h2>
        <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#bfdbfe' }}>
          Rejoignez les PME ivoiriennes qui ont déjà digitalisé leur RH
        </p>
        <button style={{
          backgroundColor: '#ea580c',
          color: 'white',
          padding: '1rem 2rem',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          Commencer gratuitement
        </button>
        <p style={{ fontSize: '0.75rem', color: '#bfdbfe', marginTop: '1rem' }}>
          Configuration en 15 minutes • Support en français • Sans engagement
        </p>
      </section>
    </div>
  )
}