# Guide des Commandes Prisma pour SaaS RH CI

## 🔧 Commandes de Gestion de Base

# Naviguer vers le projet
cd "C:\Users\Sialou Webservices\Desktop\App evaluation\saas-rh-ci"

# Générer le client Prisma (après modification du schéma)
npx prisma generate --schema=./prisma/schema.prisma

# Synchroniser le schéma avec la base (mode dev)
npx prisma db push --schema=./prisma/schema.prisma

# Créer et appliquer une migration
npx prisma migrate dev --name "ajout_nouvelle_fonctionnalite" --schema=./prisma/schema.prisma

# Réinitialiser la base de données (ATTENTION : supprime toutes les données)
npx prisma migrate reset --schema=./prisma/schema.prisma

# Lancer Prisma Studio
npx prisma studio --schema=./prisma/schema.prisma

## 📊 Commandes d'Inspection

# Voir le statut des migrations
npx prisma migrate status --schema=./prisma/schema.prisma

# Introspection de la base existante
npx prisma db pull --schema=./prisma/schema.prisma

# Validation du schéma
npx prisma validate --schema=./prisma/schema.prisma

## 🌱 Données de Test

# Peupler avec des données de test
npx prisma db seed --schema=./prisma/schema.prisma

## 🔗 Variables d'Environnement Requises

# Dans .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/saas_rh_ci"

## 📋 Tables Principales du Schéma

# Entreprises (clients de la plateforme)
# Users (utilisateurs administrateurs)
# Employes (employés des entreprises) 
# BulletinPaie (fiches de paie)
# DeclarationCNPS (déclarations mensuelles)
# HistoriqueEmploye (audit trail)
# Document (fichiers uploadés)

## 💡 Conseils

# 1. Toujours faire un backup avant reset
# 2. Utiliser Prisma Studio pour l'exploration visuelle
# 3. Les migrations gardent l'historique des changements
# 4. Le fichier seed.ts contient des données d'exemple