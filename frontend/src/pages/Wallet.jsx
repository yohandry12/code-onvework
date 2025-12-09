import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../services/api";
import {
  BanknotesIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CreditCardIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import ConversionModal from "../components/UI/ConversionModal"; // Import de la modale
import toast from "react-hot-toast";
// Composant Carte de Wallet
const WalletCard = ({
  title,
  amount,
  subtext,
  icon: Icon,
  color,
  isPoints,
  actionButton,
}) => {
  const colorClasses = {
    green: "bg-green-50 text-green-600 border-green-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const activeClass = colorClasses[color] || colorClasses.green;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${activeClass}`}>
          <Icon className="w-8 h-8" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {isPoints ? "Points" : "Devise"}
        </span>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-gray-900">
          {isPoints
            ? amount.toLocaleString()
            : new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "XAF",
              }).format(amount)}
          {isPoints && (
            <span className="text-lg text-gray-500 font-medium ml-1">pts</span>
          )}
        </h3>
        <p className="text-xs text-gray-400 mt-2">{subtext}</p>
      </div>

      {/* Bouton d'action inséré ici */}
      {actionButton && (
        <div className="mt-6 pt-4 border-t border-gray-100">{actionButton}</div>
      )}

      {/* Décoration d'arrière-plan */}
      <div
        className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 ${
          color === "green" ? "bg-green-500" : "bg-blue-500"
        }`}
      ></div>
    </div>
  );
};

const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);

  // On récupère les infos depuis le profil utilisateur
  // Assurez-vous que la route /auth/me ou /users/:id/profile renvoie bien les nouveaux champs
  const wallet = {
    balance: user?.profile?.walletBalance
      ? parseFloat(user.profile.walletBalance)
      : 0,
    points: user?.profile?.trainingPoints
      ? parseInt(user.profile.trainingPoints)
      : 0,
  };

  useEffect(() => {
    // On rafraîchit les données utilisateur au chargement pour avoir le solde à jour
    const init = async () => {
      await refreshUser();
      setLoading(false);
    };
    init();
  }, []);

  const handleConversionSuccess = async (message) => {
    toast.success(message);
    setLoading(true);
    await refreshUser(); // Recharger les données pour mettre à jour les soldes
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Portefeuille</h1>
          <p className="text-gray-500 mt-1">
            Gérez vos gains et votre fonds de formation.
          </p>
        </div>

        {/* Grille des Soldes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Fonds Personnels (70%) */}
          <WalletCard
            title="Fonds Personnels Disponibles"
            amount={wallet.balance}
            subtext="Cumul de 70% de vos missions validées."
            icon={BanknotesIcon}
            color="green"
            actionButton={
              <button
                onClick={() => setShowConvertModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors text-sm"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Convertir en Points
              </button>
            }
          />

          {/* Fonds Formation (20%) */}
          <WalletCard
            title="Crédit Formation"
            amount={wallet.points}
            subtext="Cumul de 20% converti en points Onvework."
            icon={AcademicCapIcon}
            color="blue"
            isPoints={true}
          />
        </div>

        {/* Section Actions / Historique (Placeholder pour le futur) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Actions rapides</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              <ArrowDownTrayIcon className="w-5 h-5 text-gray-500" />
              Demander un retrait
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              <AcademicCapIcon className="w-5 h-5 text-blue-500" />
              Explorer le catalogue formations
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium">
              <CreditCardIcon className="w-5 h-5 text-gray-500" />
              Historique des transactions
            </button>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-3">
            <ClockIcon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-yellow-800">
                Note sur les retraits
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Les demandes de retrait des fonds personnels sont traitées sous
                3 à 5 jours ouvrés. Les points de formation sont utilisables
                uniquement sur la plateforme partenaire.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* --- MODALE DE CONVERSION --- */}
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
