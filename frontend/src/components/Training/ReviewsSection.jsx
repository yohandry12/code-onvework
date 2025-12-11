import React, { useState } from "react";
import { apiService } from "../../services/api";
import StarRatingInput from "../UI/StarRating";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const ReviewsSection = ({
  trainingId,
  reviews = [],
  userHasEnrolled,
  userHasReviewed,
  onReviewAdded,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Veuillez sélectionner une note.");

    setSubmitting(true);
    try {
      // API call (Assurez-vous d'ajouter cette méthode dans api.js)
      // apiService.post(`/training/${trainingId}/review`, { rating, comment })
      const res = await apiService.trainings.addReview(trainingId, {
        rating,
        comment,
      });

      if (res.success) {
        toast.success("Avis publié !");
        if (onReviewAdded) onReviewAdded(); // Rafraichir la page parente
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Avis des étudiants
      </h2>

      {/* --- FORMULAIRE (Visible seulement si inscrit et pas encore noté) --- */}
      {userHasEnrolled && !userHasReviewed && (
        <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">
            Notez cette formation
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre note
              </label>
              <StarRatingInput rating={rating} setRating={setRating} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Qu'avez-vous pensé de ce cours ?"
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {submitting ? "Envoi..." : "Publier l'avis"}
            </button>
          </form>
        </div>
      )}

      {/* --- LISTE DES AVIS --- */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">Aucun avis pour le moment.</p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
            >
              <div className="flex items-center mb-2">
                {/* Avatar (Placeholder si null) */}
                <div className="mr-3">
                  <UserCircleIcon className="w-10 h-10 text-gray-300" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {review.student?.candidateProfile?.firstName || "Étudiant"}
                  </p>
                  <div className="flex items-center">
                    <StarRatingInput rating={review.rating} readOnly={true} />
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;
