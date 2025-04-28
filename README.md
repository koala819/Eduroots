<img src="./public/icon-512x512.png" alt="Logo EduRootS" width="100" align="left">

<br>

# EduRootS - Application de Gestion de Classe pour Mosquées

<br>

![Version](https://img.shields.io/badge/version-1.523.5-dev-blue.svg)
![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.2.26-black.svg)
![React](https://img.shields.io/badge/React-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)

## 📝 Description

EduRootS est une application web moderne développée pour la gestion des classes dans les mosquées. Elle permet de gérer les étudiants, les enseignants, les présences, les comportements et offre un système de messagerie intégré.

## ✨ Fonctionnalités

- 👥 Gestion des utilisateurs (étudiants, enseignants, administrateurs)
- 📊 Suivi des présences
- 📝 Gestion des comportements
- 📧 Système de messagerie interne
- 🔐 Authentification sécurisée
- 📱 Interface responsive
- 📊 Tableaux de bord et statistiques
- 📤 Export de données
- 🔄 Synchronisation avec Google Calendar

## 🚀 Technologies Utilisées

- **Frontend:**
  - Next.js 14
  - React 18
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - Radix UI
  - React Hook Form
  - Zod

- **Backend:**
  - Node.js
  - MongoDB
  - Mongoose
  - NextAuth.js
  - bcrypt

- **Outils:**
  - ESLint
  - Prettier
  - Jest
  - Husky
  - Commitlint

## 📋 Prérequis

- Node.js (v18 ou supérieur)
- pnpm
- MongoDB
- Compte Google Cloud (pour l'authentification)
- Compte Cloudinary (pour le stockage des fichiers)

## 🛠️ Installation

1. Clonez le dépôt :
\`\`\`bash
git clone https://github.com/votre-username/eduroots.git
cd eduroots
\`\`\`

2. Installez les dépendances :
\`\`\`bash
pnpm install
\`\`\`

3. Créez un fichier \`.env\` à la racine du projet :
\`\`\`env
# Configuration de l'application
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Base de données
MONGODB_URI=mongodb://localhost:27017/your_database_name

# Authentification
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Configuration des emails
MAIL_USER=your_email@example.com
MAIL_PWD=your_email_password
MAIL_HOST=smtp.example.com
MAIL_PORT=587
DEFAULT_SENDER=your_default_sender@example.com
TECH_SUPPORT_EMAIL=your_tech_support@example.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Cloudinary
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

# Autres configurations
DEFAULT_NAME=Nom de votre établissement
WEBSITE_URL=https://your-website.com
WEBSITE_SCHOOL=https://your-school-website.com
\`\`\`

4. Lancez le serveur de développement :
\`\`\`bash
pnpm dev
\`\`\`

## 🧪 Tests

Pour exécuter les tests :
\`\`\`bash
# Tests API
pnpm test:api

# Tests DOM
pnpm test:dom

# Tous les tests
pnpm test
\`\`\`

## 📦 Build

Pour construire l'application pour la production :
\`\`\`bash
pnpm build
\`\`\`

## 🚀 Déploiement

L'application est configurée pour être déployée sur Vercel. Pour déployer :

1. Créez un compte sur [Vercel](https://vercel.com)
2. Connectez votre dépôt GitHub
3. Configurez les variables d'environnement
4. Déployez !

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (\`git checkout -b feature/AmazingFeature\`)
3. Committez vos changements (\`git commit -m 'Add some AmazingFeature'\`)
4. Push vers la branche (\`git push origin feature/AmazingFeature\`)
5. Ouvrez une Pull Request

## 📝 Conventions de Code

- Nous utilisons ESLint et Prettier pour le formatage du code
- Les commits doivent suivre les conventions de [Conventional Commits](https://www.conventionalcommits.org/)
- Les tests sont obligatoires pour les nouvelles fonctionnalités

## 📄 License

Ce projet est sous licence GNU Affero General Public License v3.0 (AGPL-3.0). Cette licence garantit que toute version modifiée de ce logiciel doit également être distribuée sous licence AGPL-3.0 et que le code source doit rester accessible gratuitement. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

- **Xavier** - *Développement initial* - [LinkedIn](https://www.linkedin.com/in/xavier-genolhac/)

## 🙏 Remerciements

- Tous les contributeurs qui ont participé au projet
- La communauté open source pour les outils et bibliothèques utilisés
- Les utilisateurs qui ont fourni des retours et suggestions
