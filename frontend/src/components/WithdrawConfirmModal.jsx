import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const WithdrawConfirmModal = ({ isOpen, onConfirm, onCancel, jobTitle }) => {
  const [reason, setReason] = useState("");
  const [isForceMajeure, setIsForceMajeure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({ reason, forceMajeure: isForceMajeure });
    } finally {
      setIsSubmitting(false);
      setReason("");
      setIsForceMajeure(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setIsForceMajeure(false);
    onCancel();
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleCancel}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header avec gradient rose/blue */}
              <div className="relative bg-gradient-to-r from-rose-500 via-pink-500 to-blue-500 p-6 text-white">
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
                    <ExclamationCircleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      Retirer votre candidature
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      Pour "{jobTitle}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Message d'avertissement */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    ⚠️ Cette action est{" "}
                    <span className="font-semibold">définitive</span>. Vous ne
                    pourrez pas revenir sur votre décision.
                  </p>
                </div>

                {/* Textarea pour raison */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Raison du retrait (optionnel)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Aidez-nous à comprendre votre décision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none disabled:bg-gray-50"
                    rows="3"
                  />
                </div>

                {/* Force Majeure checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isForceMajeure}
                    onChange={(e) => setIsForceMajeure(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">
                      Force majeure ?
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Maladie, abandon involontaire, événement imprévu...
                    </p>
                  </div>
                </label>

                {/* Info box si force majeure */}
                {isForceMajeure && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                  >
                    <p className="text-xs text-blue-800">
                      ℹ️ En cas de force majeure, une réévaluation de votre
                      situation peut être faite. Un remboursement ou un
                      remplaçant peuvent être proposés.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer avec boutons */}
              <div className="bg-gray-50 px-6 py-4 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Traitement..." : "Confirmer"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WithdrawConfirmModal;
