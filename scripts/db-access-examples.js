// Exemples d'accès à la base de données via Prisma
// Pour tester : node scripts/db-access-examples.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function exemples() {
  try {
    console.log('🔗 Connexion à la base de données...')

    // 1. Lister toutes les entreprises
    console.log('\n📢 Entreprises:')
    const entreprises = await prisma.entreprise.findMany({
      select: {
        id: true,
        nom: true,
        email: true,
        planAbonnement: true,
        _count: {
          select: {
            employes: true,
            utilisateurs: true
          }
        }
      }
    })
    console.table(entreprises)

    // 2. Lister les employés actifs
    console.log('\n👥 Employés actifs:')
    const employes = await prisma.employe.findMany({
      where: { statut: 'ACTIF' },
      select: {
        matricule: true,
        nom: true,
        prenom: true,
        poste: true,
        salaireBrut: true,
        entreprise: {
          select: { nom: true }
        }
      },
      take: 10
    })
    console.table(employes)

    // 3. Statistiques de paie
    console.log('\n💰 Statistiques de paie:')
    const statsPaie = await prisma.bulletinPaie.aggregate({
      _count: { id: true },
      _sum: { 
        salaireBrut: true,
        salaireNet: true,
        cotisationCNPSEmploye: true,
        cotisationCNPSEmployeur: true
      },
      _avg: {
        salaireBrut: true,
        salaireNet: true
      }
    })
    console.log('Bulletins générés:', statsPaie._count.id)
    console.log('Masse salariale brute:', statsPaie._sum.salaireBrut?.toFixed(0), 'CFA')
    console.log('Masse salariale nette:', statsPaie._sum.salaireNet?.toFixed(0), 'CFA')
    console.log('Salaire moyen brut:', statsPaie._avg.salaireBrut?.toFixed(0), 'CFA')

    // 4. Bulletins de paie récents
    console.log('\n📄 Bulletins récents:')
    const bulletinsRecents = await prisma.bulletinPaie.findMany({
      include: {
        employe: {
          select: { nom: true, prenom: true }
        }
      },
      orderBy: { dateGeneration: 'desc' },
      take: 5
    })
    
    bulletinsRecents.forEach(bulletin => {
      console.log(`${bulletin.employe.prenom} ${bulletin.employe.nom} - ${bulletin.periode} - ${bulletin.salaireNet} CFA`)
    })

    // 5. Vérifier les déclarations CNPS
    console.log('\n🏛️ Déclarations CNPS:')
    const declarationsCNPS = await prisma.declarationCNPS.findMany({
      select: {
        periode: true,
        nombreEmployes: true,
        masseSalariale: true,
        totalCotisations: true,
        statut: true,
        entreprise: {
          select: { nom: true }
        }
      },
      orderBy: { dateGeneration: 'desc' },
      take: 5
    })
    console.table(declarationsCNPS)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
    console.log('\n✅ Connexion fermée')
  }
}

// Exécuter les exemples
exemples()