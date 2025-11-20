import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  LanguageIcon,
  MoonIcon,
  SunIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import apiService from "../services/api";
import { useTheme } from "../hooks/useTheme";

const NotificationToggle = ({ label, description, isChecked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
    <div>
      <h4 className="font-medium text-gray-900">{label}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState("compte");

  // --- États pour les données et la UI ---
  const [settings, setSettings] = useState(null);
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profession: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ error: null, success: null });
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
  const [theme, setTheme] = useTheme();

  const loadInitialData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const settingsResponse = await apiService.settings.get();
      if (settingsResponse.success) {
        setSettings(settingsResponse.settings);
      }

      if (settingsResponse.settings.theme) {
        setTheme(settingsResponse.settings.theme);
      }

      setAccountForm({
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        email: user.email || "",
        phone: user.profile?.phone || "",
        profession: user.profile?.profession || "",
      });
    } catch (error) {
      console.error("Erreur chargement des paramètres:", error);
      setFeedback({
        error: "Impossible de charger vos données.",
        success: null,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // --- Gestion des changements ---
  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- Logique de sauvegarde ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setFeedback({ error: null, success: null });

    try {
      // Mettre à jour les informations du profil via la route existante
      const profileUpdates = {
        firstName: accountForm.firstName,
        lastName: accountForm.lastName,
        phone: accountForm.phone,
        profession: accountForm.profession,
      };
      await apiService.auth.updateProfile({ profile: profileUpdates });

      // Mettre à jour les paramètres
      await apiService.settings.update(settings);

      await refreshUser(); // Mettre à jour le contexte Auth
      setFeedback({
        success: "Paramètres enregistrés avec succès !",
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Erreur lors de la sauvegarde.";
      setFeedback({ error: errorMessage, success: null });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({
        error: "Les nouveaux mots de passe ne correspondent pas.",
        success: null,
      });
      return;
    }
    setIsSaving(true);
    setFeedback({ error: null, success: null });
    try {
      await apiService.auth.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setFeedback({
        success: "Mot de passe changé avec succès !",
        error: null,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setFeedback({
        error:
          error.response?.data?.error ||
          "Erreur lors du changement de mot de passe.",
        success: null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsPasswordFormVisible(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleCancel = () => {
    // Recharger les données initiales pour annuler les changements non sauvegardés
    loadInitialData();
  };

  // Appliquer la langue du document quand le paramètre change
  useEffect(() => {
    if (!settings) return;
    const lang =
      settings.language === "auto"
        ? navigator.language?.split("-")[0] || "en"
        : settings.language || "en";
    try {
      document.documentElement.lang = lang;
    } catch (e) {
      // pas critique
      console.warn("Impossible de définir la langue du document", e);
    }
  }, [settings]);

  const handleDeleteAccount = async () => {
    // Étape de confirmation cruciale
    const isConfirmed = window.confirm(
      "Êtes-vous absolument sûr ?\n\nCette action est irréversible et supprimera définitivement votre compte et toutes vos données associées."
    );

    if (isConfirmed) {
      setIsSaving(true); // On peut réutiliser cet état pour montrer un chargement
      setFeedback({ error: null, success: null });
      try {
        await apiService.auth.deleteAccount();
        // Si la suppression réussit, on déconnecte l'utilisateur.
        // Le contexte Auth se chargera de la redirection vers la page de connexion.
        logout();
      } catch (error) {
        setFeedback({
          error:
            "Une erreur est survenue lors de la suppression de votre compte.",
          success: null,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const sections = [
    { id: "compte", label: "Compte", icon: UserIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "securite", label: "Sécurité", icon: ShieldCheckIcon },
    { id: "privacy", label: "Confidentialité", icon: EyeIcon },
    {
      id: "apparence",
      label: "Apparence",
      icon: settings?.theme === "dark" ? MoonIcon : SunIcon,
    },
    { id: "langue", label: "Langue", icon: LanguageIcon },
  ];

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
                <p className="text-gray-600 mt-1">
                  Gérez vos préférences et paramètres de compte
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleCancel}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {feedback.success && (
          <div
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md"
            role="alert"
          >
            <p>{feedback.success}</p>
          </div>
        )}
        {feedback.error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
            role="alert"
          >
            <p>{feedback.error}</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation latérale */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1 bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 text-sm rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              {/* Section Compte */}
              {activeSection === "compte" && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Informations du compte
                      </h2>
                      <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">
                        Gérez vos informations personnelles
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom
                      </label>
                      <input
                        name="firstName"
                        type="text"
                        value={accountForm.firstName}
                        onChange={handleAccountChange}
                        disabled
                        className="w-full input input-bordered"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom
                      </label>
                      <input
                        name="lastName"
                        type="text"
                        value={accountForm.lastName}
                        onChange={handleAccountChange}
                        disabled
                        className="w-full input input-bordered"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={accountForm.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="votre@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={accountForm.phone}
                        onChange={handleAccountChange}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+33 1 23 45 67 89"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profession
                      </label>
                      <input
                        type="text"
                        value={accountForm.profession}
                        onChange={handleAccountChange}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Votre poste"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section Notifications */}
              {activeSection === "notifications" && (
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Préférences de notifications
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Contrôlez comment et quand vous recevez des notifications.
                    </p>
                  </div>

                  {/* Section pour les emails */}
                  <div>
                    <h3 className="text-md font-medium text-gray-800 border-b pb-2 mb-4">
                      Par Email
                    </h3>
                    <div className="space-y-4">
                      <NotificationToggle
                        label="Nouveaux messages"
                        description="Lorsqu'un utilisateur vous envoie un message direct."
                        isChecked={settings.notifications.email.newMessages}
                        onChange={(isChecked) =>
                          handleSettingsChange("notifications", {
                            ...settings.notifications,
                            email: {
                              ...settings.notifications.email,
                              newMessages: isChecked,
                            },
                          })
                        }
                      />
                      <NotificationToggle
                        label="Mises à jour des missions"
                        description="Nouvelles candidatures, changements de statut, etc."
                        isChecked={settings.notifications.email.jobUpdates}
                        onChange={(isChecked) =>
                          handleSettingsChange("notifications", {
                            ...settings.notifications,
                            email: {
                              ...settings.notifications.email,
                              jobUpdates: isChecked,
                            },
                          })
                        }
                      />
                      <NotificationToggle
                        label="Actualités de la plateforme"
                        description="Nouveautés, offres spéciales et mises à jour du produit."
                        isChecked={settings.notifications.email.platformNews}
                        onChange={(isChecked) =>
                          handleSettingsChange("notifications", {
                            ...settings.notifications,
                            email: {
                              ...settings.notifications.email,
                              platformNews: isChecked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Section pour les notifications push */}
                  <div>
                    <h3 className="text-md font-medium text-gray-800 border-b pb-2 mb-4">
                      Notifications Push
                    </h3>
                    <div className="space-y-4">
                      <NotificationToggle
                        label="Nouveaux messages"
                        description="Recevez une alerte push pour les messages instantanés."
                        isChecked={settings.notifications.push.newMessages}
                        onChange={(isChecked) =>
                          handleSettingsChange("notifications", {
                            ...settings.notifications,
                            push: {
                              ...settings.notifications.push,
                              newMessages: isChecked,
                            },
                          })
                        }
                      />
                      <NotificationToggle
                        label="Mises à jour des missions"
                        description="Alertes pour les événements importants liés à vos missions."
                        isChecked={settings.notifications.push.jobUpdates}
                        onChange={(isChecked) =>
                          handleSettingsChange("notifications", {
                            ...settings.notifications,
                            push: {
                              ...settings.notifications.push,
                              jobUpdates: isChecked,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section Apparence */}
              {activeSection === "apparence" && (
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Apparence
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Personnalisez l'apparence de l'application
                    </p>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      Thème
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: "light", label: "Clair", icon: SunIcon },
                        { id: "dark", label: "Sombre", icon: MoonIcon },
                        {
                          id: "auto",
                          label: "Auto",
                          icon: DevicePhoneMobileIcon,
                        },
                      ].map((themeOption) => {
                        const Icon = themeOption.icon;
                        return (
                          <button
                            key={themeOption.id}
                            onClick={() => {
                              setTheme(themeOption.id);
                              handleSettingsChange("theme", themeOption.id);
                            }}
                            className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                              theme === themeOption.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Icon className="w-6 h-6 mb-2 text-gray-600" />
                            <div className="font-medium text-gray-900">
                              {themeOption.label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {themeOption.id === "auto"
                                ? "Basé sur vos préférences système"
                                : themeOption.id === "light"
                                ? "Interface claire"
                                : "Interface sombre"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section Sécurité */}
              {activeSection === "securite" && (
                <div className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Sécurité
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Protégez votre compte et vos données
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Authentification à deux facteurs
                          </h3>
                          <p className="text-sm text-gray-600">
                            Ajoutez une couche de sécurité supplémentaire
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Activer
                      </button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      {!isPasswordFormVisible ? (
                        // --- Vue par défaut (cachée) ---
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <CreditCardIcon className="w-6 h-6 text-gray-600" />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Changer le mot de passe
                              </h3>
                              <p className="text-sm text-gray-600">
                                Mettez à jour votre mot de passe régulièrement
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsPasswordFormVisible(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Modifier
                          </button>
                        </div>
                      ) : (
                        // --- Vue formulaire (visible) ---
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <h3 className="font-medium text-gray-900 mb-4">
                            Mettre à jour votre mot de passe
                          </h3>
                          <form
                            onSubmit={handleChangePassword}
                            className="space-y-4"
                          >
                            <input
                              name="currentPassword"
                              type="password"
                              placeholder="Mot de passe actuel"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full input input-bordered"
                              required
                            />
                            <input
                              name="newPassword"
                              type="password"
                              placeholder="Nouveau mot de passe"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full input input-bordered"
                              required
                            />
                            <input
                              name="confirmPassword"
                              type="password"
                              placeholder="Confirmer le nouveau mot de passe"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full input input-bordered"
                              required
                            />
                            <div className="flex justify-end space-x-3 pt-2">
                              <button
                                type="button"
                                onClick={handleCancelPasswordChange}
                                className="btn btn-ghost"
                              >
                                Annuler
                              </button>
                              <button
                                type="submit"
                                disabled={isSaving}
                                className="btn btn-primary"
                              >
                                {isSaving
                                  ? "Modification..."
                                  : "Changer le mot de passe"}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-4">
                        <TrashIcon className="w-6 h-6 text-red-600" />
                        <div>
                          <h3 className="font-medium text-red-900">
                            Supprimer le compte
                          </h3>
                          <p className="text-sm text-red-700">
                            Cette action est irréversible
                          </p>
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        onClick={handleDeleteAccount}
                        disabled={isSaving}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "langue" && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Langue
                  </h2>
                  <p className="text-gray-600 text-sm mb-6 dark:text-gray-400">
                    Choisissez la langue de l'interface. Vous pouvez laisser en
                    "Auto" pour utiliser la langue du navigateur.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                    {[
                      { id: "fr", label: "Français", hint: "Français (FR)" },
                      { id: "en", label: "English", hint: "English (EN)" },
                      {
                        id: "auto",
                        label: "Auto",
                        hint: "Détecter depuis le navigateur",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSettingsChange("language", opt.id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all duration-200 flex flex-col items-start justify-between ${
                          settings.language === opt.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {opt.label}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {opt.hint}
                            </div>
                          </div>
                          {settings.language === opt.id && (
                            <span className="text-sm text-blue-600 font-semibold">
                              Sélectionné
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 text-sm text-gray-700 dark:text-gray-300">
                    <p>
                      Langue actuelle appliquée:{" "}
                      <span className="font-medium">
                        {settings.language === "auto"
                          ? navigator.language?.split("-")[0] || "en"
                          : settings.language}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Après enregistrement, l'interface utilisera la langue
                      sélectionnée.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "privacy" && (
                <div className="p-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Confidentialité
                  </h2>
                  <p className="text-gray-600 text-sm mb-6 dark:text-gray-400">
                    Contrôlez la visibilité de votre profil et de vos
                    informations personnelles sur la plateforme.
                  </p>
                  <div className="mb-8">
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Visibilité du profil
                    </h3>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.privacy.showProfileInSearch}
                        onChange={(e) =>
                          handleSettingsChange("privacy", {
                            ...settings.privacy,
                            showProfileInSearch: e.target.checked,
                          })
                        }
                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        Afficher mon profil dans les résultats de recherche
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
                      Si désactivé, votre profil ne sera pas visible dans les
                      recherches publiques.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Informations de contact
                    </h3>
                    <div className="relative max-w-md">
                      <select
                        value={settings.privacy.showContactInfo}
                        onChange={(e) =>
                          handleSettingsChange("privacy", {
                            ...settings.privacy,
                            showContactInfo: e.target.value,
                          })
                        }
                        className="input input-bordered w-full pr-10 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                      >
                        <option value="all">Visible par tous</option>
                        <option value="connections">
                          Visible par mes connexions
                        </option>
                        <option value="none">Invisible</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M6 8l4 4 4-4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Contrôlez qui peut voir vos coordonnées (email, téléphone,
                      etc.).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
