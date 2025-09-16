#!/bin/bash
# Script automatisé pour exporter le projet vers GitHub

set -e  # Arrêter en cas d'erreur

echo "🚀 Script d'Export GitHub - SaaS RH CI"
echo "======================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_NAME="saas-rh-ci"
GITHUB_USERNAME=""

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
check_requirements() {
    log_info "Vérification des prérequis..."
    
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé. Veuillez l'installer d'abord."
        exit 1
    fi
    
    log_success "Tous les prérequis sont installés"
}

# Demander le nom d'utilisateur GitHub
get_github_username() {
    if [ -z "$GITHUB_USERNAME" ]; then
        read -p "Entrez votre nom d'utilisateur GitHub: " GITHUB_USERNAME
        if [ -z "$GITHUB_USERNAME" ]; then
            log_error "Le nom d'utilisateur GitHub est requis"
            exit 1
        fi
    fi
}

# Vérifier que nous sommes dans le bon répertoire
check_project_directory() {
    if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
        log_error "Ce script doit être exécuté depuis la racine du projet saas-rh-ci"
        exit 1
    fi
    log_success "Répertoire du projet validé"
}

# Installer les dépendances si nécessaire
install_dependencies() {
    log_info "Vérification des dépendances..."
    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances..."
        npm install
        log_success "Dépendances installées"
    else
        log_success "Dépendances déjà installées"
    fi
}

# Mettre à jour les URLs dans le README
update_readme_urls() {
    log_info "Mise à jour des URLs dans le README..."
    
    # Remplacer les URLs de démonstration par les vraies URLs
    sed -i.bak "s/votre-username/$GITHUB_USERNAME/g" README.md
    sed -i.bak "s/YOUR_USERNAME/$GITHUB_USERNAME/g" README.md
    
    # Supprimer le fichier de sauvegarde
    rm -f README.md.bak
    
    log_success "URLs mises à jour dans le README"
}

# Test de build local
test_build() {
    log_info "Test de build local..."
    
    # Build de test
    npm run build
    
    log_success "Build local réussi"
}

# Initialiser Git
init_git() {
    log_info "Initialisation Git..."
    
    if [ ! -d ".git" ]; then
        git init
        log_success "Repository Git initialisé"
    else
        log_success "Repository Git déjà initialisé"
    fi
    
    # Ajouter le remote GitHub
    REMOTE_URL="https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"
    
    if ! git remote get-url origin &> /dev/null; then
        git remote add origin $REMOTE_URL
        log_success "Remote GitHub ajouté: $REMOTE_URL"
    else
        git remote set-url origin $REMOTE_URL
        log_success "Remote GitHub mis à jour: $REMOTE_URL"
    fi
}

# Commit et push initial
initial_commit() {
    log_info "Préparation du commit initial..."
    
    # Ajouter tous les fichiers
    git add .
    
    # Commit initial
    git commit -m "🎉 Initial commit: SaaS RH CI - MVP complet avec fonctionnalités critiques

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
🇨🇮 Conformité 100% code du travail CI"
    
    log_success "Commit initial créé"
}

# Push vers GitHub
push_to_github() {
    log_info "Push vers GitHub..."
    
    # Créer et basculer sur la branche main
    git branch -M main
    
    # Push vers GitHub
    git push -u origin main
    
    log_success "Code poussé vers GitHub avec succès!"
}

# Afficher les informations finales
show_final_info() {
    echo ""
    echo "🎉 Export GitHub terminé avec succès!"
    echo "===================================="
    echo ""
    log_info "Repository GitHub: https://github.com/$GITHUB_USERNAME/$PROJECT_NAME"
    log_info "GitHub Pages sera disponible à: https://$GITHUB_USERNAME.github.io/$PROJECT_NAME"
    echo ""
    log_warning "Prochaines étapes:"
    echo "1. Aller sur https://github.com/$GITHUB_USERNAME/$PROJECT_NAME"
    echo "2. Activer GitHub Pages dans Settings > Pages"
    echo "3. Attendre 5-10 minutes pour le déploiement"
    echo "4. Vérifier que l'application fonctionne"
    echo ""
    log_success "🚀 Votre application SaaS RH CI est maintenant sur GitHub!"
}

# Fonction principale
main() {
    echo ""
    log_info "Démarrage de l'export vers GitHub..."
    echo ""
    
    check_requirements
    get_github_username
    check_project_directory
    install_dependencies
    update_readme_urls
    test_build
    init_git
    initial_commit
    push_to_github
    show_final_info
}

# Gestion des erreurs
trap 'log_error "Une erreur est survenue. Export annulé."; exit 1' ERR

# Exécution du script principal
main "$@"