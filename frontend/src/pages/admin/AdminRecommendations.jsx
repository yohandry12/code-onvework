import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";
import {
  ArrowLongRightIcon,
  ChatBubbleBottomCenterTextIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  SparklesIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

// Avatar avec effet glassmorphism
const Avatar = ({ user, size = "large" }) => {
  const sizes = {
    small: "w-10 h-10 text-base",
    medium: "w-12 h-12 text-lg",
    large: "w-16 h-16 text-2xl",
  };

  return (
    <div className="relative group">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={`${user.firstName} ${user.lastName}`}
          className={`${sizes[size]} rounded-2xl object-cover ring-4 ring-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </div>
      )}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
    </div>
  );
};

// Badge de rating avec étoiles
const RatingBadge = ({ rating }) => {
  return (
    <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1.5 rounded-full">
      {[...Array(5)].map((_, i) => (
        <StarIconSolid
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-bold text-yellow-700">{rating}.0</span>
    </div>
  );
};

// Badge de recommandation modernisé
const BadgeDisplay = ({ badge }) => {
  if (!badge || badge === "Aucun") return null;

  const badgeConfig = {
    Bronze: {
      gradient: "from-orange-400 to-amber-600",
      icon: "🥉",
      glow: "shadow-orange-200",
    },
    Argent: {
      gradient: "from-gray-300 to-gray-500",
      icon: "🥈",
      glow: "shadow-gray-200",
    },
    Or: {
      gradient: "from-yellow-300 to-yellow-500",
      icon: "🥇",
      glow: "shadow-yellow-200",
    },
  };

  const config = badgeConfig[badge] || badgeConfig.Bronze;

  return (
    <div
      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.gradient} text-white font-bold text-sm shadow-lg ${config.glow} animate-pulse-subtle`}
    >
      <span className="text-lg">{config.icon}</span>
      <span>{badge}</span>
    </div>
  );
};

// Carte de recommandation modernisée
const RecommendationCard = ({ rec, index }) => {
  const employer = rec?.employer || null;
  const employee = rec?.employee || null;
  const job = rec?.job || null;

  return (
    <div
      className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 ease-out overflow-hidden border border-gray-100 group"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Header avec gradient subtil */}
      <div className="relative bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Recommandation
              </h3>
              <p className="text-xs text-gray-500">
                {rec?.createdAt
                  ? new Date(rec.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Date inconnue"}
              </p>
            </div>
          </div>
          {rec?.rating && <RatingBadge rating={rec.rating} />}
        </div>
      </div>

      {/* Corps principal - Timeline horizontale */}
      <div className="p-8">
        <div className="relative">
          {/* Ligne de connexion */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 -translate-y-1/2 hidden md:block"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Employeur */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-indigo-300 transition-all duration-300 w-full group-hover:scale-105">
                {employer ? (
                  <Link
                    to={`/admin/users/${employer.id}`}
                    className="flex flex-col items-center space-y-3"
                  >
                    <Avatar user={employer} size="large" />
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {employer.firstName} {employer.lastName}
                      </p>
                      <div className="flex items-center justify-center text-sm text-gray-500 mt-1">
                        <BuildingOffice2Icon className="w-4 h-4 mr-1" />
                        <span className="truncate">
                          {employer.company || "Entreprise"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      Client
                    </span>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center space-y-3 text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                      ?
                    </div>
                    <p className="text-sm">Employeur inconnu</p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                A recommandé
              </div>
            </div>

            {/* Mission (Centre) */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-xl text-white text-center w-full max-w-xs transform group-hover:scale-105 transition-all duration-300">
                <BriefcaseIcon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                {job ? (
                  <Link
                    to={`/jobs/${job.id}`}
                    className="block hover:opacity-90 transition-opacity"
                  >
                    <p className="font-bold text-lg mb-1 line-clamp-2">
                      {job.title}
                    </p>
                    <p className="text-xs opacity-80">Voir la mission →</p>
                  </Link>
                ) : (
                  <div>
                    <p className="font-medium text-sm opacity-80">
                      Mission inconnue
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Employé */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-purple-300 transition-all duration-300 w-full group-hover:scale-105">
                {employee ? (
                  <Link
                    to={`/admin/users/${employee.id}`}
                    className="flex flex-col items-center space-y-3"
                  >
                    <Avatar user={employee} size="large" />
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {employee.profession || "Freelance"}
                      </p>
                    </div>
                    {employee.recommendationBadge && (
                      <BadgeDisplay badge={employee.recommendationBadge} />
                    )}
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                      Talent
                    </span>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center space-y-3 text-gray-400">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                      ?
                    </div>
                    <p className="text-sm">Employé inconnu</p>
                  </div>
                )}
              </div>
              <div className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Talent recommandé
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message de recommandation */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t border-gray-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Message de recommandation
            </p>
            <p className="text-gray-600 italic leading-relaxed">
              "{rec?.message || "Pas de message fourni"}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de statistiques
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

// Page principale
const AdminRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchRecommendations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiService.recommendations.getAllForAdmin({
        page,
      });
      if (response.success) {
        setRecommendations(response.recommendations);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Erreur chargement recommandations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations(currentPage);
  }, [fetchRecommendations, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">
            Chargement des recommandations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-indigo-50/20">
      {/* Header moderne avec glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Timeline des Succès
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Découvrez les meilleures collaborations de la plateforme
                </p>
              </div>
            </div>
            {/* <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <FunnelIcon className="w-5 h-5" />
              <span>Filtrer</span>
            </button> */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <StatsCard
            title="Total recommandations"
            value={pagination.totalResults || 0}
            icon={SparklesIcon}
            color="from-purple-500 to-indigo-600"
          />
          <StatsCard
            title="Badges Or attribués"
            value={
              recommendations.filter(
                (r) => r.employee?.recommendationBadge === "Or"
              ).length
            }
            icon={StarIconSolid}
            color="from-yellow-400 to-orange-500"
          />
          {/* <StatsCard
            title="Taux de satisfaction"
            value="4.8/5"
            icon={ChatBubbleBottomCenterTextIcon}
            color="from-green-400 to-emerald-500"
          /> */}
        </div>

        {/* Liste des recommandations */}
        {recommendations.length > 0 ? (
          <>
            <div className="space-y-8">
              {recommendations.map((rec, index) => (
                <RecommendationCard key={rec.id} rec={rec} index={index} />
              ))}
            </div>

            {/* Pagination modernisée */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>

                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      currentPage === i + 1
                        ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mx-auto flex items-center justify-center mb-6">
              <SparklesIcon className="w-12 h-12 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aucune recommandation pour le moment
            </h2>
            <p className="text-gray-500">
              Les succès de vos utilisateurs apparaîtront ici dès qu'ils
              commenceront à collaborer.
            </p>
          </div>
        )}
      </div>

      {/* Animation CSS personnalisée */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminRecommendations;
