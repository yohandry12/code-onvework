import React, { useEffect } from "react";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

const Toast = ({ toast, onClose, duration = 4000 }) => {
  if (!toast) return null;

  useEffect(() => {
    const id = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(id);
  }, [toast, duration, onClose]);

  const { type = "success", message = "" } = toast;

  const icon = (
    <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
  );

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="flex items-center gap-3 max-w-sm w-full bg-white border border-gray-200 shadow-lg rounded-lg p-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-500">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600"
          aria-label="Fermer la notification"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
