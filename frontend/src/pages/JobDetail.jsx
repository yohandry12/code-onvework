import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { apiService } from "../services/api";
import ApplicationForm from "./ApplicationForm";
import {
  ArrowPathIcon,
  XCircleIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { Flame, Star } from "lucide-react"; // Pour les icônes Urgent/Premium
import ReportModal from "../components/UI/ReportModal";
import { useAuth } from "../contexts/AuthContext";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const locations = useLocation();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeApply, setActiveApply] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // --- NOUVEAU STATE : Candidature de l'utilisateur ---
  const [userApplication, setUserApplication] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    // 1. Charger le Job
    const loadData = async () => {
      try {
        const jobResponse = await apiService.jobs.getById(id);

        if (mounted) {
          if (jobResponse.success && jobResponse.job) {
            setJob(jobResponse.job);
          } else {
            throw new Error("La mission n'a pas pu être trouvée.");
          }
        }

        // 2. Si Candidat connecté : Vérifier s'il a déjà postulé
        if (user && user.role === "candidate") {
          const appResponse = await apiService.applications.getByUser();
          if (appResponse.success && Array.isArray(appResponse.data)) {
            // On cherche une candidature correspondant à l'ID de ce job
            const foundApp = appResponse.data.find(
              (app) =>
                app.jobId.toString() === id.toString() ||
                (app.job && app.job.id.toString() === id.toString())
            );
            if (mounted) setUserApplication(foundApp);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Erreur:", err);
          setError("Impossible de charger les détails.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [id, user]);

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleApplyClick = () => {
    if (!user) {
      navigate("/login", { state: { from: locations } });
      return;
    }
    setActiveApply(true);
  };

  const handleApplyClose = () => setActiveApply(false);

  const handleSubmitted = () => {
    alert("Candidature envoyée avec succès !");
    setActiveApply(false);
    // Optionnel : On pourrait recharger la page pour mettre à jour le statut du bouton immédiatement
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-red-600">
        <p>{error || "Offre introuvable"}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-lg bg-gray-200"
        >
          Retour
        </button>
      </div>
    );
  }

  // --- Données ---
  const isCompleted = job.status === "filled";
  const isRepublished = !!job.clonedFromId;
  const isFrozen = job.isFrozen;
  const isInProgress = job.status === "in_progress";
  const clientName =
    job.client?.company ||
    `${job.client?.firstName || ""} ${job.client?.lastName || ""}`.trim() ||
    "Client Anonyme";

  // --- LOGIQUE BOUTON (Identique à JobCard) ---
  const getButtonConfig = () => {
    // 1. Statuts globaux
    if (isCompleted)
      return {
        text: "Mission terminée",
        style: "bg-gray-200 text-gray-500 cursor-not-allowed",
        disabled: true,
      };
    if (isFrozen)
      return {
        text: "Suspendu",
        style: "bg-gray-200 text-gray-500 cursor-not-allowed",
        disabled: true,
      };

    // 2. Statuts personnels
    if (userApplication) {
      const status = userApplication.status;
      if (status === "rejected" || status === "declined") {
        return {
          text: "Candidature rejetée",
          style:
            "bg-red-100 text-red-600 border border-red-200 cursor-not-allowed",
          icon: <XCircleIcon className="w-5 h-5 mr-2" />,
          disabled: true,
        };
      }
      if (status === "accepted") {
        return {
          text: "Vous avez été retenu !",
          style: "bg-green-600 text-white cursor-not-allowed",
          icon: <CheckCircleIcon className="w-5 h-5 mr-2" />,
          disabled: true,
        };
      }
      // Pending, reviewed, proposal...
      return {
        text: "En attente de validation",
        style:
          "bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed",
        icon: <ClockIcon className="w-5 h-5 mr-2" />,
        disabled: true,
      };
    }

    // 3. En cours (mais pas moi)
    if (isInProgress)
      return {
        text: "En cours",
        style: "bg-blue-100 text-blue-600 cursor-not-allowed",
        disabled: true,
      };

    // 4. Défaut (Postuler)
    if (job.isUrgent) {
      return {
        text: "Postuler maintenant",
        style:
          "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-red-200",
        disabled: false,
      };
    }
    return {
      text: "Postuler",
      style: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
      disabled: false,
    };
  };

  const btnConfig = getButtonConfig();

  const {
    title,
    description,
    location,
    experience,
    education,
    skills,
    tags,
    durationValue,
    durationUnit,
    budget,
    budgetCurrency,
  } = job;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Navigation Haut */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm hover:bg-gray-50"
        >
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 rounded-md border border-red-200 bg-white text-sm text-red-600 hover:bg-red-50"
          >
            Signaler
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Colonne Principale */}
            <div className="md:flex-1">
              {/* Titre et Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1
                  className={`text-2xl md:text-3xl font-bold ${
                    isCompleted ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {title}
                </h1>
                {/* Badges */}
                {job.isUrgent && !isCompleted && (
                  <span className="flex items-center bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded animate-pulse">
                    <Flame className="w-3 h-3 mr-1 fill-red-500" /> URGENT
                  </span>
                )}
                {job.featured && !isCompleted && (
                  <span className="flex items-center bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded border border-amber-200">
                    <Star className="w-3 h-3 mr-1 fill-amber-500" /> PREMIUM
                  </span>
                )}
                {isRepublished && (
                  <span className="flex items-center bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                    <ArrowPathIcon className="w-3 h-3 mr-1" /> Republiée
                  </span>
                )}
                {isCompleted && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                    Terminée
                  </span>
                )}
              </div>

              {/* Infos Meta */}
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 flex-wrap">
                <span className="px-2 py-1 bg-gray-50 border rounded">
                  {clientName}
                </span>
                <span className="px-2 py-1 bg-gray-50 border rounded capitalize">
                  {job.type}
                </span>
                <span className="px-2 py-1 bg-gray-50 border rounded">
                  Publiée le : {formatDate(job.createdAt)}
                </span>
                {durationUnit && (
                  <span className="px-2 py-1 bg-gray-50 border rounded capitalize">
                    Durée:{" "}
                    {durationUnit === "projet"
                      ? "Projet"
                      : `${durationValue} ${durationUnit}`}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-slate max-w-none text-gray-700 mb-8 whitespace-pre-line">
                {description}
              </div>

              {/* Compétences */}
              {skills && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Compétences requises
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(skills) &&
                      skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Détails Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
                <div className="p-4 border rounded-xl bg-gray-50/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Expérience
                  </p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {experience || "Non spécifiée"}
                  </p>
                </div>
                <div className="p-4 border rounded-xl bg-gray-50/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Études
                  </p>
                  <p className="font-semibold text-gray-800 capitalize">
                    {education || "Non spécifié"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {tags && Array.isArray(tags) && tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Mots-clés
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne Latérale (Sticky) */}
            <aside className="w-full md:w-80 flex-shrink-0">
              <div className="border border-gray-200 rounded-xl p-6 sticky top-24 bg-white shadow-sm">
                {/* Localisation */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Lieu
                  </p>
                  <p className="font-bold text-gray-900 capitalize text-lg">
                    {job.locationType || "Remote"}
                  </p>
                  {(job.locationCity || job.locationCountry) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {job.locationCity}
                      {job.locationCity && job.locationCountry ? ", " : ""}
                      {job.locationCountry}
                    </p>
                  )}
                </div>

                {/* Budget */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Budget Client
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {parseFloat(budget).toLocaleString("fr-FR")}{" "}
                    <span className="text-sm text-gray-500 font-normal">
                      {budgetCurrency}
                    </span>
                  </p>
                </div>

                {/* BOUTON D'ACTION PRINCIPAL (DYNAMIQUE) */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => !btnConfig.disabled && handleApplyClick()}
                    disabled={btnConfig.disabled}
                    className={`w-full px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center ${btnConfig.style}`}
                  >
                    {btnConfig.icon}
                    {btnConfig.text}
                  </button>

                  {job.client && (
                    <Link
                      to={`/clients/${job.client.id}`}
                      className="w-full text-center px-4 py-3 border border-gray-300 bg-white rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Voir le profil client
                    </Link>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Modales */}
      {activeApply && (
        <ApplicationForm
          jobId={id}
          budget={{
            amount: job.budget,
            currency: job.budgetCurrency,
          }}
          onClose={handleApplyClose}
          onSubmitted={handleSubmitted}
        />
      )}
      {isReportModalOpen && (
        <ReportModal
          contentId={id}
          contentType="job"
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default JobDetail;
