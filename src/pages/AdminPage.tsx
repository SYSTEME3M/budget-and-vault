import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hashCode, playSuccessSound } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Edit2, Shield, UserCheck, UserX, Link2, Check, X, Copy
} from "lucide-react";

interface AppUser {
  id: string;
  nom: string;
  email: string;
  is_active: boolean;
  avatar_url?: string;
  features: {
    depenses: boolean;
    coffre_fort: boolean;
    medias: boolean;
    liens: boolean;
    entrees: boolean;
  };
  theme_color: string;
  login_token?: string;
  created_at: string;
}

const FEATURE_LABELS: Record<string, string> = {
  depenses: "Dépenses",
  entrees: "Entrées",
  coffre_fort: "Coffre-fort",
  medias: "Médias",
  liens: "Liens & Contacts",
};

const THEME_COLORS = [
  { label: "Bleu", value: "#1a56db" },
  { label: "Rouge", value: "#e02424" },
  { label: "Vert", value: "#057a55" },
  { label: "Violet", value: "#7e3af2" },
  { label: "Orange", value: "#d97706" },
  { label: "Rose", value: "#e74694" },
];

export default function AdminPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nom: "", email: "", code: "", theme_color: "#1a56db",
    features: { depenses: true, entrees: false, coffre_fort: false, medias: false, liens: false },
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_users").select("*").order("created_at", { ascending: false });
    setUsers((data || []) as AppUser[]);
    setLoading(false);
  };

  const generateToken = () => Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email) return;

    const token = generateToken();
    let payload: any = {
      nom: form.nom,
      email: form.email,
      features: form.features,
      theme_color: form.theme_color,
      login_token: token,
    };

    if (form.code) {
      payload.access_code_hash = await hashCode(form.code);
    }

    let error;
    if (editingId) {
      ({ error } = await supabase.from("app_users").update(payload).eq("id", editingId));
    } else {
      if (!form.code) { toast({ title: "Code d'accès requis", variant: "destructive" }); return; }
      ({ error } = await supabase.from("app_users").insert(payload));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      playSuccessSound();
      toast({ title: "✅ Succès !", description: editingId ? "Utilisateur modifié." : "Compte créé." });
      resetForm();
      loadUsers();
    }
  };

  const resetForm = () => {
    setForm({ nom: "", email: "", code: "", theme_color: "#1a56db", features: { depenses: true, entrees: false, coffre_fort: false, medias: false, liens: false } });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (user: AppUser) => {
    setForm({
      nom: user.nom,
      email: user.email,
      code: "",
      theme_color: user.theme_color,
      features: user.features,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    await supabase.from("app_users").delete().eq("id", id);
    toast({ title: "Utilisateur supprimé" });
    loadUsers();
  };

  const toggleActive = async (user: AppUser) => {
    await supabase.from("app_users").update({ is_active: !user.is_active }).eq("id", user.id);
    loadUsers();
  };

  const copyLoginLink = (user: AppUser) => {
    const link = `${window.location.origin}/login?token=${user.login_token}&user=${user.id}`;
    navigator.clipboard.writeText(link);
    toast({ title: "✅ Lien copié !", description: "Partagez ce lien à l'utilisateur." });
  };

  const toggleFeature = (feat: string) => {
    setForm(f => ({ ...f, features: { ...f.features, [feat]: !f.features[feat as keyof typeof f.features] } }));
  };

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Administration
            </h1>
            <p className="text-sm text-muted-foreground">Gérez les comptes utilisateurs et leurs accès</p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="gap-1.5 bg-primary text-primary-foreground">
            <Plus className="w-4 h-4" /> Créer un compte
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-brand animate-fade-in-up">
            <h3 className="font-display font-bold mb-4 text-primary">{editingId ? "Modifier" : "Nouveau compte"}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nom complet *" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} required />
              <Input type="email" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Input type="password" placeholder={editingId ? "Nouveau code d'accès (optionnel)" : "Code d'accès *"} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />

              {/* Theme color */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Couleur thème</label>
                <div className="flex gap-2 flex-wrap">
                  {THEME_COLORS.map(c => (
                    <button key={c.value} type="button" onClick={() => setForm(f => ({ ...f, theme_color: c.value }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.theme_color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }} title={c.label} />
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Fonctionnalités autorisées</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                    const active = form.features[key as keyof typeof form.features];
                    return (
                      <button key={key} type="button" onClick={() => toggleFeature(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                        }`}>
                        {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit" className="bg-primary text-primary-foreground">✅ {editingId ? "Modifier" : "Créer le compte"}</Button>
              </div>
            </form>
          </div>
        )}

        {/* Users list */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-xl">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Aucun compte utilisateur créé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className={`bg-card border rounded-xl p-4 card-hover ${user.is_active ? "border-border" : "border-destructive/30 opacity-70"}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: user.theme_color }}>
                    {user.nom.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{user.nom}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user.is_active ? "bg-green-100 text-green-700" : "bg-destructive/10 text-destructive"}`}>
                        {user.is_active ? "Actif" : "Bloqué"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(user.features || {}).map(([feat, enabled]) => enabled && (
                        <span key={feat} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          {FEATURE_LABELS[feat] || feat}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Créé le {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => copyLoginLink(user)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Copier le lien de connexion">
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(user)} className={`p-1.5 rounded-lg transition-colors ${user.is_active ? "hover:bg-destructive/10 hover:text-destructive text-muted-foreground" : "hover:bg-green-50 hover:text-green-700 text-muted-foreground"}`} title={user.is_active ? "Bloquer" : "Débloquer"}>
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleEdit(user)} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
