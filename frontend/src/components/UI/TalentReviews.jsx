import React, { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { apiService } from "../../services/api";

const ReviewItem = ({ review }) => (
  <div className="border-b border-gray-100 py-6 last:border-0">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response =
          await apiService.recommendations.getCandidateRecommendations(
            candidateId
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

  if (loading)
    return <div className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>;

  if (reviews.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
        <p className="text-gray-500">Aucun avis reçu pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        Avis et Recommandations
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {stats.totalRecommendations}
        </span>
      </h3>

      <div className="bg-yellow-50 p-4 rounded-xl mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-800 font-medium">Note moyenne</p>
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

      <div className="space-y-2">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default TalentReviews;
