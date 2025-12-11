import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";

import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  PencilIcon,
  BriefcaseIcon,
  SparklesIcon,
  AcademicCapIcon,
  BuildingOfficeIcon as OfficeBuildingIcon,
  TagIcon,
  CameraIcon,
  LinkIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// --- Composants d'aide pour le style (Inchangés) ---
const ProfileCard = ({ title, children, className }) => (
  <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 border-b pb-3 mb-4">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 w-6 h-6 text-gray-500">{icon}</div>
    <div className="ml-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value || "Non renseigné"}</p>
    </div>
  </div>
);

// --- Composants d'aide pour le mode édition (Inchangés) ---
const InputRow = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1">
      <input
        type={type}
        name={name}
        id={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

const TextareaRow = ({ label, name, value, onChange }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1">
      <textarea
        id={name}
        name={name}
        rows={4}
        value={value || ""}
        onChange={onChange}
        className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    </div>
  </div>
);

// --- 1. COMPOSANT PROFIL CANDIDAT ---
const CandidateProfile = ({
  user,
  isEditing,
  formData,
  handleProfileChange,
  handleDiplomaChange,
  addDiplomaField,
  removeDiplomaField,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      <ProfileCard title="À propos de moi">
        {isEditing ? (
          <TextareaRow
            label="Biographie"
            name="bio"
            value={formData.profile.bio}
            onChange={handleProfileChange}
          />
        ) : (
          <p className="text-sm text-gray-600">
            {user.profile.bio || "Aucune biographie n'a été ajoutée."}
          </p>
        )}
      </ProfileCard>
      <ProfileCard title="Compétences">
        {isEditing ? (
          <InputRow
            label="Compétences (séparées par des virgules)"
            name="skills"
            value={
              formData.profile.skills ? formData.profile.skills.join(", ") : ""
            }
            onChange={(e) => {
              const event = {
                target: {
                  name: "skills",
                  value: e.target.value.split(",").map((s) => s.trim()),
                },
              };
              handleProfileChange(event);
            }}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.profile.skills?.length > 0 ? (
              user.profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Aucune compétence ajoutée.
              </p>
            )}
          </div>
        )}
      </ProfileCard>
    </div>

    <div className="space-y-6">
      <ProfileCard title="Contact">
        <InfoRow icon={<EnvelopeIcon />} label="Email" value={user.email} />
        {isEditing ? (
          <InputRow
            label="Téléphone"
            name="phone"
            value={formData.profile.phone}
            onChange={handleProfileChange}
          />
        ) : (
          <InfoRow
            icon={<PhoneIcon />}
            label="Téléphone"
            value={user.profile.phone}
          />
        )}
      </ProfileCard>
      <ProfileCard title="Badges & Diplômes">
        <InfoRow
          icon={<SparklesIcon />}
          label="Badge de Recommandation"
          value={user.profile.recommendationBadge || "Aucun"}
        />
        <div className="border-t border-gray-200 my-4"></div>
        <div className="flex items-center text-gray-700">
          <AcademicCapIcon className="h-5 w-5 mr-2" />
          <h4 className="font-semibold">Diplômes & Certificats</h4>
        </div>
        <div className="mt-2 pl-2">
          {isEditing ? (
            <div className="space-y-4">
              {formData.profile.diplomas.map((diploma, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={diploma.type}
                    onChange={(e) =>
                      handleDiplomaChange(index, "type", e.target.value)
                    }
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                  >
                    <option value="">* Type</option>
                    <option value="CAMES">CAMES</option>
                    <option value="GCE">GCE</option>
                    <option value="HND">HND</option>
                    <option value="Autre">Autre</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeDiplomaField(index)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addDiplomaField}
                className="text-sm text-blue-600 hover:underline"
              >
                + Ajouter un diplôme
              </button>
            </div>
          ) : user.profile.diplomas && user.profile.diplomas.length > 0 ? (
            <ul className="space-y-2">
              {user.profile.diplomas.map((diploma, index) => (
                <li key={index} className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-800">
                    {diploma.type}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Aucun diplôme ajouté.</p>
          )}
        </div>
      </ProfileCard>
    </div>
  </div>
);

// --- 2. COMPOSANT PROFIL CLIENT ---
const ClientProfile = ({
  user,
  isEditing,
  formData,
  handleProfileChange,
  handleEmployerTypeChange,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      <ProfileCard title="À propos">
        {isEditing ? (
          <TextareaRow
            label="Biographie de l'entreprise"
            name="bio"
            value={formData.profile.bio}
            onChange={handleProfileChange}
          />
        ) : (
          <p className="text-sm text-gray-600">
            {user.profile.bio || "Aucune biographie n'a été ajoutée."}
          </p>
        )}
      </ProfileCard>
      <ProfileCard title="Informations sur l'entreprise">
        {isEditing ? (
          <>
            <InputRow
              label="Nom de l'entreprise"
              name="company"
              value={formData.profile.company}
              onChange={handleProfileChange}
            />
            <InputRow
              label="Site Web"
              name="website"
              value={formData.profile.website}
              onChange={handleProfileChange}
            />
            <InputRow
              label="Secteur d'activité"
              name="sector"
              value={formData.profile.sector}
              onChange={handleProfileChange}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type d'employeur
              </label>
              <select
                name="employerType"
                value={formData.profile.employerType}
                onChange={handleEmployerTypeChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option>Entreprise formelle</option>
                <option>Startup</option>
                <option>PME</option>
                <option>Particulier</option>
                <option>Association</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <InfoRow
              icon={<OfficeBuildingIcon />}
              label="Nom de l'entreprise"
              value={user.profile.company}
            />
            <InfoRow
              icon={<BriefcaseIcon />}
              label="Type d'employeur"
              value={user.profile.employerType}
            />
            <InfoRow
              icon={<GlobeAltIcon />}
              label="Site Web"
              value={user.profile.website}
            />
            <InfoRow
              icon={<TagIcon />}
              label="Secteur d'activité "
              value={user.profile.sector}
            />
          </>
        )}
      </ProfileCard>
    </div>
    <div className="space-y-6">
      <ProfileCard title="Contact">
        <InfoRow icon={<EnvelopeIcon />} label="Email" value={user.email} />
        {isEditing ? (
          <InputRow
            label="Téléphone"
            name="phone"
            value={formData.profile.phone}
            onChange={handleProfileChange}
          />
        ) : (
          <InfoRow
            icon={<PhoneIcon />}
            label="Téléphone"
            value={user.profile.phone}
          />
        )}
      </ProfileCard>
    </div>
  </div>
);

// --- 3. NOUVEAU COMPOSANT PROFIL FORMATEUR ---
const TrainerProfile = ({
  user,
  isEditing,
  formData,
  handleProfileChange,
  handleCertificationChange,
  addCertificationField,
  removeCertificationField,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      {/* BIO */}
      <ProfileCard title="Présentation & Pédagogie">
        {isEditing ? (
          <TextareaRow
            label="Votre Bio"
            name="bio"
            value={formData.profile.bio}
            onChange={handleProfileChange}
          />
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {user.profile.bio || "Aucune bio renseignée."}
          </p>
        )}
      </ProfileCard>

      {/* SPÉCIALITÉS */}
      <ProfileCard title="Domaines d'expertise">
        {isEditing ? (
          <InputRow
            label="Spécialités (séparées par des virgules)"
            name="specialties"
            placeholder="Ex: React, Marketing, Finance..."
            value={
              formData.profile.specialties
                ? formData.profile.specialties.join(", ")
                : ""
            }
            onChange={(e) => {
              const event = {
                target: {
                  name: "specialties",
                  value: e.target.value.split(",").map((s) => s.trim()),
                },
              };
              handleProfileChange(event);
            }}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.profile.specialties?.length > 0 ? (
              user.profile.specialties.map((spec, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm bg-emerald-100 text-emerald-800 rounded-full font-medium"
                >
                  {spec}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Aucune spécialité ajoutée.
              </p>
            )}
          </div>
        )}
      </ProfileCard>

      {/* CERTIFICATIONS */}
      <ProfileCard title="Certifications & Diplômes">
        {isEditing ? (
          <div className="space-y-4">
            {formData.profile.certifications.map((cert, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-grow">
                  <label className="block text-xs text-gray-500">
                    Intitulé
                  </label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) =>
                      handleCertificationChange(index, "name", e.target.value)
                    }
                    className="block w-full px-2 py-1 bg-white border border-gray-300 rounded-md sm:text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500">Année</label>
                  <input
                    type="text"
                    value={cert.year}
                    onChange={(e) =>
                      handleCertificationChange(index, "year", e.target.value)
                    }
                    className="block w-full px-2 py-1 bg-white border border-gray-300 rounded-md sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCertificationField(index)}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCertificationField}
              className="text-sm text-emerald-600 hover:underline"
            >
              + Ajouter une certification
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {user.profile.certifications?.length > 0 ? (
              user.profile.certifications.map((cert, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <AcademicCapIcon className="h-5 w-5 text-emerald-500 mr-2" />
                  <span className="font-semibold text-gray-800">
                    {cert.name}
                  </span>
                  {cert.year && (
                    <span className="text-gray-500 ml-2">({cert.year})</span>
                  )}
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Aucune certification ajoutée.
              </p>
            )}
          </ul>
        )}
      </ProfileCard>
    </div>

    <div className="space-y-6">
      <ProfileCard title="Détails Professionnels">
        <InfoRow icon={<EnvelopeIcon />} label="Email" value={user.email} />
        {isEditing ? (
          <>
            <InputRow
              label="Téléphone"
              name="phone"
              value={formData.profile.phone}
              onChange={handleProfileChange}
            />
            <InputRow
              label="Années d'expérience"
              name="yearsExperience"
              type="number"
              value={formData.profile.yearsExperience}
              onChange={handleProfileChange}
            />
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Réseaux & Web
              </h4>
              <InputRow
                label="Site Web"
                name="website"
                value={formData.profile.website}
                onChange={handleProfileChange}
                placeholder="https://..."
              />
              <div className="mt-2"></div>
              <InputRow
                label="Profil LinkedIn"
                name="linkedinProfile"
                value={formData.profile.linkedinProfile}
                onChange={handleProfileChange}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </>
        ) : (
          <>
            <InfoRow
              icon={<PhoneIcon />}
              label="Téléphone"
              value={user.profile.phone}
            />
            <InfoRow
              icon={<ClockIcon />}
              label="Expérience"
              value={
                user.profile.yearsExperience
                  ? `${user.profile.yearsExperience} ans`
                  : null
              }
            />
            <InfoRow
              icon={<GlobeAltIcon />}
              label="Site Web"
              value={user.profile.website}
            />
            <InfoRow
              icon={<LinkIcon />}
              label="LinkedIn"
              value={user.profile.linkedinProfile}
            />
          </>
        )}
      </ProfileCard>
    </div>
  </div>
);

// --- Composant principal de la page ---

const ProfilePage = () => {
  const { user, loading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [feedback, setFeedback] = useState({ error: null, success: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // --- LOGIQUE AUTOCOMPLÉTION VILLE ---
  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // 1. Charger toutes les villes au montage
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await apiService.cities.getAll();
        const cityNames = (response.data || []).map((c) => c.name);
        setAllCities(cityNames);
      } catch (err) {
        console.error("Erreur chargement villes:", err);
      }
    };
    fetchCities();
  }, []);

  // 2. Initialiser formData (Mise à jour pour Formateur)
  useEffect(() => {
    if (user) {
      // SÉCURITÉ : On s'assure que user.profile existe, sinon on prend un objet vide
      const p = user.profile || {};

      setFormData({
        profile: {
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          phone: p.phone || "",
          profession: p.profession || "",
          bio: p.bio || "",
          website: p.website || "",
          // Commun
          location: p.location || { city: "", country: "Cameroun" },
          avatar: p.avatar || "",
          // Candidat
          candidateType: p.candidateType || "freelance",
          skills: p.skills || [],
          diplomas: p.diplomas || [],
          address: p.address || "",
          // Client
          company: p.company || "",
          commercialName: p.commercialName || "",
          sector: p.sector || "",
          employerType: p.employerType || "",
          // Formateur (Nouveaux champs)
          yearsExperience: p.yearsExperience || "",
          specialties: p.specialties || [],
          certifications: p.certifications || [],
          linkedinProfile: p.linkedinProfile || "",
        },
      });
    }
  }, [user]);

  // 3. Gestionnaire de changement de l'input ville
  const handleCityChange = (e) => {
    const userInput = e.target.value;
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        location: { ...prev.profile.location, city: userInput },
      },
    }));

    if (userInput.length > 0) {
      const filtered = allCities.filter((city) =>
        city.toLowerCase().includes(userInput.toLowerCase())
      );
      setCitySuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 4. Sélection d'une ville
  const selectCity = (cityName) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        location: { ...prev.profile.location, city: cityName },
      },
    }));
    setShowSuggestions(false);
  };

  // 5. Fermer la liste si clic dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Nettoyage feedback
  useEffect(() => {
    if (feedback.success || feedback.error) {
      const timer = setTimeout(() => {
        setFeedback({ success: null, error: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // --- GESTION AVATAR ---
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({
        error: "Le fichier doit être une image (jpg, png, etc.)",
        success: null,
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        error: "L'image est trop volumineuse (max 5Mo).",
        success: null,
      });
      return;
    }

    setIsUploadingAvatar(true);
    setFeedback({ error: null, success: null });

    try {
      const response = await apiService.auth.updateAvatar(file);
      if (response.success) {
        setFeedback({ success: "Photo de profil mise à jour !", error: null });
        setFormData((prev) => ({
          ...prev,
          profile: { ...prev.profile, avatar: response.avatar },
        }));
        await refreshUser();
      }
    } catch (err) {
      setFeedback({
        error:
          err.response?.data?.error ||
          "Erreur lors du téléchargement de l'image.",
        success: null,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // --- Fonctions Candidat ---
  const handleDiplomaChange = (index, field, value) => {
    const updatedDiplomas = [...formData.profile.diplomas];
    updatedDiplomas[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, diplomas: updatedDiplomas },
    }));
  };

  const addDiplomaField = () => {
    const newDiploma = { type: "", scan: null };
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        diplomas: [...prev.profile.diplomas, newDiploma],
      },
    }));
  };

  const removeDiplomaField = (index) => {
    const updatedDiplomas = formData.profile.diplomas.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, diplomas: updatedDiplomas },
    }));
  };

  // --- Fonctions Formateur (Certifications) ---
  const handleCertificationChange = (index, field, value) => {
    const updatedCerts = [...formData.profile.certifications];
    updatedCerts[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, certifications: updatedCerts },
    }));
  };

  const addCertificationField = () => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        certifications: [
          ...prev.profile.certifications,
          { name: "", year: "" },
        ],
      },
    }));
  };

  const removeCertificationField = (index) => {
    const updatedCerts = formData.profile.certifications.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, certifications: updatedCerts },
    }));
  };

  // --- Communs ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, [name]: value },
    }));
  };

  const handleEmployerTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      profile: { ...prev.profile, employerType: e.target.value },
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setFeedback({ error: null, success: null });
    setIsSaving(true);

    try {
      const locationData = {
        city: formData.profile.location?.city || "",
        country: "Cameroun",
      };

      const updates = {
        profile: {
          ...formData.profile,
          location: locationData,
          // Nettoyage des tableaux vides si nécessaire
          diplomas: formData.profile.diplomas.filter((d) => d.type),
          certifications: formData.profile.certifications.filter((c) => c.name),
        },
      };
      await apiService.auth.updateProfile(updates);
      await refreshUser();
      setFeedback({ success: "Profil mis à jour avec succès !", error: null });
      setIsEditing(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Une erreur est survenue lors de la mise à jour.";
      setFeedback({ error: errorMessage, success: null });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        profile: {
          ...user.profile,
          location: user.profile.location || { city: "", country: "Cameroun" },
        },
      });
    }
  };

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

  if (loading || !formData) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="text-center py-10">
        <p>Utilisateur non trouvé.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
      <form onSubmit={handleSaveChanges}>
        {/* --- En-tête du profil --- */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* --- ZONE AVATAR --- */}
            <div className="relative group cursor-pointer">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isSaving || isUploadingAvatar}
              />

              <label
                htmlFor="avatar-upload"
                className="cursor-pointer block relative"
              >
                {formData.profile.avatar ? (
                  <img
                    src={getAvatarUrl(formData.profile.avatar)}
                    alt="Profil"
                    className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ${
                      isUploadingAvatar ? "opacity-50" : ""
                    }`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
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

                <div
                  className={`absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-opacity duration-200 ${
                    isUploadingAvatar
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isUploadingAvatar ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <CameraIcon className="w-8 h-8 text-white" />
                  )}
                </div>
              </label>
            </div>

            <div className="flex-grow text-center sm:text-left">
              {isEditing ? (
                <div className="flex gap-4">
                  <InputRow
                    label="Prénom"
                    name="firstName"
                    value={formData.profile.firstName}
                    onChange={handleProfileChange}
                  />
                  <InputRow
                    label="Nom"
                    name="lastName"
                    value={formData.profile.lastName}
                    onChange={handleProfileChange}
                  />
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.profile.firstName} {user.profile.lastName}
                </h1>
              )}
              {user.role === "candidate" && (
                <>
                  {isEditing ? (
                    <div className="mt-2">
                      <InputRow
                        label="Profession"
                        name="profession"
                        value={formData.profile.profession}
                        onChange={handleProfileChange}
                      />
                    </div>
                  ) : (
                    <p className="text-md text-indigo-600 font-semibold mt-1">
                      {user.profile.profession || "Profession non renseignée"}
                    </p>
                  )}
                  <div className="mb-4">
                    {isEditing ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Statut
                        </label>
                        <div className="relative">
                          <select
                            name="candidateType"
                            value={formData.profile.candidateType}
                            onChange={handleProfileChange}
                            className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-white/80 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-all"
                          >
                            <option value="freelance">Freelance</option>
                            <option value="student">Étudiant</option>
                            <option value="unemployed">Sans emploi</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {formData.profile.candidateType === "unemployed"
                          ? "Sans emploi"
                          : formData.profile.candidateType}
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-2">
                      <InputRow
                        label="Adresse"
                        name="address"
                        value={formData.profile.address}
                        onChange={handleProfileChange}
                        placeholder="Ex: Rue Jamot, Akwa"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      {user.profile.address || "Adresse non renseignée"}
                    </p>
                  )}
                </>
              )}
              <p className="text-sm text-gray-500 capitalize">{user.role}</p>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 w-full">
                  <div className="relative" ref={wrapperRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="city"
                        value={formData.profile.location?.city || ""}
                        onChange={handleCityChange}
                        onFocus={() =>
                          formData.profile.location?.city &&
                          setShowSuggestions(true)
                        }
                        className="block w-full pl-10 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Ex: Douala, Yaoundé..."
                        autoComplete="off"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {showSuggestions && citySuggestions.length > 0 && (
                      <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                        {citySuggestions.map((cityName, index) => (
                          <li
                            key={index}
                            onClick={() => selectCity(cityName)}
                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-700 transition-colors border-b last:border-b-0 border-gray-100 flex items-center text-sm"
                          >
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {cityName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pays
                    </label>
                    <input
                      type="text"
                      name="country"
                      value="Cameroun"
                      disabled
                      className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500 cursor-not-allowed sm:text-sm"
                    />
                  </div>
                </div>
              ) : (
                (user.profile.location || user.profile.city) && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center justify-center sm:justify-start">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {user.profile.location?.city ||
                      user.profile.city ||
                      "Ville N/A"}
                    , {user.profile.location?.country || "Cameroun"}
                  </p>
                )
              )}
            </div>
            {isEditing ? (
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow disabled:opacity-50"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition mt-4 sm:mt-0"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Modifier
              </button>
            )}
          </div>
        </div>

        {/* --- Messages de feedback --- */}
        {feedback.success && (
          <div
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded"
            role="alert"
          >
            <p>{feedback.success}</p>
          </div>
        )}
        {feedback.error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
            role="alert"
          >
            <p>{feedback.error}</p>
          </div>
        )}

        {/* --- Contenu spécifique au rôle --- */}
        {user.role === "candidate" && (
          <CandidateProfile
            user={user}
            isEditing={isEditing}
            formData={formData}
            handleProfileChange={handleProfileChange}
            handleDiplomaChange={handleDiplomaChange}
            addDiplomaField={addDiplomaField}
            removeDiplomaField={removeDiplomaField}
          />
        )}
        {user.role === "client" && (
          <ClientProfile
            user={user}
            isEditing={isEditing}
            formData={formData}
            handleProfileChange={handleProfileChange}
            handleEmployerTypeChange={handleEmployerTypeChange}
          />
        )}
        {user.role === "trainer" && (
          <TrainerProfile
            user={user}
            isEditing={isEditing}
            formData={formData}
            handleProfileChange={handleProfileChange}
            handleCertificationChange={handleCertificationChange}
            addCertificationField={addCertificationField}
            removeCertificationField={removeCertificationField}
          />
        )}
      </form>
    </div>
  );
};

export default ProfilePage;
