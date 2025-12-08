import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import {
  BanknotesIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const FinanceSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // On stocke les valeurs en entiers (70, 20, 10) pour l'input
  const [rates, setRates] = useState({
    candidate: 70,
    training: 20,
    platform: 10,
  });

  // Charger les taux actuels
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await apiService.settings.getFinanceRates();
        if (response.success) {
          // L'API renvoie des décimales (0.7), on convertit en % (70)
          setRates({
            candidate: Math.round(response.rates.candidate * 100),
            training: Math.round(response.rates.training * 100),
            platform: Math.round(response.rates.platform * 100),
          });
        }
      } catch (err) {
        toast.error("Impossible de charger les taux.");
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRates((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const total = rates.candidate + rates.training + rates.platform;
  const isValid = total === 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      toast.error(`Le total doit faire 100%. Actuel : ${total}%`);
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.settings.updateFinanceRates(rates);
      if (response.success) {
        toast.success("Taux financiers mis à jour !");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Retour au Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configuration Financière
          </h1>
          <p className="text-gray-500 mb-8">
            Définissez la répartition des gains pour chaque mission validée.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Jauge visuelle */}
            <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${rates.candidate}%` }}
                className="bg-green-500 h-full transition-all duration-300"
                title="Candidat"
              />
              <div
                style={{ width: `${rates.training}%` }}
                className="bg-blue-500 h-full transition-all duration-300"
                title="Formation"
              />
              <div
                style={{ width: `${rates.platform}%` }}
                className="bg-gray-700 h-full transition-all duration-300"
                title="Plateforme"
              />
            </div>

            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>Répartition actuelle</span>
              <span
                className={
                  isValid
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                Total : {total}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Carte Candidat */}
              <div className="p-5 border border-green-100 bg-green-50/50 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <BanknotesIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-green-900">Candidat</h3>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="candidate"
                    min="0"
                    max="100"
                    value={rates.candidate}
                    onChange={handleChange}
                    className="w-20 p-2 border border-green-200 rounded-lg text-center font-bold text-lg focus:ring-green-500 focus:border-green-500"
                  />
                  <span className="ml-2 text-gray-600 font-bold">%</span>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Gain net versé au freelance.
                </p>
              </div>

              {/* Carte Formation */}
              <div className="p-5 border border-blue-100 bg-blue-50/50 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <AcademicCapIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-blue-900">Formation</h3>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="training"
                    min="0"
                    max="100"
                    value={rates.training}
                    onChange={handleChange}
                    className="w-20 p-2 border border-blue-200 rounded-lg text-center font-bold text-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="ml-2 text-gray-600 font-bold">%</span>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Retenu pour le fonds de formation.
                </p>
              </div>

              {/* Carte Plateforme */}
              <div className="p-5 border border-gray-200 bg-gray-50/50 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-200 rounded-lg text-gray-700">
                    <BuildingLibraryIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900">Plateforme</h3>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="platform"
                    min="0"
                    max="100"
                    value={rates.platform}
                    onChange={handleChange}
                    className="w-20 p-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-gray-500 focus:border-gray-500"
                  />
                  <span className="ml-2 text-gray-600 font-bold">%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Frais de service et fonctionnement.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving || !isValid}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Enregistrement..." : "Sauvegarder les taux"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinanceSettings;
