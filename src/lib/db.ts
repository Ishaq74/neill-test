import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

// Migration automatique des colonnes createdAt/updatedAt pour formations
const pragmaForm = db.prepare("PRAGMA table_info(formations)").all();
const hasCreatedAt = pragmaForm.some((col: any) => col && typeof col.name === 'string' && col.name === 'createdAt');
if (!hasCreatedAt) {
  db.exec("ALTER TABLE formations ADD COLUMN createdAt TEXT;");
}
const hasUpdatedAt = pragmaForm.some((col: any) => col && typeof col.name === 'string' && col.name === 'updatedAt');
if (!hasUpdatedAt) {
  db.exec("ALTER TABLE formations ADD COLUMN updatedAt TEXT;");
}

// Migration automatique des colonnes createdAt/updatedAt pour formations
try {
  const pragmaForm = db.prepare("PRAGMA table_info(formations)").all();
  const hasCreatedAt = pragmaForm.some((col: any) => col && typeof col.name === 'string' && col.name === 'createdAt');
  if (!hasCreatedAt) {
    db.exec("ALTER TABLE formations ADD COLUMN createdAt TEXT;");
  }
  const hasUpdatedAt = pragmaForm.some((col: any) => col && typeof col.name === 'string' && col.name === 'updatedAt');
  if (!hasUpdatedAt) {
    db.exec("ALTER TABLE formations ADD COLUMN updatedAt TEXT;");
  }
} catch (e) { /* ignore */ }

// Table pour les créneaux bloqués (admin calendrier)
db.exec(`
  CREATE TABLE IF NOT EXISTS blocked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT,
    allDay INTEGER DEFAULT 0
  );
`);

// Générateur de slug simple (français, accents, espaces)
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}


// Migration automatique des anciennes colonnes de reservations (juste après l’instanciation de db)
try {
  const pragma = db.prepare("PRAGMA table_info(reservations)").all();
  const hasOld = Array.isArray(pragma) && pragma.some((col: any) => col && typeof col.name === 'string' && col.name === 'utilisateurId');
  if (hasOld) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS reservations_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        serviceId TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
    db.exec(`
      INSERT INTO reservations_new (id, userId, serviceId, date, time, status)
      SELECT id, CAST(utilisateurId AS TEXT), CAST(serviceId AS TEXT), date, heure, statut FROM reservations;
    `);
    db.exec('DROP TABLE reservations;');
    db.exec('ALTER TABLE reservations_new RENAME TO reservations;');
  }
} catch (e) {
  // Ignore si la migration échoue (ex: table déjà migrée)
}


// Table galerie enrichie (liaisons globales, services, formations)

// Migration automatique du champ alt (texte alternatif accessibilité) pour galerie
const pragmaGalerie = db.prepare("PRAGMA table_info(galerie)").all();
const hasAlt = pragmaGalerie.some((col: any) => col && typeof col.name === 'string' && col.name === 'alt');
if (!hasAlt) {
  db.exec("ALTER TABLE galerie ADD COLUMN alt TEXT;");
}
db.exec(`
  CREATE TABLE IF NOT EXISTS galerie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    alt TEXT,
    description TEXT,
    uploadedBy TEXT,
    createdAt TEXT NOT NULL,
    global INTEGER DEFAULT 0,
    servicesGlobal INTEGER DEFAULT 0,
    formationsGlobal INTEGER DEFAULT 0,
    serviceId INTEGER,
    formationId INTEGER,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (formationId) REFERENCES formations(id) ON DELETE CASCADE
  );
`);

// Table avis enrichie (liaisons globales, services, formations)
db.exec(`
  CREATE TABLE IF NOT EXISTS avis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur TEXT NOT NULL,
    commentaire TEXT,
    note INTEGER NOT NULL,
    global INTEGER DEFAULT 0,
    servicesGlobal INTEGER DEFAULT 0,
    formationsGlobal INTEGER DEFAULT 0,
    serviceId INTEGER,
    formationId INTEGER,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (formationId) REFERENCES formations(id) ON DELETE CASCADE
  );
`);

// Table reservations (nouvelle structure)

// Ajout du champ notes si absent
const pragmaRes = db.prepare("PRAGMA table_info(reservations)").all();
const hasNotes = pragmaRes.some((col: any) => col && typeof col.name === 'string' && col.name === "notes");
if (!hasNotes) {
  db.exec("ALTER TABLE reservations ADD COLUMN notes TEXT;");
}
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    serviceId INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (userId) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE
  );
`);

// Table factures (unique, cohérente)
db.exec(`
  CREATE TABLE IF NOT EXISTS factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservationId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL,
    pdfUrl TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (reservationId) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES utilisateurs(id) ON DELETE CASCADE
  );
`);

// Table utilisateurs (unique, cohérente)
db.exec(`
  CREATE TABLE IF NOT EXISTS utilisateurs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );
`);


// Table services enrichie (SEO, admin, UI, pertinence)
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    description TEXT,
    content TEXT,
    notes TEXT,
    prix REAL NOT NULL,
    image TEXT,
    imageAlt TEXT,
    icon TEXT,
    categorie TEXT,
    tags TEXT,
    steps TEXT,
    duree TEXT,
    durationMinutes INTEGER,
    slug TEXT NOT NULL UNIQUE,
    isActive INTEGER DEFAULT 1,
    isFeatured INTEGER DEFAULT 0
  );
`);

// Table formations enrichie (SEO, admin, UI, pertinence)
db.exec(`
  CREATE TABLE IF NOT EXISTS formations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    description TEXT,
    content TEXT,
    notes TEXT,
    prix REAL NOT NULL,
    image TEXT,
    imageAlt TEXT,
    icon TEXT,
    categorie TEXT,
    tags TEXT,
    steps TEXT,
    duree TEXT,
    durationMinutes INTEGER,
    slug TEXT NOT NULL UNIQUE,
    isActive INTEGER DEFAULT 1,
    isFeatured INTEGER DEFAULT 0,
    certification TEXT
  );
`);

// Table identité du site (infos globales, SEO, contact, diplômes, etc)
db.exec(`
  CREATE TABLE IF NOT EXISTS site_identity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    slogan TEXT,
    description TEXT,
    adresse TEXT,
    codePostal TEXT,
    ville TEXT,
    pays TEXT,
    telephone TEXT,
    email TEXT,
    siteUrl TEXT,
    logo TEXT,
    facebook TEXT,
    instagram TEXT,
    linkedin TEXT,
    tiktok TEXT,
    youtube TEXT,
    mentionsLegales TEXT,
    politiqueConfidentialite TEXT,
    diplomePrincipal TEXT,
    certifications TEXT,
    horaires TEXT
  );
`);

// Table équipe (team) pour relier services/formations/personnes
db.exec(`
  CREATE TABLE IF NOT EXISTS team (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    role TEXT,
    bio TEXT,
    photo TEXT,
    email TEXT,
    telephone TEXT,
    linkedin TEXT,
    instagram TEXT,
    certifications TEXT,
    diplome TEXT,
    isActive INTEGER DEFAULT 1
  );
`);


// Seed SiteIdentity (infos globales du site)
const rowSite = db.prepare('SELECT COUNT(*) as count FROM site_identity').get() as { count: number };
if (rowSite.count === 0) {
  db.prepare(`INSERT INTO site_identity (
    nom, slogan, description, adresse, codePostal, ville, pays, telephone, email, siteUrl, logo, facebook, instagram, linkedin, tiktok, youtube, mentionsLegales, politiqueConfidentialite, diplomePrincipal, certifications, horaires
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      'Neill Make Up à Annecy',
      'Sublimez votre beauté, révélez votre personnalité',
      'Neill Make Up à Annecy propose des prestations de maquillage professionnel, formations, conseils beauté et accompagnement personnalisé pour tous vos événements.',
      '12 rue Royale',
      '74000',
      'Annecy',
      'France',
      '+33 6 12 34 56 78',
      'contact@neillmakeup.fr',
      'https://www.neillmakeup.fr',
      '/assets/logo-neillmakeup-annecy.svg',
      'https://facebook.com/neillmakeup',
      'https://instagram.com/neillmakeup',
      'https://linkedin.com/company/neillmakeup',
      'https://tiktok.com/@neillmakeup',
      'https://youtube.com/@neillmakeup',
      'Mentions légales : Neill Make Up, 12 rue Royale, 74000 Annecy. SIRET 123 456 789 00012. Responsable : Neill Dupont.',
      'Politique de confidentialité conforme RGPD disponible sur le site.',
      'Diplôme d’État Maquilleur Professionnel',
      'Certifiée Make Up For Ever, MAC Pro, Lauréate Wedding Awards 2024',
      'Lundi-samedi 9h-19h, sur rendez-vous'
    );
}

// Seed Team (équipe du site)
const rowTeam = db.prepare('SELECT COUNT(*) as count FROM team').get() as { count: number };
if (rowTeam.count === 0) {
  const teamSeed = [
    {
      nom: 'Neill Dupont',
      role: 'Fondatrice & Maquilleuse professionnelle',
      bio: 'Neill est maquilleuse professionnelle diplômée, spécialisée mariage, shooting, effets spéciaux et formation. Plus de 10 ans d’expérience à Annecy et Paris.',
      photo: '/assets/team-neill-dupont-annecy.webp',
      email: 'neill.dupont@neillmakeup.fr',
      telephone: '+33 6 12 34 56 78',
      linkedin: 'https://linkedin.com/in/neilldupont',
      instagram: 'https://instagram.com/neill.dupont',
      certifications: 'MAC Pro, Make Up For Ever, Wedding Awards',
      diplome: 'Diplôme d’État Maquilleur Professionnel',
      isActive: 1
    },
    {
      nom: 'Léa Martin',
      role: 'Assistante maquilleuse & formatrice',
      bio: 'Léa accompagne Neill sur les prestations mariage et anime les ateliers d’auto-maquillage. Passionnée par la pédagogie et la beauté inclusive.',
      photo: '/assets/team-lea-martin-annecy.webp',
      email: 'lea.martin@neillmakeup.fr',
      telephone: '+33 6 98 76 54 32',
      linkedin: 'https://linkedin.com/in/leamartin',
      instagram: 'https://instagram.com/lea.martin',
      certifications: 'Formée Make Up For Ever',
      diplome: 'CAP Esthétique Cosmétique',
      isActive: 1
    },
    {
      nom: 'Sophie Bernard',
      role: 'Community manager & photographe',
      bio: 'Sophie gère la communication digitale et réalise les shootings photo pour le site et les réseaux sociaux.',
      photo: '/assets/team-sophie-bernard-annecy.webp',
      email: 'sophie.bernard@neillmakeup.fr',
      telephone: '+33 7 11 22 33 44',
      linkedin: 'https://linkedin.com/in/sophiebernard',
      instagram: 'https://instagram.com/sophie.bernard',
      certifications: 'Photographe professionnelle',
      diplome: 'BTS Photographie',
      isActive: 1
    }
  ];
  const insert = db.prepare('INSERT INTO team (nom, role, bio, photo, email, telephone, linkedin, instagram, certifications, diplome, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const t of teamSeed) {
    insert.run(t.nom, t.role, t.bio, t.photo, t.email, t.telephone, t.linkedin, t.instagram, t.certifications, t.diplome, t.isActive);
  }
}

// 1. Seed services avec slugs
const row = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
if (row.count === 0) {
  const seed = [
    {
      nom: 'Maquillage Mariée',
      description: 'Maquillage professionnel longue tenue, naturel ou sophistiqué, avec essai préalable et conseils personnalisés pour le grand jour.',
      prix: 150,
      image: '/assets/maquillage-mariee-annecy.webp',
      alt: 'Jeune mariée à Annecy, maquillage lumineux, regard souligné, coiffure romantique, robe blanche en dentelle, bouquet pastel',
      categorie: 'Événement',
      duree: '2h'
    },
    {
      nom: 'Maquillage Soirée',
      description: 'Look glamour pour vos soirées : smoky eyes, bouche intense, paillettes ou liner graphique, selon vos envies.',
      prix: 70,
      image: '/assets/maquillage-soiree-annecy.webp',
      alt: 'Femme maquillée pour une soirée à Annecy, smoky eyes noir, lèvres rouges, robe élégante, ambiance festive',
      categorie: 'Événement',
      duree: '1h15'
    },
    {
      nom: 'Shooting Photo',
      description: 'Maquillage HD adapté à la photo, lumière naturelle ou studio, pour book, portrait ou campagne pro.',
      prix: 90,
      image: '/assets/maquillage-shooting-annecy.webp',
      alt: 'Modèle en shooting photo à Annecy, teint parfait, lumière studio, pose professionnelle, fond neutre',
      categorie: 'Shooting',
      duree: '1h30'
    },
    {
      nom: 'Maquillage Effets Spéciaux',
      description: 'Body painting, Halloween, cicatrices réalistes, transformations artistiques pour événements ou spectacles.',
      prix: 180,
      image: '/assets/maquillage-fx-annecy.webp',
      alt: 'Visage maquillé en zombie réaliste à Annecy, fausse cicatrice, faux sang, ambiance Halloween',
      categorie: 'Artistique',
      duree: '2h30'
    },
    {
      nom: 'Cours d’auto-maquillage',
      description: 'Atelier individuel ou en groupe pour apprendre à se maquiller au quotidien, conseils adaptés à votre morphologie.',
      prix: 65,
      image: '/assets/cours-maquillage-annecy.webp',
      alt: 'Atelier auto-maquillage à Annecy, formatrice expliquant un geste, miroir, palette de maquillage, ambiance conviviale',
      categorie: 'Formation',
      duree: '1h30'
    },
    {
      nom: 'Maquillage Enfant',
      description: 'Maquillage doux et hypoallergénique pour enfants, idéal pour anniversaires, kermesses ou fêtes scolaires.',
      prix: 40,
      image: '/assets/maquillage-enfant-annecy.webp',
      alt: 'Petite fille maquillée en papillon à Annecy, couleurs vives, sourire, ambiance festive',
      categorie: 'Enfant',
      duree: '45min'
    },
    {
      nom: 'Maquillage Homme',
      description: 'Correction du teint, matité, naturel pour shooting, événement ou média, sans effet de matière.',
      prix: 50,
      image: '/assets/maquillage-homme-annecy.webp',
      alt: 'Homme maquillé discrètement à Annecy, teint unifié, look naturel, chemise blanche, fond neutre',
      categorie: 'Homme',
      duree: '45min'
    },
    {
      nom: 'Maquillage TV/Studio',
      description: 'Maquillage adapté aux lumières de plateau, longue tenue, anti-brillance, pour tournage ou direct.',
      prix: 120,
      image: '/assets/maquillage-tv-annecy.webp',
      alt: 'Femme en plateau TV à Annecy, maquillage mat, projecteurs, micro-cravate, décor studio',
      categorie: 'Studio',
      duree: '1h'
    },
    {
      nom: 'Maquillage Backstage',
      description: 'Défilés, mode, retouches rapides, looks créatifs, ambiance coulisses et effervescence.',
      prix: 110,
      image: '/assets/maquillage-backstage-annecy.webp',
      alt: 'Coulisses de défilé à Annecy, maquilleuse en action, modèle assise, ambiance backstage',
      categorie: 'Mode',
      duree: '1h'
    },
    {
      nom: 'Maquillage Festival',
      description: 'Paillettes, couleurs, looks fun pour festivals, concerts ou événements estivaux à Annecy.',
      prix: 80,
      image: '/assets/maquillage-festival-annecy.webp',
      alt: 'Jeune femme à un festival à Annecy, maquillage pailleté, coiffure bohème, ambiance estivale',
      categorie: 'Événement',
      duree: '1h'
    }
  ];
  // (ancienne seed supprimée, remplacée par servicesSeed enrichi)
  const servicesSeed = [
    {
      nom: 'Maquillage Mariée',
      description: 'Maquillage professionnel longue tenue, naturel ou sophistiqué, avec essai préalable et conseils personnalisés pour le grand jour.',
      content: 'Préparation de la peau, choix des produits waterproof, essai personnalisé, conseils pour la tenue du maquillage toute la journée.',
      notes: 'Essai inclus, déplacement possible à domicile, produits hypoallergéniques.',
      prix: 150,
      image: '/assets/maquillage-mariee-annecy.webp',
      imageAlt: 'Jeune mariée à Annecy, maquillage lumineux, regard souligné, coiffure romantique, robe blanche en dentelle, bouquet pastel',
      icon: 'wedding',
      categorie: 'Événement',
      tags: ['mariage', 'naturel', 'longue tenue'],
      steps: ['Préparation', 'Essai', 'Jour J', 'Finitions'],
      duree: '2h',
      durationMinutes: 120,
      slug: slugify('Maquillage Mariée'),
      isActive: 1,
      isFeatured: 1
    },
    {
      nom: 'Maquillage Soirée',
      description: 'Look glamour pour vos soirées : smoky eyes, bouche intense, paillettes ou liner graphique, selon vos envies.',
      content: 'Maquillage adapté à la lumière artificielle, pose de faux-cils, choix de couleurs intenses.',
      notes: 'Déplacement possible, conseils tenues, produits longue tenue.',
      prix: 70,
      image: '/assets/maquillage-soiree-annecy.webp',
      imageAlt: 'Femme maquillée pour une soirée à Annecy, smoky eyes noir, lèvres rouges, robe élégante, ambiance festive',
      icon: 'nightlife',
      categorie: 'Événement',
      tags: ['soirée', 'glamour', 'smoky eyes'],
      steps: ['Préparation', 'Maquillage yeux', 'Lèvres', 'Finitions'],
      duree: '1h15',
      durationMinutes: 75,
      slug: slugify('Maquillage Soirée'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Shooting Photo',
      description: 'Maquillage HD adapté à la photo, lumière naturelle ou studio, pour book, portrait ou campagne pro.',
      content: 'Correction du teint, maquillage sans brillance, conseils pose photo.',
      notes: 'Prévoir tenues adaptées, possibilité de retouches sur place.',
      prix: 90,
      image: '/assets/maquillage-shooting-annecy.webp',
      imageAlt: 'Modèle en shooting photo à Annecy, teint parfait, lumière studio, pose professionnelle, fond neutre',
      icon: 'camera',
      categorie: 'Shooting',
      tags: ['shooting', 'photo', 'studio'],
      steps: ['Préparation', 'Maquillage', 'Shooting', 'Retouches'],
      duree: '1h30',
      durationMinutes: 90,
      slug: slugify('Shooting Photo'),
      isActive: 1,
      isFeatured: 1
    },
    {
      nom: 'Maquillage Effets Spéciaux',
      description: 'Body painting, Halloween, cicatrices réalistes, transformations artistiques pour événements ou spectacles.',
      content: 'Création de prothèses, pose de latex, peinture corporelle, effets sanglants.',
      notes: 'Prévoir temps de démaquillage, produits professionnels FX.',
      prix: 180,
      image: '/assets/maquillage-fx-annecy.webp',
      imageAlt: 'Visage maquillé en zombie réaliste à Annecy, fausse cicatrice, faux sang, ambiance Halloween',
      icon: 'fx',
      categorie: 'Artistique',
      tags: ['fx', 'halloween', 'body painting'],
      steps: ['Préparation', 'Création FX', 'Application', 'Finitions'],
      duree: '2h30',
      durationMinutes: 150,
      slug: slugify('Maquillage Effets Spéciaux'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Cours d’auto-maquillage',
      description: 'Atelier individuel ou en groupe pour apprendre à se maquiller au quotidien, conseils adaptés à votre morphologie.',
      content: 'Analyse du visage, techniques de base, astuces personnalisées, pratique guidée.',
      notes: 'Supports pédagogiques fournis, petit groupe possible.',
      prix: 65,
      image: '/assets/cours-maquillage-annecy.webp',
      imageAlt: 'Atelier auto-maquillage à Annecy, formatrice expliquant un geste, miroir, palette de maquillage, ambiance conviviale',
      icon: 'education',
      categorie: 'Formation',
      tags: ['atelier', 'auto-maquillage', 'formation'],
      steps: ['Analyse', 'Démonstration', 'Pratique', 'Conseils'],
      duree: '1h30',
      durationMinutes: 90,
      slug: slugify('Cours d’auto-maquillage'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Maquillage Enfant',
      description: 'Maquillage doux et hypoallergénique pour enfants, idéal pour anniversaires, kermesses ou fêtes scolaires.',
      content: 'Choix de modèles ludiques, application rapide, produits adaptés à la peau fragile.',
      notes: 'Produits testés dermatologiquement, nettoyage facile.',
      prix: 40,
      image: '/assets/maquillage-enfant-annecy.webp',
      imageAlt: 'Petite fille maquillée en papillon à Annecy, couleurs vives, sourire, ambiance festive',
      icon: 'child',
      categorie: 'Enfant',
      tags: ['enfant', 'anniversaire', 'fête'],
      steps: ['Choix du modèle', 'Maquillage', 'Finitions'],
      duree: '45min',
      durationMinutes: 45,
      slug: slugify('Maquillage Enfant'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Maquillage Homme',
      description: 'Correction du teint, matité, naturel pour shooting, événement ou média, sans effet de matière.',
      content: 'Maquillage discret, correction des cernes, matité, conseils pour photo.',
      notes: 'Effet invisible, adapté à la barbe.',
      prix: 50,
      image: '/assets/maquillage-homme-annecy.webp',
      imageAlt: 'Homme maquillé discrètement à Annecy, teint unifié, look naturel, chemise blanche, fond neutre',
      icon: 'man',
      categorie: 'Homme',
      tags: ['homme', 'naturel', 'shooting'],
      steps: ['Préparation', 'Correction', 'Matité'],
      duree: '45min',
      durationMinutes: 45,
      slug: slugify('Maquillage Homme'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Maquillage TV/Studio',
      description: 'Maquillage adapté aux lumières de plateau, longue tenue, anti-brillance, pour tournage ou direct.',
      content: 'Préparation de la peau, produits anti-brillance, retouches en plateau.',
      notes: 'Tenue longue durée, conseils pour caméra.',
      prix: 120,
      image: '/assets/maquillage-tv-annecy.webp',
      imageAlt: 'Femme en plateau TV à Annecy, maquillage mat, projecteurs, micro-cravate, décor studio',
      icon: 'tv',
      categorie: 'Studio',
      tags: ['tv', 'studio', 'anti-brillance'],
      steps: ['Préparation', 'Maquillage', 'Retouches'],
      duree: '1h',
      durationMinutes: 60,
      slug: slugify('Maquillage TV/Studio'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Maquillage Backstage',
      description: 'Défilés, mode, retouches rapides, looks créatifs, ambiance coulisses et effervescence.',
      content: 'Gestion du temps, looks créatifs, retouches express.',
      notes: 'Ambiance backstage, rapidité d’exécution.',
      prix: 110,
      image: '/assets/maquillage-backstage-annecy.webp',
      imageAlt: 'Coulisses de défilé à Annecy, maquilleuse en action, modèle assise, ambiance backstage',
      icon: 'backstage',
      categorie: 'Mode',
      tags: ['défilé', 'mode', 'backstage'],
      steps: ['Préparation', 'Look', 'Retouches'],
      duree: '1h',
      durationMinutes: 60,
      slug: slugify('Maquillage Backstage'),
      isActive: 1,
      isFeatured: 0
    },
    {
      nom: 'Maquillage Festival',
      description: 'Paillettes, couleurs, looks fun pour festivals, concerts ou événements estivaux à Annecy.',
      content: 'Application de paillettes, couleurs vives, looks créatifs.',
      notes: 'Résistant à la chaleur, conseils pour la tenue en extérieur.',
      prix: 80,
      image: '/assets/maquillage-festival-annecy.webp',
      imageAlt: 'Jeune femme à un festival à Annecy, maquillage pailleté, coiffure bohème, ambiance estivale',
      icon: 'festival',
      categorie: 'Événement',
      tags: ['festival', 'couleurs', 'paillettes'],
      steps: ['Préparation', 'Maquillage', 'Finitions'],
      duree: '1h',
      durationMinutes: 60,
      slug: slugify('Maquillage Festival'),
      isActive: 1,
      isFeatured: 0
    }
  ];
  const insertService = db.prepare('INSERT INTO services (nom, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const s of servicesSeed) {
    insertService.run(
      s.nom,
      s.description,
      s.content,
      s.notes,
      s.prix,
      s.image,
      s.imageAlt,
      s.icon,
      s.categorie,
      JSON.stringify(s.tags),
      JSON.stringify(s.steps),
      s.duree,
      s.durationMinutes,
      s.slug,
      s.isActive,
      s.isFeatured
    );
  }
}

// 2. Seed formations
const rowForm = db.prepare('SELECT COUNT(*) as count FROM formations').get() as { count: number };
if (rowForm.count === 0) {
  const formationsSeed = [
    {
      titre: 'Formation Maquillage Professionnel',
      description: 'Devenir maquilleuse professionnelle : techniques avancées, hygiène, gestion client, stage pratique.',
      content: 'Programme complet sur 5 jours, pratique sur modèles, théorie et business.',
      notes: 'Certificat délivré, matériel fourni, places limitées.',
      prix: 1200,
      image: '/assets/formation-maquillage-pro-annecy.webp',
      imageAlt: 'Salle de formation maquillage professionnel à Annecy, formatrice et stagiaires, ambiance studieuse',
      icon: 'school',
      categorie: 'Professionnel',
      tags: ['pro', 'technique', 'stage'],
      steps: ['Théorie', 'Démonstration', 'Pratique', 'Stage', 'Évaluation'],
      duree: '5j',
      durationMinutes: 2400,
      slug: slugify('Formation Maquillage Professionnel'),
      isActive: 1,
      isFeatured: 1,
      certification: 'Certificat Neill Make Up'
    },
    {
      titre: 'Initiation Beauté',
      description: 'Bases du maquillage, colorimétrie, morphologie, trousse idéale.',
      content: 'Découverte des produits, techniques de base, conseils personnalisés.',
      notes: 'Ouvert à tous, matériel prêté.',
      prix: 290,
      image: '/assets/formation-initiation-beaute-annecy.webp',
      imageAlt: 'Atelier initiation beauté à Annecy, démonstration maquillage, ambiance conviviale',
      icon: 'brush',
      categorie: 'Découverte',
      tags: ['initiation', 'bases', 'conseils'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '1j',
      durationMinutes: 480,
      slug: slugify('Initiation Beauté'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Attestation de participation'
    },
    {
      titre: 'Perfectionnement Artistique',
      description: 'Effets spéciaux, face painting, tendances mode, créativité.',
      content: 'Techniques avancées, créativité, réalisation de looks artistiques.',
      notes: 'Matériel FX fourni, places limitées.',
      prix: 650,
      image: '/assets/formation-perfectionnement-artistique-annecy.webp',
      imageAlt: 'Formation perfectionnement artistique à Annecy, face painting, couleurs vives',
      icon: 'palette',
      categorie: 'Artistique',
      tags: ['fx', 'artistique', 'créativité'],
      steps: ['Théorie', 'Démonstration', 'Pratique'],
      duree: '2j',
      durationMinutes: 960,
      slug: slugify('Perfectionnement Artistique'),
      isActive: 1,
      isFeatured: 1,
      certification: 'Certificat FX'
    },
    {
      titre: 'Atelier Maquillage Mariée',
      description: 'Spécial mariage, gestion du stress, waterproof, essai.',
      content: 'Techniques spécifiques mariage, essai sur modèle, conseils tenues.',
      notes: 'Essai inclus, support PDF offert.',
      prix: 350,
      image: '/assets/formation-maquillage-mariee-annecy.webp',
      imageAlt: 'Atelier maquillage mariée à Annecy, essai maquillage, conseils personnalisés',
      icon: 'wedding',
      categorie: 'Événement',
      tags: ['mariée', 'essai', 'waterproof'],
      steps: ['Présentation', 'Essai', 'Conseils'],
      duree: '1j',
      durationMinutes: 480,
      slug: slugify('Atelier Maquillage Mariée'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Attestation Mariée'
    },
    {
      titre: 'Stage Enfant',
      description: 'Maquillage ludique et sécurisé pour enfants.',
      content: 'Techniques adaptées, modèles ludiques, sécurité avant tout.',
      notes: 'Matériel hypoallergénique fourni.',
      prix: 120,
      image: '/assets/formation-enfant-annecy.webp',
      imageAlt: 'Stage maquillage enfant à Annecy, enfants maquillés, ambiance ludique',
      icon: 'child',
      categorie: 'Enfant',
      tags: ['enfant', 'ludique', 'sécurité'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '0.5j',
      durationMinutes: 240,
      slug: slugify('Stage Enfant'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Diplôme Enfant'
    },
    {
      titre: 'Masterclass Smoky Eyes',
      description: 'Maîtriser le smoky eyes, tous niveaux.',
      content: 'Démonstration, pratique guidée, astuces pro.',
      notes: 'Matériel fourni, support vidéo.',
      prix: 180,
      image: '/assets/formation-smoky-eyes-annecy.webp',
      imageAlt: 'Masterclass smoky eyes à Annecy, démonstration technique, palette de fards',
      icon: 'eye',
      categorie: 'Technique',
      tags: ['smoky eyes', 'technique', 'masterclass'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '0.5j',
      durationMinutes: 240,
      slug: slugify('Masterclass Smoky Eyes'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Attestation Smoky Eyes'
    },
    {
      titre: 'Formation Maquillage Homme',
      description: 'Techniques spécifiques pour hommes.',
      content: 'Correction du teint, matité, naturel, conseils barbe.',
      notes: 'Ouvert à tous, support PDF.',
      prix: 200,
      image: '/assets/formation-homme-annecy.webp',
      imageAlt: 'Formation maquillage homme à Annecy, démonstration sur modèle masculin',
      icon: 'man',
      categorie: 'Homme',
      tags: ['homme', 'naturel', 'technique'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '1j',
      durationMinutes: 480,
      slug: slugify('Formation Maquillage Homme'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Attestation Homme'
    },
    {
      titre: 'Stage FX',
      description: 'Effets spéciaux, latex, faux sang, transformations.',
      content: 'Création de prothèses, pose de latex, effets sanglants.',
      notes: 'Matériel FX fourni, places limitées.',
      prix: 400,
      image: '/assets/formation-fx-annecy.webp',
      imageAlt: 'Stage FX à Annecy, latex, faux sang, transformations artistiques',
      icon: 'fx',
      categorie: 'Artistique',
      tags: ['fx', 'latex', 'sang'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '1j',
      durationMinutes: 480,
      slug: slugify('Stage FX'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Certificat FX'
    },
    {
      titre: 'Atelier Festival',
      description: 'Looks fun, paillettes, couleurs, créativité.',
      content: 'Création de looks festival, application de paillettes, conseils tenues.',
      notes: 'Ambiance festive, matériel fourni.',
      prix: 90,
      image: '/assets/formation-festival-annecy.webp',
      imageAlt: 'Atelier festival à Annecy, maquillage coloré, ambiance estivale',
      icon: 'festival',
      categorie: 'Événement',
      tags: ['festival', 'paillettes', 'couleurs'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '0.5j',
      durationMinutes: 240,
      slug: slugify('Atelier Festival'),
      isActive: 1,
      isFeatured: 0,
      certification: 'Attestation Festival'
    },
    {
      titre: 'Formation Mode/Studio',
      description: 'Maquillage mode, défilé, photo studio.',
      content: 'Techniques mode, gestion lumière studio, looks créatifs.',
      notes: 'Stage pratique, book photo offert.',
      prix: 600,
      image: '/assets/formation-mode-studio-annecy.webp',
      imageAlt: 'Formation maquillage mode studio à Annecy, shooting photo, ambiance professionnelle',
      icon: 'camera',
      categorie: 'Studio',
      tags: ['mode', 'studio', 'défilé'],
      steps: ['Présentation', 'Démonstration', 'Pratique'],
      duree: '2j',
      durationMinutes: 960,
      slug: slugify('Formation Mode/Studio'),
      isActive: 1,
      isFeatured: 1,
      certification: 'Certificat Mode/Studio'
    }
  ];
  const insertFormation = db.prepare('INSERT INTO formations (titre, description, content, notes, prix, image, imageAlt, icon, categorie, tags, steps, duree, durationMinutes, slug, isActive, isFeatured, certification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const f of formationsSeed) {
    insertFormation.run(
      f.titre,
      f.description,
      f.content,
      f.notes,
      f.prix,
      f.image,
      f.imageAlt,
      f.icon,
      f.categorie,
      JSON.stringify(f.tags),
      JSON.stringify(f.steps),
      f.duree,
      f.durationMinutes,
      f.slug,
      f.isActive,
      f.isFeatured,
      f.certification
    );
  }
}


// 3. Seed galerie 100% manuel (23 entrées, aucune génération dynamique)
const rowGalerie = db.prepare('SELECT COUNT(*) as count FROM galerie').get() as { count: number };
if (rowGalerie.count === 0) {
  const now = new Date().toISOString();
  const seed = [
    // 2 globales accueil
    { title: 'Mariée bohème', slug: 'mariee-boheme', imageUrl: '/assets/galerie-mariee-boheme-annecy.webp', alt: 'Photo d’une mariée bohème à Annecy, maquillage lumineux, bouquet champêtre, robe fluide, ambiance champêtre', description: 'Teint lumineux, regard naturel, bouquet champêtre.', uploadedBy: 'admin', createdAt: now, global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    { title: 'Soirée Gatsby', slug: 'soiree-gatsby', imageUrl: '/assets/galerie-soiree-gatsby-annecy.webp', alt: 'Maquillage Gatsby à Annecy, smoky eyes, bouche rouge, robe à paillettes, ambiance années 20', description: 'Smoky eyes, bouche rouge, ambiance années 20.', uploadedBy: 'admin', createdAt: now, global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    // 2 globales services
    { title: 'Shooting mode', slug: 'shooting-mode', imageUrl: '/assets/galerie-shooting-mode-annecy.webp', alt: 'Shooting mode à Annecy, modèle maquillée, lumière studio, pose magazine', description: 'Maquillage studio, lumière froide, pose magazine.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 1, formationsGlobal: 0, serviceId: null, formationId: null },
    { title: 'Halloween Effets Spéciaux', slug: 'halloween-fx', imageUrl: '/assets/galerie-halloween-fx-annecy.webp', alt: 'Maquillage Halloween à Annecy, cicatrices réalistes, faux sang, ambiance sombre', description: 'Effets spéciaux, cicatrices, faux sang.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 1, formationsGlobal: 0, serviceId: null, formationId: null },
    // 2 globales formations
    { title: 'Backstage défilé', slug: 'backstage-defile', imageUrl: '/assets/galerie-backstage-defile-annecy.webp', alt: 'Coulisses de défilé à Annecy, maquilleuse en action, ambiance backstage, modèles en préparation', description: 'Préparatifs, retouches, ambiance coulisses.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: null, formationId: null },
    { title: 'Festival coloré', slug: 'festival-colore', imageUrl: '/assets/galerie-festival-colore-annecy.webp', alt: 'Jeune femme à un festival à Annecy, maquillage pailleté, ambiance estivale, foule en arrière-plan', description: 'Paillettes, couleurs, looks fun.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: null, formationId: null },
    // 15 entrées manuelles supplémentaires (exemples)
    { title: 'Maquillage mariée bohème à Annecy', slug: 'galerie-maquillage-mariee-boheme-annecy', imageUrl: '/assets/galerie-maquillage-mariee-boheme-annecy.webp', alt: 'Photo de maquillage mariée bohème à Annecy, teint lumineux, couronne de fleurs, robe fluide', description: 'Réalisation d’un maquillage mariée bohème à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 1, formationId: null },
    { title: 'Maquillage soirée glamour à Annecy', slug: 'galerie-maquillage-soiree-glamour-annecy', imageUrl: '/assets/galerie-maquillage-soiree-glamour-annecy.webp', alt: 'Maquillage soirée glamour à Annecy, smoky eyes, lèvres rouges, robe noire élégante', description: 'Exemple de maquillage soirée glamour à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 2, formationId: null },
    { title: 'Shooting photo professionnel à Annecy', slug: 'galerie-maquillage-shooting-photo-annecy', imageUrl: '/assets/galerie-maquillage-shooting-photo-annecy.webp', alt: 'Shooting photo à Annecy, modèle maquillée, lumière studio, pose professionnelle', description: 'Maquillage HD pour shooting photo professionnel à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 3, formationId: null },
    { title: 'Effets spéciaux Halloween à Annecy', slug: 'galerie-maquillage-fx-halloween-annecy', imageUrl: '/assets/galerie-maquillage-fx-halloween-annecy.webp', alt: 'Maquillage effets spéciaux à Annecy, cicatrices réalistes, faux sang, ambiance Halloween', description: 'Création d’un maquillage FX pour Halloween à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 4, formationId: null },
    { title: 'Atelier auto-maquillage à Annecy', slug: 'galerie-atelier-auto-maquillage-annecy', imageUrl: '/assets/galerie-atelier-auto-maquillage-annecy.webp', alt: 'Atelier auto-maquillage à Annecy, formatrice expliquant un geste, ambiance conviviale', description: 'Séance d’atelier auto-maquillage à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 5, formationId: null },
    { title: 'Maquillage enfant papillon à Annecy', slug: 'galerie-maquillage-enfant-papillon-annecy', imageUrl: '/assets/galerie-maquillage-enfant-papillon-annecy.webp', alt: 'Maquillage enfant papillon à Annecy, couleurs vives, sourire, ambiance festive', description: 'Maquillage artistique papillon pour enfants à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 6, formationId: null },
    { title: 'Maquillage homme naturel à Annecy', slug: 'galerie-maquillage-homme-naturel-annecy', imageUrl: '/assets/galerie-maquillage-homme-naturel-annecy.webp', alt: 'Maquillage homme naturel à Annecy, teint unifié, look discret, chemise blanche', description: 'Maquillage naturel pour homme à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 7, formationId: null },
    { title: 'Maquillage TV studio à Annecy', slug: 'galerie-maquillage-tv-studio-annecy', imageUrl: '/assets/galerie-maquillage-tv-studio-annecy.webp', alt: 'Maquillage plateau TV à Annecy, lumière studio, micro-cravate, décor professionnel', description: 'Maquillage longue tenue pour tournage TV à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 8, formationId: null },
    { title: 'Maquillage backstage défilé à Annecy', slug: 'galerie-maquillage-backstage-defile-annecy', imageUrl: '/assets/galerie-maquillage-backstage-defile-annecy.webp', alt: 'Coulisses de défilé à Annecy, maquilleuse en action, ambiance backstage', description: 'Réalisation de looks créatifs en backstage de défilé à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 9, formationId: null },
    { title: 'Maquillage festival paillettes à Annecy', slug: 'galerie-maquillage-festival-paillettes-annecy', imageUrl: '/assets/galerie-maquillage-festival-paillettes-annecy.webp', alt: 'Maquillage festival à Annecy, paillettes, ambiance estivale, foule en arrière-plan', description: 'Maquillage pailleté pour festival d’été à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 10, formationId: null },
    // 8 pour formations (exemple)
    { title: 'Formation maquillage professionnel', slug: 'galerie-formation-maquillage-professionnel-annecy', imageUrl: '/assets/galerie-formation-maquillage-professionnel-annecy.webp', alt: 'Formation maquillage professionnel à Annecy, formatrice et stagiaires, ambiance studieuse', description: 'Stage intensif de maquillage professionnel à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 1 },
    { title: 'Initiation beauté', slug: 'galerie-initiation-beaute-annecy', imageUrl: '/assets/galerie-initiation-beaute-annecy.webp', alt: 'Atelier initiation beauté à Annecy, démonstration maquillage, ambiance conviviale', description: 'Atelier découverte des bases du maquillage à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 2 },
    { title: 'Perfectionnement artistique', slug: 'galerie-perfectionnement-artistique-annecy', imageUrl: '/assets/galerie-perfectionnement-artistique-annecy.webp', alt: 'Formation perfectionnement artistique à Annecy, face painting, couleurs vives', description: 'Stage de perfectionnement artistique, face painting à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 3 },
    { title: 'Atelier maquillage mariée', slug: 'galerie-atelier-maquillage-mariee-annecy', imageUrl: '/assets/galerie-atelier-maquillage-mariee-annecy.webp', alt: 'Atelier maquillage mariée à Annecy, essai maquillage, conseils personnalisés', description: 'Atelier spécial mariage, gestion du stress, waterproof, essai à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 4 },
    { title: 'Stage enfant maquillage', slug: 'galerie-stage-enfant-maquillage-annecy', imageUrl: '/assets/galerie-stage-enfant-maquillage-annecy.webp', alt: 'Stage maquillage enfant à Annecy, enfants maquillés, ambiance ludique', description: 'Stage ludique de maquillage pour enfants à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 5 },
    { title: 'Masterclass smoky eyes', slug: 'galerie-masterclass-smoky-eyes-annecy', imageUrl: '/assets/galerie-masterclass-smoky-eyes-annecy.webp', alt: 'Masterclass smoky eyes à Annecy, démonstration technique, palette de fards', description: 'Masterclass pour maîtriser le smoky eyes à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 6 },
    { title: 'Formation maquillage homme', slug: 'galerie-formation-maquillage-homme-annecy', imageUrl: '/assets/galerie-formation-maquillage-homme-annecy.webp', alt: 'Formation maquillage homme à Annecy, démonstration sur modèle masculin', description: 'Formation dédiée au maquillage homme à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 7 },
    { title: 'Stage FX effets spéciaux', slug: 'galerie-stage-fx-effets-speciaux-annecy', imageUrl: '/assets/galerie-stage-fx-effets-speciaux-annecy.webp', alt: 'Stage FX à Annecy, latex, faux sang, transformations artistiques', description: 'Stage FX effets spéciaux, latex, transformations à Annecy.', uploadedBy: 'admin', createdAt: now, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 8 },
  ];
  const insert = db.prepare('INSERT INTO galerie (title, imageUrl, alt, description, uploadedBy, createdAt, global, servicesGlobal, formationsGlobal, serviceId, formationId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const g of seed) {
    insert.run(
      g.title,
      g.imageUrl,
      g.alt || null,
      g.description,
      g.uploadedBy,
      g.createdAt,
      g.global || 0,
      g.servicesGlobal || 0,
      g.formationsGlobal || 0,
      g.serviceId || null,
      g.formationId || null
    );
  }
}


// 4. Seed avis 100% manuel (23 entrées, aucune génération dynamique)
const rowAvis = db.prepare('SELECT COUNT(*) as count FROM avis').get() as { count: number };
if (rowAvis.count === 0) {
  const seed = [
    // 2 globaux (accueil)
    { utilisateur: 'Sophie', commentaire: 'Super prestation, maquillage parfait pour mon mariage !', note: 5, global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    { utilisateur: 'Camille', commentaire: 'Très à l’écoute, résultat naturel, je recommande.', note: 5, global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    // 2 globaux services
    { utilisateur: 'Julie', commentaire: 'Maquillage soirée sublime, merci !', note: 4, global: 0, servicesGlobal: 1, formationsGlobal: 0, serviceId: null, formationId: null },
    { utilisateur: 'Nina', commentaire: 'Cours d’auto-maquillage très utile, astuces faciles à refaire.', note: 5, global: 0, servicesGlobal: 1, formationsGlobal: 0, serviceId: null, formationId: null },
    // 2 globaux formations
    { utilisateur: 'Emma', commentaire: 'Formation très complète, formatrice passionnée.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: null, formationId: null },
    { utilisateur: 'Laura', commentaire: 'Stage enfant très ludique, ma fille a adoré.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: null, formationId: null },
    // 11 avis services (exemple)
    { utilisateur: 'Alice', commentaire: 'Maquillage mariée parfait, très professionnel.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 1, formationId: null },
    { utilisateur: 'Manon', commentaire: 'Look soirée glamour, j’ai adoré le résultat.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 2, formationId: null },
    { utilisateur: 'Chloé', commentaire: 'Shooting photo, maquillage impeccable pour la caméra.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 3, formationId: null },
    { utilisateur: 'Pauline', commentaire: 'Effets spéciaux bluffants pour Halloween !', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 4, formationId: null },
    { utilisateur: 'Léa', commentaire: 'Atelier auto-maquillage très instructif.', note: 4, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 5, formationId: null },
    { utilisateur: 'Sonia', commentaire: 'Maquillage enfant, ma fille était ravie.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 6, formationId: null },
    { utilisateur: 'Lucas', commentaire: 'Maquillage homme discret et naturel.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 7, formationId: null },
    { utilisateur: 'Antoine', commentaire: 'Maquillage TV/studio longue tenue, parfait pour le tournage.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 8, formationId: null },
    { utilisateur: 'Mélanie', commentaire: 'Backstage défilé, retouches rapides et efficaces.', note: 4, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 9, formationId: null },
    { utilisateur: 'Sabrina', commentaire: 'Maquillage festival coloré, super ambiance.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 10, formationId: null },
    { utilisateur: 'Anaïs', commentaire: 'Maquillage artistique, résultat bluffant.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 11, formationId: null },
    // 8 avis formations (exemple)
    { utilisateur: 'Clara', commentaire: 'Formation pro très complète, certificat délivré.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 1 },
    { utilisateur: 'Julie', commentaire: 'Initiation beauté, conseils personnalisés.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 2 },
    { utilisateur: 'Sophie', commentaire: 'Perfectionnement artistique, techniques FX au top.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 3 },
    { utilisateur: 'Lina', commentaire: 'Atelier mariée, essai très rassurant.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 4 },
    { utilisateur: 'Emma', commentaire: 'Stage enfant, ambiance ludique et pédagogique.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 5 },
    { utilisateur: 'Nathalie', commentaire: 'Masterclass smoky eyes, astuces pro.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 6 },
    { utilisateur: 'Benoît', commentaire: 'Formation homme, conseils barbe très utiles.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 7 },
    { utilisateur: 'Sébastien', commentaire: 'Stage FX, latex et faux sang, super expérience.', note: 5, global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 8 },
  ];
  const insert = db.prepare('INSERT INTO avis (utilisateur, commentaire, note, global, servicesGlobal, formationsGlobal, serviceId, formationId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const a of seed) {
    insert.run(
      a.utilisateur,
      a.commentaire,
      a.note,
      a.global || 0,
      a.servicesGlobal || 0,
      a.formationsGlobal || 0,
      a.serviceId || null,
      a.formationId || null
    );
  }
}


// 5. Seed utilisateurs
import bcrypt from 'bcryptjs';
const rowUser = db.prepare('SELECT COUNT(*) as count FROM utilisateurs').get() as { count: number };
if (rowUser.count === 0) {
  const hashAdmin = bcrypt.hashSync('admin123', 10);
  const hash1 = bcrypt.hashSync('sophie2025', 10);
  const hash2 = bcrypt.hashSync('camille2025', 10);
  const hash3 = bcrypt.hashSync('julie2025', 10);
  const hash4 = bcrypt.hashSync('nina2025', 10);
  const hash5 = bcrypt.hashSync('manon2025', 10);
  const hash6 = bcrypt.hashSync('lea2025', 10);
  const hash7 = bcrypt.hashSync('chloe2025', 10);
  const hash8 = bcrypt.hashSync('paul2025', 10);
  const hash9 = bcrypt.hashSync('lucas2025', 10);
  const hash10 = bcrypt.hashSync('anais2025', 10);
  const seed = [
    { nom: 'Admin', email: 'admin@demo.fr', role: 'admin', password: hashAdmin },
    { nom: 'Sophie Martin', email: 'sophie.martin@mail.fr', role: 'client', password: hash1 },
    { nom: 'Camille Dubois', email: 'camille.dubois@mail.fr', role: 'client', password: hash2 },
    { nom: 'Julie Bernard', email: 'julie.bernard@mail.fr', role: 'client', password: hash3 },
    { nom: 'Nina Petit', email: 'nina.petit@mail.fr', role: 'client', password: hash4 },
    { nom: 'Manon Leroy', email: 'manon.leroy@mail.fr', role: 'client', password: hash5 },
    { nom: 'Léa Girard', email: 'lea.girard@mail.fr', role: 'client', password: hash6 },
    { nom: 'Chloé Morel', email: 'chloe.morel@mail.fr', role: 'client', password: hash7 },
    { nom: 'Paul Robert', email: 'paul.robert@mail.fr', role: 'client', password: hash8 },
    { nom: 'Lucas Martin', email: 'lucas.martin@mail.fr', role: 'client', password: hash9 },
    { nom: 'Anaïs Dupont', email: 'anais.dupont@mail.fr', role: 'client', password: hash10 }
  ];
  const insert = db.prepare('INSERT INTO utilisateurs (nom, email, role, password) VALUES (?, ?, ?, ?)');
  for (const u of seed) {
    insert.run(u.nom, u.email, u.role, u.password);
  }
}

// 6. Seed reservations (userId et serviceId doivent exister)
const rowRes = db.prepare('SELECT COUNT(*) as count FROM reservations').get() as { count: number };
if (rowRes.count === 0) {
  // Récupérer les IDs valides
  const userIds = db.prepare('SELECT id FROM utilisateurs').all().map((u: any) => u.id);
  const serviceIds = db.prepare('SELECT id FROM services').all().map((s: any) => s.id);
  // Générer des réservations cohérentes
  const seed = [
    { userId: userIds[1], serviceId: serviceIds[0], date: '2025-07-01', time: '10:00', status: 'confirmed' },
    { userId: userIds[2], serviceId: serviceIds[1], date: '2025-07-03', time: '18:00', status: 'pending' },
    { userId: userIds[3], serviceId: serviceIds[2], date: '2025-07-10', time: '14:00', status: 'confirmed' },
    { userId: userIds[4], serviceId: serviceIds[3], date: '2025-10-31', time: '20:00', status: 'confirmed' },
    { userId: userIds[1], serviceId: serviceIds[4], date: '2025-08-15', time: '09:30', status: 'confirmed' },
    { userId: userIds[5], serviceId: serviceIds[5], date: '2025-09-05', time: '11:00', status: 'confirmed' },
    { userId: userIds[6], serviceId: serviceIds[6], date: '2025-09-10', time: '15:00', status: 'pending' },
    { userId: userIds[7], serviceId: serviceIds[7], date: '2025-09-12', time: '13:00', status: 'confirmed' },
    { userId: userIds[8], serviceId: serviceIds[8], date: '2025-09-15', time: '16:00', status: 'confirmed' },
    { userId: userIds[9], serviceId: serviceIds[9], date: '2025-09-20', time: '17:00', status: 'pending' },
    { userId: userIds[2], serviceId: serviceIds[0], date: '2025-07-15', time: '09:00', status: 'confirmed' },
    { userId: userIds[3], serviceId: serviceIds[1], date: '2025-07-18', time: '18:30', status: 'confirmed' },
    { userId: userIds[4], serviceId: serviceIds[2], date: '2025-07-22', time: '14:30', status: 'pending' },
    { userId: userIds[5], serviceId: serviceIds[3], date: '2025-10-30', time: '19:00', status: 'confirmed' },
    { userId: userIds[6], serviceId: serviceIds[4], date: '2025-08-18', time: '10:00', status: 'confirmed' },
    { userId: userIds[7], serviceId: serviceIds[5], date: '2025-09-07', time: '12:00', status: 'pending' },
    { userId: userIds[8], serviceId: serviceIds[6], date: '2025-09-11', time: '15:30', status: 'confirmed' },
    { userId: userIds[9], serviceId: serviceIds[7], date: '2025-09-13', time: '13:30', status: 'confirmed' },
    { userId: userIds[0], serviceId: serviceIds[8], date: '2025-09-16', time: '16:30', status: 'pending' },
    { userId: userIds[1], serviceId: serviceIds[9], date: '2025-09-21', time: '17:30', status: 'confirmed' }
  ];
  const insert = db.prepare('INSERT INTO reservations (userId, serviceId, date, time, status) VALUES (?, ?, ?, ?, ?)');
  for (const r of seed) {
    insert.run(r.userId, r.serviceId, r.date, r.time, r.status);
  }
}

// 7. Seed factures (reservationId et userId doivent exister)
const rowFact = db.prepare('SELECT COUNT(*) as count FROM factures').get() as { count: number };
if (rowFact.count === 0) {
  const now = new Date().toISOString();
  const reservations = db.prepare('SELECT id, userId FROM reservations').all() as { id: number, userId: number }[];
  const seed = reservations.map((r, idx) => ({
    reservationId: r.id,
    userId: r.userId,
    amount: 50 + (idx * 10),
    status: idx % 3 === 0 ? 'pending' : 'paid',
    pdfUrl: `/assets/facture-${r.id}.pdf`,
    createdAt: now,
    updatedAt: now
  }));
  const insert = db.prepare('INSERT INTO factures (reservationId, userId, amount, status, pdfUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const f of seed) {
    try {
      insert.run(f.reservationId, f.userId, f.amount, f.status, f.pdfUrl, f.createdAt, f.updatedAt);
    } catch (e: any) {
      console.error('[SEED FACTURES] Erreur insertion facture', f, e.message);
    }
  }
}


// Table FAQ enrichie (liaisons globales, services, formations)
db.exec(`
  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    global INTEGER DEFAULT 0,
    servicesGlobal INTEGER DEFAULT 0,
    formationsGlobal INTEGER DEFAULT 0,
    serviceId INTEGER,
    formationId INTEGER,
    FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (formationId) REFERENCES formations(id) ON DELETE CASCADE
  );
`);


// 8. Seed FAQ 100% manuel (aucune génération dynamique)
const rowFaq = db.prepare('SELECT COUNT(*) as count FROM faq').get() as { count: number };
if (rowFaq.count === 0) {
  const seed = [
    // FAQ globales (accueil)
    { question: 'Quels types de maquillage proposez-vous ?', reponse: 'Nous proposons des prestations pour mariage, soirée, shooting, effets spéciaux, enfants, hommes, TV/studio et festivals.', global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    { question: 'Où se déroulent les prestations ?', reponse: 'À Annecy, à domicile, en studio ou sur le lieu de votre événement.', global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    { question: 'Quels produits utilisez-vous ?', reponse: 'Des produits professionnels, hypoallergéniques, longue tenue, adaptés à chaque type de peau.', global: 1, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: null },
    // FAQ globales services
    { question: 'Comment réserver un service ?', reponse: 'Vous pouvez réserver en ligne, par téléphone ou via le formulaire de contact.', global: 0, servicesGlobal: 1, formationsGlobal: 0, serviceId: null, formationId: null },
    { question: 'Faut-il prévoir un essai avant le mariage ?', reponse: 'Oui, un essai est fortement recommandé pour définir le style et garantir un résultat parfait.', global: 0, servicesGlobal: 1, formationsGlobal: 0, serviceId: null, formationId: null },
    // FAQ globales formations
    { question: 'Les formations sont-elles certifiantes ?', reponse: 'Certaines formations délivrent un certificat ou une attestation officielle.', global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: null, formationId: null },
    { question: 'Le matériel est-il fourni en formation ?', reponse: 'Oui, tout le matériel professionnel est fourni pendant la formation.', global: 0, servicesGlobal: 0, formationsGlobal: 1, serviceId: null, formationId: null },
    // FAQ spécifiques services (exemple pour 10 services)
    { question: 'FAQ spécifique pour le service Maquillage Mariée', reponse: 'Le maquillage mariée inclut un essai, des conseils personnalisés et la tenue toute la journée.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 1, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage Soirée', reponse: 'Le maquillage soirée est adapté à la lumière artificielle et tient toute la nuit.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 2, formationId: null },
    { question: 'FAQ spécifique pour le service Shooting Photo', reponse: 'Le maquillage shooting est conçu pour la photo HD et la lumière studio.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 3, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage Effets Spéciaux', reponse: 'Les effets spéciaux sont réalisés avec des produits professionnels FX.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 4, formationId: null },
    { question: 'FAQ spécifique pour le service Cours d’auto-maquillage', reponse: 'L’atelier auto-maquillage est accessible à tous, avec supports pédagogiques.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 5, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage Enfant', reponse: 'Le maquillage enfant utilise des produits hypoallergéniques et ludiques.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 6, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage Homme', reponse: 'Le maquillage homme est discret, naturel et adapté à la barbe.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 7, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage TV/Studio', reponse: 'Le maquillage TV/studio est anti-brillance et longue tenue.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 8, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage Backstage', reponse: 'Le maquillage backstage est rapide, créatif et adapté aux défilés.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 9, formationId: null },
    { question: 'FAQ spécifique pour le service Maquillage Festival', reponse: 'Le maquillage festival est fun, coloré et résistant à la chaleur.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: 10, formationId: null },
    // FAQ spécifiques formations (exemple pour 10 formations)
    { question: 'FAQ spécifique pour la formation Maquillage Professionnel', reponse: 'La formation pro délivre un certificat et inclut un stage pratique.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 1 },
    { question: 'FAQ spécifique pour la formation Initiation Beauté', reponse: 'L’initiation beauté est ouverte à tous, matériel prêté.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 2 },
    { question: 'FAQ spécifique pour la formation Perfectionnement Artistique', reponse: 'Le perfectionnement artistique inclut des techniques FX et face painting.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 3 },
    { question: 'FAQ spécifique pour la formation Atelier Maquillage Mariée', reponse: 'L’atelier mariée inclut un essai et un support PDF.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 4 },
    { question: 'FAQ spécifique pour la formation Stage Enfant', reponse: 'Le stage enfant est ludique, sécurisé et matériel fourni.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 5 },
    { question: 'FAQ spécifique pour la formation Masterclass Smoky Eyes', reponse: 'La masterclass smoky eyes inclut support vidéo et pratique guidée.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 6 },
    { question: 'FAQ spécifique pour la formation Maquillage Homme', reponse: 'La formation homme est ouverte à tous, conseils barbe inclus.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 7 },
    { question: 'FAQ spécifique pour la formation Stage FX', reponse: 'Le stage FX inclut latex, faux sang et certificat.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 8 },
    { question: 'FAQ spécifique pour la formation Atelier Festival', reponse: 'L’atelier festival est festif, matériel fourni.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 9 },
    { question: 'FAQ spécifique pour la formation Mode/Studio', reponse: 'La formation mode/studio inclut un book photo offert.', global: 0, servicesGlobal: 0, formationsGlobal: 0, serviceId: null, formationId: 10 },
  ];
  const insert = db.prepare('INSERT INTO faq (question, reponse, global, servicesGlobal, formationsGlobal, serviceId, formationId) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const f of seed) {
    insert.run(
      f.question,
      f.reponse,
      f.global || 0,
      f.servicesGlobal || 0,
      f.formationsGlobal || 0,
      f.serviceId || null,
      f.formationId || null
    );
  }
}

export default db;
