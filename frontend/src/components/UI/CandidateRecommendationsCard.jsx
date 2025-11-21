import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import RecommendationItem from "./RecommendationItem";
import PaginationControls from "./PaginationControls";
import { useApi } from "../../hooks/useApi";
import apiService from "../../services/api";

const CandidateRecommendationsCard = ({ candidate, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recommendations, setRecommendations] = useState(
    candidate.recommendations || []
  );
  const [pagination, setPagination] = useState(candidate.pagination || {});
  const { loading, error } = useApi();

  const handleExpandToggle = useCallback(async () => {
    if (!isExpanded && recommendations.length === 0) {
      try {
        const response =
          await apiService.recommendations.getCandidateRecommendations(
            candidate.candidateId,
            { page: 1, limit: 10 }
          );
        setRecommendations(response.data.recommendations || []);
        setPagination(response.data.pagination || {});
        setCurrentPage(1);
      } catch (err) {
        console.error("Erreur lors du chargement des recommandations:", err);
      }
    }
    setIsExpanded(!isExpanded);
  }, [isExpanded, candidate.candidateId, recommendations.length]);

  const handlePageChange = useCallback(
    async (page) => {
      try {
        const response =
          await apiService.recommendations.getCandidateRecommendations(
            candidate.candidateId,
            { page, limit: 10 }
          );
        setRecommendations(response.data.recommendations || []);
        setPagination(response.data.pagination || {});
        setCurrentPage(page);
      } catch (err) {
        console.error("Erreur lors du changement de page:", err);
      }
    },
    [candidate.candidateId]
  );

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`w-3.5 h-3.5 ${
          i < rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300 fill-gray-300"
        }`}
      />
    ));
  };

  const getBadgeColor = (badge) => {
    const colors = {
      Bronze: "from-orange-100 to-amber-100 text-orange-700",
      Argent: "from-gray-100 to-slate-100 text-gray-700",
      Or: "from-yellow-100 to-amber-100 text-yellow-700",
    };
    return colors[badge] || colors.Bronze;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* En-tête avec info candidat */}
      <motion.button
        onClick={handleExpandToggle}
        className="w-full p-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 transition-all"
        whileHover={{ backgroundColor: "rgba(229, 231, 235, 0.8)" }}
      >
        {/* Avatar et info candidat */}
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {candidate.candidateName?.charAt(0).toUpperCase() || "?"}
          </div>

          {/* Infos */}
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-lg">
              {candidate.candidateName}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex gap-0.5">
                {renderStars(Math.round(candidate.averageRating))}
              </div>
              <span className="text-sm font-semibold text-gray-600">
                {candidate.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({candidate.totalRecommendations} avis)
              </span>
            </div>
          </div>
        </div>

        {/* Badge et chevron */}
        <div className="flex items-center gap-3 ml-4">
          {candidate.badge && (
            <motion.span
              className={`inline-block px-3 py-1 bg-gradient-to-r ${getBadgeColor(
                candidate.badge
              )} text-xs font-bold rounded-full`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              {candidate.badge}
            </motion.span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDownIcon className="w-5 h-5 text-gray-600" />
          </motion.div>
        </div>
      </motion.button>

      {/* Contenu déroulable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-gray-200 bg-white">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin">
                    <div className="w-6 h-6 border-2 border-rose-300 border-t-rose-600 rounded-full" />
                  </div>
                  <p className="text-gray-500 mt-2">Chargement...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500">
                    Erreur lors du chargement des recommandations
                  </p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Pas de recommandations disponibles
                  </p>
                </div>
              ) : (
                <>
                  {/* Grille des recommandations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {recommendations.map((rec, idx) => (
                      <RecommendationItem
                        key={`${rec.id}-${idx}`}
                        recommendation={rec}
                        index={idx}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CandidateRecommendationsCard;
