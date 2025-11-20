import React from "react";
import { useNetworkStatus } from "../../contexts/NetworkStatusContext";
import { SignalSlashIcon as WifiOffIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";

const OfflineBanner = () => {
  const isOnline = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] p-4 bg-red-600 text-white rounded-lg shadow-lg flex items-center space-x-3"
        >
          <WifiOffIcon className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Vous êtes hors ligne</p>
            <p className="text-sm">
              Veuillez vérifier votre connexion internet. Certaines
              fonctionnalités pourraient ne pas être disponibles.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
