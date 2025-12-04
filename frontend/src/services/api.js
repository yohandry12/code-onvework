import axios from "axios";

// URL de base de l'API
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://192.168.1.118:4000/api";

// Création de l'instance Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Intercepteur de requête pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("overwork_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response) => {
    // Retourner directement les données si la requête est réussie
    return response.data;
  },
  (error) => {
    // --- AJOUTEZ CECI POUR VOIR L'ERREUR SUR LE TÉLÉPHONE ---
    const errorMessage = error.response?.data?.error || error.message;
    const url = error.config?.url;
    alert(`ERREUR API : ${url}\nMessage : ${errorMessage}`);
    // -------------------------------------------------------
    // Gestion des erreurs communes
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem("overwork_token");
      window.location.href = "/login";
    }

    if (error.response?.status === 403) {
      // Accès refusé
      console.error("Accès refusé:", error.response.data);
    }

    if (error.response?.status >= 500) {
      // Erreur serveur
      console.error("Erreur serveur:", error.response.data);
    }

    return Promise.reject(error);
  }
);

// Service API avec méthodes utilitaires
export const apiService = {
  // Méthodes HTTP de base
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),

  // Méthodes pour gérer l'authentification
  setAuthToken: (token) => {
    if (token) {
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      localStorage.setItem("overwork_token", token);
    }
  },

  clearAuthToken: () => {
    delete apiClient.defaults.headers.Authorization;
    localStorage.removeItem("overwork_token");
  },

  // Upload de fichiers
  uploadFiles: (files, config = {}) => {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    } else {
      formData.append("files", files);
    }

    return apiClient.post("/upload", formData, {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // API d'authentification
  auth: {
    register: (userData) => apiClient.post("/auth/register", userData),
    login: (email, password) =>
      apiClient.post("/auth/login", { email, password }),
    logout: () => apiClient.post("/auth/logout"),
    me: () => apiClient.get("/auth/me"),
    updateProfile: (updates) => apiClient.put("/auth/profile", updates),
    changePassword: (currentPassword, newPassword) =>
      apiClient.post("/auth/change-password", { currentPassword, newPassword }),
    deleteAccount: () => apiClient.delete("/auth/delete-account"),

    updateAvatar: (file) => {
      const formData = new FormData();
      formData.append("avatar", file); // La clé doit être "avatar"
      return apiClient.post("/auth/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
  },

  // API des emplois
  jobs: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return apiClient.get(`/jobs${params ? `?${params}` : ""}`);
    },
    getMyJobs: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiClient.get(`/jobs/my-jobs?${query}`);
    },
    getMyJobHistory: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiClient.get(`/jobs/my-jobs/history?${query}`);
    },

    getJobForCloning: (id) => apiClient.get(`/jobs/${id}/prepare-clone`),
    getById: (id) => apiClient.get(`/jobs/${id}`),
    create: (jobData) => apiClient.post("/jobs", jobData),
    update: (id, updates) => apiClient.put(`/jobs/${id}`, updates),
    updateStatus: (id, status) =>
      apiClient.patch(`/jobs/${id}/status`, { status }),
    delete: (id) => apiClient.delete(`/jobs/${id}`),
    search: (query, filters = {}) => {
      const params = new URLSearchParams({
        search: query,
        ...filters,
      }).toString();
      return apiClient.get(`/jobs/search?${params}`);
    },
    adminGetAll: (params) => apiClient.get("/admin/jobs", { params }),
    adminDelete: (id) => apiClient.delete(`/admin/jobs/${id}`),
    adminUnfreeze: (id) => apiClient.patch(`/admin/jobs/${id}/unfreeze`),
    adminApprove: (id) => apiClient.patch(`/admin/jobs/${id}/approve`),
  },

  // API des candidatures
  applications: {
    create: (jobId, applicationData, config) => {
      // Le FormData est construit ici, à partir d'un objet simple.
      const formData = new FormData();
      formData.append("coverLetter", applicationData.coverLetter);

      if (
        applicationData.attachments &&
        applicationData.attachments.length > 0
      ) {
        applicationData.attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      // Axios s'occupe du Content-Type automatiquement
      return apiClient.post(`/jobs/${jobId}/apply`, formData, config);
    },

    getByUser: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return apiClient.get(`/applications/my${params ? `?${params}` : ""}`);
    },
    updateStatus: (id, status, notes = "") =>
      apiClient.put(`/applications/${id}/status`, { status, notes }),
    withdraw: (id, reason = "") =>
      apiClient.post(`/applications/${id}/withdraw`, { reason }),
    markCompleted: (id) => apiClient.post(`/applications/${id}/mark-completed`),
    adminGetAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiClient.get(`/applications/admin?${query}`);
    },
  },

  // API des utilisateurs
  users: {
    // On passe maintenant les paramètres de pagination
    search: (query, role = null, page = 1, limit = 12) => {
      const params = new URLSearchParams({ query, page, limit });
      if (role) params.append("role", role);
      // La réponse sera maintenant un objet { users: [...], pagination: {...} }
      return apiClient.get(`/users/search?${params.toString()}`);
    },
    getProfile: (id) => apiClient.get(`/users/${id}/profile`),

    // --- Fonctions pour l'Admin ---
    adminGetAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      // On s'assure d'appeler l'endpoint correct /users
      return apiClient.get(`/admin/users?${query}`);
    },
    adminUpdateStatus: (id, isActive) =>
      apiClient.patch(`/admin/users/${id}/status`, { isActive }),

    adminDelete: (id) => apiClient.delete(`/admin/users/${id}`),
    adminCreate: (userData) => apiClient.post("/admin/users", userData),
    adminGetUserById: (id) => apiClient.get(`/admin/users/${id}`),
    getAIJobMatches: () => apiClient.get("/users/ai-job-matches"),
  },

  // API des notifications
  notifications: {
    getAll: () => apiClient.get("/notifications"),
    markAsRead: (ids) => apiClient.put("/notifications/read", { ids }),
    markAllAsRead: () => apiClient.put("/notifications/read-all"),
  },

  // API du dashboard
  dashboard: {
    getStats: () => apiClient.get("/dashboard/stats"),
  },

  // API des activités
  activities: {
    getRecent: (limit = 20) =>
      apiClient.get(`/activities/recent?limit=${limit}`),
    markAsRead: (id) => apiClient.post(`/activities/${id}/read`),
    delete: (id) => apiClient.delete(`/activities/${id}`),
  },

  testimonials: {
    create: (data) => apiService.post("/testimonials", data),
    getFeatured: () => apiService.get("/testimonials/featured"),
    getAllForAdmin: () => apiService.get("/testimonials"),
    updateStatus: (id, updates) =>
      apiService.patch(`/testimonials/${id}`, updates),
    delete: (id) => apiService.delete(`/testimonials/${id}`),
  },

  reports: {
    create: (reportData) => apiService.post("/reports", reportData),
    getAllForAdmin: () => apiService.get("/reports"),
    updateStatus: (id, status) => {
      // Validation des statuts autorisés
      const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
      if (!validStatuses.includes(status)) {
        return Promise.reject(
          new Error(
            "Statut invalide. Les statuts autorisés sont : " +
              validStatuses.join(", ")
          )
        );
      }
      const payload = { status: status };
      return apiService.patch(`/reports/${id}`, payload);
    },
    delete: (id) => apiService.delete(`/reports/${id}`),
  },

  recommendations: {
    getAllForAdmin: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiClient.get(`/recommendations/admin?${query}`);
    },
    getAllCandidatesRecommendations: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiClient.get(`/candidates/recommendations?${query}`);
    },
    getCandidateRecommendations: (candidateId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiClient.get(
        `/candidates/${candidateId}/recommendations?${query}`
      );
    },
  },

  settings: {
    get: () => apiService.get("/settings"),
    update: (settingsData) => apiService.put("/settings", settingsData),
  },

  cities: {
    // On demande une grosse limite pour avoir toutes les villes dans le select
    getAll: () => apiClient.get("/cities?limit=1000"),
    getById: (id) => apiClient.get(`/cities/${id}`),
    getByCandidateId: (candidateId) =>
      apiClient.get(`/:id/count-candidates`, { id: candidateId }),
  },

  ai: {
    getChatReply: (messages, jobContext) =>
      apiService.post("/ai/chat", { messages, jobContext }),
  },
};

// Export de l'instance Axios pour utilisation directe si nécessaire
export { apiClient };

export default apiService;
