import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../../services/api";
import {
  UserGroupIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon, // Utilisé pour la croissance
} from "@heroicons/react/24/outline";

// Composant Carte Statistique Standard
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colors[color] || colors.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.dashboard.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Erreur chargement stats admin:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Calcul pour la couleur de croissance
  const isPositiveGrowth = (stats?.monthlyGrowth || 0) >= 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Vue d'ensemble</h1>
        <p className="text-slate-500">
          Bienvenue sur votre panneau d'administration.
        </p>
      </div>

      {/* Grille de Statistiques (5 colonnes pour inclure la croissance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Utilisateurs Totaux"
          value={stats?.totalUsers}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Offres Publiées"
          value={stats?.totalJobs}
          icon={BriefcaseIcon}
          color="green"
        />
        <StatCard
          title="Candidatures"
          value={stats?.totalApplications}
          icon={DocumentTextIcon}
          color="purple"
        />
        <StatCard
          title="Utilisateurs Actifs"
          value={stats?.activeUsers}
          icon={CheckCircleIcon}
          color="indigo"
        />

        {/* --- CARTE CROISSANCE PERSONNALISÉE --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                Croissance
              </p>
              <h3
                className={`text-3xl font-extrabold ${
                  isPositiveGrowth ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {stats?.monthlyGrowth > 0 ? "+" : ""}
                {stats?.monthlyGrowth || 0}%
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                d'utilisateurs ce mois
              </p>
            </div>
            <div
              className={`p-3 rounded-xl ${
                isPositiveGrowth
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <ArrowTrendingUpIcon
                className={`w-6 h-6 ${!isPositiveGrowth ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Graphique ou Tableau Récents (Placeholder pour futur dev) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px] flex items-center justify-center text-slate-400">
          <p>Graphique d'activité (À venir)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[300px] flex items-center justify-center text-slate-400">
          <p>Derniers inscrits (À venir)</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
