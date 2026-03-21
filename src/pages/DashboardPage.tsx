import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import {
  TrendingUp, TrendingDown, History, Clock,
  ArrowUpRight, PiggyBank, HandCoins, Lock,
  Store, BadgeCheck, Zap
} from "lucide-react";
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
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric",
    month: "long", day: "numeric"
  });
}

// ── Badge Premium vert brillant animé ────────────────────
function PremiumBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        borderRadius: "999px",
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
        boxShadow: "0 0 8px 2px rgba(34,197,94,0.7), 0 0 2px 0 rgba(34,197,94,0.4)",
        animation: "premiumPulse 2s ease-in-out infinite",
        flexShrink: 0,
        border: "1px solid rgba(255,255,255,0.3)",
        position: "relative" as const,
        overflow: "hidden",
      }}>

      {/* Reflet brillant */}
      <span style={{
        position: "absolute",
        top: 0, left: "-60%",
        width: "40%", height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        animation: "shine 2.5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      <BadgeCheck style={{ width: 10, height: 10, color: "#fff", flexShrink: 0 }} />
    </span>
  );
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
  const isPremium = nexoraUser?.plan === "premium" || nexoraUser?.plan === "admin";

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

      {/* ── Animations CSS injectées ── */}
      <style>{`
        @keyframes premiumPulse {
          0%, 100% {
            box-shadow: 0 0 6px 2px rgba(34,197,94,0.6), 0 0 2px 0 rgba(34,197,94,0.3);
          }
          50% {
            box-shadow: 0 0 14px 5px rgba(34,197,94,0.9), 0 0 6px 2px rgba(74,222,128,0.6);
          }
        }
        @keyframes shine {
          0% { left: -60%; }
          100% { left: 130%; }
        }
      `}</style>

      <div
        className="w-full overflow-hidden"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}>

        {/* ══════════════════════════
            HERO GREETING
        ══════════════════════════ */}
        <div
          className="relative overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-brand-lg"
          style={{ padding: "12px 14px", flexShrink: 0 }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-2 border-white" />
            <div className="absolute -bottom-4 right-14 w-20 h-20 rounded-full border-2 border-white" />
          </div>
          <div className="relative flex items-center gap-3">
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Nom + Badge */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                overflow: "hidden",
              }}>
                <div
                  className="font-display font-black"
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.3",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    flexShrink: 1,
                  }}>
                  {getGreeting()}, {displayName} ! 👋
                </div>
                {/* ── Badge vert brillant ── */}
                {isPremium && <PremiumBadge />}
              </div>

              <div
                className="text-primary-foreground/70 capitalize"
                style={{
                  fontSize: "11px",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {getDateStr()}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <Clock style={{ width: 11, height: 11, color: "var(--accent)" }} />
                <span
                  className="font-mono font-black"
                  style={{ fontSize: "11px", color: "var(--accent)", letterSpacing: "0.1em" }}>
                  {clockStr}
                </span>
              </div>
            </div>

            <select
              value={devise}
              onChange={(e) => setDevise(e.target.value as "XOF" | "USD")}
              className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground rounded-lg font-semibold cursor-pointer"
              style={{ padding: "4px 8px", fontSize: "11px", flexShrink: 0 }}>
              <option value="XOF">XOF</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* ══════════════════════════
            SOLDE NET
        ══════════════════════════ */}
        <div
          className={`rounded-xl border ${solde >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          style={{ padding: "10px 14px", flexShrink: 0 }}>
          <div
            className="font-bold uppercase text-muted-foreground"
            style={{ fontSize: "10px", letterSpacing: "0.05em", marginBottom: "2px" }}>
            Solde net total
          </div>
          <div
            className={`font-black font-display ${solde >= 0 ? "text-green-700" : "text-destructive"}`}
            style={{
              fontSize: "20px", lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
            {loading ? "—" : fmt(solde)}
          </div>
        </div>

        {/* ══════════════════════════
            ENTRÉES + DÉPENSES
        ══════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Link
            to="/entrees-depenses"
            className="bg-card border border-border rounded-xl hover:shadow-brand transition-all"
            style={{ padding: "10px 12px", overflow: "hidden" }}>
            <div
              className="font-bold text-green-600 uppercase flex items-center gap-1"
              style={{ fontSize: "10px", letterSpacing: "0.05em", marginBottom: "4px" }}>
              <TrendingUp style={{ width: 11, height: 11 }} /> Entrées
            </div>
            <div
              className="font-black text-green-600"
              style={{ fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "—" : fmt(stats.totalEntrees)}
            </div>
          </Link>

          <Link
            to="/entrees-depenses"
            className="bg-card border border-border rounded-xl hover:shadow-brand transition-all"
            style={{ padding: "10px 12px", overflow: "hidden" }}>
            <div
              className="font-bold text-destructive uppercase flex items-center gap-1"
              style={{ fontSize: "10px", letterSpacing: "0.05em", marginBottom: "4px" }}>
              <TrendingDown style={{ width: 11, height: 11 }} /> Dépenses
            </div>
            <div
              className="font-black text-destructive"
              style={{ fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {loading ? "—" : fmt(stats.totalDepenses)}
            </div>
          </Link>
        </div>

        {/* ══════════════════════════
            QUICK LINKS LIGNE 1
        ══════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[
            {
              to: "/coffre-fort",
              icon: <Lock style={{ width: 18, height: 18, color: "var(--primary)" }} />,
              label: "Coffre-fort",
              value: stats.nbCoffre,
              cls: "bg-primary-bg border-primary/20",
              textCls: "text-primary",
            },
            {
              to: "/prets",
              icon: <HandCoins style={{ width: 18, height: 18, color: "#f97316" }} />,
              label: "Prêts",
              value: stats.nbPrets,
              cls: "bg-orange-50 border-orange-200",
              textCls: "text-orange-600",
            },
            {
              to: "/boutique",
              icon: <Store style={{ width: 18, height: 18, color: "#ec4899" }} />,
              label: "Boutique",
              value: "→",
              cls: "bg-pink-50 border-pink-200",
              textCls: "text-pink-600",
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`border rounded-xl card-hover flex flex-col items-center justify-center text-center ${item.cls}`}
              style={{ padding: "10px 6px" }}>
              {item.icon}
              <div
                className={`font-semibold ${item.textCls}`}
                style={{ fontSize: "10px", marginTop: "4px", lineHeight: 1.2 }}>
                {item.label}
              </div>
              <div
                className={`font-display font-black ${item.textCls}`}
                style={{ fontSize: "18px", marginTop: "2px", lineHeight: 1 }}>
                {loading && item.value !== "→" ? "—" : item.value}
              </div>
            </Link>
          ))}
        </div>

        {/* ══════════════════════════
            QUICK LINKS LIGNE 2
        ══════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Link
            to="/investissements"
            className="bg-emerald-50 border border-emerald-200 rounded-xl card-hover flex flex-col items-center justify-center text-center"
            style={{ padding: "10px 6px" }}>
            <PiggyBank style={{ width: 18, height: 18, color: "#059669" }} />
            <div className="font-semibold text-emerald-700" style={{ fontSize: "10px", marginTop: "4px" }}>
              Investissements
            </div>
            <div className="font-display font-black text-emerald-700" style={{ fontSize: "18px", marginTop: "2px" }}>
              {loading ? "—" : stats.nbInvest}
            </div>
          </Link>

          <Link
            to="/historique"
            className="bg-destructive-bg border border-destructive/20 rounded-xl card-hover flex flex-col items-center justify-center text-center"
            style={{ padding: "10px 6px" }}>
            <History style={{ width: 18, height: 18, color: "var(--destructive)" }} />
            <div className="font-semibold text-destructive" style={{ fontSize: "10px", marginTop: "4px" }}>
              Historique
            </div>
            <div className="font-display font-black text-destructive" style={{ fontSize: "18px", marginTop: "2px" }}>
              ↗
            </div>
          </Link>
        </div>

        {/* ══════════════════════════
            TRANSACTIONS RÉCENTES
        ══════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

          {/* Dépenses */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span
                className="font-display font-bold text-destructive flex items-center gap-1"
                style={{ fontSize: "11px" }}>
                <TrendingDown style={{ width: 12, height: 12 }} /> Dépenses
              </span>
              <Link
                to="/entrees-depenses"
                className="text-primary font-semibold flex items-center gap-0.5 hover:underline"
                style={{ fontSize: "10px" }}>
                Voir <ArrowUpRight style={{ width: 10, height: 10 }} />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="text-center text-muted-foreground" style={{ padding: "10px", fontSize: "11px" }}>
                  Chargement...
                </div>
              ) : stats.dernièresDepenses.length === 0 ? (
                <div className="text-center text-muted-foreground" style={{ padding: "10px", fontSize: "11px" }}>
                  Aucune dépense
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.dernièresDepenses.map((d: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px" }}>
                      <div
                        className="bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 22, height: 22 }}>
                        <TrendingDown style={{ width: 11, height: 11, color: "var(--destructive)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="font-medium"
                          style={{ fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.titre}
                        </div>
                        <div className="text-muted-foreground" style={{ fontSize: "9px" }}>
                          {d.date_depense}
                        </div>
                      </div>
                      <div
                        className="font-bold text-destructive"
                        style={{ fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        -{fmt(d.devise === "USD" ? convertAmount(Number(d.montant), "USD", "XOF") : Number(d.montant))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Entrées */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span
                className="font-display font-bold text-green-600 flex items-center gap-1"
                style={{ fontSize: "11px" }}>
                <TrendingUp style={{ width: 12, height: 12 }} /> Entrées
              </span>
              <Link
                to="/entrees-depenses"
                className="text-primary font-semibold flex items-center gap-0.5 hover:underline"
                style={{ fontSize: "10px" }}>
                Voir <ArrowUpRight style={{ width: 10, height: 10 }} />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="text-center text-muted-foreground" style={{ padding: "10px", fontSize: "11px" }}>
                  Chargement...
                </div>
              ) : stats.dernièresEntrees.length === 0 ? (
                <div className="text-center text-muted-foreground" style={{ padding: "10px", fontSize: "11px" }}>
                  Aucune entrée
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.dernièresEntrees.map((e: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px" }}>
                      <div
                        className="bg-green-100 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 22, height: 22 }}>
                        <TrendingUp style={{ width: 11, height: 11, color: "#16a34a" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="font-medium"
                          style={{ fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.titre}
                        </div>
                        <div className="text-muted-foreground" style={{ fontSize: "9px" }}>
                          {e.date_entree}
                        </div>
                      </div>
                      <div
                        className="font-bold text-green-600"
                        style={{ fontSize: "10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        +{fmt(e.devise === "USD" ? convertAmount(Number(e.montant), "USD", "XOF") : Number(e.montant))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════
            BANNIÈRE PREMIUM
        ══════════════════════════ */}
        {nexoraUser && nexoraUser.plan === "gratuit" && (
          <div
            className="bg-gradient-to-r from-primary to-primary/80 rounded-xl text-white"
            style={{
              padding: "10px 12px",
              display: "flex", alignItems: "center",
              gap: "10px", flexShrink: 0,
            }}>
            <Zap style={{ width: 20, height: 20, color: "#fde047", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-bold" style={{ fontSize: "12px" }}>Passez au Premium !</div>
              <div
                className="text-white/80"
                style={{
                  fontSize: "10px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                Toutes les fonctionnalités illimitées — 10$/mois
              </div>
            </div>
            <Link
              to="/abonnement"
              className="bg-yellow-400 text-gray-900 font-bold rounded-lg"
              style={{ padding: "5px 10px", fontSize: "11px", flexShrink: 0, whiteSpace: "nowrap" }}>
              Voir
            </Link>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
