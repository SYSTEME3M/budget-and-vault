import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGuard from "@/components/AuthGuard";

// Pages principales
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import DepensesPage from "@/pages/DepensesPage";
import EntreesPage from "@/pages/EntreesPage";
import HistoriquePage from "@/pages/HistoriquePage";
import CoffreFortPage from "@/pages/CoffreFortPage";
import MediasPage from "@/pages/MediasPage";
import LiensPage from "@/pages/LiensPage";
import ProfilPage from "@/pages/ProfilPage";
// import AdminPage from "@/pages/AdminPage"; // Désactivé car le fichier est introuvable
import PretsPage from "@/pages/PretsPage";
import InvestissementsPage from "@/pages/InvestissementsPage";
import FacturesPage from "@/pages/FacturesPage";

// Boutique - Importations basées sur tes fichiers
import AccueilPage from "@/pages/boutique/AccueilPage";
import CommandesPage from "@/pages/boutique/CommandesPage";
import ParametresPage from "@/pages/boutique/ParametresPage";
import ProduitDetailPage from "@/pages/boutique/ProduitDetailPage";
import ProduitsPage from "@/pages/boutique/ProduitsPage";
import VitrinePage from "@/pages/boutique/VitrinePage";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* ── Auth ── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/admin" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── App principale ── */}
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/entrees" element={<AuthGuard><EntreesPage /></AuthGuard>} />
          <Route path="/depenses" element={<AuthGuard><DepensesPage /></AuthGuard>} />
          <Route path="/historique" element={<AuthGuard><HistoriquePage /></AuthGuard>} />
          <Route path="/prets" element={<AuthGuard><PretsPage /></AuthGuard>} />
          <Route path="/investissements" element={<AuthGuard><InvestissementsPage /></AuthGuard>} />
          <Route path="/factures" element={<AuthGuard><FacturesPage /></AuthGuard>} />
          <Route path="/coffre-fort" element={<AuthGuard><CoffreFortPage /></AuthGuard>} />
          <Route path="/medias" element={<AuthGuard><MediasPage /></AuthGuard>} />
          <Route path="/liens" element={<AuthGuard><LiensPage /></AuthGuard>} />
          {/* <Route path="/admin" element={<AuthGuard><AdminPage /></AuthGuard>} /> */}
          <Route path="/profil" element={<AuthGuard><ProfilPage /></AuthGuard>} />

          {/* ── Boutique Admin ── */}
          <Route path="/boutique" element={<AuthGuard><AccueilPage /></AuthGuard>} />
          <Route path="/boutique/produits" element={<AuthGuard><ProduitsPage /></AuthGuard>} />
          <Route path="/boutique/commandes" element={<AuthGuard><CommandesPage /></AuthGuard>} />
          <Route path="/boutique/parametres" element={<AuthGuard><ParametresPage /></AuthGuard>} />

          {/* ── Vitrine publique ── */}
          <Route path="/shop/:slug" element={<VitrinePage />} />
          <Route path="/shop/:slug/produit/:produitId" element={<ProduitDetailPage />} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
