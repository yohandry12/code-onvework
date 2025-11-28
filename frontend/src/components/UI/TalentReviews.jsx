import React, { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";

const ReviewItem = ({ review }) => (
  <div className="border-b border-gray-100 py-6 last:border-0 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 uppercase">
          {review.employerName?.charAt(0) || "A"}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">
            {review.employerName || "Anonyme"}
          </h4>
          <p className="text-xs text-gray-500">
            {review.employerCompany || "Entreprise"}
          </p>
        </div>
      </div>
      <span className="text-xs text-gray-400">
        {new Date(review.createdAt).toLocaleDateString()}
      </span>
    </div>

    <div className="mt-3">
      <div className="flex mb-2">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`w-4 h-4 ${
              i < review.rating ? "text-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed italic">
        "{review.message}"
      </p>
    </div>
  </div>
);

const TalentReviews = ({ candidateId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRecommendations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response =
          await apiService.recommendations.getCandidateRecommendations(
            candidateId,
            { limit: 100 }
          );
        if (response.success) {
          setReviews(response.data.recommendations || []);
          setStats({
            averageRating: response.data.averageRating || 0,
            totalRecommendations: response.data.totalRecommendations || 0,
          });
        }
      } catch (error) {
        console.error("Erreur chargement avis:", error);
      } finally {
        setLoading(false);
      }
    };

    if (candidateId) fetchReviews();
  }, [candidateId]);

  // Fonction pour charger plus d'avis
  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (loading)
    return <div className="animate-pulse h-16 bg-gray-100 rounded-2xl"></div>;

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center shadow-sm">
        <p className="text-gray-500 font-medium">
          Aucun avis reçu pour le moment.
        </p>
      </div>
    );
  }

  // ✅ CORRECTION : Calculer le nombre RÉEL d'avis restants
  const remainingReviews = Math.max(0, reviews.length - visibleCount);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* EN-TÊTE CLIQUABLE */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">
            Avis et Recommandations
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">
            {stats.totalRecommendations}
          </span>
        </div>

        <ChevronDownIcon
          className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* CONTENU DÉROULANT */}
      {isExpanded && (
        <div className="px-8 pb-8 border-t border-gray-100 animate-in slide-in-from-top-4 duration-200">
          {/* Bloc Note Moyenne */}
          <div className="bg-yellow-50 p-4 rounded-xl my-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Note moyenne
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl font-bold text-yellow-900">
                  {Number(stats.averageRating).toFixed(1)}
                </span>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(stats.averageRating)
                          ? "fill-current"
                          : "text-yellow-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Liste des avis */}
          <div className="space-y-2">
            {reviews.slice(0, visibleCount).map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>

          {/* ✅ BOUTON VOIR PLUS - CORRECTION ICI */}
          {remainingReviews > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={handleShowMore}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
              >
                Voir plus d'avis ({remainingReviews} restant
                {remainingReviews > 1 ? "s" : ""})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TalentReviews;
