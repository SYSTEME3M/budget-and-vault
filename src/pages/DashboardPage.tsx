import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { CreditCard, Lock, Image, TrendingUp, TrendingDown, History, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const PROFILE_PHOTO = "https://i.ibb.co/pvMbk9MY/1771882604239.jpg";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getDateStr() {
  return new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function getWeekNumber(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export default function DashboardPage() {
  const [devise, setDevise] = useState<"XOF" | "USD">("XOF");
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({
    depJour: 0, depSemaine: 0, depMois: 0, depAnnee: 0,
    entJour: 0, entSemaine: 0, entMois: 0, entAnnee: 0,
    nbCoffre: 0, nbMedias: 0, nbLiens: 0,
    dernièresDepenses: [] as any[], dernièresEntrees: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekNum = getWeekNumber(now);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [depResult, entResult, coffreResult, mediaResult, liensResult] = await Promise.all([
      supabase.from("depenses").select("montant, devise, date_depense, semaine_num, mois_num, annee_num, titre, categorie").order("created_at", { ascending: false }),
      supabase.from("entrees").select("montant, devise, date_entree, semaine_num, mois_num, annee_num, titre, categorie").order("created_at", { ascending: false }),
      supabase.from("coffre_fort").select("id"),
      supabase.from("medias").select("id"),
      supabase.from("liens_contacts").select("id"),
    ]);

    const toXOF = (m: number, dev: string) => dev === "USD" ? convertAmount(m, "USD", "XOF") : m;

    const deps = depResult.data || [];
    const ents = entResult.data || [];

    const depJour = deps.filter(d => d.date_depense === today).reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);
    const depSemaine = deps.filter(d => d.semaine_num === weekNum && d.annee_num === year).reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);
    const depMois = deps.filter(d => d.mois_num === month && d.annee_num === year).reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);
    const depAnnee = deps.filter(d => d.annee_num === year).reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);

    const entJour = ents.filter(e => e.date_entree === today).reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);
    const entSemaine = ents.filter(e => e.semaine_num === weekNum && e.annee_num === year).reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);
    const entMois = ents.filter(e => e.mois_num === month && e.annee_num === year).reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);
    const entAnnee = ents.filter(e => e.annee_num === year).reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);

    setStats({
      depJour, depSemaine, depMois, depAnnee,
      entJour, entSemaine, entMois, entAnnee,
      nbCoffre: coffreResult.data?.length || 0,
      nbMedias: mediaResult.data?.length || 0,
      nbLiens: liensResult.data?.length || 0,
      dernièresDepenses: deps.slice(0, 4),
      dernièresEntrees: ents.slice(0, 4),
    });
    setLoading(false);
  };

  const fmt = (v: number) => formatAmount(devise === "XOF" ? v : convertAmount(v, "XOF", "USD"), devise);

  const soldeJour = stats.entJour - stats.depJour;
  const soldeSemaine = stats.entSemaine - stats.depSemaine;
  const soldeMois = stats.entMois - stats.depMois;
  const soldeAnnee = stats.entAnnee - stats.depAnnee;

  const clockStr = time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in-up">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-2 border-white" />
            <div className="absolute -bottom-4 right-20 w-24 h-24 rounded-full border-2 border-white" />
          </div>
          <div className="relative flex items-center gap-4">
            <img src={PROFILE_PHOTO} alt="Eric" className="w-14 h-14 rounded-full border-3 border-accent object-cover shadow-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold">{getGreeting()}, Eric ! 👋</h1>
              <p className="text-primary-foreground/70 text-xs mt-0.5 capitalize">{getDateStr()}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span className="font-mono text-accent font-bold text-sm tracking-wider">{clockStr}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <select value={devise} onChange={(e) => setDevise(e.target.value as "XOF" | "USD")}
                className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer">
                <option value="XOF">XOF - FCFA</option>
                <option value="USD">USD - $</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4-period summary: Dépenses vs Entrées */}
        {["jour", "semaine", "mois", "annee"].map((p, pi) => {
          const labels = ["Aujourd'hui", "Cette semaine", "Ce mois", "Cette année"];
          const dep = [stats.depJour, stats.depSemaine, stats.depMois, stats.depAnnee][pi];
          const ent = [stats.entJour, stats.entSemaine, stats.entMois, stats.entAnnee][pi];
          const solde = ent - dep;
          return (
            <div key={p} className="bg-card border border-border rounded-xl p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">{labels[pi]}</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Entrées</div>
                  <div className="font-display font-bold text-green-700 text-sm">{loading ? "..." : fmt(ent)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Dépenses</div>
                  <div className="font-display font-bold text-destructive text-sm">{loading ? "..." : fmt(dep)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">Solde</div>
                  <div className={`font-display font-bold text-sm ${solde >= 0 ? "text-green-700" : "text-destructive"}`}>
                    {loading ? "..." : `${solde >= 0 ? "+" : ""}${fmt(Math.abs(solde))}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { path: "/coffre-fort", icon: Lock, label: "Coffre-fort", count: stats.nbCoffre, color: "bg-primary/10 text-primary" },
            { path: "/medias", icon: Image, label: "Médias", count: stats.nbMedias, color: "bg-accent/20 text-accent-foreground" },
            { path: "/liens", icon: History, label: "Historique", count: null, color: "bg-destructive/10 text-destructive" },
          ].map(({ path, icon: Icon, label, count, color }) => (
            <Link key={path} to={path === "/liens" ? "/historique" : path}
              className={`${color} rounded-xl p-4 card-hover flex flex-col items-center text-center border border-border/50`}>
              <Icon className="w-6 h-6 mb-1.5" />
              <div className="font-semibold text-xs">{label}</div>
              {count !== null && <div className="text-xl font-display font-bold mt-1">{loading ? "..." : count}</div>}
            </Link>
          ))}
        </div>

        {/* Recent transactions side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dernières dépenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-sm flex items-center gap-1.5 text-destructive">
                <TrendingDown className="w-4 h-4" /> Dernières dépenses
              </h2>
              <Link to="/depenses" className="text-xs text-primary hover:underline font-medium">Voir tout →</Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? <div className="p-4 text-center text-muted-foreground text-xs">Chargement...</div>
                : stats.dernièresDepenses.length === 0
                  ? <div className="p-4 text-center text-muted-foreground text-xs">Aucune dépense</div>
                  : (
                    <div className="divide-y divide-border">
                      {stats.dernièresDepenses.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{d.titre}</div>
                            <div className="text-xs text-muted-foreground">{d.date_depense}</div>
                          </div>
                          <div className="text-xs font-semibold text-destructive whitespace-nowrap">-{fmt(Number(d.montant))}</div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </div>

          {/* Dernières entrées */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-sm flex items-center gap-1.5 text-green-700">
                <TrendingUp className="w-4 h-4" /> Dernières entrées
              </h2>
              <Link to="/entrees" className="text-xs text-primary hover:underline font-medium">Voir tout →</Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? <div className="p-4 text-center text-muted-foreground text-xs">Chargement...</div>
                : stats.dernièresEntrees.length === 0
                  ? <div className="p-4 text-center text-muted-foreground text-xs">Aucune entrée</div>
                  : (
                    <div className="divide-y divide-border">
                      {stats.dernièresEntrees.map((e, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2.5">
                          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{e.titre}</div>
                            <div className="text-xs text-muted-foreground">{e.date_entree}</div>
                          </div>
                          <div className="text-xs font-semibold text-green-700 whitespace-nowrap">+{fmt(Number(e.montant))}</div>
                        </div>
                      ))}
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
