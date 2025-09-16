# Script PowerShell pour exporter le projet vers GitHub
# SaaS RH CI - Export GitHub Automatisé

param(
    [string]$GitHubUsername = ""
)

# Configuration
$ProjectName = "saas-rh-ci"
$ErrorActionPreference = "Stop"

# Couleurs pour la console
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "ℹ️  $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Header($message) {
    Write-Host ""
    Write-ColorOutput Cyan "🚀 $message"
    Write-ColorOutput Cyan "=" * 50
    Write-Host ""
}

# Vérifier les prérequis
function Test-Requirements {
    Write-Info "Vérification des prérequis..."
    
    # Vérifier Git
    try {
        git --version | Out-Null
        Write-Success "Git est installé"
    }
    catch {
        Write-Error "Git n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    }
    
    # Vérifier Node.js
    try {
        node --version | Out-Null
        Write-Success "Node.js est installé"
    }
    catch {
        Write-Error "Node.js n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    }
    
    # Vérifier npm
    try {
        npm --version | Out-Null
        Write-Success "npm est installé"
    }
    catch {
        Write-Error "npm n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    }
}

# Demander le nom d'utilisateur GitHub
function Get-GitHubUsername {
    if (-not $GitHubUsername) {
        $GitHubUsername = Read-Host "Entrez votre nom d'utilisateur GitHub"
        if (-not $GitHubUsername) {
            Write-Error "Le nom d'utilisateur GitHub est requis"
            exit 1
        }
    }
    return $GitHubUsername
}

# Vérifier le répertoire du projet
function Test-ProjectDirectory {
    if (-not (Test-Path "package.json") -or -not (Test-Path "next.config.ts")) {
        Write-Error "Ce script doit être exécuté depuis la racine du projet saas-rh-ci"
        exit 1
    }
    Write-Success "Répertoire du projet validé"
}

# Installer les dépendances
function Install-Dependencies {
    Write-Info "Vérification des dépendances..."
    
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installation des dépendances..."
        npm install
        Write-Success "Dépendances installées"
    }
    else {
        Write-Success "Dépendances déjà installées"
    }
}

# Mettre à jour les URLs dans le README
function Update-ReadmeUrls($username) {
    Write-Info "Mise à jour des URLs dans le README..."
    
    $readmeContent = Get-Content "README.md" -Raw
    $readmeContent = $readmeContent -replace "votre-username", $username
    $readmeContent = $readmeContent -replace "YOUR_USERNAME", $username
    
    Set-Content "README.md" -Value $readmeContent
    
    Write-Success "URLs mises à jour dans le README"
}

# Test de build local
function Test-Build {
    Write-Info "Test de build local..."
    
    try {
        npm run build
        Write-Success "Build local réussi"
    }
    catch {
        Write-Error "Échec du build. Veuillez corriger les erreurs avant de continuer."
        exit 1
    }
}

# Initialiser Git
function Initialize-Git($username) {
    Write-Info "Initialisation Git..."
    
    # Initialiser Git si nécessaire
    if (-not (Test-Path ".git")) {
        git init
        Write-Success "Repository Git initialisé"
    }
    else {
        Write-Success "Repository Git déjà initialisé"
    }
    
    # Ajouter le remote GitHub
    $remoteUrl = "https://github.com/$username/$ProjectName.git"
    
    try {
        git remote get-url origin 2>$null | Out-Null
        git remote set-url origin $remoteUrl
        Write-Success "Remote GitHub mis à jour: $remoteUrl"
    }
    catch {
        git remote add origin $remoteUrl
        Write-Success "Remote GitHub ajouté: $remoteUrl"
    }
}

# Commit et push initial
function Invoke-InitialCommit {
    Write-Info "Préparation du commit initial..."
    
    # Ajouter tous les fichiers
    git add .
    
    # Message de commit détaillé
    $commitMessage = @"
🎉 Initial commit: SaaS RH CI - MVP complet avec fonctionnalités critiques

✨ Fonctionnalités principales:
- 👥 Gestion complète des employés
- 💰 Calcul de paie automatisé conforme CNPS
- 🏛️ Déclarations CNPS avec export Excel
- 📱 Paiements Mobile Money (Orange, Wave, MTN)
- 📊 Dashboard analytics en temps réel
- 🔐 Authentification JWT sécurisée

🛠️ Technologies:
- Next.js 15 + TypeScript
- Prisma ORM + PostgreSQL  
- PWA + Service Worker
- Mobile-first responsive

🎯 Conçu spécialement pour les PME ivoiriennes
🇨🇮 Conformité 100% code du travail CI
"@
    
    git commit -m $commitMessage
    Write-Success "Commit initial créé"
}

# Push vers GitHub
function Push-ToGitHub {
    Write-Info "Push vers GitHub..."
    
    # Créer et basculer sur la branche main
    git branch -M main
    
    # Push vers GitHub
    git push -u origin main
    
    Write-Success "Code poussé vers GitHub avec succès!"
}

# Afficher les informations finales
function Show-FinalInfo($username) {
    Write-Host ""
    Write-ColorOutput Green "🎉 Export GitHub terminé avec succès!"
    Write-ColorOutput Green "=" * 50
    Write-Host ""
    
    Write-Info "Repository GitHub: https://github.com/$username/$ProjectName"
    Write-Info "GitHub Pages sera disponible à: https://$username.github.io/$ProjectName"
    Write-Host ""
    
    Write-Warning "Prochaines étapes:"
    Write-Host "1. Aller sur https://github.com/$username/$ProjectName"
    Write-Host "2. Activer GitHub Pages dans Settings > Pages"
    Write-Host "3. Attendre 5-10 minutes pour le déploiement"
    Write-Host "4. Vérifier que l'application fonctionne"
    Write-Host ""
    
    Write-Success "🚀 Votre application SaaS RH CI est maintenant sur GitHub!"
}

# Fonction principale
function Main {
    try {
        Write-Header "Script d'Export GitHub - SaaS RH CI"
        
        Test-Requirements
        $username = Get-GitHubUsername
        Test-ProjectDirectory
        Install-Dependencies
        Update-ReadmeUrls $username
        Test-Build
        Initialize-Git $username
        Invoke-InitialCommit
        Push-ToGitHub
        Show-FinalInfo $username
    }
    catch {
        Write-Error "Une erreur est survenue: $($_.Exception.Message)"
        Write-Error "Export annulé."
        exit 1
    }
}

# Exécution du script
Main