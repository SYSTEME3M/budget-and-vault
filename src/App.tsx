import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";

// Components
import NexoraAuthGuard from "@/components/NexoraAuthGuard";
import PageLoader from "@/components/PageLoader";
import AppLayout from "@/components/AppLayout";

// Lib
import { hasNexoraPremium } from "@/lib/nexora-auth";

// Pages
import NexoraLoginPage from "@/pages/NexoraLoginPage";
import DashboardPage from "@/pages/DashboardPage";
import HistoriquePage from "@/pages/HistoriquePage";
import CoffreFortPage from "@/pages/CoffreFortPage";
import LiensPage from "@/pages/LiensPage";
import ProfilPage from "@/pages/ProfilPage";
import PretsPage from "@/pages/PretsPage";
import InvestissementsPage from "@/pages/InvestissementsPage";
import FacturesPage from "@/pages/FacturesPage";
import EntreesDepensesPage from "@/pages/EntreesDepensesPage";
import BoutiqueAccueilPage from "@/pages/boutique/AccueilPage";
import BoutiqueProduitsPage from "@/pages/boutique/ProduitsPage";
import CommandesPage from "@/pages/boutique/CommandesPage";
import BoutiqueParametresPage from "@/pages/boutique/ParametresPage";
import BoutiqueVitrinePage from "@/pages/boutique/VitrinePage";
import ProduitDetailPage from "@/pages/boutique/ProduitDetailPage";
import ImmobilierPage from "@/pages/ImmobilierPage";
import ProfilVendeurPage from "@/pages/ProfilVendeurPage";
import AbonnementPage from "@/pages/AbonnementPage";
import AdminPanelPage from "@/pages/AdminPanelPage";
import MediasPage from "@/pages/MediasPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Durées loader
const LOADER_DURATION = 800;

// ── MUR PREMIUM ──
function PremiumWall() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Fonctionnalité Premium</h2>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">
          Cette section est réservée aux membres <span className="font-bold text-yellow-600">Premium</span>.
        </p>
        <button
          onClick={() => navigate("/abonnement")}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-8 py-3 rounded-xl shadow-md"
        >
          <Crown className="w-4 h-4" /> Voir les plans
        </button>
      </div>
    </AppLayout>
  );
}

// ── WRAPPERS DE ROUTES ──
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard>
    <PageLoader duration={LOADER_DURATION}>{children}</PageLoader>
  </NexoraAuthGuard>
);

const AdminPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard requireAdmin>
    <PageLoader duration={LOADER_DURATION}>{children}</PageLoader>
  </NexoraAuthGuard>
);

const PremiumPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard>
    <PageLoader duration={LOADER_DURATION}>
      {hasNexoraPremium() ? children : <PremiumWall />}
    </PageLoader>
  </NexoraAuthGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* AUTH */}
          <Route path="/login" element={<PageLoader duration={LOADER_DURATION}><NexoraLoginPage /></PageLoader>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* PROTECTED ROUTES */}
          <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
          <Route path="/historique" element={<ProtectedPage><HistoriquePage /></ProtectedPage>} />
          <Route path="/coffre-fort" element={<ProtectedPage><CoffreFortPage /></ProtectedPage>} />
          <Route path="/liens" element={<ProtectedPage><LiensPage /></ProtectedPage>} />
          <Route path="/profil" element={<ProtectedPage><ProfilPage /></ProtectedPage>} />
          <Route path="/abonnement" element={<ProtectedPage><AbonnementPage /></ProtectedPage>} />
          <Route path="/factures" element={<ProtectedPage><FacturesPage /></ProtectedPage>} />
          <Route path="/prets" element={<ProtectedPage><PretsPage /></ProtectedPage>} />
          <Route path="/entrees-depenses" element={<ProtectedPage><EntreesDepensesPage /></ProtectedPage>} />
          <Route path="/investissements" element={<ProtectedPage><InvestissementsPage /></ProtectedPage>} />

          {/* PREMIUM ROUTES */}
          <Route path="/immobilier" element={<PremiumPage><ImmobilierPage /></PremiumPage>} />
          <Route path="/boutique" element={<PremiumPage><BoutiqueAccueilPage /></PremiumPage>} />
          <Route path="/boutique/produits" element={<PremiumPage><BoutiqueProduitsPage /></PremiumPage>} />
          <Route path="/boutique/commandes" element={<PremiumPage><CommandesPage /></PremiumPage>} />
          <Route path="/boutique/parametres" element={<PremiumPage><BoutiqueParametresPage /></PremiumPage>} />

          {/* PUBLIC ROUTES */}
          <Route path="/shop/:slug" element={<BoutiqueVitrinePage />} />
          <Route path="/shop/:slug/produit/:produitId" element={<ProduitDetailPage />} />
          <Route path="/immobilier/vendeur/:userId" element={<ProfilVendeurPage />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminPage><AdminPanelPage /></AdminPage>} />
          <Route path="/medias" element={<AdminPage><MediasPage /></AdminPage>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
