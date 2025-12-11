import React, { useState } from "react";
import { apiService } from "../../services/api";
import { XMarkIcon } from "@heroicons/react/24/outline";

const EditUserModal = ({ user, onClose }) => {
  // Helper pour formater les spécialités (Array -> String)
  const formatSpecialties = (specs) => {
    if (Array.isArray(specs)) return specs.join(", ");
    return specs || "";
  };

  const [formData, setFormData] = useState({
    email: user?.email || "",
    role: user?.role || "candidate",
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    company: user?.profile?.company || "",
    // Gestion spécifique formateur
    specialties: formatSpecialties(user?.profile?.specialties),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Préparation du payload
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Ajout des champs spécifiques selon le rôle
      if (formData.role === "client") {
        profileData.company = formData.company;
      } else if (formData.role === "trainer") {
        // Conversion String -> Array pour l'API
        profileData.specialties = formData.specialties
          ? formData.specialties.split(",").map((s) => s.trim())
          : [];
      }

      const payload = {
        email: formData.email,
        role: formData.role,
        profileData: profileData,
      };

      // Appel API (assurez-vous que votre backend gère 'adminUpdate')
      // Si la fonction n'existe pas dans apiService, remplacez par apiService.put(...)
      // Ici je suppose que apiService.users.adminUpdate existe comme dans votre code précédent
      await apiService.users.adminUpdate(user.id, payload); // Vérifiez que cette méthode existe dans api.js

      alert("Profil mis à jour avec succès.");
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "La mise à jour a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">
              Modifier l'utilisateur
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="candidate">Candidat</option>
                <option value="client">Client</option>
                <option value="trainer">Formateur</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Champ conditionnel CLIENT */}
            {formData.role === "client" && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entreprise
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Champ conditionnel FORMATEUR */}
            {formData.role === "trainer" && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialités{" "}
                  <span className="text-xs text-gray-500">
                    (séparées par des virgules)
                  </span>
                </label>
                <input
                  type="text"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleChange}
                  placeholder="Ex: React, Finance, Marketing..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
