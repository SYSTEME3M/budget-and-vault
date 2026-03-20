import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import EntreesPage from "@/pages/EntreesPage";
import DepensesPage from "@/pages/DepensesPage";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function EntreesDepensesPage() {
  const [tab, setTab] = useState<"entrees" | "depenses">("entrees");

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Onglets */}
        <div className="flex bg-muted rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("entrees")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "entrees"
                ? "bg-green-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Entrées
          </button>
          <button
            onClick={() => setTab("depenses")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === "depenses"
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingDown className="w-4 h-4" /> Dépenses
          </button>
        </div>

        {/* Contenu sans le layout wrapper */}
        {tab === "entrees" ? <EntreesInner /> : <DepensesInner />}
      </div>
    </AppLayout>
  );
}

// Wrapper simplifié qui réutilise les pages existantes mais sans AppLayout redoublé
function EntreesInner() {
  return (
    <div className="[&>div]:!p-0 [&_main]:!p-0">
      <EntreesContent />
    </div>
  );
}

function DepensesInner() {
  return (
    <div className="[&>div]:!p-0 [&_main]:!p-0">
      <DepensesContent />
    </div>
  );
}

// Imports dynamiques pour éviter le double layout
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { formatAmount, convertAmount, playSuccessSound } from "@/lib/app-utils";

type Devise = "XOF" | "USD";

function EntreesContent() {
  const { toast } = useToast();
  const [entrees, setEntrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titre: "", montant: "", categorie: "Autre", devise: "XOF" as Devise,
    date_entree: new Date().toISOString().split("T")[0], note: ""
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("entrees").select("*").order("date_entree", { ascending: false });
    setEntrees(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.montant) { toast({ title: "Titre et montant requis", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("entrees").insert({
      titre: form.titre, montant: parseFloat(form.montant), categorie: form.categorie,
      devise: form.devise, date_entree: form.date_entree, note: form.note || null
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { playSuccessSound(); toast({ title: "Entrée enregistrée" }); setShowForm(false); setForm({ titre: "", montant: "", categorie: "Autre", devise: "XOF", date_entree: new Date().toISOString().split("T")[0], note: "" }); load(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await supabase.from("entrees").delete().eq("id", id);
    toast({ title: "Supprimée" }); load();
  };

  const total = entrees.reduce((s, e) => s + (e.devise === "USD" ? convertAmount(Number(e.montant), "USD", "XOF") : Number(e.montant)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Entrées</h2>
          <p className="text-sm text-muted-foreground">Total : <strong className="text-green-600">{formatAmount(total, "XOF")}</strong></p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-green-500 hover:bg-green-600 text-white gap-1">
          <Plus className="w-4 h-4" /> Nouvelle entrée
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Titre *</label>
              <Input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} placeholder="Source de revenus" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Montant *</label>
              <Input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="0" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Devise</label>
              <select value={form.devise} onChange={e => setForm({...form, devise: e.target.value as Devise})} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="XOF">XOF (FCFA)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Date</label>
              <Input type="date" value={form.date_entree} onChange={e => setForm({...form, date_entree: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Catégorie</label>
              <Input value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className="mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Note</label>
              <Input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Optionnel..." className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="bg-green-500 hover:bg-green-600 text-white">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-muted-foreground">Chargement...</div> :
          entrees.length === 0 ? <div className="p-8 text-center text-muted-foreground">Aucune entrée enregistrée</div> : (
          <div className="divide-y divide-border">
            {entrees.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{e.titre}</div>
                  <div className="text-xs text-muted-foreground">{e.date_entree} · {e.categorie}</div>
                </div>
                <div className="text-sm font-bold text-green-600 whitespace-nowrap">+{formatAmount(Number(e.montant), e.devise)}</div>
                <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DepensesContent() {
  const { toast } = useToast();
  const [depenses, setDepenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titre: "", montant: "", categorie: "Autre", devise: "XOF" as Devise,
    date_depense: new Date().toISOString().split("T")[0], note: ""
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("depenses").select("*").order("date_depense", { ascending: false });
    setDepenses(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.montant) { toast({ title: "Titre et montant requis", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("depenses").insert({
      titre: form.titre, montant: parseFloat(form.montant), categorie: form.categorie,
      devise: form.devise, date_depense: form.date_depense, note: form.note || null
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { playSuccessSound(); toast({ title: "Dépense enregistrée" }); setShowForm(false); setForm({ titre: "", montant: "", categorie: "Autre", devise: "XOF", date_depense: new Date().toISOString().split("T")[0], note: "" }); load(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette dépense ?")) return;
    await supabase.from("depenses").delete().eq("id", id);
    toast({ title: "Supprimée" }); load();
  };

  const total = depenses.reduce((s, d) => s + (d.devise === "USD" ? convertAmount(Number(d.montant), "USD", "XOF") : Number(d.montant)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Dépenses</h2>
          <p className="text-sm text-muted-foreground">Total : <strong className="text-destructive">{formatAmount(total, "XOF")}</strong></p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="destructive" className="gap-1">
          <Plus className="w-4 h-4" /> Nouvelle dépense
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Titre *</label>
              <Input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} placeholder="Description de la dépense" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Montant *</label>
              <Input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="0" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Devise</label>
              <select value={form.devise} onChange={e => setForm({...form, devise: e.target.value as Devise})} className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="XOF">XOF (FCFA)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Date</label>
              <Input type="date" value={form.date_depense} onChange={e => setForm({...form, date_depense: e.target.value})} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Catégorie</label>
              <Input value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className="mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground">Note</label>
              <Input value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Optionnel..." className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} variant="destructive">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? <div className="p-8 text-center text-muted-foreground">Chargement...</div> :
          depenses.length === 0 ? <div className="p-8 text-center text-muted-foreground">Aucune dépense enregistrée</div> : (
          <div className="divide-y divide-border">
            {depenses.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{d.titre}</div>
                  <div className="text-xs text-muted-foreground">{d.date_depense} · {d.categorie}</div>
                </div>
                <div className="text-sm font-bold text-destructive whitespace-nowrap">-{formatAmount(Number(d.montant), d.devise)}</div>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
