import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Video,
  FileText,
  CheckCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Layers,
  MonitorPlay,
  Clock,
  Globe,
  Tag,
  Award,
  AlertCircle,
  User,
  Search,
  LayoutList,
  HelpCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// --- COMPOSANT : Indicateur d'étape ---
const StepIndicator = ({ currentStep, steps }) => (
  <div className="mb-10">
    <div className="flex justify-between items-center relative z-0">
      {/* Ligne de fond */}
      <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
      {/* Ligne de progression */}
      <div
        className="absolute left-0 top-1/2 h-1 bg-emerald-500 -z-10 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      ></div>

      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

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
              {isCompleted ? <CheckCircle className="w-5 h-5" /> : index}
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

// Helper URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  const baseUrl = apiUrl.replace(/\/api$/, "");
  return `${baseUrl}${path}`;
};

const AdminEditTraining = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // On commence à 0 pour l'étape Formateur
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- GESTION FORMATEUR ---
  const [trainerSearchTerm, setTrainerSearchTerm] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const trainerWrapperRef = useRef(null);

  // --- STATE FORMULAIRE ---
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    category: "",
    subCategory: "",
    level: "Débutant",
    language: "Français",
    price: "",
    discountPrice: "",
    duration: "", // Heures
    description: "",
    thumbnail: "",
    certificateEnabled: true,
    objectives: [""],
    prerequisites: [""],
    status: "draft",
    modules: [],
  });

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Charger la liste des formateurs
        const trainersRes = await apiService.users.adminGetAll({
          role: "trainer",
          limit: 1000,
        });
        if (trainersRes.success) setTrainers(trainersRes.users);

        // 2. Charger la formation complète
        const res = await apiService.trainings.adminGetById(id);

        if (res.success && res.training) {
          const t = res.training;

          // Pré-sélection du formateur
          if (t.trainer) {
            setSelectedTrainer(t.trainer);
            setTrainerSearchTerm(
              `${t.trainer.trainerProfile?.firstName || ""} ${
                t.trainer.trainerProfile?.lastName || ""
              } (${t.trainer.email})`
            );
          }

          // Pré-remplissage du formulaire
          setFormData({
            title: t.title || "",
            subtitle: t.subtitle || "",
            category: t.category || "",
            subCategory: t.subCategory || "",
            level: t.level || "Débutant",
            language: t.language || "Français",
            price: t.price || "",
            discountPrice: t.discountPrice || "",
            duration: t.duration ? Math.round(t.duration / 60) : "", // Minutes -> Heures pour l'input
            description: t.description || "",
            thumbnail: t.thumbnail || "",
            certificateEnabled: t.certificateEnabled,
            status: t.status,
            objectives: t.objectives?.length > 0 ? t.objectives : [""],
            prerequisites: t.prerequisites?.length > 0 ? t.prerequisites : [""],

            // Mapping profond des modules et leçons
            modules:
              t.modules?.map((m) => ({
                id: m.id, // Important pour l'update
                title: m.title,
                description: m.description || "",
                lessons:
                  m.lessons?.map((l) => ({
                    id: l.id, // Important pour l'update
                    title: l.title,
                    type: l.type,
                    videoUrl: l.videoUrl || "",
                    content: l.content || "",
                    duration: l.duration || 5,
                    quizData: l.quizData || [],
                  })) || [],
              })) || [],
          });
        } else {
          toast.error("Formation introuvable");
          navigate("/admin/trainings");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // --- HANDLERS GÉNÉRAUX ---
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

  // --- HANDLERS TABLEAUX SIMPLES ---
  const updateArrayItem = (arr, idx, val) => {
    const newArr = [...formData[arr]];
    newArr[idx] = val;
    setFormData({ ...formData, [arr]: newArr });
  };
  const removeArrayItem = (arr, idx) =>
    setFormData({
      ...formData,
      [arr]: formData[arr].filter((_, i) => i !== idx),
    });
  const addArrayItem = (arr) =>
    setFormData({ ...formData, [arr]: [...formData[arr], ""] });

  // --- HANDLERS MODULES & LEÇONS ---
  const addModule = () =>
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        { title: `Module ${formData.modules.length + 1}`, lessons: [] },
      ],
    });
  const updateModule = (idx, field, val) => {
    const m = [...formData.modules];
    m[idx][field] = val;
    setFormData({ ...formData, modules: m });
  };
  const removeModule = (idx) =>
    setFormData({
      ...formData,
      modules: formData.modules.filter((_, i) => i !== idx),
    });

  const addLesson = (mIdx) => {
    const m = [...formData.modules];
    m[mIdx].lessons.push({
      title: "Nouvelle leçon",
      type: "video",
      duration: 5,
      quizData: [],
    });
    setFormData({ ...formData, modules: m });
  };
  const updateLesson = (mIdx, lIdx, field, val) => {
    const m = [...formData.modules];
    m[mIdx].lessons[lIdx][field] = val;
    setFormData({ ...formData, modules: m });
  };
  const removeLesson = (mIdx, lIdx) => {
    const m = [...formData.modules];
    m[mIdx].lessons = m[mIdx].lessons.filter((_, i) => i !== lIdx);
    setFormData({ ...formData, modules: m });
  };

  // --- HANDLERS QUIZ ---
  const addQuizQuestion = (modIdx, lesIdx) => {
    const newMods = [...formData.modules];
    const currentQuiz = newMods[modIdx].lessons[lesIdx].quizData || [];
    currentQuiz.push({ question: "", options: ["", ""], correct: 0 });
    newMods[modIdx].lessons[lesIdx].quizData = currentQuiz;
    setFormData({ ...formData, modules: newMods });
  };
  const updateQuizQuestion = (modIdx, lesIdx, qIdx, field, val) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons[lesIdx].quizData[qIdx][field] = val;
    setFormData({ ...formData, modules: newMods });
  };
  const updateQuizOption = (modIdx, lesIdx, qIdx, oIdx, val) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons[lesIdx].quizData[qIdx].options[oIdx] = val;
    setFormData({ ...formData, modules: newMods });
  };
  const addQuizOption = (modIdx, lesIdx, qIdx) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons[lesIdx].quizData[qIdx].options.push("");
    setFormData({ ...formData, modules: newMods });
  };
  const removeQuizQuestion = (modIdx, lesIdx, qIdx) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons[lesIdx].quizData = newMods[modIdx].lessons[
      lesIdx
    ].quizData.filter((_, i) => i !== qIdx);
    setFormData({ ...formData, modules: newMods });
  };

  // --- SOUMISSION UPDATE ---
  const handleUpdate = async () => {
    if (!selectedTrainer) return toast.error("Veuillez assigner un formateur.");

    setSaving(true);
    const toastId = toast.loading("Mise à jour en cours...");

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        discountPrice: parseFloat(formData.discountPrice) || 0,
        duration: (parseInt(formData.duration) || 0) * 60, // Heures -> Minutes
        objectives: formData.objectives.filter((o) => o.trim() !== ""),
        prerequisites: formData.prerequisites.filter((p) => p.trim() !== ""),
        trainerId: selectedTrainer.id, // ID du formateur
        modules: formData.modules, // Le backend gèrera le nested update
      };

      const res = await apiService.trainings.adminUpdate(id, payload);
      if (res.success) {
        toast.success("Formation mise à jour !", { id: toastId });
        navigate("/admin/trainings");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // --- NAVIGATION ---
  const nextStep = () => {
    if (currentStep === 1 && !formData.title)
      return toast.error("Le titre est requis");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo(0, 0);
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // --- RENDER STEPS ---

  // ÉTAPE 0 : Formateur
  const renderStep0 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6 flex items-start gap-4">
        <div className="p-3 bg-white rounded-full shadow-sm text-indigo-600">
          <User size={24} />
        </div>
        <div>
          <h3 className="text-indigo-900 font-bold text-lg">
            Propriétaire de la formation
          </h3>
          <p className="text-indigo-700 text-sm">
            Sélectionnez le formateur responsable de ce cours.
          </p>
        </div>
      </div>

      <div
        className="relative bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        ref={trainerWrapperRef}
      >
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Formateur assigné *
        </label>
        <div className="relative">
          <input
            type="text"
            value={trainerSearchTerm}
            onChange={(e) => {
              const term = e.target.value;
              setTrainerSearchTerm(term);
              setShowTrainerDropdown(true);
              if (term) {
                const lower = term.toLowerCase();
                setFilteredTrainers(
                  trainers.filter(
                    (t) =>
                      t.email.toLowerCase().includes(lower) ||
                      t.profile?.firstName?.toLowerCase().includes(lower) ||
                      t.profile?.lastName?.toLowerCase().includes(lower)
                  )
                );
              } else setFilteredTrainers([]);
            }}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            placeholder="Rechercher par nom ou email..."
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {showTrainerDropdown && filteredTrainers.length > 0 && (
          <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto">
            {filteredTrainers.map((trainer) => (
              <li
                key={trainer.id}
                onClick={() => {
                  setSelectedTrainer(trainer);
                  setTrainerSearchTerm(
                    `${trainer.profile?.firstName} ${trainer.profile?.lastName} (${trainer.email})`
                  );
                  setShowTrainerDropdown(false);
                }}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <span className="font-semibold text-gray-800">
                  {trainer.profile?.firstName} {trainer.profile?.lastName}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({trainer.email})
                </span>
              </li>
            ))}
          </ul>
        )}

        {selectedTrainer && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span>
              Formateur sélectionné :{" "}
              <strong>
                {selectedTrainer.profile?.firstName}{" "}
                {selectedTrainer.profile?.lastName}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // ÉTAPE 1 : Infos de base
  const renderStep1 = () => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-4 flex items-center gap-2">
        <BookOpen className="text-emerald-600" /> Informations Générales
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Titre
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input input-bordered w-full rounded-xl"
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
            className="input input-bordered w-full rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Catégorie
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input input-bordered w-full rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Statut (Admin)
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="select select-bordered w-full rounded-xl bg-white"
            >
              <option value="draft">Brouillon</option>
              <option value="pending">En attente</option>
              <option value="published">Publié</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Prix (FCFA)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="input input-bordered w-full rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Prix Promo
            </label>
            <input
              type="number"
              name="discountPrice"
              value={formData.discountPrice}
              onChange={handleChange}
              className="input input-bordered w-full rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Durée (Heures)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="input input-bordered w-full rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Niveau</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="select select-bordered w-full rounded-xl"
            >
              <option>Débutant</option>
              <option>Intermédiaire</option>
              <option>Avancé</option>
              <option>Tous niveaux</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // ÉTAPE 2 : Détails
  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
          <ImageIcon className="text-emerald-600" /> Médias & Description
        </h2>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-semibold mb-2">
              Couverture
            </label>
            <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl overflow-hidden h-40 flex items-center justify-center bg-gray-50 hover:bg-emerald-50 transition-colors">
              {formData.thumbnail ? (
                <img
                  src={getImageUrl(formData.thumbnail)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-10 h-10 text-gray-300" />
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => handleUpload(e, "thumbnail")}
              />
            </div>
          </div>
          <div className="flex-grow">
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="textarea textarea-bordered w-full h-40 rounded-xl text-base"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-emerald-500" /> Objectifs
          </h3>
          {formData.objectives.map((o, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={o}
                onChange={(e) =>
                  updateArrayItem("objectives", i, e.target.value)
                }
                className="input input-sm input-bordered w-full rounded-lg"
              />
              <button onClick={() => removeArrayItem("objectives", i)}>
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem("objectives")}
            className="text-xs font-bold text-emerald-600 mt-2"
          >
            + Ajouter
          </button>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-orange-500" /> Pré-requis
          </h3>
          {formData.prerequisites.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={p}
                onChange={(e) =>
                  updateArrayItem("prerequisites", i, e.target.value)
                }
                className="input input-sm input-bordered w-full rounded-lg"
              />
              <button onClick={() => removeArrayItem("prerequisites", i)}>
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem("prerequisites")}
            className="text-xs font-bold text-emerald-600 mt-2"
          >
            + Ajouter
          </button>
        </div>
      </div>
    </div>
  );

  // ÉTAPE 3 : Programme (Liste complète)
  const renderStep3 = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold">Programme</h2>
          <p className="text-gray-400 text-sm">
            Structurez le contenu du cours.
          </p>
        </div>
        <button
          onClick={addModule}
          className="btn bg-white text-gray-900 hover:bg-gray-100 border-none"
        >
          + Module
        </button>
      </div>

      <div className="space-y-6">
        {formData.modules.map((mod, mIndex) => (
          <div
            key={mIndex}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
              <Layers className="text-gray-400" />
              <input
                value={mod.title}
                onChange={(e) => updateModule(mIndex, "title", e.target.value)}
                className="bg-transparent font-bold text-lg w-full outline-none"
                placeholder="Titre du module"
              />
              <button
                onClick={() => removeModule(mIndex)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {mod.lessons.map((les, lIndex) => (
                <div
                  key={lIndex}
                  className="border border-gray-200 rounded-xl p-4 bg-white hover:border-emerald-300 transition-all"
                >
                  <div className="flex gap-4 mb-3">
                    <input
                      value={les.title}
                      onChange={(e) =>
                        updateLesson(mIndex, lIndex, "title", e.target.value)
                      }
                      className="input input-sm input-bordered flex-grow font-medium"
                      placeholder="Titre leçon"
                    />
                    <select
                      value={les.type}
                      onChange={(e) =>
                        updateLesson(mIndex, lIndex, "type", e.target.value)
                      }
                      className="select select-sm select-bordered w-32"
                    >
                      <option value="video">Vidéo</option>
                      <option value="text">Texte</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    <div className="w-24 relative">
                      <input
                        type="number"
                        value={les.duration}
                        onChange={(e) =>
                          updateLesson(
                            mIndex,
                            lIndex,
                            "duration",
                            e.target.value
                          )
                        }
                        className="input input-sm input-bordered w-full pl-8"
                      />
                      <Clock className="w-3 h-3 absolute left-2 top-2.5 text-gray-400" />
                    </div>
                    <button
                      onClick={() => removeLesson(mIndex, lIndex)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Contenu Dynamique */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {les.type === "video" && (
                      <input
                        type="text"
                        value={les.videoUrl}
                        onChange={(e) =>
                          updateLesson(
                            mIndex,
                            lIndex,
                            "videoUrl",
                            e.target.value
                          )
                        }
                        className="input input-sm input-bordered w-full"
                        placeholder="URL Vidéo"
                      />
                    )}
                    {les.type === "text" && (
                      <textarea
                        value={les.content}
                        onChange={(e) =>
                          updateLesson(
                            mIndex,
                            lIndex,
                            "content",
                            e.target.value
                          )
                        }
                        className="textarea textarea-bordered w-full h-24"
                        placeholder="Contenu texte..."
                      />
                    )}
                    {les.type === "quiz" && (
                      <div className="space-y-3">
                        {les.quizData?.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="bg-white p-3 rounded border border-gray-200 relative"
                          >
                            <button
                              onClick={() =>
                                removeQuizQuestion(mIndex, lIndex, qIdx)
                              }
                              className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                            >
                              <XCircle size={16} />
                            </button>
                            <input
                              value={q.question}
                              onChange={(e) =>
                                updateQuizQuestion(
                                  mIndex,
                                  lIndex,
                                  qIdx,
                                  "question",
                                  e.target.value
                                )
                              }
                              className="w-full font-medium border-b border-gray-200 mb-2 pb-1 outline-none"
                              placeholder="Question ?"
                            />
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="flex gap-2 items-center mb-1"
                              >
                                <input
                                  type="radio"
                                  name={`q-${mIndex}-${lIndex}-${qIdx}`}
                                  checked={q.correct === oIdx}
                                  onChange={() =>
                                    updateQuizQuestion(
                                      mIndex,
                                      lIndex,
                                      qIdx,
                                      "correct",
                                      oIdx
                                    )
                                  }
                                />
                                <input
                                  value={opt}
                                  onChange={(e) =>
                                    updateQuizOption(
                                      mIndex,
                                      lIndex,
                                      qIdx,
                                      oIdx,
                                      e.target.value
                                    )
                                  }
                                  className="input input-xs input-bordered flex-grow"
                                  placeholder={`Option ${oIdx + 1}`}
                                />
                              </div>
                            ))}
                            <button
                              onClick={() =>
                                addQuizOption(mIndex, lIndex, qIdx)
                              }
                              className="text-xs text-blue-500 mt-1 hover:underline"
                            >
                              + Option
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addQuizQuestion(mIndex, lIndex)}
                          className="btn btn-xs btn-outline btn-primary"
                        >
                          + Question
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => addLesson(mIndex)}
                className="btn btn-sm btn-ghost w-full border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
              >
                + Ajouter une leçon
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="text-center py-10 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in zoom-in duration-300">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Prêt à mettre à jour ?
      </h2>
      <p className="text-gray-500 max-w-md mx-auto">
        Toutes les modifications ont été enregistrées localement. Cliquez sur
        valider pour appliquer les changements en base de données.
      </p>

      <div className="mt-8 bg-gray-50 p-6 rounded-xl max-w-lg mx-auto text-left border border-gray-200">
        <h3 className="font-bold text-gray-800">{formData.title}</h3>
        <p className="text-sm text-gray-500 mb-2">{formData.subtitle}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-emerald-600 font-bold">
            {formData.price} FCFA
          </span>
          <span className="text-xs bg-gray-200 px-2 py-1 rounded uppercase font-semibold text-gray-600">
            {formData.status}
          </span>
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/trainings")}
            className="text-gray-500 hover:text-gray-900 flex items-center font-medium transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </button>
          <h1 className="font-bold text-gray-800 text-lg hidden sm:block">
            Édition Formation (Admin)
          </h1>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <StepIndicator
          currentStep={currentStep}
          steps={["Formateur", "Infos", "Détails", "Programme", "Validation"]}
        />

        <form onSubmit={(e) => e.preventDefault()} className="mt-8">
          <AnimatePresence mode="wait">
            {currentStep === 0 && renderStep0()}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </AnimatePresence>

          <div className="mt-12 flex justify-between items-center pt-6 border-t border-gray-200">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 rounded-xl shadow-sm"
              >
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl shadow-lg"
              >
                Suivant <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="btn bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-xl flex items-center font-bold"
              >
                {saving ? "Sauvegarde..." : "Mettre à jour"}{" "}
                <Save size={20} className="ml-2" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditTraining;
