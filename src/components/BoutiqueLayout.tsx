import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  Eye, ChevronRight, Menu, X, ArrowLeft, Store,
  Smartphone // Ajout de l'icône Smartphone
} from "lucide-react";

const boutiqueNav = [
  { path: "/boutique", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-400" },
  { path: "/boutique/produits", icon: Package, label: "Produits", color: "text-purple-400" },
  // Ajout de la nouvelle route ici
  { path: "/boutique/produits-digitaux", icon: Smartphone, label: "Produits Digitaux", color: "text-blue-400" },
  { path: "/boutique/commandes", icon: ShoppingBag, label: "Commandes", color: "text-orange-400" },
  { path: "/boutique/parametres", icon: Settings, label: "Paramètres", color: "text-gray-400" },
];

interface BoutiqueLayoutProps {
  children: React.ReactNode;
  boutiqueName?: string;
  boutiqueSlug?: string;
}

export default function BoutiqueLayout({ children, boutiqueName = "Ma Boutique", boutiqueSlug }: BoutiqueLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPage = boutiqueNav.find(i => i.path === location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header boutique ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* Retour vers MES SECRETS */}
          <button onClick={() => navigate("/dashboard")}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Retour MES SECRETS">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>

          {/* Logo + Nom */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-gray-800 truncate">{boutiqueName}</p>
              <p className="text-xs text-gray-400 truncate">Espace vendeur</p>
            </div>
          </div>

          {/* Voir vitrine */}
          {boutiqueSlug && (
            <a href={`/shop/${boutiqueSlug}`} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-semibold hover:bg-pink-100 transition-colors flex-shrink-0">
              <Eye className="w-3.5 h-3.5" /> Voir la vitrine
            </a>
          )}

          {/* Menu mobile */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav desktop */}
        <div className="hidden sm:block border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-1">
              {boutiqueNav.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      active
                        ? "border-pink-500 text-pink-600"
                        : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                    }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {boutiqueSlug && (
                <a href={`/shop/${boutiqueSlug}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-800 ml-auto">
                  <Eye className="w-4 h-4" /> Vitrine
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Nav mobile */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-20 bg-black/40"
          onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full shadow-xl p-4 space-y-1"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-gray-400 px-2 mb-3">NAVIGATION BOUTIQUE</p>
            {boutiqueNav.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-pink-50 text-pink-600" : "text-gray-600 hover:bg-gray-50"
                  }`}>
                  <item.icon className={`w-4 h-4 ${active ? "text-pink-500" : item.color}`} />
                  {item.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
            {boutiqueSlug && (
              <a href={`/shop/${boutiqueSlug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 mt-4 border-t border-gray-100 pt-4">
                <Eye className="w-4 h-4 text-gray-400" />
                Voir ma vitrine
              </a>
            )}
          </div>
        </div>
      )}

      {/* Contenu */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
