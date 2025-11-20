// src/components/UI/DashboardActionCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowSmUpIcon, ArrowSmDownIcon } from "@heroicons/react/24/outline"; // Pour les icônes de tendance

const DashboardActionCard = ({
  icon: IconComponent, // L'icône sera un composant React (ex: PlusIcon, ChartBarIcon)
  title,
  value, // Valeur à afficher (ex: 1200)
  trend, // 'up', 'down', 'neutral'
  trendPercentage, // Ex: "+5%"
  to, // Le lien vers lequel la carte doit rediriger
  loading = false, // État de chargement pour la valeur
  className = "", // Classes CSS supplémentaires pour personnaliser le fond de la carte (ex: dégradé)
}) => {
  const trendColor =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
      ? "text-red-500"
      : "text-gray-500";

  const TrendIcon =
    trend === "up" ? ArrowSmUpIcon : trend === "down" ? ArrowSmDownIcon : null;

  return (
    <motion.div
      whileHover={{
        y: -5,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }} // Élévation et ombre au survol
      className={`relative p-6 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden ${className} flex flex-col justify-between`}
      style={{ minHeight: "160px" }} // Hauteur minimale pour la consistance
    >
      {/* Overlay dégradé pour le style visuel "Dribbble" */}
      <div
        className={`absolute inset-0 opacity-80 rounded-2xl ${className}`}
      ></div>

      {/* Le lien couvre toute la carte pour une meilleure UX */}
      <Link to={to} className="absolute inset-0 z-10" aria-label={title}></Link>

      <div className="relative z-20 flex flex-col items-start h-full">
        {/* Icône */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="p-3 bg-white/20 rounded-xl mb-3 flex items-center justify-center" // Ajout de flex pour centrer l'icône
        >
          {IconComponent && <IconComponent className="h-7 w-7 text-white" />}
        </motion.div>

        {/* Titre */}
        <h3 className="text-xl font-bold text-white mb-1 leading-tight">
          {title}
        </h3>

        {/* Valeur et Tendance (si disponible) */}
        {value !== undefined && (
          <div className="flex items-baseline space-x-2 text-white mt-auto">
            {" "}
            {/* mt-auto pour pousser en bas */}
            {loading ? (
              <div className="h-6 bg-white/30 rounded w-20 animate-pulse"></div>
            ) : (
              <p className="text-3xl font-extrabold">{value}</p>
            )}
            {trend && trendPercentage && !loading && (
              <span
                className={`flex items-center text-sm font-semibold ${trendColor}`}
              >
                {TrendIcon && <TrendIcon className="h-4 w-4 mr-1" />}
                {trendPercentage}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardActionCard;
