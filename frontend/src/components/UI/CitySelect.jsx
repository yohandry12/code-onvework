import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api"; // Vérifiez le chemin d'import

const CitySelect = ({ label, name, value, onChange, error }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        // On récupère toutes les villes
        const response = await apiService.cities.getAll();
        // L'API retourne { data: [...], total: ... }
        setCities(response.data || []);
      } catch (err) {
        console.error("Erreur chargement villes:", err);
        setFetchError("Impossible de charger les villes");
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <select
          id={name}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={loading || !!fetchError}
          className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">
            {loading
              ? "Chargement des villes..."
              : fetchError
              ? "Erreur de chargement"
              : "* Sélectionnez une ville"}
          </option>

          {cities.map((city) => (
            <option key={city.id} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CitySelect;
