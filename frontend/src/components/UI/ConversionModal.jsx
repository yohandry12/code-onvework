import React, { useState } from "react";
import {
  XMarkIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { apiService } from "../../services/api";

const ConversionModal = ({ isOpen, onClose, maxAmount, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAmountChange = (e) => {
    const val = e.target.value;
    // Empêcher les caractères non numériques
    if (!/^\d*\.?\d*$/.test(val)) return;

    // Vérifier si dépasse le solde
    if (parseFloat(val) > maxAmount) {
      setError("Le montant dépasse votre solde disponible.");
    } else {
      setError("");
    }
    setAmount(val);
  };

  const handleMaxClick = () => {
    setAmount(Math.floor(maxAmount).toString()); // On convertit des entiers de préférence
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError("Veuillez entrer un montant valide.");
      return;
    }
    if (parseFloat(amount) > maxAmount) return;

    setLoading(true);
    try {
      const response = await apiService.users.convertFunds(parseFloat(amount));
      if (response.success) {
        onSuccess(response.message);
        onClose();
        setAmount("");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la conversion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
          <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
            <CurrencyDollarIcon className="w-6 h-6" />
            Convertir en Points
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Taux de conversion :
              </p>
              <p className="text-lg font-bold text-blue-900">
                1 FCFA = 1 Point Onvework
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Les points sont utilisables exclusivement pour acheter des
                formations sur la plateforme.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant à convertir (FCFA)
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className={`w-full pl-4 pr-20 py-3 rounded-xl border ${
                  error
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                } transition-all font-semibold text-lg text-gray-800`}
                placeholder="0"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
              >
                MAX
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            <p className="text-xs text-gray-500 mt-2 text-right">
              Solde disponible : {maxAmount.toLocaleString()} FCFA
            </p>
          </div>

          {/* Prévisualisation */}
          {amount && !error && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
              <span className="text-gray-500 text-sm">Vous recevrez :</span>
              <span className="text-xl font-extrabold text-indigo-600 flex items-center gap-1">
                {Math.floor(parseFloat(amount)).toLocaleString()}
                <span className="text-xs font-medium text-indigo-400 uppercase mt-1">
                  Points
                </span>
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !amount || !!error}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Convertir <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversionModal;
