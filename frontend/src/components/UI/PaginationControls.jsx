import React from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  const maxPagesToShow = 5;
  const halfMax = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfMax);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      {/* Bouton Précédent */}
      <motion.button
        whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
        whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </motion.button>

      {/* Numéros de pages */}
      {startPage > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            1
          </motion.button>
          {startPage > 2 && <span className="text-gray-400 px-2">...</span>}
        </>
      )}

      {pageNumbers.map((page) => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 rounded-lg font-medium transition-all ${
            page === currentPage
              ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {page}
        </motion.button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-gray-400 px-2">...</span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {totalPages}
          </motion.button>
        </>
      )}

      {/* Bouton Suivant */}
      <motion.button
        whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
        whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </motion.button>

      {/* Affichage du total */}
      <span className="ml-4 text-sm text-gray-500 font-medium">
        Page {currentPage} / {totalPages}
      </span>
    </div>
  );
};

export default PaginationControls;
