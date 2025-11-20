import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  XMarkIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  KeyIcon,
  MapPinIcon,
  TagIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";
import clsx from "clsx";

const AddUserSlideOver = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profession: "",
    password: "",
    location: { city: "", country: "" },
    role: "candidate",
    sector: "",
    company: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      // Gère les champs imbriqués comme "location.city"
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      // Gère les champs simples
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiService.users.adminCreate(formData);
      alert("Utilisateur ajouté avec succès !");
      onClose(); // Ferme et déclenche le rafraîchissement
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            {/* Fond assombri */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-screen max-w-md"
              >
                <form
                  onSubmit={handleSubmit}
                  className="h-full flex flex-col bg-white shadow-xl"
                >
                  {/* --- En-tête --- */}
                  <div className="p-6 bg-gradient-to-br from-blue-700 to-indigo-800">
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-bold text-white">
                        Ajouter un Nouvel Utilisateur
                      </h2>
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* --- Contenu du Formulaire --- */}
                  <div className="relative flex-1 p-6 space-y-6 overflow-y-auto">
                    {/* Sélecteur de rôle */}
                    <div className="flex rounded-lg bg-gray-100 p-1">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((f) => ({ ...f, role: "candidate" }))
                        }
                        className={clsx(
                          "w-1/2 p-2 rounded-md font-semibold text-sm transition-all",
                          formData.role === "candidate"
                            ? "bg-white shadow text-blue-700"
                            : "text-gray-600"
                        )}
                      >
                        Candidat
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((f) => ({ ...f, role: "client" }))
                        }
                        className={clsx(
                          "w-1/2 p-2 rounded-md font-semibold text-sm transition-all",
                          formData.role === "client"
                            ? "bg-white shadow text-blue-700"
                            : "text-gray-600"
                        )}
                      >
                        Client
                      </button>
                    </div>

                    {/* Champs de profil */}
                    <InputWithIcon
                      Icon={UserCircleIcon}
                      name="firstName"
                      label="Prénom"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                    <InputWithIcon
                      Icon={UserCircleIcon}
                      name="lastName"
                      label="Nom"
                      value={formData.lastName}
                      onChange={handleChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputWithIcon
                        Icon={MapPinIcon}
                        name="location.city" // Important: utilisez la notation "objet.propriété"
                        label="Ville"
                        value={formData.location.city}
                        onChange={handleChange}
                      />
                      <InputWithIcon
                        Icon={MapPinIcon}
                        name="location.country" // Important: utilisez la notation "objet.propriété"
                        label="Pays"
                        value={formData.location.country}
                        onChange={handleChange}
                      />
                    </div>
                    {formData.role === "client" && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <InputWithIcon
                            Icon={BuildingOfficeIcon}
                            name="company"
                            label="Entreprise"
                            value={formData.company}
                            onChange={handleChange}
                          />

                          <InputWithIcon
                            Icon={TagIcon}
                            name="sector"
                            label="Secteur d'activité"
                            value={formData.sector}
                            onChange={handleChange}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {formData.role === "candidate" && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <InputWithIcon
                            Icon={BriefcaseIcon}
                            name="profession"
                            label="Profession"
                            value={formData.profession}
                            onChange={handleChange}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Champs d'authentification */}
                    <div className="border-t pt-6">
                      <InputWithIcon
                        Icon={UserCircleIcon}
                        type="email"
                        name="email"
                        label="Adresse Email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <InputWithIcon
                        Icon={KeyIcon}
                        type="password"
                        name="password"
                        label="Mot de passe temporaire"
                        value={formData.password}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* --- Pied de page --- */}
                  <div className="p-6 border-t bg-gray-50 flex-shrink-0">
                    {error && (
                      <p className="text-red-500 text-sm mb-4 text-center">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      {loading ? "Création en cours..." : "Créer l'utilisateur"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </section>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
const InputWithIcon = ({
  Icon,
  name,
  label,
  type = "text",
  value,
  onChange,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
  </div>
);

export default AddUserSlideOver;
