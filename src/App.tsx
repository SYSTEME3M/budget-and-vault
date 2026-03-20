import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NexoraAuthGuard from "@/components/NexoraAuthGuard";
import PageLoader from "@/components/PageLoader";
import { hasNexoraPremium } from "@/lib/nexora-auth";

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
import EntreesDepensesPage from "@/pages/EntreesDepensesPage";

// Boutique
import BoutiqueAccueilPage from "@/pages/boutique/AccueilPage";
import BoutiqueProduitsPage from "@/pages/boutique/ProduitsPage";
import CommandesPage from "@/pages/boutique/CommandesPage";
import BoutiqueParametresPage from "@/pages/boutique/ParametresPage";
import BoutiqueVitrinePage from "@/pages/boutique/VitrinePage";
import ProduitDetailPage from "@/pages/boutique/ProduitDetailPage";

// Immobilier
import ImmobilierPage from "@/pages/ImmobilierPage";
import ProfilVendeurPage from "@/pages/ProfilVendeurPage";

// Abonnement
import AbonnementPage from "@/pages/AbonnementPage";

import NotFound from "@/pages/NotFound";

import AppLayout from "@/components/AppLayout";
import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

// ── Page protégée (authentification requise, gratuit + premium)
const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard>
    <PageLoader duration={1500}>{children}</PageLoader>
  </NexoraAuthGuard>
);

// ── Page admin uniquement
const AdminPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard requireAdmin>
    <PageLoader duration={1500}>{children}</PageLoader>
  </NexoraAuthGuard>
);

// ── Mur premium (affiché quand non premium tente d'accéder à une route 100% premium)
function PremiumWall() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Fonctionnalité Premium</h2>
        <p className="text-gray-500 text-sm mb-1 max-w-xs">
          Cette section est réservée aux membres <span className="font-bold text-yellow-600">Premium</span>.
        </p>
        <p className="text-gray-400 text-xs mb-8 max-w-xs">
          Passez au plan Premium pour accéder à toutes les fonctionnalités sans limite.
        </p>
        <button
          onClick={() => navigate("/abonnement")}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all"
        >
          <Crown className="w-4 h-4" /> Voir les plans
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Retour au tableau de bord
        </button>
      </div>
    </AppLayout>
  );
}

// ── Page 100% premium (accès bloqué si non premium)
const PremiumPage = ({ children }: { children: React.ReactNode }) => (
  <NexoraAuthGuard>
    <PageLoader duration={1500}>
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

          {/* ── AUTHENTICATION ── */}
          <Route path="/login" element={<NexoraLoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── GRATUIT + PREMIUM (accessible à tous les connectés) ── */}
          <Route path="/dashboard"        element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
          <Route path="/historique"       element={<ProtectedPage><HistoriquePage /></ProtectedPage>} />
          <Route path="/coffre-fort"      element={<ProtectedPage><CoffreFortPage /></ProtectedPage>} />
          <Route path="/liens"            element={<ProtectedPage><LiensPage /></ProtectedPage>} />
          <Route path="/profil"           element={<ProtectedPage><ProfilPage /></ProtectedPage>} />
          <Route path="/abonnement"       element={<ProtectedPage><AbonnementPage /></ProtectedPage>} />

          {/* ── LIMITÉ gratuit / illimité premium (quota géré dans la page) ── */}
          {/* Factures     : 10 max gratuit, illimité premium                  */}
          <Route path="/factures"         element={<ProtectedPage><FacturesPage /></ProtectedPage>} />
          {/* Prêts/Dettes : 5 prêts + 5 dettes max gratuit                   */}
          <Route path="/prets"            element={<ProtectedPage><PretsPage /></ProtectedPage>} />
          {/* Entrées/Dép. : 5 entrées + 5 dépenses max gratuit               */}
          <Route path="/entrees-depenses" element={<ProtectedPage><EntreesDepensesPage /></ProtectedPage>} />
          <Route path="/entrees"          element={<Navigate to="/entrees-depenses" replace />} />
          <Route path="/depenses"         element={<Navigate to="/entrees-depenses" replace />} />
          {/* Investissements : accessible à tous, sans limite                 */}
          <Route path="/investissements"  element={<ProtectedPage><InvestissementsPage /></ProtectedPage>} />

          {/* ── 100% PREMIUM (bloqué si non premium) ── */}
          <Route path="/immobilier"           element={<PremiumPage><ImmobilierPage /></PremiumPage>} />
          <Route path="/boutique"             element={<PremiumPage><BoutiqueAccueilPage /></PremiumPage>} />
          <Route path="/boutique/produits"    element={<PremiumPage><BoutiqueProduitsPage /></PremiumPage>} />
          <Route path="/boutique/commandes"   element={<PremiumPage><CommandesPage /></PremiumPage>} />
          <Route path="/boutique/parametres"  element={<PremiumPage><BoutiqueParametresPage /></PremiumPage>} />

          {/* ── VITRINE PUBLIQUE (aucune protection) ── */}
          <Route path="/shop/:slug"                    element={<BoutiqueVitrinePage />} />
          <Route path="/shop/:slug/produit/:produitId" element={<ProduitDetailPage />} />

          {/* ── PROFIL VENDEUR (public) ── */}
          <Route path="/immobilier/vendeur/:userId" element={<ProfilVendeurPage />} />

          {/* ── MÉDIAS (admin seulement) ── */}
          <Route path="/medias" element={<AdminPage><MediasPage /></AdminPage>} />

          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
