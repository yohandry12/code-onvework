import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  MapPinIcon as LocationMarkerIcon,
} from "@heroicons/react/24/outline";

const ClientProfilePage = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClientProfile = async () => {
      setLoading(true);
      try {
        // On réutilise l'endpoint existant pour récupérer les profils
        const response = await apiService.users.getProfile(clientId);
        if (response.success && response.user.role === "client") {
          setClient(response.user);
        } else {
          throw new Error("Profil client non trouvé.");
        }
      } catch (err) {
        setError("Impossible de charger le profil de ce client.");
      } finally {
        setLoading(false);
      }
    };
    fetchClientProfile();
  }, [clientId]);

  if (loading)
    return <div className="text-center py-20">Chargement du profil...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!client)
    return <div className="text-center py-20">Ce profil n'existe pas.</div>;

  const profile = client.profile;
  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          {/* En-tête du profil */}
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6">
            <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold">
              {profile.firstName.charAt(0)}
              {profile.lastName.charAt(0)}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.company || fullName}
              </h1>
              {profile.company && (
                <p className="text-md text-gray-600">{fullName}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2 justify-center sm:justify-start">
                <LocationMarkerIcon className="w-4 h-4" />
                <span>
                  {profile.location?.city || "Lieu"},{" "}
                  {profile.location?.country || "non spécifié"}
                </span>
              </div>
            </div>
          </div>

          {/* Contenu du profil */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Colonne Infos */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  À propos de l'entreprise
                </h3>
                <p className="text-gray-600 text-sm">
                  {profile.bio ||
                    "Aucune description n'a été fournie par ce client."}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Détails
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-500">
                      Type :&nbsp;
                    </span>
                    <span className="text-gray-700">
                      {profile.employerType}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-500">
                      Site web :&nbsp;
                    </span>
                    {profile.website ? (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      "Non renseigné"
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Contact
              </h3>
              <div className="flex items-center text-sm">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-700">{client.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-700">
                  {profile.phone || "Non renseigné"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
