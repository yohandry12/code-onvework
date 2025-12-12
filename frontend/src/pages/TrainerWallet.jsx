import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { formatCurrency } from "../utils/format"; // Assurez-vous d'avoir ce helper (ex: 10 000 FCFA)
import LoadingSpinner from "../components/UI/LoadingSpinner";
import {
  BanknotesIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

const TrainerWallet = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // State pour le formulaire de retrait
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("momo");
  const [withdrawDetails, setWithdrawDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const res = await apiService.trainings.getWalletData();
      if (res.success) {
        setData(res);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0)
      return toast.error("Montant invalide");
    if (parseFloat(withdrawAmount) > data.balance)
      return toast.error("Solde insuffisant");

    setSubmitting(true);
    try {
      const res = await apiService.trainings.requestWithdraw({
        amount: parseFloat(withdrawAmount),
        method: withdrawMethod,
        details: withdrawDetails,
      });
      if (res.success) {
        toast.success(res.message);
        setIsWithdrawModalOpen(false);
        setWithdrawAmount("");
        fetchData(); // Rafraichir le solde
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Erreur lors de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mon Portefeuille
        </h1>

        {/* --- CARTES STATS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Solde Actuel */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <BanknotesIcon className="w-24 h-24 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Solde Disponible
              </p>
              <h2 className="text-4xl font-bold text-emerald-600 mt-2">
                {formatCurrency(data.balance)}
              </h2>
            </div>
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="mt-6 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center justify-center gap-2"
            >
              <ArrowDownTrayIcon className="w-5 h-5" /> Demander un retrait
            </button>
          </div>

          {/* Revenus Totaux */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <ArrowTrendingUpIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenus Nets Totaux</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.estimatedNetEarnings)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 pl-14">
              Après commission plateforme (10%)
            </p>
          </div>

          {/* Volume Ventes */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                <CreditCardIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Volume de Ventes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.totalSalesVolume)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 pl-14">
              {data.transactions?.length} transactions
            </p>
          </div>
        </div>

        {/* --- HISTORIQUE DES TRANSACTIONS --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">
              Historique des ventes
            </h3>
          </div>

          {data.transactions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Aucune transaction pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Formation</th>
                    <th className="px-6 py-4 text-left">Étudiant</th>
                    <th className="px-6 py-4 text-right">Montant (FCFA)</th>
                    <th className="px-6 py-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.transactions.map((tx, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tx.training?.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tx.candidate?.candidateProfile?.firstName}{" "}
                        {tx.candidate?.candidateProfile?.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">
                        +{parseFloat(tx.amountPaid).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3 mr-1" /> Payé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALE DE RETRAIT --- */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Demander un retrait</h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à retirer (Max: {data.balance})
                </label>
                <input
                  type="number"
                  max={data.balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: 50000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moyen de paiement
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="momo">Mobile Money (Orange/MTN)</option>
                  <option value="bank">Virement Bancaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Détails (Numéro ou IBAN)
                </label>
                <input
                  type="text"
                  value={withdrawDetails}
                  onChange={(e) => setWithdrawDetails(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder={
                    withdrawMethod === "momo" ? "Ex: 699..." : "Ex: CM21..."
                  }
                  required
                />
              </div>

              <div className="pt-2 text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-100">
                ⚠️ Les demandes sont traitées sous 24 à 48h ouvrées. Une
                commission de retrait peut s'appliquer selon l'opérateur.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 transition-all"
              >
                {submitting ? "Envoi..." : "Confirmer la demande"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerWallet;
