import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Ajustez le chemin selon votre structure
import { apiService } from "../services/api"; // Ajustez le chemin
import {
  Briefcase,
  Award,
  Globe,
  Linkedin,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";

const TrainerOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bio: "",
    yearsExperience: "",
    specialties: [], // Tableau de strings
    certifications: [], // Tableau d'objets { name, year }
    website: "",
    linkedinProfile: "",
  });

  // États temporaires pour les ajouts dynamiques
  const [currentSpecialty, setCurrentSpecialty] = useState("");
  const [currentCert, setCurrentCert] = useState({ name: "", year: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- GESTION DES CHAMPS SIMPLES ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- GESTION DES SPÉCIALITÉS (TAGS) ---
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

  // --- GESTION DES CERTIFICATIONS ---
  const addCertification = () => {
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
      // Préparation du payload pour correspondre à TrainerProfile
      const payload = {
        profile: {
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
        // Mettre à jour le contexte utilisateur localement
        // updateUser est une fonction hypothétique de votre AuthContext pour rafraichir les données
        // Si elle n'existe pas, un rechargement de page ou une nouvelle requête /me fera l'affaire
        if (updateUser) updateUser(response.user);

        navigate("/dashboard");
      } else {
        setError("Erreur lors de la mise à jour.");
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Complétez votre profil Formateur
          </h1>
          <p className="mt-2 text-gray-600">
            Aidez vos futurs apprenants à mieux vous connaître et à vous faire
            confiance.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 bg-white p-8 shadow-xl rounded-2xl"
        >
          {/* --- SECTION 1: BIO & EXPÉRIENCE --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <Briefcase className="text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Parcours professionnel
              </h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre Bio (Présentation)
              </label>
              <textarea
                name="bio"
                rows="4"
                className="input input-bordered w-full h-32 py-2"
                placeholder="Décrivez votre parcours, votre pédagogie et ce qui vous passionne..."
                value={formData.bio}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Années d'expérience
              </label>
              <input
                type="number"
                name="yearsExperience"
                min="0"
                className="input input-bordered w-full md:w-1/3"
                placeholder="Ex: 5"
                value={formData.yearsExperience}
                onChange={handleChange}
                required
              />
            </div>
          </section>

          {/* --- SECTION 2: EXPERTISE (TAGS) --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4 mt-8">
              <CheckCircle className="text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Vos Spécialités
              </h2>
            </div>

            <p className="text-sm text-gray-500">
              Ajoutez les compétences clés que vous enseignez (Ex: React,
              Marketing, Comptabilité...)
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-grow"
                placeholder="Ajouter une compétence puis Entrée"
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

            <div className="flex flex-wrap gap-2 mt-3">
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

          {/* --- SECTION 3: CERTIFICATIONS --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4 mt-8">
              <Award className="text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Certifications & Diplômes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end bg-gray-50 p-4 rounded-lg">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500">Intitulé</label>
                <input
                  type="text"
                  className="input input-bordered w-full input-sm"
                  placeholder="Ex: Certifié Google Cloud Architect"
                  value={currentCert.name}
                  onChange={(e) =>
                    setCurrentCert({ ...currentCert, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Année (Optionnel)
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
                className="btn btn-sm btn-outline btn-success md:col-span-3 mt-2"
                disabled={!currentCert.name}
              >
                Ajouter cette certification
              </button>
            </div>

            <ul className="space-y-2 mt-2">
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
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* --- SECTION 4: LIENS --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2 mb-4 mt-8">
              <Globe className="text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Présence en ligne
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Linkedin size={16} className="text-blue-600" /> Profil
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedinProfile"
                  className="input input-bordered w-full"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedinProfile}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Globe size={16} className="text-gray-600" /> Site Web /
                  Portfolio
                </label>
                <input
                  type="url"
                  name="website"
                  className="input input-bordered w-full"
                  placeholder="https://mon-site.com"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* --- MESSAGES ERREUR --- */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          {/* --- BOUTON SUBMIT --- */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white border-none text-lg py-3 h-auto"
            >
              {loading ? "Enregistrement..." : "Terminer mon profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerOnboarding;
