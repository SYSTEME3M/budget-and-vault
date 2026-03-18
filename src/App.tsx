import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/AuthGuard";
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
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/entrees" element={<AuthGuard><EntreesPage /></AuthGuard>} />
          <Route path="/depenses" element={<AuthGuard><DepensesPage /></AuthGuard>} />
          <Route path="/historique" element={<AuthGuard><HistoriquePage /></AuthGuard>} />
          <Route path="/prets" element={<AuthGuard><PretsPage /></AuthGuard>} />
          <Route path="/coffre-fort" element={<AuthGuard><CoffreFortPage /></AuthGuard>} />
          <Route path="/medias" element={<AuthGuard><MediasPage /></AuthGuard>} />
          <Route path="/liens" element={<AuthGuard><LiensPage /></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><AdminPage /></AuthGuard>} />
          <Route path="/profil" element={<AuthGuard><ProfilPage /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
