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
  AcademicCapIcon,
  CurrencyDollarIcon,
  VideoCameraIcon,
  PresentationChartLineIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Award } from "lucide-react";
import Modal from "../components/UI/Modal";
import CreateJob from "./CreateJob";
import { apiService } from "../services/api";
import AIJobSuggestions from "../components/UI/AIJobSuggestions";
import Toast from "../components/UI/Toast";
import MobileMenu from "components/UI/MobileMenu"

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
  const [toast, setToast] = useState(null);

  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);

  // Mettre la fonction de fetch dans un useCallback pour la stabilité
  const fetchDashboardData = useCallback(async () => {
    try {
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
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboardData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchDashboardData();
      fetchRecentActivities();
    }
  }, [user, fetchDashboardData, fetchRecentActivities]);

  // Socket
  useEffect(() => {
    if (socket) {
      const handleActivity = (activity) => {
        setRecentActivity((prev) => {
          if (prev.find((p) => p.id === activity.id)) return prev;
          return [activity, ...prev.slice(0, 19)];
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

  const isCandidate = user?.role === "candidate";
  const isClient = user?.role === "client";

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    if (avatarPath.startsWith("http")) return avatarPath;
    const cleanPath = avatarPath.startsWith("/")
      ? avatarPath
      : `/${avatarPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const CandidateDashboard = () => (
    <div className="space-y-6">
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
            to="/profile"
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

  // --- DASHBOARD FORMATEUR DYNAMIQUE ---
  const TrainerDashboard = () => {
    // Récupération sécurisée des données venant du backend (stats)
    // Le backend renvoie maintenant : activeCourses, totalStudents, totalRevenue, averageRating, recentCourses
    const revenue = stats?.totalRevenue || 0;
    const coursesCount = stats?.activeCourses || 0;
    const studentsCount = stats?.totalStudents || 0;
    const rating = stats?.averageRating || 0;
    const recentCourses = stats?.recentCourses || [];

    return (
      <div className="space-y-8 animate-fade-in-up">
        {/* Section 1: Stats Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Carte Revenus */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <CurrencyDollarIcon className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  +0% ce mois
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Revenus Totaux
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {Number(revenue).toLocaleString("fr-FR")} FCFA
              </h3>
            </div>
          </div>

          {/* Carte Étudiants */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Étudiants Inscrits
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {studentsCount}
              </h3>
            </div>
          </div>

          {/* Carte Formations */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <VideoCameraIcon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Formations Actives
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {coursesCount}
              </h3>
            </div>
          </div>

          {/* Carte Note Moyenne */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                  <StarIcon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">
                Note Formateur
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
                {rating > 0 ? rating : "-"}
                {rating > 0 && (
                  <span className="text-sm text-gray-400 font-normal ml-1">
                    /5
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        {/* Section 2: Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne Gauche */}
          <div className="lg:col-span-2 space-y-8">
            {/* CTA Principal */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">
                  Prêt à partager votre savoir ?
                </h2>
                <p className="text-emerald-100 mb-6 max-w-lg">
                  Créez une nouvelle formation, ajoutez des modules vidéos et
                  commencez à gagner des revenus.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/courses/create"
                    className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:bg-gray-50 transition-all flex items-center"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" /> Créer une formation
                  </Link>
                  <Link
                    to="/trainer/dashboard"
                    className="bg-emerald-700 bg-opacity-40 text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-50 transition-all flex items-center backdrop-blur-sm"
                  >
                    <PresentationChartLineIcon className="w-5 h-5 mr-2" />{" "}
                    Analyser mes ventes
                  </Link>
                </div>
              </div>
            </div>

            {/* Mes Cours Récents */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <AcademicCapIcon className="w-5 h-5 mr-2 text-emerald-500" />{" "}
                  Mes formations récentes
                </h3>
                <Link
                  to="/courses"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              {recentCourses.length > 0 ? (
                <div className="space-y-4">
                  {recentCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 cursor-pointer"
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 mr-4 overflow-hidden">
                        <img
                          src={
                            course.thumbnail ||
                            "https://placehold.co/100x100?text=Cours"
                          }
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800 line-clamp-1">
                          {course.title}
                        </h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="mr-3 flex items-center">
                            <UserGroupIcon className="w-3 h-3 mr-1" />{" "}
                            {course.totalStudents || 0} étudiants
                          </span>
                          <span className="flex items-center">
                            <StarIcon className="w-3 h-3 mr-1" />{" "}
                            {course.averageRating || "0.0"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-emerald-600">
                          {Number(course.price).toLocaleString("fr-FR")} FCFA
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block
                          ${
                            course.status === "published"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                        >
                          {course.status === "published"
                            ? "Publié"
                            : "Brouillon"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* État vide si aucun cours */
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <SparklesIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Aucune formation active
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    C'est le moment de vous lancer !
                  </p>
                  <Link
                    to="/courses/create"
                    className="text-emerald-600 text-sm font-semibold hover:underline"
                  >
                    Commencer maintenant
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite : Profil */}
          <div className="space-y-8">
            {/* Carte Profil Mini */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 overflow-hidden border-2 border-white shadow-md">
                  {user?.profile?.avatar ? (
                    <img
                      src={getAvatarUrl(user.profile.avatar)}
                      alt="Profil"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                      {user?.profile?.firstName?.charAt(0) || "U"}
                      {user?.profile?.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
                <Link
                  to="/onboarding/trainer"
                  className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm border border-gray-200 hover:text-emerald-600 text-gray-500"
                  title="Modifier profil"
                >
                  <BriefcaseIcon className="w-4 h-4" />
                </Link>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </h3>
              <p className="text-emerald-600 text-sm font-medium mb-4">
                Formateur Certifié
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {user?.profile?.specialties &&
                  user.profile.specialties.slice(0, 3).map((spec, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                    >
                      {spec}
                    </span>
                  ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Complétion du profil</span>
                  <span className="font-semibold text-emerald-600">85%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
                <Link
                  to="/onboarding/trainer"
                  className="text-xs text-gray-400 hover:text-emerald-500 mt-2 inline-block"
                >
                  Compléter mon profil
                </Link>
              </div>
            </div>

            {/* Notifications / Activité Récente (Réutilisé pour le formateur aussi) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <BellIcon className="w-5 h-5 mr-2 text-orange-400" /> Dernières
                activités
              </h3>
              <div className="space-y-4">
                {recentActivity.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start text-sm pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Aucune notification récente
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-10">
      {/* Header */}
      <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        {/* Header global */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {user?.profile?.firstName} !
          </h1>
          <div className="flex items-center text-gray-600">
            <span
              className={`capitalize px-3 py-1 rounded-full text-sm font-medium mr-3
              ${
                user?.role === "trainer"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }
            `}
            >
              {user?.role === "trainer" ? "Formateur" : user?.role}
            </span>
            {user?.profile?.location?.city && (
              <>
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {user.profile.location.city},{" "}
                  {user.profile.location.country || "Cameroun"}
                </span>
              </>
            )}
            {user?.role === "candidate" && (
              <span className="ml-4">
                <RecommendationBadge badge={user.profile?.recommendationBadge} />
              </span>
            )}
          </div>
        </div>

        {/* Bloc Activité pour Candidat/Client */}
        {(isCandidate || isClient) && (
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
        )}

        {user?.role === "candidate" && <CandidateDashboard />}
        {user?.role === "client" && <ClientDashboard />}
        {user?.role === "trainer" && <TrainerDashboard />}

        {user?.role === "admin" && (
          <div className="text-center p-10">
            Redirection vers le panel admin...
          </div>
        )}

        {user?.role !== "admin" && (
          <>
            <FloatingFeedbackButton
              onClick={() => setIsTestimonialModalOpen(true)}
            />
            {isTestimonialModalOpen && (
              <TestimonialFormModal
                onClose={() => setIsTestimonialModalOpen(false)}
                onSubmitted={(status) => {
                  setIsTestimonialModalOpen(false);
                  if (status === "sucess") {
                    setToast({
                      type: "success",
                      message: "Merci pour votre témoignage!",
                    });
                  } else {
                    setToast({
                      type: "error",
                      message: "Vous avez déjà envoyé un témoignage!",
                    });
                  }
                }}
              />
            )}
          </>
        )}
        <Toast toast={toast} onClose={()=>{setToast(null)}}/>
        {/* Utilisation du composant mobileMenu */}
        {user && <MobileMenu user={user}/>}

        <Toast
          toast={toast}
          onClose={() => {
            setToast(null);
          }}
        />

      </div>
    </div>
  );
};

export default Dashboard;
