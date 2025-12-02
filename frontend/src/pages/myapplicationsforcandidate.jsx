import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "../services/api";
import ApplicationStats from "../components/ApplicationStats";
import ApplicationCard from "../components/ApplicationCard";
import WithdrawConfirmModal from "../components/WithdrawConfirmModal";
import MissionCompletionModal from "../components/UI/MissionCompletionModal";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [withdrawModal, setWithdrawModal] = useState({
    isOpen: false,
    applicationId: null,
    jobTitle: "",
  });
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [completionModal, setCompletionModal] = useState({
    isOpen: false,
    applicationId: null,
    jobTitle: "",
  });

  // Charger les candidatures au montage
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await apiService.applications.getByUser();
        if (response.success && Array.isArray(response.data)) {
          setApplications(response.data);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Erreur fetching applications:", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // --- NOUVEAU : Gérer la réponse à une proposition ---
  const handleProposalResponse = async (applicationId, response) => {
    try {
      // Appel à la route PATCH /:id/respond que nous avons créée côté backend
      // response = 'accept' ou 'decline'
      const res = await apiService.patch(
        `/applications/${applicationId}/respond`,
        {
          response,
        }
      );

      if (res.success) {
        alert(
          response === "accept"
            ? "Mission acceptée ! 🎉"
            : "Proposition déclinée."
        );
        // Rafraîchir la liste
        const updatedApps = await apiService.applications.getByUser();
        setApplications(updatedApps.data || []);
      }
    } catch (err) {
      console.error("Erreur réponse proposition:", err);
      alert("Une erreur est survenue.");
    }
  };

  // Filtrer les candidatures selon le filtre actif
  const getFilteredApplications = () => {
    if (activeFilter === "all") return applications;

    if (activeFilter === "proposal") {
      return applications.filter((app) => app.status === "proposal");
    }

    // --- MODIFICATION START : Logique de filtrage améliorée ---

    // Le filtre "other" correspond généralement au bouton "Historique"
    if (activeFilter === "other") {
      // On inclut ici :
      // - Refusées (rejected)
      // - Retirées (withdrawn)
      // - Terminées par candidat (completed_by_candidate)
      // - Complètement terminées/validées (completed, filled)
      return applications.filter((app) =>
        [
          "rejected",
          "declined",
          "withdrawn",
          "completed_by_candidate",
          "completed",
          "filled",
        ].includes(app.status)
      );
    }

    // Si le filtre est "accepted", on ne veut QUE les missions en cours, pas celles terminées
    if (activeFilter === "accepted") {
      return applications.filter((app) => app.status === "accepted");
    }

    // 2. Filtre "Refusées" (Si vous avez un onglet spécifique pour ça)
    if (activeFilter === "rejected") {
      // On affiche les candidatures rejetées par le client ET les offres déclinées par le candidat
      return applications.filter(
        (app) => app.status === "rejected" || app.status === "declined"
      );
    }

    // Pour "pending" (En attente) et les autres cas simples
    return applications.filter((app) => app.status === activeFilter);

    // --- MODIFICATION END ---
  };

  const filteredApplications = getFilteredApplications();

  // Ouvrir la modal de confirmation
  const handleOpenWithdrawModal = (applicationId, jobTitle) => {
    setWithdrawModal({
      isOpen: true,
      applicationId,
      jobTitle,
    });
  };

  // Confirmer le retrait
  const handleConfirmWithdraw = async (payload) => {
    setIsWithdrawing(true);
    try {
      await apiService.applications.withdraw(
        withdrawModal.applicationId,
        payload
      );

      // Retirer l'application de la liste avec animation
      setApplications((prev) =>
        prev.filter((app) => app.id !== withdrawModal.applicationId)
      );

      // Fermer la modal et montrer succès
      setWithdrawModal({ isOpen: false, applicationId: null, jobTitle: "" });

      // Optionnel : toast/notification
      alert("Candidature retirée avec succès ✓");
    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      alert("Erreur lors du retrait de la candidature.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Page title avec gradient
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50"
    >
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Mes Candidatures
          </h1>
          <p className="text-gray-600 text-lg">
            Suivez l'état de vos candidatures en un coup d'œil
          </p>
        </motion.div>

        {/* Loading state */}
        {loading ? (
          <LoadingSkeleton count={3} />
        ) : applications.length === 0 ? (
          /* Empty state */
          <EmptyState />
        ) : (
          <>
            {/* Stats & Filters */}
            <ApplicationStats
              applications={applications}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Applications Grid */}
            <div>
              {filteredApplications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-600 text-lg">
                    Aucune candidature avec le statut sélectionné
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredApplications.map((app, index) => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        index={index}
                        onWithdraw={() =>
                          handleOpenWithdrawModal(app.id, app.job?.title || "")
                        }
                        onComplete={() =>
                          setCompletionModal({
                            isOpen: true,
                            applicationId: app.id,
                            jobTitle: app.job?.title || "",
                          })
                        }
                        onRespond={handleProposalResponse}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      <WithdrawConfirmModal
        isOpen={withdrawModal.isOpen}
        jobTitle={withdrawModal.jobTitle}
        onConfirm={handleConfirmWithdraw}
        onCancel={() =>
          setWithdrawModal({ isOpen: false, applicationId: null, jobTitle: "" })
        }
      />

      {/* Mission Completion Modal */}
      <MissionCompletionModal
        isOpen={completionModal.isOpen}
        onClose={() =>
          setCompletionModal({
            isOpen: false,
            applicationId: null,
            jobTitle: "",
          })
        }
        applicationId={completionModal.applicationId}
        jobTitle={completionModal.jobTitle}
        onSuccess={() => {
          // Rafraîchir les candidatures
          const fetchApplications = async () => {
            try {
              const response = await apiService.applications.getByUser();
              if (response.success && Array.isArray(response.data)) {
                setApplications(response.data);
              }
            } catch (error) {
              console.error("Erreur lors du rechargement:", error);
            }
          };
          fetchApplications();
          setCompletionModal({
            isOpen: false,
            applicationId: null,
            jobTitle: "",
          });
        }}
      />
    </motion.div>
  );
};

export default MyApplications;
