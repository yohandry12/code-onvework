import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const ApplicationStats = ({ applications, activeFilter, onFilterChange }) => {
  // Compter les applications par statut
  const stats = {
    accepted: applications.filter((app) => app.status === "accepted").length,
    pending: applications.filter((app) => app.status === "pending").length,
    rejected: applications.filter(
      (app) => app.status === "rejected" || app.status === "declined"
    ).length,
    other: applications.filter(
      (app) =>
        !["accepted", "pending", "rejected", "declined"].includes(app.status)
    ).length,
  };

  const filters = [
    {
      id: "all",
      label: "Toutes",
      count: applications.length,
      icon: null,
      color: "bg-gray-50",
      activeColor: "bg-gray-100 ring-2 ring-gray-400",
      textColor: "text-gray-700",
    },
    {
      id: "accepted",
      label: "Acceptées",
      count: stats.accepted,
      icon: CheckCircleIcon,
      color: "bg-green-50",
      activeColor: "bg-green-100 ring-2 ring-green-500",
      textColor: "text-green-700",
    },
    {
      id: "pending",
      label: "En attente",
      count: stats.pending,
      icon: ClockIcon,
      color: "bg-amber-50",
      activeColor: "bg-amber-100 ring-2 ring-amber-500",
      textColor: "text-amber-700",
    },
    {
      id: "rejected",
      label: "Refusées",
      count: stats.rejected,
      icon: XCircleIcon,
      color: "bg-red-50",
      activeColor: "bg-red-100 ring-2 ring-red-500",
      textColor: "text-red-700",
    },
    {
      id: "other",
      label: "Historique",
      count: stats.other,
      icon: ExclamationCircleIcon,
      color: "bg-blue-50",
      activeColor: "bg-blue-100 ring-2 ring-blue-500",
      textColor: "text-blue-700",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  return (
    <motion.div
      className="mb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Section titre */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Filtrer par statut
        </h2>
      </div>

      {/* Grille des filtres */}
      <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <motion.button
              key={filter.id}
              variants={itemVariants}
              onClick={() => onFilterChange(filter.id)}
              className={`
                relative p-4 rounded-xl transition-all duration-300 transform
                ${isActive ? filter.activeColor : filter.color}
                hover:shadow-md hover:scale-105 active:scale-95
                border border-transparent
                ${isActive ? "shadow-lg" : "shadow-sm"}
              `}
            >
              {/* Badge en haut à droite */}
              <div className="absolute top-2 right-2">
                <span
                  className={`
                    inline-flex items-center justify-center
                    w-6 h-6 rounded-full text-xs font-bold
                    ${
                      isActive
                        ? "bg-white text-gray-700"
                        : `bg-white bg-opacity-60 ${filter.textColor}`
                    }
                  `}
                >
                  {filter.count}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                {Icon && (
                  <Icon
                    className={`w-6 h-6 ${
                      filter.textColor
                    } transition-transform ${isActive ? "scale-110" : ""}`}
                  />
                )}
                <span
                  className={`
                    text-xs font-semibold
                    ${filter.textColor}
                  `}
                >
                  {filter.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default ApplicationStats;
