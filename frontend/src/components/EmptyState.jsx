import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BriefcaseIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const EmptyState = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex items-center justify-center min-h-[500px]"
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* Illustration animée */}
        <motion.div
          variants={itemVariants}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="mb-8 inline-block"
        >
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-200 to-pink-200 rounded-full opacity-30 blur-lg"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-rose-100 to-pink-100 rounded-full">
              <BriefcaseIcon className="w-12 h-12 text-rose-500" />
            </div>
          </div>
        </motion.div>

        {/* Texte principal */}
        <motion.h3
          variants={itemVariants}
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          Aucune candidature pour le moment
        </motion.h3>

        {/* Sous-texte */}
        <motion.p
          variants={itemVariants}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          Vous n'avez pas encore postulé à des offres. Explorez notre catalogue
          de missions et trouvez les opportunités qui vous correspondent !
        </motion.p>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="mb-8 grid grid-cols-3 gap-4 py-6 px-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-100"
        >
          <div>
            <p className="text-2xl font-bold text-rose-600">100+</p>
            <p className="text-xs text-gray-600 mt-1">Missions actives</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-pink-600">1000+</p>
            <p className="text-xs text-gray-600 mt-1">Freelancers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-600">24h</p>
            <p className="text-xs text-gray-600 mt-1">Réponse moyenne</p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={itemVariants}>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-300 group"
          >
            <span>Découvrir les missions</span>
            <motion.span
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.span>
          </Link>
        </motion.div>

        {/* Emoji decorative */}
        <motion.p
          variants={itemVariants}
          className="text-4xl mt-8 animate-bounce"
          style={{ animationDuration: "2s" }}
        >
          🚀
        </motion.p>
      </div>
    </motion.div>
  );
};

export default EmptyState;
