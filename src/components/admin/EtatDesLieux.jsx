import { useState, useEffect } from 'react';

export default function EtatDesLieux() {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/etat-des-lieux');
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setSystemData(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-100 border-blue-200 text-blue-800",
      green: "bg-green-100 border-green-200 text-green-800", 
      yellow: "bg-yellow-100 border-yellow-200 text-yellow-800",
      red: "bg-red-100 border-red-200 text-red-800",
      purple: "bg-purple-100 border-purple-200 text-purple-800",
      gray: "bg-gray-100 border-gray-200 text-gray-800"
    };

    return (
      <div className={`p-6 border-2 rounded-lg ${colorClasses[color]}`}>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs mt-1 opacity-75">{subtitle}</div>}
      </div>
    );
  };

  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'Connected':
        case 'OK':
          return 'text-green-600 bg-green-100';
        case 'Warning':
          return 'text-yellow-600 bg-yellow-100';
        case 'Error':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
        <span className="text-sm">{label}: {status}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-700"></div>
        <span className="ml-4 text-gray-600">Génération de l'état des lieux...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <h3 className="font-bold">Erreur lors de la génération de l'état des lieux</h3>
        <p>{error}</p>
        <button 
          onClick={fetchSystemData}
          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!systemData) {
    return <div className="text-center p-8 text-gray-600">Aucune donnée disponible</div>;
  }

  const { statistics, recentActivity, financial, systemHealth } = systemData;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">État des Lieux - Artisan Beauty</h1>
        <p className="text-pink-100">
          Tableau de bord complet du système • Dernière mise à jour: {new Date(systemHealth.lastUpdate).toLocaleDateString('fr-FR', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}
        </p>
        <button 
          onClick={fetchSystemData}
          className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Statistiques principales */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">📊 Statistiques Générales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Services" 
            value={statistics.services.total}
            subtitle={`${statistics.services.active} actifs • ${statistics.services.inactive} inactifs`}
            color="blue"
          />
          <StatCard 
            title="Formations" 
            value={statistics.formations.total}
            subtitle={`${statistics.formations.active} actives • ${statistics.formations.inactive} inactives`}
            color="purple"
          />
          <StatCard 
            title="Réservations" 
            value={statistics.reservations}
            subtitle="Total des réservations"
            color="green"
          />
          <StatCard 
            title="Utilisateurs" 
            value={statistics.utilisateurs}
            subtitle="Comptes enregistrés"
            color="yellow"
          />
          <StatCard 
            title="Avis Clients" 
            value={statistics.avis.total}
            subtitle={`Moyenne: ${statistics.avis.noteAverage}/5 ⭐`}
            color="green"
          />
          <StatCard 
            title="Photos Galerie" 
            value={statistics.galerie}
            subtitle="Images dans la galerie"
            color="gray"
          />
          <StatCard 
            title="FAQ" 
            value={statistics.faq}
            subtitle="Questions/réponses"
            color="blue"
          />
          <StatCard 
            title="Factures" 
            value={statistics.factures}
            subtitle="Documents générés"
            color="purple"
          />
        </div>
      </div>

      {/* État financier */}
      {financial.facturesByStatus && Object.keys(financial.facturesByStatus).length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">💰 Situation Financière</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(financial.facturesByStatus).map(([status, data]) => (
              <StatCard
                key={status}
                title={`Factures ${status}`}
                value={data.count}
                subtitle={`Total: ${data.total.toFixed(2)}€`}
                color={status === 'paid' ? 'green' : status === 'pending' ? 'yellow' : 'red'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Réservations récentes */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">📅 Réservations Récentes</h3>
          {recentActivity.reservations.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.reservations.map((reservation) => (
                <div key={reservation.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-medium">{reservation.user.nom}</div>
                  <div className="text-sm text-gray-600">
                    {reservation.service.nom} • {reservation.date} à {reservation.time}
                  </div>
                  <div className="text-xs text-gray-500">
                    Statut: <span className={`font-medium ${
                      reservation.status === 'confirmed' ? 'text-green-600' : 
                      reservation.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>{reservation.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucune réservation récente</p>
          )}
        </div>

        {/* Avis récents */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">⭐ Avis Récents</h3>
          {recentActivity.avis.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.avis.map((avis) => (
                <div key={avis.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="font-medium">{avis.utilisateur}</div>
                  <div className="text-sm text-gray-600 mb-1">
                    {'⭐'.repeat(avis.note)} ({avis.note}/5)
                  </div>
                  {avis.commentaire && (
                    <div className="text-sm text-gray-700 italic">
                      "{avis.commentaire.length > 80 ? avis.commentaire.substring(0, 80) + '...' : avis.commentaire}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun avis récent</p>
          )}
        </div>
      </div>

      {/* Santé du système */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">🔧 Santé du Système</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">État des Services</h3>
            <div className="space-y-2">
              <StatusIndicator status={systemHealth.database} label="Base de données" />
              <StatusIndicator status="OK" label="API Routes" />
              <StatusIndicator status="OK" label="Authentication" />
              <StatusIndicator status="OK" label="File Upload" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Problèmes Détectés</h3>
            {systemHealth.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-600">⚠️ Avertissements:</h4>
                {systemHealth.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                    {warning}
                  </div>
                ))}
              </div>
            )}
            
            {systemHealth.errors.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-red-600">🚨 Erreurs:</h4>
                {systemHealth.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded border-l-4 border-red-400">
                    {error}
                  </div>
                ))}
              </div>
            )}
            
            {systemHealth.warnings.length === 0 && systemHealth.errors.length === 0 && (
              <div className="text-green-600 bg-green-50 p-3 rounded border-l-4 border-green-400">
                ✅ Aucun problème détecté
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">💡 Recommandations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-700">Améliorations Techniques:</h3>
            <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
              <li>Résoudre les conflits de routage Astro</li>
              <li>Nettoyer les fichiers .jsx/.tsx orphelins</li>
              <li>Ajouter des tests automatisés</li>
              <li>Optimiser les performances de la base de données</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-blue-700">Améliorations Business:</h3>
            <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
              <li>Encourager plus d'avis clients</li>
              <li>Développer le catalogue de formations</li>
              <li>Automatiser les rappels de rendez-vous</li>
              <li>Intégrer un système de paiement en ligne</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}