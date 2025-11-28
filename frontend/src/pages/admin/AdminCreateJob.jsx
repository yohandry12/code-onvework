import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Search as MagnifyingGlassIcon,
  UserPlus,
} from "lucide-react";
import { apiService } from "../../services/api";
import AIChatAssistant from "../../components/UI/AIChatAssistant";
import AIFormField from "../../components/UI/AIFormField";

// --- Constantes (Mêmes que CreateJob) ---
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
  // On commence à l'étape 0 (Sélection Client)
  const [currentStep, setCurrentStep] = useState(0);

  // --- ÉTATS POUR LA SÉLECTION CLIENT ---
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clients, setClients] = useState([]); // Liste chargée depuis l'API
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientWrapperRef = useRef(null);

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
  const navigate = useNavigate();

  // --- ÉTATS POUR L'IA ET L'AUTOCOMPLÉTION VILLE ---
  const [activeField, setActiveField] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // --- CHARGEMENT INITIAL (Villes & Clients) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les villes
        const citiesRes = await apiService.cities.getAll();
        setAllCities((citiesRes.data || []).map((c) => c.name));

        // Charger les clients (Admin only)
        // On suppose que cette route existe et filtre par role='client'
        const clientsRes = await apiService.users.adminGetAll({
          role: "client",
          limit: 1000,
        });
        if (clientsRes.success) {
          setClients(clientsRes.users);
        }
      } catch (err) {
        console.error("Erreur chargement données:", err);
      }
    };
    fetchData();
  }, []);

  // --- LOGIQUE SÉLECTION CLIENT ---
  const handleClientSearch = (e) => {
    const term = e.target.value;
    setClientSearchTerm(term);
    setSelectedClient(null); // Reset si on tape
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

  // Click outside pour client dropdown
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

  // --- LOGIQUE AUTOCOMPLÉTION VILLE (Identique à CreateJob) ---
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
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // --- ÉTAPES ---
  const steps = [
    { number: 0, title: "Sélection du Client", icon: User }, // <--- NOUVELLE ÉTAPE
    { number: 1, title: "Informations générales", icon: FileText },
    { number: 2, title: "Budget & Localisation", icon: DollarSign },
    { number: 3, title: "Prérequis candidats", icon: Users },
    { number: 4, title: "Planification", icon: Calendar },
    { number: 5, title: "Options avancées", icon: Star },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "locationCountry") return;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const nextStep = () => {
    if (currentStep === 0 && !selectedClient) {
      setError("Veuillez sélectionner un client obligatoire.");
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      setError(""); // Clear error on change
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Juste au cas où
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
      // ... Données du formulaire
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
      deadline: form.deadline || null,
      startDate: form.startDate || null,
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

      // --- CHAMP ADMIN ---
      targetClientId: selectedClient.id, // On envoie l'ID du client choisi
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

  // --- LOGIQUE IA (Inchangée) ---
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

  // --- RENDU DU CONTENU DES ÉTAPES ---
  const getStepContent = () => {
    switch (currentStep) {
      case 0: // --- ÉTAPE SÉLECTION CLIENT ---
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <User className="hidden md:inline h-5 w-5 text-indigo-500 mr-2" />
                <span className="text-indigo-700 font-medium">
                  Étape Préliminaire - Propriétaire de la mission
                </span>
              </div>
              <p className="text-indigo-600 text-sm mt-1 ml-7">
                En tant qu'administrateur, vous devez spécifier à quel client
                cette mission sera attribuée.
              </p>
            </div>

            <div className="relative" ref={clientWrapperRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher un client existant *
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
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Nom, Email ou Entreprise..."
                  autoComplete="off"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Liste déroulante Client */}
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

              {/* Message si client non trouvé */}
              {clientSearchTerm &&
                filteredClients.length === 0 &&
                !selectedClient && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-sm">
                        Client introuvable
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        Aucun client ne correspond à votre recherche. Vous devez
                        impérativement créer le compte client avant de pouvoir
                        publier une mission pour lui.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/users")} // Redirection vers gestion users
                        className="mt-3 flex items-center px-3 py-2 bg-white border border-red-200 rounded-lg text-red-700 text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Aller créer un client
                      </button>
                    </div>
                  </div>
                )}

              {/* Confirmation client sélectionné */}
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

      case 1: // Infos Générales (Identique CreateJob)
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
            {/* ... (Champs Titre, Description, Categorie, Type - Identique à CreateJob) ... */}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white capitalize"
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

      case 2: // Budget & Localisation (Copier-coller de CreateJob avec Autocomplete)
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
            {/* ... Champs Budget ... */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-500" /> Budget
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  name="budgetMin"
                  type="number"
                  placeholder="Min"
                  value={form.budgetMin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
                <input
                  name="budgetMax"
                  type="number"
                  placeholder="Max"
                  value={form.budgetMax}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                />
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

            {/* ... Champs Localisation ... */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" /> Localisation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* AUTOCOMPLETE VILLE */}
                <div className="relative" ref={wrapperRef}>
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

                <input
                  name="locationCountry"
                  value="Cameroun"
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    name="isLocationRestricted"
                    type="checkbox"
                    checked={form.isLocationRestricted}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-blue-600 rounded"
                    disabled={!form.locationCity}
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-blue-900">
                      Restreindre aux candidats locaux
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      // ... LES CAS 3, 4, 5 SONT IDENTIQUES À CreateJob.jsx (Copier-coller le contenu des cases) ...
      // Pour alléger la réponse, je mets le code essentiel, mais dans votre fichier final, copiez les cases 3, 4 et 5 exactement comme dans CreateJob.jsx.
      case 3:
        return <div>{/* Copier contenu case 3 de CreateJob */}</div>;
      case 4:
        return <div>{/* Copier contenu case 4 de CreateJob */}</div>;
      case 5:
        return (
          <div className="space-y-6">
            {/* ... */}
            {/* Bloc de prévisualisation */}
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
            {/* ... */}
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

        {/* Barre de progression (Adaptée pour 6 étapes : 0 à 5) */}
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
              La mission a été attribuée à{" "}
              <strong>{selectedClient?.profile?.firstName}</strong> et publiée
              avec succès.
            </p>
            <button
              onClick={() => navigate("/admin/jobs")}
              className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800"
            >
              Retour à la gestion
            </button>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL (Copier le code de CreateJob pour le rendu) */}
      {showPreviewModal && (
        // ... Collez ici le code de la modale de prévisualisation de CreateJob ...
        // ... En adaptant juste les boutons d'action ...
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm overflow-y-auto">
          {/* ... Contenu de la preview ... */}
          <div className="bg-white rounded-2xl w-full max-w-3xl p-8 relative">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4"
            >
              X
            </button>
            <h2 className="text-2xl font-bold mb-4">{form.title}</h2>
            <p className="mb-4">{form.description}</p>
            {/* ... Détails ... */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleFinalSubmit();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg"
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
