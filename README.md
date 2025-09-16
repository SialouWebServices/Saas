# 🏢 SaaS RH Côte d'Ivoire

> **Plateforme de Gestion des Ressources Humaines spécialement conçue pour les PME ivoiriennes**

[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://https://sialouwebservices.github.io/Saas/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://prisma.io/)
[![Mobile Money](https://img.shields.io/badge/Mobile%20Money-Integration-orange)](https://developer.orange.com/)

## 🎯 **Vision du Projet**

Révolutionner la gestion RH pour les entreprises ivoiriennes avec une solution **100% adaptée au contexte local** : conformité CNPS, paiements Mobile Money, interface mobile-first et tarification accessible.

### **🎪 Démo Live**
**[👉 Voir l'application en action](https://sialouwebservices.github.io/Saas/)**

---

## ⚡ **Démarrage Rapide**

### **🔗 Liens Utiles**
- **🏠 Homepage :** [Interface d'accueil](https://sialouwebservices.github.io/Saas/)
- **📋 Dashboard :** [Interface de gestion](https://sialouwebservices.github.io/Saas/dashboard.html)
- **👥 Gestion Employés :** [Module employés](https://sialouwebservices.github.io/Saas/employees.html)
- **💰 Module Paie :** [Calculs et bulletins](https://sialouwebservices.github.io/Saas/payroll.html)
- **💳 Tarification :** [Plans d'abonnement](https://sialouwebservices.github.io/Saas/pricing.html)

### **🔑 Comptes de Test**
```
👤 Administrateur
Email: admin@techsolutions.ci
Mot de passe: password123

👤 Gestionnaire RH  
Email: rh@techsolutions.ci
Mot de passe: password123
```

---

## 🚀 **Fonctionnalités Principales**

### **📊 Gestion des Employés**
- ✅ **CRUD complet** avec validation avancée
- ✅ **Import Excel** en masse avec template fourni
- ✅ **Gestion documentaire** (CV, contrats, fiches de poste)
- ✅ **Historique des modifications** avec traçabilité
- ✅ **Photos et documents** upload sécurisé

### **💰 Calcul de Paie Automatisé**
- ✅ **Conformité CNPS** : Cotisations automatiques (3.2% + 16.4%)
- ✅ **Barème fiscal ivoirien** : Calcul d'impôt sur salaire
- ✅ **Éléments variables** : Heures sup, primes, avances
- ✅ **Bulletins conformes** : Template légal code du travail CI
- ✅ **Export PDF/Excel** : Bulletins individuels + récapitulatifs

### **🏛️ Déclarations CNPS**
- ✅ **Génération automatique** : Calculs conformes CNPS
- ✅ **Export Excel officiel** : Format prêt pour dépôt
- ✅ **Validation des données** : Contrôles de cohérence
- ✅ **Historique complet** : Suivi des déclarations

### **📱 Paiements Mobile Money**
- ✅ **Orange Money API** : Virements automatiques
- ✅ **Wave Integration** : Paiements sans frais
- ✅ **MTN Mobile Money** : Support complet
- ✅ **Validation en lot** : Traitement groupé des salaires
- ✅ **Notifications SMS** : Confirmation aux employés

### **📈 Dashboard & Analytics**
- ✅ **Vue d'ensemble** : KPIs en temps réel
- ✅ **Évolution masse salariale** : Graphiques interactifs
- ✅ **Répartition départements** : Analyses visuelles
- ✅ **Échéances importantes** : Alertes automatiques
- ✅ **Rapports détaillés** : Export multi-formats

---

## 🛠️ **Technologies & Architecture**

### **🏗️ Stack Technique**
```typescript
Frontend    : Next.js 15 + TypeScript + Tailwind CSS
Backend     : Next.js API Routes + Prisma ORM  
Database    : PostgreSQL
Auth        : JWT + bcryptjs
Validation  : Zod
Mobile      : PWA + Service Worker
Paiements   : Orange Money + Wave + MTN APIs
```

### **📱 Design Mobile-First**
- **Responsive** : Optimisé smartphone → desktop
- **PWA** : Installable comme app native
- **Offline** : Fonctionnement hors connexion
- **Performance** : <3s temps de chargement

### **🔒 Sécurité & Conformité**
- **Authentification JWT** : Sessions sécurisées
- **Validation côté serveur** : Protection des données
- **HTTPS obligatoire** : Chiffrement complet
- **Conformité RGPD** : Respect vie privée

---

## 💰 **Modèle Économique**

### **🎯 Objectif : 100k CFA/mois de revenus récurrents**

| Plan | Prix/Mois | Employés | Fonctionnalités |
|------|-----------|----------|----------------|
| **🆓 Gratuit** | 0 CFA | 5 max | Gestion de base |
| **🚀 Starter** | 15,000 CFA | 25 max | Paie + CNPS + Support |
| **⭐ Pro** | 45,000 CFA | 100 max | Mobile Money + Analytics |
| **🏢 Enterprise** | Sur devis | Illimité | Personnalisation complète |

### **🎯 Marché Cible**
- **PME ivoiriennes** : 20-100 employés
- **Secteurs prioritaires** : Commerce, IT, Services
- **Pain points résolus** : Conformité CNPS, calculs paie, Mobile Money

---

## 🔧 **Installation & Développement**

### **📋 Prérequis**
```bash
Node.js 18+
PostgreSQL 14+
Git
```

### **⚡ Installation Locale**
```bash
# 1. Cloner le projet
git clone https://github.com/sialouwebservices/Saas/.git
cd saas-rh-ci

# 2. Installer les dépendances
npm install

# 3. Configuration environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# 4. Base de données
npx prisma db push
npx prisma db seed

# 5. Lancer le développement
npm run dev
```

### **🗄️ Configuration Base de Données**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_rh_ci"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Mobile Money APIs
ORANGE_MONEY_API_KEY="your-orange-key"
WAVE_API_KEY="your-wave-key"
MTN_SUBSCRIPTION_KEY="your-mtn-key"
```

---

## 📸 **Captures d'Écran**

### **🏠 Page d'Accueil**
![Homepage](./docs/screenshots/homepage.png)

### **📊 Dashboard Principal**  
![Dashboard](./docs/screenshots/dashboard.png)

### **👥 Gestion Employés**
![Employés](./docs/screenshots/employees.png)

### **💰 Module Paie**
![Paie](./docs/screenshots/payroll.png)

---

## 🧪 **Tests & Qualité**

### **🔍 Tests Automatisés**
```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

### **📊 Métriques Qualité**
- **Performance** : Lighthouse Score 95+
- **Accessibilité** : WCAG 2.1 AA
- **SEO** : Optimisé référencement
- **Best Practices** : Standards industrie

---

## 🚀 **Déploiement**

### **🌐 GitHub Pages (Demo)**
```bash
# Déploiement automatique via GitHub Actions
git push origin main
# ➜ Disponible sur : https://sialouwebservices.github.io/Saas/
```

### **☁️ Production (Vercel/Netlify)**
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### **🐳 Docker**
```bash
# Build image
docker build -t saas-rh-ci .

# Run container
docker run -p 3000:3000 saas-rh-ci
```

---

## 📈 **Roadmap & Évolutions**

### **🎯 Q1 2024**
- [x] ✅ MVP Core complet
- [x] ✅ Intégrations Mobile Money
- [x] ✅ Module CNPS conforme
- [ ] 🔄 Tests utilisateurs (10 PME pilotes)

### **🚀 Q2 2024**
- [ ] 📱 App mobile native (React Native)
- [ ] 🤖 IA pour prédictions paie
- [ ] 🌍 Multi-langues (Français/Anglais)
- [ ] 📊 Analytics avancées

### **⭐ Q3 2024**
- [ ] 🏦 Intégrations bancaires
- [ ] 📄 Signature électronique
- [ ] 🔗 API publique
- [ ] 🌐 Expansion régionale (Sénégal, Mali)

---

## 🤝 **Contribution**

### **🔀 Comment Contribuer**
1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Commit** vos changements (`git commit -m 'Add amazing feature'`)
4. **Push** la branche (`git push origin feature/amazing-feature`)
5. **Ouvrir** une Pull Request

### **📋 Guidelines**
- **Code Style** : ESLint + Prettier
- **Commits** : Convention Conventional Commits
- **Tests** : Coverage minimum 80%
- **Documentation** : JSDoc pour les fonctions

---

## 📝 **Documentation Complète**

### **📚 Guides Développeur**
- [🏗️ Architecture Technique](./docs/ARCHITECTURE.md)
- [🔌 APIs Documentation](./docs/API.md)
- [🎨 Guide Design System](./docs/DESIGN.md)
- [🧪 Guide Tests](./docs/TESTING.md)

### **👥 Guides Utilisateur**
- [🚀 Guide de Démarrage](./docs/GETTING_STARTED.md)
- [👤 Gestion Employés](./docs/EMPLOYEES.md)
- [💰 Module Paie](./docs/PAYROLL.md)
- [🏛️ Déclarations CNPS](./docs/CNPS.md)

---

## 📞 **Support & Contact**

### **💬 Communauté**
- **Discord** : [Serveur développeurs](https://discord.gg/sws)
- **Forum** : [GitHub Discussions](https://github.com/SialouWebServices/SaaS/ discussions)
- **Twitter** : [@SaasRhCI](https://twitter.com/sws)

### **🆘 Support Technique**
- **Email** : sialouwebservices@gmail.com
- **WhatsApp** : +225 05 06 62 82 14
- **Heures** : Lun-Ven 8h-18h (GMT+0)

### **🏢 Partenariats**
- **Email** : sialouwebservices@gmail.com
- **LinkedIn** : [Page Entreprise](https://linkedin.com/company/sws)

---

## 📄 **Licence**

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](./LICENSE) pour plus de détails.

### **🙏 Crédits**
- **Équipe** : Développé avec ❤️ pour les PME ivoiriennes
- **Partenaires** : Orange CI, Wave, MTN CI
- **Inspiration** : Communauté tech ivoirienne

---

## 🌟 **Remerciements**

Un grand merci à :
- **🇨🇮 Communauté tech ivoirienne** pour les retours
- **🏢 PME partenaires** pour les tests
- **💻 Contributeurs open source** pour leur aide
- **🎯 Vision 2030 CI numérique** pour l'inspiration

---

<div align="center">

### **🚀 Transformons ensemble la gestion RH en Côte d'Ivoire !**

[![Démo Live](https://img.shields.io/badge/🌟_Voir_la_Démo-Live-success?style=for-the-badge)](https://sialouwebservices.github.io/Saas/)


**Fait avec ❤️ en Côte d'Ivoire 🇨🇮**

</div>
