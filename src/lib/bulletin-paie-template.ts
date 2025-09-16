// Templates pour les bulletins de paie conformes au code du travail ivoirien
// Génération HTML et PDF des bulletins de paie

import { ResultatCalculPaie } from './calcul-paie'

export type DonneesEntreprise = {
  nom: string
  rccm: string
  adresse: string
  telephone: string
  email: string
  numeroEmployeur?: string
  secteurActivite: string
}

export type DonneesEmploye = {
  id: string
  numeroEmploye: string
  nom: string
  prenom: string
  poste: string
  dateEmbauche: string
  statut: string
  numeroCNPS?: string
  numeroCompte?: string
  banque?: string
}

export type DonneesBulletin = {
  numeroFiche: string
  periode: string
  mois: number
  annee: number
  dateGeneration: string
}

export type BulletinPaieComplet = {
  entreprise: DonneesEntreprise
  employe: DonneesEmploye
  bulletin: DonneesBulletin
  calcul: ResultatCalculPaie
}

/**
 * Génère le HTML d'un bulletin de paie conforme
 */
export function genererHTMLBulletinPaie(donnees: BulletinPaieComplet): string {
  const { entreprise, employe, bulletin, calcul } = donnees

  const formatCFA = (montant: number) => 
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant)

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('fr-FR')

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bulletin de Paie - ${employe.prenom} ${employe.nom}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    
    .bulletin {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    
    .header {
      border-bottom: 2px solid #1E3A8A;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    
    .entreprise-info {
      flex: 1;
    }
    
    .entreprise-info h1 {
      font-size: 16px;
      font-weight: bold;
      color: #1E3A8A;
      margin-bottom: 5px;
    }
    
    .entreprise-info p {
      margin: 2px 0;
      font-size: 11px;
    }
    
    .bulletin-title {
      text-align: center;
      flex: 1;
    }
    
    .bulletin-title h2 {
      font-size: 18px;
      font-weight: bold;
      color: #EA580C;
      margin-bottom: 5px;
    }
    
    .bulletin-title p {
      font-size: 12px;
      color: #666;
    }
    
    .bulletin-info {
      text-align: right;
      flex: 1;
      font-size: 11px;
    }
    
    .employee-section {
      background: #f8f9fa;
      padding: 15px;
      border: 1px solid #ddd;
      margin-bottom: 20px;
    }
    
    .employee-section h3 {
      font-size: 14px;
      color: #1E3A8A;
      margin-bottom: 10px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    
    .employee-row {
      display: flex;
      gap: 40px;
      margin-bottom: 8px;
    }
    
    .employee-col {
      flex: 1;
    }
    
    .pay-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    
    .pay-table th {
      background: #1E3A8A;
      color: white;
      padding: 8px 6px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #ddd;
    }
    
    .pay-table td {
      padding: 6px;
      border: 1px solid #ddd;
      text-align: right;
    }
    
    .pay-table td:first-child {
      text-align: left;
    }
    
    .section-header {
      background: #EA580C;
      color: white;
    }
    
    .total-row {
      background: #f8f9fa;
      font-weight: bold;
    }
    
    .net-pay {
      background: #10B981;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }
    
    .footer {
      margin-top: 30px;
      font-size: 10px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    
    .footer-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .cnps-info {
      background: #fef3cd;
      padding: 10px;
      border: 1px solid #ffeaa7;
      margin-top: 15px;
      font-size: 10px;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    
    .signature-box {
      text-align: center;
      width: 200px;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 40px;
      padding-top: 5px;
    }
    
    @media print {
      body { margin: 0; }
      .bulletin { padding: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="bulletin">
    <!-- En-tête du bulletin -->
    <div class="header">
      <div class="header-row">
        <div class="entreprise-info">
          <h1>${entreprise.nom}</h1>
          <p><strong>RCCM:</strong> ${entreprise.rccm}</p>
          <p><strong>Secteur:</strong> ${entreprise.secteurActivite}</p>
          <p><strong>Adresse:</strong> ${entreprise.adresse}</p>
          <p><strong>Tél:</strong> ${entreprise.telephone}</p>
          <p><strong>Email:</strong> ${entreprise.email}</p>
          ${entreprise.numeroEmployeur ? `<p><strong>N° Employeur:</strong> ${entreprise.numeroEmployeur}</p>` : ''}
        </div>
        
        <div class="bulletin-title">
          <h2>BULLETIN DE PAIE</h2>
          <p>Période: ${bulletin.periode}</p>
          <p>Fiche N°: ${bulletin.numeroFiche}</p>
        </div>
        
        <div class="bulletin-info">
          <p><strong>Date d'édition:</strong><br>${formatDate(bulletin.dateGeneration)}</p>
          <p><strong>Mois/Année:</strong><br>${bulletin.mois.toString().padStart(2, '0')}/${bulletin.annee}</p>
        </div>
      </div>
    </div>

    <!-- Informations employé -->
    <div class="employee-section">
      <h3>INFORMATIONS EMPLOYÉ</h3>
      <div class="employee-row">
        <div class="employee-col">
          <p><strong>N° Employé:</strong> ${employe.numeroEmploye}</p>
          <p><strong>Nom et Prénom:</strong> ${employe.prenom} ${employe.nom}</p>
          <p><strong>Poste:</strong> ${employe.poste}</p>
        </div>
        <div class="employee-col">
          <p><strong>Date d'embauche:</strong> ${formatDate(employe.dateEmbauche)}</p>
          <p><strong>Statut:</strong> ${employe.statut}</p>
          ${employe.numeroCNPS ? `<p><strong>N° CNPS:</strong> ${employe.numeroCNPS}</p>` : ''}
        </div>
        <div class="employee-col">
          ${employe.numeroCompte ? `<p><strong>N° Compte:</strong> ${employe.numeroCompte}</p>` : ''}
          ${employe.banque ? `<p><strong>Banque:</strong> ${employe.banque}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Tableau de calcul de paie -->
    <table class="pay-table">
      <thead>
        <tr>
          <th style="width: 50%">DÉSIGNATION</th>
          <th style="width: 20%">NOMBRE/TAUX</th>
          <th style="width: 15%">MONTANT</th>
          <th style="width: 15%">CUMUL</th>
        </tr>
      </thead>
      <tbody>
        <!-- Éléments de rémunération -->
        <tr class="section-header">
          <td colspan="4"><strong>ÉLÉMENTS DE RÉMUNÉRATION</strong></td>
        </tr>
        <tr>
          <td>Salaire de base</td>
          <td>1.000</td>
          <td>${formatCFA(calcul.salaireBase)}</td>
          <td>${formatCFA(calcul.salaireBase)}</td>
        </tr>
        ${calcul.heuresSupplementaires > 0 ? `
        <tr>
          <td>Heures supplémentaires</td>
          <td>${calcul.heuresSupplementaires}h</td>
          <td>${formatCFA(calcul.montantHeuresSupp)}</td>
          <td>${formatCFA(calcul.montantHeuresSupp)}</td>
        </tr>
        ` : ''}
        ${calcul.primeTransport > 0 ? `
        <tr>
          <td>Prime de transport</td>
          <td>1.000</td>
          <td>${formatCFA(calcul.primeTransport)}</td>
          <td>${formatCFA(calcul.primeTransport)}</td>
        </tr>
        ` : ''}
        ${calcul.primesVariables > 0 ? `
        <tr>
          <td>Primes variables</td>
          <td>1.000</td>
          <td>${formatCFA(calcul.primesVariables)}</td>
          <td>${formatCFA(calcul.primesVariables)}</td>
        </tr>
        ` : ''}
        ${calcul.primesFixes > 0 ? `
        <tr>
          <td>Primes fixes</td>
          <td>1.000</td>
          <td>${formatCFA(calcul.primesFixes)}</td>
          <td>${formatCFA(calcul.primesFixes)}</td>
        </tr>
        ` : ''}
        
        <tr class="total-row">
          <td colspan="2"><strong>TOTAL BRUT</strong></td>
          <td><strong>${formatCFA(calcul.salaireBrut)}</strong></td>
          <td><strong>${formatCFA(calcul.salaireBrut)}</strong></td>
        </tr>

        <!-- Cotisations et déductions -->
        <tr class="section-header">
          <td colspan="4"><strong>COTISATIONS SOCIALES</strong></td>
        </tr>
        <tr>
          <td>Cotisation CNPS employé</td>
          <td>3,2%</td>
          <td>${formatCFA(calcul.cotisationCNPSEmploye)}</td>
          <td>${formatCFA(calcul.cotisationCNPSEmploye)}</td>
        </tr>
        
        <tr class="section-header">
          <td colspan="4"><strong>IMPÔTS ET RETENUES</strong></td>
        </tr>
        ${calcul.impotSurSalaire > 0 ? `
        <tr>
          <td>Impôt sur salaire</td>
          <td>Variable</td>
          <td>${formatCFA(calcul.impotSurSalaire)}</td>
          <td>${formatCFA(calcul.impotSurSalaire)}</td>
        </tr>
        ` : ''}
        ${calcul.avances > 0 ? `
        <tr>
          <td>Avances sur salaire</td>
          <td>1.000</td>
          <td>${formatCFA(calcul.avances)}</td>
          <td>${formatCFA(calcul.avances)}</td>
        </tr>
        ` : ''}
        ${calcul.autresDeductions > 0 ? `
        <tr>
          <td>Autres déductions</td>
          <td>1.000</td>
          <td>${formatCFA(calcul.autresDeductions)}</td>
          <td>${formatCFA(calcul.autresDeductions)}</td>
        </tr>
        ` : ''}
        
        <tr class="total-row">
          <td colspan="2"><strong>TOTAL DÉDUCTIONS</strong></td>
          <td><strong>${formatCFA(calcul.totalDeductions)}</strong></td>
          <td><strong>${formatCFA(calcul.totalDeductions)}</strong></td>
        </tr>
        
        <!-- Salaire net -->
        <tr class="net-pay">
          <td colspan="2"><strong>SALAIRE NET À PAYER</strong></td>
          <td><strong>${formatCFA(calcul.salaireNet)}</strong></td>
          <td><strong>${formatCFA(calcul.salaireNet)}</strong></td>
        </tr>
      </tbody>
    </table>

    <!-- Informations CNPS -->
    <div class="cnps-info">
      <h4 style="margin-bottom: 8px; color: #EA580C;">RÉCAPITULATIF CNPS</h4>
      <div style="display: flex; gap: 30px;">
        <div>
          <p><strong>Part Employé (3,2%):</strong> ${formatCFA(calcul.cotisationCNPSEmploye)}</p>
          <p><strong>Part Employeur (16,4%):</strong> ${formatCFA(calcul.cotisationCNPSEmployeur)}</p>
        </div>
        <div>
          <p><strong>Total Cotisations CNPS:</strong> ${formatCFA(calcul.totalCotisationsCNPS)}</p>
          <p><strong>Base de cotisation:</strong> ${formatCFA(calcul.details.baseCotisationsCNPS)}</p>
        </div>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
      <div class="footer-row">
        <div>
          <p><strong>Coût total employeur:</strong> ${formatCFA(calcul.coutTotalEmployeur)}</p>
          <p><strong>Date limite de paiement:</strong> ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toLocaleDateString('fr-FR')}</p>
        </div>
        <div style="text-align: right;">
          <p><strong>Document généré par SaaS RH CI</strong></p>
          <p>Conforme au Code du Travail ivoirien</p>
        </div>
      </div>
      
      <div class="signature-section">
        <div class="signature-box">
          <p>L'Employeur</p>
          <div class="signature-line">Signature et Cachet</div>
        </div>
        <div class="signature-box">
          <p>L'Employé</p>
          <div class="signature-line">Signature</div>
        </div>
      </div>
      
      <p style="text-align: center; margin-top: 20px; font-size: 9px; color: #999;">
        Ce bulletin de paie est conforme aux dispositions du Code du Travail de la République de Côte d'Ivoire.<br>
        Conservation obligatoire pendant 5 ans - Article L.132-8 du Code du Travail.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Génère un récapitulatif Excel pour plusieurs bulletins
 */
export function genererRecapitulatifExcel(bulletins: BulletinPaieComplet[]): string {
  const formatCFA = (montant: number) => montant.toString()
  
  let csv = 'N° Employé,Nom,Prénom,Poste,Salaire Base,Heures Sup,Primes,Salaire Brut,CNPS Employé,Impôts,Avances,Salaire Net,CNPS Employeur,Coût Total\n'
  
  bulletins.forEach(bulletin => {
    const { employe, calcul } = bulletin
    csv += [
      employe.numeroEmploye,
      employe.nom,
      employe.prenom,
      employe.poste,
      formatCFA(calcul.salaireBase),
      formatCFA(calcul.montantHeuresSupp),
      formatCFA(calcul.primeTransport + calcul.primesVariables + calcul.primesFixes),
      formatCFA(calcul.salaireBrut),
      formatCFA(calcul.cotisationCNPSEmploye),
      formatCFA(calcul.impotSurSalaire),
      formatCFA(calcul.avances),
      formatCFA(calcul.salaireNet),
      formatCFA(calcul.cotisationCNPSEmployeur),
      formatCFA(calcul.coutTotalEmployeur)
    ].join(',') + '\n'
  })
  
  return csv
}

/**
 * Valide qu'un bulletin est conforme avant génération
 */
export function validerBulletinConformite(donnees: BulletinPaieComplet): {
  conforme: boolean
  erreurs: string[]
  avertissements: string[]
} {
  const erreurs: string[] = []
  const avertissements: string[] = []
  
  // Vérifications obligatoires pour la conformité
  if (!donnees.entreprise.rccm) {
    erreurs.push("RCCM de l'entreprise manquant")
  }
  
  if (!donnees.employe.numeroEmploye) {
    erreurs.push("Numéro d'employé manquant")
  }
  
  if (!donnees.bulletin.numeroFiche) {
    erreurs.push("Numéro de fiche de paie manquant")
  }
  
  if (donnees.calcul.salaireNet < 0) {
    erreurs.push("Le salaire net ne peut pas être négatif")
  }
  
  // Avertissements (non bloquants)
  if (!donnees.employe.numeroCNPS) {
    avertissements.push("Numéro CNPS de l'employé non renseigné")
  }
  
  if (donnees.calcul.salaireBase < 60000) { // SMIG approximatif
    avertissements.push("Salaire inférieur au SMIG national")
  }
  
  return {
    conforme: erreurs.length === 0,
    erreurs,
    avertissements
  }
}

/**
 * Génère un nom de fichier unique pour le bulletin
 */
export function genererNomFichierBulletin(donnees: BulletinPaieComplet): string {
  const { employe, bulletin } = donnees
  const moisStr = bulletin.mois.toString().padStart(2, '0')
  const nomClean = employe.nom.replace(/[^a-zA-Z0-9]/g, '')
  const prenomClean = employe.prenom.replace(/[^a-zA-Z0-9]/g, '')
  
  return `BP_${prenomClean}${nomClean}_${moisStr}${bulletin.annee}_${employe.numeroEmploye}.pdf`
}

/**
 * Génère un bulletin de paie de test pour démonstration
 */
export function genererBulletinTest(): BulletinPaieComplet {
  return {
    entreprise: {
      nom: "SARL TECH SOLUTIONS",
      rccm: "CI-ABJ-2023-B-12345",
      adresse: "Cocody, Angré 7ème Tranche, Abidjan",
      telephone: "+225 27 22 45 67 89",
      email: "contact@techsolutions.ci",
      numeroEmployeur: "EMP-123456789",
      secteurActivite: "Services informatiques"
    },
    employe: {
      id: "emp_001",
      numeroEmploye: "EMP-001-2024",
      nom: "KOUAME",
      prenom: "Marie",
      poste: "Développeuse Senior",
      dateEmbauche: "2023-03-15",
      statut: "CDI",
      numeroCNPS: "123456789",
      numeroCompte: "CI05CI0580000123456789012",
      banque: "SGBCI"
    },
    bulletin: {
      numeroFiche: "BP-001-202401",
      periode: "Janvier 2024",
      mois: 1,
      annee: 2024,
      dateGeneration: new Date().toISOString()
    },
    calcul: {
      salaireBase: 450000,
      heuresSupplementaires: 8,
      montantHeuresSupp: 26040,
      primeTransport: 25000,
      primesVariables: 50000,
      primesFixes: 0,
      salaireBrut: 551040,
      cotisationCNPSEmploye: 17633,
      cotisationCNPSEmployeur: 90371,
      totalCotisationsCNPS: 108004,
      salaireImposable: 551040,
      impotSurSalaire: 55104,
      avances: 0,
      autresDeductions: 0,
      totalDeductions: 72737,
      salaireNet: 478303,
      coutTotalEmployeur: 641411,
      details: {
        baseCotisationsCNPS: 551040,
        baseImposition: 551040,
        tranchesImpot: []
      }
    }
  }
}