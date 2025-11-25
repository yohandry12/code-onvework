import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import {
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  BellIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  MapPinIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Award } from "lucide-react";
import Modal from "../components/UI/Modal";
import CreateJob from "./CreateJob";
import { apiService } from "../services/api";
import AIJobSuggestions from "../components/UI/AIJobSuggestions";

import FloatingFeedbackButton from "../components/UI/FloatingFeedbackButton";
import TestimonialFormModal from "../components/UI/TestimonialFormModal";
// Créons un petit composant pour le style du badge
const RecommendationBadge = ({ badge }) => {
  if (!badge || badge === "Aucun") return null;

  const badgeStyles = {
    Bronze: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      icon: "text-orange-500",
    },
    Argent: { bg: "bg-gray-200", text: "text-gray-800", icon: "text-gray-500" },
    Or: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      icon: "text-yellow-500",
    },
  };

  const style = badgeStyles[badge] || badgeStyles.Bronze;

  return (
    <div
      className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}
    >
      <StarIcon className={`w-5 h-5 mr-2 ${style.icon}`} />
      Badge de Recommandation : {badge}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const { socket } = useSocket();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);

  // Mettre la fonction de fetch dans un useCallback pour la stabilité
  const fetchDashboardData = useCallback(async () => {
    try {
      // Remplacer les données simulées par un vrai appel API
      const response = await apiService.dashboard.getStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données du dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper: format time relative simple
  const timeAgo = (isoDate) => {
    try {
      const diff = Math.floor(
        (Date.now() - new Date(isoDate).getTime()) / 1000
      );
      if (diff < 60) return `${diff}s`;
      const m = Math.floor(diff / 60);
      if (m < 60) return `${m}m`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h`;
      const d = Math.floor(h / 24);
      return `${d}j`;
    } catch (e) {
      return "quelques instants";
    }
  };

  // Récupérer les activités récentes
  const fetchRecentActivities = useCallback(async () => {
    try {
      const res = await apiService.activities.getRecent(20);
      if (res.success && Array.isArray(res.activities)) {
        setRecentActivity(res.activities);
      }
    } catch (e) {
      console.error("Erreur chargement activités:", e);
      // En cas d'erreur, on garde les activités existantes
    }
  }, []);

  useEffect(() => {
    // Cette fonction sera appelée chaque fois que l'onglet du navigateur devient visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Tab is visible, re-fetching dashboard data...");
        fetchDashboardData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Nettoyage de l'écouteur
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchDashboardData();
      // Charger aussi les activités récentes
      fetchRecentActivities();
    }
  }, [user, fetchDashboardData, fetchRecentActivities]);

  // Nouvel useEffect pour écouter les mises à jour via socket
  useEffect(() => {
    if (socket) {
      // Écouter les updates des activités
      const handleActivity = (activity) => {
        setRecentActivity((prev) => {
          // éviter les doublons
          if (prev.find((p) => p.id === activity.id)) return prev;
          return [activity, ...prev.slice(0, 19)]; // garder max 20
        });
      };

      const handleActivityUpdate = (update) => {
        setRecentActivity((prev) =>
          prev.map((a) => (a.id === update.id ? { ...a, ...update } : a))
        );
      };

      const handleActivityRemoved = ({ id }) => {
        setRecentActivity((prev) => prev.filter((a) => a.id !== id));
      };

      socket.on("activity", handleActivity);
      socket.on("activity-updated", handleActivityUpdate);
      socket.on("activity-removed", handleActivityRemoved);

      return () => {
        socket.off("activity", handleActivity);
        socket.off("activity-updated", handleActivityUpdate);
        socket.off("activity-removed", handleActivityRemoved);
      };
    }
  }, [socket]);

  // Marquer comme lu (tentative API puis update local)
  const markAsRead = async (id) => {
    try {
      await apiService.activities.markAsRead(id);
      setRecentActivity((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
    } catch (e) {
      console.error("Erreur marquage activité comme lue:", e);
    }
  };

  const removeActivity = async (id) => {
    try {
      await apiService.activities.delete(id);
      setRecentActivity((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Erreur suppression activité:", e);
    }
  };

  const CandidateDashboard = () => (
    <div className="space-y-6">
      {/* <AIJobSuggestions /> */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Candidatures</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalApplications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.pendingApplications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Acceptées</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.acceptedApplications}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Missions accomplies
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.completedJobs}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vues profil</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.profileViews}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/jobs"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <BriefcaseIcon className="h-6 w-6 text-blue-500 mr-3" />
            <span className="text-gray-700">Rechercher des emplois</span>
          </Link>
          <Link
            to="/profile" // ou la route vers la page de modification de profil
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-green-500 mr-3" />
            <span className="text-gray-700">mettre à jour le profil</span>
          </Link>
          <Link
            to="/my-applications"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
          >
            <DocumentTextIcon className="h-6 w-6 text-purple-500 mr-3" />
            <span className="text-gray-700">gérer les candidatures</span>
          </Link>
        </div>
      </div>
    </div>
  );

  const ClientDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BriefcaseIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Offres créees</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalCreatedJobs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Candidatures</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalApplications || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Embauches</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.hiredCandidates || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                offres terminées
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.completedJobs || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            to="/jobs/create"
          >
            <PlusIcon className="h-6 w-6 text-blue-500 mr-3" />
            <span className="text-gray-700">Publier une offre</span>
          </Link>
          <Link
            to="/manage-applications"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <DocumentTextIcon className="h-6 w-6 text-green-500 mr-3" />
            <span className="text-gray-700">Gérer les candidatures</span>
          </Link>

          <Link
            to="/talents"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-purple-500 mr-3" />
            <span className="text-gray-700">Rechercher des talents</span>
          </Link>
          <Link
            to="/client/job-history"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <ChartBarIcon className="h-6 w-6 text-orange-500 mr-3" />
            <span className="text-gray-700">Voir l'historique des offres</span>
          </Link>
        </div>
      </div>
    </div>
  );

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bonjour {user?.profile?.firstName} !
        </h1>
        <div className="flex items-center text-gray-600">
          <span className="capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {user?.role}
          </span>
          {user?.profile?.location?.city &&
            user?.profile?.location?.country && (
              <>
                <MapPinIcon className="h-4 w-4 ml-4 mr-1" />
                <span className="text-sm">
                  {user.profile.location.city}, {user.profile.location.country}
                </span>
              </>
            )}
          {/* Affichage du badge pour les candidats */}
          <span className="capitalize  mb-1 px-3 py-1 rounded-full text-sm font-medium">
            {user?.role === "candidate" && (
              <RecommendationBadge badge={user.profile?.recommendationBadge} />
            )}
          </span>
        </div>
      </div>

      {/* Activité récente */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BellIcon className="h-5 w-5 mr-2" />
          Activité récente
        </h2>
        <div className="space-y-3 relative">
          {recentActivity.map((activity, index) => (
            <div
              key={activity.id}
              className={`flex items-center p-3 ${
                activity.read ? "bg-gray-50" : "bg-blue-50"
              } rounded-lg group hover:shadow-sm transition-shadow relative`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-3 ${
                  activity.status === "pending"
                    ? "bg-yellow-400"
                    : activity.status === "new"
                    ? "bg-green-400"
                    : activity.status === "scheduled"
                    ? "bg-blue-400"
                    : "bg-gray-400"
                }`}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">
                  Il y a {timeAgo(activity.createdAt)}
                </p>
              </div>
              <div className="ml-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!activity.read && (
                  <button
                    onClick={() => markAsRead(activity.id)}
                    className="p-1 hover:bg-blue-100 rounded-full text-blue-600"
                    title="Marquer comme lu"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => removeActivity(activity.id)}
                  className="p-1 hover:bg-red-100 rounded-full text-red-600"
                  title="Supprimer"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              Aucune activité récente
            </div>
          )}
        </div>
      </div>

      {/* Dashboard spécifique au rôle */}
      {user?.role === "candidate" && <CandidateDashboard />}
      {user?.role === "client" && <ClientDashboard />}

      {/* La logique ici est exactement la même, mais elle utilise les composants importés */}
      {user?.role !== "admin" && (
        <>
          <FloatingFeedbackButton
            onClick={() => setIsTestimonialModalOpen(true)}
          />

          {isTestimonialModalOpen && (
            <TestimonialFormModal
              onClose={() => setIsTestimonialModalOpen(false)}
              onSubmitted={() => {
                setIsTestimonialModalOpen(false);
                alert(
                  "Merci pour votre témoignage ! Il sera examiné par notre équipe."
                );
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
