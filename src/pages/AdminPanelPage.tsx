import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import {
  Users, Crown, ShieldCheck, Ban, Activity, BarChart3,
  Store, TrendingUp, TrendingDown, Receipt, HandCoins,
  CreditCard, RefreshCw, Search, ChevronDown, ChevronUp,
  Eye, EyeOff, CheckCircle, XCircle, AlertTriangle,
  Settings, Zap, Globe, Key, Save, Trash2, Plus,
  UserCheck, UserX, Clock, Calendar, DollarSign,
  PiggyBank, Lock, Unlock, BadgeCheck, LogIn
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

interface PaymentConfig {
  id: string;
  provider: string;
  label: string;
  api_key: string | null;
  api_secret: string | null;
  webhook_url: string | null;
  is_active: boolean;
  mode: "test" | "live";
}

interface Log {
  id: string;
  user_id: string | null;
  action: string;
  details: string | null;
  created_at: string;
  nexora_users?: { nom_prenom: string; username: string } | null;
}

type AdminTab = "stats" | "users" | "abonnements" | "boutiques" | "paiements" | "logs";

// ── Helpers ────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDatetime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CONFIG = {
  actif:    { label: "Actif",    color: "text-green-700",  bg: "bg-green-100",  icon: CheckCircle },
  suspendu: { label: "Suspendu", color: "text-yellow-700", bg: "bg-yellow-100", icon: AlertTriangle },
  bloque:   { label: "Bloqué",   color: "text-red-700",    bg: "bg-red-100",    icon: XCircle },
};

const PLAN_CONFIG = {
  gratuit: { label: "Gratuit", color: "text-gray-600",   bg: "bg-gray-100"   },
  premium: { label: "Premium", color: "text-violet-700", bg: "bg-violet-100" },
  admin:   { label: "Admin",   color: "text-amber-700",  bg: "bg-amber-100"  },
};

// ══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AdminPanelPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>("stats");
  const [loading, setLoading] = useState(false);

  // ── Stats globales
  const [stats, setStats] = useState({
    totalUsers: 0, premiumUsers: 0, gratuitUsers: 0, adminUsers: 0,
    activeUsers: 0, suspendedUsers: 0, blockedUsers: 0,
    totalBoutiques: 0, totalFactures: 0, totalPrets: 0,
    totalDepenses: 0, totalEntrees: 0, totalInvestissements: 0,
    newUsersToday: 0, newPremiumToday: 0,
  });

  // ── Users
  const [users, setUsers] = useState<NexoraUser[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ type: string; user: NexoraUser } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [premiumDays, setPremiumDays] = useState("30");

  // ── Boutiques
  const [boutiques, setBoutiques] = useState<any[]>([]);

  // ── Logs
  const [logs, setLogs] = useState<Log[]>([]);

  // ── Payment configs
  const [payConfigs, setPayConfigs] = useState<PaymentConfig[]>([]);
  const [editingPay, setEditingPay] = useState<PaymentConfig | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // ── Load all data
  const loadAll = async () => {
    setLoading(true);
    try {
      const [
        { data: usersData },
        { data: boutiquesData },
        { data: facturesData },
        { data: pretsData },
        { data: depensesData },
        { data: entreesData },
        { data: investData },
        { data: logsData },
        { data: payData },
      ] = await Promise.all([
        supabase.from("nexora_users" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("boutiques" as any).select("*").order("created_at", { ascending: false }),
        supabase.from("factures" as any).select("id", { count: "exact" }),
        supabase.from("prets" as any).select("id", { count: "exact" }),
        supabase.from("depenses" as any).select("id", { count: "exact" }),
        supabase.from("entrees" as any).select("id", { count: "exact" }),
        supabase.from("investissements" as any).select("id", { count: "exact" }),
        supabase.from("nexora_logs" as any).select("*, nexora_users(nom_prenom, username)").order("created_at", { ascending: false }).limit(100),
        supabase.from("nexora_payment_config" as any).select("*"),
      ]);

      const u = (usersData as NexoraUser[]) || [];
      const today = new Date().toDateString();

      setUsers(u);
      setBoutiques(boutiquesData || []);
      setLogs((logsData as any[]) || []);
      setPayConfigs((payData as PaymentConfig[]) || []);

      setStats({
        totalUsers: u.length,
        premiumUsers: u.filter(x => x.plan === "premium").length,
        gratuitUsers: u.filter(x => x.plan === "gratuit").length,
        adminUsers: u.filter(x => x.plan === "admin" || x.is_admin).length,
        activeUsers: u.filter(x => x.status === "actif").length,
        suspendedUsers: u.filter(x => x.status === "suspendu").length,
        blockedUsers: u.filter(x => x.status === "bloque").length,
        totalBoutiques: (boutiquesData || []).length,
        totalFactures: (facturesData || []).length,
        totalPrets: (pretsData || []).length,
        totalDepenses: (depensesData || []).length,
        totalEntrees: (entreesData || []).length,
        totalInvestissements: (investData || []).length,
        newUsersToday: u.filter(x => new Date(x.created_at).toDateString() === today).length,
        newPremiumToday: u.filter(x => x.plan === "premium" && x.premium_since && new Date(x.premium_since).toDateString() === today).length,
      });
    } catch (err) {
      toast({ title: "Erreur de chargement", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ── Actions utilisateur
  const handleUserAction = async () => {
    if (!actionModal) return;
    const { type, user } = actionModal;

    try {
      if (type === "activer_premium") {
        const days = parseInt(premiumDays) || 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("nexora_users" as any).update({
          plan: "premium", badge_premium: true,
          premium_since: new Date().toISOString(),
          premium_expires_at: expiresAt,
        }).eq("id", user.id);
        await supabase.from("nexora_abonnements" as any).insert({
          user_id: user.id, plan: "premium", action: "activation",
          montant: 10, devise: "USD", mode_paiement: "manuel",
          note: `Activé manuellement pour ${days} jours`, expires_at: expiresAt,
        });
        await logAction(user.id, "premium_activé", `Plan premium activé pour ${days} jours`);
        toast({ title: `Premium activé pour ${user.nom_prenom} (${days} jours)` });
      }

      else if (type === "retirer_premium") {
        await supabase.from("nexora_users" as any).update({
          plan: "gratuit", badge_premium: false,
          premium_since: null, premium_expires_at: null,
        }).eq("id", user.id);
        await supabase.from("nexora_abonnements" as any).insert({
          user_id: user.id, plan: "gratuit", action: "annulation",
          note: actionReason || "Retiré manuellement par admin",
        });
        await logAction(user.id, "premium_retiré", actionReason || "Retiré par admin");
        toast({ title: `Premium retiré pour ${user.nom_prenom}` });
      }

      else if (type === "suspendre") {
        await supabase.from("nexora_users" as any).update({
          status: "suspendu", is_active: false,
          suspended_at: new Date().toISOString(),
          suspended_reason: actionReason || "Suspension admin",
        }).eq("id", user.id);
        await logAction(user.id, "compte_suspendu", actionReason);
        toast({ title: `Compte de ${user.nom_prenom} suspendu` });
      }

      else if (type === "bloquer") {
        await supabase.from("nexora_users" as any).update({
          status: "bloque", is_active: false,
          blocked_at: new Date().toISOString(),
          blocked_reason: actionReason || "Blocage admin",
        }).eq("id", user.id);
        await logAction(user.id, "compte_bloqué", actionReason);
        toast({ title: `Compte de ${user.nom_prenom} bloqué` });
      }

      else if (type === "debloquer") {
        await supabase.from("nexora_users" as any).update({
          status: "actif", is_active: true,
          suspended_at: null, suspended_reason: null,
          blocked_at: null, blocked_reason: null,
        }).eq("id", user.id);
        await logAction(user.id, "compte_débloqué", "Débloqué par admin");
        toast({ title: `Compte de ${user.nom_prenom} débloqué` });
      }

      else if (type === "supprimer") {
        await supabase.from("nexora_users" as any).delete().eq("id", user.id);
        toast({ title: `Compte de ${user.nom_prenom} supprimé` });
      }

      setActionModal(null);
      setActionReason("");
      loadAll();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const logAction = async (userId: string | null, action: string, details: string | null) => {
    await supabase.from("nexora_logs" as any).insert({ user_id: userId, action, details });
  };

  // ── Sauvegarder config paiement
  const savePayConfig = async () => {
    if (!editingPay) return;
    if (editingPay.id) {
      await supabase.from("nexora_payment_config" as any).update({
        label: editingPay.label, api_key: editingPay.api_key,
        api_secret: editingPay.api_secret, webhook_url: editingPay.webhook_url,
        is_active: editingPay.is_active, mode: editingPay.mode,
        updated_at: new Date().toISOString(),
      }).eq("id", editingPay.id);
    } else {
      await supabase.from("nexora_payment_config" as any).insert({
        provider: editingPay.provider, label: editingPay.label,
        api_key: editingPay.api_key, api_secret: editingPay.api_secret,
        webhook_url: editingPay.webhook_url, is_active: editingPay.is_active,
        mode: editingPay.mode,
      });
    }
    toast({ title: "Configuration sauvegardée" });
    setEditingPay(null);
    loadAll();
  };

  // ── Filtres utilisateurs
  const filteredUsers = users.filter(u => {
    const matchSearch = u.nom_prenom.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchPlan = filterPlan ? u.plan === filterPlan : true;
    const matchStatus = filterStatus ? u.status === filterStatus : true;
    return matchSearch && matchPlan && matchStatus;
  });

  // ── Nav tabs
  const TABS = [
    { id: "stats",       label: "Statistiques",  icon: BarChart3   },
    { id: "users",       label: "Utilisateurs",   icon: Users       },
    { id: "abonnements", label: "Abonnements",    icon: Crown       },
    { id: "boutiques",   label: "Boutiques",      icon: Store       },
    { id: "paiements",   label: "API Paiement",   icon: CreditCard  },
    { id: "logs",        label: "Logs",           icon: Activity    },
  ];

  return (
    <AppLayout>
      <div className="space-y-5 pb-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" /> Panel Admin
            </h1>
            <p className="text-sm text-muted-foreground">Gestion complète de la plateforme Nexora</p>
          </div>
          <Button onClick={loadAll} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 overflow-x-auto bg-muted rounded-xl p-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  tab === t.id ? "bg-white shadow text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════
            STATS
        ════════════════════════════════════ */}
        {tab === "stats" && (
          <div className="space-y-4">
            {/* Utilisateurs */}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Utilisateurs</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: stats.totalUsers,    icon: Users,      color: "text-blue-600",   bg: "bg-blue-50"   },
                { label: "Premium", value: stats.premiumUsers, icon: Crown,      color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Gratuit", value: stats.gratuitUsers, icon: UserCheck,  color: "text-gray-600",   bg: "bg-gray-50"   },
                { label: "Admins", value: stats.adminUsers,    icon: ShieldCheck, color: "text-amber-600",  bg: "bg-amber-50"  },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`${s.bg} border border-border rounded-2xl p-4 flex items-center gap-3`}>
                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Statuts */}
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

            {/* Aujourd'hui */}
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

            {/* Données plateforme */}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Données plateforme</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Boutiques",      value: stats.totalBoutiques,      icon: Store,       color: "text-pink-600"   },
                { label: "Factures",       value: stats.totalFactures,       icon: Receipt,     color: "text-purple-600" },
                { label: "Prêts/Dettes",   value: stats.totalPrets,          icon: HandCoins,   color: "text-orange-600" },
                { label: "Dépenses",       value: stats.totalDepenses,       icon: TrendingDown, color: "text-red-600"   },
                { label: "Entrées",        value: stats.totalEntrees,        icon: TrendingUp,  color: "text-green-600"  },
                { label: "Investissements", value: stats.totalInvestissements, icon: PiggyBank,  color: "text-emerald-600"},
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${s.color} flex-shrink-0`} />
                    <div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            UTILISATEURS
        ════════════════════════════════════ */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={searchUser} onChange={e => setSearchUser(e.target.value)}
                  placeholder="Rechercher nom, username, email..." className="pl-9" />
              </div>
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Tous les plans</option>
                <option value="gratuit">Gratuit</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
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

            {/* Liste */}
            <div className="space-y-2">
              {filteredUsers.map(user => {
                const isExpanded = expandedUser === user.id;
                const StatusIcon = STATUS_CONFIG[user.status]?.icon || CheckCircle;
                return (
                  <div key={user.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                          {user.avatar_url
                            ? <img src={user.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                            : user.nom_prenom.slice(0, 2).toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm truncate">{user.nom_prenom}</span>
                            {user.is_admin && <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PLAN_CONFIG[user.plan].bg} ${PLAN_CONFIG[user.plan].color}`}>
                              {PLAN_CONFIG[user.plan].label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${STATUS_CONFIG[user.status].bg} ${STATUS_CONFIG[user.status].color}`}>
                              <StatusIcon className="w-3 h-3" />{STATUS_CONFIG[user.status].label}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">@{user.username} · {user.email}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtDate(user.created_at)}</span>
                            <span className="flex items-center gap-1"><LogIn className="w-3 h-3" /> {fmtDatetime(user.last_login)}</span>
                          </div>
                        </div>
                        <button onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                          className="p-1.5 rounded-lg hover:bg-muted flex-shrink-0">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border bg-muted/30 p-4 space-y-4">
                        {/* Infos premium */}
                        {user.plan === "premium" && (
                          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm">
                            <p className="font-semibold text-violet-700 mb-1">Abonnement Premium</p>
                            <p className="text-xs text-violet-600">Depuis : {fmtDate(user.premium_since)}</p>
                            <p className="text-xs text-violet-600">Expire : {fmtDate(user.premium_expires_at)}</p>
                          </div>
                        )}
                        {(user.suspended_reason || user.blocked_reason) && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                            <p className="font-semibold mb-1">Raison :</p>
                            <p>{user.suspended_reason || user.blocked_reason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {user.plan !== "premium" && user.plan !== "admin" && (
                            <button onClick={() => { setActionModal({ type: "activer_premium", user }); setActionReason(""); setPremiumDays("30"); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium transition-colors">
                              <Crown className="w-3.5 h-3.5" /> Activer Premium
                            </button>
                          )}
                          {user.plan === "premium" && (
                            <button onClick={() => { setActionModal({ type: "retirer_premium", user }); setActionReason(""); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors">
                              <UserX className="w-3.5 h-3.5" /> Retirer Premium
                            </button>
                          )}
                          {user.status === "actif" && !user.is_admin && (
                            <>
                              <button onClick={() => { setActionModal({ type: "suspendre", user }); setActionReason(""); }}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium transition-colors">
                                <AlertTriangle className="w-3.5 h-3.5" /> Suspendre
                              </button>
                              <button onClick={() => { setActionModal({ type: "bloquer", user }); setActionReason(""); }}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors">
                                <Ban className="w-3.5 h-3.5" /> Bloquer
                              </button>
                            </>
                          )}
                          {(user.status === "suspendu" || user.status === "bloque") && (
                            <button onClick={() => { setActionModal({ type: "debloquer", user }); setActionReason(""); }}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors">
                              <Unlock className="w-3.5 h-3.5" /> Débloquer
                            </button>
                          )}
                          {!user.is_admin && (
                            <button onClick={() => { setActionModal({ type: "supprimer", user }); setActionReason(""); }}
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

        {/* ════════════════════════════════════
            ABONNEMENTS
        ════════════════════════════════════ */}
        {tab === "abonnements" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                <Crown className="w-6 h-6 text-violet-600 mb-2" />
                <div className="text-3xl font-black text-violet-700">{stats.premiumUsers}</div>
                <div className="text-xs text-violet-600">Utilisateurs Premium actifs</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <Users className="w-6 h-6 text-gray-500 mb-2" />
                <div className="text-3xl font-black text-gray-700">{stats.gratuitUsers}</div>
                <div className="text-xs text-gray-500">Utilisateurs Gratuit</div>
              </div>
            </div>

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Comptes Premium</p>
            <div className="space-y-2">
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
                  <button onClick={() => { setActionModal({ type: "retirer_premium", user }); setActionReason(""); }}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 transition-colors">
                    Retirer
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-4">Activation rapide Premium</p>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-sm text-muted-foreground">Sélectionnez un utilisateur gratuit pour lui activer le Premium manuellement.</p>
              <div className="space-y-2">
                {users.filter(u => u.plan === "gratuit").slice(0, 10).map(user => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm font-medium">{user.nom_prenom}</span>
                      <span className="text-xs text-muted-foreground ml-2">@{user.username}</span>
                    </div>
                    <button onClick={() => { setActionModal({ type: "activer_premium", user }); setActionReason(""); setPremiumDays("30"); }}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 font-medium transition-colors">
                      <Crown className="w-3 h-3" /> Activer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            BOUTIQUES
        ════════════════════════════════════ */}
        {tab === "boutiques" && (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 flex items-center gap-3">
              <Store className="w-8 h-8 text-pink-600" />
              <div>
                <div className="text-3xl font-black text-pink-700">{boutiques.length}</div>
                <div className="text-xs text-pink-600">Boutiques créées sur la plateforme</div>
              </div>
            </div>

            <div className="space-y-2">
              {boutiques.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl text-sm">Aucune boutique</div>
              ) : boutiques.map((b: any) => (
                <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{b.nom}</div>
                    <div className="text-xs text-muted-foreground">/{b.slug} · {fmtDate(b.created_at)}</div>
                    {b.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{b.description}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${b.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {b.actif ? "Active" : "Inactive"}
                    </span>
                    <a href={`/shop/${b.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-2 py-1 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors">
                      Voir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            API PAIEMENT
        ════════════════════════════════════ */}
        {tab === "paiements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Configurez les APIs de paiement de la plateforme.</p>
              <Button size="sm" onClick={() => setEditingPay({ id: "", provider: "fedapay", label: "FedaPay", api_key: "", api_secret: "", webhook_url: "", is_active: false, mode: "test" })} className="gap-1">
                <Plus className="w-4 h-4" /> Ajouter
              </Button>
            </div>

            {/* Formulaire édition */}
            {editingPay && (
              <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-sm">{editingPay.id ? "Modifier" : "Nouvelle"} configuration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Provider</label>
                    <select value={editingPay.provider} onChange={e => setEditingPay({...editingPay, provider: e.target.value})}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="fedapay">FedaPay</option>
                      <option value="paydunya">PayDunya</option>
                      <option value="wave">Wave</option>
                      <option value="mtn_momo">MTN MoMo</option>
                      <option value="stripe">Stripe</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Label affiché</label>
                    <Input value={editingPay.label} onChange={e => setEditingPay({...editingPay, label: e.target.value})} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">API Key</label>
                    <div className="flex gap-2 mt-1">
                      <Input type={showApiKey["key"] ? "text" : "password"} value={editingPay.api_key || ""} onChange={e => setEditingPay({...editingPay, api_key: e.target.value})} placeholder="sk_..." className="flex-1" />
                      <button onClick={() => setShowApiKey(p => ({...p, key: !p["key"]}))} className="p-2 rounded-md border border-input hover:bg-muted">
                        {showApiKey["key"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">API Secret</label>
                    <div className="flex gap-2 mt-1">
                      <Input type={showApiKey["secret"] ? "text" : "password"} value={editingPay.api_secret || ""} onChange={e => setEditingPay({...editingPay, api_secret: e.target.value})} placeholder="sk_secret_..." className="flex-1" />
                      <button onClick={() => setShowApiKey(p => ({...p, secret: !p["secret"]}))} className="p-2 rounded-md border border-input hover:bg-muted">
                        {showApiKey["secret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium">Webhook URL</label>
                    <Input value={editingPay.webhook_url || ""} onChange={e => setEditingPay({...editingPay, webhook_url: e.target.value})} placeholder="https://..." className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Mode</label>
                    <select value={editingPay.mode} onChange={e => setEditingPay({...editingPay, mode: e.target.value as "test" | "live"})}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="test">Test</option>
                      <option value="live">Live (Production)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <label className="text-xs font-medium">Actif</label>
                    <button onClick={() => setEditingPay({...editingPay, is_active: !editingPay.is_active})}
                      className={`relative w-10 h-5 rounded-full transition-colors ${editingPay.is_active ? "bg-green-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${editingPay.is_active ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={savePayConfig} className="bg-primary text-white gap-1"><Save className="w-4 h-4" /> Sauvegarder</Button>
                  <Button variant="outline" onClick={() => setEditingPay(null)}>Annuler</Button>
                </div>
              </div>
            )}

            {/* Liste configs */}
            {payConfigs.length === 0 && !editingPay ? (
              <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl text-sm">
                <CreditCard className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                Aucune API de paiement configurée
              </div>
            ) : payConfigs.map(cfg => (
              <div key={cfg.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.is_active ? "bg-green-100" : "bg-gray-100"}`}>
                  <CreditCard className={`w-5 h-5 ${cfg.is_active ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{cfg.label}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.mode === "live" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {cfg.mode === "live" ? "Live" : "Test"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {cfg.is_active ? "Actif" : "Inactif"}
                    </span>
                    {cfg.api_key && <span className="text-xs text-muted-foreground font-mono">{cfg.api_key.slice(0, 12)}...</span>}
                  </div>
                </div>
                <button onClick={() => setEditingPay(cfg)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex-shrink-0">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════
            LOGS
        ════════════════════════════════════ */}
        {tab === "logs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{logs.length} entrées de log</p>
              <Button variant="outline" size="sm" onClick={() => {
                if (confirm("Vider tous les logs ?")) {
                  supabase.from("nexora_logs" as any).delete().neq("id", "00000000-0000-0000-0000-000000000000").then(() => { toast({ title: "Logs vidés" }); loadAll(); });
                }
              }} className="gap-1 text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Vider les logs
              </Button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-card border border-border rounded-2xl text-sm">
                <Activity className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                Aucun log enregistré
              </div>
            ) : (
              <div className="space-y-1.5">
                {logs.map(log => (
                  <div key={log.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-primary">{log.action}</span>
                        {log.nexora_users && (
                          <span className="text-xs text-muted-foreground">@{(log.nexora_users as any).username}</span>
                        )}
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {fmtDatetime(log.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            MODAL CONFIRMATION ACTION
        ════════════════════════════════════ */}
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <h3 className="font-black text-lg">
                {actionModal.type === "activer_premium"  && "Activer Premium"}
                {actionModal.type === "retirer_premium"  && "Retirer Premium"}
                {actionModal.type === "suspendre"        && "Suspendre le compte"}
                {actionModal.type === "bloquer"          && "Bloquer le compte"}
                {actionModal.type === "debloquer"        && "Débloquer le compte"}
                {actionModal.type === "supprimer"        && "Supprimer le compte"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Utilisateur : <span className="font-bold text-foreground">{actionModal.user.nom_prenom}</span>
              </p>

              {actionModal.type === "activer_premium" && (
                <div>
                  <label className="text-sm font-medium">Durée (jours)</label>
                  <Input type="number" value={premiumDays} onChange={e => setPremiumDays(e.target.value)} className="mt-1" placeholder="30" />
                </div>
              )}

              {["retirer_premium", "suspendre", "bloquer", "supprimer"].includes(actionModal.type) && (
                <div>
                  <label className="text-sm font-medium">Raison {actionModal.type === "supprimer" ? "(optionnel)" : "*"}</label>
                  <Input value={actionReason} onChange={e => setActionReason(e.target.value)} className="mt-1" placeholder="Motif..." />
                </div>
              )}

              {actionModal.type === "supprimer" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  Cette action est irréversible. Toutes les données de cet utilisateur seront supprimées.
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleUserAction}
                  className={`flex-1 text-white ${
                    actionModal.type === "supprimer" || actionModal.type === "bloquer" ? "bg-red-600 hover:bg-red-700" :
                    actionModal.type === "suspendre" ? "bg-yellow-600 hover:bg-yellow-700" :
                    actionModal.type === "debloquer" ? "bg-green-600 hover:bg-green-700" :
                    actionModal.type === "activer_premium" ? "bg-violet-600 hover:bg-violet-700" :
                    "bg-gray-600 hover:bg-gray-700"
                  }`}>
                  Confirmer
                </Button>
                <Button variant="outline" onClick={() => setActionModal(null)} className="flex-1">Annuler</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
