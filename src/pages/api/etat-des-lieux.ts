import type { APIRoute } from 'astro';

// Try to import the database, but provide fallback if not available
let db: any = null;
let dbAvailable = false;

try {
  const dbModule = await import('@lib/db');
  db = dbModule.db;
  dbAvailable = true;
} catch (error) {
  console.log('Database not available, using mock data for état des lieux');
  dbAvailable = false;
}

export const GET: APIRoute = async () => {
  try {
    let systemStatus;

    if (dbAvailable && db) {
      // Try to get real data from database
      try {
        const [
          totalServices,
          activeServices,
          totalFormations,
          activeFormations,
          totalReservations,
          totalUsers,
          totalFactures,
          totalAvis,
          totalGalerie,
          totalFaq,
          averageNote,
          recentReservations,
          recentAvis,
          facturesStats
        ] = await Promise.all([
          db.service.count(),
          db.service.count({ where: { isActive: 1 } }),
          db.formation.count(),
          db.formation.count({ where: { isActive: 1 } }),
          db.reservation.count(),
          db.user.count(),
          db.facture.count(),
          db.avis.count(),
          db.galerie.count(),
          db.faq.count(),
          db.avis.aggregate({ _avg: { note: true } }),
          db.reservation.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            include: {
              user: { select: { nom: true } },
              service: { select: { nom: true } }
            }
          }),
          db.avis.findMany({
            take: 5,
            orderBy: { id: 'desc' }
          }),
          db.facture.groupBy({
            by: ['status'],
            _count: { status: true },
            _sum: { amount: true }
          })
        ]);

        systemStatus = {
          // Statistiques principales
          statistics: {
            services: {
              total: totalServices,
              active: activeServices,
              inactive: totalServices - activeServices
            },
            formations: {
              total: totalFormations,
              active: activeFormations,
              inactive: totalFormations - activeFormations
            },
            reservations: totalReservations,
            utilisateurs: totalUsers,
            factures: totalFactures,
            avis: {
              total: totalAvis,
              noteAverage: averageNote._avg.note ? Math.round(averageNote._avg.note * 10) / 10 : 0
            },
            galerie: totalGalerie,
            faq: totalFaq
          },
          
          // Activité récente
          recentActivity: {
            reservations: recentReservations,
            avis: recentAvis
          },
          
          // Statistiques financières
          financial: {
            facturesByStatus: facturesStats.reduce((acc, item) => {
              acc[item.status] = {
                count: item._count.status,
                total: item._sum.amount || 0
              };
              return acc;
            }, {} as any)
          },
          
          // Santé du système
          systemHealth: {
            database: 'Connected',
            lastUpdate: new Date().toISOString(),
            errors: [],
            warnings: [
              'Route conflicts detected in Astro routing (formations, reservations, services)',
              'Unsupported .jsx and .tsx files found in reservations folder'
            ]
          }
        };
      } catch (dbError) {
        console.error('Database query failed, falling back to mock data:', dbError);
        dbAvailable = false;
      }
    }

    if (!dbAvailable) {
      // Provide mock data for demonstration
      systemStatus = {
        statistics: {
          services: {
            total: 12,
            active: 10,
            inactive: 2
          },
          formations: {
            total: 8,
            active: 7,
            inactive: 1
          },
          reservations: 45,
          utilisateurs: 23,
          factures: 18,
          avis: {
            total: 15,
            noteAverage: 4.6
          },
          galerie: 67,
          faq: 12
        },
        
        recentActivity: {
          reservations: [
            {
              id: 1,
              user: { nom: "Marie Dupont" },
              service: { nom: "Maquillage Mariage" },
              date: "2024-01-20",
              time: "14:00",
              status: "confirmed"
            },
            {
              id: 2,
              user: { nom: "Sophie Martin" },
              service: { nom: "Maquillage Soirée" },
              date: "2024-01-18",
              time: "16:30",
              status: "pending"
            },
            {
              id: 3,
              user: { nom: "Julie Bernard" },
              service: { nom: "Formation Bases" },
              date: "2024-01-15",
              time: "10:00",
              status: "confirmed"
            }
          ],
          avis: [
            {
              id: 1,
              utilisateur: "Marie Dupont",
              commentaire: "Excellent service, très professionnel ! Je recommande vivement.",
              note: 5
            },
            {
              id: 2,
              utilisateur: "Sophie Martin",
              commentaire: "Maquillage parfait pour ma soirée. Merci !",
              note: 5
            },
            {
              id: 3,
              utilisateur: "Julie Bernard",
              commentaire: "Formation très instructive, j'ai beaucoup appris.",
              note: 4
            }
          ]
        },
        
        financial: {
          facturesByStatus: {
            paid: { count: 12, total: 1850.00 },
            pending: { count: 4, total: 520.00 },
            cancelled: { count: 2, total: 180.00 }
          }
        },
        
        systemHealth: {
          database: dbAvailable ? 'Connected' : 'Not Connected (Mock Data)',
          lastUpdate: new Date().toISOString(),
          errors: dbAvailable ? [] : ['Base de données non configurée - données d\'exemple affichées'],
          warnings: [
            'Route conflicts detected in Astro routing (formations, reservations, services)',
            'Unsupported .jsx and .tsx files found in reservations folder'
          ]
        }
      };
    }

    return new Response(JSON.stringify(systemStatus), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('System assessment error:', error);
    
    // Provide basic error response with mock data
    const errorSystemStatus = {
      statistics: {
        services: { total: 0, active: 0, inactive: 0 },
        formations: { total: 0, active: 0, inactive: 0 },
        reservations: 0,
        utilisateurs: 0,
        factures: 0,
        avis: { total: 0, noteAverage: 0 },
        galerie: 0,
        faq: 0
      },
      recentActivity: {
        reservations: [],
        avis: []
      },
      financial: {
        facturesByStatus: {}
      },
      systemHealth: {
        database: 'Error',
        lastUpdate: new Date().toISOString(),
        errors: [
          'Erreur lors de la génération de l\'état des lieux',
          error instanceof Error ? error.message : 'Erreur inconnue'
        ],
        warnings: [
          'Route conflicts detected in Astro routing (formations, reservations, services)',
          'Unsupported .jsx and .tsx files found in reservations folder'
        ]
      }
    };
    
    return new Response(JSON.stringify(errorSystemStatus), { 
      headers: { 'Content-Type': 'application/json' }
    });
  }
};