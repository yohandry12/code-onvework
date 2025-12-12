import React, { useState } from "react";
import { apiService } from "../../services/api";
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const ManagePointsModal = ({ user, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState("add"); // 'add' ou 'remove'
  const [loading, setLoading] = useState(false);

  const currentPoints = user?.profile?.trainingPoints || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("Montant invalide");

    setLoading(true);
    try {
      const res = await apiService.users.adminUpdatePoints(
        user.id,
        parseInt(amount),
        action
      );
      if (res.success) {
        toast.success(
          `Points ${action === "add" ? "ajoutés" : "retirés"} avec succès !`
        );
        if (onSuccess) onSuccess(); // Rafraîchir la liste parente
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Erreur lors de la mise à jour"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-indigo-600" />
            Gérer les points
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Info Utilisateur */}
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-500">Candidat</p>
            <p className="font-bold text-gray-900 text-lg">
              {user.profile?.firstName} {user.profile?.lastName}
            </p>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium text-sm">
              Solde actuel : {currentPoints} Pts
            </div>
          </div>

          {/* Sélecteur Action */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setAction("add")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all border ${
                action === "add"
                  ? "bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500 ring-offset-1"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <PlusIcon className="w-4 h-4" /> Ajouter
            </button>
            <button
              type="button"
              onClick={() => setAction("remove")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all border ${
                action === "remove"
                  ? "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500 ring-offset-1"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <MinusIcon className="w-4 h-4" /> Retirer
            </button>
          </div>

          {/* Input Montant */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Montant
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-center"
              placeholder="0"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-bold shadow-md transition-all ${
                action === "add"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "..." : "Valider"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagePointsModal;
