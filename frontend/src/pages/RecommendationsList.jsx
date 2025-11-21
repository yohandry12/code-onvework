import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StarIcon, SparklesIcon } from "@heroicons/react/24/solid";
import CandidateRecommendationsCard from "../components/UI/CandidateRecommendationsCard";
import RecommendationsSkeleton from "../components/UI/RecommendationsSkeleton";
import apiService from "../services/api";

const RecommendationsList = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("createdAt");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchCandidatesRecommendations();
  }, [sortBy]);

  const fetchCandidatesRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response =
        await apiService.recommendations.getAllCandidatesRecommendations({
          page: 1,
          limit: 10,
          sortBy,
        });

      setCandidates(response.data || []);
      setSummary(response.summary || {});
    } catch (err) {
      console.error("Erreur lors du chargement des recommandations:", err);
      setError(
        err.response?.data?.error ||
          "Erreur lors du chargement des recommandations"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <SparklesIcon className="w-8 h-8 text-rose-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-blue-600 bg-clip-text text-transparent">
              Recommandations des candidats
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl">
            Découvrez les avis et notes des clients sur les candidats de notre
            plateforme. Chaque recommandation est un témoignage de qualité et de
            professionnalisme.
          </p>
        </motion.div>

        {/* Statistiques résumées */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          >
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Candidats évalués
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {summary.totalCandidates || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <StarIcon className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total des avis
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {summary.totalRecommendationsAcrossAll || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Moyenne générale
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    4.8
                    <span className="text-lg">⭐</span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                  <StarIcon className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filtres et tri */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8 flex gap-4 items-center justify-between flex-wrap"
        >
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("createdAt")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === "createdAt"
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-rose-300"
              }`}
            >
              Plus récent
            </button>
            <button
              onClick={() => setSortBy("rating")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === "rating"
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-rose-300"
              }`}
            >
              Meilleures notes
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {candidates.length} candidat{candidates.length > 1 ? "s" : ""}{" "}
            trouvé
            {candidates.length > 1 ? "s" : ""}
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="space-y-6">
          {loading ? (
            <RecommendationsSkeleton count={5} />
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
            >
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={fetchCandidatesRecommendations}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </motion.div>
          ) : candidates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-gray-200 rounded-lg p-12 text-center"
            >
              <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Aucune recommandation pour le moment
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Les recommandations apparaîtront ici une fois que les clients
                auront évalué les candidats.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate, index) => (
                <CandidateRecommendationsCard
                  key={candidate.candidateId}
                  candidate={candidate}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsList;
