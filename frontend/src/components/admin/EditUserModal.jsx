import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { XMarkIcon } from "@heroicons/react/24/outline";

const EditUserModal = ({ user, onClose }) => {
  // On initialise le formulaire avec les données de l'utilisateur sélectionné
  const [formData, setFormData] = useState({
    email: user?.email || "",
    role: user?.role || "candidate",
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    company: user?.profile?.company || "",
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
      const payload = {
        email: formData.email,
        role: formData.role,
        profileData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          company: formData.company, // Ce champ ne sera utilisé que si le rôle est 'client'
        },
      };
      await apiService.users.adminUpdate(user.id, payload);
      alert("Profil mis à jour avec succès.");
      onClose(); // Fermer la modale et rafraîchir
    } catch (err) {
      setError(err.response?.data?.error || "La mise à jour a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Modifier l'utilisateur</h2>
            <button type="button" onClick={onClose}>
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label>Rôle</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="candidate">Candidat</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div>
              <label>Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label>Nom</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            {formData.role === "client" && (
              <div>
                <label>Entreprise</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
          </div>
          <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
