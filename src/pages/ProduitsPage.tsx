import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Package,
  Image, Tag, ToggleLeft, ToggleRight, Star, Edit2
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────
type TypeProduit = "physique" | "numerique";

interface Variation {
  nom: string;
  valeurs: string[];
}

interface Produit {
  id: string;
  boutique_id: string;
  nom: string;
  description: string;
  prix: number;
  prix_promo: number | null;
  type: TypeProduit;
  categorie: string;
  stock: number;
  stock_illimite: boolean;
  photos: string[];
  fichier_url: string | null;
  actif: boolean;
  vedette: boolean;
  variations?: Variation[];
}

// ─── Constantes ───────────────────────────────────────────
const CATEGORIES = [
  "Vêtements", "Chaussures", "Accessoires", "Électronique",
  "Alimentation", "Beauté & Santé", "Maison", "Livres & Formation",
  "Services", "Autre"
];

function formatPrix(prix: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${prix.toFixed(2)}`;
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

// ─── Composant principal ──────────────────────────────────
export default function ProduitsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  const [boutiqueDev, setBoutiqueDevise] = useState("XOF");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [filterCateg, setFilterCateg] = useState("");

  const emptyForm = {
    nom: "", description: "", prix: "", prix_promo: "",
    type: "physique" as TypeProduit, categorie: "", stock: "0",
    stock_illimite: false, photos: [] as string[], photo_url: "",
    fichier_url: "", actif: true, vedette: false,
  };

  const [form, setForm] = useState(emptyForm);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [newVarNom, setNewVarNom] = useState("");
  const [newVarValeurs, setNewVarValeurs] = useState("");

  // ── Chargement boutique + produits
  const load = async () => {
    setLoading(true);
    const { data: boutique } = await supabase
      .from("boutiques" as any).select("id, devise").limit(1).single();
    if (boutique) {
      setBoutiqueId((boutique as any).id);
      setBoutiqueDevise((boutique as any).devise || "XOF");
    }

    if (boutique) {
      const { data: prods } = await supabase
        .from("produits" as any)
        .select("*, variations_produit(*)")
        .eq("boutique_id", (boutique as any).id)
        .order("created_at", { ascending: false });
      setProduits((prods as any[] || []).map(p => ({
        ...p,
        variations: p.variations_produit || [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Upload photo depuis téléphone
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `produits/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("mes-secrets-media")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("mes-secrets-media")
        .getPublicUrl(path);
      const url = urlData.publicUrl;
      setForm(prev => ({ ...prev, photos: [...prev.photos, url] }));
      toast({ title: "✅ Photo ajoutée !" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  // ── Ajouter URL externe
  const addPhotoUrl = () => {
    if (!form.photo_url.trim()) return;
    setForm(prev => ({ ...prev, photos: [...prev.photos, prev.photo_url], photo_url: "" }));
  };

  // ── Ajouter variation
  const addVariation = () => {
    if (!newVarNom) return;
    const valeurs = newVarValeurs.split(",").map(v => v.trim()).filter(Boolean);
    if (valeurs.length === 0) return;
    setVariations(prev => [...prev, { nom: newVarNom, valeurs }]);
    setNewVarNom("");
    setNewVarValeurs("");
  };

  // ── Sauvegarder produit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boutiqueId) {
      toast({ title: "Créez d'abord votre boutique dans Paramètres", variant: "destructive" });
      return;
    }
    if (!form.nom || !form.prix) {
      toast({ title: "Nom et prix obligatoires", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      boutique_id: boutiqueId,
      nom: form.nom,
      description: form.description || null,
      prix: parseFloat(form.prix),
      prix_promo: form.prix_promo ? parseFloat(form.prix_promo) : null,
      type: form.type,
      categorie: form.categorie || null,
      stock: form.stock_illimite ? 0 : parseInt(form.stock) || 0,
      stock_illimite: form.stock_illimite,
      photos: form.photos,
      fichier_url: form.fichier_url || null,
      actif: form.actif,
      vedette: form.vedette,
    };

    let produitId = editingId;

    if (editingId) {
      const { error } = await supabase.from("produits" as any).update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      // Supprimer anciennes variations
      await supabase.from("variations_produit" as any).delete().eq("produit_id", editingId);
    } else {
      const { data, error } = await supabase.from("produits" as any).insert(payload).select().single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      produitId = (data as any).id;
    }

    // Sauvegarder variations
    if (variations.length > 0 && produitId) {
      await supabase.from("variations_produit" as any).insert(
        variations.map(v => ({
          produit_id: produitId,
          nom: v.nom,
          valeurs: v.valeurs,
        }))
      );
    }

    toast({ title: `✅ Produit ${editingId ? "modifié" : "créé"} !` });
    setShowForm(false);
    setForm(emptyForm);
    setVariations([]);
    setEditingId(null);
    setSaving(false);
    load();
  };

  // ── Éditer produit
  const handleEdit = (p: Produit) => {
    setForm({
      nom: p.nom, description: p.description || "",
      prix: String(p.prix), prix_promo: String(p.prix_promo || ""),
      type: p.type, categorie: p.categorie || "",
      stock: String(p.stock), stock_illimite: p.stock_illimite,
      photos: p.photos || [], photo_url: "",
      fichier_url: p.fichier_url || "",
      actif: p.actif, vedette: p.vedette,
    });
    setVariations(p.variations || []);
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("produits" as any).delete().eq("id", id);
    toast({ title: "Produit supprimé" });
    load();
  };

  // ── Toggle actif/vedette
  const toggleField = async (id: string, field: "actif" | "vedette", value: boolean) => {
    await supabase.from("produits" as any).update({ [field]: value }).eq("id", id);
    load();
  };

  // ── Filtres
  const filteredProduits = produits.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(searchQ.toLowerCase());
    const matchCateg = filterCateg ? p.categorie === filterCateg : true;
    return matchSearch && matchCateg;
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Produits</h1>
            <p className="text-sm text-muted-foreground">{produits.length} produit{produits.length > 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setVariations([]); }}
            className="bg-primary text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {/* Filtres */}
        {produits.length > 0 && (
          <div className="flex gap-2">
            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher..." className="flex-1 h-9" />
            <select value={filterCateg} onChange={e => setFilterCateg(e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-5">
            <h2 className="font-bold text-lg">
              {editingId ? "✏️ Modifier le produit" : "➕ Nouveau produit"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Infos de base */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-primary">Informations générales</p>
                <div>
                  <label className="text-sm font-medium">Nom du produit *</label>
                  <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Robe en wax taille M" className="mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez le produit..."
                    className="mt-1 w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Prix *</label>
                    <Input type="number" min="0" value={form.prix}
                      onChange={e => setForm({ ...form, prix: e.target.value })}
                      placeholder="0" className="mt-1" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prix promo</label>
                    <Input type="number" min="0" value={form.prix_promo}
                      onChange={e => setForm({ ...form, prix_promo: e.target.value })}
                      placeholder="0 = pas de promo" className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Catégorie</label>
                    <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="">-- Choisir --</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as TypeProduit })}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                      <option value="physique">Physique</option>
                      <option value="numerique">Numérique</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-3 border border-border rounded-xl p-3">
                <p className="text-sm font-semibold text-primary">Stock</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Stock illimité</p>
                    <p className="text-xs text-muted-foreground">Pour les produits numériques ou services</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, stock_illimite: !prev.stock_illimite }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${form.stock_illimite ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.stock_illimite ? "left-7" : "left-1"}`} />
                  </button>
                </div>
                {!form.stock_illimite && (
                  <div>
                    <label className="text-sm font-medium">Quantité en stock</label>
                    <Input type="number" min="0" value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      placeholder="0" className="mt-1" />
                  </div>
                )}
              </div>

              {/* Photos */}
              <div className="space-y-3 border border-border rounded-xl p-3">
                <p className="text-sm font-semibold text-primary">Photos</p>

                {/* Galerie existante */}
                {form.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.photos.map((url, i) => (
                      <div key={i} className="relative w-20 h-20">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-border" />
                        <button type="button"
                          onClick={() => setForm(prev => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload depuis téléphone */}
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={handleFileUpload} />
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto} className="w-full gap-2">
                    <Image className="w-4 h-4" />
                    {uploadingPhoto ? "Upload en cours..." : "Choisir une photo depuis l'appareil"}
                  </Button>
                </div>

                {/* URL externe */}
                <div className="flex gap-2">
                  <Input value={form.photo_url}
                    onChange={e => setForm({ ...form, photo_url: e.target.value })}
                    placeholder="https://... URL d'une image" className="flex-1" />
                  <Button type="button" size="sm" variant="outline" onClick={addPhotoUrl}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Fichier numérique */}
                {form.type === "numerique" && (
                  <div>
                    <label className="text-sm font-medium">Lien du fichier numérique</label>
                    <Input value={form.fichier_url}
                      onChange={e => setForm({ ...form, fichier_url: e.target.value })}
                      placeholder="https://... lien de téléchargement"
                      className="mt-1" />
                  </div>
                )}
              </div>

              {/* Variations */}
              <div className="space-y-3 border border-border rounded-xl p-3">
                <p className="text-sm font-semibold text-primary">Variations</p>
                <p className="text-xs text-muted-foreground">Ex: Taille → S, M, L, XL | Couleur → Rouge, Bleu</p>

                {variations.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium">{v.nom} : </span>
                      <span className="text-sm text-muted-foreground">{v.valeurs.join(", ")}</span>
                    </div>
                    <button type="button" onClick={() => setVariations(prev => prev.filter((_, j) => j !== i))}
                      className="w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <div className="space-y-2">
                  <Input value={newVarNom} onChange={e => setNewVarNom(e.target.value)}
                    placeholder="Nom (ex: Taille)" />
                  <Input value={newVarValeurs} onChange={e => setNewVarValeurs(e.target.value)}
                    placeholder="Valeurs séparées par virgule (ex: S, M, L, XL)" />
                  <Button type="button" size="sm" variant="outline" onClick={addVariation} className="w-full gap-1">
                    <Plus className="w-3 h-3" /> Ajouter la variation
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium">Actif</p>
                    <p className="text-xs text-muted-foreground">Visible en boutique</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, actif: !prev.actif }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.actif ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.actif ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium">Vedette</p>
                    <p className="text-xs text-muted-foreground">Mis en avant</p>
                  </div>
                  <button type="button"
                    onClick={() => setForm(prev => ({ ...prev, vedette: !prev.vedette }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.vedette ? "bg-yellow-400" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.vedette ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-primary text-white">
                  {saving ? "Sauvegarde..." : editingId ? "Modifier" : "Créer le produit"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Liste produits */}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Chargement...</div>
        ) : filteredProduits.length === 0 ? (
          <div className="text-center py-14 bg-card border border-border rounded-2xl">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucun produit</p>
            <p className="text-xs text-muted-foreground mt-1">Créez votre premier produit</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProduits.map(produit => {
              const isExpanded = expandedId === produit.id;
              const photo = produit.photos?.[0];
              return (
                <div key={produit.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex gap-3 items-start">
                      {/* Photo */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                        {photo ? (
                          <img src={photo} alt={produit.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold truncate">{produit.nom}</span>
                          {produit.vedette && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {produit.actif ? "Actif" : "Inactif"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {produit.type}
                          </span>
                        </div>
                        {produit.categorie && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{produit.categorie}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {produit.prix_promo ? (
                            <>
                              <span className="font-black text-primary">{formatPrix(produit.prix_promo, boutiqueDev)}</span>
                              <span className="text-xs text-muted-foreground line-through">{formatPrix(produit.prix, boutiqueDev)}</span>
                            </>
                          ) : (
                            <span className="font-black text-primary">{formatPrix(produit.prix, boutiqueDev)}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {produit.stock_illimite ? "Stock illimité" : `Stock : ${produit.stock}`}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(produit)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpandedId(isExpanded ? null : produit.id)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(produit.id)}
                          className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Détails expandés */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
                      {/* Toggle actif/vedette */}
                      <div className="flex gap-3">
                        <button onClick={() => toggleField(produit.id, "actif", !produit.actif)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {produit.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {produit.actif ? "Désactiver" : "Activer"}
                        </button>
                        <button onClick={() => toggleField(produit.id, "vedette", !produit.vedette)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${produit.vedette ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                          <Star className="w-4 h-4" />
                          {produit.vedette ? "Retirer vedette" : "Mettre en vedette"}
                        </button>
                      </div>

                      {/* Description */}
                      {produit.description && (
                        <p className="text-sm text-muted-foreground">{produit.description}</p>
                      )}

                      {/* Galerie photos */}
                      {produit.photos && produit.photos.length > 1 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Galerie photos</p>
                          <div className="flex gap-2 flex-wrap">
                            {produit.photos.map((url, i) => (
                              <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Variations */}
                      {produit.variations && produit.variations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Variations</p>
                          <div className="space-y-1">
                            {produit.variations.map((v, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium">{v.nom} : </span>
                                <span className="text-muted-foreground">{v.valeurs.join(", ")}</span>
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
