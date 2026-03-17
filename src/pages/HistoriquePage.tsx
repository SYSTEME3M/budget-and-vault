import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { TrendingDown, TrendingUp, Calendar, Clock, Filter, ChevronDown } from "lucide-react";

type Devise = "XOF" | "USD";
type TabType = "tout" | "depenses" | "entrees";
type PeriodType = "semaine" | "mois" | "annee";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface DepenseRow {
  id: string;
  titre: string;
  montant: number;
  devise: string;
  categorie: string;
  note?: string;
  date_depense: string;
  semaine_num?: number;
  mois_num?: number;
  annee_num?: number;
  created_at?: string;
}

interface EntreeRow {
  id: string;
  titre: string;
  montant: number;
  devise: string;
  categorie: string;
  note?: string;
  date_entree: string;
  semaine_num?: number;
  mois_num?: number;
  annee_num?: number;
  created_at?: string;
}

function getWeekNumber(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getMondayOfWeek(weekNum: number, year: number): Date {
  const jan4 = new Date(year, 0, 4);
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7);
  const monday = new Date(week1Monday);
  monday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);
  return monday;
}

function formatDatetime(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoriquePage() {
  const [depenses, setDepenses] = useState<DepenseRow[]>([]);
  const [entrees, setEntrees] = useState<EntreeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [devise, setDevise] = useState<Devise>("XOF");
  const [tab, setTab] = useState<TabType>("tout");
  const [period, setPeriod] = useState<PeriodType>("mois");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [depRes, entRes] = await Promise.all([
      supabase.from("depenses").select("*").order("date_depense", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("entrees").select("*").order("date_entree", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    setDepenses(depRes.data || []);
    setEntrees(entRes.data || []);
    setLoading(false);
  };

  const fmt = (v: number) => formatAmount(devise === "XOF" ? v : convertAmount(v, "XOF", "USD"), devise);

  const toXOF = (montant: number, dev: string) =>
    dev === "USD" ? convertAmount(montant, "USD", "XOF") : montant;

  // Get all unique years from both tables
  const allYears = [...new Set([
    ...depenses.map(d => d.annee_num),
    ...entrees.map(e => e.annee_num),
  ].filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)) as number[];

  // Get unique weeks for the selected year
  const allWeeks = [...new Set([
    ...depenses.filter(d => d.annee_num === selectedYear).map(d => d.semaine_num),
    ...entrees.filter(e => e.annee_num === selectedYear).map(e => e.semaine_num),
  ].filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)) as number[];

  // Filter based on period
  const filteredDepenses = depenses.filter(d => {
    if (period === "annee") return d.annee_num === selectedYear;
    if (period === "mois") return d.annee_num === selectedYear && d.mois_num === selectedMonth;
    if (period === "semaine") return d.annee_num === selectedYear && d.semaine_num === selectedWeek;
    return true;
  });

  const filteredEntrees = entrees.filter(e => {
    if (period === "annee") return e.annee_num === selectedYear;
    if (period === "mois") return e.annee_num === selectedYear && e.mois_num === selectedMonth;
    if (period === "semaine") return e.annee_num === selectedYear && e.semaine_num === selectedWeek;
    return true;
  });

  const totalDepenses = filteredDepenses.reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);
  const totalEntrees = filteredEntrees.reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);
  const solde = totalEntrees - totalDepenses;

  // Group by date for display
  function groupByDate<T extends { date_depense?: string; date_entree?: string }>(items: T[], dateKey: "date_depense" | "date_entree") {
    const groups: Record<string, T[]> = {};
    items.forEach(item => {
      const date = (item as any)[dateKey] || "";
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }

  const depensesByDate = groupByDate(filteredDepenses, "date_depense");
  const entreesByDate = groupByDate(filteredEntrees, "date_entree");

  // Merge all dates for "tout" tab
  const allDates = [...new Set([
    ...filteredDepenses.map(d => d.date_depense),
    ...filteredEntrees.map(e => e.date_entree),
  ])].sort((a, b) => b.localeCompare(a));

  const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const periodLabel = period === "semaine" ? `Semaine ${selectedWeek} — ${selectedYear}`
    : period === "mois" ? `${MONTHS[selectedMonth - 1]} ${selectedYear}`
    : `Année ${selectedYear}`;

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" /> Historique
            </h1>
            <p className="text-sm text-muted-foreground">Toutes vos transactions passées</p>
          </div>
          <select value={devise} onChange={e => setDevise(e.target.value as Devise)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-card font-semibold">
            <option value="XOF">XOF - FCFA</option>
            <option value="USD">USD - $</option>
          </select>
        </div>

        {/* Period selector */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["semaine", "mois", "annee"] as PeriodType[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
                }`}>
                {p === "semaine" ? "Semaine" : p === "mois" ? "Mois" : "Année"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
              {allYears.length > 0 ? allYears.map(y => <option key={y} value={y}>{y}</option>)
                : <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
            </select>
            {period === "mois" && (
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            )}
            {period === "semaine" && (
              <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
                {allWeeks.length > 0 ? allWeeks.map(w => {
                  const mon = getMondayOfWeek(w, selectedYear);
                  return <option key={w} value={w}>Semaine {w} — {mon.toLocaleDateString("fr-FR")}</option>;
                }) : <option value={selectedWeek}>Semaine {selectedWeek}</option>}
              </select>
            )}
            <span className="text-sm font-semibold text-primary">{periodLabel}</span>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-xs text-muted-foreground">Entrées</div>
              <div className="font-display font-bold text-green-700">{fmt(totalEntrees)}</div>
            </div>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-destructive" />
            <div>
              <div className="text-xs text-muted-foreground">Dépenses</div>
              <div className="font-display font-bold text-destructive">{fmt(totalDepenses)}</div>
            </div>
          </div>
          <div className={`${solde >= 0 ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20"} border rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${solde >= 0 ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {solde >= 0 ? "+" : "-"}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Solde</div>
              <div className={`font-display font-bold ${solde >= 0 ? "text-green-700" : "text-destructive"}`}>
                {fmt(Math.abs(solde))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2">
          {(["tout", "depenses", "entrees"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}>
              {t === "tout" && <Filter className="w-3.5 h-3.5" />}
              {t === "depenses" && <TrendingDown className="w-3.5 h-3.5" />}
              {t === "entrees" && <TrendingUp className="w-3.5 h-3.5" />}
              {t === "tout" ? "Tout" : t === "depenses" ? "Dépenses" : "Entrées"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : (
          <div className="space-y-3">
            {tab !== "entrees" && (
              <div>
                {tab === "tout" && <h3 className="font-display font-semibold text-base mb-2 flex items-center gap-2 text-destructive"><TrendingDown className="w-4 h-4" /> Dépenses</h3>}
                {depensesByDate.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground bg-card border border-border rounded-xl">Aucune dépense pour cette période</div>
                ) : (
                  depensesByDate.map(([date, items]) => {
                    const key = `dep-${date}`;
                    const isOpen = expandedGroups[key] !== false;
                    const dayTotal = items.reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);
                    return (
                      <div key={key} className="bg-card border border-border rounded-xl overflow-hidden mb-2">
                        <button onClick={() => toggleGroup(key)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">
                            {new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                          <span className="ml-auto text-destructive font-bold text-sm">{fmt(dayTotal)}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-border">
                            {items.map(d => (
                              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                  <TrendingDown className="w-4 h-4 text-destructive" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{d.titre}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {d.categorie} • {d.created_at ? formatDatetime(d.created_at) : d.date_depense}
                                  </div>
                                  {d.note && <div className="text-xs text-muted-foreground italic">{d.note}</div>}
                                </div>
                                <div className="text-sm font-semibold text-destructive whitespace-nowrap">
                                  -{fmt(toXOF(Number(d.montant), d.devise))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab !== "depenses" && (
              <div>
                {tab === "tout" && <h3 className="font-display font-semibold text-base mb-2 flex items-center gap-2 text-green-700"><TrendingUp className="w-4 h-4" /> Entrées</h3>}
                {entreesByDate.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground bg-card border border-border rounded-xl">Aucune entrée pour cette période</div>
                ) : (
                  entreesByDate.map(([date, items]) => {
                    const key = `ent-${date}`;
                    const isOpen = expandedGroups[key] !== false;
                    const dayTotal = items.reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);
                    return (
                      <div key={key} className="bg-card border border-border rounded-xl overflow-hidden mb-2">
                        <button onClick={() => toggleGroup(key)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-green-50/50 hover:bg-green-50 transition-colors text-left">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">
                            {new Date(date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                          <span className="ml-auto text-green-700 font-bold text-sm">{fmt(dayTotal)}</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="divide-y divide-border">
                            {items.map(e => (
                              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{e.titre}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {e.categorie} • {e.created_at ? formatDatetime(e.created_at) : e.date_entree}
                                  </div>
                                  {e.note && <div className="text-xs text-muted-foreground italic">{e.note}</div>}
                                </div>
                                <div className="text-sm font-semibold text-green-700 whitespace-nowrap">
                                  +{fmt(toXOF(Number(e.montant), e.devise))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
