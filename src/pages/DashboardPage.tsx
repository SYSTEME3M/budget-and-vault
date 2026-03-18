import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount, getWeekNumber } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { CreditCard, Lock, Image, TrendingUp, TrendingDown, History, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

const PROFILE_PHOTO = "https://i.ibb.co/pvMbk9MY/1771882604239.jpg";

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
      supabase.from("depenses").select("montant, devise, date_depense, semaine_num, mois_num, annee_num, titre, categorie, created_at").order("created_at", { ascending: false }),
      supabase.from("entrees").select("montant, devise, date_entree, semaine_num, mois_num, annee_num, titre, categorie, created_at").order("created_at", { ascending: false }),
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
      dernièresDepenses: deps.slice(0, 5),
      dernièresEntrees: ents.slice(0, 5),
    });
    setLoading(false);
  };

  const fmt = (v: number) => formatAmount(devise === "XOF" ? v : convertAmount(v, "XOF", "USD"), devise);

  const periods = [
    { label: "Aujourd'hui", ent: stats.entJour, dep: stats.depJour },
    { label: "Cette semaine", ent: stats.entSemaine, dep: stats.depSemaine },
    { label: "Ce mois", ent: stats.entMois, dep: stats.depMois },
    { label: "Cette année", ent: stats.entAnnee, dep: stats.depAnnee },
  ];

  const clockStr = time.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in-up">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-brand-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full border-2 border-white" />
            <div className="absolute -bottom-6 right-24 w-28 h-28 rounded-full border-2 border-white" />
          </div>
          <div className="relative flex items-start gap-4">
            <img src={PROFILE_PHOTO} alt="Eric" className="w-14 h-14 rounded-full border-3 border-accent object-cover shadow-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-black">{getGreeting()}, Eric ! 👋</h1>
              <p className="text-primary-foreground/70 text-xs mt-0.5 capitalize">{getDateStr()}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-4 h-4 text-accent" />
                <span className="font-mono text-accent font-black text-base tracking-widest">{clockStr}</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <select
                value={devise}
                onChange={(e) => setDevise(e.target.value as "XOF" | "USD")}
                className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold cursor-pointer"
              >
                <option value="XOF">XOF - FCFA</option>
                <option value="USD">USD - $</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4-period summary grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {periods.map(({ label, ent, dep }) => {
            const solde = ent - dep;
            const isPositive = solde >= 0;
            return (
              <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">{label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-0.5">
                      <TrendingUp className="w-3 h-3 text-green-500" /> Entrées
                    </div>
                    <div className="font-display font-bold text-green-600 text-sm">{loading ? "—" : fmt(ent)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-0.5">
                      <TrendingDown className="w-3 h-3 text-destructive" /> Dépenses
                    </div>
                    <div className="font-display font-bold text-destructive text-sm">{loading ? "—" : fmt(dep)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">Solde</div>
                    <div className={`font-display font-bold text-sm ${isPositive ? "text-green-600" : "text-destructive"}`}>
                      {loading ? "—" : `${isPositive ? "+" : ""}${fmt(Math.abs(solde))}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/coffre-fort" className="bg-primary-bg border border-primary/20 rounded-xl p-3.5 card-hover flex flex-col items-center text-center">
            <Lock className="w-6 h-6 text-primary mb-1.5" />
            <div className="font-semibold text-xs text-primary">Coffre-fort</div>
            <div className="text-2xl font-display font-black text-primary mt-1">{loading ? "—" : stats.nbCoffre}</div>
          </Link>
          <Link to="/medias" className="bg-accent-bg border border-accent/20 rounded-xl p-3.5 card-hover flex flex-col items-center text-center">
            <Image className="w-6 h-6 text-accent-foreground mb-1.5" />
            <div className="font-semibold text-xs text-accent-foreground">Médias</div>
            <div className="text-2xl font-display font-black text-accent-foreground mt-1">{loading ? "—" : stats.nbMedias}</div>
          </Link>
          <Link to="/historique" className="bg-destructive-bg border border-destructive/20 rounded-xl p-3.5 card-hover flex flex-col items-center text-center">
            <History className="w-6 h-6 text-destructive mb-1.5" />
            <div className="font-semibold text-xs text-destructive">Historique</div>
            <div className="text-2xl font-display font-black text-destructive mt-1">↗</div>
          </Link>
        </div>

        {/* Recent transactions side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dernières dépenses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-sm flex items-center gap-1.5 text-destructive">
                <TrendingDown className="w-4 h-4" /> Dernières dépenses
              </h2>
              <Link to="/depenses" className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground text-xs">Chargement...</div>
              ) : stats.dernièresDepenses.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs">Aucune dépense</div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.dernièresDepenses.map((d, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{d.titre}</div>
                        <div className="text-xs text-muted-foreground">{d.date_depense}</div>
                      </div>
                      <div className="text-xs font-bold text-destructive whitespace-nowrap">
                        -{fmt(d.devise === "USD" ? convertAmount(Number(d.montant), "USD", "XOF") : Number(d.montant))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dernières entrées */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-bold text-sm flex items-center gap-1.5 text-green-600">
                <TrendingUp className="w-4 h-4" /> Dernières entrées
              </h2>
              <Link to="/entrees" className="text-xs text-primary hover:underline font-semibold flex items-center gap-0.5">
                Voir tout <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground text-xs">Chargement...</div>
              ) : stats.dernièresEntrees.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs">Aucune entrée</div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.dernièresEntrees.map((e, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{e.titre}</div>
                        <div className="text-xs text-muted-foreground">{e.date_entree}</div>
                      </div>
                      <div className="text-xs font-bold text-green-600 whitespace-nowrap">
                        +{fmt(e.devise === "USD" ? convertAmount(Number(e.montant), "USD", "XOF") : Number(e.montant))}
                      </div>
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
