import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import {
  Briefcase,
  Award,
  Globe,
  Linkedin,
  CheckCircle,
  Plus,
  X,
  User,
  Building2,
  Landmark,
  FileText,
  Users,
} from "lucide-react";
import { CameraIcon } from "@heroicons/react/24/solid";

const TrainerOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // --- ÉTAT DU FORMULAIRE ---
  // On garde une structure unifiée, mais certains champs ne seront utilisés que selon le type
  const [formData, setFormData] = useState({
    trainerType: "individual_pro", // Par défaut
    organizationName: "", // Pour les centres/établissements
    bio: "",
    yearsExperience: "",
    specialties: [],
    certifications: [],
    website: "",
    linkedinProfile: "",
  });

  // États locaux pour les interactions
  const [currentSpecialty, setCurrentSpecialty] = useState("");
  const [currentCert, setCurrentCert] = useState({ name: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // --- GESTIONNAIRES ---

  const handleTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, trainerType: type }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- UPLOAD AVATAR ---
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5Mo).");
      return;
    }

    setIsUploadingAvatar(true);
    setError("");

    try {
      const response = await apiService.auth.updateAvatar(file);
      if (response.success) {
        await updateUser(response.user);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'upload.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // --- GESTION LISTES (Spécialités / Certifs) ---
  const addSpecialty = (e) => {
    e.preventDefault();
    if (
      currentSpecialty.trim() &&
      !formData.specialties.includes(currentSpecialty.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, currentSpecialty.trim()],
      }));
      setCurrentSpecialty("");
    }
  };

  const removeSpecialty = (itemToRemove) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((item) => item !== itemToRemove),
    }));
  };

  const addCertification = (e) => {
    e.preventDefault();
    if (currentCert.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, { ...currentCert }],
      }));
      setCurrentCert({ name: "", year: "" });
    }
  };

  const removeCertification = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation : Nom de l'organisation obligatoire si ce n'est pas un expert individuel
      if (
        formData.trainerType !== "individual_pro" &&
        !formData.organizationName.trim()
      ) {
        throw new Error("Le nom de l'établissement est requis.");
      }

      // Construction du payload sans la location (déjà gérée à l'inscription)
      const payload = {
        profile: {
          trainerType: formData.trainerType,
          // Si individuel, organizationName est null
          organizationName:
            formData.trainerType === "individual_pro"
              ? null
              : formData.organizationName,
          bio: formData.bio,
          yearsExperience: parseInt(formData.yearsExperience) || 0,
          specialties: formData.specialties,
          certifications: formData.certifications,
          website: formData.website,
          linkedinProfile: formData.linkedinProfile,
        },
      };

      const response = await apiService.auth.updateProfile(payload);

      if (response.success) {
        if (updateUser) {
          const me = await apiService.auth.me();
          if (me.success) updateUser(me.user);
        }
        navigate("/dashboard");
      } else {
        setError("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIGURATION DYNAMIQUE DES TEXTES ---
  const isIndividual = formData.trainerType === "individual_pro";
  const isCenter = formData.trainerType === "training_center";
  // const isEstablishment = formData.trainerType === "professional_establishment"; // Implicite si ni l'un ni l'autre

  const labels = {
    avatarTitle: isIndividual ? "Votre Photo" : "Logo de l'établissement",
    bioTitle: isIndividual
      ? "Votre Bio (Présentation)"
      : "Présentation de la structure",
    bioPlaceholder: isIndividual
      ? "Décrivez votre parcours..."
      : "Décrivez votre centre, votre mission et vos valeurs...",
    experienceTitle: isIndividual
      ? "Années d'expérience"
      : "Années d'existence",
    specialtiesTitle: isIndividual
      ? "Vos Spécialités"
      : "Domaines de formation",
    certifTitle: isIndividual ? "Certifications" : "Accréditations / Labels",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Complétez votre profil Formateur
          </h1>
          <p className="mt-2 text-gray-600">
            Personnalisez votre espace pour inspirer confiance à vos futurs
            apprenants.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-6 border border-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-2xl overflow-hidden"
        >
          {/* --- SÉLECTEUR DE PROFIL --- */}
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Vous êtes ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "individual_pro",
                  icon: User,
                  label: "Expert Indépendant",
                  desc: "Freelance, Consultant",
                },
                {
                  id: "training_center",
                  icon: Building2,
                  label: "Centre de Formation",
                  desc: "École, Institut",
                },
                {
                  id: "professional_establishment",
                  icon: Landmark,
                  label: "Établissement Pro",
                  desc: "Entreprise formatrice",
                },
              ].map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all flex flex-col items-center text-center gap-2 ${
                    formData.trainerType === type.id
                      ? "border-emerald-500 bg-white ring-2 ring-emerald-500/10 shadow-sm"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-white"
                  }`}
                >
                  <type.icon
                    size={24}
                    className={
                      formData.trainerType === type.id
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">
                      {type.label}
                    </h3>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* --- SECTION 1 : IDENTITÉ VISUELLE --- */}
            <section className="flex flex-col items-center border-b border-gray-100 pb-8">
              <div className="relative group cursor-pointer mb-3">
                <input
                  type="file"
                  id="avatar-upload-onboarding"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={loading || isUploadingAvatar}
                />
                <label
                  htmlFor="avatar-upload-onboarding"
                  className="cursor-pointer block relative"
                >
                  {user?.profile?.avatar ? (
                    <img
                      src={getAvatarUrl(user.profile.avatar)}
                      alt="Profil"
                      className={`w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-md ${
                        isUploadingAvatar ? "opacity-50" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-32 h-32 bg-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-md ${
                        isUploadingAvatar ? "opacity-50" : ""
                      }`}
                    >
                      {/* Icône différente selon le type */}
                      {!isIndividual ? (
                        <Building2 size={48} />
                      ) : (
                        user?.profile?.firstName?.charAt(0) || "U"
                      )}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <CameraIcon className="w-10 h-10 text-white" />
                    )}
                  </div>
                </label>
              </div>
              <span className="text-sm font-medium text-gray-500">
                {labels.avatarTitle}
              </span>
            </section>

            {/* --- SECTION 2 : INFORMATIONS GÉNÉRALES --- */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                {!isIndividual ? (
                  <Building2 className="text-emerald-600" />
                ) : (
                  <Briefcase className="text-emerald-600" />
                )}
                <h2 className="text-xl font-semibold text-gray-800">
                  {!isIndividual
                    ? "Identité de la structure"
                    : "Parcours professionnel"}
                </h2>
              </div>

              {/* Champ Nom Organisation (Uniquement pour les structures) */}
              <AnimatePresence>
                {!isIndividual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom officiel de la structure{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleChange}
                      placeholder={
                        isCenter
                          ? "Ex: Institut Digital Academy"
                          : "Ex: Tech Solutions SARL"
                      }
                      className="input input-bordered w-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {labels.bioTitle}
                </label>
                <textarea
                  name="bio"
                  rows="4"
                  className="input input-bordered w-full h-32 py-2"
                  placeholder={labels.bioPlaceholder}
                  value={formData.bio}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {labels.experienceTitle}
                </label>
                <input
                  type="number"
                  name="yearsExperience"
                  min="0"
                  placeholder="Ex : 5"
                  value={formData.yearsExperience}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>
            </section>

            {/* --- SECTION 3 : EXPERTISE --- */}
            <section className="space-y-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {labels.specialtiesTitle}
                </h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-grow"
                  placeholder={
                    isIndividual
                      ? "Ajouter une compétence (ex: React)"
                      : "Ajouter un domaine (ex: Marketing Digital)"
                  }
                  value={currentSpecialty}
                  onChange={(e) => setCurrentSpecialty(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSpecialty(e)}
                />
                <button
                  type="button"
                  onClick={addSpecialty}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {formData.specialties.map((spec) => (
                    <motion.span
                      key={spec}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(spec)}
                        className="ml-2 hover:text-emerald-900 focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* --- SECTION 4 : CERTIFICATIONS --- */}
            <section className="space-y-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Award className="text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {labels.certifTitle}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-bold mb-1 block">
                    {isIndividual
                      ? "Intitulé du diplôme/certif"
                      : "Nom de l'accréditation"}
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full input-sm"
                    placeholder={
                      isIndividual
                        ? "Ex: Certifié Google Cloud"
                        : "Ex: Agrément FNE, Qualiopi"
                    }
                    value={currentCert.name}
                    onChange={(e) =>
                      setCurrentCert({ ...currentCert, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold mb-1 block">
                    Année d'obtention
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full input-sm"
                    placeholder="Ex: 2023"
                    value={currentCert.year}
                    onChange={(e) =>
                      setCurrentCert({ ...currentCert, year: e.target.value })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={addCertification}
                  className="btn btn-sm btn-outline btn-success md:col-span-3 mt-2 w-full"
                  disabled={!currentCert.name}
                >
                  <Plus size={16} className="mr-1" /> Ajouter
                </button>
              </div>

              <ul className="space-y-2">
                {formData.certifications.map((cert, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center bg-white border px-4 py-2 rounded-md shadow-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {cert.name}
                      </span>
                      {cert.year && (
                        <span className="text-gray-500 text-sm ml-2">
                          ({cert.year})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* --- SECTION 5 : PRÉSENCE EN LIGNE --- */}
            <section className="space-y-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Présence en ligne
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Linkedin size={16} className="text-blue-600" />
                    {isIndividual
                      ? "Profil LinkedIn"
                      : "Page LinkedIn Entreprise"}
                  </label>
                  <input
                    type="url"
                    name="linkedinProfile"
                    className="input input-bordered w-full"
                    value={formData.linkedinProfile}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Globe size={16} className="text-gray-600" /> Site Web
                  </label>
                  <input
                    type="url"
                    name="website"
                    className="input input-bordered w-full"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://www.monsite.com"
                  />
                </div>
              </div>
            </section>

            {/* --- BOUTON SUBMIT --- */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white border-none text-lg py-3 h-auto shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>{" "}
                    Enregistrement...
                  </>
                ) : (
                  "Terminer mon profil"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerOnboarding;
