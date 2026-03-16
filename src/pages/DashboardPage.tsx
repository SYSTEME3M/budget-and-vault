import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { CreditCard, Lock, Image, TrendingUp, TrendingDown, Calendar, Clock } from "lucide-react";
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

export default function DashboardPage() {
  const [devise, setDevise] = useState<"XOF" | "USD">("XOF");
  const [stats, setStats] = useState({
    totalJour: 0, totalSemaine: 0, totalMois: 0, totalAnnee: 0,
    nbCoffre: 0, nbMedias: 0, nbLiens: 0, dernièresDepenses: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekNum = getWeekNumber(now);
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [depResult, coffreResult, mediaResult, liensResult] = await Promise.all([
      supabase.from("depenses").select("montant, date_depense, semaine_num, mois_num, annee_num, titre, categorie").order("created_at", { ascending: false }),
      supabase.from("coffre_fort").select("id"),
      supabase.from("medias").select("id"),
      supabase.from("liens_contacts").select("id"),
    ]);

    const deps = depResult.data || [];
    const totalJour = deps.filter(d => d.date_depense === today).reduce((s, d) => s + Number(d.montant), 0);
    const totalSemaine = deps.filter(d => d.semaine_num === weekNum && d.annee_num === year).reduce((s, d) => s + Number(d.montant), 0);
    const totalMois = deps.filter(d => d.mois_num === month && d.annee_num === year).reduce((s, d) => s + Number(d.montant), 0);
    const totalAnnee = deps.filter(d => d.annee_num === year).reduce((s, d) => s + Number(d.montant), 0);

    setStats({
      totalJour, totalSemaine, totalMois, totalAnnee,
      nbCoffre: coffreResult.data?.length || 0,
      nbMedias: mediaResult.data?.length || 0,
      nbLiens: liensResult.data?.length || 0,
      dernièresDepenses: deps.slice(0, 5),
    });
    setLoading(false);
  };

  function getWeekNumber(d: Date) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  const fmt = (v: number) => formatAmount(devise === "XOF" ? v : convertAmount(v, "XOF", "USD"), devise);

  const statCards = [
    { label: "Aujourd'hui", value: fmt(stats.totalJour), icon: Clock, color: "primary" },
    { label: "Cette semaine", value: fmt(stats.totalSemaine), icon: Calendar, color: "accent" },
    { label: "Ce mois", value: fmt(stats.totalMois), icon: TrendingDown, color: "destructive" },
    { label: "Cette année", value: fmt(stats.totalAnnee), icon: TrendingUp, color: "secondary" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-2 border-white" />
            <div className="absolute -bottom-4 right-20 w-24 h-24 rounded-full border-2 border-white" />
          </div>
          <div className="relative flex items-center gap-4">
            <img src={PROFILE_PHOTO} alt="Eric" className="w-16 h-16 rounded-full border-3 border-accent object-cover shadow-lg" />
            <div>
              <h1 className="font-display text-2xl font-bold">
                {getGreeting()}, Eric ! 👋
              </h1>
              <p className="text-primary-foreground/70 text-sm mt-0.5 capitalize">{getDateStr()}</p>
            </div>
            <div className="ml-auto">
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

        {/* Stats dépenses */}
        <div>
          <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Résumé des dépenses
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`bg-card border border-border rounded-xl p-4 card-hover`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                  color === "primary" ? "bg-primary-bg text-primary" :
                  color === "accent" ? "bg-accent-bg text-accent-foreground" :
                  color === "destructive" ? "bg-destructive-bg text-destructive" :
                  "bg-secondary text-secondary-foreground"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs text-muted-foreground font-medium">{label}</div>
                <div className="font-display font-bold text-foreground mt-1 text-sm leading-tight">
                  {loading ? "..." : value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { path: "/coffre-fort", icon: Lock, label: "Coffre-fort", count: stats.nbCoffre, color: "bg-primary-bg text-primary" },
            { path: "/medias", icon: Image, label: "Médias", count: stats.nbMedias, color: "bg-accent-bg text-accent-foreground" },
            { path: "/liens", icon: TrendingUp, label: "Liens", count: stats.nbLiens, color: "bg-destructive-bg text-destructive" },
          ].map(({ path, icon: Icon, label, count, color }) => (
            <Link key={path} to={path} className={`${color} rounded-xl p-4 card-hover flex flex-col items-center text-center`}>
              <Icon className="w-7 h-7 mb-2" />
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-2xl font-display font-bold mt-1">{loading ? "..." : count}</div>
            </Link>
          ))}
        </div>

        {/* Dernières dépenses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Dernières dépenses
            </h2>
            <Link to="/depenses" className="text-xs text-primary hover:underline font-medium">Voir tout →</Link>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Chargement...</div>
            ) : stats.dernièresDepenses.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">Aucune dépense enregistrée</div>
            ) : (
              <div className="divide-y divide-border">
                {stats.dernièresDepenses.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-destructive-bg flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{d.titre}</div>
                      <div className="text-xs text-muted-foreground">{d.categorie} • {d.date_depense}</div>
                    </div>
                    <div className="font-semibold text-sm text-destructive whitespace-nowrap">
                      -{fmt(d.montant)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
