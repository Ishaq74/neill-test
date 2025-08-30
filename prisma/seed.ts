import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed SiteIdentity
  const siteIdentityCount = await prisma.siteIdentity.count();
  if (siteIdentityCount === 0) {
    await prisma.siteIdentity.create({
      data: {
        nom: 'Neill Make Up à Annecy',
        slogan: 'Sublimez votre beauté, révélez votre personnalité',
        description: 'Neill Make Up à Annecy propose des prestations de maquillage professionnel, formations, conseils beauté et accompagnement personnalisé pour tous vos événements.',
        adresse: '12 rue Royale',
        codePostal: '74000',
        ville: 'Annecy',
        pays: 'France',
        telephone: '+33 6 12 34 56 78',
        email: 'contact@neillmakeup.fr',
        siteUrl: 'https://www.neillmakeup.fr',
        logo: '/assets/logo-neillmakeup-annecy.svg',
        facebook: 'https://facebook.com/neillmakeup',
        instagram: 'https://instagram.com/neillmakeup',
        linkedin: 'https://linkedin.com/company/neillmakeup',
        tiktok: 'https://tiktok.com/@neillmakeup',
        youtube: 'https://youtube.com/@neillmakeup',
        mentionsLegales: 'Mentions légales : Neill Make Up, 12 rue Royale, 74000 Annecy. SIRET 123 456 789 00012. Responsable : Neill Dupont.',
        politiqueConfidentialite: 'Politique de confidentialité conforme RGPD disponible sur le site.',
        diplomePrincipal: 'Diplôme d\'État Maquilleur Professionnel',
        certifications: 'Certifiée Make Up For Ever, MAC Pro, Lauréate Wedding Awards 2024',
        horaires: 'Lundi-samedi 9h-19h, sur rendez-vous'
      }
    });
  }

  // Seed Team
  const teamCount = await prisma.team.count();
  if (teamCount === 0) {
    await prisma.team.createMany({
      data: [
        {
          nom: 'Neill Dupont',
          role: 'Maquilleuse Professionnelle & Formatrice',
          bio: 'Passionnée de beauté depuis plus de 10 ans, Neill vous accompagne dans la révélation de votre personnalité à travers un maquillage sur-mesure.',
          photo: '/assets/team-neill-dupont.webp',
          email: 'neill@neillmakeup.fr',
          telephone: '+33 6 12 34 56 78',
          linkedin: 'https://linkedin.com/in/neill-dupont-makeup',
          instagram: 'https://instagram.com/neill_makeup_annecy',
          certifications: 'Certifiée Make Up For Ever, MAC Pro',
          diplome: 'Diplôme d\'État Maquilleur Professionnel',
          isActive: 1
        }
      ]
    });
  }

  // Seed Users
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hash1 = await bcrypt.hash('sophie2025', 10);
    const hash2 = await bcrypt.hash('camille2025', 10);
    const hash3 = await bcrypt.hash('julie2025', 10);

    await prisma.user.createMany({
      data: [
        {
          nom: 'Admin',
          email: 'admin@neillmakeup.fr',
          role: 'admin',
          password: hashAdmin
        },
        {
          nom: 'Sophie Martin',
          email: 'sophie.martin@email.fr',
          role: 'client',
          password: hash1
        },
        {
          nom: 'Camille Dubois',
          email: 'camille.dubois@email.fr',
          role: 'client',
          password: hash2
        },
        {
          nom: 'Julie Rousseau',
          email: 'julie.rousseau@email.fr',
          role: 'client',
          password: hash3
        }
      ]
    });
  }

  // Seed Services
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const services = [
      {
        nom: 'Maquillage Mariée',
        description: 'Le jour J mérite un maquillage d\'exception. Sublimez votre beauté naturelle pour un look intemporel et romantique.',
        content: 'Prestation complète incluant essai, maquillage du jour J et retouches. Produits haut de gamme longue tenue.',
        notes: 'Essai obligatoire 2 semaines avant. Déplacement possible selon secteur.',
        prix: 250.0,
        image: '/assets/service-maquillage-mariee.webp',
        imageAlt: 'Maquillage mariée romantique et intemporel',
        icon: 'mdi:heart',
        categorie: 'Mariage',
        tags: JSON.stringify(['mariée', 'mariage', 'romantique', 'longue tenue']),
        steps: JSON.stringify(['Consultation', 'Essai maquillage', 'Jour J', 'Retouches']),
        duree: '3h (essai + jour J)',
        durationMinutes: 180,
        slug: 'maquillage-mariee',
        isActive: 1,
        isFeatured: 1
      },
      {
        nom: 'Shooting Photo',
        description: 'Maquillage professionnel adapté à la photographie pour des clichés parfaits.',
        content: 'Technique spécifique photo/vidéo, jeu de lumières et ombres, correction des imperfections.',
        notes: 'Collaboration avec photographes professionnels d\'Annecy.',
        prix: 120.0,
        image: '/assets/service-shooting-photo.webp',
        imageAlt: 'Maquillage professionnel pour shooting photo',
        icon: 'mdi:camera',
        categorie: 'Professionnel',
        tags: JSON.stringify(['photo', 'shooting', 'professionnel', 'studio']),
        steps: JSON.stringify(['Brief créatif', 'Préparation peau', 'Maquillage', 'Retouches plateau']),
        duree: '2h',
        durationMinutes: 120,
        slug: 'shooting-photo',
        isActive: 1,
        isFeatured: 1
      }
    ];

    for (const service of services) {
      await prisma.service.create({ data: service });
    }
  }

  // Seed Formations
  const formationCount = await prisma.formation.count();
  if (formationCount === 0) {
    const formations = [
      {
        titre: 'Formation Maquillage Professionnel',
        description: 'Formation complète pour devenir maquilleur professionnel. Techniques avancées et business.',
        content: 'Programme intensif couvrant toutes les techniques de maquillage professionnel.',
        prix: 1200.0,
        image: '/assets/formation-maquillage-pro.webp',
        imageAlt: 'Formation maquillage professionnel Annecy',
        icon: 'mdi:school',
        categorie: 'Professionnel',
        tags: JSON.stringify(['formation', 'professionnel', 'technique', 'diplôme']),
        steps: JSON.stringify(['Théorie', 'Pratique', 'Évaluation', 'Certification']),
        duree: '5 jours',
        durationMinutes: 2400,
        slug: 'formation-maquillage-professionnel',
        isActive: 1,
        isFeatured: 1,
        certification: 'Certificat Neill Make Up'
      }
    ];

    for (const formation of formations) {
      await prisma.formation.create({ data: formation });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });