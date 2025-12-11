import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
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
  GripVertical,
  LayoutList,
  Layers,
  MonitorPlay,
  HelpCircle,
  CheckSquare,
  XCircle,
  Clock,
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

// Helper pour construire l'URL complète de l'image
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path; // C'est déjà une URL complète

  // Récupérer l'URL de base de l'API (ex: http://localhost:4000/api)
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

  // On retire le "/api" à la fin car nos chemins incluent déjà "/api/uploads"
  // Si votre VITE_API_URL est "http://localhost:4000/api", baseUrl devient "http://localhost:4000"
  const baseUrl = apiUrl.replace(/\/api$/, "");

  return `${baseUrl}${path}`;
};

// --- COMPOSANT PRINCIPAL ---
const CreateCourse = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    level: "Débutant",
    price: "",
    duration: "",
    description: "",
    thumbnail: "",
    objectives: [""],
    modules: [
      {
        title: "Module 1 : Introduction",
        description: "",
        lessons: [
          {
            title: "Bienvenue",
            type: "video",
            videoUrl: "",
            duration: 5,
            quizData: [],
          },
        ],
      },
    ],
  });

  // --- LOGIQUE (Identique à avant, juste nettoyée) ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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

  // Helpers Modules
  const addModule = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        { title: `Module ${formData.modules.length + 1}`, lessons: [] },
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

  // Helpers Leçons
  const addLesson = (modIdx) => {
    const newMods = [...formData.modules];
    newMods[modIdx].lessons.push({
      title: "",
      type: "video",
      videoUrl: "",
      content: "",
      duration: 5,
      quizData: [],
    });
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

  // --- HELPERS QUIZ (Logique Complexe) ---
  const addQuizQuestion = (modIdx, lesIdx) => {
    const newMods = [...formData.modules];
    const currentQuiz = newMods[modIdx].lessons[lesIdx].quizData || [];
    currentQuiz.push({ question: "", options: ["", ""], correct: 0 }); // Par défaut 2 options
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        // Conversion de la durée totale en minutes pour le backend
        // Si l'utilisateur entre "10" (heures), on envoie 600 minutes
        duration: (parseInt(formData.duration) || 0) * 60,
        objectives: formData.objectives.filter((o) => o.trim() !== ""),
        modules: formData.modules.map((m) => ({
          ...m,
          lessons: m.lessons.filter((l) => l.title.trim() !== ""),
        })),
      };
      const res = await apiService.trainings.create(payload);
      if (res.success) {
        toast.success("Formation créée !");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Erreur création.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.title)
      return toast.error("Titre requis");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo(0, 0);
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // --- RENDU DES ÉTAPES (Design Amélioré) ---

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100/50">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <BookOpen size={20} />
          </span>
          Informations de base
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Titre de la formation
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              placeholder="Ex: Devenir Expert React en 30 jours"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Catégorie
              </label>
              <div className="relative">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none appearance-none bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Développement">Développement</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-gray-500">
                  <LayoutList size={16} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Niveau
              </label>
              <div className="relative">
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none appearance-none bg-white"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Prix (FCFA)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400">
                  <DollarSign size={18} />
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Ex: 15000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Durée estimée (Heures)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400">
                  <Clock size={18} />
                </span>
                <input
                  type="number"
                  name="duration" // Correspond au state ajouté
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Ex: 10"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Upload & Description */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100/50">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <ImageIcon size={20} />
          </span>
          Médias & Présentation
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Image de couverture
          </label>
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-emerald-50 hover:border-emerald-400 transition-all group relative overflow-hidden">
            {formData.thumbnail ? (
              <>
                <img
                  src={getImageUrl(formData.thumbnail)}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium flex items-center">
                    <ImageIcon className="mr-2" /> Changer l'image
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 group-hover:text-emerald-600 transition-colors">
                <ImageIcon className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">
                  Cliquez ou glissez une image ici
                </p>
                <p className="text-xs mt-1 text-gray-400">JPG, PNG (Max 5Mo)</p>
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Description détaillée
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
            placeholder="De quoi parle votre formation ?..."
          ></textarea>
        </div>
      </div>

      {/* Objectifs */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100/50">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <CheckCircle size={20} />
          </span>
          Objectifs Pédagogiques
        </h2>
        <div className="space-y-3">
          {formData.objectives.map((obj, index) => (
            <div key={index} className="flex gap-3 items-center group">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <input
                type="text"
                value={obj}
                onChange={(e) =>
                  updateArrayItem("objectives", index, e.target.value)
                }
                className="flex-grow px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
                placeholder="Ex: Maîtriser les Hooks..."
              />
              <button
                onClick={() => removeArrayItem("objectives", index)}
                className="text-gray-300 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setFormData({
                ...formData,
                objectives: [...formData.objectives, ""],
              })
            }
            className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 py-2 px-3 rounded-lg hover:bg-emerald-50 transition-colors w-fit"
          >
            <Plus size={16} /> Ajouter un objectif
          </button>
        </div>
      </div>
    </motion.div>
  );

  // ÉTAPE 3 : PROGRAMME (Design "Liste Propre")
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 bg-emerald-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-1">Programme</h2>
          <p className="text-emerald-100 text-sm">
            Contruisez vos modules, leçons et quiz.
          </p>
        </div>
        <button
          onClick={addModule}
          className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Nouveau Module
        </button>
      </div>

      <div className="space-y-6">
        {formData.modules.map((module, mIndex) => (
          <div
            key={mIndex}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
          >
            {/* Header Module */}
            <div className="bg-gray-50/80 p-4 border-b border-gray-200 flex items-center gap-4">
              <div className="flex-shrink-0 cursor-grab text-gray-400">
                <Layers size={20} />
              </div>
              <div className="flex-grow">
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) =>
                    updateModule(mIndex, "title", e.target.value)
                  }
                  className="bg-transparent font-bold text-gray-800 text-lg w-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1 transition-all"
                  placeholder="Titre du module"
                />
              </div>
              <button
                onClick={() => removeModule(mIndex)}
                className="text-gray-400 hover:text-red-500 p-2"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Liste des leçons */}
            <div className="p-4 bg-white space-y-4">
              {module.lessons.map((lesson, lIndex) => (
                <div
                  key={lIndex}
                  className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-all bg-white"
                >
                  {/* Ligne principale : Titre & Type */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-grow">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                        Titre de la leçon
                      </label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(mIndex, lIndex, "title", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none font-medium"
                        placeholder="Titre..."
                      />
                    </div>
                    <div className="md:w-1/4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                        Type
                      </label>
                      <select
                        value={lesson.type}
                        onChange={(e) =>
                          updateLesson(mIndex, lIndex, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none bg-white"
                      >
                        <option value="video">🎥 Vidéo</option>
                        <option value="text">📄 Texte / Article</option>
                        <option value="quiz">❓ Quiz</option>
                      </select>
                    </div>

                    {/* Durée (Nouveau champ) */}
                    <div className="md:w-1/6">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                        Durée (min)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={lesson.duration}
                          onChange={(e) =>
                            updateLesson(
                              mIndex,
                              lIndex,
                              "duration",
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none"
                        />
                        <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">
                          <Clock size={14} />
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeLesson(mIndex, lIndex)}
                        className="text-gray-300 hover:text-red-500 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* --- ZONE DE CONTENU DYNAMIQUE --- */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {/* CAS 1 : VIDEO */}
                    {lesson.type === "video" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          URL DE LA VIDÉO
                        </label>
                        <div className="flex items-center">
                          <MonitorPlay
                            className="text-gray-400 mr-2"
                            size={18}
                          />
                          <input
                            type="text"
                            placeholder="Ex: https://vimeo.com/..."
                            value={lesson.videoUrl}
                            onChange={(e) =>
                              updateLesson(
                                mIndex,
                                lIndex,
                                "videoUrl",
                                e.target.value
                              )
                            }
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* CAS 2 : TEXTE */}
                    {lesson.type === "text" && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          CONTENU DU COURS
                        </label>
                        <textarea
                          rows="6"
                          value={lesson.content || ""}
                          onChange={(e) =>
                            updateLesson(
                              mIndex,
                              lIndex,
                              "content",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 outline-none text-sm font-mono"
                          placeholder="Écrivez votre cours ici (Markdown supporté)..."
                        ></textarea>
                      </div>
                    )}

                    {/* CAS 3 : QUIZ */}
                    {lesson.type === "quiz" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-gray-500">
                            QUESTIONS DU QUIZ
                          </label>
                          <button
                            onClick={() => addQuizQuestion(mIndex, lIndex)}
                            className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition"
                          >
                            + Ajouter Question
                          </button>
                        </div>

                        {(!lesson.quizData || lesson.quizData.length === 0) && (
                          <p className="text-sm text-gray-400 italic text-center py-2">
                            Aucune question pour le moment.
                          </p>
                        )}

                        {lesson.quizData &&
                          lesson.quizData.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="bg-white p-3 rounded border border-gray-200 shadow-sm relative"
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
                                type="text"
                                placeholder={`Question ${qIdx + 1}`}
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
                                className="w-full font-medium border-b border-gray-200 focus:border-emerald-500 outline-none pb-1 mb-3 text-sm"
                              />

                              <div className="space-y-2">
                                {q.options.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="radio"
                                      name={`correct-${mIndex}-${lIndex}-${qIdx}`}
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
                                      className="accent-emerald-600"
                                    />
                                    <input
                                      type="text"
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
                                      className="flex-grow text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded focus:border-emerald-300 outline-none"
                                      placeholder={`Option ${oIdx + 1}`}
                                    />
                                  </div>
                                ))}
                                <button
                                  onClick={() =>
                                    addQuizOption(mIndex, lIndex, qIdx)
                                  }
                                  className="text-[10px] text-gray-400 hover:text-emerald-600 underline ml-6"
                                >
                                  + Ajouter une option
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={() => addLesson(mIndex)}
                className="w-full py-2.5 mt-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Ajouter une leçon
              </button>
            </div>
          </div>
        ))}
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
        <h2 className="text-3xl font-bold text-gray-900">Tout est prêt !</h2>
        <p className="text-gray-500 text-lg">
          Votre formation{" "}
          <span className="font-bold text-gray-800">
            "{formData.title || "Sans titre"}"
          </span>{" "}
          est prête à être publiée.
        </p>
      </div>

      {/* Carte Récap */}
      <div className="max-w-xl mx-auto bg-white p-4 rounded-2xl shadow-xl border border-gray-100 transform transition-transform hover:-translate-y-1">
        <div className="flex gap-5">
          <div className="w-32 h-24 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
            {formData.thumbnail ? (
              <img
                src={getImageUrl(formData.thumbnail)}
                className="w-full h-full object-cover"
                alt="Preview"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                <ImageIcon size={24} />
              </div>
            )}
          </div>
          <div className="flex-grow text-left flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                {formData.category || "Général"}
              </span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 line-clamp-1">
              {formData.title || "Titre de la formation"}
            </h3>
            <div className="text-emerald-600 font-bold text-xl">
              {formData.price
                ? `${Number(formData.price).toLocaleString()} FCFA`
                : "Gratuit"}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500 px-2">
          <span className="flex items-center">
            <Layers size={16} className="mr-1.5" /> {formData.modules.length}{" "}
            Modules
          </span>
          <span className="flex items-center">
            <MonitorPlay size={16} className="mr-1.5" />{" "}
            {formData.modules.reduce((acc, m) => acc + m.lessons.length, 0)}{" "}
            Leçons
          </span>
          <span className="flex items-center capitalize">
            <BookOpen size={16} className="mr-1.5" /> {formData.level}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* HEADER FIXE */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-900 flex items-center font-medium transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </button>
          <h1 className="font-bold text-gray-800 text-lg hidden sm:block">
            Créer une formation
          </h1>
          <div className="w-24"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <StepIndicator
          currentStep={currentStep}
          steps={["Infos", "Détails", "Programme", "Validation"]}
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
                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl shadow-xl shadow-emerald-200 transform hover:scale-105 transition-all text-lg font-bold flex items-center gap-2"
              >
                Précédent
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-emerald-200 transform hover:scale-105 transition-all text-lg font-bold flex items-center gap-2"
              >
                Suivant <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl shadow-xl shadow-emerald-200 transform hover:scale-105 transition-all text-lg font-bold flex items-center gap-2"
              >
                {loading ? "Publication..." : "Publier maintenant"}{" "}
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
