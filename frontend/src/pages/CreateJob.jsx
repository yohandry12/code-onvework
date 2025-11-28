import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Sparkles,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { apiService } from "../services/api";
import AIChatAssistant from "../components/UI/AIChatAssistant";
import AIFormField from "../components/UI/AIFormField";

const categories = [
  { value: "development", label: "Développement", icon: "💻" },
  { value: "design", label: "Design", icon: "🎨" },
  { value: "marketing", label: "Marketing", icon: "📈" },
  { value: "writing", label: "Rédaction", icon: "✍️" },
  { value: "consulting", label: "Conseil", icon: "💼" },
  { value: "data", label: "Data", icon: "📊" },
  { value: "mobile", label: "Mobile", icon: "📱" },
  { value: "video", label: "Vidéo", icon: "🎬" },
  { value: "translation", label: "Traduction", icon: "🌐" },
  { value: "other", label: "Autre", icon: "⚡" },
];

const types = ["freelance", "contrat", "à temps partiel", "temps plein"];
const currencies = ["EUR", "USD", "FCFA"];
const locationTypes = ["distanciel/télétravail", "présentiel", "hybride"];
const experienceLevels = [
  { value: "junior", label: "Junior (0-2 ans)" },
  { value: "intermediate", label: "Intermédiaire (2-5 ans)" },
  { value: "senior", label: "Senior (5+ ans)" },
  { value: "expert", label: "Expert (10+ ans)" },
];
const educationLevels = [
  { value: "none", label: "Aucun diplôme requis" },
  { value: "high-school", label: "Baccalauréat" },
  { value: "bachelor", label: "Licence/Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "Doctorat" },
];

const durationUnits = [
  { value: "heures", label: "Heure(s)" },
  { value: "jours", label: "Jour(s)" },
  { value: "semaines", label: "Semaine(s)" },
  { value: "mois", label: "Mois" },
  { value: "projet", label: "Par Projet" }, // Pour les durées non définies
];

const CreateJob = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "development",
    type: "freelance",
    budgetMin: "",
    budgetMax: "",
    budgetCurrency: "EUR",
    locationType: "distanciel/télétravail",
    locationCity: "",
    locationCountry: "Cameroun",
    isLocationRestricted: false,
    skills: "",
    experience: "intermediate",
    education: "none",
    languages: "",
    deadline: "",
    startDate: "",
    // duration: "",
    durationValue: "",
    durationUnit: "jours",
    featured: false,
    tags: "",
    isUrgent: false,
  });
  const [clonedFromId, setClonedFromId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [activeField, setActiveField] = useState(null); // Pour suivre le champ actif
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // --- LOGIQUE AUTOCOMPLÉTION VILLE (Ajout) ---
  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null); // Pour détecter le clic en dehors

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

  // 2. Gestionnaire de changement de l'input ville
  const handleCityChange = (e) => {
    const userInput = e.target.value;
    // Mise à jour du formulaire global
    setForm((prev) => ({ ...prev, locationCity: userInput }));

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

  // 3. Sélection d'une ville
  const selectCity = (cityName) => {
    setForm((prev) => ({ ...prev, locationCity: cityName }));
    setShowSuggestions(false);
  };

  // 4. Fermer la liste si clic dehors
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

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const jobToCloneId = searchParams.get("cloneFrom");

    if (jobToCloneId) {
      setLoading(true);
      const fetchJobToClone = async () => {
        try {
          const response = await apiService.jobs.getJobForCloning(jobToCloneId);
          if (response.success) {
            // ✅ Convertir les tableaux en chaînes pour les inputs texte
            const clonedJob = response.job;

            setForm({
              title: clonedJob.title || "",
              description: clonedJob.description || "",
              category: clonedJob.category || "development",
              type: clonedJob.type || "freelance",
              budgetMin: clonedJob.budget?.min || "",
              budgetMax: clonedJob.budget?.max || "",
              budgetCurrency: clonedJob.budget?.currency || "EUR",
              locationType:
                clonedJob.location?.type || "distanciel/télétravail",
              locationCity: clonedJob.location?.city || "",
              locationCountry: clonedJob.location?.country || "Cameroun",

              // ✅ Convertir les tableaux en strings
              skills: Array.isArray(clonedJob.skills)
                ? clonedJob.skills.join(", ")
                : clonedJob.skills || "",

              experience: clonedJob.experience || "intermediate",
              education: clonedJob.education || "none",

              languages: Array.isArray(clonedJob.languages)
                ? clonedJob.languages.join(", ")
                : clonedJob.languages || "",

              deadline: clonedJob.deadline || "",
              startDate: clonedJob.startDate || "",
              // duration: clonedJob.duration || "",
              durationValue: clonedJob.durationValue || "",
              durationUnit: clonedJob.durationUnit || "jours",
              featured: clonedJob.featured || false,

              tags: Array.isArray(clonedJob.tags)
                ? clonedJob.tags.join(", ")
                : clonedJob.tags || "",

              isUrgent: clonedJob.isUrgent || false,
            });

            setClonedFromId(jobToCloneId);
          }
        } catch (error) {
          console.error(
            "Impossible de charger les données pour le clonage:",
            error
          );
          setError("Impossible de charger la mission à cloner");
          setTimeout(() => navigate("/client/job-history"), 2000);
        } finally {
          setLoading(false);
        }
      };

      fetchJobToClone();
    }
  }, [location.search, navigate]);

  const steps = [
    { number: 1, title: "Informations générales", icon: FileText },
    { number: 2, title: "Budget & Localisation", icon: DollarSign },
    { number: 3, title: "Prérequis candidats", icon: Users },
    { number: 4, title: "Planification", icon: Calendar },
    { number: 5, title: "Options avancées", icon: Star },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "locationCountry") return;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.title.length < 10 || form.description.length < 50) {
      setError(
        "Le titre (min 10 caractères) et la description (min 50 caractères) sont requis."
      );
      return;
    }

    setLoading(true);

    const jobData = {
      title: form.title,
      description: form.description,
      category: form.category,
      type: form.type,

      budget: {
        min: Number(form.budgetMin) || 0,
        max: Number(form.budgetMax) || 0,
        currency: form.budgetCurrency,
      },
      location: {
        type: form.locationType,
        city: form.locationCity,
        country: form.locationCountry || "Cameroun",
      },
      isLocationRestricted: form.isLocationRestricted,

      // ✅ CORRECTION : Gérer les cas où c'est déjà un tableau OU une chaîne
      skills: Array.isArray(form.skills)
        ? form.skills
        : form.skills
        ? form.skills.split(",").map((s) => s.trim())
        : [],

      experience: form.experience,
      education: form.education,

      // ✅ CORRECTION : Même logique pour languages et tags
      languages: Array.isArray(form.languages)
        ? form.languages
        : form.languages
        ? form.languages.split(",").map((l) => l.trim())
        : [],

      deadline: form.deadline || null,
      startDate: form.startDate || null,
      // duration: form.duration,
      durationValue:
        form.durationUnit === "projet" ? null : Number(form.durationValue),
      durationUnit: form.durationUnit,
      featured: form.featured,

      tags: Array.isArray(form.tags)
        ? form.tags
        : form.tags
        ? form.tags.split(",").map((t) => t.trim())
        : [],

      isUrgent: form.isUrgent,
      clonedFromId: clonedFromId,
    };

    try {
      await apiService.jobs.create(jobData);
      setShowSuccessModal(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || "Erreur lors de la publication.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = (e) => {
    // On appelle la logique de soumission manuellement
    handleSubmit(e);
  };
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleAIAssist = (fieldName, fieldLabel) => {
    setInitialPrompt(`Peux-tu m'aider à remplir le champ "${fieldLabel}" ?`);
    setIsChatOpen(true);
  };

  const toggleChat = () => {
    setInitialPrompt(""); // On s'assure qu'il n'y a pas de prompt initial
    setIsChatOpen((prev) => !prev);
  };

  // --- LOGIQUE POUR L'ASSISTANCE RAPIDE (POPOVER) ---
  const handleAIGenerateForField = async (fieldName, userPrompt) => {
    setIsGenerating(true);
    setActiveField(fieldName);
    setError("");

    const messages = [
      {
        role: "user",
        content: `Génère un contenu pour le champ "${fieldName}" d'une offre d'emploi. La demande de l'utilisateur est : "${userPrompt}". Réponds UNIQUEMENT avec le texte généré, sans aucune phrase d'introduction ou de conclusion.`,
      },
    ];

    try {
      const response = await apiService.ai.getChatReply(messages, form);
      if (response.success) {
        setForm((prevForm) => ({
          ...prevForm,
          [fieldName]: response.reply,
        }));
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message || "Erreur de l'assistant IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Info className="hidden md:inline h-5 w-5 text-blue-500 mr-2" />
                <span className="text-blue-700 font-medium">
                  Étape 1/5 - Définissez votre mission
                </span>
              </div>
            </div>

            <div>
              <AIFormField
                label="Titre de la mission *"
                name="title"
                onFocus={() => setActiveField("title")}
                onBlur={() => setActiveField(null)}
                onAIAssist={handleAIGenerateForField}
                isAIAssistantActive={activeField === "title"}
                isGeneratingAI={isGenerating && activeField === "title"}
              >
                <div className="relative">
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    disabled={isGenerating && activeField === "title"}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="Ex: Développeur React pour application e-commerce"
                  />
                  {isGenerating && activeField === "title" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                </div>
              </AIFormField>
              <p className="text-xs text-gray-500 mt-1">
                {form.title.length}/10 caractères minimum
              </p>
            </div>

            <div>
              <AIFormField
                label="Description détaillée *"
                name="description"
                onFocus={() => setActiveField("description")}
                onBlur={() => setActiveField(null)}
                onAIAssist={handleAIGenerateForField}
                isAIAssistantActive={activeField === "description"}
                isGeneratingAI={isGenerating && activeField === "description"}
              >
                <div className="relative">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    disabled={isGenerating && activeField === "description"}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                    rows={6}
                    placeholder="Décrivez en détail la mission, les objectifs, les livrables attendus, le contexte de l'entreprise..."
                  />
                  {isGenerating && activeField === "description" && (
                    <div className="absolute top-3 right-3 animate-spin">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                </div>
              </AIFormField>
              <p className="text-xs text-gray-500 mt-1">
                {form.description.length}/50 caractères minimum
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie *
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <Briefcase className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de contrat *
                </label>
                <div className="relative">
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white capitalize"
                  >
                    {types.map((t) => (
                      <option key={t} value={t} className="capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <DollarSign className="hidden md:inline h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">
                  Étape 2/5 - Budget et localisation
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="hidden md:inline h-5 w-5 mr-2 text-blue-500" />
                Fourchette budgétaire
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget minimum *
                  </label>
                  <input
                    name="budgetMin"
                    type="number"
                    min="1"
                    value={form.budgetMin}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget maximum *
                  </label>
                  <input
                    name="budgetMax"
                    type="number"
                    min="1"
                    value={form.budgetMax}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise *
                  </label>
                  <select
                    name="budgetCurrency"
                    value={form.budgetCurrency}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="hidden md:inline h-5 w-5 mr-2 text-blue-500" />
                Localisation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de travail
                  </label>
                  <select
                    name="locationType"
                    value={form.locationType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    {locationTypes.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative" ref={wrapperRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="locationCity"
                      value={form.locationCity}
                      onChange={handleCityChange}
                      onFocus={() =>
                        form.locationCity && setShowSuggestions(true)
                      }
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ex: Douala, Yaoundé..."
                      autoComplete="off"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Liste de suggestions */}
                  {showSuggestions && citySuggestions.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                      {citySuggestions.map((cityName, index) => (
                        <li
                          key={index}
                          onClick={() => selectCity(cityName)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-700 transition-colors border-b last:border-b-0 border-gray-100 flex items-center"
                        >
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {cityName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <input
                    name="locationCountry"
                    value="Cameroun"
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
                    placeholder="Cameroun"
                  />
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
              <label className="flex items-start cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    name="isLocationRestricted"
                    type="checkbox"
                    checked={form.isLocationRestricted}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={!form.locationCity} // Désactivé si pas de ville choisie
                  />
                </div>
                <div className="ml-3">
                  <span className="block text-sm font-medium text-blue-900">
                    Restreindre aux candidats locaux uniquement
                  </span>
                  <p className="text-xs text-blue-700 mt-1">
                    Si activé, seuls les candidats dont le profil indique "
                    <span className="font-bold">
                      {form.locationCity || "la ville sélectionnée"}
                    </span>
                    " pourront postuler.
                  </p>
                </div>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Users className="hidden md:inline h-5 w-5 text-purple-500 mr-2" />
                <span className="text-purple-700 font-medium">
                  Étape 3/5 - Profil candidat idéal
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Prérequis candidats
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'expérience
                  </label>
                  <select
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    {experienceLevels.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau d'études
                  </label>
                  <select
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                  >
                    {educationLevels.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <AIFormField
                    label="Compétences techniques requises"
                    name="skills"
                    onFocus={() => setActiveField("skills")}
                    onBlur={() => setActiveField(null)}
                    onAIAssist={handleAIGenerateForField}
                    isAIAssistantActive={activeField === "skills"}
                    isGeneratingAI={isGenerating && activeField === "skills"}
                  >
                    <div className="relative">
                      <input
                        name="skills"
                        value={form.skills}
                        onChange={handleChange}
                        disabled={isGenerating && activeField === "skills"}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="React, Node.js, MongoDB, Git, API REST..."
                      />
                      {isGenerating && activeField === "skills" && (
                        <div className="absolute top-3 right-3 animate-spin">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                    </div>
                  </AIFormField>
                  <p className="text-xs text-gray-500 mt-1">
                    Séparez les compétences par des virgules
                  </p>
                </div>

                <div>
                  <AIFormField
                    label="Langues requises"
                    name="languages"
                    onFocus={() => setActiveField("languages")}
                    onBlur={() => setActiveField(null)}
                    onAIAssist={handleAIGenerateForField}
                    isAIAssistantActive={activeField === "languages"}
                    isGeneratingAI={isGenerating && activeField === "languages"}
                  >
                    <div className="relative">
                      <input
                        name="languages"
                        value={form.languages}
                        onChange={handleChange}
                        disabled={isGenerating && activeField === "languages"}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Français (natif), Anglais (courant)..."
                      />
                      {isGenerating && activeField === "languages" && (
                        <div className="absolute top-3 right-3 animate-spin">
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                    </div>
                  </AIFormField>
                  <p className="text-xs text-gray-500 mt-1">
                    Spécifiez le niveau si nécessaire
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Calendar className="hidden md:inline h-5 w-5 text-orange-500 mr-2" />
                <span className="text-orange-700 font-medium">
                  Étape 4/5 - Planning du projet
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Durée et Planning
              </h3>

              {/* ▼▼▼ NOUVEAU BLOC POUR LA DURÉE FLEXIBLE ▼▼▼ */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée estimée de la mission *
                </label>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <input
                      name="durationValue"
                      type="number"
                      min="1"
                      value={form.durationValue}
                      onChange={handleChange}
                      // Le champ est désactivé si la durée est "Par Projet"
                      disabled={form.durationUnit === "projet"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl disabled:bg-gray-100"
                      placeholder="Ex: 10, 3, 6..."
                    />
                  </div>
                  <div className="w-1/2">
                    <select
                      name="durationUnit"
                      value={form.durationUnit}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
                    >
                      {durationUnits.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.durationUnit === "projet" && (
                  <p className="text-xs text-gray-500 mt-1">
                    La durée sera déterminée par les livrables du projet.
                  </p>
                )}
              </div>

              {/* Les dates deviennent optionnelles */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début souhaitée (Optionnel)
                  </label>
                  <input
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite de candidature (Optionnel)
                  </label>
                  <input
                    name="deadline"
                    type="date"
                    value={form.deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                </div>
              </div> */}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Star className="hidden md:inline h-5 w-5 text-pink-500 mr-2" />
                <span className="text-pink-700 font-medium">
                  Étape 5/5 - Options et finalisation
                </span>
              </div>
            </div>

            {/* --- NOUVEAU BLOC DE PRÉVISUALISATION --- */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Aperçu de votre mission
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Visualisez votre offre telle qu'elle apparaîtra aux candidats
                  avant de valider.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-5 py-2.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg font-medium shadow-sm transition-all flex items-center whitespace-nowrap"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir l'aperçu
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-blue-500" />
                Tags et mots-clés
              </h3>

              <div>
                <AIFormField
                  label="Tags de recherche"
                  name="tags"
                  onFocus={() => setActiveField("tags")}
                  onBlur={() => setActiveField(null)}
                  onAIAssist={handleAIGenerateForField}
                  isAIAssistantActive={activeField === "tags"}
                  isGeneratingAI={isGenerating && activeField === "tags"}
                >
                  <input
                    name="tags"
                    value={form.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="urgent, remote, startup, fintech, junior-friendly..."
                  />
                </AIFormField>
                <p className="text-xs text-gray-500 mt-1">
                  Ajoutez des mots-clés pour améliorer la visibilité
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-500" />
                Options de promotion
              </h3>

              <div className="space-y-4">
                <label className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    name="featured"
                    type="checkbox"
                    checked={form.featured}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:outline-none focus:ring-blue-500"
                  />
                  <div className="ml-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        Mission en vedette
                      </span>
                      {/* <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Premium
                      </span> */}
                    </div>
                    {/* <p className="text-sm text-gray-500 mt-1">
                      Augmente la visibilité de votre mission de +200%
                    </p> */}
                  </div>
                </label>

                <label className="flex items-start md:items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    name="isUrgent"
                    type="checkbox"
                    checked={form.isUrgent}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:outline-none focus:ring-red-500 mt-1 md:mt-0"
                  />
                  <div className="ml-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium text-gray-900">
                        Mission urgente
                      </span>
                      {/* <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Gratuit
                      </span> */}
                    </div>
                    <p className="text-sm text-gray-500 mt-1 md:mt-0">
                      Affiche un badge "Urgent" pour attirer l'attention
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Publier une nouvelle mission
          </h1>
          <p className="text-lg text-gray-600">
            Trouvez le talent parfait pour votre projet
          </p>
        </div>

        {/* Progress Steps */}
        <div className="hidden md:inline mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div
                  key={step.number}
                  className="flex flex-grow items-center last:flex-grow-0"
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200 flex-shrink-0 ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 md:h-6 w-5 md:w-6" />
                    ) : (
                      <Icon className="h-5 md:h-6 w-5 md:w-6" />
                    )}
                  </div>
                  <div
                    className={`ml-3 ${
                      index === steps.length - 1 ? "hidden" : "block"
                    }`}
                  >
                    <div
                      className={`w-16 h-1 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:flex justify-between mt-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className="text-center"
                style={{ width: "140px" }}
              >
                <p
                  className={`text-sm font-medium ${
                    currentStep === step.number
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 m-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={(e) => e.preventDefault()} className="p-4 sm:p-8">
            {getStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                  currentStep === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-sm"
                }`}
              >
                Précédent
              </button>

              <div className="text-sm text-gray-500">
                Étape {currentStep} sur {steps.length}
              </div>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex items-center px-4 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Publication...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Publier la mission
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Progress Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Résumé de votre mission
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Titre:</span>
                <span className="font-medium text-gray-900 truncate ml-2">
                  {form.title || "Non défini"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Catégorie:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {categories.find((c) => c.value === form.category)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {form.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium text-gray-900">
                  {form.budgetMin && form.budgetMax
                    ? `${form.budgetMin} - ${form.budgetMax} ${form.budgetCurrency}`
                    : "Non défini"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Localisation:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {form.locationType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expérience:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {
                    experienceLevels.find((e) => e.value === form.experience)
                      ?.label
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {form.durationUnit === "projet"
                    ? "Par Projet"
                    : form.durationValue
                    ? `${form.durationValue} ${form.durationUnit}`
                    : "Non spécifiée"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Options:</span>
                <div className="flex space-x-1">
                  {form.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Vedette
                    </span>
                  )}
                  {form.isUrgent && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      Urgent
                    </span>
                  )}
                  {!form.featured && !form.isUrgent && (
                    <span className="text-gray-500">Aucune</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Conseils pour optimiser votre mission
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                Soyez précis dans votre description
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                Définissez un budget réaliste
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                Listez les compétences essentielles
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                Ajoutez des tags pertinents
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                Indiquez une durée estimée
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                Utilisez les options de promotion
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-300">
            {/* Header visuel */}
            <div className="bg-green-50 p-6 flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Mission soumise !
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Votre offre a bien été enregistrée. Notre équipe de modération
                va l'examiner pour s'assurer qu'elle respecte nos standards.
                <br />
                <span className="block mt-2 font-medium text-blue-600 bg-blue-50 py-1 px-2 rounded-md inline-block">
                  <ShieldCheck className="w-4 h-4 inline mr-1 mb-0.5" />
                  Validation sous 2 à 4 heures
                </span>
              </p>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                Retourner au tableau de bord
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE DE PRÉVISUALISATION --- */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden relative animate-in fade-in zoom-in duration-200">
            {/* Header de la modale */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-gray-500" />
                Aperçu de l'offre
              </h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Contenu de la fiche de mission (Simulation) */}
            <div className="p-6 md:p-8 space-y-8">
              {/* En-tête de la mission */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase tracking-wide">
                    {categories.find((c) => c.value === form.category)?.label ||
                      form.category}
                  </span>
                  {form.type && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold uppercase tracking-wide">
                      {form.type}
                    </span>
                  )}
                  {form.isUrgent && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold uppercase tracking-wide flex items-center">
                      <Zap className="w-3 h-3 mr-1" /> Urgent
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {form.title || "Titre de la mission"}
                </h1>

                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-600 border-b border-gray-100 pb-6">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {form.locationCity
                      ? `${form.locationCity}, ${form.locationCountry}`
                      : form.locationType}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {form.durationUnit === "projet"
                      ? "Durée du projet"
                      : `${form.durationValue || "?"} ${form.durationUnit}`}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-semibold text-green-700">
                      {form.budgetMin} - {form.budgetMax} {form.budgetCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  À propos de la mission
                </h3>
                <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-6 rounded-xl border border-gray-100">
                  {form.description || "Aucune description fournie."}
                </div>
              </div>

              {/* Détails en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Compétences requises
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {form.skills ? (
                      (Array.isArray(form.skills)
                        ? form.skills
                        : form.skills.split(",")
                      ).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium border border-gray-200"
                        >
                          {skill.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm italic">
                        Non spécifiées
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Langues
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {form.languages ? (
                      (Array.isArray(form.languages)
                        ? form.languages
                        : form.languages.split(",")
                      ).map((lang, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium"
                        >
                          {lang.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm italic">
                        Non spécifiées
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer de détails */}
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500 text-xs mb-1">
                    Expérience
                  </span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {experienceLevels.find((e) => e.value === form.experience)
                      ?.label || form.experience}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs mb-1">
                    Éducation
                  </span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {educationLevels.find((e) => e.value === form.education)
                      ?.label || form.education}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs mb-1">Lieu</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {form.locationType}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500 text-xs mb-1">Tags</span>
                  <span
                    className="font-semibold text-gray-800 truncate block"
                    title={form.tags}
                  >
                    {Array.isArray(form.tags)
                      ? form.tags.join(", ")
                      : form.tags || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions de la modale */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 z-10">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Fermer et modifier
              </button>
              <button
                onClick={(e) => {
                  setShowPreviewModal(false);
                  handleFinalSubmit(e);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tout est bon, publier !
              </button>
            </div>
          </div>
        </div>
      )}
      <AIChatAssistant
        jobFormContext={form}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)} // onClose ferme explicitement
        onToggle={toggleChat} // onToggle est pour le bouton flottant
        initialPrompt={initialPrompt}
        setInitialPrompt={setInitialPrompt} // On passe la fonction pour la réinitialiser
      />
    </div>
  );
};

export default CreateJob;
