// import React, { useState, useRef, useEffect } from "react";
// import { Sparkles, Send, X } from "lucide-react";
// import { apiService } from "../../services/api";

// const AIChatAssistant = ({ jobFormContext }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     {
//       role: "assistant",
//       content:
//         "Bonjour ! Je suis votre assistant. Comment puis-je vous aider à créer votre mission ?",
//     },
//   ]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(scrollToBottom, [messages]);

//   const handleSend = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userMessage = { role: "user", content: input };
//     const newMessages = [...messages, userMessage];
//     setMessages(newMessages);
//     setInput("");
//     setIsLoading(true);

//     try {
//       const response = await apiService.ai.getChatReply(
//         newMessages,
//         jobFormContext
//       );
//       const assistantMessage = { role: "assistant", content: response.reply };
//       setMessages((prev) => [...prev, assistantMessage]);
//     } catch (error) {
//       const errorMessage = {
//         role: "assistant",
//         content: "Désolé, je rencontre un problème. Réessayez plus tard.",
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (!isOpen) {
//     return (
//       <button
//         onClick={() => setIsOpen(true)}
//         className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
//       >
//         <Sparkles className="w-6 h-6" />
//       </button>
//     );
//   }

//   return (
//     <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50">
//       {/* Header */}
//       <div className="flex items-center justify-between p-4 bg-gray-50 border-b rounded-t-2xl">
//         <div className="flex items-center gap-2">
//           <Sparkles className="w-5 h-5 text-indigo-600" />
//           <h3 className="font-semibold">Assistant IA</h3>
//         </div>
//         <button onClick={() => setIsOpen(false)}>
//           <X className="w-5 h-5 text-gray-500" />
//         </button>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 p-4 overflow-y-auto">
//         {messages.map((msg, index) => (
//           <div
//             key={index}
//             className={`flex mb-4 ${
//               msg.role === "user" ? "justify-end" : "justify-start"
//             }`}
//           >
//             <div
//               className={`p-3 rounded-lg max-w-xs ${
//                 msg.role === "user"
//                   ? "bg-indigo-600 text-white"
//                   : "bg-gray-200 text-gray-800"
//               }`}
//             >
//               {msg.content}
//             </div>
//           </div>
//         ))}
//         {isLoading && (
//           <div className="text-center text-gray-500">
//             Assistant is typing...
//           </div>
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <form onSubmit={handleSend} className="p-4 border-t">
//         <div className="flex items-center gap-2">
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             placeholder="Posez une question..."
//             className="flex-1 input input-bordered"
//             disabled={isLoading}
//           />
//           <button
//             type="submit"
//             className="btn btn-primary"
//             disabled={isLoading}
//           >
//             <Send className="w-5 h-5" />
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AIChatAssistant;

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X } from "lucide-react";
import { apiService } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";

const AIChatAssistant = ({
  jobFormContext,
  isOpen,
  onClose,
  onToggle,
  initialPrompt,
  setInitialPrompt,
}) => {
  // L'historique des messages commence avec un message de bienvenue.
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant. Comment puis-je vous aider à créer votre mission ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fonction pour faire défiler automatiquement vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fait défiler à chaque nouveau message
  useEffect(scrollToBottom, [messages]);

  // Ce `useEffect` se déclenche uniquement lorsque le chat s'ouvre avec un "prompt initial"
  useEffect(() => {
    // Si le chat est ouvert et qu'il y a un prompt initial à traiter
    if (isOpen && initialPrompt && !isLoading) {
      // On vérifie que ce prompt n'est pas déjà le dernier message pour éviter les doublons
      if (messages[messages.length - 1]?.content !== initialPrompt) {
        const userMessage = { role: "user", content: initialPrompt };
        // On ajoute le message de l'utilisateur et on active le chargement
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // On envoie la requête à l'IA
        apiService.ai
          .getChatReply([...messages, userMessage], jobFormContext)
          .then((response) => {
            const assistantMessage = {
              role: "assistant",
              content: response.reply,
            };
            setMessages((prev) => [...prev, assistantMessage]);
          })
          .catch((error) => {
            const errorMessage = {
              role: "assistant",
              content: "Désolé, une erreur est survenue. Veuillez réessayer.",
            };
            setMessages((prev) => [...prev, errorMessage]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
      setInitialPrompt("");
    }
  }, [isOpen, initialPrompt, jobFormContext, setInitialPrompt]); // Dépendances importantes

  // Fonction pour envoyer un message manuellement depuis l'input
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiService.ai.getChatReply(
        newMessages,
        jobFormContext
      );
      const assistantMessage = { role: "assistant", content: response.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: "Désolé, je rencontre un problème. Réessayez plus tard.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Le bouton flottant qui est toujours visible
  const FloatingButton = () => (
    <button
      onClick={onToggle}
      className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
      title="Ouvrir l'assistant IA"
    >
      <Sparkles className="w-6 h-6" />
    </button>
  );

  return (
    <>
      {/* On affiche toujours le bouton flottant */}
      <FloatingButton />

      {/* Le modal de chat n'est rendu que si `isOpen` est vrai */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-24 right-8 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4  bg-gray-50 border-b rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-gray-800">
                  Assistant de Création
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-white">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex mb-4 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg max-w-[85%] whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-500">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0"
            >
              <div className="relative flex items-center w-full bg-white border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez une question..."
                  className="flex-1 w-full bg-transparent py-3 pl-4 pr-16 border-none focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-500"
                  disabled={isLoading}
                  // Permet d'envoyer le message en appuyant sur "Entrée"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      handleSend(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  disabled={isLoading || !input.trim()} // Le bouton est aussi désactivé si le champ est vide
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;
