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
import RecommendationsList from "./pages/RecommendationsList";
import Unauthorized from "./pages/Unauthorized";
import ApiDocumentation from "./pages/ApiDocumentation";
import AdminCreateJob from "./pages/admin/AdminCreateJob";
import TalentProfilePage from "./pages/TalentProfilePage";
import UserDetailPage from "./pages/admin/UserDetailPage";
import FinanceSettings from "./pages/admin/FinanceSettings";
import AdminEditJob from "./pages/admin/AdminEditJob";
import Wallet from "./pages/Wallet";
import CreateCourse from "./pages/CreateCourse";
// --- 1. IMPORT DU NOUVEAU COMPOSANT ---
import TrainerOnboarding from "./pages/TrainerOnboarding";
import ManageTrainings from "./pages/admin/ManageTrainings";
import AllTrainings from "./pages/AllTrainings";

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
        <Route element={<MainLayout />}>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/talents" element={<AllTalents />} />
          <Route path="/recommendations" element={<RecommendationsList />} />
          <Route path="/docs" element={<ApiDocumentation />} />
          <Route path="/trainings" element={<AllTrainings />} />

          {/* --- 2. MODIFICATION DU GROUPE PROTÉGÉ --- */}
          {/* Ajout de 'trainer' dans allowedRoles pour qu'il puisse accéder au Dashboard, Profile, Wallet, etc. */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["client", "candidate", "trainer"]}
              />
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Routes Spécifiques Candidat */}
            <Route path="/my-applications" element={<MyApplications />} />
            <Route
              path="/onboarding/candidate"
              element={<OnboardingCandidate />}
            />

            {/* Routes Spécifiques Client */}
            <Route
              path="/manage-applications"
              element={<ManageApplications />}
            />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/client/job-history" element={<JobHistory />} />
            <Route path="/clients/:clientId" element={<ClientProfilePage />} />
            <Route path="/talents/:id" element={<TalentProfilePage />} />

            {/* --- 3. AJOUT DE LA ROUTE SPÉCIFIQUE FORMATEUR --- */}
            <Route path="/onboarding/trainer" element={<TrainerOnboarding />} />
            <Route path="/courses/create" element={<CreateCourse />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
            <Route path="/onboarding/trainer" element={<TrainerOnboarding />} />
            <Route path="/courses/create" element={<CreateCourse />} />
          </Route>
        </Route>

        {/* Routes Auth */}
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

        {/* Routes Admin */}
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={["admin"]} />}
        >
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="jobs" element={<ManageJobs />} />
            <Route path="testimonials" element={<ManageTestimonials />} />
            <Route path="reports" element={<ManageReports />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="recommandations" element={<AdminRecommendations />} />
            <Route path="/admin/jobs/create" element={<AdminCreateJob />} />
            <Route path="/admin/users/:id" element={<UserDetailPage />} />
            <Route path="finance" element={<FinanceSettings />} />
            <Route path="/admin/jobs/:id/edit" element={<AdminEditJob />} />
            <Route path="trainings" element={<ManageTrainings />} />
          </Route>
        </Route>

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
