import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

/**
 * Composant de notation par étoiles (1-5)
 * @param {number} rating - Note actuelle (1-5)
 * @param {function} onRatingChange - Callback quand la note change
 * @param {boolean} readOnly - Si true, mode lecture seule
 * @param {number} size - Taille des étoiles (par défaut 6 = 24px)
 */
export default function StarRating({
  rating = 0,
  onRatingChange,
  readOnly = false,
  size = 6,
}) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClass =
    {
      4: "w-4 h-4",
      5: "w-5 h-5",
      6: "w-6 h-6",
      7: "w-7 h-7",
      8: "w-8 h-8",
    }[size] || "w-6 h-6";

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onRatingChange?.(star)}
            onMouseEnter={() => !readOnly && setHoveredRating(star)}
            onMouseLeave={() => !readOnly && setHoveredRating(0)}
            className={`transition-all ${
              !readOnly && "hover:scale-110 cursor-pointer"
            }`}
          >
            {star <= (hoveredRating || rating) ? (
              <StarIcon
                className={`${sizeClass} text-yellow-400 fill-yellow-400`}
              />
            ) : (
              <StarOutlineIcon className={`${sizeClass} text-gray-300`} />
            )}
          </button>
        ))}
      </div>

      {rating > 0 && (
        <span className="text-sm font-medium text-gray-600 ml-2">
          {rating}/5
        </span>
      )}
    </div>
  );
}
