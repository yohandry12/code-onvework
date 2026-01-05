import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../services/api";
import { CheckCircle, ArrowLeft, Search, User } from "lucide-react";
import toast from "react-hot-toast";
import CreateCourse from "../CreateCourse"; // Vérifiez que ce chemin est correct selon votre structure

const AdminEditTraining = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- GESTION FORMATEUR (ADMIN) ---
  const [trainerSearchTerm, setTrainerSearchTerm] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [filteredTrainers, setFilteredTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);
  const trainerWrapperRef = useRef(null);

  // --- ÉTAT DES DONNÉES ---
  const [formData, setFormData] = useState(null);

  // Helper pour afficher le nom correctement
  const getTrainerName = (profile) => {
    if (!profile) return "Inconnu";
    return (
      profile.organizationName || `${profile.firstName} ${profile.lastName}`
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Charger les formateurs pour le sélecteur
        const trainersRes = await apiService.users.adminGetAll({
          role: "trainer",
          limit: 1000,
        });
        if (trainersRes.success) setTrainers(trainersRes.users || []);

        // 2. Si mode édition, charger la formation
        if (id) {
          const res = await apiService.trainings.adminGetById(id);
          if (res.success && res.training) {
            const t = res.training;

            // Pré-remplir le formateur
            if (t.trainer) {
              setSelectedTrainer(t.trainer);
              // On utilise le profil inclus (souvent trainerProfile)
              const profile = t.trainer.trainerProfile || t.trainer.profile;
              setTrainerSearchTerm(
                `${getTrainerName(profile)} (${t.trainer.email})`
              );
            }

            // --- MAPPING DES DONNÉES DB VERS FORMULAIRE ---
            setFormData({
              title: t.title || "",
              subtitle: t.subtitle || "",
              category: t.category || "",
              subCategory: t.subCategory || "",
              level: t.level || "Tous niveaux",
              language: t.language || "Français",

              // Logistique
              trainingType: t.trainingType || "online",
              // Important : Convertir la date ISO (DB) en YYYY-MM-DD (Input Date)
              startDate: t.startDate
                ? new Date(t.startDate).toISOString().split("T")[0]
                : "",
              location: t.location || "",
              schedule: t.schedule || "",

              price: t.price || "",
              discountPrice: t.discountPrice || "",
              // Convertir minutes (DB) en heures (Form)
              duration: t.duration ? Math.round(t.duration / 60) : "",

              description: t.description || "",
              thumbnail: t.thumbnail || "",
              certificateEnabled: t.certificateEnabled !== false, // Default true
              status: t.status || "draft",

              // Arrays
              objectives: t.objectives?.length > 0 ? t.objectives : [""],
              prerequisites:
                t.prerequisites?.length > 0 ? t.prerequisites : [""],

              // Modules & Leçons
              modules:
                t.modules?.map((m) => ({
                  id: m.id, // On garde l'ID pour l'update
                  title: m.title,
                  lessons:
                    m.lessons?.map((l) => ({
                      id: l.id, // On garde l'ID pour l'update
                      title: l.title,
                      type: "text", // On force le type texte selon la nouvelle logique
                      // Le contenu de la description est stocké dans 'content'
                      description: l.content || "",
                    })) || [],
                })) || [],
            });
          } else {
            toast.error("Formation introuvable");
            navigate("/admin/trainings");
          }
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

  // --- GESTIONNAIRE DE SOUMISSION ---
  const handleAdminUpdate = async (payload) => {
    // Si création (pas d'ID) et pas de formateur sélectionné
    if (!id && !selectedTrainer && !payload.trainerId) {
      toast.error("Veuillez assigner un formateur.");
      return { success: false };
    }

    setSaving(true);
    const toastId = toast.loading(
      id ? "Mise à jour en cours..." : "Création en cours..."
    );

    try {
      // On injecte le formateur sélectionné dans le payload
      const finalPayload = {
        ...payload,
        trainerId: selectedTrainer ? selectedTrainer.id : payload.trainerId,
        // On s'assure que le statut est conservé ou mis à jour si besoin
        status: formData?.status || "draft",
      };

      let res;
      if (id) {
        // Mode ÉDITION
        res = await apiService.trainings.adminUpdate(id, finalPayload);
      } else {
        // Mode CRÉATION (via Admin)
        res = await apiService.trainings.create(finalPayload);
      }

      if (res.success) {
        toast.success(id ? "Formation mise à jour !" : "Formation créée !", {
          id: toastId,
        });
        navigate("/admin/trainings");
        return { success: true, res };
      } else {
        throw new Error(res.error || "Erreur inconnue");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Erreur lors de l'opération", { id: toastId });
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  // --- UI POUR LE SÉLECTEUR DE FORMATEUR ---
  const handleSearchTrainer = (e) => {
    const term = e.target.value;
    setTrainerSearchTerm(term);
    setShowTrainerDropdown(true);
    if (term) {
      const lower = term.toLowerCase();
      setFilteredTrainers(
        trainers.filter((t) => {
          // On cherche dans firstName, lastName ou organizationName
          const p = t.profile || t.trainerProfile; // Adapter selon ce que renvoie l'API user search
          if (!p) return t.email.toLowerCase().includes(lower);

          return (
            t.email.toLowerCase().includes(lower) ||
            p.firstName?.toLowerCase().includes(lower) ||
            p.lastName?.toLowerCase().includes(lower) ||
            p.organizationName?.toLowerCase().includes(lower)
          );
        })
      );
    } else {
      setFilteredTrainers([]);
    }
  };

  // Fermeture du dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        trainerWrapperRef.current &&
        !trainerWrapperRef.current.contains(event.target)
      ) {
        setShowTrainerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [trainerWrapperRef]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-5xl px-4">
        {/* En-tête */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/admin/trainings")}
              className="text-gray-500 hover:text-gray-900 flex items-center font-medium transition-colors px-3 py-1 rounded-lg hover:bg-gray-200 mb-2 -ml-3"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Retour à la liste
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? "Modifier la formation" : "Créer une formation (Admin)"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {id
                ? "Mettez à jour les informations, le programme ou la logistique."
                : "Sélectionnez le formateur puis remplissez les détails."}
            </p>
          </div>
        </div>

        {/* Sélecteur de Formateur */}
        <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            Propriétaire de la formation
          </label>

          <div className="relative" ref={trainerWrapperRef}>
            <div className="relative">
              <input
                type="text"
                value={trainerSearchTerm}
                onChange={handleSearchTrainer}
                onFocus={() =>
                  trainerSearchTerm && setShowTrainerDropdown(true)
                }
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                placeholder="Rechercher par nom, établissement ou email..."
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            {showTrainerDropdown && filteredTrainers.length > 0 && (
              <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 max-h-60 overflow-y-auto">
                {filteredTrainers.map((trainer) => {
                  const profile = trainer.profile || trainer.trainerProfile;
                  return (
                    <li
                      key={trainer.id}
                      onClick={() => {
                        setSelectedTrainer(trainer);
                        setTrainerSearchTerm(
                          `${getTrainerName(profile)} (${trainer.email})`
                        );
                        setShowTrainerDropdown(false);
                      }}
                      className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="font-semibold text-gray-800">
                        {getTrainerName(profile)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trainer.email} •{" "}
                        {profile?.trainerType === "training_center"
                          ? "Centre"
                          : "Indépendant"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {selectedTrainer && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 animate-fade-in">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-0.5">
                    Sélectionné
                  </p>
                  <p className="font-medium">
                    {getTrainerName(
                      selectedTrainer.profile || selectedTrainer.trainerProfile
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire de création/édition AVEC MODE EMBEDDED */}
        {(!id || formData) && (
          <CreateCourse
            trainerId={selectedTrainer ? selectedTrainer.id : null}
            initialData={formData} // Passe les données pré-remplies
            onSubmit={handleAdminUpdate} // Passe la fonction de soumission admin
            isEmbedded={true} // <--- ACTIVE LE MODE INTÉGRÉ (Cache le header interne)
          />
        )}
      </div>
    </div>
  );
};

export default AdminEditTraining;
