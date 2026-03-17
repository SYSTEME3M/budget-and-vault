import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playSuccessSound } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Eye, EyeOff, Trash2, ExternalLink, Globe, User, Key, Lock, FileText, Edit2, Copy, Check
} from "lucide-react";

interface CoffreItem {
  id: string;
  type_entree: "compte";
  nom: string;
  site_url?: string;
  email_identifiant?: string;
  mot_de_passe_visible?: string;
  note?: string;
  ordre: number;
  created_at: string;
}

export default function CoffreFortPage() {
  const [items, setItems] = useState<CoffreItem[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "", site_url: "", email_identifiant: "", mot_de_passe_visible: "", note: "",
  });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coffre_fort")
      .select("*")
      .eq("type_entree", "compte")
      .order("ordre")
      .order("created_at", { ascending: false });
    setItems((data || []) as CoffreItem[]);
    setLoading(false);
  };

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    return (
      i.nom.toLowerCase().includes(q) ||
      (i.site_url || "").toLowerCase().includes(q) ||
      (i.email_identifiant || "").toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom) return;
    const payload = {
      type_entree: "compte" as const,
      nom: form.nom,
      site_url: form.site_url || null,
      email_identifiant: form.email_identifiant || null,
      mot_de_passe_visible: form.mot_de_passe_visible || null,
      telephone: null,
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
    setForm({ nom: "", site_url: "", email_identifiant: "", mot_de_passe_visible: "", note: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (item: CoffreItem) => {
    setForm({
      nom: item.nom,
      site_url: item.site_url || "",
      email_identifiant: item.email_identifiant || "",
      mot_de_passe_visible: item.mot_de_passe_visible || "",
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

  const copyToClipboard = async (text: string, fieldId: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast({ title: `✅ ${label} copié !` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <AppLayout searchQuery={search} onSearchChange={setSearch}>
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" /> Coffre-fort
            </h1>
            <p className="text-sm text-muted-foreground">Vos comptes et identifiants sécurisés</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="gap-1.5 bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" /> Ajouter un compte
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-brand animate-fade-in-up">
            <h3 className="font-display font-bold mb-4 text-primary flex items-center gap-2">
              <Lock className="w-4 h-4" /> {editingId ? "Modifier le compte" : "Nouveau compte"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nom du site / service *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required className="sm:col-span-2" />
              <Input placeholder="Lien du site (https://...)" value={form.site_url} onChange={e => setForm(f => ({ ...f, site_url: e.target.value }))} className="sm:col-span-2" />
              <Input placeholder="Email / Identifiant" value={form.email_identifiant} onChange={e => setForm(f => ({ ...f, email_identifiant: e.target.value }))} />
              <Input type="password" placeholder="Mot de passe" value={form.mot_de_passe_visible} onChange={e => setForm(f => ({ ...f, mot_de_passe_visible: e.target.value }))} />
              <Input placeholder="Note (optionnel)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="sm:col-span-2" />
              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit" className="bg-primary text-primary-foreground">✅ Enregistrer</Button>
              </div>
            </form>
          </div>
        )}

        {/* Items */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {search ? "Aucun résultat" : "Aucun compte enregistré — cliquez sur « Ajouter »"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map(item => {
              const showPwd = visiblePasswords[item.id];
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 card-hover">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{item.nom}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors" title="Modifier">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" title="Supprimer">
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
                          className="text-primary hover:underline truncate flex items-center gap-1 flex-1">
                          {item.site_url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        <button onClick={() => copyToClipboard(item.site_url!, `url-${item.id}`, "Lien")}
                          className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0">
                          {copiedField === `url-${item.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      </div>
                    )}
                    {item.email_identifiant && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground truncate flex-1">{item.email_identifiant}</span>
                        <button onClick={() => copyToClipboard(item.email_identifiant!, `email-${item.id}`, "Email")}
                          className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0">
                          {copiedField === `email-${item.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                      </div>
                    )}
                    {item.mot_de_passe_visible && (
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5">
                        <Key className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 font-mono text-sm">
                          {showPwd ? item.mot_de_passe_visible : "•".repeat(Math.min(item.mot_de_passe_visible.length, 14))}
                        </span>
                        <button onClick={() => copyToClipboard(item.mot_de_passe_visible!, `pwd-${item.id}`, "Mot de passe")}
                          className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0">
                          {copiedField === `pwd-${item.id}` ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                        </button>
                        <button onClick={() => togglePassword(item.id)} className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0">
                          {showPwd ? <EyeOff className="w-3.5 h-3.5 text-primary" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                      </div>
                    )}
                    {item.note && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-accent/20 rounded-lg">
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
