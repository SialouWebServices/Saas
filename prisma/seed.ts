import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Génération des données de test pour SaaS RH CI...')

  // 1. Créer une entreprise de test
  const entreprise = await prisma.entreprise.upsert({
    where: { email: 'contact@techsolutions.ci' },
    update: {},
    create: {
      nom: 'SARL TECH SOLUTIONS',
      rccm: 'CI-ABJ-2023-B-12345',
      secteur: 'Informatique',
      adresse: 'Cocody, Angré 7ème Tranche, Abidjan',
      telephone: '+225 27 22 45 67 89',
      email: 'contact@techsolutions.ci',
      planAbonnement: 'PRO',
      statutAbonnement: 'ACTIF'
    }
  })

  console.log('✅ Entreprise créée:', entreprise.nom)

  // 2. Créer un utilisateur admin
  const motDePasseHash = await hash('password123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@techsolutions.ci' },
    update: {},
    create: {
      email: 'admin@techsolutions.ci',
      nom: 'KOUAME',
      prenom: 'Jean',
      motDePasse: motDePasseHash,
      role: 'ADMIN_ENTREPRISE',
      entrepriseId: entreprise.id
    }
  })

  console.log('✅ Utilisateur admin créé:', admin.email)

  // 3. Créer des employés de test
  const employes = [
    {
      nom: 'KOUAME',
      prenom: 'Marie',
      email: 'marie.kouame@techsolutions.ci',
      telephone: '+225 07 12 34 56 78',
      poste: 'Développeuse Senior',
      departement: 'IT',
      statut: 'CDI',
      dateEmbauche: new Date('2023-03-15'),
      salaireBase: 450000,
      primeTransport: 25000,
      primesFixes: 0,
      modePaiement: 'ORANGE_MONEY',
      numeroMobileMoney: '07 12 34 56 78',
      operateurMobileMoney: 'Orange Money',
      numeroCNPS: '123456789'
    },
    {
      nom: 'TRAORE',
      prenom: 'Ibrahim',
      email: 'ibrahim.traore@techsolutions.ci',
      telephone: '+225 05 98 76 54 32',
      poste: 'Chef de projet',
      departement: 'Management',
      statut: 'CDI',
      dateEmbauche: new Date('2022-08-01'),
      salaireBase: 600000,
      primeTransport: 30000,
      primesFixes: 50000,
      modePaiement: 'VIREMENT_BANCAIRE',
      numeroCompte: 'CI05CI0580000123456789012',
      banque: 'SGBCI',
      numeroCNPS: '987654321'
    },
    {
      nom: 'YAO',
      prenom: 'Prisca',
      email: 'prisca.yao@techsolutions.ci',
      telephone: '+225 07 11 22 33 44',
      poste: 'Comptable',
      departement: 'Finance',
      statut: 'CDI',
      dateEmbauche: new Date('2023-01-10'),
      salaireBase: 350000,
      primeTransport: 25000,
      primesFixes: 0,
      modePaiement: 'WAVE',
      numeroMobileMoney: '07 11 22 33 44',
      operateurMobileMoney: 'Wave',
      numeroCNPS: '456789123'
    },
    {
      nom: 'KONE',
      prenom: 'Amadou',
      email: 'amadou.kone@techsolutions.ci',
      telephone: '+225 06 55 44 33 22',
      poste: 'Commercial',
      departement: 'Ventes',
      statut: 'CDD',
      dateEmbauche: new Date('2023-10-01'),
      dateFinContrat: new Date('2024-03-31'),
      salaireBase: 280000,
      primeTransport: 20000,
      primesFixes: 0,
      modePaiement: 'MTN_MOMO',
      numeroMobileMoney: '06 55 44 33 22',
      operateurMobileMoney: 'MTN Mobile Money',
      numeroCNPS: '789123456'
    },
    {
      nom: 'DIALLO',
      prenom: 'Fatou',
      email: 'fatou.diallo@techsolutions.ci',
      poste: 'Stagiaire Marketing',
      departement: 'Marketing',
      statut: 'STAGE',
      dateEmbauche: new Date('2024-01-15'),
      dateFinContrat: new Date('2024-06-15'),
      salaireBase: 100000,
      primeTransport: 15000,
      primesFixes: 0,
      modePaiement: 'ORANGE_MONEY',
      numeroMobileMoney: '07 99 88 77 66',
      operateurMobileMoney: 'Orange Money'
    }
  ]

  console.log('📝 Création des employés...')
  
  for (const [index, employeData] of employes.entries()) {
    const numeroEmploye = `EMP-${entreprise.id.slice(-3).toUpperCase()}-${(index + 1).toString().padStart(4, '0')}`
    
    await prisma.employe.upsert({
      where: { 
        entrepriseId_email: {
          entrepriseId: entreprise.id,
          email: employeData.email || `${employeData.prenom.toLowerCase()}.${employeData.nom.toLowerCase()}@techsolutions.ci`
        }
      },
      update: {},
      create: {
        ...employeData,
        numero: numeroEmploye,
        entrepriseId: entreprise.id,
        email: employeData.email || `${employeData.prenom.toLowerCase()}.${employeData.nom.toLowerCase()}@techsolutions.ci`
      }
    })
    
    console.log(`✅ Employé créé: ${employeData.prenom} ${employeData.nom} (${numeroEmploye})`)
  }

  // 4. Générer des bulletins de paie pour janvier 2024
  console.log('💰 Génération des bulletins de paie de janvier 2024...')
  
  const employesActifs = await prisma.employe.findMany({
    where: { entrepriseId: entreprise.id }
  })

  for (const employe of employesActifs) {
    const numeroBulletin = `BP-${entreprise.id.slice(-3).toUpperCase()}-202401-${employe.id.slice(-3).toUpperCase()}`
    
    // Calcul simple pour la démo
    const heuresSupp = Math.random() > 0.7 ? Math.floor(Math.random() * 20) : 0
    const montantHeuresSupp = heuresSupp * (employe.salaireBase.toNumber() / 173.33) * 1.25
    const primesVariables = Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : 0
    
    const salaireBrut = employe.salaireBase.toNumber() + montantHeuresSupp + employe.primeTransport.toNumber() + employe.primesFixes.toNumber() + primesVariables
    
    const cotisationCNPSEmploye = Math.round(salaireBrut * 0.032)
    const cotisationCNPSEmployeur = Math.round(salaireBrut * 0.164)
    
    // Calcul simplifié de l'impôt
    let impotSurSalaire = 0
    if (salaireBrut > 50000) {
      if (salaireBrut <= 120000) {
        impotSurSalaire = (salaireBrut - 50000) * 0.1
      } else if (salaireBrut <= 300000) {
        impotSurSalaire = 7000 + (salaireBrut - 120000) * 0.15
      } else {
        impotSurSalaire = 34000 + (salaireBrut - 300000) * 0.20
      }
    }
    impotSurSalaire = Math.round(impotSurSalaire)
    
    const salaireNet = salaireBrut - cotisationCNPSEmploye - impotSurSalaire

    await prisma.bulletinPaie.upsert({
      where: {
        employeId_mois_annee: {
          employeId: employe.id,
          mois: 1,
          annee: 2024
        }
      },
      update: {},
      create: {
        numeroFiche: numeroBulletin,
        mois: 1,
        annee: 2024,
        periode: 'Janvier 2024',
        salaireBase: employe.salaireBase,
        heuresSupp: heuresSupp,
        tauxHeuresSupp: 1.25,
        primeTransport: employe.primeTransport,
        primesVariables: primesVariables,
        avances: 0,
        salaireBrut: salaireBrut,
        cotisationCNPSEmploye: cotisationCNPSEmploye,
        cotisationCNPSEmployeur: cotisationCNPSEmployeur,
        impotSurSalaire: impotSurSalaire,
        salaireNet: salaireNet,
        statut: 'VALIDE',
        employeId: employe.id,
        entrepriseId: entreprise.id
      }
    })
  }

  console.log(`✅ ${employesActifs.length} bulletins de paie générés`)

  // 5. Créer une déclaration CNPS
  console.log('📋 Génération de la déclaration CNPS...')
  
  const bulletins = await prisma.bulletinPaie.findMany({
    where: {
      entrepriseId: entreprise.id,
      mois: 1,
      annee: 2024
    }
  })

  const masseSalariale = bulletins.reduce((sum, b) => sum + b.salaireBrut.toNumber(), 0)
  const totalCotisationsEmploye = bulletins.reduce((sum, b) => sum + b.cotisationCNPSEmploye.toNumber(), 0)
  const totalCotisationsEmployeur = bulletins.reduce((sum, b) => sum + b.cotisationCNPSEmployeur.toNumber(), 0)

  await prisma.declarationCNPS.upsert({
    where: {
      entrepriseId_mois_annee: {
        entrepriseId: entreprise.id,
        mois: 1,
        annee: 2024
      }
    },
    update: {},
    create: {
      mois: 1,
      annee: 2024,
      periode: 'Janvier 2024',
      nombreEmployes: employesActifs.length,
      masseSalariale: masseSalariale,
      totalCotisationsEmploye: totalCotisationsEmploye,
      totalCotisationsEmployeur: totalCotisationsEmployeur,
      totalCotisations: totalCotisationsEmploye + totalCotisationsEmployeur,
      statut: 'VALIDEE',
      entrepriseId: entreprise.id
    }
  })

  console.log('✅ Déclaration CNPS créée')

  console.log('\n🎉 Données de test générées avec succès!')
  console.log('\n📊 Résumé:')
  console.log(`- Entreprise: ${entreprise.nom}`)
  console.log(`- Admin: ${admin.email} / password123`)
  console.log(`- Employés: ${employesActifs.length}`)
  console.log(`- Bulletins: ${bulletins.length}`)
  console.log(`- Masse salariale: ${masseSalariale.toLocaleString('fr-FR')} CFA`)
  console.log('\n🔗 URLs:')
  console.log('- Homepage: http://localhost:3000')
  console.log('- Dashboard: http://localhost:3000/dashboard')
  console.log('- Onboarding: http://localhost:3000/onboarding')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors de la génération des données:', e)
    await prisma.$disconnect()
    process.exit(1)
  })