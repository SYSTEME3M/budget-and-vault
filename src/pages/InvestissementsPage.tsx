import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatAmount, convertAmount, playSuccessSound } from "@/lib/app-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, PiggyBank, TrendingUp, ChevronDown, ChevronUp, ArrowRight, Target, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";

type Devise = "XOF" | "USD";
type TypeInvest = "epargne" | "tontine" | "investissement";
type Statut = "actif" | "termine" | "pause";

interface Investissement {
  id: string;
  nom: string;
  description?: string;
  montant_objectif: number;
  montant_actuel: number;
  devise: Devise;
  type_investissement: TypeInvest;
  date_debut: string;
  date_objectif?: string;
  statut: Statut;
  created_at: string;
}

interface Versement {
  id: string;
  investissement_id: string;
  montant: number;
  devise: Devise;
  date_versement: string;
  note?: string;
}

const TYPE_LABELS: Record<TypeInvest, string> = {
  epargne: "Épargne",
  tontine: "Tontine",
  investissement: "Investissement",
};
const TYPE_COLORS: Record<TypeInvest, string> = {
  epargne: "bg-blue-100 text-blue-700",
  tontine: "bg-purple-100 text-purple-700",
  investissement: "bg-emerald-100 text-emerald-700",
};
const STATUT_COLORS: Record<Statut, string> = {
  actif: "bg-green-100 text-green-700",
  termine: "bg-gray-100 text-gray-600",
  pause: "bg-yellow-100 text-yellow-700",
};

export default function InvestissementsPage() {
  const { toast } = useToast();
  const [investissements, setInvestissements] = useState<Investissement[]>([]);
  const [versements, setVersements] = useState<Versement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showVersForm, setShowVersForm] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TypeInvest | "">("");

  const [form, setForm] = useState({
    nom: "", description: "", montant_objectif: "",
    devise: "XOF" as Devise, type_investissement: "epargne" as TypeInvest,
    date_debut: new Date().toISOString().split("T")[0], date_objectif: "",
  });
  const [versForm, setVersForm] = useState({ montant: "", note: "", date_versement: new Date().toISOString().split("T")[0] });

  const load = async () => {
    setLoading(true);
    const [{ data: inv }, { data: vers }] = await Promise.all([
      supabase.from("investissements" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("versements_investissement" as any).select("*").order("date_versement", { ascending: false }),
    ]);
    setInvestissements((inv as unknown as Investissement[]) || []);
    setVersements((vers as unknown as Versement[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.montant_objectif) {
      toast({ title: "Champs requis", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("investissements" as any).insert({
      nom: form.nom,
      description: form.description || null,
      montant_objectif: parseFloat(form.montant_objectif),
      devise: form.devise,
      type_investissement: form.type_investissement,
      date_debut: form.date_debut,
      date_objectif: form.date_objectif || null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      playSuccessSound();
      toast({ title: "Enregistré", description: "Investissement créé !" });
      setForm({ nom: "", description: "", montant_objectif: "", devise: "XOF", type_investissement: "epargne", date_debut: new Date().toISOString().split("T")[0], date_objectif: "" });
      setShowForm(false);
      load();
    }
  };

  const handleVersement = async (inv: Investissement) => {
    if (!versForm.montant) return;
    const montant = parseFloat(versForm.montant);
    const nouveauTotal = inv.montant_actuel + montant;
    const nouveauStatut: Statut = nouveauTotal >= inv.montant_objectif ? "termine" : "actif";

    const { error } = await supabase.from("versements_investissement" as any).insert({
      investissement_id: inv.id,
      montant,
      devise: inv.devise,
      note: versForm.note || null,
      date_versement: versForm.date_versement,
    });
    if (!error) {
      await supabase.from("investissements" as any).update({
        montant_actuel: nouveauTotal,
        statut: nouveauStatut,
      }).eq("id", inv.id);
      toast({ title: "Versement enregistré !" });
      setShowVersForm(null);
      setVersForm({ montant: "", note: "", date_versement: new Date().toISOString().split("T")[0] });
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet investissement ?")) return;
    await supabase.from("investissements" as any).delete().eq("id", id);
    toast({ title: "Supprimé" });
    load();
  };

  const handleStatutChange = async (id: string, statut: Statut) => {
    await supabase.from("investissements" as any).update({ statut }).eq("id", id);
    load();
  };

  const filtered = investissements.filter(i => !filterType || i.type_investissement === filterType);
  const versPour = (id: string) => versements.filter(v => v.investissement_id === id);

  const totalEpargne = investissements.reduce((s, i) => s + (i.devise === "XOF" ? i.montant_actuel : convertAmount(i.montant_actuel, "USD", "XOF")), 0);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">Investissements</h1>
            <p className="text-sm text-muted-foreground">Épargne, tontines & investissements</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {/* Total épargné */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <PiggyBank className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total épargné (tous comptes)</div>
            <div className="font-display font-black text-2xl text-emerald-700">{formatAmount(totalEpargne, "XOF")}</div>
            <div className="text-xs text-muted-foreground">{investissements.filter(i => i.statut === "actif").length} compte(s) actif(s)</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterType("")} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${!filterType ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>Tous</button>
          {(["epargne", "tontine", "investissement"] as TypeInvest[]).map(t => (
            <button key={t} onClick={() => setFilterType(t === filterType ? "" : t)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${filterType === t ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="font-bold text-lg text-foreground">Nouvel investissement / épargne</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nom *</label>
                <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Tontine mensuelle, épargne maison..." className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Objectif détaillé..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Montant objectif *</label>
                <Input type="number" value={form.montant_objectif} onChange={e => setForm({ ...form, montant_objectif: e.target.value })} placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Devise</label>
                <select value={form.devise} onChange={e => setForm({ ...form, devise: e.target.value as Devise })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="XOF">FCFA (XOF)</option>
                  <option value="USD">Dollar (USD)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select value={form.type_investissement} onChange={e => setForm({ ...form, type_investissement: e.target.value as TypeInvest })} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="epargne">Épargne</option>
                  <option value="tontine">Tontine</option>
                  <option value="investissement">Investissement</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Date début</label>
                <Input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} className="mt-1" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Date objectif (optionnel)</label>
                <Input type="date" value={form.date_objectif} onChange={e => setForm({ ...form, date_objectif: e.target.value })} className="mt-1" />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Créer</Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center text-muted-foreground p-8">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 bg-card border border-border rounded-2xl">
            <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun investissement enregistré</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(inv => {
              const pct = inv.montant_objectif > 0 ? Math.min(100, (inv.montant_actuel / inv.montant_objectif) * 100) : 0;
              const isExpanded = expandedId === inv.id;
              const versList = versPour(inv.id);

              return (
                <div key={inv.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <PiggyBank className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{inv.nom}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[inv.type_investissement]}`}>
                            {TYPE_LABELS[inv.type_investissement]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUT_COLORS[inv.statut]}`}>
                            {inv.statut === "actif" ? "Actif" : inv.statut === "termine" ? "Terminé" : "Pause"}
                          </span>
                        </div>
                        {inv.description && <div className="text-sm text-muted-foreground mt-0.5">{inv.description}</div>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {inv.date_debut}</span>
                          {inv.date_objectif && <span className="flex items-center gap-0.5 text-emerald-600"><Target className="w-3 h-3" /> Objectif: {inv.date_objectif}</span>}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-emerald-700">{formatAmount(inv.montant_actuel, inv.devise)}</span>
                            <span className="text-muted-foreground">objectif: {formatAmount(inv.montant_objectif, inv.devise)}</span>
                          </div>
                          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{pct.toFixed(0)}% atteint</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <select
                          value={inv.statut}
                          onChange={e => handleStatutChange(inv.id, e.target.value as Statut)}
                          className="text-xs border border-border rounded-lg px-2 py-1 bg-card"
                        >
                          <option value="actif">Actif</option>
                          <option value="pause">Pause</option>
                          <option value="termine">Terminé</option>
                        </select>
                        <button onClick={() => setExpandedId(isExpanded ? null : inv.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive hover:text-white text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                      {inv.statut !== "termine" && (
                        <div>
                          <button
                            onClick={() => setShowVersForm(showVersForm === inv.id ? null : inv.id)}
                            className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:underline"
                          >
                            <ArrowRight className="w-4 h-4" /> Ajouter un versement
                          </button>
                          {showVersForm === inv.id && (
                            <div className="mt-3 p-3 bg-card border border-border rounded-xl grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-medium">Montant</label>
                                <Input type="number" value={versForm.montant} onChange={e => setVersForm({ ...versForm, montant: e.target.value })} placeholder="0" className="mt-1 h-8" />
                              </div>
                              <div>
                                <label className="text-xs font-medium">Date</label>
                                <Input type="date" value={versForm.date_versement} onChange={e => setVersForm({ ...versForm, date_versement: e.target.value })} className="mt-1 h-8" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs font-medium">Note</label>
                                <Input value={versForm.note} onChange={e => setVersForm({ ...versForm, note: e.target.value })} placeholder="Optionnel" className="mt-1 h-8" />
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <Button size="sm" onClick={() => handleVersement(inv)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                                  Confirmer le versement
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {versList.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Historique des versements</p>
                          <div className="space-y-1.5">
                            {versList.map(v => (
                              <div key={v.id} className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                <span className="text-muted-foreground">{v.date_versement}</span>
                                <span className="font-bold text-emerald-700">+{formatAmount(v.montant, v.devise)}</span>
                                {v.note && <span className="text-muted-foreground italic">{v.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
