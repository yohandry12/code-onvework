import React from "react";
import { motion } from "framer-motion";

const LoadingSkeleton = ({ count = 3 }) => {
  const shimmer = {
    initial: { backgroundPosition: "200% 0" },
    animate: { backgroundPosition: "-200% 0" },
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={shimmer}
          initial="initial"
          animate="animate"
          transition={{ duration: 2, repeat: Infinity }}
          className="h-48 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-xl"
          style={{
            backgroundSize: "200% 100%",
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
