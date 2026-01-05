import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  BellIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  VideoCameraIcon,
  StarIcon,
  CheckIcon,
  TrashIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "../services/api";
import FloatingFeedbackButton from "../components/UI/FloatingFeedbackButton";
import TestimonialFormModal from "../components/UI/TestimonialFormModal";
import Toast from "../components/UI/Toast";

// --- ANIMATIONS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// --- COMPOSANTS UI ---
const RecommendationBadge = ({ badge }) => {
  if (!badge || badge === "Aucun") return null;

  const colors = {
    Bronze: "bg-orange-100 text-orange-700 border-orange-200",
    Argent: "bg-slate-100 text-slate-700 border-slate-200",
    Or: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
        colors[badge] || colors.Bronze
      }`}
    >
      <StarIcon className="w-4 h-4 mr-1.5" />
      {badge}
    </motion.div>
  );
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <motion.div
    variants={itemVariants}
    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow"
  >
    <div
      className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 ${colorClass}`}
    ></div>
    <div
      className={`p-3 w-fit rounded-2xl mb-4 ${colorClass} bg-opacity-10 text-opacity-100`}
    >
      <Icon className={`w-6 h-6 ${colorClass.replace("bg-", "text-")}`} />
    </div>
    <div>
      <h3 className="text-3xl font-extrabold text-slate-800 mb-1">
        {value || 0}
      </h3>
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const { socket } = useSocket();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastData, setToastData] = useState(null);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);

  // Variables pour simplifier les conditions
  const isCandidate = user?.role === "candidate";
  const isClient = user?.role === "client";
  const isTrainer = user?.role === "trainer";

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await apiService.dashboard.getStats();
      if (response.success) setStats(response.stats);
    } catch (error) {
      console.error("Erreur dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const res = await apiService.activities.getRecent(20);
      if (res.success && Array.isArray(res.activities))
        setRecentActivity(res.activities);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchDashboardData();
      fetchRecentActivities();
    }
  }, [user, fetchDashboardData, fetchRecentActivities]);

  // --- SOCKETS ---
  useEffect(() => {
    if (socket) {
      const handleActivity = (activity) => {
        setRecentActivity((prev) => {
          if (prev.find((p) => p.id === activity.id)) return prev;
          return [activity, ...prev.slice(0, 19)];
        });
      };
      socket.on("activity", handleActivity);
      return () => socket.off("activity", handleActivity);
    }
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await apiService.activities.markAsRead(id);
      setRecentActivity((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: true } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const removeActivity = async (id) => {
    try {
      await apiService.activities.delete(id);
      setRecentActivity((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const timeAgo = (isoDate) => {
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  };

  if (loading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Bonjour,{" "}
            <span className="text-indigo-600">{user?.profile?.firstName}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-lg">
            Voici ce qui se passe sur votre espace aujourd'hui.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-50">
          {user?.profile?.location?.city && (
            <div className="flex items-center text-sm text-slate-500 border-r border-slate-200 pr-4 mr-1">
              <MapPinIcon className="w-4 h-4 mr-1.5 text-indigo-400" />
              {user.profile.location.city}
            </div>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
             ${
               isCandidate
                 ? "bg-purple-100 text-purple-700"
                 : "bg-blue-100 text-blue-700"
             }
          `}
          >
            {isCandidate ? "Candidat" : isClient ? "Recruteur" : "Formateur"}
          </span>
          {isCandidate && (
            <RecommendationBadge badge={user.profile?.recommendationBadge} />
          )}
        </div>
      </header>

      {/* --- DASHBOARD CANDIDAT --- */}
      {isCandidate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Candidatures"
            value={stats?.totalApplications}
            icon={DocumentTextIcon}
            colorClass="bg-indigo-500"
          />
          <StatCard
            title="En attente"
            value={stats?.pendingApplications}
            icon={ClockIcon}
            colorClass="bg-amber-500"
          />
          <StatCard
            title="Acceptées"
            value={stats?.acceptedApplications}
            icon={CheckCircleIcon}
            colorClass="bg-emerald-500"
          />
          <StatCard
            title="Vues Profil"
            value={stats?.profileViews}
            icon={EyeIcon}
            colorClass="bg-cyan-500"
          />
        </div>
      )}

      {/* --- DASHBOARD CLIENT --- */}
      {isClient && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Offres actives"
            value={stats?.totalCreatedJobs}
            icon={BriefcaseIcon}
            colorClass="bg-blue-500"
          />
          <StatCard
            title="Candidatures"
            value={stats?.totalApplications}
            icon={DocumentTextIcon}
            colorClass="bg-indigo-500"
          />
          <StatCard
            title="Recrutés"
            value={stats?.hiredCandidates}
            icon={UserGroupIcon}
            colorClass="bg-emerald-500"
          />
          <StatCard
            title="Terminées"
            value={stats?.completedJobs}
            icon={CheckCircleIcon}
            colorClass="bg-teal-500"
          />
        </div>
      )}

      {/* --- DASHBOARD FORMATEUR --- */}
      {isTrainer && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Revenus"
            value={`${stats?.totalRevenue || 0} FCFA`}
            icon={CurrencyDollarIcon}
            colorClass="bg-emerald-500"
          />
          <StatCard
            title="Étudiants"
            value={stats?.totalStudents}
            icon={UserGroupIcon}
            colorClass="bg-blue-500"
          />
          <StatCard
            title="Formations"
            value={stats?.activeCourses}
            icon={VideoCameraIcon}
            colorClass="bg-purple-500"
          />
          <StatCard
            title="Note"
            value={stats?.averageRating || "N/A"}
            icon={StarIcon}
            colorClass="bg-orange-500"
          />
        </div>
      )}

      {/* --- SECTION BASSE (Activités & Graphiques) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique placeholder */}
        {/* <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-slate-400">
            <SparklesIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Graphique de performance (À venir)</p>
          </div>
        </div> */}

        {/* Bloc Activité pour Candidat/Client */}
        {(isCandidate || isClient || isTrainer) && (
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BellIcon className="h-5 w-5 mr-2" />
              Activité récente
            </h2>

            <div className="space-y-3">
              {recentActivity.map((activity) => (
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
      </div>

      {/* Boutons flottants (en dehors du grid) */}
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
                if (status === "success") {
                  setToastData({
                    type: "success",
                    message: "Merci pour votre témoignage!",
                  });
                } else {
                  setToastData({
                    type: "error",
                    message: "Vous avez déjà envoyé un témoignage!",
                  });
                }
              }}
            />
          )}
        </>
      )}

      {/* Toast */}
      {toastData && (
        <Toast toast={toastData} onClose={() => setToastData(null)} />
      )}
    </motion.div>
  );
};

export default Dashboard;
