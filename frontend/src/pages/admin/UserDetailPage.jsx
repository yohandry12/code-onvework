import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  DocumentTextIcon, // Icône pour les candidatures
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";
import toast from "react-hot-toast";

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [clientJobs, setClientJobs] = useState([]); // Pour les Clients
  const [candidateApps, setCandidateApps] = useState([]); // Pour les Candidats (NOUVEAU)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // 1. Récupérer l'utilisateur
        const userResponse = await apiService.users.adminGetUserById(id);

        if (userResponse.success) {
          const userData = userResponse.user;
          console.log("User Data reçue:", userData);
          setUser(userData);

          // 2. SI CLIENT : Récupérer ses missions créées
          if (userData.role === "client") {
            // On demande explicitement les jobs de ce client via l'API admin
            const jobsResponse = await apiService.jobs.adminGetAll({
              limit: 50, // On peut augmenter la limite ou ajouter une pagination locale
              clientId: id, // On passe l'ID pour filtrer côté serveur
            });

            if (jobsResponse.success) {
              setClientJobs(jobsResponse.jobs);
            }
          }

          // 3. SI CANDIDAT : Récupérer ses candidatures
          if (userData.role === "candidate") {
            const appsResponse = await apiService.applications.adminGetAll({
              limit: 50,
              candidateId: id, // On filtre par l'ID du candidat actuel
            });

            if (appsResponse.success) {
              setCandidateApps(appsResponse.applications);
            }
          }
        } else {
          toast.error("Utilisateur introuvable");
          navigate("/admin/users");
        }
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Utilitaire pour construire l'URL de l'avatar
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
    const baseUrl = apiUrl.replace(/\/api$/, "");
    if (avatarPath.startsWith("http")) return avatarPath;
    const cleanPath = avatarPath.startsWith("/")
      ? avatarPath
      : `/${avatarPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  if (!user) return null;

  const profile = user.profile || {};
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`;
  // Avatar avec fallback
  const avatarSrc = profile.avatar
    ? getAvatarUrl(profile.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        fullName
      )}&background=random&color=fff`;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* HEADER NAVIGATION */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Retour à la liste
        </button>

        {/* ENTÊTE PROFIL */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6">
            {user.profile ? (
              <img
                src={avatarSrc}
                alt={fullName}
                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-sm bg-gray-100"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    fullName
                  )}&background=random&color=fff`;
                }}
              />
            ) : (
              <div
                className={`w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md ${
                  isUploadingAvatar ? "opacity-50" : ""
                }`}
              >
                {formData.profile.firstName?.charAt(0)}
                {formData.profile.lastName?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  user.role === "client"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {user.role}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  user.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    user.isActive ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                {user.isActive ? "Compte Actif" : "Compte Désactivé"}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Inscrit le : {new Date(user.createdAt).toLocaleDateString()}</p>
            <p>
              Dernière connexion :{" "}
              {user.lastLogin
                ? new Date(user.lastLogin).toLocaleDateString()
                : "Jamais"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNE GAUCHE : INFO */}
          <div className="lg:col-span-1 space-y-8">
            {/* Coordonnées */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Coordonnées
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm break-all">{user.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">
                      {profile.location.city}, {profile.location.country}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Détails spécifiques */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                {user.role === "client"
                  ? "Détails Entreprise"
                  : "Profil Candidat"}
              </h3>

              <div className="space-y-3 text-sm">
                {user.role === "client" ? (
                  <>
                    <div>
                      <p className="text-gray-500 mb-1">Nom de l'entreprise</p>
                      <p className="font-medium text-gray-900">
                        {profile.company || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Type</p>
                      <p className="font-medium text-gray-900">
                        {profile.employerType || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Secteur</p>
                      <p className="font-medium text-gray-900">
                        {profile.sector || "Non renseigné"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-gray-500 mb-1">Profession</p>
                      <p className="font-medium text-gray-900">
                        {profile.profession || "Non renseignée"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Compétences</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.skills && profile.skills.length > 0 ? (
                          profile.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">Aucune</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : MISSIONS (CLIENT) ou AUTRES (CANDIDAT) */}
          <div className="lg:col-span-2">
            {/* --- TABLEAU DES MISSIONS (CLIENT) --- */}
            {user.role === "client" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-indigo-600" />
                    Historique des Missions ({clientJobs.length})
                  </h3>
                </div>

                {clientJobs.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    Ce client n'a pas encore publié de mission.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Titre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Budget
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clientJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                {job.title}
                              </div>
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {job.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  job.status === "published"
                                    ? "bg-green-100 text-green-800"
                                    : job.status === "filled"
                                    ? "bg-blue-100 text-blue-800"
                                    : job.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {job.budgetMin} - {job.budgetMax}{" "}
                              {job.budgetCurrency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* --- TABLEAU DES CANDIDATURES (CANDIDAT) --- */}
            {user.role === "candidate" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                    Historique des Candidatures ({candidateApps.length})
                  </h3>
                </div>

                {candidateApps.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    Ce candidat n'a postulé à aucune mission pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Mission
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {candidateApps.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-indigo-600 truncate max-w-[200px]">
                                {app.job?.title || "Mission supprimée"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {app.clientCompany || app.clientName || "Anonyme"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  app.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : app.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : app.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {app.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
