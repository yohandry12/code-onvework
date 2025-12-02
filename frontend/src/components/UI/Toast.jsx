import React, { useEffect } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const Toast = ({ toast, onClose, duration = 4000 }) => {
  if (!toast) return null;

  useEffect(() => {
    const id = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(id);
  }, [toast, duration, onClose]);

  const { type = "success", message = "" } = toast;

  const toastStyles = {
    success: {
      bg: "bg-green-500",
      Icon: CheckCircleIcon,
    },
    error: {
      bg: "bg-red-500",
      Icon: XCircleIcon,
    },
  };

  const { bg, Icon } = toastStyles[type] || toastStyles.success;

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="flex items-center gap-3 max-w-sm w-full bg-white border border-gray-200 shadow-lg rounded-lg p-3">
        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${bg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
