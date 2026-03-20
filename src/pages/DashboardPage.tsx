import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { TrendingUp, TrendingDown, History, Clock, ArrowUpRight, PiggyBank, HandCoins, Lock, Store, BadgeCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { getNexoraUser } from "@/lib/nexora-auth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getDateStr() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function DashboardPage() {
  const [devise, setDevise] = useState<"XOF" | "USD">("XOF");
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalEntrees: 0,
    totalDepenses: 0,
    nbCoffre: 0,
    nbLiens: 0,
    nbPrets: 0,
    nbInvest: 0,
    dernièresDepenses: [] as any[],
    dernièresEntrees: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  const nexoraUser = getNexoraUser();
  const displayName = nexoraUser?.nom_prenom?.split(" ")[0] || "Eric";
  const hasBadge = nexoraUser?.badge_premium || nexoraUser?.is_admin;

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const toXOF = (m: number, dev: string) =>
      dev === "USD" ? convertAmount(m, "USD", "XOF") : m;

    const [depResult, entResult, coffreResult, liensResult, pretsResult, investResult] =
      await Promise.all([
        supabase.from("depenses").select("montant, devise, date_depense, titre, created_at").order("created_at", { ascending: false }),
        supabase.from("entrees").select("montant, devise, date_entree, titre, created_at").order("created_at", { ascending: false }),
        supabase.from("coffre_fort").select("id"),
        supabase.from("liens_contacts").select("id"),
        supabase.from("prets" as any).select("id").eq("statut", "en_attente"),
        supabase.from("investissements" as any).select("id").eq("statut", "actif"),
      ]);

    const deps = depResult.data || [];
    const ents = entResult.data || [];

    const totalEntrees = ents.reduce((s: number, e: any) => s + toXOF(Number(e.montant), e.devise), 0);
    const totalDepenses = deps.reduce((s: number, d: any) => s + toXOF(Number(d.montant), d.devise), 0);

    setStats({
      totalEntrees,
      totalDepenses,
      nbCoffre: coffreResult.data?.length || 0,
      nbLiens: liensResult.data?.length || 0,
      nbPrets: (pretsResult.data as any)?.length || 0,
      nbInvest: (investResult.data as any)?.length || 0,
      dernièresDepenses: deps.slice(0, 4),
      dernièresEntrees: ents.slice(0, 4),
    });
    setLoading(false);
  };

  const fmt = (v: number) =>
    formatAmount(devise === "XOF" ? v : convertAmount(v, "XOF", "USD"), devise);
  const clockStr = time.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const solde = stats.totalEntrees - stats.totalDepenses;

  return (
    <AppLayout>
      <div className="space-y-3 animate-fade-in-up pb-4">

        {/* ── Hero greeting ── */}
        <div className="relative overflow-hidden rounded-xl bg-primary p-3.5 text-primary-foreground shadow-brand-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full border-2 border-white" />
            <div className="absolute -bottom-4 right-16 w-20 h-20 rounded-full border-2 border-white" />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-base font-black flex items-center gap-1.5 leading-tight">
                {getGreeting()}, {displayName} ! 👋
                {hasBadge && <BadgeCheck className="w-4 h-4 text-yellow-300 flex-shrink-0" />}
              </h1>
              <p className="text-primary-foreground/70 text-xs mt-0.5 capitalize truncate">
                {getDateStr()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-accent" />
                <span className="font-mono text-accent font-black text-xs tracking-widest">
                  {clockStr}
                </span>
              </div>
            </div>
            <select
              value={devise}
              onChange={(e) => setDevise(e.target.value as "XOF" | "USD")}
              className="flex-shrink-0 bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer">
              <option value="XOF">XOF</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* ── Solde + Entrées + Dépenses ── */}
        <div className="grid grid-cols-1 gap-2">
          {/* Solde net */}
          <div className={`rounded-xl p-3 shadow-sm border ${
            solde >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}>
            <div className="text-xs font-bold uppercase tracking-wide mb-0.5 text-muted-foreground">
              Solde net total
            </div>
            <div className={`text-xl font-black font-display ${
              solde >= 0 ? "text-green-700" : "text-destructive"
            }`}>
              {loading ? "—" : fmt(solde)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link to="/entrees-depenses"
              className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-brand transition-all">
              <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Entrées
              </div>
              <div className="text-lg font-black text-green-600 truncate">
                {loading ? "—" : fmt(stats.totalEntrees)}
              </div>
            </Link>
            <Link to="/entrees-depenses"
              className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-brand transition-all">
              <div className="text-xs font-bold text-destructive uppercase tracking-wide mb-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Dépenses
              </div>
              <div className="text-lg font-black text-destructive truncate">
                {loading ? "—" : fmt(stats.totalDepenses)}
              </div>
            </Link>
          </div>
        </div>

        {/* ── Quick links ligne 1 ── */}
        <div className="grid grid-cols-3 gap-2">
          <Link to="/coffre-fort"
            className="bg-primary-bg border border-primary/20 rounded-xl p-2.5 card-hover flex flex-col items-center text-center">
            <Lock className="w-5 h-5 text-primary mb-1" />
            <div className="font-semibold text-xs text-primary leading-tight">Coffre-fort</div>
            <div className="text-xl font-display font-black text-primary mt-0.5">
              {loading ? "—" : stats.nbCoffre}
            </div>
          </Link>
          <Link to="/prets"
            className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 card-hover flex flex-col items-center text-center">
            <HandCoins className="w-5 h-5 text-orange-500 mb-1" />
            <div className="font-semibold text-xs text-orange-600 leading-tight">Prêts</div>
            <div className="text-xl font-display font-black text-orange-600 mt-0.5">
              {loading ? "—" : stats.nbPrets}
            </div>
          </Link>
          <Link to="/boutique"
            className="bg-pink-50 border border-pink-200 rounded-xl p-2.5 card-hover flex flex-col items-center text-center">
            <Store className="w-5 h-5 text-pink-500 mb-1" />
            <div className="font-semibold text-xs text-pink-600 leading-tight">Boutique</div>
            <div className="text-xl font-display font-black text-pink-600 mt-0.5">→</div>
          </Link>
        </div>

        {/* ── Quick links ligne 2 ── */}
        <div className="grid grid-cols-2 gap-2">
          <Link to="/investissements"
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 card-hover flex flex-col items-center text-center">
            <PiggyBank className="w-5 h-5 text-emerald-600 mb-1" />
            <div className="font-semibold text-xs text-emerald-700 leading-tight">Investissements</div>
            <div className="text-xl font-display font-black text-emerald-700 mt-0.5">
              {loading ? "—" : stats.nbInvest}
            </div>
          </Link>
          <Link to="/historique"
            className="bg-destructive-bg border border-destructive/20 rounded-xl p-2.5 card-hover flex flex-col items-center text-center">
            <History className="w-5 h-5 text-destructive mb-1" />
            <div className="font-semibold text-xs text-destructive leading-tight">Historique</div>
            <div className="text-xl font-display font-black text-destructive mt-0.5">↗</div>
          </Link>
        </div>

        {/* ── Transactions récentes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Dernières dépenses */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="font-display font-bold text-xs flex items-center gap-1 text-destructive">
                <TrendingDown className="w-3.5 h-3.5" /> Dernières dépenses
              </h2>
              <Link to="/entrees-depenses"
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-3 text-center text-muted-foreground text-xs">Chargement...</div>
              ) : stats.dernièresDepenses.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground text-xs">Aucune dépense</div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.dernièresDepenses.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-3 h-3 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{d.titre}</div>
                        <div className="text-xs text-muted-foreground">{d.date_depense}</div>
                      </div>
                      <div className="text-xs font-bold text-destructive whitespace-nowrap">
                        -{fmt(d.devise === "USD"
                          ? convertAmount(Number(d.montant), "USD", "XOF")
                          : Number(d.montant))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dernières entrées */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="font-display font-bold text-xs flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3.5 h-3.5" /> Dernières entrées
              </h2>
              <Link to="/entrees-depenses"
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-3 text-center text-muted-foreground text-xs">Chargement...</div>
              ) : stats.dernièresEntrees.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground text-xs">Aucune entrée</div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.dernièresEntrees.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{e.titre}</div>
                        <div className="text-xs text-muted-foreground">{e.date_entree}</div>
                      </div>
                      <div className="text-xs font-bold text-green-600 whitespace-nowrap">
                        +{fmt(e.devise === "USD"
                          ? convertAmount(Number(e.montant), "USD", "XOF")
                          : Number(e.montant))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bannière Premium ── */}
        {nexoraUser && nexoraUser.plan === "gratuit" && (
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-3 text-white flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-yellow-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs">Passez au Premium !</div>
              <div className="text-xs text-white/80 truncate">
                Toutes les fonctionnalités illimitées — 10$/mois
              </div>
            </div>
            <Link to="/abonnement"
              className="flex-shrink-0 bg-yellow-400 text-gray-900 font-bold text-xs px-2.5 py-1.5 rounded-lg">
              Voir
            </Link>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
