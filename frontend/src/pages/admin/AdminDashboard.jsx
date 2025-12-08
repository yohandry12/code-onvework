import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";

// Importer les icônes nécessaires
import {
  UserGroupIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  StarIcon,
  ChartBarIcon,
  BellIcon,
  SparklesIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Dashboard Administrateur
      </h1>
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Utilisateurs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalUsers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BriefcaseIcon className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Offres d'emploi
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalJobs}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-purple-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Candidatures
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalApplications}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-indigo-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Actifs / 24h
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeUsers}
                </p>
              </div>
            </div>
          </div>
          {/* Carte Croissance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              {/* Changement d'icône et de couleur selon si c'est positif ou négatif */}
              <TrendingUpIcon
                className={`h-8 w-8 mr-4 ${
                  (stats?.monthlyGrowth || 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gray-500">Croissance</p>
                <p
                  className={`text-2xl font-bold ${
                    (stats?.monthlyGrowth || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {/* Condition pour afficher le + seulement si positif */}
                  {stats?.monthlyGrowth > 0 ? "+" : ""}
                  {stats?.monthlyGrowth || 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  d'utilisateurs ce mois
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions d'administration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Administration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Link
              to="/admin/users"
              className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50"
            >
              <UserGroupIcon className="h-6 w-6 text-blue-500 mr-3" />
              <span>Gérer utilisateurs</span>
            </Link>
            <Link
              to="/admin/testimonials"
              className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-yellow-400 hover:bg-yellow-50"
            >
              <StarIcon className="h-6 w-6 text-yellow-500 mr-3" />
              <span>Gérer les témoignages</span>
            </Link>
            <Link
              to="/admin/recommandations"
              className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-purple-400 hover:bg-purple-50"
            >
              <SparklesIcon className="h-6 w-6 text-purple-500 mr-3" />
              <span>Timeline des Succès</span>
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-red-400 hover:bg-red-50"
            >
              <BellIcon className="h-6 w-6 text-red-500 mr-3" />
              <span>Signalements</span>
            </Link>

            <Link
              to="/admin/jobs"
              className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-red-400 hover:bg-red-50"
            >
              <BriefcaseIcon className="h-6 w-6 text-red-500 mr-3" />
              <span>Gérer les offres d'emploi</span>
            </Link>

            <Link
              to="/admin/finance"
              className="flex items-center p-4 border-2 border-dashed rounded-lg hover:border-green-400 hover:bg-green-50"
            >
              <BanknotesIcon className="h-6 w-6 text-green-600 mr-3" />
              <span>Taux Financiers</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
