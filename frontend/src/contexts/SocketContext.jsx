import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";

// Context
const SocketContext = createContext();

// Hook pour utiliser le context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket doit être utilisé dans un SocketProvider");
  }
  return context;
};

// Provider
export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    if (isAuthenticated && user && !socketRef.current) {
      // URL du serveur Socket.IO
      const SOCKET_URL =
        import.meta.env.VITE_SOCKET_URL || "http://192.168.1.119:4000";

      // Créer la connexion
      socketRef.current = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem("overwork_token"),
        },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000,
      });

      const socket = socketRef.current;

      // Événements de connexion
      socket.on("connect", () => {
        console.log("📡 Connecté au serveur Socket.IO");
        setConnected(true);

        // Rejoindre la room de l'utilisateur
        socket.emit("join-user-room", user.id);
      });

      socket.on("disconnect", (reason) => {
        console.log("📡 Déconnecté du serveur Socket.IO:", reason);
        setConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("Erreur de connexion Socket.IO:", error);
        setConnected(false);
      });

      // Événements métier - Candidatures
      socket.on("application-received", (data) => {
        console.log("Nouvelle candidature reçue:", data);

        // Afficher une notification toast
        toast.success(
          `Nouvelle candidature de ${data.candidateName} pour "${data.jobTitle}"`,
          {
            duration: 6000,
            icon: "📄",
          }
        );

        // Ajouter à la liste des notifications
        addNotification({
          id: Date.now(),
          type: "application-received",
          title: "Nouvelle candidature",
          message: `${data.candidateName} a postulé pour "${data.jobTitle}"`,
          data,
          timestamp: new Date(),
          read: false,
        });
      });

      socket.on("application-updated", (data) => {
        console.log("Statut de candidature mis à jour:", data);

        const statusMessages = {
          reviewed: "Votre candidature a été examinée",
          shortlisted: "Vous êtes présélectionné(e) !",
          interviewed: "Entretien programmé",
          accepted: "Félicitations ! Votre candidature a été acceptée 🎉",
          rejected: "Votre candidature n'a pas été retenue",
        };

        const message =
          statusMessages[data.status] || "Statut de candidature mis à jour";
        const isGoodNews = ["shortlisted", "interviewed", "accepted"].includes(
          data.status
        );

        // Notification toast avec style selon le statut
        if (isGoodNews) {
          toast.success(message, {
            duration: 8000,
            icon: "🎉",
          });
        } else {
          toast(message, {
            duration: 5000,
            icon: "📬",
          });
        }

        // Ajouter à la liste des notifications
        addNotification({
          id: Date.now(),
          type: "application-updated",
          title: "Candidature mise à jour",
          message: `${message} pour "${data.jobTitle}"`,
          data,
          timestamp: new Date(),
          read: false,
        });
      });

      socket.on("recommendation-received", (data) => {
        console.log("Nouvelle recommandation reçue:", data);

        // 1. Afficher une notification toast pour féliciter l'utilisateur
        toast.success(
          `Félicitations ! ${data.employerCompany} vous a recommandé(e). Nouveau badge : ${data.newBadge} !`,
          {
            duration: 8000, // Durée plus longue pour un message important
            icon: "⭐",
          }
        );

        // 2. Rafraîchir les données de l'utilisateur pour mettre à jour l'UI (le badge)
        if (refreshUser) {
          refreshUser();
        }
      });

      // Événements métier - Nouveaux jobs
      socket.on("new-job-posted", (data) => {
        console.log("Nouveau job publié:", data);

        // Notification pour les candidats uniquement
        if (user.role === "candidate") {
          toast("Nouvelle offre d'emploi disponible !", {
            duration: 4000,
            icon: "💼",
          });

          addNotification({
            id: Date.now(),
            type: "new-job",
            title: "Nouvelle offre",
            message: `"${data.title}" dans la catégorie ${data.category}`,
            data,
            timestamp: new Date(),
            read: false,
          });
        }
      });

      // Messages privés
      socket.on("private-message", (data) => {
        console.log("Message privé reçu:", data);

        toast(`Nouveau message de ${data.senderName}`, {
          duration: 5000,
          icon: "💬",
        });

        addNotification({
          id: Date.now(),
          type: "message",
          title: "Nouveau message",
          message: `Message de ${data.senderName}: ${data.message.substring(
            0,
            50
          )}...`,
          data,
          timestamp: new Date(),
          read: false,
        });
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [isAuthenticated, user, refreshUser]);

  // Fermer la connexion lors de la déconnexion utilisateur
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  // Fonctions utilitaires
  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Garder max 50 notifications
  };

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Fonctions pour émettre des événements
  const emitApplicationSubmitted = (jobData, clientId) => {
    if (socketRef.current && connected) {
      socketRef.current.emit("new-application", {
        jobId: jobData.id,
        jobTitle: jobData.title,
        clientId,
        candidateName: user?.profile?.firstName + " " + user?.profile?.lastName,
        timestamp: new Date(),
      });
    }
  };

  const emitApplicationStatusUpdate = (applicationData) => {
    if (socketRef.current && connected) {
      socketRef.current.emit("application-status-update", {
        applicationId: applicationData.id,
        status: applicationData.status,
        jobTitle: applicationData.job?.title,
        candidateId: applicationData.candidate.id,
        timestamp: new Date(),
      });
    }
  };

  const emitPrivateMessage = (recipientId, message) => {
    if (socketRef.current && connected) {
      socketRef.current.emit("private-message", {
        recipientId,
        message,
        senderName: user?.profile?.firstName + " " + user?.profile?.lastName,
        timestamp: new Date(),
      });
    }
  };

  // Valeurs exposées par le context
  const value = {
    // État
    connected,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,

    // Fonctions de gestion des notifications
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    clearAllNotifications,

    // Fonctions d'émission d'événements
    emitApplicationSubmitted,
    emitApplicationStatusUpdate,
    emitPrivateMessage,

    // Accès direct au socket si nécessaire (utiliser avec précaution)
    socket: socketRef.current,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
