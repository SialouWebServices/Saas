import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth-utils'
import * as XLSX from 'xlsx'
import { formatCFA, formatDateCI } from '@/lib/utils'

const prisma = new PrismaClient()

// GET - Exporter déclaration CNPS en Excel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyToken(request)
    if (!auth.success) {
      return NextResponse.json({ erreur: auth.error }, { status: 401 })
    }

    // Récupérer la déclaration
    const declaration = await prisma.declarationCNPS.findFirst({
      where: {
        id: params.id,
        entrepriseId: auth.user!.entrepriseId
      },
      include: {
        entreprise: {
          select: { 
            nom: true, 
            numeroCNPS: true,
            adresse: true,
            telephone: true,
            email: true
          }
        }
      }
    })

    if (!declaration) {
      return NextResponse.json(
        { erreur: 'Déclaration non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les données des employés
    const bulletins = await prisma.bulletinPaie.findMany({
      where: {
        entrepriseId: auth.user!.entrepriseId,
        mois: declaration.mois,
        annee: declaration.annee,
        statut: 'VALIDE'
      },
      include: {
        employe: {
          select: {
            matricule: true,
            nom: true,
            prenom: true,
            numeroCNPS: true,
            dateEmbauche: true
          }
        }
      },
      orderBy: { employe: { nom: 'asc' } }
    })

    // Préparer les données Excel
    const donneesDeclaration = [
      ['DÉCLARATION CNPS - CÔTE D\'IVOIRE'],
      [''],
      ['Entreprise:', declaration.entreprise.nom],
      ['Numéro CNPS:', declaration.entreprise.numeroCNPS || 'Non renseigné'],
      ['Adresse:', declaration.entreprise.adresse],
      ['Téléphone:', declaration.entreprise.telephone],
      ['Email:', declaration.entreprise.email],
      [''],
      ['Période:', declaration.periode],
      ['Date de génération:', formatDateCI(declaration.dateGeneration)],
      ['Statut:', declaration.statut],
      [''],
      ['RÉSUMÉ DE LA DÉCLARATION'],
      ['Nombre d\'employés:', declaration.nombreEmployes],
      ['Masse salariale:', formatCFA(Number(declaration.masseSalariale))],
      ['Total cotisations employés:', formatCFA(Number(declaration.totalCotisationsEmploye))],
      ['Total cotisations employeur:', formatCFA(Number(declaration.totalCotisationsEmployeur))],
      ['Total des cotisations:', formatCFA(Number(declaration.totalCotisations))],
      ['']
    ]

    // En-têtes du tableau des employés
    const enTetesEmployes = [
      'Matricule',
      'Nom',
      'Prénom', 
      'N° CNPS',
      'Date embauche',
      'Salaire brut (CFA)',
      'Cotisation employé 3.2% (CFA)',
      'Cotisation employeur 16.4% (CFA)',
      'Total cotisations (CFA)'
    ]

    // Données des employés
    const donneesEmployes = bulletins.map(bulletin => [
      bulletin.employe.matricule,
      bulletin.employe.nom,
      bulletin.employe.prenom,
      bulletin.employe.numeroCNPS || 'Non renseigné',
      formatDateCI(bulletin.employe.dateEmbauche),
      Number(bulletin.salaireBrut),
      Number(bulletin.cotisationCNPSEmploye),
      Number(bulletin.cotisationCNPSEmployeur),
      Number(bulletin.cotisationCNPSEmploye) + Number(bulletin.cotisationCNPSEmployeur)
    ])

    // Ligne totaux
    const totaux = [
      '', '', '', '', 'TOTAUX:',
      bulletins.reduce((sum, b) => sum + Number(b.salaireBrut), 0),
      bulletins.reduce((sum, b) => sum + Number(b.cotisationCNPSEmploye), 0),
      bulletins.reduce((sum, b) => sum + Number(b.cotisationCNPSEmployeur), 0),
      bulletins.reduce((sum, b) => sum + Number(b.cotisationCNPSEmploye) + Number(b.cotisationCNPSEmployeur), 0)
    ]

    // Assembler toutes les données
    const donneesCompletes = [
      ...donneesDeclaration,
      ['DÉTAIL PAR EMPLOYÉ'],
      enTetesEmployes,
      ...donneesEmployes,
      totaux,
      [''],
      [''],
      ['Déclaration générée le:', formatDateCI(new Date())],
      ['Plateforme SaaS RH - Côte d\'Ivoire']
    ]

    // Créer le workbook Excel
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(donneesCompletes)

    // Styling basique (largeurs de colonnes)
    const colWidths = [
      { wch: 12 }, // Matricule
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 12 }, // N° CNPS
      { wch: 12 }, // Date embauche
      { wch: 15 }, // Salaire brut
      { wch: 18 }, // Cotisation employé
      { wch: 18 }, // Cotisation employeur
      { wch: 18 }  // Total cotisations
    ]
    worksheet['!cols'] = colWidths

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Déclaration CNPS')

    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Nom du fichier
    const nomFichier = `Declaration_CNPS_${declaration.periode.replace(' ', '_')}_${declaration.entreprise.nom.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`

    // Mettre à jour l'URL du fichier Excel dans la base
    const urlExcel = `/exports/cnps/${nomFichier}`
    await prisma.declarationCNPS.update({
      where: { id: params.id },
      data: { excelUrl: urlExcel }
    })

    // Retourner le fichier Excel
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nomFichier}"`,
        'Content-Length': excelBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Erreur export Excel déclaration CNPS:', error)
    return NextResponse.json(
      { erreur: 'Erreur lors de l\'export Excel' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}