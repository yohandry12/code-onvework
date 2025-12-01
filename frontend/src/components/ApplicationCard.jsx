import React, { useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const ApplicationCard = forwardRef(
  ({ application, onWithdraw, onComplete, onRespond, index }, ref) => {
    const { job, status, createdAt } = application;
    const [showMenu, setShowMenu] = useState(false);

    if (!job) return null;

    // ✅ NOUVELLE LOGIQUE : Basée sur les jours calendaires
    const getDateLabel = (createdAt) => {
      const now = new Date();
      const created = new Date(createdAt);

      // Réinitialiser les heures pour comparer uniquement les dates
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const createdDay = new Date(
        created.getFullYear(),
        created.getMonth(),
        created.getDate()
      );

      // Différence en jours calendaires
      const diffTime = today.getTime() - createdDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Si moins de 24h et même jour -> afficher l'heure
      if (diffDays === 0) {
        const hours = created.getHours().toString().padStart(2, "0");
        const minutes = created.getMinutes().toString().padStart(2, "0");
        return `Aujourd'hui à ${hours}:${minutes}`;
      } else if (diffDays === 1) {
        return "Hier";
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
      } else {
        const months = Math.floor(diffDays / 30);
        return `Il y a ${months} mois`;
      }
    };

    const dateLabel = getDateLabel(createdAt);

    // Status info avec couleurs et icônes
    const statusInfo = {
      accepted: {
        text: "Acceptée",
        icon: CheckCircleIcon,
        bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
        badgeColor: "bg-green-100 text-green-700",
        badgeBorder: "border-green-300",
        accent: "text-green-600",
      },
      pending: {
        text: "En attente",
        icon: ClockIcon,
        bgColor: "bg-gradient-to-br from-amber-50 to-yellow-50",
        badgeColor: "bg-amber-100 text-amber-700",
        badgeBorder: "border-amber-300",
        accent: "text-amber-600",
      },
      rejected: {
        text: "Refusée",
        icon: XCircleIcon,
        bgColor: "bg-gradient-to-br from-red-50 to-rose-50",
        badgeColor: "bg-red-100 text-red-700",
        badgeBorder: "border-red-300",
        accent: "text-red-600",
      },
      reviewed: {
        text: "Examinée",
        icon: SparklesIcon,
        bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
        badgeColor: "bg-blue-100 text-blue-700",
        badgeBorder: "border-blue-300",
        accent: "text-blue-600",
      },
      withdrawn: {
        text: "Retirée",
        icon: XCircleIcon,
        bgColor: "bg-gradient-to-br from-gray-50 to-slate-50",
        badgeColor: "bg-gray-100 text-gray-600",
        badgeBorder: "border-gray-300",
        accent: "text-gray-500",
      },
      completed_by_candidate: {
        text: "En attente de confirmation",
        icon: ClockIcon,
        bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
        badgeColor: "bg-blue-100 text-blue-700",
        badgeBorder: "border-blue-300",
        accent: "text-blue-600",
      },
      completed: {
        text: "Terminée",
        icon: CheckCircleIcon,
        bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
        badgeColor: "bg-gray-200 text-gray-700",
        badgeBorder: "border-gray-300",
        accent: "text-gray-600",
      },
      filled: {
        text: "Terminée",
        icon: CheckCircleIcon,
        bgColor: "bg-gradient-to-br from-gray-50 to-gray-100",
        badgeColor: "bg-gray-200 text-gray-700",
        badgeBorder: "border-gray-300",
        accent: "text-gray-600",
      },
      proposal: {
        text: "Proposition reçue",
        icon: SparklesIcon, // Ou une icône cadeau/offre
        bgColor: "bg-gradient-to-br from-purple-50 to-indigo-50", // Une couleur distincte
        badgeColor: "bg-purple-100 text-purple-700",
        badgeBorder: "border-purple-300",
        accent: "text-purple-600",
      },
    };

    const currentStatus = statusInfo[status] || statusInfo.pending;
    const StatusIcon = currentStatus.icon;

    const companyName = job.client?.profile?.company || "Entreprise";
    const budget =
      job.budgetMin && job.budgetMax
        ? `${Math.round(job.budgetMin)}-${Math.round(job.budgetMax)} €`
        : null;

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      },
      exit: {
        opacity: 0,
        x: -100,
        transition: { duration: 0.3 },
      },
    };

    const hoverVariants = {
      hover: {
        y: -4,
        shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
      },
    };

    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover="hover"
        className="relative"
      >
        <motion.div
          variants={hoverVariants}
          className={`
          rounded-xl overflow-hidden shadow-md
          hover:shadow-lg transition-all duration-300
          border border-gray-100
          ${currentStatus.bgColor}
        `}
        >
          {/* Header avec status */}
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{companyName}</p>
              </div>

              {/* Menu action */}
              <div className="relative ml-3">
                {status === "pending" && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
                    </motion.button>

                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10"
                      >
                        <motion.button
                          whileHover={{ backgroundColor: "#fef2f2" }}
                          onClick={() => {
                            onWithdraw();
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 font-semibold flex items-center gap-2 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Retirer
                        </motion.button>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <div
                className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                border ${currentStatus.badgeColor} ${currentStatus.badgeBorder}
              `}
              >
                <StatusIcon className="w-4 h-4" />
                <span>{currentStatus.text}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200/50"></div>

          {/* Infos job */}
          <div className="px-5 py-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 font-semibold">
                  Candidature
                </p>
                <p className="text-sm text-gray-700 font-medium">{dateLabel}</p>
              </div>
            </div>

            {budget && (
              <div className="flex items-center gap-2">
                <CurrencyEuroIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Budget</p>
                  <p className="text-sm text-gray-700 font-medium">{budget}</p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200/50"></div>

          {/* Footer actions */}
          <div className="px-5 py-3 bg-gray-50/50 flex gap-2">
            {status === "accepted" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onComplete?.()}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
              >
                Marquer comme terminée
              </motion.button>
            )}

            {status === "completed_by_candidate" && (
              <button
                disabled
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 bg-gray-200 border border-gray-300 cursor-not-allowed"
              >
                Validation en cours...
              </button>
            )}

            {/* --- NOUVEAU CAS : PROPOSITION REÇUE --- */}
            {status === "proposal" && (
              <div className="flex gap-2 w-full">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onRespond(application.id, "accept")}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                >
                  <CheckCircleIcon className="w-4 h-4" /> Accepter
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onRespond(application.id, "decline")}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                >
                  <XCircleIcon className="w-4 h-4" /> Refuser
                </motion.button>
              </div>
            )}

            {["completed", "filled"].includes(status) && (
              <button
                disabled
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-green-700 bg-green-100 border border-green-200 cursor-not-allowed flex items-center justify-center gap-1"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Mission validée
              </button>
            )}

            {status === "pending" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onWithdraw()}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200"
              >
                Retirer
              </motion.button>
            )}

            <Link to={`/jobs/${job.id}`}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-md hover:from-rose-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <span>Détails</span>
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

ApplicationCard.displayName = "ApplicationCard";

export default ApplicationCard;
