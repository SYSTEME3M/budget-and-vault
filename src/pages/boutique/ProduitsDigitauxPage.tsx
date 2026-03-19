import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BoutiqueLayout from "@/components/BoutiqueLayout";
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  Star, Edit2, ToggleLeft, ToggleRight,
  FileText, BookOpen, Key, Package2,
  Briefcase, Tag, Image, AlertCircle,
  Download, Lock, Zap
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────
type TypeDigital = "fichier" | "formation" | "licence" | "bundle" | "service";
type ModeTarification = "unique" | "abonnement_mensuel" | "abonnement_annuel" | "versements";

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

interface Module {
  titre: string;
  description: string;
}

interface Produit {
  id: string;
  boutique_id: string;
  nom: string;
  description: string;
  prix: number;
  prix_promo: number | null;
  type: string;
  type_digital: TypeDigital;
  mode_tarification: ModeTarification;
  categorie: string;
  tags: string[];
  photos: string[];
  fichier_url: string | null;
  fichier_nom: string | null;
  fichier_taille: string | null;
  modules: Module[];
  actif: boolean;
  vedette: boolean;
  paiement_lien: string | null;
  moyens_paiement: PaiementProduit[];
  politique_remboursement: string;
  politique_confidentialite: string;
  reseaux_sociaux: ReseauxSociaux;
  seo_titre: string;
  seo_description: string;
  protection_antipiratage: boolean;
  livraison_automatique: boolean;
  nb_telechargements: number | null;
}

// ─── Constantes ───────────────────────────────────────────
const TYPES_DIGITAL: Record<TypeDigital, { label: string; icon: any; description: string; color: string }> = {
  fichier: {
    label: "Fichier",
    icon: FileText,
    description: "E-books, PDF, ZIP, MP3, vidéos...",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  formation: {
    label: "Formation",
    icon: BookOpen,
    description: "Cours structurés en modules et chapitres",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  licence: {
    label: "Licence",
    icon: Key,
    description: "Clés d'activation, accès logiciel",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  },
  bundle: {
    label: "Bundle",
    icon: Package2,
    description: "Pack de plusieurs produits groupés",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  service: {
    label: "Service",
    icon: Briefcase,
    description: "Prestations sur mesure, consulting",
    color: "bg-pink-100 text-pink-700 border-pink-200"
  },
};

const MODES_TARIFICATION: Record<ModeTarification, string> = {
  unique: "Paiement unique",
  abonnement_mensuel: "Abonnement mensuel",
  abonnement_annuel: "Abonnement annuel",
  versements: "Paiement en plusieurs fois",
};

const CATEGORIES_DIGITAL = [
  "Marketing Digital", "Développement Web", "Design Graphique",
  "Business & Finance", "Photographie", "Musique & Audio",
  "Développement Personnel", "Langues", "Cuisine", "Sport & Fitness",
  "Informatique", "Art & Créativité", "Autre"
];

function formatPrix(prix: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${prix.toFixed(2)}`;
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + devise;
}

function calcPct(prix: number, promo: number): number {
  return Math.round(((prix - promo) / prix) * 100);
}

const SECTIONS = [
  { id: "type", label: "Type" },
  { id: "general", label: "Général" },
  { id: "media", label: "Couverture" },
  { id: "contenu", label: "Contenu" },
  { id: "prix", label: "Prix" },
  { id: "paiement", label: "Paiement" },
  { id: "reseaux", label: "Réseaux" },
  { id: "politiques", label: "Politiques" },
  { id: "seo", label: "SEO" },
];

export default function ProduitsDigitauxPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileProduitRef = useRef<HTMLInputElement>(null);
  const [boutique, setBoutique] = useState<any>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState("type");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingFichier, setUploadingFichier] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newModule, setNewModule] = useState<Module>({ titre: "", description: "" });
  const [newPaiement, setNewPaiement] = useState<PaiementProduit>({
    reseau: "", numero: "", nom_titulaire: ""
  });

  const emptyForm = {
    nom: "",
    description: "",
    prix: "",
    prix_promo: "",
    type_digital: "fichier" as TypeDigital,
    mode_tarification: "unique" as ModeTarification,
    categorie: "",
    tags: [] as string[],
    photos: [] as string[],
    photo_url: "",
    fichier_url: "",
    fichier_nom: "",
    fichier_taille: "",
    modules: [] as Module[],
    actif: true,
    vedette: false,
    protection_antipiratage: true,
    livraison_automatique: true,
    nb_telechargements: "",
    paiement_lien: "",
    moyens_paiement: [] as PaiementProduit[],
    politique_remboursement: "",
    politique_confidentialite: "",
    reseaux_sociaux: {
      instagram: "", tiktok: "", facebook: "",
      youtube: "", whatsapp: "", site_web: ""
    } as ReseauxSociaux,
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
        .select("*")
        .eq("boutique_id", (b as any).id)
        .eq("type", "numerique")
        .order("created_at", { ascending: false });
      setProduits((prods as any[] || []).map(p => ({
        ...p,
        moyens_paiement: p.moyens_paiement || [],
        tags: p.tags || [],
        modules: p.modules || [],
        reseaux_sociaux: p.reseaux_sociaux || {},
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Upload photo couverture
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `produits/covers/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("mes-secrets-media")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("mes-secrets-media").getPublicUrl(path);
      setForm(prev => ({ ...prev, photos: [urlData.publicUrl] }));
      toast({ title: "✅ Couverture ajoutée !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  // Upload fichier produit
  const handleFichierUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFichier(true);
    try {
      const path = `produits/fichiers/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("mes-secrets-media")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from("mes-secrets-media").getPublicUrl(path);
      const taille = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      setForm(prev => ({
        ...prev,
        fichier_url: urlData.publicUrl,
        fichier_nom: file.name,
        fichier_taille: taille,
      }));
      toast({ title: "✅ Fichier uploadé !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setUploadingFichier(false);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    setNewTag("");
  };

  const addModule = () => {
    if (!newModule.titre) return;
    setForm(prev => ({ ...prev, modules: [...prev.modules, { ...newModule }] }));
    setNewModule({ titre: "", description: "" });
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
      type: "numerique",
      type_digital: form.type_digital,
      mode_tarification: form.mode_tarification,
      nom: form.nom,
      description: form.description || null,
      prix: parseFloat(form.prix),
      prix_promo: form.prix_promo ? parseFloat(form.prix_promo) : null,
      categorie: form.categorie || null,
      tags: form.tags,
      photos: form.photos,
      stock_illimite: true,
      stock: 0,
      fichier_url: form.fichier_url || null,
      fichier_nom: form.fichier_nom || null,
      fichier_taille: form.fichier_taille || null,
      modules: form.modules,
      actif: form.actif,
      vedette: form.vedette,
      protection_antipiratage: form.protection_antipiratage,
      livraison_automatique: form.livraison_automatique,
      nb_telechargements: form.nb_telechargements ? parseInt(form.nb_telechargements) : null,
      paiement_reception: false,
      paiement_lien: form.paiement_lien || null,
      moyens_paiement: form.moyens_paiement,
      politique_remboursement: form.politique_remboursement || null,
      politique_confidentialite: form.politique_confidentialite || null,
      reseaux_sociaux: form.reseaux_sociaux,
      seo_titre: form.seo_titre || null,
      seo_description: form.seo_description || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("produits" as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("produits" as any).insert(payload));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setSaving(false); return;
    }

    toast({ title: `✅ Produit ${editingId ? "modifié" : "créé"} !` });
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setSaving(false);
    load();
  };

  const handleEdit = (p: Produit) => {
    setForm({
      nom: p.nom, description: p.description || "",
      prix: String(p.prix), prix_promo: String(p.prix_promo || ""),
      type_digital: p.type_digital || "fichier",
      mode_tarification: p.mode_tarification || "unique",
      categorie: p.categorie || "",
      tags: p.tags || [],
      photos: p.photos || [], photo_url: "",
      fichier_url: p.fichier_url || "",
      fichier_nom: (p as any).fichier_nom || "",
      fichier_taille: (p as any).fichier_taille || "",
      modules: (p as any).modules || [],
      actif: p.actif, vedette: p.vedette,
      protection_antipiratage: (p as any).protection_antipiratage ?? true,
      livraison_automatique: (p as any).livraison_automatique ?? true,
      nb_telechargements: String((p as any).nb_telechargements || ""),
      paiement_lien: p.paiement_lien || "",
      moyens_paiement: p.moyens_paiement || [],
      politique_remboursement: p.politique_remboursement || "",
      politique_confidentialite: p.politique_confidentialite || "",
      reseaux_sociaux: p.reseaux_sociaux || {
        instagram: "", tiktok: "", facebook: "",
        youtube: "", whatsapp: "", site_web: ""
      },
      seo_titre: p.seo_titre || "",
      seo_description: p.seo_description || "",
    });
    setEditingId(p.id);
    setActiveSection("type");
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

  const TypeIcon = TYPES_DIGITAL[form.type_digital]?.icon || FileText;

  return (
    <BoutiqueLayout boutiqueName={boutique?.nom} boutiqueSlug={boutique?.slug}>
      <div className="space-y-5 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Produits Digitaux</h1>
            <p className="text-sm text-gray-500">{produits.length} produit{produits.length > 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); setActiveSection("type"); }}
            className="bg-pink-500 hover:bg-pink-600 text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {/* Recherche */}
        {produits.length > 0 && (
          <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Rechercher..." className="h-9" />
        )}

        {/* ── Formulaire ── */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-pink-500" />
                <h2 className="font-bold text-gray-800">
                  {editingId ? "Modifier" : "Nouveau produit digital"}
                </h2>
              </div>
              {pct > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">
                  -{pct}%
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

              {/* ── Section Type ── */}
              {activeSection === "type" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">
                    Quel type de produit digital ?
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {(Object.entries(TYPES_DIGITAL) as [TypeDigital, any][]).map(([key, val]) => {
                      const Icon = val.icon;
                      const isSelected = form.type_digital === key;
                      return (
                        <button key={key} type="button"
                          onClick={() => setForm(prev => ({ ...prev, type_digital: key }))}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? "border-pink-500 bg-pink-50"
                              : "border-gray-200 hover:border-pink-200"
                          }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${val.color} flex-shrink-0`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800">{val.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{val.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-pink-500" : "border-gray-300"
                          }`}>
                            {isSelected && <div className="w-3 h-3 rounded-full bg-pink-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mode tarification */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Modèle de tarification</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(Object.entries(MODES_TARIFICATION) as [ModeTarification, string][]).map(([key, label]) => (
                        <button key={key} type="button"
                          onClick={() => setForm(prev => ({ ...prev, mode_tarification: key }))}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-colors text-left ${
                            form.mode_tarification === key
                              ? "border-pink-500 bg-pink-50 text-pink-700"
                              : "border-gray-200 text-gray-600"
                          }`}>
                          {key === "unique" ? "💳 " : key === "abonnement_mensuel" ? "📅 " : key === "abonnement_annuel" ? "🗓️ " : "💰 "}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section Général ── */}
              {activeSection === "general" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nom du produit *</label>
                    <Input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                      placeholder="Ex: Guide complet Facebook Ads 2026" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <textarea value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Décrivez votre produit digital en détail. Qu'est-ce que le client va apprendre/recevoir ?"
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Catégorie</label>
                    <select value={form.categorie}
                      onChange={e => setForm({ ...form, categorie: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-pink-300">
                      <option value="">-- Choisir --</option>
                      {CATEGORIES_DIGITAL.map(c => <option key={c} value={c}>{c}</option>)}
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
                </div>
              )}

              {/* ── Section Couverture ── */}
              {activeSection === "media" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Image de couverture</p>

                  {form.photos[0] && (
                    <div className="relative w-full h-48">
                      <img src={form.photos[0]} alt=""
                        className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, photos: [] }))}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                        ×
                      </button>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={handlePhotoUpload} />
                  <Button type="button" variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto} className="w-full gap-2">
                    <Image className="w-4 h-4" />
                    {uploadingPhoto ? "Upload..." : "📱 Choisir une image de couverture"}
                  </Button>

                  <div className="flex gap-2">
                    <Input value={form.photo_url}
                      onChange={e => setForm({ ...form, photo_url: e.target.value })}
                      placeholder="ou URL de l'image" className="flex-1" />
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => {
                        if (form.photo_url.trim()) {
                          setForm(prev => ({ ...prev, photos: [prev.photo_url], photo_url: "" }));
                        }
                      }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Section Contenu ── */}
              {activeSection === "contenu" && (
                <div className="space-y-4">
                  {/* Fichier */}
                  {(form.type_digital === "fichier" || form.type_digital === "licence") && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Fichier à livrer</p>

                      {form.fichier_url && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                          <Download className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-700 truncate">
                              {form.fichier_nom || "Fichier uploadé"}
                            </p>
                            {form.fichier_taille && (
                              <p className="text-xs text-green-500">{form.fichier_taille}</p>
                            )}
                          </div>
                          <button type="button"
                            onClick={() => setForm(prev => ({ ...prev, fichier_url: "", fichier_nom: "", fichier_taille: "" }))}
                            className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <input ref={fileProduitRef} type="file" className="hidden"
                        onChange={handleFichierUpload} />
                      <Button type="button" variant="outline"
                        onClick={() => fileProduitRef.current?.click()}
                        disabled={uploadingFichier} className="w-full gap-2">
                        <Download className="w-4 h-4" />
                        {uploadingFichier ? "Upload en cours..." : "📤 Uploader le fichier (PDF, ZIP, MP3...)"}
                      </Button>

                      <div>
                        <label className="text-sm font-medium">ou URL du fichier</label>
                        <Input value={form.fichier_url}
                          onChange={e => setForm({ ...form, fichier_url: e.target.value })}
                          placeholder="https://... lien direct du fichier"
                          className="mt-1" />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Limite de téléchargements (optionnel)</label>
                        <Input type="number" min="1" value={form.nb_telechargements}
                          onChange={e => setForm({ ...form, nb_telechargements: e.target.value })}
                          placeholder="Ex: 3 (vide = illimité)" className="mt-1" />
                      </div>
                    </div>
                  )}

                  {/* Formation — modules */}
                  {form.type_digital === "formation" && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Modules / Chapitres</p>

                      {form.modules.map((m, i) => (
                        <div key={i} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              <p className="text-sm font-semibold text-gray-700">{m.titre}</p>
                            </div>
                            {m.description && (
                              <p className="text-xs text-gray-400 mt-1 ml-8">{m.description}</p>
                            )}
                          </div>
                          <button type="button"
                            onClick={() => setForm(prev => ({ ...prev, modules: prev.modules.filter((_, j) => j !== i) }))}
                            className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center ml-2 flex-shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <div className="border border-dashed border-pink-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500">➕ Nouveau module</p>
                        <Input value={newModule.titre}
                          onChange={e => setNewModule(prev => ({ ...prev, titre: e.target.value }))}
                          placeholder="Titre du module (ex: Introduction)" />
                        <Input value={newModule.description}
                          onChange={e => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description courte (optionnel)" />
                        <Button type="button" size="sm" onClick={addModule}
                          className="w-full bg-pink-500 text-white gap-1">
                          <Plus className="w-3 h-3" /> Ajouter le module
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Service */}
                  {form.type_digital === "service" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs text-blue-700 font-medium mb-1">💡 Service sur mesure</p>
                      <p className="text-xs text-blue-600">
                        Décrivez bien votre service dans la section Général. Les clients vous contacteront après commande pour définir les détails.
                      </p>
                    </div>
                  )}

                  {/* Bundle */}
                  {form.type_digital === "bundle" && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Contenu du bundle</p>
                      <textarea
                        placeholder="Listez ce qui est inclus dans ce pack (ex: &#10;- E-book Marketing Digital&#10;- 5 Templates Instagram&#10;- Accès formation vidéo)"
                        className="w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                      <div>
                        <label className="text-sm font-medium">Lien d'accès au bundle</label>
                        <Input value={form.fichier_url}
                          onChange={e => setForm({ ...form, fichier_url: e.target.value })}
                          placeholder="https://... lien d'accès" className="mt-1" />
                      </div>
                    </div>
                  )}

                  {/* Options protection */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500">Options de protection</p>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Protection anti-piratage</p>
                          <p className="text-xs text-gray-400">Lien unique par acheteur</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, protection_antipiratage: !prev.protection_antipiratage }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.protection_antipiratage ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.protection_antipiratage ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Livraison automatique</p>
                          <p className="text-xs text-gray-400">Envoi immédiat après paiement</p>
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => setForm(prev => ({ ...prev, livraison_automatique: !prev.livraison_automatique }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.livraison_automatique ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.livraison_automatique ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Section Prix ── */}
              {activeSection === "prix" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix *</label>
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
                        <p className="text-xs text-green-600 font-bold mt-1">🎉 -{pct}%</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-700 font-medium">
                      Modèle : {MODES_TARIFICATION[form.mode_tarification]}
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      Modifiable dans la section Type
                    </p>
                  </div>
                </div>
              )}

              {/* ── Section Paiement ── */}
              {activeSection === "paiement" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      Lien de paiement (optionnel)
                    </label>
                    <Input value={form.paiement_lien}
                      onChange={e => setForm({ ...form, paiement_lien: e.target.value })}
                      placeholder="https://pay.wave.com/..." className="mt-1" />
                  </div>

                  {form.moyens_paiement.map((mp, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-semibold">{mp.reseau}</p>
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
                    {/* ✅ Champ texte libre */}
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
                    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/...", icon: "📸" },
                    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@...", icon: "🎵" },
                    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/...", icon: "👥" },
                    { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@...", icon: "▶️" },
                    { key: "whatsapp", label: "WhatsApp", placeholder: "+229 XX XX XX XX", icon: "💬" },
                    { key: "site_web", label: "Site web", placeholder: "https://votre-site.com", icon: "🌐" },
                  ].map(r => (
                    <div key={r.key}>
                      <label className="text-sm font-medium text-gray-700">{r.icon} {r.label}</label>
                      <Input
                        value={(form.reseaux_sociaux as any)[r.key] || ""}
                        onChange={e => setForm(prev => ({
                          ...prev,
                          reseaux_sociaux: { ...prev.reseaux_sociaux, [r.key]: e.target.value }
                        }))}
                        placeholder={r.placeholder} className="mt-1" />
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
                      Ces politiques rassurent vos clients et protègent votre business.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      🔄 Politique de remboursement
                    </label>
                    <textarea value={form.politique_remboursement}
                      onChange={e => setForm({ ...form, politique_remboursement: e.target.value })}
                      placeholder="Ex: Aucun remboursement après téléchargement du fichier. En cas de problème technique, contactez-nous dans les 48h..."
                      className="mt-1 w-full h-28 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">
                      🔒 Politique de confidentialité
                    </label>
                    <textarea value={form.politique_confidentialite}
                      onChange={e => setForm({ ...form, politique_confidentialite: e.target.value })}
                      placeholder="Ex: Vos données personnelles sont utilisées uniquement pour la livraison de votre commande..."
                      className="mt-1 w-full h-28 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                </div>
              )}

              {/* ── Section SEO ── */}
              {activeSection === "seo" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-700">
                      🔍 Optimisez votre produit pour être trouvé sur Google.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Titre SEO</label>
                    <Input value={form.seo_titre}
                      onChange={e => setForm({ ...form, seo_titre: e.target.value })}
                      placeholder="Titre pour les moteurs de recherche" className="mt-1" />
                    <p className="text-xs text-gray-400 mt-1">{form.seo_titre.length}/60 caractères</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description SEO</label>
                    <textarea value={form.seo_description}
                      onChange={e => setForm({ ...form, seo_description: e.target.value })}
                      placeholder="Description pour les moteurs de recherche..."
                      className="mt-1 w-full h-20 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                    <p className="text-xs text-gray-400 mt-1">{form.seo_description.length}/160 caractères</p>
                  </div>
                  {(form.seo_titre || form.nom) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Aperçu Google</p>
                      <p className="text-blue-600 text-sm font-medium">{form.seo_titre || form.nom}</p>
                      <p className="text-green-600 text-xs">votre-boutique.com/produits/{form.nom.toLowerCase().replace(/\s/g, "-")}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{form.seo_description || form.description || "Aucune description SEO"}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline"
                  onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1">
                  Annuler
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={saving}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                  {saving ? "Sauvegarde..." : editingId ? "✅ Modifier" : "✅ Créer"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Liste ── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : produits.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).length === 0 ? (
          <div className="text-center py-14 bg-white border border-gray-100 rounded-2xl">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun produit digital</p>
          </div>
        ) : (
          <div className="space-y-3">
            {produits.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).map(produit => {
              const isExpanded = expandedId === produit.id;
              const photo = produit.photos?.[0];
              const pctP = produit.prix_promo ? calcPct(produit.prix, produit.prix_promo) : 0;
              const TypeIconP = TYPES_DIGITAL[(produit.type_digital as TypeDigital)]?.icon || FileText;
              const typeColor = TYPES_DIGITAL[(produit.type_digital as TypeDigital)]?.color || "";

              return (
                <div key={produit.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex gap-3 items-start">
                      {/* Couverture ou icône type */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        {photo ? (
                          <img src={photo} alt={produit.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center border ${typeColor}`}>
                            <TypeIconP className="w-7 h-7" />
                          </div>
                        )}
                        {pctP > 0 && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black px-1 py-0.5 rounded-bl-lg">
                            -{pctP}%
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 truncate">{produit.nom}</span>
                          {produit.vedette && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeColor}`}>
                            {TYPES_DIGITAL[(produit.type_digital as TypeDigital)]?.label || produit.type_digital}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                          }`}>
                            {produit.actif ? "Actif" : "Inactif"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {MODES_TARIFICATION[(produit as any).mode_tarification as ModeTarification] || "Paiement unique"}
                          </span>
                        </div>

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

                        {produit.categorie && (
                          <p className="text-xs text-gray-400 mt-0.5">{produit.categorie}</p>
                        )}
                      </div>

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
                          {produit.vedette ? "Retirer" : "Vedette"}
                        </button>
                      </div>

                      {produit.description && (
                        <p className="text-sm text-gray-500 line-clamp-3">{produit.description}</p>
                      )}

                      {/* Badges protection */}
                      <div className="flex gap-2 flex-wrap">
                        {(produit as any).protection_antipiratage && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Anti-piratage
                          </span>
                        )}
                        {(produit as any).livraison_automatique && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Livraison auto
                          </span>
                        )}
                      </div>

                      {/* Modules */}
                      {(produit as any).modules && (produit as any).modules.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">
                            {(produit as any).modules.length} modules
                          </p>
                          {(produit as any).modules.slice(0, 3).map((m: Module, i: number) => (
                            <p key={i} className="text-xs text-gray-600">
                              {i + 1}. {m.titre}
                            </p>
                          ))}
                        </div>
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

                      {/* Réseaux sociaux */}
                      {produit.reseaux_sociaux && Object.values(produit.reseaux_sociaux).some(v => v) && (
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(produit.reseaux_sociaux).map(([k, v]) =>
                            v ? (
                              <a key={k} href={v as string} target="_blank" rel="noopener noreferrer"
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100">
                                {k === "instagram" ? "📸" : k === "tiktok" ? "🎵" : k === "facebook" ? "👥" : k === "youtube" ? "▶️" : k === "whatsapp" ? "💬" : "🌐"}
                              </a>
                            ) : null
                          )}
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
