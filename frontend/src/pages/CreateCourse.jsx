import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  MapPin,
  Calendar,
  CheckCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  LayoutList,
  Layers,
  Globe,
  Tag,
  Clock,
  Users,
  Laptop,
  Award,
  ListChecks, // Icone pour les pré-requis
  Target,
} from "lucide-react";
import toast from "react-hot-toast";

// --- COMPOSANT : Indicateur d'étape (Inchangé car parfait) ---
const StepIndicator = ({ currentStep, steps }) => (
  <div className="mb-10">
    <div className="flex justify-between items-center relative z-0">
      <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
      <div
        className="absolute left-0 top-1/2 h-1 bg-emerald-500 -z-10 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      ></div>

      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div
            key={index}
            className="flex flex-col items-center bg-gray-50 px-2 rounded-lg"
          >
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 border-2
                ${
                  isActive
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg scale-110"
                    : isCompleted
                    ? "bg-emerald-100 border-emerald-600 text-emerald-700"
                    : "bg-white border-gray-300 text-gray-400"
                }
              `}
            >
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : stepNum}
            </div>
            <span
              className={`hidden sm:block absolute mt-12 text-xs font-semibold uppercase tracking-wider ${
                isActive ? "text-emerald-700" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// Helper Image
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiUrl =
    import.meta.env.VITE_API_URL || "http://192.168.1.119:4000/api";
  const baseUrl = apiUrl.replace(/\/api$/, "");
  return `${baseUrl}${path}`;
};

const CreateCourse = ({
  trainerId = null,
  initialData = null,
  onSubmit = null,
  isEmbedded = false,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- NOUVEL ÉTAT ADAPTÉ AUX CENTRES ---
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    category: "",
    subCategory: "",
    level: "Tous niveaux",
    language: "Français",

    // Nouveaux champs Logistique
    trainingType: "online", // 'online', 'onsite', 'hybrid'
    startDate: "", // Date de début de session
    location: "", // Adresse physique (si présentiel)
    schedule: "", // ex: "Lundi et Mercredi 18h-20h"

    price: "",
    discountPrice: "",
    duration: "", // Durée globale (ex: 30 heures / 3 mois)
    description: "",
    certificateEnabled: true,
    thumbnail: "",
    objectives: [""],
    prerequisites: [""],

    // Le programme est maintenant une liste de points à aborder, pas des fichiers à uploader
    modules: [
      {
        title: "Partie 1 : Fondamentaux",
        lessons: [
          {
            title: "Introduction au sujet",
            description: "Présentation des concepts clés...", // On utilisera le champ 'content' du modèle pour ça
          },
        ],
      },
    ],
  });

  // If initialData is provided (edit mode), preload the form
  useEffect(() => {
    if (!initialData) return;
    // Map server fields to formData shape
    setFormData((prev) => ({
      ...prev,
      title: initialData.title || prev.title,
      subtitle: initialData.subtitle || prev.subtitle,
      category: initialData.category || prev.category,
      subCategory: initialData.subCategory || prev.subCategory,
      level: initialData.level || prev.level,
      language: initialData.language || prev.language,
      price: initialData.price || prev.price,
      discountPrice: initialData.discountPrice || prev.discountPrice,
      duration: initialData.duration
        ? Math.round(initialData.duration / 60)
        : prev.duration,
      description: initialData.description || prev.description,
      thumbnail: initialData.thumbnail || prev.thumbnail,
      certificateEnabled:
        initialData.certificateEnabled !== undefined
          ? initialData.certificateEnabled
          : prev.certificateEnabled,
      objectives:
        initialData.objectives?.length > 0
          ? initialData.objectives
          : prev.objectives,
      prerequisites:
        initialData.prerequisites?.length > 0
          ? initialData.prerequisites
          : prev.prerequisites,
      trainingType: initialData.trainingType || prev.trainingType,
      startDate: initialData.startDate || prev.startDate,
      location: initialData.location || prev.location,
      schedule: initialData.schedule || prev.schedule,
      modules:
        initialData.modules?.map((m) => ({
          title: m.title || "",
          lessons:
            m.lessons?.map((l) => ({
              title: l.title || "",
              description: l.content || "",
            })) || [],
        })) || prev.modules,
    }));
  }, [initialData]);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading("Upload en cours...");
    try {
      const res = await apiService.trainings.uploadMedia(file);
      if (res.success) {
        setFormData({ ...formData, [field]: res.url });
        toast.success("Image chargée !", { id: toastId });
      }
    } catch (err) {
      toast.error("Erreur upload", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // Helpers Arrays
  const updateArrayItem = (arr, idx, val) => {
    const newArr = [...formData[arr]];
    newArr[idx] = val;
    setFormData({ ...formData, [arr]: newArr });
  };
  const removeArrayItem = (arr, idx) => {
    setFormData({
      ...formData,
      [arr]: formData[arr].filter((_, i) => i !== idx),
    });
  };
  const addArrayItem = (arr) => {
    setFormData({ ...formData, [arr]: [...formData[arr], ""] });
  };

  // Helpers Programme (Modules/Sections)
  const addModule = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        { title: `Partie ${formData.modules.length + 1}`, lessons: [] },
      ],
    });
  };
  const updateModule = (idx, field, val) => {
    const newMods = [...formData.modules];
    newMods[idx][field] = val;
    setFormData({ ...formData, modules: newMods });
  };
  const removeModule = (idx) => {
    setFormData({
      ...formData,
      modules: formData.modules.filter((_, i) => i !== idx),
    });
  };

  // Helpers Sujets (Lessons simplifiées)
  const addLesson = (modIdx) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons.push({ title: "", description: "" });
    setFormData({ ...formData, modules: newMods });
  };
  const updateLesson = (modIdx, lesIdx, field, val) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons[lesIdx][field] = val;
    setFormData({ ...formData, modules: newMods });
  };
  const removeLesson = (modIdx, lesIdx) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons = newMods[modIdx].lessons.filter(
      (_, i) => i !== lesIdx
    );
    setFormData({ ...formData, modules: newMods });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // --- CORRECTION : On envoie les données séparément, on ne touche plus à la description ---

      const payload = {
        ...formData,
        // On s'assure que le prix est un nombre
        price: parseFloat(formData.price) || 0,
        discountPrice: parseFloat(formData.discountPrice) || 0,
        duration: (parseInt(formData.duration) || 0) * 60,

        // Nettoyage des tableaux
        objectives: formData.objectives.filter((o) => o.trim() !== ""),
        prerequisites: formData.prerequisites.filter((p) => p.trim() !== ""),

        // Logistique (Envoyée telle quelle grâce au ...formData, mais on peut forcer la date si vide)
        startDate: formData.startDate || null,

        // Transformation des modules (inchangé)
        modules: formData.modules.map((m) => ({
          ...m,
          lessons: m.lessons
            .filter((l) => l.title.trim() !== "")
            .map((l) => ({
              title: l.title,
              type: "text",
              content: l.description,
              duration: 0,
            })),
        })),
      };
      if (trainerId) payload.trainerId = trainerId;

      if (onSubmit && typeof onSubmit === "function") {
        const res = await onSubmit(payload);
        if (res && res.success) {
          toast.success("Enregistré avec succès !");
        }
      } else {
        const res = await apiService.trainings.create(payload);
        if (res.success) {
          toast.success("Formation publiée avec succès !");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.title)
      return toast.error("Le titre est requis");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo(0, 0);
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // --- ÉTAPE 1 : INFOS GÉNÉRALES & LOGISTIQUE ---
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <BookOpen size={20} />
          </span>
          Quoi et Où ?
        </h2>

        <div className="space-y-5">
          {/* Titre */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Nom de la formation
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-200 outline-none"
              placeholder="Ex: Certification Professionnelle en Gestion de Projet"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sous-titre
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          {/* Mode & Logistique (NOUVEAU) */}
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-4">
            <label className="block text-sm font-bold text-emerald-800 mb-2">
              Modalités d'apprentissage
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { val: "online", icon: Laptop, label: "En Ligne (Live/Zoom)" },
                { val: "onsite", icon: Users, label: "En Présentiel" },
                { val: "hybrid", icon: Globe, label: "Hybride" },
              ].map((opt) => (
                <div
                  key={opt.val}
                  onClick={() =>
                    setFormData({ ...formData, trainingType: opt.val })
                  }
                  className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    formData.trainingType === opt.val
                      ? "border-emerald-500 bg-white shadow-md"
                      : "border-transparent bg-white/50 hover:bg-white hover:border-emerald-200"
                  }`}
                >
                  <opt.icon
                    className={
                      formData.trainingType === opt.val
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }
                  />
                  <span
                    className={`text-sm font-medium mt-2 ${
                      formData.trainingType === opt.val
                        ? "text-emerald-900"
                        : "text-gray-500"
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Champs conditionnels selon le mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {formData.trainingType !== "online" && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Lieu de formation (Adresse)
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-500 outline-none"
                      placeholder="Ex: Douala, Akwa, Immeuble X, 2ème étage"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Date de début (Session)
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Planning (Jours/Heures)
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="schedule"
                    value={formData.schedule}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-emerald-500 outline-none"
                    placeholder="Ex: Samedi 09h-14h"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Catégories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Domaine
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-200 outline-none appearance-none bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Développement">Informatique & Tech</option>
                  <option value="Business">Business & Management</option>
                  <option value="Design">Design & Création</option>
                  <option value="Langues">Langues</option>
                  <option value="Marketing">Marketing & Communication</option>
                  <option value="BTP">Ingénierie & BTP</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-gray-500">
                  <LayoutList size={16} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Niveau requis
              </label>
              <div className="relative">
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-200 outline-none appearance-none bg-white"
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                  <option value="Tous niveaux">Tous niveaux</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-gray-500">
                  <Layers size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // --- ÉTAPE 2 : DÉTAILS & PRIX ---
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 1. Prix & Volume */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <DollarSign size={20} />
          </span>
          Coût et Volume horaire
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Prix (FCFA)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 outline-none"
              placeholder="Ex: 50000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Prix Promo (Optionnel)
            </label>
            <input
              type="number"
              name="discountPrice"
              value={formData.discountPrice}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 outline-none"
              placeholder="Ex: 35000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Volume total (Heures)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 outline-none"
              placeholder="Ex: 40"
            />
          </div>
        </div>
      </div>

      {/* 2. AJOUTÉ : Certification */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
              <Award size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Certification</h3>
              <p className="text-sm text-gray-500">
                Un certificat est-il délivré à la fin ?
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="certificateEnabled"
              checked={formData.certificateEnabled}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              {formData.certificateEnabled ? "Oui, certifiant" : "Non"}
            </span>
          </label>
        </div>
      </div>

      {/* 2. Présentation */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <ImageIcon size={20} />
          </span>
          Présentation
        </h2>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Affiche / Flyer de la formation
            </label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-emerald-50 hover:border-emerald-400 transition-all relative overflow-hidden">
              {formData.thumbnail ? (
                <img
                  src={formData.thumbnail}
                  alt="Cover"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">Cliquez pour importer l'affiche</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, "thumbnail")}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Description complète
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="6"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 outline-none resize-none"
            placeholder="Détaillez le contenu, la méthodologie, les débouchés..."
          ></textarea>
        </div>
      </div>

      {/* 4. AJOUTÉ : Objectifs & Pré-requis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectifs */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <Target size={18} />
            </span>
            Objectifs pédagogiques
          </h2>
          <div className="space-y-3">
            {formData.objectives.map((obj, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={obj}
                  onChange={(e) =>
                    updateArrayItem("objectives", index, e.target.value)
                  }
                  className="flex-grow px-4 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 outline-none text-sm transition-all focus:ring-2 focus:ring-emerald-100"
                  placeholder="Ex: Maîtriser les bases du logiciel..."
                />
                {formData.objectives.length > 1 && (
                  <button
                    onClick={() => removeArrayItem("objectives", index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayItem("objectives")}
              className="mt-2 text-sm font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50 w-fit"
            >
              <Plus size={16} /> Ajouter un objectif
            </button>
          </div>
        </div>

        {/* Pré-requis */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
              <ListChecks size={18} />
            </span>
            Pré-requis nécessaires
          </h2>
          <div className="space-y-3">
            {formData.prerequisites.map((pre, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={pre}
                  onChange={(e) =>
                    updateArrayItem("prerequisites", index, e.target.value)
                  }
                  className="flex-grow px-4 py-2 rounded-xl border border-gray-300 focus:border-orange-500 outline-none text-sm transition-all focus:ring-2 focus:ring-orange-100"
                  placeholder="Ex: Avoir un ordinateur portable..."
                />
                {formData.prerequisites.length > 1 && (
                  <button
                    onClick={() => removeArrayItem("prerequisites", index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addArrayItem("prerequisites")}
              className="mt-2 text-sm font-bold text-orange-600 flex items-center gap-1 hover:text-orange-700 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50 w-fit"
            >
              <Plus size={16} /> Ajouter un pré-requis
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // --- ÉTAPE 3 : PROGRAMME (Syllabus simplifié) ---
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-emerald-500">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Programme de la formation
        </h2>
        <p className="text-gray-500 text-sm">
          Détaillez ici les grandes parties et les sujets abordés. Pas besoin
          d'uploader des vidéos, il s'agit juste d'afficher le plan de cours aux
          intéressés.
        </p>
      </div>

      <div className="space-y-6">
        {formData.modules.map((module, mIndex) => (
          <div
            key={mIndex}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
          >
            {/* Header Module */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
              <span className="font-bold text-emerald-600 bg-emerald-100 w-8 h-8 flex items-center justify-center rounded-lg">
                {mIndex + 1}
              </span>
              <input
                type="text"
                value={module.title}
                onChange={(e) => updateModule(mIndex, "title", e.target.value)}
                className="bg-transparent font-bold text-gray-800 text-lg w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded px-2"
                placeholder="Titre de la partie (ex: Mois 1, Module Intro...)"
              />
              <button
                onClick={() => removeModule(mIndex)}
                className="text-gray-400 hover:text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Liste des sujets */}
            <div className="p-4 space-y-3">
              {module.lessons.map((lesson, lIndex) => (
                <div key={lIndex} className="flex gap-3 items-start group">
                  <div className="mt-2 w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="flex-grow space-y-2">
                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) =>
                        updateLesson(mIndex, lIndex, "title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 outline-none font-medium text-sm"
                      placeholder="Sujet abordé..."
                    />
                    <input
                      type="text"
                      value={lesson.description}
                      onChange={(e) =>
                        updateLesson(
                          mIndex,
                          lIndex,
                          "description",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-1.5 bg-gray-50 border-none rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-300 outline-none text-xs text-gray-600"
                      placeholder="Court descriptif (optionnel)"
                    />
                  </div>
                  <button
                    onClick={() => removeLesson(mIndex, lIndex)}
                    className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addLesson(mIndex)}
                className="ml-5 mt-2 text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Ajouter un sujet
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addModule}
          className="w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Ajouter une Partie / Mois
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8 py-10"
    >
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <CheckCircle className="w-12 h-12 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Prêt à publier ?</h2>
        <p className="text-gray-500 text-lg">
          Votre formation{" "}
          <span className="font-bold text-gray-800">
            "{formData.title || "Sans titre"}"
          </span>{" "}
          sera visible par tous les candidats.
        </p>
      </div>

      {/* Carte Récap */}
      <div className="max-w-xl mx-auto bg-white p-5 rounded-2xl shadow-xl border border-gray-100 text-left">
        <div className="flex gap-5 items-start">
          <div className="w-32 h-24 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
            {formData.thumbnail ? (
              <img
                src={getImageUrl(formData.thumbnail)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon size={24} />
              </div>
            )}
          </div>
          <div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
              {formData.category}
            </span>
            <h3 className="font-bold text-lg text-gray-900 leading-tight mt-1 mb-1">
              {formData.title}
            </h3>
            <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
              {formData.trainingType === "online" ? (
                <Laptop size={14} />
              ) : (
                <MapPin size={14} />
              )}
              {formData.trainingType === "online"
                ? "En Ligne"
                : formData.location}
            </div>
            <div className="text-emerald-600 font-bold text-xl">
              {formData.price
                ? `${Number(formData.price).toLocaleString()} FCFA`
                : "Gratuit"}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 grid grid-cols-2 gap-2">
          <div>
            <strong>Début :</strong> {formData.startDate || "À définir"}
          </div>
          <div>
            <strong>Durée :</strong> {formData.duration}h
          </div>
          <div className="col-span-2">
            <strong>Planning :</strong> {formData.schedule || "Non spécifié"}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={isEmbedded ? "w-full" : "min-h-screen bg-gray-50/50 pb-20"}>
      {/* HEADER */}
      {!isEmbedded && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-gray-900 flex items-center font-medium px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Retour
            </button>
            <h1 className="font-bold text-gray-800 text-lg hidden sm:block">
              Ajouter une formation
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      )}

      <div
        className={isEmbedded ? "mt-6" : "max-w-3xl mx-auto px-4 py-10"}
      ></div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <StepIndicator
          currentStep={currentStep}
          steps={["Général", "Détails", "Programme", "Validation"]}
        />

        <form onSubmit={(e) => e.preventDefault()} className="mt-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </AnimatePresence>

          {/* FOOTER ACTIONS */}
          <div className="mt-12 flex justify-between items-center pt-6 border-t border-gray-200">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl shadow-lg font-bold"
              >
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2"
              >
                Suivant <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2"
              >
                {loading ? "Publication..." : "Publier l'offre"}{" "}
                <Save size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourse;
