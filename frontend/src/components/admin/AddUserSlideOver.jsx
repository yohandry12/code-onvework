import React, { useState, useRef, useEffect } from "react";
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
    location: { city: "", country: "Cameroun" },
    role: "candidate",
    sector: "",
    company: "",
    specialties: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorTimeoutRef = useRef(null);

  // --- LOGIQUE AUTOCOMPLÉTION VILLE ---
  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

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

  const handleCityInputChange = (e) => {
    const userInput = e.target.value;
    setFormData((prev) => ({
      ...prev,
      locationCity: userInput,
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

  const selectCity = (cityName) => {
    setFormData((prev) => ({
      ...prev,
      locationCity: cityName,
    }));
    setShowSuggestions(false);
  };

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

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

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
    try {
      // Préparation des données
      const payload = { ...formData };

      // Si c'est un formateur, on transforme la string de spécialités en tableau
      if (formData.role === "trainer" && formData.specialties) {
        payload.specialties = formData.specialties
          .split(",")
          .map((s) => s.trim());
      }

      await apiService.users.adminCreate(payload);
      alert("Utilisateur créé avec succès !");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "candidate",
        company: "",
        specialties: "",
      });
      onClose(); // Ferme et rafraîchit la liste (voir ManageUsers.jsx)
    } catch (error) {
      alert(
        "Erreur: " +
          (error.response?.data?.error || "Impossible de créer l'utilisateur")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((f) => ({ ...f, role: "trainer" }))
                        }
                        className={clsx(
                          "w-1/2 p-2 rounded-md font-semibold text-sm transition-all",
                          formData.role === "trainer"
                            ? "bg-white shadow text-blue-700"
                            : "text-gray-600"
                        )}
                      >
                        Formateur
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* --- COLONNE VILLE --- */}
                      <div className="relative" ref={wrapperRef}>
                        <label className="block text-sm font-medium text-gray-700">
                          Ville
                        </label>

                        <div className="relative mt-1">
                          <input
                            type="text"
                            name="city"
                            value={formData.locationCity}
                            onChange={handleCityInputChange}
                            onFocus={() =>
                              formData.locationCity && setShowSuggestions(true)
                            }
                            className="input input-bordered w-full pl-10"
                            placeholder="Ex: Douala..."
                            autoComplete="off"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <MapPinIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>

                        {showSuggestions && citySuggestions.length > 0 && (
                          <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                            {citySuggestions.map((cityName, index) => (
                              <li
                                key={index}
                                onClick={() => selectCity(cityName)}
                                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-gray-700 transition-colors border-b last:border-b-0 border-gray-100 flex items-center"
                              >
                                <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {cityName}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* --- COLONNE PAYS --- */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Pays
                        </label>
                        <input
                          type="text"
                          name="country"
                          value="Cameroun"
                          disabled
                          className="input input-bordered w-full mt-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
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

                    {formData.role === "trainer" && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Spécialités (séparées par des virgules)
                            </label>
                            <input
                              type="text"
                              name="specialties"
                              placeholder="React, Finance, Anglais..."
                              value={formData.specialties}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                          </div>
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
