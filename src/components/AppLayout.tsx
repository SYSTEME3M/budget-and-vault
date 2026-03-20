import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Lock, Image, Link2, User, LogOut, Menu, X,
  Search, ChevronRight, TrendingUp, TrendingDown, History, 
  HandCoins, PiggyBank, ArrowLeft, Receipt, Store, BadgeCheck, Map
} from "lucide-react";
import { clearSession, isAdminUser } from "@/lib/app-utils";
import { logoutUser, getNexoraUser, isNexoraAdmin } from "@/lib/nexora-auth";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";
import nexoraLogo from "@/assets/nexora-logo.png";

const getNavItems = (isAdmin: boolean) => {
  const items = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", color: "text-primary" },
    { path: "/entrees-depenses", icon: TrendingUp, label: "Entrées & Dépenses", color: "text-green-400" },
    { path: "/historique", icon: History, label: "Historique", color: "text-accent" },
    { path: "/prets", icon: HandCoins, label: "Prêts & Dettes", color: "text-orange-300" },
    { path: "/investissements", icon: PiggyBank, label: "Investissements", color: "text-emerald-300" },
    { path: "/factures", icon: Receipt, label: "Factures", color: "text-purple-300" },
    { path: "/coffre-fort", icon: Lock, label: "Coffre-fort", color: "text-yellow-300" },
    { path: "/liens", icon: Link2, label: "Liens & Contacts", color: "text-green-300" },
    { path: "/boutique", icon: Store, label: "Nexora Shop", color: "text-pink-300" },
    { path: "/immobilier", icon: Map, label: "Marché Immobilier", color: "text-blue-300" },
  ];

  if (isAdmin) {
    items.push({ path: "/medias", icon: Image, label: "Médias", color: "text-blue-300" });
  }

  return items;
};

interface AppLayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function AppLayout({ children, searchQuery = "", onSearchChange }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const nexoraUser = getNexoraUser();
  const adminUser = isNexoraAdmin() || isAdminUser();
  const navItems = getNavItems(adminUser);

  const displayName = nexoraUser?.nom_prenom || "Eric Kpakpo";
  const displayRole = nexoraUser?.is_admin ? "Administrateur" : nexoraUser?.plan === "premium" ? "Premium" : "Gratuit";
  const hasBadge = nexoraUser?.badge_premium || nexoraUser?.is_admin;

  const handleLogout = async () => {
    await logoutUser();
    clearSession();
    navigate("/login");
  };

  const currentPage = navItems.find(i => 
    i.path === location.pathname || 
    (i.path === "/boutique" && location.pathname.startsWith("/boutique"))
  );
  const canGoBack = location.pathname !== "/dashboard";

  return (
    <div className="min-h-screen flex bg-muted/30">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-30 bg-sidebar text-sidebar-foreground flex flex-col
        transition-all duration-300 shadow-brand-lg
        ${sidebarOpen ? "w-56" : "w-14"}
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-destructive flex-shrink-0" />

        {/* Logo + Profil en haut */}
        <Link
          to="/profil"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-2.5 px-3 py-3 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-accent">
              {nexoraUser?.avatar_url ? (
                <img src={nexoraUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
              )}
            </div>
            {hasBadge && (
              <BadgeCheck className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-300 drop-shadow-sm" />
            )}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <div className="font-display font-black text-sm text-sidebar-foreground truncate flex items-center gap-1">
                {displayName.split(" ")[0]}
                {hasBadge && <BadgeCheck className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />}
              </div>
              <div className="text-xs text-sidebar-foreground/50 truncate">{displayRole}</div>
            </div>
          )}
        </Link>

        {/* Logo Nexora */}
        <div className={`flex items-center gap-2 px-3 py-2 border-b border-sidebar-border ${sidebarOpen ? "" : "justify-center"}`}>
          <img src={nexoraLogo} alt="Nexora" className="w-6 h-6 object-contain flex-shrink-0" />
          {sidebarOpen && (
            <span className="font-display font-black text-xs text-sidebar-foreground tracking-widest">NEXORA</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const active = location.pathname === path ||
              (path === "/boutique" && location.pathname.startsWith("/boutique")) ||
              (path === "/entrees-depenses" && (location.pathname === "/entrees" || location.pathname === "/depenses" || location.pathname === "/entrees-depenses"));
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150
                  ${active
                    ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }
                `}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-accent-foreground" : color}`} />
                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-sidebar-border space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-red-200 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-red-300" />
            {sidebarOpen && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-56" : "lg:ml-14"}`}>
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {canGoBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Retour"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h2 className="font-display font-bold text-foreground text-base truncate">
              {currentPage?.label || "NEXORA"}
            </h2>
          </div>
          
          {onSearchChange && (
            <div className="relative hidden sm:block w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-8 bg-muted border-0 focus:bg-card text-sm rounded-full"
              />
            </div>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <footer className="py-2.5 px-6 border-t border-border text-center text-xs text-muted-foreground">
          NEXORA © {new Date().getFullYear()} — Tous droits réservés
        </footer>
      </div>
    </div>
  );
}
