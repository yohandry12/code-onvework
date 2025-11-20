import React from "react";

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-6 relative w-full max-w-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl font-bold"
          aria-label="Fermer"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
