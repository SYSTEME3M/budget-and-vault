import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BoutiqueLayout from "@/components/BoutiqueLayout";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Package,
  Star, Edit2, ToggleLeft, ToggleRight, Globe,
  Instagram, Youtube, Tag, Image, AlertCircle
} from "lucide-react";

type TypeProduit = "physique" | "numerique";

interface Variation {
  nom: string;
  valeurs: string[];
}

interface PaiementProduit {
  reseau: string;
  numero: string;
  nom_titulaire: string;
}

interface ReseauxSociaux {
  instagram: string;
  tiktok: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
  site_web: string;
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
  tags: string[];
  stock: number;
  stock_illimite: boolean;
  photos: string[];
  actif: boolean;
  vedette: boolean;
  paiement_reception: boolean;
  paiement_lien: string | null;
  moyens_paiement: PaiementProduit[];
  politique_remboursement: string;
  politique_confidentialite: string;
  reseaux_sociaux: ReseauxSociaux;
  poids: string;
  dimensions: string;
  sku: string;
  variations?: Variation[];
}

const CATEGORIES = [
  "Vêtements", "Chaussures", "Accessoires", "Électronique",
  "Alimentation", "Beauté & Santé", "Maison & Déco",
  "Sport", "Enfants", "Auto & Moto", "Autre"
];

function formatPrix(prix: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${prix.toFixed(2)}`;
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + devise;
}

function calcPct(prix: number, promo: number): number {
  return Math.round(((prix - promo) / prix) * 100);
}

const SECTIONS = [
  { id: "general", label: "Général" },
  { id: "media", label: "Médias" },
  { id: "prix", label: "Prix & Stock" },
  { id: "variations", label: "Variations" },
  { id: "paiement", label: "Paiement" },
  { id: "reseaux", label: "Réseaux sociaux" },
  { id: "politiques", label: "Politiques" },
  { id: "seo", label: "SEO" },
];

export default function BoutiqueProduitsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [boutique, setBoutique] = useState<any>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newVarNom, setNewVarNom] = useState("");
  const [newVarValeurs, setNewVarValeurs] = useState("");
  const [variations, setVariations] = useState<Variation[]>([]);
  const [newPaiement, setNewPaiement] = useState<PaiementProduit>({
    reseau: "", numero: "", nom_titulaire: ""
  });

  const emptyForm = {
    nom: "",
    description: "",
    prix: "",
    prix_promo: "",
    categorie: "",
    tags: [] as string[],
    stock: "0",
    stock_illimite: false,
    photos: [] as string[],
    photo_url: "",
    actif: true,
    vedette: false,
    paiement_reception: true,
    paiement_lien: "",
    moyens_paiement: [] as PaiementProduit[],
    politique_remboursement: "",
    politique_confidentialite: "",
    reseaux_sociaux: {
      instagram: "", tiktok: "", facebook: "",
      youtube: "", whatsapp: "", site_web: ""
    } as ReseauxSociaux,
    poids: "",
    dimensions: "",
    sku: "",
    // SEO
    seo_titre: "",
    seo_description: "",
  };

  const [form, setForm] = useState(emptyForm);

  const pct = form.prix && form.prix_promo
    ? calcPct(parseFloat(form.prix), parseFloat(form.prix_promo))
    : 0;

  const load = async () => {
    setLoading(true);
    const { data: b } = await supabase
      .from("boutiques" as any).select("*").limit(1).single();
    if (b) setBoutique(b);

    if (b) {
      const { data: prods } = await supabase
        .from("produits" as any)
        .select("*, variations_produit(*)")
        .eq("boutique_id", (b as any).id)
        .eq("type", "physique")
        .order("created_at", { ascending: false });
      setProduits((prods as any[] || []).map(p => ({
        ...p,
        variations: p.variations_produit || [],
        moyens_paiement: p.moyens_paiement || [],
        tags: p.tags || [],
        reseaux_sociaux: p.reseaux_sociaux || {},
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
        .from("mes-secrets-media").getPublicUrl(path);
      setForm(prev => ({ ...prev, photos: [...prev.photos, urlData.publicUrl] }));
      toast({ title: "✅ Photo ajoutée !" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    setNewTag("");
  };

  const addVariation = () => {
    if (!newVarNom) return;
    const valeurs = newVarValeurs.split(",").map(v => v.trim()).filter(Boolean);
    if (!valeurs.length) return;
    setVariations(prev => [...prev, { nom: newVarNom, valeurs }]);
    setNewVarNom(""); setNewVarValeurs("");
  };

  const addPaiement = () => {
    if (!newPaiement.reseau || !newPaiement.numero) {
      toast({ title: "Réseau et numéro requis", variant: "destructive" }); return;
    }
    setForm(prev => ({ ...prev, moyens_paiement: [...prev.moyens_paiement, { ...newPaiement }] }));
    setNewPaiement({ reseau: "", numero: "", nom_titulaire: "" });
  };

  const handleSubmit = async () => {
    if (!boutique) {
      toast({ title: "Configurez d'abord votre boutique", variant: "destructive" }); return;
    }
    if (!form.nom || !form.prix) {
      toast({ title: "Nom et prix obligatoires", variant: "destructive" }); return;
    }

    setSaving(true);
    const payload = {
      boutique_id: boutique.id,
      type: "physique",
      nom: form.nom,
      description: form.description || null,
      prix: parseFloat(form.prix),
      prix_promo: form.prix_promo ? parseFloat(form.prix_promo) : null,
      categorie: form.categorie || null,
      tags: form.tags,
      stock: form.stock_illimite ? 0 : parseInt(form.stock) || 0,
      stock_illimite: form.stock_illimite,
      photos: form.photos,
      actif: form.actif,
      vedette: form.vedette,
      paiement_reception: form.paiement_reception,
      paiement_lien: form.paiement_lien || null,
      moyens_paiement: form.moyens_paiement,
      politique_remboursement: form.politique_remboursement || null,
      politique_confidentialite: form.politique_confidentialite || null,
      reseaux_sociaux: form.reseaux_sociaux,
      poids: form.poids || null,
      dimensions: form.dimensions || null,
      sku: form.sku || null,
      seo_titre: (form as any).seo_titre || null,
      seo_description: (form as any).seo_description || null,
    };

    let produitId = editingId;

    if (editingId) {
      const { error } = await supabase.from("produits" as any).update(payload).eq("id", editingId);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      await supabase.from("variations_produit" as any).delete().eq("produit_id", editingId);
    } else {
      const { data, error } = await supabase.from("produits" as any).insert(payload).select().single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      produitId = (data as any).id;
    }

    if (variations.length > 0 && produitId) {
      await supabase.from("variations_produit" as any).insert(
        variations.map(v => ({ produit_id: produitId, nom: v.nom, valeurs: v.valeurs }))
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

  const handleEdit = (p: Produit) => {
    setForm({
      nom: p.nom, description: p.description || "",
      prix: String(p.prix), prix_promo: String(p.prix_promo || ""),
      categorie: p.categorie || "",
      tags: p.tags || [],
      stock: String(p.stock), stock_illimite: p.stock_illimite,
      photos: p.photos || [], photo_url: "",
      actif: p.actif, vedette: p.vedette,
      paiement_reception: p.paiement_reception ?? true,
      paiement_lien: p.paiement_lien || "",
      moyens_paiement: p.moyens_paiement || [],
      politique_remboursement: p.politique_remboursement || "",
      politique_confidentialite: p.politique_confidentialite || "",
      reseaux_sociaux: p.reseaux_sociaux || {
        instagram: "", tiktok: "", facebook: "",
        youtube: "", whatsapp: "", site_web: ""
      },
      poids: p.poids || "",
      dimensions: p.dimensions || "",
      sku: p.sku || "",
      seo_titre: (p as any).seo_titre || "",
      seo_description: (p as any).seo_description || "",
    });
    setVariations(p.variations || []);
    setEditingId(p.id);
    setActiveSection("general");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("produits" as any).delete().eq("id", id);
    toast({ title: "Produit supprimé" });
    load();
  };

  const toggleField = async (id: string, field: "actif" | "vedette", value: boolean) => {
    await supabase.from("produits" as any).update({ [field]: value }).eq("id", id);
    load();
  };

  const filteredProduits = produits.filter(p =>
    p.nom.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <BoutiqueLayout boutiqueName={boutique?.nom} boutiqueSlug={boutique?.slug}>
      <div className="space-y-5 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Produits Physiques</h1>
            <p className="text-sm text-gray-500">{produits.length} produit{produits.length > 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setVariations([]); setActiveSection("general"); }}
            className="bg-pink-500 hover:bg-pink-600 text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau produit
          </Button>
        </div>

        {/* Recherche */}
        {produits.length > 0 && (
          <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Rechercher un produit..." className="h-9" />
        )}

        {/* ── Formulaire multi-sections ── */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header formulaire */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-pink-500" />
                <h2 className="font-bold text-gray-800">
                  {editingId ? "Modifier le produit" : "Nouveau produit physique"}
                </h2>
              </div>
              {pct > 0 && (
                <span className="bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full">
                  -{pct}% de réduction
                </span>
              )}
            </div>

            {/* Navigation sections */}
            <div className="flex gap-1 overflow-x-auto p-3 border-b border-gray-100">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === s.id
                      ? "bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-4">

              {/* ── Section Général ── */}
              {activeSection === "general" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nom du produit *</label>
                    <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                      placeholder="Ex: T-shirt Premium Coton" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <textarea value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Décrivez votre produit en détail..."
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Catégorie</label>
                    <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-pink-300">
                      <option value="">-- Choisir une catégorie --</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <Input value={newTag} onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTag()}
                        placeholder="Ajouter un tag..." className="flex-1" />
                      <Button type="button" size="sm" variant="outline" onClick={addTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {form.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {form.tags.map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full border border-pink-200">
                            <Tag className="w-3 h-3" /> {tag}
                            <button onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))}
                              className="text-pink-400 hover:text-pink-600 ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">SKU (optionnel)</label>
                      <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                        placeholder="REF-001" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Poids (optionnel)</label>
                      <Input value={form.poids} onChange={e => setForm({ ...form, poids: e.target.value })}
                        placeholder="Ex: 500g" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Dimensions (optionnel)</label>
                    <Input value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })}
                      placeholder="Ex: 30cm x 20cm x 10cm" className="mt-1" />
                  </div>
                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium">Actif</p>
                        <p className="text-xs text-gray-400">Visible en boutique</p>
                      </div>
                      <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, actif: !prev.actif }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.actif ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.actif ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium">Vedette</p>
                        <p className="text-xs text-gray-400">Mis en avant</p>
                      </div>
                      <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, vedette: !prev.vedette }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.vedette ? "bg-yellow-400" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.vedette ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section Médias ── */}
              {activeSection === "media" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Photos du produit</p>

                  {form.photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {form.photos.map((url, i) => (
                        <div key={i} className="relative w-24 h-24">
                          <img src={url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1.5 rounded-full">
                              Principal
                            </span>
                          )}
                          <button type="button"
                            onClick={() => setForm(prev => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={handleFileUpload} />
                  <Button type="button" variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto} className="w-full gap-2">
                    <Image className="w-4 h-4" />
                    {uploadingPhoto ? "Upload en cours..." : "📱 Choisir depuis l'appareil"}
                  </Button>

                  <div className="flex gap-2">
                    <Input value={form.photo_url}
                      onChange={e => setForm({ ...form, photo_url: e.target.value })}
                      placeholder="https://... URL d'une image" className="flex-1" />
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => {
                        if (form.photo_url.trim()) {
                          setForm(prev => ({ ...prev, photos: [...prev.photos, prev.photo_url], photo_url: "" }));
                        }
                      }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Section Prix & Stock ── */}
              {activeSection === "prix" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix réel *</label>
                      <Input type="number" min="0" value={form.prix}
                        onChange={e => setForm({ ...form, prix: e.target.value })}
                        placeholder="0" className="mt-1" />
                      {form.prix && (
                        <p className="text-xs text-red-500 font-bold line-through mt-1">
                          {Math.round(parseFloat(form.prix)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {boutique?.devise || "FCFA"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix promo</label>
                      <Input type="number" min="0" value={form.prix_promo}
                        onChange={e => setForm({ ...form, prix_promo: e.target.value })}
                        placeholder="0" className="mt-1" />
                      {pct > 0 && (
                        <p className="text-xs text-green-600 font-bold mt-1">
                          🎉 -{pct}% de réduction
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Gestion du stock</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Stock illimité</p>
                        <p className="text-xs text-gray-400">Pour les services</p>
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
                </div>
              )}

              {/* ── Section Variations ── */}
              {activeSection === "variations" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Ajoutez des options comme la taille, la couleur, le matériau...
                  </p>

                  {variations.map((v, i) => (
                    <div key={i} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{v.nom}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {v.valeurs.map((val, j) => (
                            <span key={j} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => setVariations(prev => prev.filter((_, j) => j !== i))}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <div className="border border-dashed border-pink-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500">➕ Nouvelle variation</p>
                    <Input value={newVarNom} onChange={e => setNewVarNom(e.target.value)}
                      placeholder="Nom (ex: Taille, Couleur, Matière)" />
                    <Input value={newVarValeurs} onChange={e => setNewVarValeurs(e.target.value)}
                      placeholder="Valeurs séparées par virgule (ex: S, M, L, XL)" />
                    <Button type="button" size="sm" onClick={addVariation}
                      className="w-full bg-pink-500 text-white gap-1">
                      <Plus className="w-3 h-3" /> Ajouter la variation
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Section Paiement ── */}
              {activeSection === "paiement" && (
                <div className="space-y-4">
                  {/* Paiement à la réception */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold">Paiement à la réception</p>
                      <p className="text-xs text-gray-400">Le client paie à la livraison</p>
                    </div>
                    <button type="button"
                      onClick={() => setForm(prev => ({ ...prev, paiement_reception: !prev.paiement_reception }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.paiement_reception ? "bg-green-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.paiement_reception ? "left-7" : "left-1"}`} />
                    </button>
                  </div>

                  {/* Lien de paiement */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Lien de paiement (optionnel)</label>
                    <Input value={form.paiement_lien}
                      onChange={e => setForm({ ...form, paiement_lien: e.target.value })}
                      placeholder="https://pay.wave.com/..." className="mt-1" />
                  </div>

                  {/* Mobile Money — texte libre */}
                  {form.moyens_paiement.map((mp, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{mp.reseau}</p>
                        <p className="text-xs text-gray-400">{mp.nom_titulaire} — {mp.numero}</p>
                      </div>
                      <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, moyens_paiement: prev.moyens_paiement.filter((_, j) => j !== i) }))}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <div className="border border-dashed border-pink-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500">➕ Ajouter Mobile Money</p>
                    {/* ✅ Champ texte libre pour le réseau */}
                    <Input value={newPaiement.reseau}
                      onChange={e => setNewPaiement(prev => ({ ...prev, reseau: e.target.value }))}
                      placeholder="Nom du réseau (ex: MTN MoMo, Wave, Orange...)" />
                    <Input value={newPaiement.nom_titulaire}
                      onChange={e => setNewPaiement(prev => ({ ...prev, nom_titulaire: e.target.value }))}
                      placeholder="Nom du titulaire" />
                    <Input value={newPaiement.numero}
                      onChange={e => setNewPaiement(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="Numéro de téléphone" />
                    <Button type="button" size="sm" onClick={addPaiement}
                      className="w-full bg-pink-500 text-white gap-1">
                      <Plus className="w-3 h-3" /> Ajouter
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Section Réseaux sociaux ── */}
              {activeSection === "reseaux" && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Ajoutez vos liens pour que les clients puissent vous suivre
                  </p>
                  {[
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/votre_compte", icon: "📸" },
                    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@votre_compte", icon: "🎵" },
                    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/votre_page", icon: "👥" },
                    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@votre_chaine", icon: "▶️" },
                    { key: "whatsapp", label: "WhatsApp", placeholder: "+229 XX XX XX XX", icon: "💬" },
                    { key: "site_web", label: "Site web", placeholder: "https://www.votre-site.com", icon: "🌐" },
                  ].map(r => (
                    <div key={r.key}>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        {r.icon} {r.label}
                      </label>
                      <Input
                        value={(form.reseaux_sociaux as any)[r.key] || ""}
                        onChange={e => setForm(prev => ({
                          ...prev,
                          reseaux_sociaux: { ...prev.reseaux_sociaux, [r.key]: e.target.value }
                        }))}
                        placeholder={r.placeholder}
                        className="mt-1" />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Section Politiques ── */}
              {activeSection === "politiques" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-xs font-semibold text-yellow-700">Important</p>
                    </div>
                    <p className="text-xs text-yellow-600">
                      Ces politiques seront affichées sur la page de votre boutique et rassurent vos clients.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      🔄 Politique de remboursement
                    </label>
                    <textarea value={form.politique_remboursement}
                      onChange={e => setForm({ ...form, politique_remboursement: e.target.value })}
                      placeholder="Ex: Remboursement accepté dans les 7 jours suivant la réception si le produit est défectueux. Contactez-nous par WhatsApp pour initier un remboursement..."
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      🔒 Politique de confidentialité
                    </label>
                    <textarea value={form.politique_confidentialite}
                      onChange={e => setForm({ ...form, politique_confidentialite: e.target.value })}
                      placeholder="Ex: Vos informations personnelles (nom, téléphone, adresse) sont utilisées uniquement pour traiter votre commande et ne seront jamais partagées avec des tiers..."
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                </div>
              )}

              {/* ── Section SEO ── */}
              {activeSection === "seo" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-700">
                      🔍 Le SEO aide votre produit à être trouvé sur Google et les moteurs de recherche.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Titre SEO</label>
                    <Input value={(form as any).seo_titre || ""}
                      onChange={e => setForm({ ...form, seo_titre: e.target.value } as any)}
                      placeholder="Titre pour les moteurs de recherche" className="mt-1" />
                    <p className="text-xs text-gray-400 mt-1">
                      {((form as any).seo_titre || "").length}/60 caractères recommandés
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description SEO</label>
                    <textarea value={(form as any).seo_description || ""}
                      onChange={e => setForm({ ...form, seo_description: e.target.value } as any)}
                      placeholder="Description courte pour les moteurs de recherche..."
                      className="mt-1 w-full h-24 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                    <p className="text-xs text-gray-400 mt-1">
                      {((form as any).seo_description || "").length}/160 caractères recommandés
                    </p>
                  </div>

                  {/* Aperçu Google */}
                  {((form as any).seo_titre || form.nom) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Aperçu Google</p>
                      <p className="text-blue-600 text-sm font-medium">
                        {(form as any).seo_titre || form.nom}
                      </p>
                      <p className="text-green-600 text-xs">
                        votre-boutique.com/produits/{form.nom.toLowerCase().replace(/\s/g, "-")}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {(form as any).seo_description || form.description || "Aucune description SEO"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Boutons navigation + sauvegarder */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline"
                  onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1">
                  Annuler
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={saving}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                  {saving ? "Sauvegarde..." : editingId ? "✅ Modifier" : "✅ Créer le produit"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Liste produits ── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProduits.length === 0 ? (
          <div className="text-center py-14 bg-white border border-gray-100 rounded-2xl">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun produit physique</p>
            <p className="text-xs text-gray-400 mt-1">Créez votre premier produit</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProduits.map(produit => {
              const isExpanded = expandedId === produit.id;
              const photo = produit.photos?.[0];
              const pctProduit = produit.prix_promo ? calcPct(produit.prix, produit.prix_promo) : 0;

              return (
                <div key={produit.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex gap-3 items-start">
                      {/* Photo avec badge */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {photo ? (
                          <img src={photo} alt={produit.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                        {pctProduit > 0 && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black px-1 py-0.5 rounded-bl-lg">
                            -{pctProduit}%
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 truncate">{produit.nom}</span>
                          {produit.vedette && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                          }`}>
                            {produit.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>

                        {produit.categorie && (
                          <p className="text-xs text-gray-400 mt-0.5">{produit.categorie}</p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          {produit.prix_promo ? (
                            <>
                              <span className="font-black text-pink-600 text-sm">
                                {formatPrix(produit.prix_promo, boutique?.devise)}
                              </span>
                              <span className="text-xs text-red-400 line-through font-bold">
                                {formatPrix(produit.prix, boutique?.devise)}
                              </span>
                            </>
                          ) : (
                            <span className="font-black text-pink-600 text-sm">
                              {formatPrix(produit.prix, boutique?.devise)}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-0.5">
                          {produit.stock_illimite ? "Stock illimité" : `Stock : ${produit.stock}`}
                          {produit.sku && ` • SKU: ${produit.sku}`}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(produit)}
                          className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpandedId(isExpanded ? null : produit.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(produit.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Détails expandés */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleField(produit.id, "actif", !produit.actif)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                          {produit.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          {produit.actif ? "Désactiver" : "Activer"}
                        </button>
                        <button onClick={() => toggleField(produit.id, "vedette", !produit.vedette)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            produit.vedette ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                          }`}>
                          <Star className="w-4 h-4" />
                          {produit.vedette ? "Retirer vedette" : "Vedette"}
                        </button>
                      </div>

                      {produit.description && (
                        <p className="text-sm text-gray-500 line-clamp-3">{produit.description}</p>
                      )}

                      {/* Tags */}
                      {produit.tags && produit.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {produit.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Galerie */}
                      {produit.photos && produit.photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {produit.photos.map((url, i) => (
                            <img key={i} src={url} alt=""
                              className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                          ))}
                        </div>
                      )}

                      {/* Variations */}
                      {produit.variations && produit.variations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Variations</p>
                          {produit.variations.map((v, i) => (
                            <p key={i} className="text-sm">
                              <span className="font-medium">{v.nom} : </span>
                              <span className="text-gray-500">{v.valeurs.join(", ")}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Réseaux sociaux */}
                      {produit.reseaux_sociaux && Object.values(produit.reseaux_sociaux).some(v => v) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Réseaux sociaux</p>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(produit.reseaux_sociaux).map(([k, v]) =>
                              v ? (
                                <a key={k} href={v as string} target="_blank" rel="noopener noreferrer"
                                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg capitalize hover:bg-blue-100">
                                  {k === "site_web" ? "🌐 Site web" :
                                   k === "instagram" ? "📸 Instagram" :
                                   k === "tiktok" ? "🎵 TikTok" :
                                   k === "facebook" ? "👥 Facebook" :
                                   k === "youtube" ? "▶️ YouTube" :
                                   k === "whatsapp" ? "💬 WhatsApp" : k}
                                </a>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}

                      {/* Paiements */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Paiements</p>
                        <div className="flex gap-2 flex-wrap">
                          {produit.paiement_reception && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                              ✅ À la réception
                            </span>
                          )}
                          {produit.paiement_lien && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                              🔗 Lien
                            </span>
                          )}
                          {(produit.moyens_paiement || []).map((mp, i) => (
                            <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">
                              📱 {mp.reseau}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Politiques */}
                      {(produit.politique_remboursement || produit.politique_confidentialite) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Politiques</p>
                          <div className="flex gap-2">
                            {produit.politique_remboursement && (
                              <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg">
                                🔄 Remboursement défini
                              </span>
                            )}
                            {produit.politique_confidentialite && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg">
                                🔒 Confidentialité définie
                              </span>
                            )}
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
    </BoutiqueLayout>
  );
}
