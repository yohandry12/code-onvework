import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import JobsHeader from "../components/UI/JobsHeader";
import StarRating from "../components/UI/StarRating";
import MissionApprovalModal from "../components/UI/MissionApprovalModal";
import { apiService } from "../services/api";
import {
  Search,
  Check,
  X,
  Star,
  MapPin,
  CheckCircle as CheckCircleLucide,
} from "lucide-react";

import {
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  SparklesIcon,
  DocumentTextIcon,
  LinkIcon,
  ArrowDownTrayIcon as DownloadIcon,
} from "@heroicons/react/24/outline";

// Composant pour la pagination (Inchangé)
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Précédent
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 text-sm font-medium border rounded-md ${
            currentPage === page
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
};

export default function ManageApplications() {
  const { user } = useAuth();

  // États
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // États Pagination
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // États Modales
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(null);
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [recommendationRating, setRecommendationRating] = useState(0);
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    application: null,
  });

  // États Statistiques (Simplifiés pour correspondre à la pagination)
  const [headerStats, setHeaderStats] = useState({
    totalApplications: 0,
  });

  // --- NOUVELLE LOGIQUE DE FETCH ---
  const fetchApplications = useCallback(async (page, search, status) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search, // Le backend gère maintenant la recherche Nom/Profession
        status: status === "all" ? "" : status,
      };

      // APPEL DE LA NOUVELLE ROUTE VIA API.JS
      const response = await apiService.jobs.getMyApplications(params);

      // Adaptation selon si apiService retourne response.data ou response directement
      const data = response.data || response;

      if (data.success) {
        // Le backend renvoie maintenant directement la liste formatée
        setApplications(data.applications);

        // Mise à jour pagination
        setTotalPages(data.pagination?.totalPages || 0);
        setTotalResults(data.pagination?.totalResults || 0);
        setCurrentPage(data.pagination?.currentPage || 1);

        // Mise à jour des stats simples
        setHeaderStats({
          totalApplications: data.pagination?.totalResults || 0,
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des candidatures:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Déclencheur (Debounce sur la recherche)
  useEffect(() => {
    if (user?.role === "client") {
      const handler = setTimeout(() => {
        // Reset à la page 1 si on change de filtre ou de recherche
        // Note: Pour une UX parfaite, il faudrait gérer le reset de currentPage séparément,
        // mais ici on passe currentPage en paramètre
        fetchApplications(currentPage, searchTerm, filterStatus);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [user, currentPage, searchTerm, filterStatus, fetchApplications]);

  // Gestion du changement de page
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // On peut ajouter un scroll to top ici si besoin
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Gestion du changement de filtre (Reset page 1)
  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Important : revenir page 1 quand on filtre
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Important : revenir page 1 quand on cherche
  };

  // --- ACTIONS (Inchangées) ---
  const handleMarkAsCompleted = async (
    jobId,
    candidateId,
    applicationId,
    jobTitle,
    candidateName
  ) => {
    try {
      setApprovalModal({
        isOpen: true,
        application: {
          id: applicationId,
          jobId: jobId,
          jobTitle: jobTitle,
          candidateName: candidateName,
        },
      });
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const handleDecision = async (applicationId, status) => {
    try {
      await apiService.applications.updateStatus(applicationId, status);
      fetchApplications(currentPage, searchTerm, filterStatus);
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  const handleViewProfile = async (application) => {
    setSelectedApplication(application);
    setProfileLoading(true);
    try {
      if (!application.candidate?.id) return;
      const response = await apiService.users.getProfile(
        application.candidate.id
      );
      if (response.success) {
        setSelectedApplication((prev) => ({
          ...prev,
          candidate: response.user,
        }));
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRecommend = async (jobId, employeeId) => {
    try {
      if (
        !recommendationRating ||
        recommendationRating < 1 ||
        recommendationRating > 5
      ) {
        alert("Veuillez sélectionner une note entre 1 et 5 étoiles");
        return;
      }
      await apiService.post(`/jobs/${jobId}/recommend`, {
        employeeId: String(employeeId),
        message: recommendationMessage,
        rating: recommendationRating,
      });
      setRecommendationMessage("");
      setRecommendationRating(0);
      setShowRecommendation(null);
      fetchApplications(currentPage, searchTerm, filterStatus);
      alert("Recommandation envoyée avec succès !");
    } catch (err) {
      console.error("Erreur:", err);
      alert("Une erreur est survenue.");
    }
  };

  const formatLocation = (location) => {
    if (!location || typeof location !== "object") return "Non renseignée";
    const city = location.city?.trim() || "";
    const country = location.country?.trim() || "";
    if (city && country) return `${city}, ${country}`;
    return city || country || "Non renseignée";
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JobsHeader
        // On affiche le nombre total de résultats trouvés
        jobsCount={totalResults}
        stats={{
          totalApplications: headerStats.totalApplications,
          // Les stats 'pending'/'accepted' globales ne sont plus calculées ici
          // On peut mettre '-' ou faire un autre appel API si nécessaire
          pending: applications.filter((a) => a.status === "pending").length, // (Visible sur la page actuelle)
          accepted: applications.filter((a) => a.status === "accepted").length, // (Visible sur la page actuelle)
        }}
      />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button className="py-4 border-b-2 border-blue-600 text-blue-600 font-medium">
              Candidats
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Candidats ({totalResults})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou profession..."
                  value={searchTerm}
                  onChange={handleSearchChange} // Utilisation du handler qui reset la page
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={handleFilterChange} // Utilisation du handler qui reset la page
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">En mission</option>
                <option value="completed">Terminée</option>
                <option value="rejected">Refusée</option>
                <option value="withdrawn">Retirée</option>
                <option value="completed_by_candidate">À valider</option>
                <option value="declined">Offre déclinée</option>
              </select>
            </div>
          </div>
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
            <div className="col-span-3">Candidat</div>
            <div className="col-span-3">Mission Concernée</div>
            <div className="col-span-2">Localisation</div>
            <div className="col-span-2">Profession</div>
            <div className="col-span-2">Statut</div>
          </div>
          <div className="divide-y divide-gray-200">
            {applications.map((app) => {
              const { candidate, job } = app;

              // Sécurisation des données
              const firstName = candidate?.profile?.firstName || "";
              const lastName = candidate?.profile?.lastName || "";
              const fullName = `${firstName} ${lastName}`.trim();

              const isMissionFinished =
                job?.status === "filled" || app.status === "completed";

              return (
                <div
                  key={app.id}
                  className="p-4 md:p-0 md:grid md:grid-cols-12 md:gap-4 md:px-6 md:py-4 hover:bg-gray-50 items-center"
                >
                  {/* COLONNE 1: CANDIDAT */}
                  <div className="md:col-span-3 flex items-center justify-between">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                      Candidat
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                        {firstName.charAt(0) || "U"}
                        {lastName.charAt(0) || ""}
                      </div>
                      <div>
                        <button
                          onClick={() => handleViewProfile(app)}
                          className="font-medium text-gray-900 hover:text-blue-600 text-left"
                        >
                          {fullName || "Anonyme"}
                        </button>
                        <p className="md:hidden text-sm text-gray-600">
                          {candidate?.profile?.profession || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* COLONNE 2: MISSION */}
                  <div className="md:col-span-3 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 flex justify-between items-center">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                      Mission
                    </span>
                    <div className="text-right md:text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {job?.title || "Titre indisponible"}
                      </p>
                      <p className="text-xs text-gray-500">{job?.category}</p>
                    </div>
                  </div>

                  {/* COLONNE 3: LOCALISATION */}
                  <div className="md:col-span-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 flex justify-between items-center">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                      Localisation
                    </span>
                    <span className="text-sm text-gray-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {formatLocation(candidate?.location)}
                    </span>
                  </div>

                  {/* COLONNE 4: PROFESSION */}
                  <div className="md:col-span-2 hidden md:block">
                    <span className="text-sm text-gray-600">
                      {candidate?.profile?.profession || "-"}
                    </span>
                  </div>

                  {/* COLONNE 5: STATUT */}
                  <div className="md:col-span-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 flex justify-between items-center">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                      Statut
                    </span>
                    <div className="md:ml-auto">
                      {/* Affichage des badges de statut */}
                      {isMissionFinished && app.status === "completed" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          TERMINÉE
                        </span>
                      ) : app.status === "completed_by_candidate" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                          À VALIDER
                        </span>
                      ) : app.status === "pending" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          EN ATTENTE
                        </span>
                      ) : app.status === "accepted" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          EN MISSION
                        </span>
                      ) : app.status === "rejected" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          REFUSÉE
                        </span>
                      ) : app.status === "withdrawn" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          RETIRÉE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {app.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div className="md:col-span-12 flex flex-wrap items-center gap-2 mt-4 md:pl-12 pt-4 border-t md:border-t-0">
                    {app.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleDecision(app.id, "accepted")}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          <Check className="w-4 h-4" /> Accepter
                        </button>
                        <button
                          onClick={() => handleDecision(app.id, "rejected")}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          <X className="w-4 h-4" /> Refuser
                        </button>
                      </>
                    )}
                    {app.status === "completed_by_candidate" && (
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-blue-800 font-medium">
                            Le candidat a terminé la mission.
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleMarkAsCompleted(
                              job.id,
                              candidate.id,
                              app.id,
                              job.title,
                              fullName
                            )
                          }
                          className="md:ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                        >
                          <CheckCircleLucide className="w-4 h-4" /> Valider la
                          mission
                        </button>
                      </div>
                    )}
                    {(app.status === "completed" ||
                      app.status === "filled") && (
                      <button
                        onClick={() =>
                          setShowRecommendation({
                            jobId: job.id,
                            employeeId: candidate.id,
                          })
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors shadow-sm"
                      >
                        <Star className="w-4 h-4" /> Laisser un avis
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {applications.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              Aucune candidature trouvée.
            </div>
          )}

          <div className="p-6 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* MODAL COMPLET : PROFIL + CANDIDATURE (Reste identique à votre code d'origine) */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 scale-100 border overflow-hidden">
            {profileLoading || !selectedApplication.candidate ? (
              <div className="h-[70vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {selectedApplication.candidate.profile.firstName?.charAt(
                        0
                      )}
                      {selectedApplication.candidate.profile.lastName?.charAt(
                        0
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedApplication.candidate.profile?.fullName ||
                          `${selectedApplication.candidate.profile?.firstName} ${selectedApplication.candidate.profile?.lastName}`}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-5 gap-8 max-h-[80vh] overflow-y-auto">
                  {/* Colonne de gauche (Profil) */}
                  <div className="md:col-span-2 space-y-6 pr-6 border-r">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      Profil du candidat
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 text-sm">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-500">Email</p>
                          <p className="text-gray-800">
                            {selectedApplication.candidate.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 text-sm">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-500">Téléphone</p>
                          <p className="text-gray-800">
                            {selectedApplication.candidate.profile.phone ||
                              "Non renseigné"}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-800 pt-4">
                        Biographie
                      </h3>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {selectedApplication.candidate.profile.bio ||
                          "Aucune biographie."}
                      </div>
                      <h3 className="font-semibold text-gray-800 pt-4">
                        Compétences
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.candidate.profile.skills?.length >
                        0 ? (
                          selectedApplication.candidate.profile.skills.map(
                            (skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <p className="text-sm text-gray-500">
                            Aucune compétence.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Colonne de droite (Candidature) */}
                  <div className="md:col-span-3 space-y-6">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      Détails de la candidature
                    </h3>
                    <div>
                      <div className="flex items-center text-gray-700 mb-2">
                        <DocumentTextIcon className="h-5 w-5 mr-2" />
                        <h4 className="font-semibold">Lettre de motivation</h4>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border max-h-40 overflow-y-auto">
                        {selectedApplication.coverLetter || "Non fournie."}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center text-gray-700 mb-2">
                        <LinkIcon className="h-5 w-5 mr-2" />
                        <h4 className="font-semibold">Pièces Jointes</h4>
                      </div>
                      <div className="space-y-2">
                        {selectedApplication.attachments?.length > 0 ? (
                          selectedApplication.attachments.map((file, idx) => {
                            const fileUrl = `${
                              import.meta.env.VITE_API_URL ||
                              "http://192.168.1.118:4000"
                            }/uploads/${file.filename}`;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border"
                              >
                                <p
                                  className="text-sm font-medium text-gray-800 truncate"
                                  title={file.originalName}
                                >
                                  {file.originalName}
                                </p>
                                <a
                                  href={fileUrl}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors"
                                >
                                  <DownloadIcon className="h-4 w-4" />{" "}
                                  Télécharger
                                </a>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-gray-500">
                            Aucune pièce jointe.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Recommandation (Reste identique) */}
      {showRecommendation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-blue-600 bg-clip-text text-transparent">
                  Évaluer et recommander
                </h2>
                <button
                  onClick={() => setShowRecommendation(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Votre évaluation
                </label>
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-100">
                  <StarRating
                    rating={recommendationRating}
                    onRatingChange={setRecommendationRating}
                    size={7}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Votre avis
                </label>
                <textarea
                  value={recommendationMessage}
                  onChange={(e) => setRecommendationMessage(e.target.value)}
                  placeholder="Décrivez les qualités..."
                  className="w-full border border-gray-300 rounded-lg p-4 min-h-[150px] resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowRecommendation(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  handleRecommend(
                    showRecommendation.jobId,
                    showRecommendation.employeeId
                  )
                }
                className="px-6 py-2 bg-gradient-to-r from-rose-600 to-blue-600 text-white rounded-lg"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Approbation (Reste identique) */}
      <MissionApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, application: null })}
        applicationId={approvalModal.application?.id}
        jobId={approvalModal.application?.jobId}
        jobTitle={approvalModal.application?.jobTitle}
        candidateName={approvalModal.application?.candidateName}
        onSuccess={() => {
          const app = applications.find(
            (a) => a.id === approvalModal.application?.id
          );
          if (app)
            setShowRecommendation({
              jobId: app.job.id,
              employeeId: app.candidate.id,
            });
          fetchApplications(currentPage, searchTerm, filterStatus);
          setApprovalModal({ isOpen: false, application: null });
        }}
      />
    </div>
  );
}
