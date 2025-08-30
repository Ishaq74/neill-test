# 💄 Artisan Beauty

**Plateforme web professionnelle pour maquilleuse d'art à Annecy**

Artisan Beauty est un site web complet dédié aux services de maquillage professionnel et de formation, conçu pour valoriser l'expertise d'une maquilleuse professionnelle et faciliter la relation avec sa clientèle dans la région d'Annecy.

---

## 🎯 Mission et Objectifs

### Notre Mission
Artisan Beauty a pour mission de **démocratiser l'accès à un maquillage professionnel de qualité** tout en offrant une **expérience client exceptionnelle**. La plateforme vise à :

- **Sublimer chaque moment important** de la vie des clients (mariages, soirées, événements, shootings)
- **Transmettre l'expertise** via des formations certifiantes pour tous niveaux
- **Créer une communauté** autour de la beauté et de l'art du maquillage
- **Offrir un service sur-mesure** adapté à chaque type de peau et style personnel

### Public Cible

**Clients principaux :**
- 👰 **Futures mariées** recherchant un maquillage exceptionnel pour leur jour J
- 🌟 **Particuliers** pour événements spéciaux (soirées, galas, anniversaires)
- 📸 **Professionnels** (photographes, modèles, acteurs) pour shootings et productions
- 🎭 **Artistes** nécessitant des effets spéciaux ou maquillages artistiques

**Apprenants :**
- 🎓 **Débutants passionnés** souhaitant apprendre les bases du maquillage
- 💼 **Professionnels en reconversion** vers les métiers de la beauté
- ✨ **Maquilleurs confirmés** voulant perfectionner leurs techniques
- 🏢 **Centres de formation** recherchant des modules spécialisés

---

## ✨ Fonctionnalités Principales

### 🛍️ Parcours Client
```
Découverte → Consultation → Réservation → Prestation → Suivi
```

**1. Découverte des Services**
- Catalogue détaillé des prestations (mariée, soirée, shooting, etc.)
- Galerie photo des réalisations par catégorie
- Grille tarifaire transparente avec descriptions complètes
- Témoignages clients et système d'avis 5 étoiles

**2. Consultation Personnalisée**
- Formulaire de contact pour demandes spécifiques
- Conseils personnalisés selon le type de peau et style
- Devis sur-mesure pour événements particuliers

**3. Système de Réservation Intelligent**
- Planning en temps réel avec disponibilités
- Calendrier interactif FullCalendar
- Confirmation automatique par email
- Gestion des créneaux et durées par service

**4. Suivi Client**
- Historique des prestations
- Rappels pour rendez-vous
- Programme de fidélité et offres spéciales

### 🎓 Parcours Formation
```
Exploration → Inscription → Apprentissage → Certification → Suivi
```

**Catalogue de Formations :**
- Formations débutant (bases du maquillage)
- Masterclass techniques avancées
- Spécialisations (mariée, artistique, effets spéciaux)
- Modules à la carte ou cursus complets

### 👩‍💼 Interface Administration
- **Gestion des services** : création, modification, tarification
- **Planning centralisé** : vue d'ensemble des réservations
- **Gestion clientèle** : historique, notes, préférences
- **Suivi formations** : inscriptions, progression, certifications
- **Facturation** : génération automatique, exports comptables
- **Analytics** : tableaux de bord performance et satisfaction

---

## 🛠️ Technologies Utilisées

### Frontend
- **[Astro](https://astro.build/)** - Framework web moderne pour des sites ultra-rapides
- **[React](https://react.dev/)** - Composants interactifs et état applicatif
- **[TypeScript](https://typescriptlang.org/)** - Typage statique pour plus de robustesse
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[Starwind UI](https://starwind-ui.com/)** - Composants UI modernes et accessibles

### Backend & Base de Données
- **[PostgreSQL](https://postgresql.org/)** avec **[Prisma](https://prisma.io/)** - Base de données relationnelle moderne et ORM type-safe
- **[better-auth](https://better-auth.com/)** - Système d'authentification moderne avec plugins admin
- **API Routes Astro** - Endpoints REST intégrés
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Chiffrement sécurisé des mots de passe

### Fonctionnalités Avancées
- **[FullCalendar](https://fullcalendar.io/)** - Système de réservation interactif
- **[Astro Icon](https://github.com/natemoo-re/astro-icon)** - Icônes optimisées
- **[Astro Font](https://github.com/natemoo-re/astro-font)** - Gestion des polices locales

### Outils de Développement
- **[Task Master AI](https://github.com/pierrebcfr/task-master-ai)** - Gestion automatisée des tâches
- **Vite** - Bundler ultra-rapide
- **ESLint** & **Prettier** - Qualité de code

---

## 🚀 Installation

### Prérequis
- **Node.js** 18+ 
- **npm** ou **pnpm**
- **Git**

### Installation Locale

```bash
# Cloner le repository
git clone https://github.com/Agirumi74/artisan-beauty.git
cd artisan-beauty

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Le site sera accessible sur http://localhost:4321
```

### Build de Production

```bash
# Compiler pour la production
npm run build

# Prévisualiser le build
npm run preview
```

### Configuration Base de Données

Le projet utilise PostgreSQL avec Prisma. Suivez le guide de migration pour la configuration :

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Configurer votre base de données PostgreSQL dans .env
# DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push

# Seeder la base avec des données de test
npm run db:seed
```

**Voir [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) pour les instructions complètes.**

---

## 📁 Structure du Projet

```
artisan-beauty/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── starwind/       # Composants UI Starwind
│   │   ├── AccueilAvis.astro
│   │   ├── AccueilGallery.astro
│   │   └── AccueilFaq.astro
│   ├── layouts/            # Layouts de page
│   │   └── Layout.astro
│   ├── pages/              # Pages et routes API
│   │   ├── api/           # Endpoints API
│   │   ├── admin/         # Interface administration
│   │   ├── services/      # Pages services
│   │   ├── formations/    # Pages formations
│   │   ├── reservations/  # Système de réservation
│   │   ├── index.astro    # Page d'accueil
│   │   ├── contact.astro  # Page contact
│   │   └── galerie.astro  # Galerie photos
│   ├── types/             # Définitions TypeScript
│   │   ├── Service.ts
│   │   ├── Formation.ts
│   │   ├── Reservation.ts
│   │   ├── Utilisateur.ts
│   │   └── ...
│   ├── lib/               # Utilitaires et helpers
│   │   ├── db.ts         # Client base de données Prisma
│   │   ├── auth.ts       # Configuration better-auth
│   │   ├── auth-client.ts # Client auth côté frontend
│   │   └── utils.ts      # Fonctions utilitaires
│   ├── styles/           # Styles globaux
│   │   ├── global.css
│   │   └── starwind.css
│   └── assets/           # Ressources (seeds, etc.)
├── public/               # Assets statiques
│   ├── assets/          # Images du site
│   └── fonts/           # Polices locales
├── prisma/               # Configuration Prisma
│   ├── schema.prisma    # Schéma de base de données
│   └── seed.ts         # Script de seeding
├── astro.config.mjs     # Configuration Astro
├── tailwind.config.js   # Configuration Tailwind
├── tsconfig.json        # Configuration TypeScript
└── package.json         # Dépendances et scripts
```

### Architecture des Données

**Entités principales :**
- `Services` - Catalogue des prestations de maquillage
- `Formations` - Cours et ateliers proposés
- `Reservations` - Planification des rendez-vous
- `Utilisateurs` - Gestion clients et administrateurs
- `Avis` - Système de témoignages clients
- `Galerie` - Portfolio photo des réalisations
- `Factures` - Gestion comptable et paiements

---

## 🤝 Contribution

### Pour les Développeurs

```bash
# Fork le projet sur GitHub
git clone https://github.com/VOTRE-USERNAME/artisan-beauty.git

# Créer une branche pour votre feature
git checkout -b feature/nouvelle-fonctionnalite

# Commiter vos changements
git commit -m "feat: ajout nouvelle fonctionnalité"

# Pousser la branche
git push origin feature/nouvelle-fonctionnalite

# Créer une Pull Request
```

### Standards de Code
- **TypeScript** obligatoire pour tout nouveau code
- **Composants Astro** privilégiés pour le contenu statique
- **React** pour les interactions complexes uniquement
- **Tailwind CSS** pour le styling
- **Conventions de nommage** : camelCase pour JS/TS, kebab-case pour les fichiers

### Tests et Qualité
```bash
# Vérification TypeScript
npm run check

# Formatage du code
npm run format

# Build de vérification
npm run build
```

---

## 📈 Roadmap

### Version Actuelle (v1.0)
- ✅ Catalogue services et formations
- ✅ Système de réservation basique
- ✅ Interface administration
- ✅ Gestion utilisateurs

### Prochaines Versions
- 🔄 **v1.1** : Intégration paiement en ligne (Stripe)
- 🔄 **v1.2** : Application mobile (React Native)
- 🔄 **v1.3** : Programme de fidélité avancé
- 🔄 **v1.4** : Marketplace multi-artisans
- 🔄 **v2.0** : IA pour recommandations personnalisées

---

## 📞 Support et Contact

### Développement Technique
- **Issues GitHub** : [Créer un ticket](https://github.com/Agirumi74/artisan-beauty/issues)
- **Discussions** : [Forum communautaire](https://github.com/Agirumi74/artisan-beauty/discussions)

### Business et Partenariats
- **Site Web** : [Artisan Beauty](https://artisan-beauty.com)
- **Email** : contact@artisan-beauty.com
- **LinkedIn** : [Profil Artisan Beauty](https://linkedin.com/company/artisan-beauty)

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- **[Astro Team](https://astro.build/)** pour le framework exceptionnel
- **[Tailwind Labs](https://tailwindcss.com/)** pour le système de design
- **[Starwind UI](https://starwind-ui.com/)** pour les composants de qualité
- **Communauté Open Source** pour l'inspiration et les contributions

---

💄 **Artisan Beauty** - *Sublimer votre beauté, révéler votre talent*