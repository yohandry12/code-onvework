import React from "react";
import { motion } from "framer-motion";

const RecommendationsSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* En-tête */}
          <div className="p-5 bg-gradient-to-r from-gray-100 to-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Avatar skeleton */}
              <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />

              {/* Info skeleton */}
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              </div>
            </div>

            {/* Chevron skeleton */}
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RecommendationsSkeleton;
