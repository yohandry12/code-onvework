import React, { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";

// Helper pour l'image (si vous l'avez globalisé, importez-le, sinon le voici)
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  return `${apiUrl.replace(/\/api$/, "")}${path}`;
};

const ReviewItem = ({ review }) => {
  // Récupération sécurisée des infos de l'auteur (Candidat)
  const authorProfile = review.author?.candidateProfile || {};
  const authorName =
    authorProfile.firstName && authorProfile.lastName
      ? `${authorProfile.firstName} ${authorProfile.lastName}`
      : review.author?.email || "Utilisateur Anonyme";

  return (
    <div className="border-b border-gray-100 py-6 last:border-0 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
            {authorProfile.avatar ? (
              <img
                src={getImageUrl(authorProfile.avatar)}
                alt={authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <UserCircleIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-sm">{authorName}</h4>
            <p className="text-xs text-gray-500 font-medium">Étudiant</p>
          </div>
        </div>

        {/* Date */}
        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
          {new Date(review.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </div>

      <div className="mt-3 pl-14">
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
        {review.comment ? (
          <p className="text-gray-700 text-sm leading-relaxed italic">
            "{review.comment}"
          </p>
        ) : (
          <p className="text-gray-400 text-xs italic">Pas de commentaire.</p>
        )}
      </div>
    </div>
  );
};

const TrainerReviews = ({ trainerId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRecommendations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchReviews = async () => {
    try {
      const response = await apiService.users.getTrainerRatings(trainerId, {
        limit: 100, // On charge tout pour simplifier la pagination locale
      });

      if (response.success) {
        setReviews(response.reviews || []);
        setStats({
          averageRating: response.averageRating || 0,
          totalRecommendations: response.total || 0,
        });
      }
    } catch (error) {
      console.error("Erreur chargement avis formateur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trainerId) fetchReviews();
  }, [trainerId]);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 5);
  };

  if (loading)
    return <div className="animate-pulse h-16 bg-gray-100 rounded-2xl"></div>;

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm mt-8">
        <p className="text-gray-500 font-medium">
          Aucun avis reçu pour le moment.
        </p>
      </div>
    );
  }

  const remainingReviews = Math.max(0, reviews.length - visibleCount);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      {/* EN-TÊTE ACCORDÉON */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">
            Avis des étudiants
          </h3>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
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
          <div className="bg-yellow-50/60 p-4 rounded-xl my-6 flex items-center gap-4 border border-yellow-100">
            <div className="text-4xl font-extrabold text-yellow-500">
              {Number(stats.averageRating).toFixed(1)}
            </div>
            <div>
              <div className="flex text-yellow-400 mb-1">
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
              <p className="text-xs text-yellow-800 font-medium">
                Note globale du formateur
              </p>
            </div>
          </div>

          {/* Liste des avis */}
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
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors"
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

export default TrainerReviews;
