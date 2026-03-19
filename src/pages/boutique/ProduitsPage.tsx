import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BoutiqueLayout from "@/components/BoutiqueLayout";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Package,
  Image, Tag, Star, Edit2, Smartphone, Globe,
  ToggleLeft, ToggleRight
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
  paiement_reception: boolean;
  paiement_lien: string | null;
  moyens_paiement: PaiementProduit[];
  variations?: Variation[];
}

const CATEGORIES = [
  "Vêtements", "Chaussures", "Accessoires", "Électronique",
  "Alimentation", "Beauté & Santé", "Maison", "Livres & Formation",
  "Services", "Formation en ligne", "Logiciel", "Musique", "Autre"
];

const RESEAUX = ["MTN Mobile Money", "Moov Money", "Wave", "Orange Money", "Airtel Money", "PayPal"];

function formatPrix(prix: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${prix.toFixed(2)}`;
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + devise;
}

function calcPct(prix: number, promo: number): number {
  return Math.round(((prix - promo) / prix) * 100);
}

export default function BoutiqueProduitsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [boutique, setBoutique] = useState<any>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<TypeProduit | "">("");

  const emptyForm = {
    nom: "", description: "",
    prix: "", prix_promo: "",
    type: "physique" as TypeProduit,
    categorie: "",
    stock: "0", stock_illimite: false,
    photos: [] as string[], photo_url: "",
    fichier_url: "",
    actif: true, vedette: false,
    paiement_reception: true,
    paiement_lien: "",
    moyens_paiement: [] as PaiementProduit[],
  };

  const [form, setForm] = useState(emptyForm);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [newVarNom, setNewVarNom] = useState("");
  const [newVarValeurs, setNewVarValeurs] = useState("");
  const [newPaiement, setNewPaiement] = useState<PaiementProduit>({
    reseau: "", numero: "", nom_titulaire: ""
  });

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
        .order("created_at", { ascending: false });
      setProduits((prods as any[] || []).map(p => ({
        ...p,
        variations: p.variations_produit || [],
        moyens_paiement: p.moyens_paiement || [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Upload photo
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

  const addPhotoUrl = () => {
    if (!form.photo_url.trim()) return;
    setForm(prev => ({ ...prev, photos: [...prev.photos, prev.photo_url], photo_url: "" }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boutique) {
      toast({ title: "Configurez d'abord votre boutique", variant: "destructive" }); return;
    }
    if (!form.nom || !form.prix) {
      toast({ title: "Nom et prix obligatoires", variant: "destructive" }); return;
    }

    setSaving(true);
    const payload = {
      boutique_id: boutique.id,
      nom: form.nom,
      description: form.description || null,
      prix: parseFloat(form.prix),
      prix_promo: form.prix_promo ? parseFloat(form.prix_promo) : null,
      type: form.type,
      categorie: form.categorie || null,
      stock: form.stock_illimite ? 0 : parseInt(form.stock) || 0,
      stock_illimite: form.type === "numerique" ? true : form.stock_illimite,
      photos: form.photos,
      fichier_url: form.fichier_url || null,
      actif: form.actif,
      vedette: form.vedette,
      paiement_reception: form.type === "numerique" ? false : form.paiement_reception,
      paiement_lien: form.paiement_lien || null,
      moyens_paiement: form.moyens_paiement,
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

    // Variations (physique seulement)
    if (form.type === "physique" && variations.length > 0 && produitId) {
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
      type: p.type, categorie: p.categorie || "",
      stock: String(p.stock), stock_illimite: p.stock_illimite,
      photos: p.photos || [], photo_url: "",
      fichier_url: p.fichier_url || "",
      actif: p.actif, vedette: p.vedette,
      paiement_reception: p.paiement_reception ?? true,
      paiement_lien: p.paiement_lien || "",
      moyens_paiement: p.moyens_paiement || [],
    });
    setVariations(p.variations || []);
    setEditingId(p.id);
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

  const filteredProduits = produits.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(searchQ.toLowerCase());
    const matchType = filterType ? p.type === filterType : true;
    return matchSearch && matchType;
  });

  const pct = form.prix && form.prix_promo
    ? calcPct(parseFloat(form.prix), parseFloat(form.prix_promo))
    : 0;

  return (
    <BoutiqueLayout boutiqueName={boutique?.nom} boutiqueSlug={boutique?.slug}>
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Produits</h1>
            <p className="text-sm text-gray-500">{produits.length} produit{produits.length > 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setVariations([]); }}
            className="bg-pink-500 hover:bg-pink-600 text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {/* Filtres */}
        {produits.length > 0 && (
          <div className="flex gap-2">
            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher..." className="flex-1 h-9" />
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Tous types</option>
              <option value="physique">Physique</option>
              <option value="numerique">Numérique</option>
            </select>
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800">
                {editingId ? "✏️ Modifier" : "➕ Nouveau produit"}
              </h2>
              {pct > 0 && (
                <span className="bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full">
                  -{pct}%
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type produit */}
              <div className="flex gap-2">
                {(["physique", "numerique"] as TypeProduit[]).map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      form.type === t
                        ? "border-pink-500 bg-pink-50 text-pink-600"
                        : "border-gray-200 text-gray-500"
                    }`}>
                    {t === "physique" ? <Package className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    {t === "physique" ? "Physique" : "Numérique"}
                  </button>
                ))}
              </div>

              {/* Infos de base */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Nom du produit *</label>
                  <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Robe en wax" className="mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Décrivez le produit..."
                    className="mt-1 w-full h-20 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" />
                </div>

                {/* Prix */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Prix réel *</label>
                    <Input type="number" min="0" value={form.prix}
                      onChange={e => setForm({ ...form, prix: e.target.value })}
                      placeholder="0" className="mt-1" required />
                    {form.prix && (
                      <p className="text-xs text-red-500 font-bold line-through mt-0.5">
                        {Math.round(parseFloat(form.prix)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {boutique?.devise || "FCFA"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Prix promo</label>
                    <Input type="number" min="0" value={form.prix_promo}
                      onChange={e => setForm({ ...form, prix_promo: e.target.value })}
                      placeholder="0 = pas de promo" className="mt-1" />
                    {pct > 0 && (
                      <p className="text-xs text-green-600 font-bold mt-0.5">
                        -{pct}% de réduction
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Catégorie</label>
                  <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}
                    className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">-- Choisir --</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Stock — physique seulement */}
              {form.type === "physique" && (
                <div className="space-y-3 border border-gray-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-pink-600">Stock</p>
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
              )}

              {/* Numérique : stock auto illimité */}
              {form.type === "numerique" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ Produit numérique — stock illimité automatiquement
                  </p>
                </div>
              )}

              {/* Photos */}
              <div className="space-y-3 border border-gray-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-pink-600">
                  {form.type === "numerique" ? "Photo de couverture" : "Photos"}
                </p>

                {form.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.photos.map((url, i) => (
                      <div key={i} className="relative w-20 h-20">
                        <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                        <button type="button"
                          onClick={() => setForm(prev => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto} className="w-full gap-2">
                  <Image className="w-4 h-4" />
                  {uploadingPhoto ? "Upload..." : "Choisir depuis l'appareil"}
                </Button>

                <div className="flex gap-2">
                  <Input value={form.photo_url}
                    onChange={e => setForm({ ...form, photo_url: e.target.value })}
                    placeholder="https://... URL image" className="flex-1" />
                  <Button type="button" size="sm" variant="outline" onClick={addPhotoUrl}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Lien fichier numérique */}
                {form.type === "numerique" && (
                  <div>
                    <label className="text-sm font-medium">Lien d'accès / téléchargement *</label>
                    <div className="flex gap-2 mt-1">
                      <Globe className="w-4 h-4 text-gray-400 mt-2.5 flex-shrink-0" />
                      <Input value={form.fichier_url}
                        onChange={e => setForm({ ...form, fichier_url: e.target.value })}
                        placeholder="https://... lien du fichier ou accès" />
                    </div>
                  </div>
                )}
              </div>

              {/* Variations — physique seulement */}
              {form.type === "physique" && (
                <div className="space-y-3 border border-gray-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-pink-600">Variations</p>
                  <p className="text-xs text-gray-400">Ex: Taille → S,M,L,XL | Couleur → Rouge,Bleu</p>

                  {variations.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm">
                        <span className="font-medium">{v.nom} : </span>
                        <span className="text-gray-500">{v.valeurs.join(", ")}</span>
                      </span>
                      <button type="button"
                        onClick={() => setVariations(prev => prev.filter((_, j) => j !== i))}
                        className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Input value={newVarNom} onChange={e => setNewVarNom(e.target.value)}
                      placeholder="Nom variation (ex: Taille)" />
                    <Input value={newVarValeurs} onChange={e => setNewVarValeurs(e.target.value)}
                      placeholder="Valeurs séparées par virgule (ex: S, M, L, XL)" />
                    <Button type="button" size="sm" variant="outline"
                      onClick={addVariation} className="w-full gap-1">
                      <Plus className="w-3 h-3" /> Ajouter la variation
                    </Button>
                  </div>
                </div>
              )}

              {/* Paiement par produit */}
              <div className="space-y-3 border border-gray-200 rounded-xl p-3">
                <p className="text-sm font-semibold text-pink-600">Options de paiement</p>

                {/* Paiement à la réception — physique seulement */}
                {form.type === "physique" && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Paiement à la réception</p>
                      <p className="text-xs text-gray-400">Le client paie à la livraison</p>
                    </div>
                    <button type="button"
                      onClick={() => setForm(prev => ({ ...prev, paiement_reception: !prev.paiement_reception }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.paiement_reception ? "bg-green-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.paiement_reception ? "left-7" : "left-1"}`} />
                    </button>
                  </div>
                )}

                {/* Lien de paiement */}
                <div>
                  <label className="text-sm font-medium">Lien de paiement (optionnel)</label>
                  <Input value={form.paiement_lien}
                    onChange={e => setForm({ ...form, paiement_lien: e.target.value })}
                    placeholder="https://pay.wave.com/..." className="mt-1" />
                </div>

                {/* Mobile Money */}
                {form.moyens_paiement.map((mp, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
                    <div>
                      <p className="text-sm font-medium">{mp.reseau}</p>
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
                  <p className="text-xs text-gray-400 font-medium">Ajouter Mobile Money</p>
                  <select value={newPaiement.reseau}
                    onChange={e => setNewPaiement(prev => ({ ...prev, reseau: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="">-- Réseau --</option>
                    {RESEAUX.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <Input value={newPaiement.nom_titulaire}
                    onChange={e => setNewPaiement(prev => ({ ...prev, nom_titulaire: e.target.value }))}
                    placeholder="Nom du titulaire" />
                  <Input value={newPaiement.numero}
                    onChange={e => setNewPaiement(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="Numéro" />
                  <Button type="button" size="sm" onClick={addPaiement}
                    className="w-full bg-pink-500 text-white gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </Button>
                </div>
              </div>

              {/* Options actif / vedette */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium">Actif</p>
                    <p className="text-xs text-gray-400">Visible</p>
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

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline"
                  onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                  {saving ? "Sauvegarde..." : editingId ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Liste produits */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Chargement...</div>
        ) : filteredProduits.length === 0 ? (
          <div className="text-center py-14 bg-white border border-gray-100 rounded-2xl">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun produit</p>
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
                      {/* Photo avec badge promo */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
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
                            produit.type === "numerique" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {produit.type === "numerique" ? "Numérique" : "Physique"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                          }`}>
                            {produit.actif ? "Actif" : "Inactif"}
                          </span>
                        </div>

                        {produit.categorie && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{produit.categorie}</span>
                          </div>
                        )}

                        {/* Prix avec barré */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {produit.prix_promo ? (
                            <>
                              <span className="font-black text-pink-600">
                                {formatPrix(produit.prix_promo, boutique?.devise)}
                              </span>
                              <span className="text-xs text-red-400 line-through font-bold">
                                {formatPrix(produit.prix, boutique?.devise)}
                              </span>
                            </>
                          ) : (
                            <span className="font-black text-pink-600">
                              {formatPrix(produit.prix, boutique?.devise)}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-400 mt-0.5">
                          {produit.type === "numerique"
                            ? "Stock illimité"
                            : produit.stock_illimite ? "Stock illimité" : `Stock : ${produit.stock}`
                          }
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleEdit(produit)}
                          className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpandedId(isExpanded ? null : produit.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(produit.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Détails expandés */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      {/* Toggle actif/vedette */}
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
                          {produit.vedette ? "Retirer vedette" : "Mettre en vedette"}
                        </button>
                      </div>

                      {produit.description && (
                        <p className="text-sm text-gray-500">{produit.description}</p>
                      )}

                      {/* Galerie */}
                      {produit.photos && produit.photos.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                          {produit.photos.map((url, i) => (
                            <img key={i} src={url} alt=""
                              className="w-14 h-14 object-cover rounded-lg border border-gray-100" />
                          ))}
                        </div>
                      )}

                      {/* Variations */}
                      {produit.type === "physique" && produit.variations && produit.variations.length > 0 && (
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

                      {/* Paiements */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Paiements acceptés</p>
                        <div className="flex gap-2 flex-wrap">
                          {produit.paiement_reception && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                              À la réception
                            </span>
                          )}
                          {produit.paiement_lien && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                              Lien paiement
                            </span>
                          )}
                          {(produit.moyens_paiement || []).map((mp, i) => (
                            <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">
                              {mp.reseau}
                            </span>
                          ))}
                        </div>
                      </div>
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
