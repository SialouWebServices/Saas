# Script PowerShell pour accéder à Prisma Studio
Write-Host "🔄 Démarrage de Prisma Studio pour SaaS RH CI..." -ForegroundColor Green

# Naviguer vers le bon répertoire
Set-Location "C:\Users\Sialou Webservices\Desktop\App evaluation\saas-rh-ci"
Write-Host "📁 Répertoire actuel: $(Get-Location)" -ForegroundColor Yellow

# Vérifier que le schéma existe
if (Test-Path "prisma\schema.prisma") {
    Write-Host "✅ Schéma Prisma trouvé" -ForegroundColor Green
    Write-Host "🗄️ Connexion à la base de données..." -ForegroundColor Cyan
    
    # Lancer Prisma Studio
    npx prisma studio
} else {
    Write-Host "❌ Schéma Prisma non trouvé dans prisma\schema.prisma" -ForegroundColor Red
    Write-Host "📂 Contenu du répertoire:" -ForegroundColor Yellow
    Get-ChildItem
}

Read-Host "Appuyez sur Entrée pour continuer..."