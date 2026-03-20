import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatAmount, convertAmount, getWeekNumber, getMondayOfWeek } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { TrendingDown, TrendingUp, Calendar, Clock, Filter, ChevronDown } from "lucide-react";

type Devise = "XOF" | "USD";
type TabType = "tout" | "depenses" | "entrees";
type PeriodType = "semaine" | "mois" | "annee";

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

interface DepenseRow {
  id: string; titre: string; montant: number; devise: string; categorie: string;
  note?: string; date_depense: string; semaine_num?: number; mois_num?: number; annee_num?: number; created_at?: string;
}
interface EntreeRow {
  id: string; titre: string; montant: number; devise: string; categorie: string;
  note?: string; date_entree: string; semaine_num?: number; mois_num?: number; annee_num?: number; created_at?: string;
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
  const toXOF = (m: number, dev: string) => dev === "USD" ? convertAmount(m, "USD", "XOF") : m;

  const allYears = [...new Set([
    ...depenses.map(d => d.annee_num), ...entrees.map(e => e.annee_num),
  ].filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)) as number[];

  const allWeeks = [...new Set([
    ...depenses.filter(d => d.annee_num === selectedYear).map(d => d.semaine_num),
    ...entrees.filter(e => e.annee_num === selectedYear).map(e => e.semaine_num),
  ].filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)) as number[];

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
          <select value={devise} onChange={e => setDevise(e.target.value as Devise)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card font-semibold">
            <option value="XOF">XOF - FCFA</option>
            <option value="USD">USD - $</option>
          </select>
        </div>

        {/* Period selector */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              {(["semaine", "mois", "annee"] as PeriodType[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
                  {p === "semaine" ? "📅 Semaine" : p === "mois" ? "📆 Mois" : "🗓️ Année"}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              {period === "semaine" && (
                <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
                  {allWeeks.length > 0 ? allWeeks.map(w => {
                    const mon = getMondayOfWeek(w, selectedYear);
                    return <option key={w} value={w}>Semaine {w} — {mon.toLocaleDateString("fr-FR")}</option>;
                  }) : <option value={selectedWeek}>Semaine {selectedWeek}</option>}
                </select>
              )}
              {period === "mois" && (
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              )}
              <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
                {allYears.length > 0 ? allYears.map(y => <option key={y} value={y}>{y}</option>)
                  : <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
              </select>
            </div>
          </div>
          <span className="inline-block text-sm font-bold text-primary bg-primary-bg px-3 py-1.5 rounded-full border border-primary/20">{periodLabel}</span>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Entrées</div>
              <div className="font-display font-black text-green-700 text-lg">{fmt(totalEntrees)}</div>
              <div className="text-xs text-muted-foreground">{filteredEntrees.length} op.</div>
            </div>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Dépenses</div>
              <div className="font-display font-black text-destructive text-lg">{fmt(totalDepenses)}</div>
              <div className="text-xs text-muted-foreground">{filteredDepenses.length} op.</div>
            </div>
          </div>
          <div className={`${solde >= 0 ? "bg-green-50 border-green-200" : "bg-destructive/5 border-destructive/20"} border rounded-xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${solde >= 0 ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {solde >= 0 ? "+" : "-"}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Solde net</div>
              <div className={`font-display font-black text-lg ${solde >= 0 ? "text-green-700" : "text-destructive"}`}>{fmt(Math.abs(solde))}</div>
            </div>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2">
          {(["tout", "depenses", "entrees"] as TabType[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-all ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
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
                {tab === "tout" && <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2 text-destructive"><TrendingDown className="w-4 h-4" /> Dépenses</h3>}
                {depensesByDate.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground bg-card border border-border rounded-xl text-sm">Aucune dépense pour cette période</div>
                ) : depensesByDate.map(([date, items]) => {
                  const key = `dep-${date}`;
                  const isOpen = expandedGroups[key] !== false;
                  const dayTotal = items.reduce((s, d) => s + toXOF(Number(d.montant), d.devise), 0);
                  return (
                    <div key={key} className="bg-card border border-border rounded-xl overflow-hidden mb-2">
                      <button onClick={() => toggleGroup(key)} className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
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
                                {d.note && <div className="text-xs text-muted-foreground italic">📝 {d.note}</div>}
                              </div>
                              <div className="text-sm font-bold text-destructive whitespace-nowrap">-{fmt(toXOF(Number(d.montant), d.devise))}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab !== "depenses" && (
              <div>
                {tab === "tout" && <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2 text-green-700"><TrendingUp className="w-4 h-4" /> Entrées</h3>}
                {entreesByDate.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground bg-card border border-border rounded-xl text-sm">Aucune entrée pour cette période</div>
                ) : entreesByDate.map(([date, items]) => {
                  const key = `ent-${date}`;
                  const isOpen = expandedGroups[key] !== false;
                  const dayTotal = items.reduce((s, e) => s + toXOF(Number(e.montant), e.devise), 0);
                  return (
                    <div key={key} className="bg-card border border-border rounded-xl overflow-hidden mb-2">
                      <button onClick={() => toggleGroup(key)} className="w-full flex items-center gap-3 px-4 py-3 bg-green-50/50 hover:bg-green-50 transition-colors text-left">
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
                                {e.note && <div className="text-xs text-muted-foreground italic">📝 {e.note}</div>}
                              </div>
                              <div className="text-sm font-bold text-green-700 whitespace-nowrap">+{fmt(toXOF(Number(e.montant), e.devise))}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {(filteredDepenses.length === 0 && filteredEntrees.length === 0) && (
              <div className="text-center p-8 text-muted-foreground bg-card border border-border rounded-xl">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">Aucune transaction pour cette période.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
