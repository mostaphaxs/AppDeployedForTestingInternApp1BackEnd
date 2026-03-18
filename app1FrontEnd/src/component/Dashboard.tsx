// src/component/Dashboard.tsx
import { useState, useEffect } from 'react';
import { TrendingUp, Users, Wallet, Loader2, WalletCards, Home, MapPin, UserPlus, Eye, EyeOff, Lock, Info, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import { formatNumber } from '../lib/utils';

interface Stats {
  investissement: number;
  encaissements: number;
  reservations: number;
  charges: number;
  cout_global: number;
  charges_details: {
    bureau: number;
    intervenants: number;
    contractors: number;
  };
  biens_status: {
    [key: string]: number;
  };
  recent_clients: any[];
  recent_payments: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Utilisateur');
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const statsData = await apiFetch<Stats>('/stats');
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du chargement des statistiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUserName(u.name || 'Utilisateur');
      } catch (e) { }
    }
    const savedVisibility = localStorage.getItem('dashboard_stats_visible');
    if (savedVisibility === 'true') {
      setShowStats(true);
    }
    fetchData();
  }, []);

  const toggleStats = () => {
    const newVal = !showStats;
    setShowStats(newVal);
    localStorage.setItem('dashboard_stats_visible', newVal.toString());
    if (newVal) {
      toast.success('Montants affichés', { icon: '👁️', duration: 1500 });
    } else {
      toast('Montants masqués', { icon: '🔒', duration: 1500 });
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-base font-medium text-gray-500">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  // Helper for masking financial data
  const renderAmount = (amount: number, sizeClass = "text-2xl", colorClass = "text-gray-900") => {
    if (!showStats) {
      return (
        <div className={`flex items-center gap-2 ${sizeClass} text-gray-300 font-bold`}>
          <Lock size={20} className="mb-1" />
          <span>••••••••</span>
        </div>
      );
    }
    return (
      <div className="flex items-baseline gap-1">
        <span className={`${sizeClass} font-bold ${colorClass}`}>
          {formatNumber(amount)}
        </span>
        <span className="text-sm font-medium text-gray-500">MAD</span>
      </div>
    );
  };

  const recouvrementPercentage = stats.cout_global > 0
    ? Math.min((stats.encaissements / stats.cout_global) * 100, 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans">

      {/* ── 1. En-tête (Header) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, <span className="text-blue-600">{userName}</span>
          </h1>
          <p className="text-gray-600 text-base mt-2">
            Voici un résumé clair et détaillé de votre activité immobilière et financière.
          </p>
        </div>

        <button
          onClick={toggleStats}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 ${showStats
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {showStats ? (
            <><EyeOff size={20} /> Masquer les montants</>
          ) : (
            <><Eye size={20} /> Afficher les montants</>
          )}
        </button>
      </div>

      {/* ── 2. Résumé Financier Global ── */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-2">
          <Wallet className="text-gray-400" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Vue d'ensemble Financière</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coût Global */}
          <div className="bg-white p-6 rounded-2xl border-2 border-blue-100 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-gray-600">Investissement Total Global</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Fonciers + Travaux + Charges diverses</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Wallet size={24} />
              </div>
            </div>
            {renderAmount(stats.cout_global, "text-4xl", "text-blue-900")}
          </div>

          {/* Encaissements */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-gray-600">Total Recouvert</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Paiements reçus des clients</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
            {renderAmount(stats.encaissements, "text-3xl", "text-emerald-700")}

            {/* Barre de progression simplifiée */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Taux de recouvrement</span>
                <span className={`text-sm font-bold ${showStats ? 'text-emerald-600' : 'text-gray-300'}`}>
                  {showStats ? `${recouvrementPercentage}%` : '••%'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-emerald-500 rounded-full transition-all duration-1000 ${!showStats ? 'opacity-20' : ''}`}
                  style={{ width: `${showStats ? recouvrementPercentage : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Dépenses et Charges */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-base font-semibold text-gray-600">Total des Charges</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Dépenses de gestion et travaux</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <WalletCards size={24} />
              </div>
            </div>
            {renderAmount(stats.charges, "text-3xl", "text-rose-700")}
          </div>
        </div>
      </section>

      {/* ── 3. Détails & Commercial ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Détail des charges */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-5">
            <h3 className="text-lg font-bold text-gray-800">Répartition des Charges</h3>
            <p className="text-sm text-gray-500">Où est dépensé l'argent exactement ?</p>
          </div>
          <div className="p-5 space-y-3 flex-grow">
            {[
              { label: 'Entreprises de construction (Travaux)', value: stats.charges_details.contractors, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Intervenants Techniques (Notaires, Architectes...)', value: stats.charges_details.intervenants, icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Dépenses administratives & Bureau', value: stats.charges_details.bureau, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-base font-medium text-gray-700">{item.label}</span>
                </div>
                <div>
                  {renderAmount(item.value, "text-lg", "text-gray-800")}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-50/50 p-4 border-t border-blue-100 flex items-start gap-3">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-blue-800">Ces charges sont soustraites de vos encaissements pour calculer votre bénéfice réel.</p>
          </div>
        </section>

        {/* Commercial & Actions Rapides */}
        <div className="flex flex-col gap-6">
          {/* Réservations */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-6">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={32} />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-600">Clients & Réservations</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-bold text-indigo-900">{stats.reservations}</span>
                <span className="text-base text-gray-500 font-medium">dossiers actifs</span>
              </div>
            </div>
          </div>

          {/* Boutons d'actions */}
          <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex-grow">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Actions Rapides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Ajouter un Bien', desc: 'Créer un nouvel appartement/lot', path: '/add-property', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Nouveau Client', desc: 'Enregistrer une réservation', path: '/add-client', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { title: 'Ajouter un Terrain', desc: 'Acquisition foncière', path: '/add-terrain', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
                { title: 'Saisir une Charge', desc: 'Dépenses administratives', path: '/charges', icon: WalletCards, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                >
                  <div className={`p-2 rounded-lg ${action.bg} ${action.color} shrink-0`}>
                    <action.icon size={24} />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-base font-bold text-gray-800 group-hover:text-blue-700">{action.title}</h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

      </div>

      {/* ── 4. Nouvelles Sections Détachées (Détails) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">

        {/* État du Parc Immobilier */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">État du Parc Immobilier</h3>
            <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">Statuts</span>
          </div>
          <div className="p-5 flex-grow space-y-4">
            {stats.biens_status && Object.keys(stats.biens_status).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-emerald-700 mb-1">Disponibles</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.biens_status['Libre'] || 0}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-blue-700 mb-1">Réservés</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.biens_status['Réservé'] || 0}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                  <p className="text-sm font-medium text-indigo-700 mb-1">Vendus</p>
                  <p className="text-3xl font-bold text-indigo-600">{(stats.biens_status['Vendu'] || 0) + (stats.biens_status['Vendu Définitivement'] || 0)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-4">Aucune donnée sur le statut des biens.</p>
            )}
            <p className="text-sm text-gray-600 text-center mt-4">
              Ce tableau vous montre quels biens sont encore disponibles à la vente par rapport à ceux déjà engagés ou finalisés.
            </p>
          </div>
        </section>

        {/* Dernières Activités */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Dernières Activités</h3>
            <Clock className="text-gray-400" size={20} />
          </div>
          <div className="p-5 flex-grow overflow-y-auto max-h-80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-100 pb-2">Derniers Paiements Reçus</h4>
            <div className="space-y-3 mb-6">
              {stats.recent_payments && stats.recent_payments.length > 0 ? (
                stats.recent_payments.map((payment: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        {payment.client ? (
                          <p className="text-sm font-bold text-gray-900">{payment.client.nom_complet}</p>
                        ) : (
                          <p className="text-sm font-bold text-gray-500 italic">Client inconnu</p>
                        )}
                        <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString('fr-MA')}</p>
                      </div>
                    </div>
                    {renderAmount(payment.amount, "text-sm", "text-emerald-700")}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic px-2">Aucun paiement récent.</p>
              )}
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 border-b border-gray-100 pb-2">Derniers Clients (Réservations)</h4>
            <div className="space-y-3">
              {stats.recent_clients && stats.recent_clients.length > 0 ? (
                stats.recent_clients.map((client: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <UserPlus size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{client.nom_complet}</p>
                        {client.bien && (
                          <p className="text-xs text-gray-600">
                            {client.bien.type_bien} - {client.bien.immeuble} {client.bien.num_appartement}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{new Date(client.created_at).toLocaleDateString('fr-MA')}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic px-2">Aucun client récent.</p>
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;