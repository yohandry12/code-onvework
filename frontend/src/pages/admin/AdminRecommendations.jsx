import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../../services/api";
import {
  ArrowLongRightIcon,
  ChatBubbleBottomCenterTextIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  BriefcaseIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Un composant utilitaire pour les avatars
const Avatar = ({ user }) => (
  <div className="flex-shrink-0">
    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
      {user?.firstName?.[0]}
      {user?.lastName?.[0]}
    </div>
  </div>
);

// La carte narrative qui met en scène la recommandation
const RecommendationCard = ({ rec }) => {
  const badgeColors = {
    Bronze: "text-amber-700 bg-amber-100",
    Argent: "text-gray-600 bg-gray-200",
    Or: "text-yellow-600 bg-yellow-200",
  };

  // Défensif : certaines recommandations peuvent venir sans employer/employee/job
  const employer = rec?.employer || null;
  const employee = rec?.employee || null;
  const job = rec?.job || null;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-center">
          {/* 1. L'Employeur */}
          {employer ? (
            <Link
              to={`/admin/users/${employer.id}`}
              className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50"
            >
              <Avatar user={employer} />
              <p className="mt-2 font-semibold text-gray-800">
                {employer.firstName} {employer.lastName}
              </p>
              <div className="flex items-center text-sm text-gray-500">
                <BuildingOffice2Icon className="w-4 h-4 mr-1" />
                <span>{employer.company}</span>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center p-2 rounded-lg text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                ?
              </div>
              <p className="mt-2 text-sm">Employeur inconnu</p>
            </div>
          )}

          {/* 2. La Connexion (Mission) */}
          <div className="flex flex-col items-center">
            <ArrowLongRightIcon className="w-12 h-12 text-gray-300" />
            {job ? (
              <Link
                to={`/jobs/${job.id}`}
                className="mt-1 flex items-center text-sm font-medium text-blue-600 hover:underline"
              >
                <BriefcaseIcon className="w-4 h-4 mr-1" />
                <span className="truncate">{job.title}</span>
              </Link>
            ) : (
              <div className="mt-1 text-sm text-gray-500">Mission inconnue</div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {rec?.createdAt
                ? new Date(rec.createdAt).toLocaleDateString()
                : "Date inconnue"}
            </p>
          </div>

          {/* 3. L'Employé */}
          {employee ? (
            <Link
              to={`/admin/users/${employee.id}`}
              className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50"
            >
              <Avatar user={employee} />
              <p className="mt-2 font-semibold text-gray-800">
                {employee.firstName} {employee.lastName}
              </p>
              {employee.recommendationBadge && (
                <span
                  className={`mt-1 text-xs font-bold px-2 py-1 rounded-full ${
                    badgeColors[employee.recommendationBadge] ||
                    "bg-gray-200 text-gray-600"
                  }`}
                >
                  {employee.recommendationBadge}
                </span>
              )}
            </Link>
          ) : (
            <div className="flex flex-col items-center p-2 rounded-lg text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                ?
              </div>
              <p className="mt-2 text-sm">Employé inconnu</p>
            </div>
          )}
        </div>
      </div>
      {/* Le message de la recommandation */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex">
          <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
          <p className="text-gray-700 italic">
            "{rec?.message || "(Pas de message)"}"
          </p>
        </div>
      </div>
    </div>
  );
};

// La page principale
const AdminRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

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
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (loading) return <div className="text-center p-10">Chargement...</div>;

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-8">
        <SparklesIcon className="w-8 h-8 text-purple-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">
          Timeline des Succès
        </h1>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
          {/* Pagination */}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-700">
            Aucune recommandation pour le moment.
          </h2>
          <p className="text-gray-500 mt-2">
            Les succès de vos utilisateurs apparaîtront ici.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminRecommendations;
