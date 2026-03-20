import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  Eye, ChevronRight, Menu, X, ArrowLeft, Store,
} from "lucide-react";

const boutiqueNav = [
  { path: "/boutique", icon: LayoutDashboard, label: "Dashboard", color: "text-blue-400", bg: "bg-blue-400/10" },
  { path: "/boutique/produits", icon: Package, label: "Produits", color: "text-purple-400", bg: "bg-purple-400/10" },
  { path: "/boutique/commandes", icon: ShoppingBag, label: "Commandes", color: "text-orange-400", bg: "bg-orange-400/10" },
  { path: "/boutique/parametres", icon: Settings, label: "Paramètres", color: "text-gray-400", bg: "bg-gray-400/10" },
];

interface BoutiqueLayoutProps {
  children: React.ReactNode;
  boutiqueName?: string;
  boutiqueSlug?: string;
}

export default function BoutiqueLayout({ children, boutiqueName = "Ma Boutique", boutiqueSlug }: BoutiqueLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">

      {/* Overlay mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 bg-white border-r border-gray-200 shadow-sm flex flex-col
        transition-all duration-300
        ${sidebarOpen ? "w-56" : "w-[68px]"}
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>

        {/* Barre colorée top */}
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400 flex-shrink-0" />

        {/* Logo + Nom boutique */}
        <div className={`flex items-center gap-2.5 px-3 py-3.5 border-b border-gray-100 ${!sidebarOpen ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm text-gray-800 truncate">{boutiqueName}</p>
              <p className="text-xs text-gray-400">Espace vendeur</p>
            </div>
          )}
          {/* Toggle collapse (desktop) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0 ${!sidebarOpen ? "ml-0 mt-1" : "ml-auto"}`}
          >
            <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {boutiqueNav.map(({ path, icon: Icon, label, color, bg }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileSidebarOpen(false)}
                title={!sidebarOpen ? label : undefined}
                className={`
                  flex items-center gap-3 rounded-xl transition-all duration-150
                  ${sidebarOpen ? "px-2.5 py-2" : "px-0 py-2 justify-center"}
                  ${active
                    ? "bg-pink-50 text-pink-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }
                `}
              >
                <div className={`
                  flex items-center justify-center rounded-lg flex-shrink-0
                  ${sidebarOpen ? "w-7 h-7" : "w-9 h-9"}
                  ${active ? "bg-pink-100" : bg}
                `}>
                  <Icon className={`flex-shrink-0 ${sidebarOpen ? "w-4 h-4" : "w-5 h-5"} ${active ? "text-pink-500" : color}`} />
                </div>
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
                {sidebarOpen && active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-pink-400" />}
              </Link>
            );
          })}

          {/* Voir vitrine */}
          {boutiqueSlug && sidebarOpen && (
            <a
              href={`/shop/${boutiqueSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-colors mt-1"
            >
              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-pink-50">
                <Eye className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-sm truncate">Voir la vitrine</span>
            </a>
          )}
          {boutiqueSlug && !sidebarOpen && (
            <a
              href={`/shop/${boutiqueSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Voir la vitrine"
              className="flex justify-center py-2"
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-pink-50">
                <Eye className="w-5 h-5 text-pink-400" />
              </div>
            </a>
          )}
        </nav>

        {/* Retour vers l'app principale */}
        <div className="p-2.5 border-t border-gray-100">
          <button
            onClick={() => navigate("/dashboard")}
            title="Retour au tableau de bord"
            className={`
              w-full flex items-center gap-3 rounded-xl text-gray-500
              hover:bg-gray-100 hover:text-gray-800 transition-colors
              ${sidebarOpen ? "px-2.5 py-2" : "px-0 py-2 justify-center"}
            `}
          >
            <div className={`
              flex items-center justify-center rounded-lg flex-shrink-0 bg-gray-100
              ${sidebarOpen ? "w-7 h-7" : "w-9 h-9"}
            `}>
              <ArrowLeft className={`text-gray-500 flex-shrink-0 ${sidebarOpen ? "w-4 h-4" : "w-5 h-5"}`} />
            </div>
            {sidebarOpen && <span className="text-sm">Retour</span>}
          </button>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-x-hidden min-w-0 w-0 ${sidebarOpen ? "lg:ml-56" : "lg:ml-[68px]"}`}>

        {/* Header mobile uniquement */}
        <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-pink-500 flex items-center justify-center flex-shrink-0">
              <Store className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="font-black text-sm text-gray-800 truncate">{boutiqueName}</p>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>

        <footer className="py-2.5 px-6 border-t border-gray-100 text-center text-xs text-gray-400">
          Nexora Shop © {new Date().getFullYear()} — Tous droits réservés
        </footer>
      </div>
    </div>
  );
}
