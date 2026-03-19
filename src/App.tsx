import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Guards
import AuthGuard from "@/components/AuthGuard";
// L'import AdminGuard a été retiré car le fichier est manquant dans src/components

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import DepensesPage from "@/pages/DepensesPage";
import EntreesPage from "@/pages/EntreesPage";
import HistoriquePage from "@/pages/HistoriquePage";
import CoffreFortPage from "@/pages/CoffreFortPage";
import MediasPage from "@/pages/MediasPage";
import LiensPage from "@/pages/LiensPage";
import ProfilPage from "@/pages/ProfilPage";
import AdminPage from "@/pages/AdminPage";
import PretsPage from "@/pages/PretsPage";
import InvestissementsPage from "@/pages/InvestissementsPage";
import FacturesPage from "@/pages/FacturesPage";
import BoutiqueParametresPage from "@/pages/BoutiqueParametresPage";
import NotFound from "@/pages/NotFound";

// Utils
const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

const queryClient = new QueryClient();

const App = () => {
  const isAuth = isAuthenticated();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />

          <Routes>
            {/* AUTH */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/admin" element={<LoginPage type="admin" />} />

            {/* REDIRECTION INTELLIGENTE */}
            <Route
              path="/"
              element={
                isAuth ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* APP PROTÉGÉE */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <DashboardPage />
                </AuthGuard>
              }
            />
            <Route
              path="/entrees"
              element={
                <AuthGuard>
                  <EntreesPage />
                </AuthGuard>
              }
            />
            <Route
              path="/depenses"
              element={
                <AuthGuard>
                  <DepensesPage />
                </AuthGuard>
              }
            />
            <Route
              path="/historique"
              element={
                <AuthGuard>
                  <HistoriquePage />
                </AuthGuard>
              }
            />
            <Route
              path="/prets"
              element={
                <AuthGuard>
                  <PretsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/investissements"
              element={
                <AuthGuard>
                  <InvestissementsPage />
                </AuthGuard>
              }
            />
            <Route
              path="/factures"
              element={
                <AuthGuard>
                  <FacturesPage />
                </AuthGuard>
              }
            />
            <Route
              path="/coffre-fort"
              element={
                <AuthGuard>
                  <CoffreFortPage />
                </AuthGuard>
              }
            />
            <Route
              path="/medias"
              element={
                <AuthGuard>
                  <MediasPage />
                </AuthGuard>
              }
            />
            <Route
              path="/liens"
              element={
                <AuthGuard>
                  <LiensPage />
                </AuthGuard>
              }
            />
            <Route
              path="/profil"
              element={
                <AuthGuard>
                  <ProfilPage />
                </AuthGuard>
              }
            />

            {/* ADMIN PROTÉGÉ (Utilise AuthGuard car AdminGuard est manquant) */}
            <Route
              path="/admin"
              element={
                <AuthGuard>
                  <AdminPage />
                </AuthGuard>
              }
            />

            {/* BOUTIQUE */}
            <Route
              path="/boutique"
              element={
                <AuthGuard>
                  <BoutiqueParametresPage />
                </AuthGuard>
              }
            />
            <Route
              path="/boutique/parametres"
              element={
                <AuthGuard>
                  <BoutiqueParametresPage />
                </AuthGuard>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
