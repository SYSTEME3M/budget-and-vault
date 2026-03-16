import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playSuccessSound } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Eye, EyeOff, Trash2, ExternalLink, Phone, MessageSquare,
  Globe, User, Key, Lock, FileText, Link2, AlertCircle, Edit2, Check, X
} from "lucide-react";

type TypeEntree = "compte" | "lien" | "telephone" | "note";

interface CoffreItem {
  id: string;
  type_entree: TypeEntree;
  nom: string;
  site_url?: string;
  email_identifiant?: string;
  mot_de_passe_visible?: string;
  telephone?: string;
  note?: string;
  ordre: number;
  created_at: string;
}

const TYPES: { value: TypeEntree; label: string; icon: any; color: string }[] = [
  { value: "compte", label: "Compte", icon: User, color: "text-primary bg-primary-bg" },
  { value: "lien", label: "Lien", icon: Link2, color: "text-accent-foreground bg-accent-bg" },
  { value: "telephone", label: "Téléphone", icon: Phone, color: "text-green-700 bg-green-50" },
  { value: "note", label: "Note", icon: FileText, color: "text-purple-700 bg-purple-50" },
];

export default function CoffreFortPage() {
  const [items, setItems] = useState<CoffreItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<TypeEntree | "">("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState<{
    type_entree: TypeEntree; nom: string; site_url: string;
    email_identifiant: string; mot_de_passe_visible: string;
    telephone: string; note: string;
  }>({
    type_entree: "compte", nom: "", site_url: "", email_identifiant: "",
    mot_de_passe_visible: "", telephone: "", note: "",
  });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase.from("coffre_fort").select("*").order("ordre").order("created_at", { ascending: false });
    setItems((data || []) as CoffreItem[]);
    setLoading(false);
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = i.nom.toLowerCase().includes(q) ||
      (i.site_url || "").toLowerCase().includes(q) ||
      (i.email_identifiant || "").toLowerCase().includes(q) ||
      (i.telephone || "").includes(q);
    const matchType = filterType ? i.type_entree === filterType : true;
    return matchSearch && matchType;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom) return;
    const payload = {
      type_entree: form.type_entree,
      nom: form.nom,
      site_url: form.site_url || null,
      email_identifiant: form.email_identifiant || null,
      mot_de_passe_visible: form.mot_de_passe_visible || null,
      telephone: form.telephone || null,
      note: form.note || null,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("coffre_fort").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("coffre_fort").insert(payload));
    }
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      playSuccessSound();
      toast({ title: "✅ Succès !", description: editingId ? "Modifié." : "Enregistré dans le coffre-fort." });
      resetForm();
      loadItems();
    }
  };

  const resetForm = () => {
    setForm({ type_entree: "compte", nom: "", site_url: "", email_identifiant: "", mot_de_passe_visible: "", telephone: "", note: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: CoffreItem) => {
    setForm({
      type_entree: item.type_entree,
      nom: item.nom,
      site_url: item.site_url || "",
      email_identifiant: item.email_identifiant || "",
      mot_de_passe_visible: item.mot_de_passe_visible || "",
      telephone: item.telephone || "",
      note: item.note || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("coffre_fort").delete().eq("id", id);
    toast({ title: "Supprimé" });
    loadItems();
  };

  const togglePassword = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeInfo = (type: TypeEntree) => TYPES.find(t => t.value === type)!;

  const formatPhone = (phone: string) => phone.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();

  return (
    <AppLayout searchQuery={search} onSearchChange={setSearch}>
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" /> Coffre-fort
            </h1>
            <p className="text-sm text-muted-foreground">Vos identifiants, mots de passe et liens sécurisés</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="gap-1.5 bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-brand animate-fade-in-up">
            <h3 className="font-display font-bold mb-4 text-primary flex items-center gap-2">
              <Lock className="w-4 h-4" /> {editingId ? "Modifier" : "Nouvel enregistrement"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Type */}
              <div className="sm:col-span-2 flex gap-2 flex-wrap">
                {TYPES.map(t => (
                  <button
                    key={t.value} type="button"
                    onClick={() => setForm(f => ({ ...f, type_entree: t.value }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                      form.type_entree === t.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>
              <Input placeholder="Nom / Libellé *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required className="sm:col-span-2" />

              {(form.type_entree === "compte" || form.type_entree === "lien") && (
                <Input placeholder="URL du site (ex: https://...)" value={form.site_url} onChange={e => setForm(f => ({ ...f, site_url: e.target.value }))} className="sm:col-span-2" />
              )}
              {form.type_entree === "compte" && (
                <>
                  <Input placeholder="Email / Identifiant" value={form.email_identifiant} onChange={e => setForm(f => ({ ...f, email_identifiant: e.target.value }))} />
                  <Input type="password" placeholder="Mot de passe" value={form.mot_de_passe_visible} onChange={e => setForm(f => ({ ...f, mot_de_passe_visible: e.target.value }))} />
                </>
              )}
              {form.type_entree === "telephone" && (
                <Input placeholder="Numéro de téléphone" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} className="sm:col-span-2" />
              )}
              <Input placeholder="Note (optionnel)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="sm:col-span-2" />
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit" className="bg-primary text-primary-foreground">✅ Enregistrer</Button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterType("")} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${!filterType ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Tout
          </button>
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setFilterType(t.value === filterType ? "" : t.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${filterType === t.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary/10"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Items */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Aucun élément dans le coffre-fort</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map(item => {
              const typeInfo = getTypeInfo(item.type_entree);
              const showPwd = visiblePasswords[item.id];
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 card-hover">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                      <typeInfo.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{item.nom}</div>
                      <span className={`text-xs font-medium ${typeInfo.color} px-2 py-0.5 rounded-full`}>{typeInfo.label}</span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-primary-bg hover:text-primary transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive-bg hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 text-sm">
                    {item.site_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <a href={item.site_url.startsWith("http") ? item.site_url : `https://${item.site_url}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-primary hover:underline truncate flex items-center gap-1">
                          {item.site_url} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {item.email_identifiant && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground truncate">{item.email_identifiant}</span>
                      </div>
                    )}
                    {item.mot_de_passe_visible && (
                      <div className="flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 font-mono text-sm bg-muted rounded px-2 py-0.5">
                          {showPwd ? item.mot_de_passe_visible : "•".repeat(Math.min(item.mot_de_passe_visible.length, 12))}
                        </span>
                        <button onClick={() => togglePassword(item.id)} className="p-1 rounded hover:bg-muted transition-colors">
                          {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                    {item.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">{formatPhone(item.telephone)}</span>
                        <div className="flex gap-1 ml-auto">
                          <a href={`tel:${item.telephone}`} className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors" title="Appeler">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a href={`https://wa.me/${item.telephone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors" title="WhatsApp">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                    {item.note && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-xs">{item.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
