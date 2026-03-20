import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Lock, Image, Link2, User, LogOut, Menu, X,
  Search, ChevronRight, TrendingUp, History,
  HandCoins, PiggyBank, ArrowLeft, Receipt, Store, BadgeCheck, Map,
  ShieldCheck
} from "lucide-react";
import { clearSession, isAdminUser } from "@/lib/app-utils";
import { logoutUser, getNexoraUser, isNexoraAdmin, refreshNexoraSession } from "@/lib/nexora-auth";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";
import nexoraLogo from "@/assets/nexora-logo.png";
import NexoraNotifications from "@/components/NexoraNotifications";

const getNavItems = (isAdmin: boolean) => {
  const items = [
    { path: "/dashboard",        icon: LayoutDashboard, label: "Tableau de bord",    color: "text-red-400",     bg: "bg-red-400/10"     },
    { path: "/entrees-depenses", icon: TrendingUp,      label: "Entrées & Dépenses", color: "text-green-400",   bg: "bg-green-400/10"   },
    { path: "/historique",       icon: History,         label: "Historique",          color: "text-accent",      bg: "bg-accent/10"      },
    { path: "/prets",            icon: HandCoins,       label: "Prêts & Dettes",      color: "text-orange-300",  bg: "bg-orange-300/10"  },
    { path: "/investissements",  icon: PiggyBank,       label: "Investissements",     color: "text-emerald-300", bg: "bg-emerald-300/10" },
    { path: "/factures",         icon: Receipt,         label: "Factures",            color: "text-purple-300",  bg: "bg-purple-300/10"  },
    { path: "/coffre-fort",      icon: Lock,            label: "Coffre-fort",         color: "text-yellow-300",  bg: "bg-yellow-300/10"  },
    { path: "/liens",            icon: Link2,           label: "Liens & Contacts",    color: "text-green-300",   bg: "bg-green-300/10"   },
    { path: "/boutique",         icon: Store,           label: "Nexora Shop",         color: "text-pink-300",    bg: "bg-pink-300/10"    },
    { path: "/immobilier",       icon: Map,             label: "Marché Immobilier",   color: "text-blue-300",    bg: "bg-blue-300/10"    },
  ];
  if (isAdmin) {
    items.push({ path: "/admin",  icon: ShieldCheck, label: "Panel Admin", color: "text-amber-400", bg: "bg-amber-400/10" });
    items.push({ path: "/medias", icon: Image,       label: "Médias",      color: "text-sky-300",   bg: "bg-sky-300/10"  });
  }
  return items;
};

interface AppLayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function AppLayout({ children, searchQuery = "", onSearchChange }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen]             = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ── Refresh session au montage ──
  useEffect(() => {
    refreshNexoraSession();
  }, []);

  const nexoraUser  = getNexoraUser();
  const adminUser   = isNexoraAdmin() || isAdminUser();
  const navItems    = getNavItems(adminUser);

  const displayName = nexoraUser?.nom_prenom || "Eric Kpakpo";
  const displayRole = nexoraUser?.is_admin ? "Administrateur" : nexoraUser?.plan === "premium" ? "Premium" : "Gratuit";
  const hasBadge    = nexoraUser?.badge_premium || nexoraUser?.is_admin;
  const isAdminPage = location.pathname === "/admin";
  const canGoBack   = location.pathname !== "/dashboard";

  const currentPage = navItems.find(i =>
    i.path === location.pathname ||
    (i.path === "/boutique" && location.pathname.startsWith("/boutique")) ||
    (i.path === "/entrees-depenses" && (
      location.pathname === "/entrees" ||
      location.pathname === "/depenses" ||
      location.pathname === "/entrees-depenses"
    ))
  );

  const handleLogout = async () => {
    await logoutUser();
    clearSession();
    navigate("/login");
  };

  // Return conditionnel APRÈS tous les hooks
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-muted/30 overflow-x-hidden max-w-[100vw]">
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-20 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 bg-sidebar text-sidebar-foreground flex flex-col
        transition-all duration-300 shadow-brand-lg
        ${sidebarOpen ? "w-60" : "w-[68px]"}
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-destructive flex-shrink-0" />

        {/* Profil */}
        <Link to="/profil" onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-3.5 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-accent/60">
              {nexoraUser?.avatar_url ? (
                <img src={nexoraUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>
              )}
            </div>
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <div className="font-display font-black text-sm text-sidebar-foreground truncate flex items-center gap-1.5">
                {displayName.split(" ")[0]}
                {hasBadge && <BadgeCheck className="w-4 h-4 text-green-400 flex-shrink-0" />}
              </div>
              <div className="text-xs text-sidebar-foreground/50 truncate">{displayRole}</div>
            </div>
          )}
        </Link>

        {/* Logo + toggle */}
        <div className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-sidebar-border ${!sidebarOpen ? "justify-center" : ""}`}>
          <img src={nexoraLogo} alt="Nexora" className="w-6 h-6 object-contain flex-shrink-0" />
          {sidebarOpen && (
            <span className="font-display font-black text-xs text-sidebar-foreground tracking-widest flex-1">NEXORA</span>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden lg:flex w-6 h-6 items-center justify-center rounded hover:bg-sidebar-accent transition-colors flex-shrink-0 ${!sidebarOpen ? "ml-0" : "ml-auto"}`}>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label, color, bg }) => {
            const active =
              location.pathname === path ||
              (path === "/boutique" && location.pathname.startsWith("/boutique")) ||
              (path === "/entrees-depenses" && (
                location.pathname === "/entrees" ||
                location.pathname === "/depenses" ||
                location.pathname === "/entrees-depenses"
              ));
            const isAdminItem = path === "/admin";
            return (
              <div key={path}>
                {isAdminItem && (
                  <div className="my-2 mx-1">
                    <div className="h-px bg-sidebar-border opacity-40" />
                    {sidebarOpen && (
                      <p className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest px-2 pt-2 pb-1">
                        Administration
                      </p>
                    )}
                  </div>
                )}
                <Link to={path} onClick={() => setMobileSidebarOpen(false)}
                  title={!sidebarOpen ? label : undefined}
                  className={`
                    flex items-center gap-3 rounded-xl transition-all duration-150
                    ${sidebarOpen ? "px-2.5 py-2" : "px-0 py-2 justify-center"}
                    ${active
                      ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }
                  `}>
                  <div className={`
                    flex items-center justify-center rounded-lg flex-shrink-0
                    ${sidebarOpen ? "w-7 h-7" : "w-9 h-9"}
                    ${active ? "bg-white/20" : bg}
                    transition-all duration-150
                  `}>
                    <Icon className={`flex-shrink-0 ${sidebarOpen ? "w-4 h-4" : "w-5 h-5"} ${active ? "text-accent-foreground" : color}`} />
                  </div>
                  {sidebarOpen && <span className="text-sm truncate">{label}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2.5 border-t border-sidebar-border">
          <button onClick={handleLogout} title="Déconnexion"
            className={`
              w-full flex items-center gap-3 rounded-xl text-sidebar-foreground/70
              hover:bg-destructive/20 hover:text-red-200 transition-colors
              ${sidebarOpen ? "px-2.5 py-2" : "px-0 py-2 justify-center"}
            `}>
            <div className={`flex items-center justify-center rounded-lg flex-shrink-0 bg-red-500/10 ${sidebarOpen ? "w-7 h-7" : "w-9 h-9"}`}>
              <LogOut className={`text-red-300 flex-shrink-0 ${sidebarOpen ? "w-4 h-4" : "w-5 h-5"}`} />
            </div>
            {sidebarOpen && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 overflow-x-hidden min-w-0 w-0 ${sidebarOpen ? "lg:ml-60" : "lg:ml-[68px]"}`}>

        {/* Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center gap-3 shadow-sm">
          <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {canGoBack && (
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Retour">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0 flex items-center gap-2">
            {currentPage && (
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${currentPage.bg}`}>
                <currentPage.icon className={`w-4 h-4 ${currentPage.color}`} />
              </div>
            )}
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
                onChange={e => onSearchChange(e.target.value)}
                className="pl-9 h-8 bg-muted border-0 focus:bg-card text-sm rounded-full"
              />
            </div>
          )}

          {/* Notifications */}
          <NexoraNotifications />
        </header>

        <main className="flex-1 p-3 lg:p-5 overflow-x-hidden min-w-0 max-w-full">
          {children}
        </main>

        <footer className="py-2.5 px-6 border-t border-border text-center text-xs text-muted-foreground">
          NEXORA © {new Date().getFullYear()} — Tous droits réservés
        </footer>
      </div>
    </div>
  );
}
