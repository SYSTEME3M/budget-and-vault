import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Crown, ShieldCheck, Ban, Activity, BarChart3,
  Store, RefreshCw, Search, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertTriangle,
  Trash2, Menu, X, ArrowLeft,
  UserCheck, UserX, Clock, Calendar, DollarSign,
  Unlock, BadgeCheck, Bell,
  Package, ShoppingCart, AlertOctagon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────
interface NexoraUser {
  id: string;
  nom_prenom: string;
  username: string;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  plan: "gratuit" | "premium" | "admin";
  badge_premium: boolean;
  is_active: boolean;
  status: "actif" | "suspendu" | "bloque";
  suspended_reason: string | null;
  blocked_reason: string | null;
  last_login: string | null;
  premium_since: string | null;
  premium_expires_at: string | null;
  created_at: string;
}

interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  actif: boolean;
  created_at: string;
  user_id: string;
}

interface Produit {
  id: string;
  boutique_id: string;
  nom: string;
  description: string | null;
  prix: number;
  prix_promo: number | null;
  categorie: string | null;
  stock: number;
  stock_illimite: boolean;
  photos: any;
  actif: boolean;
  created_at: string;
}

interface Commande {
  id: string;
  boutique_id: string;
  numero: string;
  client_nom: string;
  total: number;
  devise: string;
  statut: string;
  statut_paiement: string;
  created_at: string;
}

type AdminTab = "stats" | "users" | "boutiques" | "abonnements" | "logs";

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (d: string | null) => d
  ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  : "—";

const fmtDatetime = (d: string | null) => d
  ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";

const fmtMoney = (n: number, devise = "FCFA") =>
  `${(n || 0).toLocaleString("fr-FR")} ${devise}`;

const STATUS_CONFIG = {
  actif:    { label: "Actif",    color: "text-green-700",  bg: "bg-green-100",  icon: CheckCircle   },
  suspendu: { label: "Suspendu", color: "text-yellow-700", bg: "bg-yellow-100", icon: AlertTriangle },
  bloque:   { label: "Bloqué",   color: "text-red-700",    bg: "bg-red-100",    icon: XCircle       },
};

const PLAN_CONFIG = {
  gratuit: { label: "Gratuit", color: "text-gray-600",   bg: "bg-gray-100"   },
  premium: { label: "Premium", color: "text-violet-700", bg: "bg-violet-100" },
  admin:   { label: "Admin",   color: "text-amber-700",  bg: "bg-amber-100"  },
};

const ADMIN_CODE = "ERIC";

// ══════════════════════════════════════════════════════════
export default function AdminPanelPage() {
  const { toast } = useToast();
  const navigate = useNavigate(); // ← React Router

  // ── Auth admin
  const [codeInput, setCodeInput]     = useState("");
  const [codeError, setCodeError]     = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── UI
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<AdminTab>(() => {
    try { return (localStorage.getItem("admin_tab") as AdminTab) || "stats"; }
    catch { return "stats"; }
  });
  const [loading, setLoading] = useState(false);

  // ── Data
  const [stats, setStats] = useState({
    totalUsers: 0, premiumUsers: 0, gratuitUsers: 0, adminUsers: 0,
    activeUsers: 0, suspendedUsers: 0, blockedUsers: 0,
    totalBoutiques: 0, boutiquesActives: 0,
    totalProduits: 0, totalCommandes: 0,
    chiffreAffairesTotal: 0,
    newUsersToday: 0, newPremiumToday: 0,
  });
  const [users,     setUsers]     = useState<NexoraUser[]>([]);
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [produits,  setProduits]  = useState<Produit[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [logs,      setLogs]      = useState<any[]>([]);

  // ── Filters
  const [searchUser,       setSearchUser]       = useState("");
  const [filterPlan,       setFilterPlan]       = useState("");
  const [filterStatus,     setFilterStatus]     = useState("");
  const [searchBoutique,   setSearchBoutique]   = useState("");
  const [expandedUser,     setExpandedUser]     = useState<string | null>(null);
  const [expandedBoutique, setExpandedBoutique] = useState<string | null>(null);

  // ── Modals
  const [actionModal,  setActionModal]  = useState<{ type: string; target: any; targetType: "user" | "produit" | "boutique" } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [premiumDays,  setPremiumDays]  = useState("30");

  // ── Vérif session
  useEffect(() => {
    try {
      const auth = sessionStorage.getItem("nexora_admin_auth");
      if (auth === "true") setIsAuthenticated(true);
    } catch {}
  }, []);

  // ── Persister tab
  useEffect(() => {
    try { localStorage.setItem("admin_tab", tab); } catch {}
  }, [tab]);

  // ── Login
  const handleLogin = () => {
    if (codeInput.trim().toUpperCase() === ADMIN_CODE) {
      try { sessionStorage.setItem("nexora_admin_auth", "true"); } catch {}
      setIsAuthenticated(true);
      setCodeError(false);
    } else {
      setCodeError(true);
      setCodeInput("");
    }
  };

  // ── Load data
  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { data: usersData },
        { data: boutiquesData },
        { data: produitsData },
        { data: commandesData },
        { data: logsData },
      ] = await Promise.all([
        supabase.from("nexora_users" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("boutiques" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("produits" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("commandes" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("nexora_logs" as any).select("*, nexora_users(nom_prenom, username)").order("created_at", { ascending: false }).limit(100),
      ]);

      const u = (usersData as NexoraUser[]) || [];
      const b = (boutiquesData as Boutique[]) || [];
      const p = (produitsData as Produit[]) || [];
      const c = (commandesData as Commande[]) || [];
      const today = new Date().toDateString();

      setUsers(u);
      setBoutiques(b);
      setProduits(p);
      setCommandes(c);
      setLogs((logsData as any[]) || []);

      const ca = c.reduce((acc, cmd) => acc + (Number(cmd.total) || 0), 0);

      setStats({
        totalUsers: u.length,
        premiumUsers: u.filter(x => x.plan === "premium").length,
        gratuitUsers: u.filter(x => x.plan === "gratuit").length,
        adminUsers: u.filter(x => x.is_admin).length,
        activeUsers: u.filter(x => x.status === "actif").length,
        suspendedUsers: u.filter(x => x.status === "suspendu").length,
        blockedUsers: u.filter(x => x.status === "bloque").length,
        totalBoutiques: b.length,
        boutiquesActives: b.filter(x => x.actif).length,
        totalProduits: p.length,
        totalCommandes: c.length,
        chiffreAffairesTotal: ca,
        newUsersToday: u.filter(x => new Date(x.created_at).toDateString() === today).length,
        newPremiumToday: u.filter(x => x.plan === "premium" && x.premium_since && new Date(x.premium_since).toDateString() === today).length,
      });
    } catch (err) {
      toast({ title: "Erreur de chargement", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) loadAll();
  }, [isAuthenticated]);

  // ── Logger
  const logAction = async (userId: string | null, action: string, details: string | null) => {
    try {
      await supabase.from("nexora_logs" as any).insert({ user_id: userId, action, details });
    } catch {}
  };

  // ── Notification in-app
  const sendNotification = async (userId: string, titre: string, message: string, type = "warning") => {
    try {
      await supabase.from("nexora_notifications" as any).insert({
        user_id: userId, titre, message, type, lu: false,
      });
    } catch {}
  };

  // ── Actions
  const handleAction = async () => {
    if (!actionModal) return;
    const { type, target, targetType } = actionModal;

    try {
      if (targetType === "produit") {
        const boutique = boutiques.find(b => b.id === target.boutique_id);
        const userId = boutique?.user_id;

        if (type === "supprimer_produit") {
          if (!actionReason.trim()) { toast({ title: "Motif obligatoire", variant: "destructive" }); return; }
          await supabase.from("produits" as any).delete().eq("id", target.id);
          if (userId) await sendNotification(userId, "Produit supprimé",
            `Votre produit "${target.nom}" a été supprimé. Motif : ${actionReason}`);
          await logAction(userId ?? null, "produit_supprimé", `${target.nom} | ${actionReason}`);
          toast({ title: `Produit supprimé` });
        }

        if (type === "restreindre_produit") {
          if (!actionReason.trim()) { toast({ title: "Motif obligatoire", variant: "destructive" }); return; }
          await supabase.from("produits" as any).update({ actif: false }).eq("id", target.id);
          if (userId) await sendNotification(userId, "Produit restreint",
            `Votre produit "${target.nom}" a été restreint. Motif : ${actionReason}`, "danger");
          await logAction(userId ?? null, "produit_restreint", `${target.nom} | ${actionReason}`);
          toast({ title: `Produit restreint` });
        }

        if (type === "activer_produit") {
          await supabase.from("produits" as any).update({ actif: true }).eq("id", target.id);
          await logAction(null, "produit_activé", target.nom);
          toast({ title: `Produit réactivé` });
        }
      }

      if (targetType === "boutique") {
        if (type === "toggle_boutique") {
          const newActif = !target.actif;
          await supabase.from("boutiques" as any).update({ actif: newActif }).eq("id", target.id);
          if (target.user_id) await sendNotification(target.user_id,
            newActif ? "Boutique activée" : "Boutique désactivée",
            newActif
              ? `Votre boutique "${target.nom}" a été réactivée.`
              : `Votre boutique "${target.nom}" a été désactivée.${actionReason ? " Motif : " + actionReason : ""}`,
            newActif ? "success" : "warning"
          );
          await logAction(target.user_id ?? null, newActif ? "boutique_activée" : "boutique_désactivée", target.nom);
          toast({ title: `Boutique ${newActif ? "activée" : "désactivée"}` });
        }
      }

      if (targetType === "user") {
        if (type === "activer_premium") {
          const days = parseInt(premiumDays) || 30;
          const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
          await supabase.from("nexora_users" as any).update({
            plan: "premium", badge_premium: true,
            premium_since: new Date().toISOString(),
            premium_expires_at: expiresAt,
          }).eq("id", target.id);
          await sendNotification(target.id, "Premium activé !",
            `Félicitations ! Votre compte est Premium pour ${days} jours.`, "success");
          await logAction(target.id, "premium_activé", `${days} jours`);
          toast({ title: `Premium activé` });
        }
        if (type === "retirer_premium") {
          await supabase.from("nexora_users" as any).update({
            plan: "gratuit", badge_premium: false,
            premium_since: null, premium_expires_at: null,
          }).eq("id", target.id);
          await sendNotification(target.id, "Premium retiré",
            `Votre abonnement Premium a été retiré.${actionReason ? " Motif : " + actionReason : ""}`, "warning");
          await logAction(target.id, "premium_retiré", actionReason || null);
          toast({ title: `Premium retiré` });
        }
        if (type === "suspendre") {
          if (!actionReason.trim()) { toast({ title: "Motif obligatoire", variant: "destructive" }); return; }
          await supabase.from("nexora_users" as any).update({
            status: "suspendu", is_active: false,
            suspended_at: new Date().toISOString(), suspended_reason: actionReason,
          }).eq("id", target.id);
          await sendNotification(target.id, "Compte suspendu",
            `Votre compte a été suspendu. Motif : ${actionReason}`, "danger");
          await logAction(target.id, "compte_suspendu", actionReason);
          toast({ title: `Compte suspendu` });
        }
        if (type === "bloquer") {
          if (!actionReason.trim()) { toast({ title: "Motif obligatoire", variant: "destructive" }); return; }
          await supabase.from("nexora_users" as any).update({
            status: "bloque", is_active: false,
            blocked_at: new Date().toISOString(), blocked_reason: actionReason,
          }).eq("id", target.id);
          await sendNotification(target.id, "Compte bloqué",
            `Votre compte a été bloqué. Motif : ${actionReason}`, "danger");
          await logAction(target.id, "compte_bloqué", actionReason);
          toast({ title: `Compte bloqué` });
        }
        if (type === "debloquer") {
          await supabase.from("nexora_users" as any).update({
            status: "actif", is_active: true,
            suspended_at: null, suspended_reason: null,
            blocked_at: null, blocked_reason: null,
          }).eq("id", target.id);
          await sendNotification(target.id, "Compte réactivé",
            "Votre compte a été réactivé. Bienvenue !", "success");
          await logAction(target.id, "compte_débloqué", null);
          toast({ title: `Compte débloqué` });
        }
        if (type === "supprimer") {
          await supabase.from("nexora_users" as any).delete().eq("id", target.id);
          await logAction(null, "compte_supprimé", `${target.nom_prenom} (${target.email})`);
          toast({ title: `Compte supprimé` });
        }
      }

      setActionModal(null);
      setActionReason("");
      loadAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // ── Filtres
  const filteredUsers = users.filter(u => {
    const q = searchUser.toLowerCase();
    return (
      (u.nom_prenom.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (filterPlan ? u.plan === filterPlan : true) &&
      (filterStatus ? u.status === filterStatus : true)
    );
  });

  const filteredBoutiques = boutiques.filter(b =>
    b.nom.toLowerCase().includes(searchBoutique.toLowerCase())
  );

  const getProduitsByBoutique = (id: string) => produits.filter(p => p.boutique_id === id);
  const getCommandesByBoutique = (id: string) => commandes.filter(c => c.boutique_id === id);
  const getCaByBoutique = (id: string) => getCommandesByBoutique(id).reduce((a, c) => a + (Number(c.total) || 0), 0);
  const getBoutiquesByUser = (id: string) => boutiques.filter(b => b.user_id === id);
  const getCaByUser = (id: string) => getBoutiquesByUser(id).reduce((a, b) => a + getCaByBoutique(b.id), 0);
  const getCommandesByUser = (id: string) => getBoutiquesByUser(id).flatMap(b => getCommandesByBoutique(b.id));

  const TABS = [
    { id: "stats",       label: "Statistiques", icon: BarChart3 },
    { id: "users",       label: "Utilisateurs",  icon: Users     },
    { id: "boutiques",   label: "Boutiques",     icon: Store     },
    { id: "abonnements", label: "Abonnements",   icon: Crown     },
    { id: "logs",        label: "Logs",          icon: Activity  },
  ];

  // ════════════ LOGIN ════════════
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Espace Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Entrez votre code d'accès</p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Code d'accès"
              className={`text-center text-lg font-bold tracking-widest h-14 rounded-xl ${codeError ? "border-red-500 bg-red-50" : ""}`}
              autoFocus
            />
            {codeError && <p className="text-red-600 text-sm text-center font-medium">Code incorrect.</p>}
            <Button onClick={handleLogin} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-base">
              Accéder au Panel
            </Button>
          </div>
          <button onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      </div>
    );
  }

  // ════════════ PANEL ════════════
  return (
    <div className="min-h-screen bg-background">

      {menuOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMenuOpen(false)} />}

      {/* Menu burger */}
      <div className={`fixed top-0 left-0 h-full z-50 w-72 bg-card border-r border-border shadow-2xl transform transition-transform duration-300 flex flex-col ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span className="font-black text-lg">Panel Admin</span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id as AdminTab); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <button onClick={() => navigate(-1)}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button onClick={() => { try { sessionStorage.removeItem("nexora_admin_auth"); } catch {} setIsAuthenticated(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <XCircle className="w-4 h-4" /> Déconnexion admin
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setMenuOpen(true)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <span className="font-black text-base">{TABS.find(t => t.id === tab)?.label}</span>
        </div>
        <Button onClick={loadAll} disabled={loading} variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-5 pb-16 max-w-3xl mx-auto">

        {/* ── STATS ── */}
        {tab === "stats" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilisateurs</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total",   value: stats.totalUsers,   icon: Users,       color: "text-blue-600",   bg: "bg-blue-50"   },
                { label: "Premium", value: stats.premiumUsers, icon: Crown,       color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Gratuit", value: stats.gratuitUsers, icon: UserCheck,   color: "text-gray-600",   bg: "bg-gray-50"   },
                { label: "Admins",  value: stats.adminUsers,   icon: ShieldCheck, color: "text-amber-600",  bg: "bg-amber-50"  },
              ].map(s => { const Icon = s.icon; return (
                <div key={s.label} className={`${s.bg} border border-border rounded-2xl p-4 flex items-center gap-3`}>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                </div>
              ); })}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Actifs",    value: stats.activeUsers,    color: "text-green-700",  bg: "bg-green-50"  },
                { label: "Suspendus", value: stats.suspendedUsers, color: "text-yellow-700", bg: "bg-yellow-50" },
                { label: "Bloqués",   value: stats.blockedUsers,   color: "text-red-700",    bg: "bg-red-50"    },
              ].map(s => (
                <div key={s.label} className={`${s.bg} border border-border rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Boutiques & Commerce</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Boutiques",        value: stats.totalBoutiques,   icon: Store,        color: "text-pink-600"   },
                { label: "Actives",          value: stats.boutiquesActives, icon: CheckCircle,  color: "text-green-600"  },
                { label: "Produits",         value: stats.totalProduits,    icon: Package,      color: "text-blue-600"   },
                { label: "Commandes",        value: stats.totalCommandes,   icon: ShoppingCart, color: "text-purple-600" },
              ].map(s => { const Icon = s.icon; return (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${s.color} flex-shrink-0`} />
                  <div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                </div>
              ); })}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-emerald-600 font-semibold">Chiffre d'affaires total</div>
                <div className="text-2xl font-black text-emerald-700">{fmtMoney(stats.chiffreAffairesTotal)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Nouveaux aujourd'hui</div>
                  <div className="text-2xl font-black text-blue-600">{stats.newUsersToday}</div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <Crown className="w-8 h-8 text-violet-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Nouveaux premium</div>
                  <div className="text-2xl font-black text-violet-600">{stats.newPremiumToday}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── UTILISATEURS ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Nom, username, email..." className="pl-9" />
              </div>
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Tous les plans</option>
                <option value="gratuit">Gratuit</option>
                <option value="premium">Premium</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Tous statuts</option>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="bloque">Bloqué</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">{filteredUsers.length} utilisateur(s)</p>
            <div className="space-y-2">
              {filteredUsers.map(user => {
                const isExpanded = expandedUser === user.id;
                const StatusIcon = STATUS_CONFIG[user.status]?.icon || CheckCircle;
                const userCommandes = getCommandesByUser(user.id);
                const userCa = getCaByUser(user.id);
                const userBoutiques = getBoutiquesByUser(user.id);
                return (
                  <div key={user.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm overflow-hidden">
                          {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="" /> : user.nom_prenom.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{user.nom_prenom}</span>
                            {user.is_admin && <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PLAN_CONFIG[user.plan]?.bg} ${PLAN_CONFIG[user.plan]?.color}`}>
                              {PLAN_CONFIG[user.plan]?.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${STATUS_CONFIG[user.status]?.bg} ${STATUS_CONFIG[user.status]?.color}`}>
                              <StatusIcon className="w-3 h-3" />{STATUS_CONFIG[user.status]?.label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">@{user.username} · {user.email}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(user.created_at)}</span>
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold"><DollarSign className="w-3 h-3" />{fmtMoney(userCa)}</span>
                          </div>
                        </div>
                        <button onClick={() => setExpandedUser(isExpanded ? null : user.id)} className="p-1.5 rounded-lg hover:bg-muted flex-shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                        {user.plan === "premium" && (
                          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm">
                            <p className="font-semibold text-violet-700 mb-1">Premium</p>
                            <p className="text-xs text-violet-600">Depuis : {fmtDate(user.premium_since)}</p>
                            <p className="text-xs text-violet-600">Expire : {fmtDate(user.premium_expires_at)}</p>
                          </div>
                        )}
                        {userBoutiques.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Boutiques ({userBoutiques.length})</p>
                            <div className="space-y-1">
                              {userBoutiques.map(b => (
                                <div key={b.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 text-xs">
                                  <span className="font-medium">{b.nom}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-emerald-600 font-semibold">{fmtMoney(getCaByBoutique(b.id))}</span>
                                    <span className={`px-2 py-0.5 rounded-full font-semibold ${b.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                      {b.actif ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {userCommandes.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Commandes ({userCommandes.length}) — {fmtMoney(userCa)}</p>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {userCommandes.slice(0, 10).map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 text-xs gap-2">
                                  <span className="font-mono text-muted-foreground shrink-0">{c.numero}</span>
                                  <span className="flex-1 truncate">{c.client_nom}</span>
                                  <span className="font-bold text-emerald-600 shrink-0">{fmtMoney(c.total, c.devise)}</span>
                                  <span className={`px-2 py-0.5 rounded-full font-semibold shrink-0 ${c.statut === "livre" ? "bg-green-100 text-green-700" : c.statut === "annule" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {c.statut}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {user.plan !== "premium" && !user.is_admin && (
                            <button onClick={() => { setActionModal({ type: "activer_premium", target: user, targetType: "user" }); setActionReason(""); setPremiumDays("30"); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium transition-colors">
                              <Crown className="w-3.5 h-3.5" /> Activer Premium
                            </button>
                          )}
                          {user.plan === "premium" && (
                            <button onClick={() => { setActionModal({ type: "retirer_premium", target: user, targetType: "user" }); setActionReason(""); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors">
                              <UserX className="w-3.5 h-3.5" /> Retirer Premium
                            </button>
                          )}
                          {user.status === "actif" && !user.is_admin && (
                            <>
                              <button onClick={() => { setActionModal({ type: "suspendre", target: user, targetType: "user" }); setActionReason(""); }}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium transition-colors">
                                <AlertTriangle className="w-3.5 h-3.5" /> Suspendre
                              </button>
                              <button onClick={() => { setActionModal({ type: "bloquer", target: user, targetType: "user" }); setActionReason(""); }}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors">
                                <Ban className="w-3.5 h-3.5" /> Bloquer
                              </button>
                            </>
                          )}
                          {(user.status === "suspendu" || user.status === "bloque") && (
                            <button onClick={() => { setActionModal({ type: "debloquer", target: user, targetType: "user" }); setActionReason(""); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors">
                              <Unlock className="w-3.5 h-3.5" /> Débloquer
                            </button>
                          )}
                          {!user.is_admin && (
                            <button onClick={() => { setActionModal({ type: "supprimer", target: user, targetType: "user" }); setActionReason(""); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-medium transition-colors ml-auto">
                              <Trash2 className="w-3.5 h-3.5" /> Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BOUTIQUES ── */}
        {tab === "boutiques" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchBoutique} onChange={e => setSearchBoutique(e.target.value)} placeholder="Rechercher une boutique..." className="pl-9" />
            </div>
            <p className="text-xs text-muted-foreground">{filteredBoutiques.length} boutique(s)</p>
            <div className="space-y-3">
              {filteredBoutiques.map(boutique => {
                const isExpanded = expandedBoutique === boutique.id;
                const produitsBoutique = getProduitsByBoutique(boutique.id);
                const commandesBoutique = getCommandesByBoutique(boutique.id);
                const ca = getCaByBoutique(boutique.id);
                const owner = users.find(u => u.id === boutique.user_id);
                return (
                  <div key={boutique.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-pink-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{boutique.nom}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${boutique.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {boutique.actif ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">/{boutique.slug} · {owner?.nom_prenom || "Inconnu"}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                            <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" />{produitsBoutique.length} produits</span>
                            <span className="text-muted-foreground flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{commandesBoutique.length} commandes</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmtMoney(ca)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => { setActionModal({ type: "toggle_boutique", target: boutique, targetType: "boutique" }); setActionReason(""); }}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${boutique.actif ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                            {boutique.actif ? "Désactiver" : "Activer"}
                          </button>
                          <button onClick={() => setExpandedBoutique(isExpanded ? null : boutique.id)} className="p-1.5 rounded-lg hover:bg-muted">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                        {commandesBoutique.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Commandes ({commandesBoutique.length})</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {commandesBoutique.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 text-xs gap-2">
                                  <span className="font-mono text-muted-foreground shrink-0">{c.numero}</span>
                                  <span className="flex-1 truncate">{c.client_nom}</span>
                                  <span className="font-bold text-emerald-600 shrink-0">{fmtMoney(c.total, c.devise)}</span>
                                  <span className={`px-2 py-0.5 rounded-full font-semibold shrink-0 ${c.statut === "livre" ? "bg-green-100 text-green-700" : c.statut === "annule" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                    {c.statut}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Produits ({produitsBoutique.length})</p>
                          {produitsBoutique.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Aucun produit</p>
                          ) : (
                            <div className="space-y-2">
                              {produitsBoutique.map(produit => {
                                const photos = produit.photos;
                                const photo = Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
                                return (
                                  <div key={produit.id} className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                                      {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm truncate">{produit.nom}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${produit.actif ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                          {produit.actif ? "Actif" : "Restreint"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                        <span className="font-bold text-foreground">{fmtMoney(produit.prix)}</span>
                                        {produit.stock_illimite ? <span>Illimité</span> : <span>Stock: {produit.stock}</span>}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                                      {produit.actif ? (
                                        <button onClick={() => { setActionModal({ type: "restreindre_produit", target: produit, targetType: "produit" }); setActionReason(""); }}
                                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium transition-colors">
                                          <AlertOctagon className="w-3 h-3" /> Restreindre
                                        </button>
                                      ) : (
                                        <button onClick={() => { setActionModal({ type: "activer_produit", target: produit, targetType: "produit" }); setActionReason(""); }}
                                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors">
                                          <CheckCircle className="w-3 h-3" /> Activer
                                        </button>
                                      )}
                                      <button onClick={() => { setActionModal({ type: "supprimer_produit", target: produit, targetType: "produit" }); setActionReason(""); }}
                                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors">
                                        <Trash2 className="w-3 h-3" /> Supprimer
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ABONNEMENTS ── */}
        {tab === "abonnements" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                <Crown className="w-6 h-6 text-violet-600 mb-2" />
                <div className="text-3xl font-black text-violet-700">{stats.premiumUsers}</div>
                <div className="text-xs text-violet-600">Premium actifs</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <Users className="w-6 h-6 text-gray-500 mb-2" />
                <div className="text-3xl font-black text-gray-700">{stats.gratuitUsers}</div>
                <div className="text-xs text-gray-500">Gratuit</div>
              </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comptes Premium</p>
            {users.filter(u => u.plan === "premium").length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl text-sm">Aucun utilisateur premium</div>
            ) : users.filter(u => u.plan === "premium").map(user => (
              <div key={user.id} className="bg-card border border-violet-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center font-bold text-violet-700 text-sm flex-shrink-0">
                  {user.nom_prenom.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{user.nom_prenom}</div>
                  <div className="text-xs text-muted-foreground">@{user.username}</div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>Depuis : {fmtDate(user.premium_since)}</span>
                    <span className={user.premium_expires_at && new Date(user.premium_expires_at) < new Date() ? "text-red-500 font-semibold" : ""}>
                      Expire : {fmtDate(user.premium_expires_at)}
                    </span>
                  </div>
                </div>
                <button onClick={() => { setActionModal({ type: "retirer_premium", target: user, targetType: "user" }); setActionReason(""); }}
                  className="flex-shrink-0 text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors">
                  Retirer
                </button>
              </div>
            ))}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4">Activation rapide</p>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {users.filter(u => u.plan === "gratuit").slice(0, 15).map(user => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium">{user.nom_prenom}</span>
                    <span className="text-xs text-muted-foreground ml-2">@{user.username}</span>
                  </div>
                  <button onClick={() => { setActionModal({ type: "activer_premium", target: user, targetType: "user" }); setActionReason(""); setPremiumDays("30"); }}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium transition-colors">
                    <Crown className="w-3 h-3" /> Activer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{logs.length} entrées</p>
              <Button variant="outline" size="sm" onClick={() => {
                if (window.confirm("Vider tous les logs ?")) {
                  supabase.from("nexora_logs" as any).delete()
                    .neq("id", "00000000-0000-0000-0000-000000000000")
                    .then(() => { toast({ title: "Logs vidés" }); loadAll(); });
                }
              }} className="gap-1 text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Vider
              </Button>
            </div>
            {logs.map(log => (
              <div key={log.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary">{log.action}</span>
                    {log.nexora_users && <span className="text-xs text-muted-foreground">@{(log.nexora_users as any).username}</span>}
                  </div>
                  {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{fmtDatetime(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-black text-lg">
              {actionModal.type === "activer_premium"     && "Activer Premium"}
              {actionModal.type === "retirer_premium"     && "Retirer Premium"}
              {actionModal.type === "suspendre"           && "Suspendre le compte"}
              {actionModal.type === "bloquer"             && "Bloquer le compte"}
              {actionModal.type === "debloquer"           && "Débloquer le compte"}
              {actionModal.type === "supprimer"           && "Supprimer le compte"}
              {actionModal.type === "supprimer_produit"   && "Supprimer le produit"}
              {actionModal.type === "restreindre_produit" && "Restreindre le produit"}
              {actionModal.type === "activer_produit"     && "Réactiver le produit"}
              {actionModal.type === "toggle_boutique"     && (actionModal.target.actif ? "Désactiver la boutique" : "Activer la boutique")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {actionModal.targetType === "user"     && <><span>Utilisateur : </span><span className="font-bold text-foreground">{actionModal.target.nom_prenom}</span></>}
              {actionModal.targetType === "produit"  && <><span>Produit : </span><span className="font-bold text-foreground">{actionModal.target.nom}</span></>}
              {actionModal.targetType === "boutique" && <><span>Boutique : </span><span className="font-bold text-foreground">{actionModal.target.nom}</span></>}
            </p>
            {actionModal.type === "activer_premium" && (
              <div>
                <label className="text-sm font-medium">Durée (jours)</label>
                <Input type="number" value={premiumDays} onChange={e => setPremiumDays(e.target.value)} className="mt-1" placeholder="30" />
              </div>
            )}
            {["retirer_premium", "suspendre", "bloquer", "supprimer", "supprimer_produit", "restreindre_produit", "toggle_boutique"].includes(actionModal.type) && (
              <div>
                <label className="text-sm font-medium">
                  Motif {["supprimer", "toggle_boutique"].includes(actionModal.type) ? "(optionnel)" : "*"}
                </label>
                <Input value={actionReason} onChange={e => setActionReason(e.target.value)} className="mt-1" placeholder="Précisez le motif..." />
                <p className="text-xs text-muted-foreground mt-1">Ce motif sera envoyé en notification à l'utilisateur.</p>
              </div>
            )}
            {actionModal.type === "supprimer" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                Action irréversible. Toutes les données seront supprimées.
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleAction} className={`flex-1 text-white ${
                ["supprimer", "bloquer", "supprimer_produit"].includes(actionModal.type) ? "bg-red-600 hover:bg-red-700" :
                ["suspendre", "restreindre_produit"].includes(actionModal.type) ? "bg-yellow-600 hover:bg-yellow-700" :
                ["debloquer", "activer_premium", "activer_produit"].includes(actionModal.type) ? "bg-green-600 hover:bg-green-700" :
                "bg-gray-600 hover:bg-gray-700"
              }`}>Confirmer</Button>
              <Button variant="outline" onClick={() => { setActionModal(null); setActionReason(""); }} className="flex-1">Annuler</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
