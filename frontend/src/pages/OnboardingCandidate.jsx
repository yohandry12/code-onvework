import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import { CameraIcon, MapPinIcon } from "@heroicons/react/24/solid";

const OnboardingCandidate = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    profession: "",
    phone: "",
    location: { city: "", country: "Cameroun" },
    bio: "",
    skills: "",
    address: "",
  });

  const [diplomas, setDiplomas] = useState([{ type: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // --- LOGIQUE AUTOCOMPLÉTION VILLE (Ajout) ---
  const [allCities, setAllCities] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // 1. Charger les villes au montage
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

  // 2. Gestionnaire spécifique pour l'input ville
  const handleCityInputChange = (e) => {
    const userInput = e.target.value;

    // Mise à jour du state principal (structure imbriquée)
    setProfileData((prev) => ({
      ...prev,
      location: { ...prev.location, city: userInput },
    }));

    // Filtrage des suggestions
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

  // 3. Sélection d'une ville dans la liste
  const selectCity = (cityName) => {
    setProfileData((prev) => ({
      ...prev,
      location: { ...prev.location, city: cityName },
    }));
    setShowSuggestions(false);
  };

  // 4. Fermer si clic en dehors
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

  // --- UTILITAIRE URL AVATAR ---
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = apiUrl.replace(/\/api$/, "");
    if (avatarPath.startsWith("http")) return avatarPath;
    const cleanPath = avatarPath.startsWith("/")
      ? avatarPath
      : `/${avatarPath}`;
    return `${baseUrl}${cleanPath}`;
  };

  // --- GESTION UPLOAD AVATAR ---
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5Mo).");
      return;
    }

    setIsUploadingAvatar(true);
    setError("");

    try {
      const response = await apiService.auth.updateAvatar(file);
      if (response.success) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'upload de la photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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

  const handleDiplomaTypeChange = (index, value) => {
    const list = [...diplomas];
    list[index].type = value;
    setDiplomas(list);
  };

  const addDiplomaField = () => {
    setDiplomas([...diplomas, { type: "", scan: null }]);
  };

  const removeDiplomaField = (index) => {
    setDiplomas(diplomas.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profileData.profession || profileData.profession.trim() === "") {
      setError("Complétez votre profil pour continuer.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        profile: {
          ...profileData,
          location: {
            city: profileData.location.city,
            country: "Cameroun",
          },
          age: profileData.age ? Number(profileData.age) : undefined,
          skills: profileData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          address: profileData.address,
          diplomas: diplomas
            .filter((d) => d.type && d.type.trim() !== "")
            .map((d) => ({ type: d.type, scan: null })),
        },
      };

      await apiService.auth.updateProfile(payload);
      await refreshUser();
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Une erreur est survenue lors de la mise à jour."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white shadow-lg rounded-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Finalisez votre profil</h2>
          <p className="text-sm text-gray-600 mt-2">
            Ces informations aideront les recruteurs à vous trouver.
          </p>
        </div>

        {/* --- ZONE AVATAR --- */}
        <div className="flex justify-center">
          <div className="relative group cursor-pointer">
            <input
              type="file"
              id="avatar-upload-onboarding"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={loading || isUploadingAvatar}
            />
            <label
              htmlFor="avatar-upload-onboarding"
              className="cursor-pointer block relative"
            >
              {user?.profile?.avatar ? (
                <img
                  src={getAvatarUrl(user.profile.avatar)}
                  alt="Profil"
                  className={`w-32 h-32 rounded-full object-cover border-4 border-white shadow-md ${
                    isUploadingAvatar ? "opacity-50" : ""
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div
                  className={`w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-md ${
                    isUploadingAvatar ? "opacity-50" : ""
                  }`}
                >
                  {user?.profile?.firstName?.charAt(0) || "U"}
                  {user?.profile?.lastName?.charAt(0) || ""}
                </div>
              )}

              {/* Overlay */}
              <div
                className={`absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-opacity duration-200 ${
                  isUploadingAvatar
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isUploadingAvatar ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <CameraIcon className="w-10 h-10 text-white" />
                )}
              </div>
            </label>
          </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* --- COLONNE VILLE --- */}
            <div className="relative" ref={wrapperRef}>
              <label className="block text-sm font-medium text-gray-700">
                Ville
              </label>

              {/* Ajout de mt-1 ici pour s'aligner avec le champ Pays voisin */}
              <div className="relative mt-1">
                <input
                  type="text"
                  name="city"
                  value={profileData.location.city}
                  onChange={handleCityInputChange}
                  onFocus={() =>
                    profileData.location.city && setShowSuggestions(true)
                  }
                  className="input input-bordered w-full pl-10"
                  placeholder="Ex: Douala, Yaoundé..."
                  autoComplete="off"
                />
                {/* Centrage parfait : absolute + inset-y-0 + flex + items-center */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Liste déroulante des suggestions */}
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

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700"
            >
              Votre Adresse
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={profileData.address}
              onChange={handleChange}
              className="input input-bordered w-full mt-1"
              placeholder="Ex: Rue Jamot, Akwa"
            />
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
