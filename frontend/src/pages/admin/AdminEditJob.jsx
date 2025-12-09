import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Save,
  Search,
  Flame,
} from "lucide-react";
import { apiService } from "../../services/api";
import AIChatAssistant from "../../components/UI/AIChatAssistant";
import AIFormField from "../../components/UI/AIFormField";
import toast from "react-hot-toast";

// --- CONSTANTES (Identiques à CreateJob) ---
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

const AdminEditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // On commence à l'étape 0 pour voir le client tout de suite
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- GESTION CLIENT ---
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientWrapperRef = useRef(null);

  // --- GESTION VILLE & IA ---
  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cityWrapperRef = useRef(null);

  const [activeField, setActiveField] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // États formulaire
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    budget: "",
    budgetCurrency: "EUR",
    locationType: "",
    locationCity: "",
    locationCountry: "",
    isLocationRestricted: false,
    skills: "",
    experience: "",
    education: "",
    languages: "",
    durationValue: "",
    durationUnit: "",
    featured: false,
    tags: "",
    isUrgent: false,
  });

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const initPage = async () => {
      setLoading(true);
      try {
        // 1. Charger Job, Villes et Clients en parallèle
        const [jobRes, citiesRes, clientsRes] = await Promise.all([
          apiService.jobs.getById(id),
          apiService.cities.getAll(),
          apiService.users.adminGetAll({ role: "client", limit: 1000 }),
        ]);

        // 2. Initialiser Villes
        if (citiesRes.success)
          setAllCities((citiesRes.data || []).map((c) => c.name));

        // 3. Initialiser Clients
        let loadedClients = [];
        if (clientsRes.success) {
          loadedClients = clientsRes.users;
          setClients(loadedClients);
        }

        // 4. Initialiser le Formulaire avec le Job
        if (jobRes.success && jobRes.job) {
          const j = jobRes.job;
          setForm({
            title: j.title,
            description: j.description,
            category: j.category,
            type: j.type,
            budget: j.budget,
            budgetCurrency: j.budgetCurrency,
            locationType: j.locationType,
            locationCity: j.locationCity,
            locationCountry: j.locationCountry,
            isLocationRestricted: j.isLocationRestricted,
            skills: Array.isArray(j.skills) ? j.skills.join(", ") : j.skills,
            experience: j.experience,
            education: j.education,
            languages: Array.isArray(j.languages)
              ? j.languages.join(", ")
              : j.languages,
            tags: Array.isArray(j.tags) ? j.tags.join(", ") : j.tags,
            durationValue: j.durationValue,
            durationUnit: j.durationUnit,
            featured: j.featured,
            isUrgent: j.isUrgent,
          });

          // --- 5. RÉCUPÉRATION ET PRÉ-SÉLECTION DU CLIENT ---
          // On utilise j.client.id s'il est peuplé, sinon j.clientId
          const currentClientId = j.client?.id || j.clientId;

          if (currentClientId && loadedClients.length > 0) {
            const owner = loadedClients.find(
              (c) => String(c.id) === String(currentClientId)
            );
            if (owner) {
              setSelectedClient(owner);
              setClientSearchTerm(
                `${owner.profile?.firstName || ""} ${
                  owner.profile?.lastName || ""
                } (${owner.profile?.company || "Particulier"})`
              );
            }
          }
        } else {
          toast.error("Mission introuvable");
          navigate("/admin/jobs");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur de chargement");
        navigate("/admin/jobs");
      } finally {
        setLoading(false);
      }
    };
    initPage();
  }, [id, navigate]);

  // --- HANDLERS CLIENT ---
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
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        clientWrapperRef.current &&
        !clientWrapperRef.current.contains(event.target)
      )
        setShowClientDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clientWrapperRef]);

  // --- HANDLERS VILLE & FORMULAIRE ---
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
      if (
        cityWrapperRef.current &&
        !cityWrapperRef.current.contains(event.target)
      )
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cityWrapperRef]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // --- MISE À JOUR ---
  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClient) {
      toast.error("Un client doit être assigné à la mission.");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      budget: Number(form.budget),
      durationValue:
        form.durationUnit === "projet" ? null : Number(form.durationValue),
      skills: form.skills
        ? Array.isArray(form.skills)
          ? form.skills
          : form.skills.split(",").map((s) => s.trim())
        : [],
      tags: form.tags
        ? Array.isArray(form.tags)
          ? form.tags
          : form.tags.split(",").map((s) => s.trim())
        : [],
      languages: form.languages
        ? Array.isArray(form.languages)
          ? form.languages
          : form.languages.split(",").map((s) => s.trim())
        : [],

      // IMPORTANT : On met à jour le clientId au cas où l'admin l'a changé
      clientId: selectedClient.id,
    };

    try {
      const res = await apiService.jobs.adminUpdate(id, payload);
      if (res.success) {
        toast.success("Mission mise à jour avec succès !");
        navigate("/admin/jobs");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur de mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // --- NAVIGATION ---
  const steps = [
    { number: 0, title: "Client", icon: User },
    { number: 1, title: "Général", icon: FileText },
    { number: 2, title: "Lieu & Budget", icon: DollarSign },
    { number: 3, title: "Candidat", icon: Users },
    { number: 4, title: "Planning", icon: Calendar },
    { number: 5, title: "Options", icon: Star },
  ];
  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };
  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // --- IA ---
  const handleAIAssist = (fieldName, fieldLabel) => {
    setInitialPrompt(`Aide moi pour ${fieldLabel}`);
    setIsChatOpen(true);
  };
  const toggleChat = () => {
    setInitialPrompt("");
    setIsChatOpen((prev) => !prev);
  };
  const handleAIGenerateForField = async (fieldName, userPrompt) => {
    setIsGenerating(true);
    setActiveField(fieldName);
    try {
      const response = await apiService.ai.getChatReply(
        [
          {
            role: "user",
            content: `Génère le contenu pour "${fieldName}". Demande: "${userPrompt}". Réponds juste le texte.`,
          },
        ],
        form
      );
      if (response.success)
        setForm((prev) => ({ ...prev, [fieldName]: response.reply }));
      else throw new Error(response.error);
    } catch (err) {
      toast.error("Erreur IA");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDU DES ÉTAPES ---
  const getStepContent = () => {
    switch (currentStep) {
      case 0: // CLIENT (AVEC PRÉ-SELECTION)
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 flex items-center">
              <User className="h-5 w-5 text-indigo-500 mr-2" />
              <span className="text-indigo-700 font-medium">
                Propriétaire de la mission
              </span>
            </div>
            <div className="relative" ref={clientWrapperRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client assigné *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={handleClientSearch}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Rechercher..."
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
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                    >
                      <span className="font-semibold text-gray-800">
                        {client.profile?.firstName} {client.profile?.lastName}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({client.email})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {selectedClient && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Client actuel :
                    </p>
                    <p className="text-green-800 font-bold">
                      {selectedClient.profile?.firstName}{" "}
                      {selectedClient.profile?.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // ... Pour gagner de la place, je réutilise exactement les mêmes composants que AdminCreateJob pour les étapes 1 à 5.
      // Assurez-vous de coller ici les `case 1`, `case 2`, `case 3`, `case 4`, `case 5` du fichier AdminCreateJob.jsx précédent.
      // Ils utilisent `form`, `handleChange`, `handleCityChange`, `selectCity`, `wrapperRef`, `handleAIGenerateForField` qui sont tous définis.

      // (Exemple abrégé pour l'étape 1)
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant total *
                  </label>
                  <input
                    name="budget" // Nom unique
                    type="number"
                    min="1"
                    placeholder="Ex: 1500"
                    value={form.budget}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Modifier la mission
        </h1>

        {/* Barre progression */}
        <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.number)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  currentStep === step.number
                    ? "bg-indigo-600 text-white"
                    : "bg-white border-gray-300 text-gray-400 hover:bg-indigo-50"
                }`}
              >
                {step.number}
              </button>
              {idx < steps.length - 1 && (
                <div className="w-10 h-1 mx-2 bg-gray-200"></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleUpdate} className="p-6 sm:p-8">
            {getStepContent()}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={
                  currentStep === 0 ? () => navigate("/admin/jobs") : prevStep
                }
                className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                {currentStep === 0 ? "Annuler" : "Précédent"}
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
                  onClick={() => setShowPreviewModal(true)}
                  disabled={saving}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg flex items-center"
                >
                  {saving ? (
                    "Sauvegarde..."
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" /> Vérifier et Publier
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
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
                      {form.budget} {form.budgetCurrency}
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
                Fermer
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleUpdate();
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Confirmer et Mettre à jour
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

export default AdminEditJob;
