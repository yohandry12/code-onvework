import React from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

const FloatingFeedbackButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 hover:bg-blue-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      title="Laisser un avis sur la plateforme"
    >
      <ChatBubbleLeftRightIcon className="h-8 w-8" />
    </button>
  );
};

export default FloatingFeedbackButton;
