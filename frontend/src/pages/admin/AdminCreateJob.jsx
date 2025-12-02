import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Eye,
  User,
  Search, // Utilisation de Search de Lucide
  UserPlus,
  Flame,
} from "lucide-react";
import { apiService } from "../../services/api";
import AIChatAssistant from "../../components/UI/AIChatAssistant";
import AIFormField from "../../components/UI/AIFormField";

// --- CONSTANTES ---
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
  { value: "projet", label: "Par Projet" },
];

const AdminCreateJob = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Étape courante (0 = Sélection Client)
  const [currentStep, setCurrentStep] = useState(0);

  // --- ÉTATS POUR LA SÉLECTION CLIENT ---
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientWrapperRef = useRef(null);

  // --- ÉTATS FORMULAIRE ---
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
    durationValue: "",
    durationUnit: "jours",
    featured: false,
    tags: "",
    isUrgent: false,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [clonedFromId, setClonedFromId] = useState(null);

  // --- ÉTATS IA & AUTOCOMPLETE VILLE ---
  const [activeField, setActiveField] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityWrapperRef = useRef(null);

  // --- CHARGEMENT INITIAL & CLONAGE ---
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);

        // 1. Charger Villes et Clients en parallèle
        const [citiesRes, clientsRes] = await Promise.all([
          apiService.cities.getAll(),
          apiService.users.adminGetAll({ role: "client", limit: 1000 }),
        ]);

        if (citiesRes.success)
          setAllCities((citiesRes.data || []).map((c) => c.name));

        let loadedClients = [];
        if (clientsRes.success) {
          loadedClients = clientsRes.users;
          setClients(loadedClients);
        }

        // 2. Vérifier si on est en mode Clonage
        const searchParams = new URLSearchParams(location.search);
        const jobToCloneId = searchParams.get("cloneFrom");

        if (jobToCloneId) {
          // Récupérer la mission à cloner
          const cloneRes = await apiService.jobs.getJobForCloning(jobToCloneId);

          if (cloneRes.success && cloneRes.job) {
            const jobData = cloneRes.job;

            // Remplir le formulaire
            setForm({
              title: jobData.title || "",
              description: jobData.description || "",
              category: jobData.category || "development",
              type: jobData.type || "freelance",
              budgetMin: jobData.budget?.min || "",
              budgetMax: jobData.budget?.max || "",
              budgetCurrency: jobData.budget?.currency || "EUR",
              locationType: jobData.location?.type || "distanciel/télétravail",
              locationCity: jobData.location?.city || "",
              locationCountry: jobData.location?.country || "Cameroun",
              isLocationRestricted: jobData.isLocationRestricted || false,

              // Conversion array -> string pour les inputs si nécessaire, ou garder array selon votre logique API
              // Ici je suppose que le backend renvoie des Arrays pour le clonage
              skills: Array.isArray(jobData.skills)
                ? jobData.skills.join(", ")
                : jobData.skills || "",
              tags: Array.isArray(jobData.tags)
                ? jobData.tags.join(", ")
                : jobData.tags || "",
              languages: Array.isArray(jobData.languages)
                ? jobData.languages.join(", ")
                : jobData.languages || "",

              experience: jobData.experience || "intermediate",
              education: jobData.education || "none",
              deadline: "", // On ne clone pas la deadline
              startDate: "",
              durationValue: jobData.durationValue || "",
              durationUnit: jobData.durationUnit || "jours",
              featured: jobData.featured || false,
              isUrgent: jobData.isUrgent || false,
            });

            setClonedFromId(jobToCloneId);

            // 3. Tenter de retrouver le client d'origine pour le pré-sélectionner
            if (jobData.clientId && loadedClients.length > 0) {
              const originalClient = loadedClients.find(
                (c) => c.id === jobData.clientId
              );
              if (originalClient) {
                setSelectedClient(originalClient);
                setClientSearchTerm(
                  `${originalClient.profile?.firstName} ${
                    originalClient.profile?.lastName
                  } (${originalClient.profile?.company || "Particulier"})`
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("Erreur init:", err);
        setError("Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [location.search]);

  // --- LOGIQUE SÉLECTION CLIENT ---
  const handleClientSearch = (e) => {
    const term = e.target.value;
    setClientSearchTerm(term);
    setSelectedClient(null);
    setShowClientDropdown(true);

    if (term) {
      const lower = term.toLowerCase();
      const results = clients.filter(
        (c) =>
          c.email.toLowerCase().includes(lower) ||
          c.profile?.firstName?.toLowerCase().includes(lower) ||
          c.profile?.lastName?.toLowerCase().includes(lower) ||
          c.profile?.company?.toLowerCase().includes(lower)
      );
      setFilteredClients(results);
    } else {
      setFilteredClients([]);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClientSearchTerm(
      `${client.profile?.firstName} ${client.profile?.lastName} (${
        client.profile?.company || "Particulier"
      })`
    );
    setShowClientDropdown(false);
    setError("");
  };

  // Fermer dropdown client au clic dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        clientWrapperRef.current &&
        !clientWrapperRef.current.contains(event.target)
      ) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clientWrapperRef]);

  // --- LOGIQUE AUTOCOMPLÉTION VILLE ---
  const handleCityChange = (e) => {
    const userInput = e.target.value;
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

  const selectCity = (cityName) => {
    setForm((prev) => ({ ...prev, locationCity: cityName }));
    setShowSuggestions(false);
  };

  // Fermer dropdown ville au clic dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        cityWrapperRef.current &&
        !cityWrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cityWrapperRef]);

  // --- GESTION FORMULAIRE ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "locationCountry") return;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const steps = [
    { number: 0, title: "Sélection du Client", icon: User },
    { number: 1, title: "Informations générales", icon: FileText },
    { number: 2, title: "Budget & Localisation", icon: DollarSign },
    { number: 3, title: "Prérequis candidats", icon: Users },
    { number: 4, title: "Planification", icon: Calendar },
    { number: 5, title: "Options avancées", icon: Star },
  ];

  const nextStep = () => {
    if (currentStep === 0 && !selectedClient) {
      setError("Veuillez sélectionner un client obligatoire.");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setError("");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    if (!selectedClient) {
      setError("Erreur critique : Aucun client sélectionné.");
      return;
    }

    setLoading(true);
    setError("");

    const jobData = {
      // Données standards
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

      // Tableaux
      skills: Array.isArray(form.skills)
        ? form.skills
        : form.skills
        ? form.skills.split(",").map((s) => s.trim())
        : [],
      experience: form.experience,
      education: form.education,
      languages: Array.isArray(form.languages)
        ? form.languages
        : form.languages
        ? form.languages.split(",").map((l) => l.trim())
        : [],
      tags: Array.isArray(form.tags)
        ? form.tags
        : form.tags
        ? form.tags.split(",").map((t) => t.trim())
        : [],

      deadline: form.deadline || null,
      startDate: form.startDate || null,
      durationValue:
        form.durationUnit === "projet" ? null : Number(form.durationValue),
      durationUnit: form.durationUnit,
      featured: form.featured,
      isUrgent: form.isUrgent,

      // CHAMP ADMIN SPÉCIFIQUE
      clonedFromId: clonedFromId,
      targetClientId: selectedClient.id,
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

  // --- IA HELPERS ---
  const handleAIAssist = (fieldName, fieldLabel) => {
    setInitialPrompt(`Peux-tu m'aider à remplir le champ "${fieldLabel}" ?`);
    setIsChatOpen(true);
  };
  const toggleChat = () => {
    setInitialPrompt("");
    setIsChatOpen((prev) => !prev);
  };
  const handleAIGenerateForField = async (fieldName, userPrompt) => {
    setIsGenerating(true);
    setActiveField(fieldName);
    setError("");
    try {
      const messages = [
        {
          role: "user",
          content: `Génère un contenu pour le champ "${fieldName}" d'une offre d'emploi. La demande de l'utilisateur est : "${userPrompt}". Réponds UNIQUEMENT avec le texte généré.`,
        },
      ];
      const response = await apiService.ai.getChatReply(messages, form);
      if (response.success) {
        setForm((prevForm) => ({ ...prevForm, [fieldName]: response.reply }));
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message || "Erreur IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDU DES ÉTAPES ---
  const getStepContent = () => {
    switch (currentStep) {
      case 0: // SÉLECTION CLIENT
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <User className="hidden md:inline h-5 w-5 text-indigo-500 mr-2" />
                <span className="text-indigo-700 font-medium">
                  Étape Préliminaire - Propriétaire
                </span>
              </div>
              <p className="text-indigo-600 text-sm mt-1 ml-7">
                Spécifiez pour quel client vous créez cette mission.
              </p>
            </div>

            <div className="relative" ref={clientWrapperRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher un client *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={handleClientSearch}
                  onFocus={() => setShowClientDropdown(true)}
                  className={`w-full px-4 py-3 pl-10 border ${
                    error && !selectedClient
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Nom, Email ou Entreprise..."
                  autoComplete="off"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {showClientDropdown && filteredClients.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <li
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-800">
                            {client.profile?.firstName}{" "}
                            {client.profile?.lastName}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {client.email}
                          </span>
                        </div>
                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {client.profile?.company || "Particulier"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {clientSearchTerm &&
                filteredClients.length === 0 &&
                !selectedClient && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">
                        Client introuvable
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        Vous devez créer le compte client avant de publier une
                        mission.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/users")}
                        className="mt-3 flex items-center px-3 py-2 bg-white border border-red-200 rounded-lg text-red-700 text-sm font-medium hover:bg-red-50"
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Aller créer un
                        client
                      </button>
                    </div>
                  </div>
                )}

              {selectedClient && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                    {selectedClient.profile?.firstName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Client sélectionné :
                    </p>
                    <p className="text-green-800 font-bold">
                      {selectedClient.profile?.firstName}{" "}
                      {selectedClient.profile?.lastName}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500 ml-auto" />
                </div>
              )}
            </div>
          </div>
        );

      case 1: // INFOS GÉNÉRALES
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Info className="hidden md:inline h-5 w-5 text-blue-500 mr-2" />
                <span className="text-blue-700 font-medium">
                  Étape 1/5 - Définissez la mission
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Développeur React"
                  />
                  {isGenerating && activeField === "title" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                </div>
              </AIFormField>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={6}
                    placeholder="Description..."
                  />
                  {isGenerating && activeField === "description" && (
                    <div className="absolute top-3 right-3 animate-spin">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                </div>
              </AIFormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de contrat *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white capitalize"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 2: // BUDGET & LOCALISATION
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
                <DollarSign className="h-5 w-5 mr-2 text-blue-500" /> Budget
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min *
                  </label>
                  <input
                    name="budgetMin"
                    type="number"
                    placeholder="500"
                    value={form.budgetMin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max *
                  </label>
                  <input
                    name="budgetMax"
                    type="number"
                    placeholder="2000"
                    value={form.budgetMax}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise
                  </label>
                  <select
                    name="budgetCurrency"
                    value={form.budgetCurrency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
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
                <MapPin className="h-5 w-5 mr-2 text-blue-500" /> Localisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode
                  </label>
                  <select
                    name="locationType"
                    value={form.locationType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
                  >
                    {locationTypes.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative" ref={cityWrapperRef}>
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
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl"
                      placeholder="Ville..."
                      autoComplete="off"
                    />
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {showSuggestions && citySuggestions.length > 0 && (
                    <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                      {citySuggestions.map((cityName, idx) => (
                        <li
                          key={idx}
                          onClick={() => selectCity(cityName)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-700 flex items-center"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500"
                  />
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
                      className="w-5 h-5 text-blue-600 rounded"
                      disabled={!form.locationCity}
                    />
                  </div>
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-blue-900">
                      Restreindre aux candidats locaux uniquement
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Si activé, seuls les candidats de{" "}
                      {form.locationCity || "cette ville"} pourront postuler.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 3: // PRÉREQUIS
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
                <Users className="h-5 w-5 mr-2 text-blue-500" /> Prérequis
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white"
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
                <AIFormField
                  label="Compétences techniques"
                  name="skills"
                  onFocus={() => setActiveField("skills")}
                  onBlur={() => setActiveField(null)}
                  onAIAssist={handleAIGenerateForField}
                  isAIAssistantActive={activeField === "skills"}
                  isGeneratingAI={isGenerating && activeField === "skills"}
                >
                  <input
                    name="skills"
                    value={form.skills}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    placeholder="React, Node.js..."
                  />
                </AIFormField>
                <AIFormField
                  label="Langues requises"
                  name="languages"
                  onFocus={() => setActiveField("languages")}
                  onBlur={() => setActiveField(null)}
                  onAIAssist={handleAIGenerateForField}
                  isAIAssistantActive={activeField === "languages"}
                  isGeneratingAI={isGenerating && activeField === "languages"}
                >
                  <input
                    name="languages"
                    value={form.languages}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    placeholder="Français, Anglais..."
                  />
                </AIFormField>
              </div>
            </div>
          </div>
        );

      case 4: // PLANIFICATION
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
                <Clock className="h-5 w-5 mr-2 text-blue-500" /> Durée
              </h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée estimée *
                </label>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <input
                      name="durationValue"
                      type="number"
                      min="1"
                      value={form.durationValue}
                      onChange={handleChange}
                      disabled={form.durationUnit === "projet"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl disabled:bg-gray-100"
                      placeholder="Ex: 3"
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
              </div>
            </div>
          </div>
        );

      case 5: // OPTIONS & PREVIEW
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

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                  <Eye className="h-5 w-5 mr-2" /> Aperçu
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Vérifiez l'offre avant de valider.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-5 py-2.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg font-medium shadow-sm flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" /> Voir l'aperçu
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-blue-500" /> Tags
              </h3>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="urgent, remote..."
                />
              </AIFormField>
            </div>

            {/* --- NOUVELLES OPTIONS DE PROMOTION (DESIGN REVAMP) --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center px-1">
                <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                Booster votre annonce
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OPTION 1 : MISSION EN VEDETTE (OR/JAUNE) */}
                <label
                  className={`relative group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 ease-in-out flex items-start gap-4 overflow-hidden
                                ${
                                  form.featured
                                    ? "border-amber-400 bg-amber-50 shadow-lg shadow-amber-100 scale-[1.02]"
                                    : "border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/30"
                                }
                              `}
                >
                  <input
                    name="featured"
                    type="checkbox"
                    checked={form.featured}
                    onChange={handleChange}
                    className="hidden" // On cache la checkbox native
                  />

                  {/* Badge Absolu */}
                  {form.featured && (
                    <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-top-2">
                      Premium
                    </div>
                  )}

                  {/* Icône animée */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                                  ${
                                    form.featured
                                      ? "bg-amber-400 text-white rotate-12 scale-110 shadow-md"
                                      : "bg-gray-100 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-500"
                                  }
                                `}
                  >
                    <Star
                      className={`w-8 h-8 transition-all ${
                        form.featured
                          ? "fill-white animate-[spin_3s_linear_infinite]"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <h4
                      className={`text-lg font-bold transition-colors ${
                        form.featured ? "text-amber-900" : "text-gray-900"
                      }`}
                    >
                      Mission en Vedette
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Votre offre apparaît en tête de liste et est mise en
                      surbrillance pour une visibilité maximale.
                    </p>
                  </div>

                  {/* Effet de particules (décoratif) */}
                  {form.featured && (
                    <Sparkles className="absolute bottom-2 right-2 w-12 h-12 text-amber-400 opacity-20 pointer-events-none" />
                  )}
                </label>

                {/* OPTION 2 : MISSION URGENTE (ROUGE/FEU) */}
                <label
                  className={`relative group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 ease-in-out flex items-start gap-4 overflow-hidden
                                ${
                                  form.isUrgent
                                    ? "border-red-500 bg-red-50 shadow-lg shadow-red-100 scale-[1.02]"
                                    : "border-gray-200 bg-white hover:border-red-200 hover:bg-red-50/30"
                                }
                              `}
                >
                  <input
                    name="isUrgent"
                    type="checkbox"
                    checked={form.isUrgent}
                    onChange={handleChange}
                    className="hidden"
                  />

                  {/* Badge Absolu */}
                  {form.isUrgent && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm animate-pulse">
                      Urgent
                    </div>
                  )}

                  {/* Icône animée */}
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
                                  ${
                                    form.isUrgent
                                      ? "bg-red-500 text-white shadow-md shadow-red-200"
                                      : "bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-red-500"
                                  }
                                `}
                  >
                    <Flame
                      className={`w-8 h-8 transition-all ${
                        form.isUrgent ? "fill-white animate-bounce" : ""
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <h4
                      className={`text-lg font-bold transition-colors ${
                        form.isUrgent ? "text-red-900" : "text-gray-900"
                      }`}
                    >
                      Recrutement Urgent
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Indiquez aux candidats que vous souhaitez recruter
                      immédiatement. Ajoute un badge "Urgent".
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
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Créer une mission (Admin)
          </h1>
          <p className="text-lg text-gray-600">
            Publiez une offre pour le compte d'un client
          </p>
        </div>

        {/* PROGRESS BAR */}
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
                    className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex-shrink-0 ${
                      isActive
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div
                    className={`ml-3 ${
                      index === steps.length - 1 ? "hidden" : "block"
                    }`}
                  >
                    <div
                      className={`w-12 h-1 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
              <p className="text-red-700 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-8">
            {getStepContent()}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-xl font-medium ${
                  currentStep === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                }`}
              >
                Précédent
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-indigo-700 shadow-lg flex items-center"
                >
                  {loading ? (
                    "Publication..."
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" /> Publier la
                      mission
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mission Créée !
            </h2>
            <p className="text-gray-600 mb-6">
              Attribuée à <strong>{selectedClient?.profile?.firstName}</strong>{" "}
              et publiée.
            </p>
            <button
              onClick={() => navigate("/admin/jobs")}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-8 relative">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full hover:bg-gray-200"
            >
              X
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {form.title || "Titre de la mission"}
            </h2>
            <div className="flex gap-4 text-sm text-gray-500 mb-4">
              <span>{form.category}</span> • <span>{form.type}</span> •{" "}
              <span>
                {form.locationCity}, {form.locationCountry}
              </span>
            </div>
            <div className="prose max-w-none bg-gray-50 p-4 rounded-lg mb-4 whitespace-pre-wrap">
              {form.description || "Aucune description."}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleFinalSubmit();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmer et Publier
              </button>
            </div>
          </div>
        </div>
      )}

      <AIChatAssistant
        jobFormContext={form}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onToggle={toggleChat}
        initialPrompt={initialPrompt}
        setInitialPrompt={setInitialPrompt}
      />
    </div>
  );
};

export default AdminCreateJob;
