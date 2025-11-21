import React from "react";
import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const RecommendationItem = ({ recommendation, index }) => {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300 fill-gray-300"
        }`}
      />
    ));
  };

  const formattedDate = format(
    new Date(recommendation.createdAt),
    "dd MMM yyyy",
    { locale: fr }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-rose-300 hover:shadow-md transition-all"
    >
      {/* En-tête avec nom et date */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {recommendation.employerName || "Client anonyme"}
          </h4>
          {recommendation.employerCompany && (
            <p className="text-sm text-gray-500">
              {recommendation.employerCompany}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400">{formattedDate}</span>
      </div>

      {/* Étoiles */}
      <div className="flex gap-1 mb-3">
        {renderStars(recommendation.rating)}
      </div>

      {/* Message */}
      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
        {recommendation.message}
      </p>

      {/* Badge de note */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs font-semibold text-gray-500">
          Note: {recommendation.rating}/5
        </span>
        <span className="inline-block px-2 py-1 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 text-xs font-medium rounded-full">
          Mission #{recommendation.jobId}
        </span>
      </div>
    </motion.div>
  );
};

export default RecommendationItem;
