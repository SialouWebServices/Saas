@echo off
echo 🔄 Démarrage de Prisma Studio pour SaaS RH CI...
cd /d "C:\Users\Sialou Webservices\Desktop\App evaluation\saas-rh-ci"
echo 📁 Répertoire: %CD%
echo 🗄️ Connexion à la base de données...
npx prisma studio
pause