import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/api";
import ApplicationForm from "./ApplicationForm"; // Assurez-vous que les chemins sont corrects
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import ReportModal from "../components/UI/ReportModal";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeApply, setActiveApply] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    apiService.jobs
      .getById(id)
      .then((response) => {
        if (mounted) {
          if (response.success && response.job) {
            console.log("Job data reçue:", response.job); // Log pour déboguer
            setJob(response.job);
          } else {
            throw new Error("La mission n'a pas pu être trouvée.");
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Erreur get job:", err);
          setError("Impossible de charger les détails de la mission.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleApplyClose = () => setActiveApply(false);
  const handleSubmitted = () => {
    alert("Candidature envoyée avec succès !");
    setActiveApply(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <p>Chargement des détails de la mission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-red-600">
        <p>Erreur: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-lg bg-gray-200"
        >
          Retour
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-500">
        <p>Cette offre d'emploi n'a pas été trouvée.</p>
      </div>
    );
  }

  // --- Données préparées après le chargement ---
  const isCompleted = job.status === "filled";
  const isRepublished = !!job.clonedFromId;
  const isFrozen = job.isFrozen;
  const isInProgress = job.status === "in_progress";
  const clientName =
    job.client?.company ||
    `${job.client?.firstName || ""} ${job.client?.lastName || ""}`.trim() ||
    "Client Anonyme";

  // La déstructuration est maintenant sûre
  const {
    title,
    description,
    company,
    location,
    salary,
    type,
    createdAt,
    tags,
    skills,
    applications,
    contact,
    duration,
    durationValue,
    durationUnit,
    experience,
    education,
  } = job;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm hover:bg-gray-50"
          >
            ← Retour
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            title="Partager"
            className="px-3 py-2 rounded-md border border-gray-200 bg-white text-sm hover:bg-gray-50"
          >
            Partager
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-2 rounded-md border border-red-200 bg-white text-sm text-red-600 hover:bg-red-50"
          >
            Signaler
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Colonne Principale */}
            <div className="md:flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1
                  className={`text-2xl md:text-3xl font-bold ${
                    isCompleted ? "text-gray-500" : "text-gray-800"
                  }`}
                >
                  {title}
                </h1>

                {/* --- AJOUTER LES BADGES ICI --- */}
                {isRepublished && (
                  <span className="flex items-center bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                    <ArrowPathIcon className="w-4 h-4 mr-1" />
                    Republiée
                  </span>
                )}
                {isCompleted && (
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    Terminée
                  </span>
                )}

                {isFrozen && (
                  <span className="flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    Signalé
                  </span>
                )}
              </div>

              {isInProgress && (
                <span className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  En cours
                </span>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 flex-wrap">
                {clientName && (
                  <span className="px-2 py-1 bg-gray-50 border rounded">
                    {clientName}
                  </span>
                )}
                {type && (
                  <span className="px-2 py-1 bg-gray-50 border rounded capitalize">
                    {type}
                  </span>
                )}
                {createdAt && (
                  <span className="px-2 py-1 bg-gray-50 border rounded">
                    Publiée le : {formatDate(createdAt)}
                  </span>
                )}
                {applications && (
                  <span className="px-2 py-1 bg-gray-50 border rounded">
                    {applications.length} candidatures
                  </span>
                )}
                {durationUnit && (
                  <span className="px-2 py-1 bg-gray-50 border rounded capitalize">
                    Durée:{" "}
                    {durationUnit === "projet"
                      ? "Projet"
                      : `${durationValue} ${durationUnit}`}
                  </span>
                )}
              </div>

              <div className="prose prose-slate max-w-none text-gray-700 mb-6 whitespace-pre-line">
                {description}
              </div>

              {/* --- Requirements --- */}
              {skills && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Exigences
                  </h3>
                  {Array.isArray(skills) && skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 border rounded bg-gray-50">
                      <div className="text-xs text-gray-500">Expérience</div>
                      <div className="mt-1 font-medium text-gray-700 capitalize">
                        {experience || "Non spécifiée"}
                      </div>
                    </div>
                    <div className="p-3 border rounded bg-gray-50">
                      <div className="text-xs text-gray-500">
                        Niveau d'études
                      </div>
                      <div className="mt-1 font-medium text-gray-700 capitalize">
                        {education || "Non spécifié"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- Tags --- */}
              {Array.isArray(tags) && tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                    Mots-clés
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne Latérale */}
            <aside className="w-full md:w-72 flex-shrink-0">
              <div className="border rounded-lg p-5 sticky top-24 bg-slate-50">
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Lieu</div>
                  <div className="mt-1 font-semibold text-gray-800 capitalize">
                    {job.locationType || "Non spécifié"}
                  </div>
                  {(job.locationCity || job.locationCountry) && (
                    <p className="text-xs text-gray-500">{`${
                      job.locationCity || ""
                    }${job.locationCity && job.locationCountry ? ", " : ""}${
                      job.locationCountry || ""
                    }`}</p>
                  )}
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500">Budget Proposé</div>
                  <div className="mt-1 text-lg font-bold text-indigo-600">{`${job.budgetMin} - ${job.budgetMax} ${job.budgetCurrency}`}</div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setActiveApply(true)}
                    disabled={isCompleted || isFrozen || isInProgress}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700"
                  >
                    {isCompleted
                      ? "Mission terminée"
                      : isFrozen
                      ? "Suspendu"
                      : isInProgress
                      ? "En cours"
                      : "Postuler"}
                  </button>
                  {job.client && (
                    <Link
                      to={`/clients/${job.client.id}`} // On crée un lien dynamique vers le profil du client
                      className="w-full text-center px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100"
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
