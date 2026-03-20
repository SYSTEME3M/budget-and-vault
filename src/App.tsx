import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NexoraAuthGuard from "@/components/NexoraAuthGuard";
import PageLoader from "@/components/PageLoader";

// Auth
import NexoraLoginPage from "@/pages/NexoraLoginPage";

// Pages Dashboard / Finance
import DashboardPage from "@/pages/DashboardPage";
import DepensesPage from "@/pages/DepensesPage";
import EntreesPage from "@/pages/EntreesPage";
import HistoriquePage from "@/pages/HistoriquePage";
import CoffreFortPage from "@/pages/CoffreFortPage";
import MediasPage from "@/pages/MediasPage";
import LiensPage from "@/pages/LiensPage";
import ProfilPage from "@/pages/ProfilPage";
import PretsPage from "@/pages/PretsPage";
import InvestissementsPage from "@/pages/InvestissementsPage";
import FacturesPage from "@/pages/FacturesPage";

// Page Entrées-Dépenses combinée
import EntreesDepensesPage from "@/pages/EntreesDepensesPage";

// Boutique
import BoutiqueAccueilPage from "@/pages/boutique/AccueilPage";
import BoutiqueProduitsPage from "@/pages/boutique/ProduitsPage";
import BoutiqueCommandesPage from "@/pages/boutique/CommandesPage";
import BoutiqueParametresPage from "@/pages/boutique/ParametresPage";
import BoutiqueVitrinePage from "@/pages/boutique/VitrinePage";
import ProduitDetailPage from "@/pages/boutique/ProduitDetailPage";

// Immobilier — Chemins corrigés (directement dans src/pages/)
import ImmobilierPage from "@/pages/ImmobilierPage";
import ProfilVendeurPage from "@/pages/ProfilVendeurPage";

// Abonnement
import AbonnementPage from "@/pages/AbonnementPage";

import NotFound from "@/pages/NotFound";

// Initialisation du client de requête
const queryClient = new QueryClient();

// Composant pour les routes protégées par authentification
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard>
    <PageLoader duration={1500}>{children}</PageLoader>
  </NexoraAuthGuard>
);

// Composant pour les routes réservées aux administrateurs
const AdminPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard requireAdmin>
    <PageLoader duration={1500}>{children}</PageLoader>
  </NexoraAuthGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>

          {/* ── AUTHENTICATION ── */}
          <Route path="/login" element={<NexoraLoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── DASHBOARD & FINANCE (protégé) ── */}
          <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
          <Route path="/entrees-depenses" element={<ProtectedPage><EntreesDepensesPage /></ProtectedPage>} />
          <Route path="/entrees" element={<Navigate to="/entrees-depenses" replace />} />
          <Route path="/depenses" element={<Navigate to="/entrees-depenses" replace />} />
          <Route path="/historique" element={<ProtectedPage><HistoriquePage /></ProtectedPage>} />
          <Route path="/prets" element={<ProtectedPage><PretsPage /></ProtectedPage>} />
          <Route path="/investissements" element={<ProtectedPage><InvestissementsPage /></ProtectedPage>} />
          <Route path="/factures" element={<ProtectedPage><FacturesPage /></ProtectedPage>} />
          <Route path="/coffre-fort" element={<ProtectedPage><CoffreFortPage /></ProtectedPage>} />
          <Route path="/liens" element={<ProtectedPage><LiensPage /></ProtectedPage>} />
          <Route path="/profil" element={<ProtectedPage><ProfilPage /></ProtectedPage>} />
          <Route path="/abonnement" element={<ProtectedPage><AbonnementPage /></ProtectedPage>} />

          {/* ── IMMOBILIER (protégé) ── */}
          <Route path="/immobilier" element={<ProtectedPage><ImmobilierPage /></ProtectedPage>} />

          {/* ── PROFIL VENDEUR (public) ── */}
          <Route path="/immobilier/vendeur/:userId" element={<ProfilVendeurPage />} />

          {/* ── MÉDIAS (Admin seulement) ── */}
          <Route path="/medias" element={<AdminPage><MediasPage /></AdminPage>} />

          {/* ── BOUTIQUE (protégé) ── */}
          <Route path="/boutique" element={<ProtectedPage><BoutiqueAccueilPage /></ProtectedPage>} />
          <Route path="/boutique/produits" element={<ProtectedPage><BoutiqueProduitsPage /></ProtectedPage>} />
          <Route path="/boutique/commandes" element={<ProtectedPage><BoutiqueCommandesPage /></ProtectedPage>} />
          <Route path="/boutique/parametres" element={<ProtectedPage><BoutiqueParametresPage /></ProtectedPage>} />

          {/* ── VITRINE PUBLIQUE ── */}
          <Route path="/shop/:slug" element={<BoutiqueVitrinePage />} />
          <Route path="/shop/:slug/produit/:produitId" element={<ProduitDetailPage />} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
