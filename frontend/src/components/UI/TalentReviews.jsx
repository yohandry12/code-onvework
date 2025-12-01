import React, { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, BriefcaseIcon } from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";

const ReviewItem = ({ review }) => (
  <div className="border-b border-gray-100 py-6 last:border-0 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {/* Avatar (Initiale) */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 uppercase flex-shrink-0">
          {review.employerName?.charAt(0) || "A"}
        </div>

        <div>
          <h4 className="font-bold text-gray-900 text-sm">
            {review.employerName || "Anonyme"}
          </h4>

          {/* Entreprise */}
          <p className="text-xs text-gray-500 font-medium">
            {review.employerCompany || "Entreprise"}
          </p>

          {/* --- NOUVEAU : Affichage du Titre de la Mission --- */}
          {review.jobTitle && (
            <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
              <BriefcaseIcon className="w-3 h-3" />
              <span
                className="line-clamp-1 max-w-[200px] sm:max-w-[300px]"
                title={review.jobTitle}
              >
                {review.jobTitle}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Date */}
      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
        {new Date(review.createdAt).toLocaleDateString("fr-FR")}
      </span>
    </div>

    <div className="mt-3 pl-14">
      {" "}
      {/* Indentation pour aligner avec le texte */}
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
      <p className="text-gray-700 text-sm leading-relaxed italic">
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
            { limit: 100 } // On récupère tout pour gérer la pagination locale
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

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (loading)
    return <div className="animate-pulse h-16 bg-gray-100 rounded-2xl"></div>;

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
        <p className="text-gray-500 font-medium">
          Aucun avis reçu pour le moment.
        </p>
      </div>
    );
  }

  const remainingReviews = Math.max(0, reviews.length - visibleCount);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* EN-TÊTE */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">
            Avis et Recommandations
          </h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {stats.totalRecommendations}
          </span>
        </div>

        <ChevronDownIcon
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* CONTENU */}
      {isExpanded && (
        <div className="px-6 pb-8 border-t border-gray-100">
          {/* Résumé Note */}
          <div className="bg-amber-50/60 p-4 rounded-xl my-6 flex items-center gap-4 border border-amber-100">
            <div className="text-4xl font-extrabold text-amber-500">
              {Number(stats.averageRating).toFixed(1)}
            </div>
            <div>
              <div className="flex text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(stats.averageRating)
                        ? "fill-current"
                        : "text-amber-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-amber-800 font-medium">
                Basé sur {stats.totalRecommendations} avis
              </p>
            </div>
          </div>

          {/* Liste */}
          <div className="flex flex-col">
            {reviews.slice(0, visibleCount).map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </div>

          {/* Voir plus */}
          {remainingReviews > 0 && (
            <div className="mt-8 text-center border-t border-gray-100 pt-4">
              <button
                onClick={handleShowMore}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
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
