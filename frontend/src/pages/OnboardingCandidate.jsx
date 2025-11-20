import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";

const OnboardingCandidate = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    profession: "",
    age: "",
    phone: "",
    location: { city: "", country: "" },
    bio: "",
    skills: "",
  });

  // L'état 'scan' contiendra maintenant l'objet Fichier (File), pas une simple URL
  const [diplomas, setDiplomas] = useState([{ type: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Gère les changements sur les champs de profil simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "city" || name === "country") {
      setProfileData((prev) => ({
        ...prev,
        location: { ...prev.location, [name]: value },
      }));
    } else {
      setProfileData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Gère le changement du type de diplôme
  const handleDiplomaTypeChange = (index, value) => {
    const list = [...diplomas];
    list[index].type = value;
    setDiplomas(list);
  };

  // Ajoute une nouvelle ligne pour un diplôme
  const addDiplomaField = () => {
    setDiplomas([...diplomas, { type: "", scan: null }]);
  };

  // Supprime une ligne de diplôme
  const removeDiplomaField = (index) => {
    setDiplomas(diplomas.filter((_, i) => i !== index));
  };

  const handleSkip = () => navigate("/dashboard");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation côté client pour s'assurer que la profession est bien remplie
    if (!profileData.profession || profileData.profession.trim() === "") {
      setError("La profession est un champ obligatoire.");
      return; // On arrête la soumission si la validation échoue
    }

    setLoading(true);
    setError("");

    try {
      // 2. Création d'un simple objet JavaScript (payload) au lieu de FormData
      const payload = {
        profile: {
          // On inclut toutes les données du state
          ...profileData,

          // 3. On s'assure que les types de données sont corrects avant l'envoi

          // Convertit l'âge en nombre, ou le laisse non défini s'il est vide
          age: profileData.age ? Number(profileData.age) : undefined,

          // Transforme la chaîne de caractères "skills" en un tableau propre
          skills: profileData.skills
            .split(",") // Sépare par la virgule
            .map((skill) => skill.trim()) // Enlève les espaces superflus
            .filter(Boolean), // Retire les éléments vides (ex: "skill1, , skill2")

          // Transforme le tableau des diplômes pour correspondre au format attendu par le backend
          diplomas: diplomas
            .filter((d) => d.type && d.type.trim() !== "") // Garde uniquement les diplômes où un type a été sélectionné
            .map((d) => ({ type: d.type, scan: null })), // Formate chaque diplôme (scan est toujours null ici)
        },
      };

      // 4. Appel de l'API avec le payload JSON
      // Votre service apiService doit être configuré pour envoyer du 'application/json' par défaut
      await apiService.auth.updateProfile(payload);

      // 5. Mise à jour du contexte utilisateur et redirection
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      // Gestion des erreurs de l'API
      setError(
        err.response?.data?.error ||
          "Une erreur est survenue lors de la mise à jour."
      );
    } finally {
      // S'assure que l'état de chargement est réinitialisé, même en cas d'erreur
      setLoading(false);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");

  //   try {
  //     // On utilise FormData car nous envoyons des fichiers
  //     const formData = new FormData();

  //     // 1. Ajouter les données textuelles du profil
  //     // La clé doit correspondre à ce que le backend attend (ex: 'profile[profession]')
  //     formData.append("profile[profession]", profileData.profession);
  //     formData.append("profile[age]", profileData.age);
  //     formData.append("profile[phone]", profileData.phone);
  //     formData.append("profile[bio]", profileData.bio);
  //     formData.append("profile[location][city]", profileData.location.city);
  //     formData.append(
  //       "profile[location][country]",
  //       profileData.location.country
  //     );

  //     // 2. Ajouter les compétences (en tant que tableau)
  //     const skillsArray = profileData.skills
  //       .split(",")
  //       .map((s) => s.trim())
  //       .filter(Boolean);
  //     skillsArray.forEach((skill) =>
  //       formData.append("profile[skills][]", skill)
  //     );

  //     // 3. Gérer les diplômes et les fichiers uploadés
  //     const diplomaMetadata = [];
  //     diplomas.forEach((diploma) => {
  //       // On ne traite que les diplômes où un type est sélectionné
  //       if (diploma.type) {
  //         let scanData = null;
  //         // Si un fichier a été uploadé pour ce diplôme, on l'ajoute au FormData
  //         if (diploma.scan) {
  //           // Le nom 'diplomaScans' doit correspondre au nom attendu par multer
  //           formData.append("diplomaScans", diploma.scan, diploma.scan.name);
  //           // On garde une référence dans les métadonnées
  //           scanData = diploma.scan.name;
  //         }
  //         diplomaMetadata.push({ type: diploma.type, scan: scanData });
  //       }
  //     });

  //     // On envoie les métadonnées des diplômes en format JSON stringifié
  //     formData.append("diplomas", JSON.stringify(diplomaMetadata));

  //     // Le service api doit être configuré pour envoyer un 'multipart/form-data'
  //     await apiService.auth.updateProfile(formData);

  //     await refreshUser();
  //     navigate("/dashboard");
  //   } catch (err) {
  //     setError(
  //       err.response?.data?.error ||
  //         "Une erreur est survenue lors de la mise à jour."
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white shadow-lg rounded-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Finalisez votre profil</h2>
          <p className="text-sm text-gray-600 mt-2">
            Ces informations aideront les recruteurs à vous trouver.
          </p>
        </div>

        {error && <p className="text-red-500 text-center text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="profession"
              className="block text-sm font-medium text-gray-700"
            >
              Votre Profession
            </label>
            <input
              type="text"
              name="profession"
              id="profession"
              value={profileData.profession}
              onChange={handleChange}
              className="input input-bordered w-full mt-1"
              placeholder="Ex: Développeur Full-Stack"
            />
          </div>
          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-gray-700"
            >
              Âge
            </label>
            <input
              type="number"
              name="age"
              id="age"
              value={profileData.age}
              onChange={handleChange}
              className="input input-bordered w-full mt-1"
              placeholder="Votre âge"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                Ville
              </label>
              <input
                type="text"
                name="city"
                id="city"
                value={profileData.location.city}
                onChange={handleChange}
                className="input input-bordered w-full mt-1"
                placeholder="Ex: Paris"
              />
            </div>
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700"
              >
                Pays
              </label>
              <input
                type="text"
                name="country"
                id="country"
                value={profileData.location.country}
                onChange={handleChange}
                className="input input-bordered w-full mt-1"
                placeholder="Ex: France"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-700"
            >
              Compétences
            </label>
            <input
              type="text"
              name="skills"
              id="skills"
              value={profileData.skills}
              onChange={handleChange}
              className="input input-bordered w-full mt-1"
              placeholder="React, Node.js, Gestion de projet..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Séparez les compétences par des virgules.
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800">
              Diplômes et Certificats
            </h3>
            <div className="space-y-4 mt-2">
              {diplomas.map((diploma, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-gray-50 space-y-3"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-grow">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type de diplôme
                      </label>
                      <select
                        value={diploma.type}
                        onChange={(e) =>
                          handleDiplomaTypeChange(index, e.target.value)
                        }
                        className="select select-bordered w-full"
                      >
                        <option value="" disabled>
                          * Sélectionnez un type
                        </option>
                        <option value="CAMES">CAMES</option>
                        <option value="GCE">GCE</option>
                        <option value="HND">HND</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    {diplomas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDiplomaField(index)}
                        className="btn btn-sm btn-ghost mt-7"
                      >
                        X
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDiplomaField}
              className="btn btn-outline btn-sm mt-3"
            >
              + Ajouter un autre diplôme
            </button>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-semibold text-gray-600 hover:text-indigo-600"
            >
              Passer pour l'instant
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Enregistrement..." : "Terminer mon profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingCandidate;
