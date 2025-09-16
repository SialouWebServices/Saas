export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #ea580c 100%)',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      fontSize: '0.4375rem', // Réduit de moitié selon préférence utilisateur
      color: 'white'
    }}>
      {/* Header */}
      <header style={{ marginBottom: '3rem' }}>
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
      </header>

      {/* Hero Section */}
      <main style={{ textAlign: 'center' }}>
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

      {/* Message de statut */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        marginTop: '3rem',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Plateforme SaaS RH - MVP Réalisé avec Succès! 🎉</h3>
        <p style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>
          ✓ Architecture Next.js + TypeScript ✓ Base de données PostgreSQL/Prisma<br/>
          ✓ Calcul paie conforme CNPS ✓ Intégrations Orange Money/Wave<br/>
          ✓ Mode offline & PWA ✓ Optimisé pour connexions lentes CI<br/>
          <strong>Application déployée avec succès !</strong>
        </p>
      </div>
    </div>
  )
}

