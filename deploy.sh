#!/bin/bash

# Script de déploiement automatisé pour SaaS RH CI
# Optimisé pour les serveurs en Côte d'Ivoire

echo "🚀 Déploiement SaaS RH Côte d'Ivoire"
echo "===================================="

# Configuration des variables
APP_NAME="saas-rh-ci"
NODE_VERSION="18"
PM2_PROCESS_NAME="saas-rh-ci"
BACKUP_DIR="/var/backups/saas-rh-ci"
LOG_FILE="/var/log/saas-rh-ci-deploy.log"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Vérifications pré-déploiement
log "Vérification des prérequis..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Version requise: $NODE_VERSION+"
fi

NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
    error "Version Node.js trop ancienne. Actuelle: v$NODE_CURRENT, Requise: v$NODE_VERSION+"
fi

# Vérifier npm
if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    warning "PostgreSQL CLI non trouvé. Assurez-vous que la base de données est accessible."
fi

# Vérifier PM2
if ! command -v pm2 &> /dev/null; then
    log "Installation de PM2..."
    npm install -g pm2
fi

success "Prérequis vérifiés"

# Sauvegarde avant déploiement
log "Création de la sauvegarde..."
mkdir -p "$BACKUP_DIR/$(date +'%Y%m%d_%H%M%S')"

# Backup de la base de données
if [ ! -z "$DATABASE_URL" ]; then
    log "Sauvegarde de la base de données..."
    pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$(date +'%Y%m%d_%H%M%S')/database_backup.sql"
    success "Base de données sauvegardée"
fi

# Backup de l'application actuelle
if [ -d "/var/www/$APP_NAME" ]; then
    log "Sauvegarde de l'application actuelle..."
    cp -r "/var/www/$APP_NAME" "$BACKUP_DIR/$(date +'%Y%m%d_%H%M%S')/app_backup"
    success "Application sauvegardée"
fi

# Déploiement
log "Début du déploiement..."

# Arrêt de l'application en cours
log "Arrêt de l'application..."
pm2 stop "$PM2_PROCESS_NAME" 2>/dev/null || true

# Installation des dépendances
log "Installation des dépendances..."
npm ci --only=production

# Génération Prisma
log "Génération du client Prisma..."
npx prisma generate

# Migration de la base de données
log "Migration de la base de données..."
npx prisma migrate deploy

# Build de l'application
log "Build de l'application..."
npm run build

# Configuration PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_PROCESS_NAME',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/$APP_NAME',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/saas-rh-ci-error.log',
    out_file: '/var/log/saas-rh-ci-out.log',
    log_file: '/var/log/saas-rh-ci-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
}
EOF

# Démarrage de l'application
log "Démarrage de l'application..."
pm2 start ecosystem.config.js
pm2 save

# Configuration Nginx (si disponible)
if command -v nginx &> /dev/null; then
    log "Configuration Nginx..."
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name saas-rh-ci.com www.saas-rh-ci.com;

    # Redirection HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name saas-rh-ci.com www.saas-rh-ci.com;

    # Configuration SSL (à adapter selon votre certificat)
    ssl_certificate /etc/ssl/certs/saas-rh-ci.crt;
    ssl_certificate_key /etc/ssl/private/saas-rh-ci.key;

    # Optimisations pour la Côte d'Ivoire (connexions lentes)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss;

    # Cache statique long terme
    location /_next/static {
        alias /var/www/$APP_NAME/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy vers l'application Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts optimisés pour les connexions lentes
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logs spécifiques
    access_log /var/log/nginx/saas-rh-ci-access.log;
    error_log /var/log/nginx/saas-rh-ci-error.log;
}
EOF

    # Activation du site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    success "Nginx configuré"
fi

# Vérification du déploiement
log "Vérification du déploiement..."
sleep 10

# Test de santé de l'application
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    success "Application déployée avec succès!"
else
    error "Échec du déploiement. Code de retour: $HEALTH_CHECK"
fi

# Nettoyage des anciens logs (garde 30 jours)
log "Nettoyage des anciens logs..."
find /var/log -name "*saas-rh-ci*" -type f -mtime +30 -delete 2>/dev/null || true

# Nettoyage des anciennes sauvegardes (garde 7 jours)
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true

# Statistiques finales
log "=== RÉSUMÉ DU DÉPLOIEMENT ==="
log "Application: $APP_NAME"
log "Version Node.js: $(node -v)"
log "Statut PM2: $(pm2 describe "$PM2_PROCESS_NAME" | grep status || echo 'Non trouvé')"
log "Utilisation mémoire: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
log "Espace disque: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " utilisé)"}')"
log "URL d'accès: https://saas-rh-ci.com"
log "Logs: tail -f /var/log/saas-rh-ci-combined.log"

success "🎉 Déploiement terminé avec succès!"
success "📊 L'application SaaS RH CI est maintenant en ligne"
success "🇨🇮 Prête pour les PME ivoiriennes"

echo ""
echo "Pour surveiller l'application:"
echo "  pm2 monit"
echo "  pm2 logs $PM2_PROCESS_NAME"
echo ""
echo "Pour redémarrer:"
echo "  pm2 restart $PM2_PROCESS_NAME"
echo ""
echo "Support: contact@saas-rh-ci.com"