import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ClockIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

// Petit composant pour afficher une information
const InfoPill = ({ Icon, label, value }) => (
  <div className="flex items-start text-sm">
    <Icon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
    <div>
      <span className="font-semibold text-gray-800">{label}</span>
      <p className="text-gray-600">{value || "Non spécifié"}</p>
    </div>
  </div>
);

const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.users.adminGetUserById(id);
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateur:", error);
      // Gérer le cas où l'utilisateur n'est pas trouvé
      if (error.response?.status === 404) {
        navigate("/404");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) return <div className="p-10 text-center">Chargement...</div>;
  if (!user)
    return <div className="p-10 text-center">Utilisateur non trouvé.</div>;

  const { email, role, isActive, createdAt, lastLogin, profile } = user;

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Bouton de retour */}
      <Link
        to="/admin/users"
        className="inline-flex items-center mb-6 text-sm font-medium text-gray-600 hover:text-blue-600"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-2" />
        Retour à la liste des utilisateurs
      </Link>

      {/* En-tête avec nom et statut */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {profile?.firstName} {profile?.lastName}
        </h1>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${
            isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche : Infos générales */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">
            Informations Générales
          </h2>
          <InfoPill Icon={EnvelopeIcon} label="Email" value={email} />
          <InfoPill Icon={UserCircleIcon} label="Rôle" value={role} />
          <InfoPill
            Icon={CalendarDaysIcon}
            label="Inscrit le"
            value={new Date(createdAt).toLocaleDateString()}
          />
          <InfoPill
            Icon={ClockIcon}
            label="Dernière connexion"
            value={lastLogin ? new Date(lastLogin).toLocaleString() : "Jamais"}
          />
        </div>

        {/* Colonne de droite : Détails du profil */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md space-y-6">
          <h2 className="text-lg font-semibold border-b pb-2">
            Détails du Profil
          </h2>
          {role === "candidate" && (
            <>
              <InfoPill
                Icon={BriefcaseIcon}
                label="Profession"
                value={profile.profession}
              />
              <InfoPill
                Icon={MapPinIcon}
                label="Localisation"
                value={`${profile.location?.city}, ${profile.location?.country}`}
              />
            </>
          )}
          {role === "client" && (
            <>
              <InfoPill
                Icon={BuildingOfficeIcon}
                label="Entreprise"
                value={profile.company}
              />
              <InfoPill Icon={TagIcon} label="Secteur" value={profile.sector} />
              <InfoPill
                Icon={MapPinIcon}
                label="Localisation"
                value={`${profile.location?.city}, ${profile.location?.country}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;
