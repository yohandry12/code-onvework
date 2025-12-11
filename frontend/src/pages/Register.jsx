import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import CitySelect from "../components/UI/CitySelect";
import {
  User,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { MapPinIcon } from "@heroicons/react/24/solid";

// --- CONFIGURATION DU DESIGN DES RÔLES ---
const roleConfig = {
  candidate: {
    color: "indigo",
    title: "Candidat",
    description: "Je cherche un emploi, des missions freelance ou des stages.",
    Icon: User,
    classes: {
      border: "hover:border-indigo-500",
      iconBg: "bg-indigo-50",
      iconText: "text-indigo-600",
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-700",
    },
  },
  client: {
    color: "blue",
    title: "Recruteur",
    description: "Je cherche des talents pour mon entreprise ou mes projets.",
    Icon: Building2,
    classes: {
      border: "hover:border-blue-500",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
    },
  },
  trainer: {
    color: "emerald",
    title: "Formateur",
    description:
      "Je souhaite proposer mes formations et partager mon expertise.",
    Icon: GraduationCap,
    classes: {
      border: "hover:border-emerald-500",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-600",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
    },
  },
};

// --- COMPOSANT : CARTE DE SÉLECTION DE RÔLE ---
const RoleCard = ({ roleKey, onClick }) => {
  const config = roleConfig[roleKey];
  // Protection si la clé n'existe pas
  if (!config) return null;

  const { Icon, title, description, classes } = config;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(roleKey)}
      className={`
        group cursor-pointer relative flex flex-col items-center text-center h-full
        bg-white p-8 rounded-2xl shadow-md hover:shadow-xl
        border-2 border-transparent ${classes.border}
        transition-all duration-300 ease-out
      `}
    >
      {/* Cercle de l'icône */}
      <div
        className={`
        p-5 rounded-full mb-5 transition-colors duration-300
        ${classes.iconBg} ${classes.iconText}
        group-hover:scale-110 transform duration-300
      `}
      >
        <Icon size={36} strokeWidth={1.5} />
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-black transition-colors">
        {title}
      </h3>

      <p className="text-gray-500 leading-relaxed text-sm mb-6 flex-grow">
        {description}
      </p>

      {/* Bouton simulé */}
      <div
        className={`
        w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
        ${classes.badgeBg} ${classes.badgeText}
        opacity-80 group-hover:opacity-100
      `}
      >
        Choisir ce profil
      </div>
    </motion.div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const Register = () => {
  const [selectedRole, setSelectedRole] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Champs Client
    company: "",
    employerType: "",
    sector: "",
    commercialName: "",
    associationName: "",
    // Champs Communs (Client + Formateur)
    phone: "",
    locationCity: "",
    locationCountry: "Cameroun",
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const topRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

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
    let stateKey = name;
    if (name === "city") stateKey = "locationCity";
    if (name === "country") stateKey = "locationCountry";

    setFormData((prev) => ({ ...prev, [stateKey]: value }));

    if (errors[stateKey]) {
      setErrors((prev) => ({ ...prev, [stateKey]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "Le prénom est requis.";
    if (!formData.lastName.trim()) newErrors.lastName = "Le nom est requis.";
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email est invalide.";
    }
    if (formData.password.length < 8)
      newErrors.password = "Le mot de passe doit faire au moins 8 caractères.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";

    if (selectedRole === "client") {
      if (!formData.employerType)
        newErrors.employerType = "Type d'employeur requis.";
      if (
        formData.employerType === "Entreprise formelle" &&
        !formData.company.trim()
      ) {
        newErrors.company = "Le nom de l'entreprise est requis.";
      }
      if (!formData.phone) newErrors.phone = "Téléphone requis.";
      if (!formData.locationCity) newErrors.city = "Ville requise.";
    }

    if (selectedRole === "trainer") {
      if (!formData.phone) newErrors.phone = "Téléphone requis.";
      if (!formData.locationCity) newErrors.city = "Ville requise.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setErrors({});
      }, 5000);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");

    if (!validateForm()) {
      setApiError("Veuillez corriger les erreurs du formulaire.");
      setTimeout(() => setApiError(""), 5000);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    let payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      role: selectedRole,
    };

    if (selectedRole === "client") {
      payload = {
        ...payload,
        company:
          formData.company ||
          formData.commercialName ||
          formData.associationName,
        employerType: formData.employerType,
        sector: formData.sector,
        phone: formData.phone,
        location: {
          city: formData.locationCity,
          country: formData.locationCountry || "Cameroun",
        },
        commercialName: formData.commercialName || undefined,
        associationName: formData.associationName || undefined,
      };
    } else if (selectedRole === "trainer") {
      payload = {
        ...payload,
        phone: formData.phone,
        location: {
          city: formData.locationCity,
          country: formData.locationCountry || "Cameroun",
        },
      };
    }

    try {
      const response = await apiService.auth.register(payload);
      if (response.success) {
        setSuccessMsg("Compte créé avec succès ! Redirection...");
        login(response.user, response.token);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

        if (response.user.role === "candidate") {
          setTimeout(() => navigate("/onboarding/candidate"), 1500);
        } else if (response.user.role === "trainer") {
          setTimeout(() => navigate("/onboarding/trainer"), 1500);
        } else {
          setTimeout(() => navigate("/dashboard"), 1500);
        }
      } else {
        setApiError(response.error || "Erreur inconnue.");
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          "Une erreur est survenue lors de l'inscription."
      );
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedRole(null);
    setApiError("");
    setErrors({});
  };

  // --- RENDU : SÉLECTION DU RÔLE ---
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Rejoignez l'aventure
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Quel type de compte souhaitez-vous créer aujourd'hui ?
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 items-stretch"
          >
            {/* C'est ICI que j'ai corrigé l'appel des composants */}
            <RoleCard roleKey="candidate" onClick={setSelectedRole} />
            <RoleCard roleKey="client" onClick={setSelectedRole} />
            <RoleCard roleKey="trainer" onClick={setSelectedRole} />
          </motion.div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Déjà inscrit ?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Connectez-vous ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDU : FORMULAIRE D'INSCRIPTION ---
  const isClient = selectedRole === "client";
  const isTrainer = selectedRole === "trainer";
  const employerType = formData.employerType;

  // Déterminer les couleurs selon le rôle sélectionné
  const currentRoleConfig = roleConfig[selectedRole];
  // On utilise une couleur de fallback (indigo) si jamais le rôle n'est pas trouvé
  const themeColor = currentRoleConfig ? currentRoleConfig.color : "indigo";

  // Classes dynamiques pour le formulaire basées sur la couleur
  const headerBadgeClass = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-${themeColor}-100 text-${themeColor}-800`;
  const submitButtonClass = `w-full py-3.5 text-lg font-bold text-white rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed bg-${themeColor}-600 hover:bg-${themeColor}-700`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        ref={topRef}
        className="w-full max-w-lg p-8 space-y-6 bg-white/90 backdrop-blur shadow-2xl rounded-2xl border border-white/20"
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={resetSelection}
            className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" /> Changer de profil
          </button>
          <span className={headerBadgeClass}>
            {currentRoleConfig ? currentRoleConfig.title : selectedRole}
          </span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Créer votre compte
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {(apiError || successMsg) && (
            <motion.div
              key={apiError ? "error" : "success"}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className={`mb-4 text-center font-semibold text-sm rounded-xl p-3 border ${
                apiError
                  ? "bg-red-50 border-red-200 text-red-600"
                  : "bg-green-50 border-green-200 text-green-600"
              }`}
            >
              {apiError || successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={`input input-bordered w-full ${
                  errors.firstName ? "border-red-500" : ""
                }`}
                placeholder="Prénom"
              />
              <FieldError message={errors.firstName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={`input input-bordered w-full ${
                  errors.lastName ? "border-red-500" : ""
                }`}
                placeholder="Nom"
              />
              <FieldError message={errors.lastName} />
            </div>
          </div>

          {(isClient || isTrainer) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 p-4 rounded-xl space-y-4"
            >
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {isTrainer ? "Vos coordonnées pro" : "Informations entreprise"}
              </h3>

              {isClient && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'employeur
                    </label>
                    <select
                      name="employerType"
                      value={formData.employerType}
                      onChange={handleChange}
                      className={`input input-bordered w-full ${
                        errors.employerType ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Sélectionnez le type</option>
                      <option value="Entreprise formelle">
                        Entreprise formelle
                      </option>
                      <option value="Startup">Startup</option>
                      <option value="Particulier">Particulier</option>
                      <option value="Association">Association</option>
                    </select>
                    <FieldError message={errors.employerType} />
                  </div>

                  {employerType === "Entreprise formelle" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raison sociale
                      </label>
                      <input
                        name="company"
                        type="text"
                        value={formData.company}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="Nom de l'entreprise"
                      />
                      <FieldError message={errors.company} />
                    </div>
                  )}
                  {employerType === "Startup" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom commercial
                      </label>
                      <input
                        name="commercialName"
                        type="text"
                        value={formData.commercialName}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="Nom commercial"
                      />
                    </div>
                  )}
                  {employerType === "Association" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'association
                      </label>
                      <input
                        name="associationName"
                        type="text"
                        value={formData.associationName}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="Nom de l'asso"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secteur d'activité
                    </label>
                    <input
                      name="sector"
                      type="text"
                      value={formData.sector}
                      onChange={handleChange}
                      className="input input-bordered w-full"
                      placeholder="Ex: Informatique, BTP..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone / WhatsApp
                </label>
                <input
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`input input-bordered w-full ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="+237 ..."
                />
                <FieldError message={errors.phone} />
              </div>

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
            </motion.div>
          )}

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`input input-bordered w-full ${
                  errors.email ? "border-red-500" : ""
                }`}
                placeholder="exemple@email.com"
              />
              <FieldError message={errors.email} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`input input-bordered w-full ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Min. 8 caractères"
                />
                <FieldError message={errors.password} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`input input-bordered w-full ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  placeholder="Répéter le mot de passe"
                />
                <FieldError message={errors.confirmPassword} />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={submitButtonClass}
            >
              {loading ? "Création en cours..." : "S'inscrire"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            En vous inscrivant, vous acceptez nos{" "}
            <a href="#" className="underline">
              Conditions Générales
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
};

const FieldError = ({ message }) => (
  <AnimatePresence mode="wait">
    {message && (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="text-red-500 text-xs mt-1 font-medium"
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

export default Register;
