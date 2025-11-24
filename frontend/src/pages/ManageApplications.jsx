import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import JobsHeader from "../components/UI/JobsHeader";
import StarRating from "../components/UI/StarRating";
import MissionApprovalModal from "../components/UI/MissionApprovalModal";
import { apiService } from "../services/api";
import {
  Search,
  Filter,
  Check,
  X,
  Star,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  Award,
  ChevronDown,
  ExternalLink,
  User,
  CheckCircle as CheckCircleLucide,
} from "lucide-react";

import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserCircleIcon,
  AcademicCapIcon,
  SparklesIcon,
  DocumentTextIcon, // Ajout pour la lettre de motivation
  CalendarIcon, // Ajout pour la disponibilité
  CurrencyDollarIcon, // Ajout pour le tarif
  LinkIcon,
  ArrowDownTrayIcon as DownloadIcon,
} from "@heroicons/react/24/outline";

// Composant pour la pagination
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
  // --- CORRECTION 1 : Renommer l'état pour plus de clarté ---
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // J'ai renommé `totalApplications` en `totalResults` pour correspondre à la pagination
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Le reste de vos états est parfait
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(null);
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [recommendationRating, setRecommendationRating] = useState(0);
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    application: null,
  });

  // --- NOUVEL ÉTAT POUR LES STATISTIQUES ---
  const [headerStats, setHeaderStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    pending: 0,
    accepted: 0,
  });

  const fetchApplications = useCallback(async (page, search, status) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        status: status === "all" ? "" : status,
      };

      // 1. On appelle bien la bonne API
      const response = await apiService.jobs.getMyJobs(params);

      if (response.success) {
        // 2. On transforme les données : on passe de [job avec [app]] à [app avec job]
        const allApplications = (response.jobs || []).reduce((acc, job) => {
          const appsWithJobInfo = (job.applications || []).map((app) => {
            // Reconstruire l'objet `candidate.profile` que le JSX attend
            if (app.candidate) {
              app.candidate.profile = { ...app.candidate };
            }
            return {
              ...app,
              job: {
                id: job.id,
                title: job.title,
                status: job.status,
                category: job.category,
              },
            };
          });
          return [...acc, ...appsWithJobInfo];
        }, []);

        // 3. On met à jour les états avec les bonnes données
        setApplications(allApplications);
        setTotalPages(response.pagination?.totalPages || 0);
        setTotalResults(response.pagination?.totalResults || 0);

        // 4. On utilise les stats renvoyées par le backend
        setHeaderStats({
          totalJobs: response.pagination?.totalResults || response.jobs.length,
          pending: allApplications.filter((app) => app.status === "pending")
            .length,
          accepted: allApplications.filter((app) => app.status === "accepted")
            .length,
        });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des candidatures:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "client") {
      const handler = setTimeout(() => {
        fetchApplications(currentPage, searchTerm, filterStatus);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [user, currentPage, searchTerm, filterStatus, fetchApplications]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleMarkAsCompleted = async (
    jobId,
    candidateId,
    applicationId,
    jobTitle,
    candidateName
  ) => {
    try {
      // Ouvrir la modal d'approbation au lieu de la recommandation
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

  // Les autres fonctions (handleViewProfile, handleRecommend) restent les mêmes...
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
      // Validation : la note doit être entre 1 et 5
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
      // Vider et fermer la modale
      setRecommendationMessage("");
      setRecommendationRating(0);
      setShowRecommendation(null);
      // Rafraîchir les données avec la bonne fonction
      fetchApplications(currentPage, searchTerm, filterStatus);
      alert("Recommandation envoyée avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'envoi de la recommandation:", err);
      alert("Une erreur est survenue.");
    }
  };

  const formatLocation = (location) => {
    // Si location n'existe pas ou n'est pas un objet, on renvoie le fallback.
    if (!location || typeof location !== "object") {
      return "Non renseignée";
    }
    // On extrait city et country, en gérant le cas où ils seraient absents.
    const city = location.city?.trim() || "";
    const country = location.country?.trim() || "";

    // On construit la chaîne de caractères finale
    if (city && country) {
      return `${city}, ${country}`;
    }
    // S'il n'y a que la ville ou que le pays, on affiche ce qu'on a.
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
        jobsCount={headerStats.totalJobs}
        stats={{
          totalApplications: totalResults,
          pending: headerStats.pending,
          accepted: headerStats.accepted,
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">En mission</option>
                <option value="filled">Terminée</option>
                <option value="rejected">Refusée</option>
                <option value="withdrawn">Retirée</option>
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
            {/* --- CORRECTION 3 : Utiliser une SEULE boucle .map --- */}
            {applications
              .filter((app) => {
                // Masquer les candidatures retirées par défaut (quand filterStatus === "all")
                if (filterStatus === "all" && app.status === "withdrawn") {
                  return false;
                }
                return true;
              })
              .map((app) => {
                const { candidate, job } = app;
                const fullName = `${candidate?.profile?.firstName || ""} ${
                  candidate?.profile?.lastName || ""
                }`.trim();
                const isMissionFinished = job?.status === "filled";

                return (
                  // On enlève le 'grid' ici pour qu'il soit contrôlé par chaque ligne
                  // On ajoute un padding mobile et un reset pour desktop
                  <div
                    key={app.id}
                    className="p-4 md:p-0 md:grid md:grid-cols-12 md:gap-4 md:px-6 md:py-4 hover:bg-gray-50 items-center"
                  >
                    {/* --- COLONNE 1: CANDIDAT --- */}
                    {/* 'md:col-span-3' recrée votre tableau sur desktop */}
                    {/* Les classes sans préfixe s'appliquent sur mobile */}
                    <div className="md:col-span-3 flex items-center justify-between">
                      {/* LABEL POUR MOBILE : affiché seulement en-dessous de 'md' */}
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Candidat
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                          {candidate?.profile?.firstName?.charAt(0) || "U"}
                          {candidate?.profile?.lastName?.charAt(0) || ""}
                        </div>
                        <div>
                          <button
                            onClick={() => handleViewProfile(app)}
                            className="font-medium text-gray-900 hover:text-blue-600 text-left"
                          >
                            {fullName || "Anonyme"}
                          </button>
                          {/* Profession visible sous le nom sur mobile */}
                          <p className="md:hidden text-sm text-gray-600">
                            {candidate?.profile?.profession || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* --- COLONNE 2: MISSION CONCERNÉE --- */}
                    {/* Chaque section est espacée verticalement sur mobile (mt-3) */}
                    <div className="md:col-span-3 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 flex justify-between items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Mission
                      </span>
                      <div className="text-right md:text-left">
                        <p className="text-sm font-medium text-gray-800">
                          {job?.title}
                        </p>
                        <p className="text-xs text-gray-500">{job?.category}</p>
                      </div>
                    </div>

                    {/* --- COLONNE 3: LOCALISATION --- */}
                    <div className="md:col-span-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 flex justify-between items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Localisation
                      </span>
                      <span className="text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {formatLocation(candidate?.location)}
                      </span>
                    </div>

                    {/* --- COLONNE 4: PROFESSION (uniquement visible sur desktop maintenant) --- */}
                    <div className="md:col-span-2 hidden md:block">
                      <span className="text-sm text-gray-600">
                        {candidate?.profile?.profession || "-"}
                      </span>
                    </div>

                    {/* --- COLONNE 5: STATUT --- */}
                    <div className="md:col-span-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 flex justify-between items-center">
                      <span className="md:hidden text-xs font-bold text-gray-500 uppercase">
                        Statut
                      </span>
                      {/* On s'assure que le statut est aligné à droite sur desktop seulement */}
                      <div className="md:ml-auto">
                        {isMissionFinished && app.status === "accepted" ? (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            TERMINÉE
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
                        ) : null}
                      </div>
                    </div>

                    {/* --- LIGNE DES BOUTONS D'ACTION --- */}
                    {/* Le code ici ne change pas, il est déjà parfait pour s'adapter */}
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
                      {app.status === "accepted" && !isMissionFinished && (
                        <>
                          <button
                            onClick={() =>
                              setShowRecommendation({
                                jobId: job.id,
                                employeeId: candidate.id,
                              })
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                          >
                            <Star className="w-4 h-4" /> Recommander
                          </button>
                          <button
                            onClick={() =>
                              handleMarkAsCompleted(
                                job.id,
                                candidate.id,
                                app.id,
                                job.title,
                                `${candidate.profile?.firstName || ""} ${
                                  candidate.profile?.lastName || ""
                                }`.trim() || "Candidat"
                              )
                            }
                            disabled={isMissionFinished}
                            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm font-medium"
                          >
                            <CheckCircleLucide className="w-4 h-4" /> Terminer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>{" "}
          {applications.filter((app) => {
            if (filterStatus === "all" && app.status === "withdrawn") {
              return false;
            }
            return true;
          }).length === 0 &&
            !loading && (
              <div className="text-center py-12 text-gray-500">
                {filterStatus === "all" &&
                applications.some((app) => app.status === "withdrawn")
                  ? "Toutes les candidatures actives sont affichées. Les candidatures retirées sont masquées. Sélectionnez 'Retirée' pour les voir."
                  : "Aucune candidature trouvée."}
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

      {/* MODAL COMPLET : PROFIL + CANDIDATURE */}
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
                        Diplômes
                      </h3>
                      <div className="text-sm text-gray-600 leading-relaxed">
                        {selectedApplication.candidate.profile.diplomas
                          ?.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedApplication.candidate.profile.diplomas.map(
                              (diploma, idx) => (
                                <li key={idx} className="flex items-center">
                                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                  <p className="text-gray-800 font-medium">
                                    {diploma.type ||
                                      "Type de diplôme non spécifié"}
                                  </p>
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Aucun diplôme ajouté.
                          </p>
                        )}
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

                  {/* Colonne de droite (Détails de la candidature) */}
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
                            // On construit l'URL complète vers le fichier sur le backend
                            const fileUrl = `${
                              import.meta.env.VITE_API_URL ||
                              "http://localhost:4000"
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
                                  {file.originalName ||
                                    `Pièce jointe ${idx + 1}`}
                                </p>
                                <a
                                  href={fileUrl}
                                  download // Cet attribut force le téléchargement
                                  target="_blank" // Ouvre dans un nouvel onglet par sécurité
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors"
                                  title={`Télécharger ${file.originalName}`}
                                >
                                  <DownloadIcon className="h-4 w-4" />
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

      {/* Modal Recommendation */}
      {showRecommendation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-blue-600 bg-clip-text text-transparent">
                  Évaluer et recommander
                </h2>
                <button
                  onClick={() => {
                    setShowRecommendation(null);
                    setRecommendationMessage("");
                    setRecommendationRating(0);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Section Notation */}
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

              {/* Section Message */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Votre avis sur le candidat
                </label>
                <textarea
                  value={recommendationMessage}
                  onChange={(e) => setRecommendationMessage(e.target.value)}
                  placeholder="Décrivez les qualités du candidat, ses points forts, son implication..."
                  className="w-full border border-gray-300 rounded-lg p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500">
                  {recommendationMessage.length}/500 caractères
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowRecommendation(null);
                  setRecommendationMessage("");
                  setRecommendationRating(0);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleRecommend(
                    showRecommendation.jobId,
                    showRecommendation.employeeId
                  );
                }}
                disabled={
                  !recommendationMessage.trim() || !recommendationRating
                }
                className="px-6 py-2 bg-gradient-to-r from-rose-600 to-blue-600 text-white rounded-lg hover:from-rose-700 hover:to-blue-700 font-medium disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'approbation de mission */}
      <MissionApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, application: null })}
        applicationId={approvalModal.application?.id}
        jobId={approvalModal.application?.jobId}
        jobTitle={approvalModal.application?.jobTitle}
        candidateName={approvalModal.application?.candidateName}
        onSuccess={() => {
          // Récupérer la candidature pour avoir l'ID du job et du candidat
          const app = applications.find(
            (a) => a.id === approvalModal.application?.id
          );
          if (app) {
            // Ouvrir la modal de recommandation après approbation
            setShowRecommendation({
              jobId: app.job.id,
              employeeId: app.candidate.id,
            });
          }
          fetchApplications(currentPage, searchTerm, filterStatus);
          setApprovalModal({ isOpen: false, application: null });
        }}
      />
    </div>
  );
}
