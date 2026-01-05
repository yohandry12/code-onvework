import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  BanknotesIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CreditCardIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  WalletIcon,
  ShoppingBagIcon,
  GiftIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import ConversionModal from "../components/UI/ConversionModal";
import toast from "react-hot-toast";

// --- SOUS-COMPOSANT : Ligne de Transaction ---
const TransactionRow = ({ item, index }) => {
  // Déterminer l'icône et la couleur selon le type
  let Icon = ArrowPathIcon;
  let bgClass = "bg-gray-100 text-gray-600";
  let amountClass = "text-gray-900";

  if (item.type === "enrollment") {
    Icon = ShoppingBagIcon;
    bgClass = "bg-orange-50 text-orange-600";
    amountClass = "text-red-600"; // Dépense
  } else if (item.type === "conversion") {
    Icon = ArrowPathIcon;
    bgClass = "bg-indigo-50 text-indigo-600";
    amountClass = "text-indigo-600";
  } else if (item.type === "payment_received") {
    Icon = BanknotesIcon;
    bgClass = "bg-green-50 text-green-600";
    amountClass = "text-green-600 font-bold"; // Gain
  } else if (item.type === "withdrawal") {
    Icon = ArrowUpRightIcon;
    bgClass = "bg-red-50 text-red-600";
    amountClass = "text-gray-500";
  } else if (item.type === "bonus") {
    Icon = GiftIcon;
    bgClass = "bg-yellow-50 text-yellow-600";
    amountClass = "text-green-600";
  }

  // Formater la date proprement
  const date = new Date(item.date);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const formattedTime = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 cursor-default"
    >
      <div className="flex items-center gap-4">
        {/* Icône avec fond coloré */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgClass} shadow-sm group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Détails */}
        <div>
          <h4 className="font-bold text-gray-900 text-sm md:text-base line-clamp-1">
            {item.title}
          </h4>
          <div className="flex items-center text-xs text-gray-500 mt-0.5">
            <span>
              {formattedDate} à {formattedTime}
            </span>
            <span className="mx-2">•</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide
              ${
                item.status === "success" || item.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }
            `}
            >
              {item.status === "success" || item.status === "paid"
                ? "Validé"
                : item.status}
            </span>
          </div>
        </div>
      </div>

      {/* Montant */}
      <div className="text-right">
        <span className={`block font-bold text-base md:text-lg ${amountClass}`}>
          {item.direction === "out" ? "-" : "+"}
          {item.amount.toLocaleString("fr-FR")}
          <span className="text-xs font-medium ml-1">{item.currency}</span>
        </span>
      </div>
    </motion.div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'in', 'out'

  const wallet = {
    balance: user?.profile?.walletBalance
      ? parseFloat(user.profile.walletBalance)
      : 0,
    points: user?.profile?.trainingPoints
      ? parseInt(user.profile.trainingPoints)
      : 0,
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshUser();
      try {
        const res = await apiService.users.getWalletHistory();
        if (res.success) {
          setHistory(res.history || []);
        }
      } catch (e) {
        console.error("Erreur historique:", e);
        toast.error("Impossible de charger l'historique");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleConversionSuccess = async (message) => {
    toast.success(message);
    const res = await apiService.users.getWalletHistory(); // Recharger historique
    if (res.success) setHistory(res.history);
    await refreshUser(); // Recharger solde
  };

  // Filtrage local
  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    return item.direction === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Mon Portefeuille
            </h1>
            <p className="text-gray-500">
              Gérez vos gains et vos crédits de formation.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConvertModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <ArrowPathIcon className="w-5 h-5" /> Convertir
            </button>
          </div>
        </div>

        {/* --- CARTES DE SOLDE (UI/UX : Glassmorphism léger & Dégradés) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte Fonds Réels */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-500 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-emerald-100">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-emerald-100 font-medium text-sm uppercase tracking-wider mb-1">
                  Fonds Disponibles
                </p>
                <h2 className="text-4xl font-extrabold tracking-tight">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XAF",
                  }).format(wallet.balance)}
                </h2>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <BanknotesIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="relative z-10 mt-8 flex gap-3">
              <button className="flex-1 bg-white/90 text-emerald-800 py-2.5 rounded-xl font-bold text-sm hover:bg-white transition shadow-sm flex items-center justify-center gap-2">
                <ArrowDownTrayIcon className="w-4 h-4" /> Retirer
              </button>
            </div>
          </div>

          {/* Carte Points */}
          <div className="relative overflow-hidden bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-1">
                  Crédit Formation
                </p>
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-baseline">
                  {wallet.points.toLocaleString()}
                  <span className="text-lg text-gray-400 font-medium ml-2">
                    Pts
                  </span>
                </h2>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/trainings"
                className="block w-full text-center bg-gray-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg shadow-gray-200"
              >
                Explorer le catalogue
              </Link>
            </div>
          </div>
        </div>

        {/* --- HISTORIQUE DES TRANSACTIONS --- */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" /> Historique récent
            </h3>

            {/* Filtres */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {["all", "in", "out"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    filter === f
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === "all" ? "Tout" : f === "in" ? "Entrées" : "Sorties"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2">
            {loading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCardIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">
                  Aucune transaction trouvée.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredHistory.map((item, index) => (
                  <TransactionRow key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Footer de liste (si besoin de voir plus) */}
          {history.length > 5 && (
            <div className="border-t border-gray-100 p-4 text-center">
              <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition">
                Voir tout l'historique
              </button>
            </div>
          )}
        </div>
      </div>

      <ConversionModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        maxAmount={wallet.balance}
        onSuccess={handleConversionSuccess}
      />
    </div>
  );
};

export default Wallet;
