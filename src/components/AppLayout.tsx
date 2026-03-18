import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Lock, Image, Link2, User, LogOut, Menu, X,
  Search, ChevronRight, TrendingUp, TrendingDown, History, Shield
} from "lucide-react";
import { clearSession } from "@/lib/app-utils";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

const PROFILE_PHOTO = "https://i.ibb.co/pvMbk9MY/1771882604239.jpg";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord", color: "text-primary" },
  { path: "/entrees", icon: TrendingUp, label: "Entrées", color: "text-green-400" },
  { path: "/depenses", icon: TrendingDown, label: "Dépenses", color: "text-red-300" },
  { path: "/historique", icon: History, label: "Historique", color: "text-accent" },
  { path: "/coffre-fort", icon: Lock, label: "Coffre-fort", color: "text-yellow-300" },
  { path: "/medias", icon: Image, label: "Médias", color: "text-blue-300" },
  { path: "/liens", icon: Link2, label: "Liens & Contacts", color: "text-green-300" },
  { path: "/admin", icon: Shield, label: "Administration", color: "text-red-300" },
  { path: "/profil", icon: User, label: "Mon Profil", color: "text-gray-300" },
];

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

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const currentPage = navItems.find(i => i.path === location.pathname);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-20 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 bg-sidebar text-sidebar-foreground flex flex-col
        transition-all duration-300 shadow-brand-lg
        ${sidebarOpen ? "w-56" : "w-14"}
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-destructive flex-shrink-0" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-accent-foreground font-display font-black text-sm">M</span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <div className="font-display font-black text-sm text-sidebar-foreground truncate">MES SECRETS</div>
              <div className="text-xs text-sidebar-foreground/50 truncate">Eric Kpakpo</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors flex-shrink-0"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, color }) => {
            const active = location.pathname === path;
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

        {/* Profile + Logout */}
        <div className="p-2.5 border-t border-sidebar-border space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <img src={PROFILE_PHOTO} alt="Eric" className="w-8 h-8 rounded-full object-cover border-2 border-accent flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate text-sidebar-foreground">Eric Kpakpo</div>
                <div className="text-xs text-sidebar-foreground/50 truncate">Administrateur</div>
              </div>
            </div>
          )}
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

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-56" : "lg:ml-14"}`}>
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-base truncate">{currentPage?.label || "MES SECRETS"}</h2>
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
          <Link to="/profil">
            <img
              src={PROFILE_PHOTO}
              alt="Eric"
              className="w-8 h-8 rounded-full object-cover border-2 border-primary cursor-pointer hover:border-accent transition-colors"
            />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <footer className="py-2.5 px-6 border-t border-border text-center text-xs text-muted-foreground">
          MES SECRETS — Eric Kpakpo © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
