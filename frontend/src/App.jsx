import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NetworkStatusProvider } from "./contexts/NetworkStatusContext";

// --- PAGES ---
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import ManageApplications from "./pages/ManageApplications";
import ProfilePage from "./pages/Profile";
import OnboardingCandidate from "./pages/OnboardingCandidate";
import MyApplications from "./pages/myapplicationsforcandidate";
import AllTalents from "./pages/AllTalents";
import CreateJob from "./pages/CreateJob";
import JobHistory from "./pages/JobHistory";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageJobs from "./pages/admin/ManageJobs";
import ManageTestimonials from "./pages/admin/ManageTestimonials";
import ManageReports from "./pages/admin/ManageReports";
import ClientProfilePage from "./pages/ClientProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminRecommendations from "./pages/Admin/AdminRecommendations";
import AdminUserDetails from "./pages/Admin/AdminUserDetails";
import Unauthorized from "./pages/Unauthorized";
// --- LAYOUTS ET COMPOSANTS ---
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import LoadingSpinner from "./components/UI/LoadingSpinner";
import AdminLayout from "./components/Layout/AdminLayout";
import OfflineBanner from "./components/UI/OfflineBanner";
import { useTheme } from "./hooks/useTheme";

// --- ProtectedRoute (Final) ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    // Si la page demandée est une page admin, rediriger vers le login admin
    if (window.location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// --- Layout pour les pages publiques ET les utilisateurs connectés ---
const MainLayout = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <>
      <OfflineBanner />
      <Routes>
        {/* --- GROUPE 1: ROUTES PUBLIQUES & UTILISATEURS utilisant le MainLayout --- */}
        <Route element={<MainLayout />}>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/talents" element={<AllTalents />} />

          {/* Routes protégées pour Clients & Candidats */}
          <Route
            element={<ProtectedRoute allowedRoles={["client", "candidate"]} />}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/manage-applications"
              element={<ManageApplications />}
            />
            <Route path="/my-applications" element={<MyApplications />} />
            <Route
              path="/onboarding/candidate"
              element={<OnboardingCandidate />}
            />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/client/job-history" element={<JobHistory />} />
            <Route path="/clients/:clientId" element={<ClientProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* --- GROUPE 2: ROUTES D'AUTHENTIFICATION (sans layout) --- */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register />}
        />
        <Route
          path="/admin/login"
          element={
            user && user.role === "admin" ? (
              <Navigate to="/admin/dashboard" />
            ) : (
              <AdminLogin />
            )
          }
        />

        {/* --- GROUPE 3: ROUTES ADMIN utilisant le AdminLayout --- */}
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={["admin"]} />}
        >
          <Route element={<AdminLayout />}>
            {/* Redirection de /admin vers /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="testimonials" element={<ManageTestimonials />} />
            <Route path="reports" element={<ManageReports />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="recommandations" element={<AdminRecommendations />} />
            <Route path="/admin/users/:id" element={<AdminUserDetails />} />
          </Route>
        </Route>

        {/* --- PAGES D'ERREUR --- */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<h1>404 - Page Non Trouvée</h1>} />
      </Routes>
    </>
  );
}

function App() {
  const queryClient = new QueryClient();
  useTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <NetworkStatusProvider>
              <AppRoutes />
            </NetworkStatusProvider>
            <Toaster position="top-right" />
          </SocketProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
