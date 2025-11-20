import React, { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { motion } from "framer-motion";

const AIPromptPopover = ({ targetLabel, onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-2xl border z-20 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h4 className="font-semibold text-gray-800">
          Générer pour "{targetLabel}"
        </h4>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Ex: Un titre accrocheur pour un dev senior...`}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          disabled={isLoading}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
        />
        <button
          type="button"
          disabled={isLoading || !prompt.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-4 h-4" /> Générer
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default AIPromptPopover;
