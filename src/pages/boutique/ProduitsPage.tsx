import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BoutiqueLayout from "@/components/BoutiqueLayout";
import { hasNexoraPremium } from "@/lib/nexora-auth";
import { useNavigate } from "react-router-dom";
import {
  Plus, Trash2, ChevronDown, ChevronUp, Package,
  Star, Edit2, ToggleLeft, ToggleRight,
  FileText, BookOpen, Key, Package2,
  Briefcase, Tag, Image, AlertCircle,
  Download, Lock, Zap, Crown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TypeDigital = "fichier" | "formation" | "licence" | "bundle" | "service";
type ModeTarification = "unique" | "abonnement_mensuel" | "abonnement_annuel" | "versements";

interface Variation { nom: string; valeurs: string[]; }
interface PaiementProduit { reseau: string; numero: string; nom_titulaire: string; }
interface ReseauxSociaux { instagram: string; tiktok: string; facebook: string; youtube: string; whatsapp: string; site_web: string; }
interface Module { titre: string; description: string; }

interface ProduitPhysique {
  id: string; boutique_id: string; nom: string; description: string;
  prix: number; prix_promo: number | null; type: "physique"; categorie: string;
  tags: string[]; stock: number; stock_illimite: boolean; photos: string[];
  actif: boolean; vedette: boolean; paiement_reception: boolean;
  paiement_lien: string | null; moyens_paiement: PaiementProduit[];
  politique_remboursement: string; politique_confidentialite: string;
  reseaux_sociaux: ReseauxSociaux; poids: string; dimensions: string; sku: string;
  variations?: Variation[];
}

interface ProduitDigital {
  id: string; boutique_id: string; nom: string; description: string;
  prix: number; prix_promo: number | null; type: "numerique";
  type_digital: TypeDigital; mode_tarification: ModeTarification;
  categorie: string; tags: string[]; photos: string[];
  fichier_url: string | null; fichier_nom: string | null; fichier_taille: string | null;
  modules: Module[]; actif: boolean; vedette: boolean;
  paiement_lien: string | null; moyens_paiement: PaiementProduit[];
  politique_remboursement: string; politique_confidentialite: string;
  reseaux_sociaux: ReseauxSociaux; seo_titre: string; seo_description: string;
  protection_antipiratage: boolean; livraison_automatique: boolean;
  nb_telechargements: number | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const CATEGORIES_PHYSIQUE = [
  "Vêtements", "Chaussures", "Accessoires", "Électronique",
  "Alimentation", "Beauté & Santé", "Maison & Déco",
  "Sport", "Enfants", "Auto & Moto", "Autre"
];

const CATEGORIES_DIGITAL = [
  "Marketing Digital", "Développement Web", "Design Graphique",
  "Business & Finance", "Photographie", "Musique & Audio",
  "Développement Personnel", "Langues", "Cuisine", "Sport & Fitness",
  "Informatique", "Art & Créativité", "Autre"
];

const TYPES_DIGITAL: Record<TypeDigital, { label: string; icon: any; description: string; color: string }> = {
  fichier:   { label: "Fichier",    icon: FileText,  description: "E-books, PDF, ZIP, MP3, vidéos...",           color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  formation: { label: "Formation",  icon: BookOpen,  description: "Cours structurés en modules et chapitres",   color: "bg-blue-100 text-blue-700 border-blue-200" },
  licence:   { label: "Licence",    icon: Key,       description: "Clés d'activation, accès logiciel",           color: "bg-purple-100 text-purple-700 border-purple-200" },
  bundle:    { label: "Bundle",     icon: Package2,  description: "Pack de plusieurs produits groupés",          color: "bg-green-100 text-green-700 border-green-200" },
  service:   { label: "Service",    icon: Briefcase, description: "Prestations sur mesure, consulting",          color: "bg-pink-100 text-pink-700 border-pink-200" },
};

const MODES_TARIFICATION: Record<ModeTarification, string> = {
  unique:             "Paiement unique",
  abonnement_mensuel: "Abonnement mensuel",
  abonnement_annuel:  "Abonnement annuel",
  versements:         "Paiement en plusieurs fois",
};

const SECTIONS_PHYSIQUE = [
  { id: "general", label: "Général" }, { id: "media", label: "Médias" },
  { id: "prix", label: "Prix & Stock" }, { id: "variations", label: "Variations" },
  { id: "paiement", label: "Paiement" }, { id: "reseaux", label: "Réseaux" },
  { id: "politiques", label: "Politiques" }, { id: "seo", label: "SEO" },
];

const SECTIONS_DIGITAL = [
  { id: "type", label: "Type" }, { id: "general", label: "Général" },
  { id: "media", label: "Couverture" }, { id: "contenu", label: "Contenu" },
  { id: "prix", label: "Prix" }, { id: "paiement", label: "Paiement" },
  { id: "reseaux", label: "Réseaux" }, { id: "politiques", label: "Politiques" },
  { id: "seo", label: "SEO" },
];

function formatPrix(prix: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${prix.toFixed(2)}`;
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + devise;
}

function calcPct(prix: number, promo: number): number {
  return Math.round(((prix - promo) / prix) * 100);
}

const EMPTY_RESEAUX: ReseauxSociaux = { instagram: "", tiktok: "", facebook: "", youtube: "", whatsapp: "", site_web: "" };

const RESEAUX_LINKS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/...", icon: "📸" },
  { key: "tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@...",   icon: "🎵" },
  { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/...",  icon: "👥" },
  { key: "youtube",   label: "YouTube",   placeholder: "https://youtube.com/@...",  icon: "▶️" },
  { key: "whatsapp",  label: "WhatsApp",  placeholder: "+229 XX XX XX XX",          icon: "💬" },
  { key: "site_web",  label: "Site web",  placeholder: "https://votre-site.com",    icon: "🌐" },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function ProduitsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileProduitRef = useRef<HTMLInputElement>(null);

  // ── Vérification premium
  const isPremium = hasNexoraPremium();

  const [onglet, setOnglet] = useState<"physique" | "numerique">("physique");
  const [boutique, setBoutique] = useState<any>(null);
  const [produitsPhysiques, setProduitsPhysiques] = useState<ProduitPhysique[]>([]);
  const [produitsDigitaux, setProduitsDigitaux] = useState<ProduitDigital[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingFichier, setUploadingFichier] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const [variations, setVariations] = useState<Variation[]>([]);
  const [newVarNom, setNewVarNom] = useState("");
  const [newVarValeurs, setNewVarValeurs] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPaiement, setNewPaiement] = useState<PaiementProduit>({ reseau: "", numero: "", nom_titulaire: "" });
  const [newModule, setNewModule] = useState<Module>({ titre: "", description: "" });

  const emptyFormPhysique = {
    nom: "", description: "", prix: "", prix_promo: "",
    categorie: "", tags: [] as string[], stock: "0", stock_illimite: false,
    photos: [] as string[], photo_url: "", actif: true, vedette: false,
    paiement_reception: true, paiement_lien: "", moyens_paiement: [] as PaiementProduit[],
    politique_remboursement: "", politique_confidentialite: "",
    reseaux_sociaux: { ...EMPTY_RESEAUX },
    poids: "", dimensions: "", sku: "", seo_titre: "", seo_description: "",
  };

  const emptyFormDigital = {
    nom: "", description: "", prix: "", prix_promo: "",
    type_digital: "fichier" as TypeDigital, mode_tarification: "unique" as ModeTarification,
    categorie: "", tags: [] as string[], photos: [] as string[], photo_url: "",
    fichier_url: "", fichier_nom: "", fichier_taille: "",
    modules: [] as Module[], actif: true, vedette: false,
    protection_antipiratage: true, livraison_automatique: true, nb_telechargements: "",
    paiement_lien: "", moyens_paiement: [] as PaiementProduit[],
    politique_remboursement: "", politique_confidentialite: "",
    reseaux_sociaux: { ...EMPTY_RESEAUX },
    seo_titre: "", seo_description: "",
  };

  const [formP, setFormP] = useState(emptyFormPhysique);
  const [formD, setFormD] = useState(emptyFormDigital);

  const pctP = formP.prix && formP.prix_promo ? calcPct(parseFloat(formP.prix), parseFloat(formP.prix_promo)) : 0;
  const pctD = formD.prix && formD.prix_promo ? calcPct(parseFloat(formD.prix), parseFloat(formD.prix_promo)) : 0;

  const load = async () => {
    setLoading(true);
    const { data: b } = await supabase.from("boutiques" as any).select("*").limit(1).single();
    if (b) {
      setBoutique(b);
      const { data: phys } = await supabase
        .from("produits" as any).select("*, variations_produit(*)")
        .eq("boutique_id", (b as any).id).eq("type", "physique")
        .order("created_at", { ascending: false });
      setProduitsPhysiques((phys as any[] || []).map(p => ({
        ...p, variations: p.variations_produit || [],
        moyens_paiement: p.moyens_paiement || [], tags: p.tags || [],
        reseaux_sociaux: p.reseaux_sociaux || {},
      })));
      const { data: digi } = await supabase
        .from("produits" as any).select("*")
        .eq("boutique_id", (b as any).id).eq("type", "numerique")
        .order("created_at", { ascending: false });
      setProduitsDigitaux((digi as any[] || []).map(p => ({
        ...p, moyens_paiement: p.moyens_paiement || [], tags: p.tags || [],
        modules: p.modules || [], reseaux_sociaux: p.reseaux_sociaux || {},
      })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Mur premium ──────────────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <BoutiqueLayout boutiqueName="Nexora Shop">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center mb-6 shadow-lg">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Fonctionnalité Premium</h2>
          <p className="text-gray-500 text-sm mb-1 max-w-xs">
            La boutique est réservée aux membres <span className="font-bold text-yellow-600">Premium</span>.
          </p>
          <p className="text-gray-400 text-xs mb-8 max-w-xs">
            Passez au plan Premium pour créer votre boutique, ajouter vos produits et gérer vos commandes.
          </p>
          <Button
            onClick={() => navigate("/boutique/parametres")}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow-md gap-2"
          >
            <Crown className="w-4 h-4" /> Passer à Premium
          </Button>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </BoutiqueLayout>
    );
  }

  // ── Upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `produits/${onglet === "physique" ? "" : "covers/"}${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
      if (onglet === "physique") setFormP(prev => ({ ...prev, photos: [...prev.photos, urlData.publicUrl] }));
      else setFormD(prev => ({ ...prev, photos: [urlData.publicUrl] }));
      toast({ title: "Photo ajoutée !" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  const handleFichierUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFichier(true);
    try {
      const path = `produits/fichiers/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
      const taille = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      setFormD(prev => ({ ...prev, fichier_url: urlData.publicUrl, fichier_nom: file.name, fichier_taille: taille }));
      toast({ title: "Fichier uploadé !" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setUploadingFichier(false);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (onglet === "physique") setFormP(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    else setFormD(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    setNewTag("");
  };

  const addVariation = () => {
    if (!newVarNom) return;
    const valeurs = newVarValeurs.split(",").map(v => v.trim()).filter(Boolean);
    if (!valeurs.length) return;
    setVariations(prev => [...prev, { nom: newVarNom, valeurs }]);
    setNewVarNom(""); setNewVarValeurs("");
  };

  const addModule = () => {
    if (!newModule.titre) return;
    setFormD(prev => ({ ...prev, modules: [...prev.modules, { ...newModule }] }));
    setNewModule({ titre: "", description: "" });
  };

  const addPaiement = () => {
    if (!newPaiement.reseau || !newPaiement.numero) {
      toast({ title: "Réseau et numéro requis", variant: "destructive" }); return;
    }
    if (onglet === "physique") setFormP(prev => ({ ...prev, moyens_paiement: [...prev.moyens_paiement, { ...newPaiement }] }));
    else setFormD(prev => ({ ...prev, moyens_paiement: [...prev.moyens_paiement, { ...newPaiement }] }));
    setNewPaiement({ reseau: "", numero: "", nom_titulaire: "" });
  };

  const handleSubmitPhysique = async () => {
    if (!boutique) { toast({ title: "Configurez d'abord votre boutique", variant: "destructive" }); return; }
    if (!formP.nom || !formP.prix) { toast({ title: "Nom et prix obligatoires", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      boutique_id: boutique.id, type: "physique",
      nom: formP.nom, description: formP.description || null,
      prix: parseFloat(formP.prix), prix_promo: formP.prix_promo ? parseFloat(formP.prix_promo) : null,
      categorie: formP.categorie || null, tags: formP.tags,
      stock: formP.stock_illimite ? 0 : parseInt(formP.stock) || 0,
      stock_illimite: formP.stock_illimite, photos: formP.photos,
      actif: formP.actif, vedette: formP.vedette,
      paiement_reception: formP.paiement_reception, paiement_lien: formP.paiement_lien || null,
      moyens_paiement: formP.moyens_paiement,
      politique_remboursement: formP.politique_remboursement || null,
      politique_confidentialite: formP.politique_confidentialite || null,
      reseaux_sociaux: formP.reseaux_sociaux,
      poids: formP.poids || null, dimensions: formP.dimensions || null, sku: formP.sku || null,
      seo_titre: formP.seo_titre || null, seo_description: formP.seo_description || null,
    };
    let produitId = editingId;
    if (editingId) {
      const { error } = await supabase.from("produits" as any).update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await supabase.from("variations_produit" as any).delete().eq("produit_id", editingId);
    } else {
      const { data, error } = await supabase.from("produits" as any).insert(payload).select().single();
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); setSaving(false); return; }
      produitId = (data as any).id;
    }
    if (variations.length > 0 && produitId) {
      await supabase.from("variations_produit" as any).insert(
        variations.map(v => ({ produit_id: produitId, nom: v.nom, valeurs: v.valeurs }))
      );
    }
    toast({ title: `Produit ${editingId ? "modifié" : "créé"} avec succès !` });
    setShowForm(false); setFormP(emptyFormPhysique); setVariations([]); setEditingId(null); setSaving(false); load();
  };

  const handleSubmitDigital = async () => {
    if (!boutique) { toast({ title: "Configurez d'abord votre boutique", variant: "destructive" }); return; }
    if (!formD.nom || !formD.prix) { toast({ title: "Nom et prix obligatoires", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      boutique_id: boutique.id, type: "numerique",
      type_digital: formD.type_digital, mode_tarification: formD.mode_tarification,
      nom: formD.nom, description: formD.description || null,
      prix: parseFloat(formD.prix), prix_promo: formD.prix_promo ? parseFloat(formD.prix_promo) : null,
      categorie: formD.categorie || null, tags: formD.tags, photos: formD.photos,
      stock_illimite: true, stock: 0,
      fichier_url: formD.fichier_url || null, fichier_nom: formD.fichier_nom || null,
      fichier_taille: formD.fichier_taille || null, modules: formD.modules,
      actif: formD.actif, vedette: formD.vedette,
      protection_antipiratage: formD.protection_antipiratage,
      livraison_automatique: formD.livraison_automatique,
      nb_telechargements: formD.nb_telechargements ? parseInt(formD.nb_telechargements) : null,
      paiement_reception: false, paiement_lien: formD.paiement_lien || null,
      moyens_paiement: formD.moyens_paiement,
      politique_remboursement: formD.politique_remboursement || null,
      politique_confidentialite: formD.politique_confidentialite || null,
      reseaux_sociaux: formD.reseaux_sociaux,
      seo_titre: formD.seo_titre || null, seo_description: formD.seo_description || null,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("produits" as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("produits" as any).insert(payload));
    }
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); setSaving(false); return; }
    toast({ title: `Produit ${editingId ? "modifié" : "créé"} avec succès !` });
    setShowForm(false); setFormD(emptyFormDigital); setEditingId(null); setSaving(false); load();
  };

  const handleEditPhysique = (p: ProduitPhysique) => {
    setFormP({
      nom: p.nom, description: p.description || "",
      prix: String(p.prix), prix_promo: String(p.prix_promo || ""),
      categorie: p.categorie || "", tags: p.tags || [],
      stock: String(p.stock), stock_illimite: p.stock_illimite,
      photos: p.photos || [], photo_url: "", actif: p.actif, vedette: p.vedette,
      paiement_reception: p.paiement_reception ?? true, paiement_lien: p.paiement_lien || "",
      moyens_paiement: p.moyens_paiement || [],
      politique_remboursement: p.politique_remboursement || "",
      politique_confidentialite: p.politique_confidentialite || "",
      reseaux_sociaux: p.reseaux_sociaux || { ...EMPTY_RESEAUX },
      poids: p.poids || "", dimensions: p.dimensions || "", sku: p.sku || "",
      seo_titre: (p as any).seo_titre || "", seo_description: (p as any).seo_description || "",
    });
    setVariations(p.variations || []);
    setEditingId(p.id); setActiveSection("general"); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditDigital = (p: ProduitDigital) => {
    setFormD({
      nom: p.nom, description: p.description || "",
      prix: String(p.prix), prix_promo: String(p.prix_promo || ""),
      type_digital: p.type_digital || "fichier",
      mode_tarification: p.mode_tarification || "unique",
      categorie: p.categorie || "", tags: p.tags || [],
      photos: p.photos || [], photo_url: "",
      fichier_url: p.fichier_url || "", fichier_nom: (p as any).fichier_nom || "",
      fichier_taille: (p as any).fichier_taille || "", modules: (p as any).modules || [],
      actif: p.actif, vedette: p.vedette,
      protection_antipiratage: (p as any).protection_antipiratage ?? true,
      livraison_automatique: (p as any).livraison_automatique ?? true,
      nb_telechargements: String((p as any).nb_telechargements || ""),
      paiement_lien: p.paiement_lien || "", moyens_paiement: p.moyens_paiement || [],
      politique_remboursement: p.politique_remboursement || "",
      politique_confidentialite: p.politique_confidentialite || "",
      reseaux_sociaux: p.reseaux_sociaux || { ...EMPTY_RESEAUX },
      seo_titre: p.seo_titre || "", seo_description: p.seo_description || "",
    });
    setEditingId(p.id); setActiveSection("type"); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    await supabase.from("produits" as any).delete().eq("id", id);
    toast({ title: "Produit supprimé" }); load();
  };

  const toggleField = async (id: string, field: "actif" | "vedette", value: boolean) => {
    await supabase.from("produits" as any).update({ [field]: value }).eq("id", id); load();
  };

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setFormP(emptyFormPhysique); setFormD(emptyFormDigital);
    setVariations([]);
    setActiveSection(onglet === "physique" ? "general" : "type");
  };

  const TypeIconD = TYPES_DIGITAL[formD.type_digital]?.icon || FileText;

  return (
    <BoutiqueLayout boutiqueName={boutique?.nom} boutiqueSlug={boutique?.slug}>
      <div className="space-y-5 pb-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Produits</h1>
            <p className="text-sm text-gray-500">
              {produitsPhysiques.length} physique{produitsPhysiques.length > 1 ? "s" : ""} · {produitsDigitaux.length} digital{produitsDigitaux.length > 1 ? "ux" : ""}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-pink-500 hover:bg-pink-600 text-white gap-1">
            <Plus className="w-4 h-4" /> Nouveau
          </Button>
        </div>

        {/* ── Onglets ── */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => { setOnglet("physique"); setShowForm(false); setSearchQ(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              onglet === "physique" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}>
            <Package className="w-4 h-4" /> Physiques ({produitsPhysiques.length})
          </button>
          <button onClick={() => { setOnglet("numerique"); setShowForm(false); setSearchQ(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              onglet === "numerique" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}>
            <FileText className="w-4 h-4" /> Digitaux ({produitsDigitaux.length})
          </button>
        </div>

        {/* ── Recherche ── */}
        <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder={`Rechercher un produit ${onglet === "physique" ? "physique" : "digital"}...`}
          className="h-9" />

        {/* ════════════════════════════════════════
            FORMULAIRE PHYSIQUE
        ════════════════════════════════════════ */}
        {showForm && onglet === "physique" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-pink-500" />
                <h2 className="font-bold text-gray-800">{editingId ? "Modifier le produit" : "Nouveau produit physique"}</h2>
              </div>
              {pctP > 0 && <span className="bg-red-500 text-white text-sm font-black px-3 py-1 rounded-full">-{pctP}%</span>}
            </div>

            <div className="flex gap-1 overflow-x-auto p-3 border-b border-gray-100">
              {SECTIONS_PHYSIQUE.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === s.id ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{s.label}</button>
              ))}
            </div>

            <div className="p-4 space-y-4">

              {/* Général */}
              {activeSection === "general" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nom du produit *</label>
                    <Input value={formP.nom} onChange={e => setFormP({ ...formP, nom: e.target.value })}
                      placeholder="Ex: T-shirt Premium Coton" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <textarea value={formP.description} onChange={e => setFormP({ ...formP, description: e.target.value })}
                      placeholder="Décrivez votre produit en détail..."
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Catégorie</label>
                    <select value={formP.categorie} onChange={e => setFormP({ ...formP, categorie: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-pink-300">
                      <option value="">-- Choisir --</option>
                      {CATEGORIES_PHYSIQUE.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <Input value={newTag} onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Ajouter un tag..." className="flex-1" />
                      <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
                    </div>
                    {formP.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formP.tags.map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full border border-pink-200">
                            <Tag className="w-3 h-3" /> {tag}
                            <button onClick={() => setFormP(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))} className="ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">SKU</label>
                      <Input value={formP.sku} onChange={e => setFormP({ ...formP, sku: e.target.value })} placeholder="REF-001" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Poids</label>
                      <Input value={formP.poids} onChange={e => setFormP({ ...formP, poids: e.target.value })} placeholder="Ex: 500g" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Dimensions</label>
                    <Input value={formP.dimensions} onChange={e => setFormP({ ...formP, dimensions: e.target.value })} placeholder="Ex: 30cm x 20cm x 10cm" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div><p className="text-sm font-medium">Actif</p><p className="text-xs text-gray-400">Visible</p></div>
                      <button type="button" onClick={() => setFormP(prev => ({ ...prev, actif: !prev.actif }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${formP.actif ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formP.actif ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div><p className="text-sm font-medium">Vedette</p><p className="text-xs text-gray-400">Mis en avant</p></div>
                      <button type="button" onClick={() => setFormP(prev => ({ ...prev, vedette: !prev.vedette }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${formP.vedette ? "bg-yellow-400" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formP.vedette ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Médias */}
              {activeSection === "media" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Photos du produit</p>
                  {formP.photos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {formP.photos.map((url, i) => (
                        <div key={i} className="relative w-24 h-24">
                          <img src={url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                          {i === 0 && <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-xs px-1.5 rounded-full">Principal</span>}
                          <button type="button" onClick={() => setFormP(prev => ({ ...prev, photos: prev.photos.filter((_, j) => j !== i) }))}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="w-full gap-2">
                    <Image className="w-4 h-4" /> {uploadingPhoto ? "Upload en cours..." : "Choisir depuis l'appareil"}
                  </Button>
                  <div className="flex gap-2">
                    <Input value={formP.photo_url} onChange={e => setFormP({ ...formP, photo_url: e.target.value })} placeholder="https://... URL" className="flex-1" />
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => { if (formP.photo_url.trim()) setFormP(prev => ({ ...prev, photos: [...prev.photos, prev.photo_url], photo_url: "" })); }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Prix & Stock */}
              {activeSection === "prix" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix réel *</label>
                      <Input type="number" min="0" value={formP.prix} onChange={e => setFormP({ ...formP, prix: e.target.value })} placeholder="0" className="mt-1" />
                      {formP.prix && <p className="text-xs text-red-500 font-bold line-through mt-1">{Math.round(parseFloat(formP.prix)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {boutique?.devise || "FCFA"}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix promo</label>
                      <Input type="number" min="0" value={formP.prix_promo} onChange={e => setFormP({ ...formP, prix_promo: e.target.value })} placeholder="0" className="mt-1" />
                      {pctP > 0 && <p className="text-xs text-green-600 font-bold mt-1">-{pctP}%</p>}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Gestion du stock</p>
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium">Stock illimité</p><p className="text-xs text-gray-400">Pour les services</p></div>
                      <button type="button" onClick={() => setFormP(prev => ({ ...prev, stock_illimite: !prev.stock_illimite }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${formP.stock_illimite ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formP.stock_illimite ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                    {!formP.stock_illimite && (
                      <div>
                        <label className="text-sm font-medium">Quantité</label>
                        <Input type="number" min="0" value={formP.stock} onChange={e => setFormP({ ...formP, stock: e.target.value })} placeholder="0" className="mt-1" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Variations */}
              {activeSection === "variations" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Taille, couleur, matériau...</p>
                  {variations.map((v, i) => (
                    <div key={i} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{v.nom}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {v.valeurs.map((val, j) => (
                            <span key={j} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{val}</span>
                          ))}
                        </div>
                      </div>
                      <button type="button" onClick={() => setVariations(prev => prev.filter((_, j) => j !== i))}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="border border-dashed border-pink-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500">Nouvelle variation</p>
                    <Input value={newVarNom} onChange={e => setNewVarNom(e.target.value)} placeholder="Nom (ex: Taille, Couleur)" />
                    <Input value={newVarValeurs} onChange={e => setNewVarValeurs(e.target.value)} placeholder="Valeurs séparées par virgule" />
                    <Button type="button" size="sm" onClick={addVariation} className="w-full bg-pink-500 text-white gap-1">
                      <Plus className="w-3 h-3" /> Ajouter
                    </Button>
                  </div>
                </div>
              )}

              {/* Paiement physique */}
              {activeSection === "paiement" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div><p className="text-sm font-semibold">Paiement à la réception</p><p className="text-xs text-gray-400">Le client paie à la livraison</p></div>
                    <button type="button" onClick={() => setFormP(prev => ({ ...prev, paiement_reception: !prev.paiement_reception }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${formP.paiement_reception ? "bg-green-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formP.paiement_reception ? "left-7" : "left-1"}`} />
                    </button>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Lien de paiement</label>
                    <Input value={formP.paiement_lien} onChange={e => setFormP({ ...formP, paiement_lien: e.target.value })} placeholder="https://pay.wave.com/..." className="mt-1" />
                  </div>
                  {formP.moyens_paiement.map((mp, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div><p className="text-sm font-semibold">{mp.reseau}</p><p className="text-xs text-gray-400">{mp.nom_titulaire} — {mp.numero}</p></div>
                      <button type="button" onClick={() => setFormP(prev => ({ ...prev, moyens_paiement: prev.moyens_paiement.filter((_, j) => j !== i) }))}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <div className="border border-dashed border-pink-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500">Mobile Money</p>
                    <Input value={newPaiement.reseau} onChange={e => setNewPaiement(prev => ({ ...prev, reseau: e.target.value }))} placeholder="MTN MoMo, Wave, Orange..." />
                    <Input value={newPaiement.nom_titulaire} onChange={e => setNewPaiement(prev => ({ ...prev, nom_titulaire: e.target.value }))} placeholder="Nom du titulaire" />
                    <Input value={newPaiement.numero} onChange={e => setNewPaiement(prev => ({ ...prev, numero: e.target.value }))} placeholder="Numéro de téléphone" />
                    <Button type="button" size="sm" onClick={addPaiement} className="w-full bg-pink-500 text-white gap-1"><Plus className="w-3 h-3" /> Ajouter</Button>
                  </div>
                </div>
              )}

              {/* Réseaux physique */}
              {activeSection === "reseaux" && (
                <div className="space-y-3">
                  {RESEAUX_LINKS.map(r => (
                    <div key={r.key}>
                      <label className="text-sm font-medium text-gray-700">{r.icon} {r.label}</label>
                      <Input value={(formP.reseaux_sociaux as any)[r.key] || ""}
                        onChange={e => setFormP(prev => ({ ...prev, reseaux_sociaux: { ...prev.reseaux_sociaux, [r.key]: e.target.value } }))}
                        placeholder={r.placeholder} className="mt-1" />
                    </div>
                  ))}
                </div>
              )}

              {/* Politiques physique */}
              {activeSection === "politiques" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-yellow-600" /><p className="text-xs font-semibold text-yellow-700">Important</p></div>
                    <p className="text-xs text-yellow-600">Ces politiques rassurent vos clients.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Politique de remboursement</label>
                    <textarea value={formP.politique_remboursement} onChange={e => setFormP({ ...formP, politique_remboursement: e.target.value })}
                      placeholder="Ex: Remboursement accepté dans les 7 jours..."
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Politique de confidentialité</label>
                    <textarea value={formP.politique_confidentialite} onChange={e => setFormP({ ...formP, politique_confidentialite: e.target.value })}
                      placeholder="Ex: Vos données sont utilisées uniquement pour traiter votre commande..."
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                </div>
              )}

              {/* SEO physique */}
              {activeSection === "seo" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-700">Optimisez votre produit pour Google.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Titre SEO</label>
                    <Input value={formP.seo_titre} onChange={e => setFormP({ ...formP, seo_titre: e.target.value } as any)} placeholder="Titre SEO" className="mt-1" />
                    <p className="text-xs text-gray-400 mt-1">{formP.seo_titre.length}/60</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description SEO</label>
                    <textarea value={formP.seo_description} onChange={e => setFormP({ ...formP, seo_description: e.target.value } as any)}
                      placeholder="Description SEO..."
                      className="mt-1 w-full h-24 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                    <p className="text-xs text-gray-400 mt-1">{formP.seo_description.length}/160</p>
                  </div>
                  {(formP.seo_titre || formP.nom) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Aperçu Google</p>
                      <p className="text-blue-600 text-sm font-medium">{formP.seo_titre || formP.nom}</p>
                      <p className="text-green-600 text-xs">votre-boutique.com/produits/{formP.nom.toLowerCase().replace(/\s/g, "-")}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{formP.seo_description || formP.description || "Aucune description SEO"}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Annuler</Button>
                <Button type="button" onClick={handleSubmitPhysique} disabled={saving} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                  {saving ? "Sauvegarde..." : editingId ? "Modifier" : "Créer le produit"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            FORMULAIRE DIGITAL
        ════════════════════════════════════════ */}
        {showForm && onglet === "numerique" && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeIconD className="w-5 h-5 text-pink-500" />
                <h2 className="font-bold text-gray-800">{editingId ? "Modifier" : "Nouveau produit digital"}</h2>
              </div>
              {pctD > 0 && <span className="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">-{pctD}%</span>}
            </div>

            <div className="flex gap-1 overflow-x-auto p-3 border-b border-gray-100">
              {SECTIONS_DIGITAL.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === s.id ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{s.label}</button>
              ))}
            </div>

            <div className="p-4 space-y-4">

              {/* Type digital */}
              {activeSection === "type" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Quel type de produit digital ?</p>
                  <div className="grid grid-cols-1 gap-3">
                    {(Object.entries(TYPES_DIGITAL) as [TypeDigital, any][]).map(([key, val]) => {
                      const Icon = val.icon;
                      const isSelected = formD.type_digital === key;
                      return (
                        <button key={key} type="button" onClick={() => setFormD(prev => ({ ...prev, type_digital: key }))}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${isSelected ? "border-pink-500 bg-pink-50" : "border-gray-200 hover:border-pink-200"}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${val.color} flex-shrink-0`}><Icon className="w-6 h-6" /></div>
                          <div className="flex-1"><p className="font-bold text-gray-800">{val.label}</p><p className="text-xs text-gray-500 mt-0.5">{val.description}</p></div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-pink-500" : "border-gray-300"}`}>
                            {isSelected && <div className="w-3 h-3 rounded-full bg-pink-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Modèle de tarification</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(Object.entries(MODES_TARIFICATION) as [ModeTarification, string][]).map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setFormD(prev => ({ ...prev, mode_tarification: key }))}
                          className={`py-2 px-3 rounded-xl text-xs font-medium border-2 transition-colors text-left ${formD.mode_tarification === key ? "border-pink-500 bg-pink-50 text-pink-700" : "border-gray-200 text-gray-600"}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Général digital */}
              {activeSection === "general" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Nom du produit *</label>
                    <Input value={formD.nom} onChange={e => setFormD({ ...formD, nom: e.target.value })} placeholder="Ex: Guide complet Facebook Ads 2026" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description</label>
                    <textarea value={formD.description} onChange={e => setFormD({ ...formD, description: e.target.value })}
                      placeholder="Qu'est-ce que le client va apprendre/recevoir ?"
                      className="mt-1 w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Catégorie</label>
                    <select value={formD.categorie} onChange={e => setFormD({ ...formD, categorie: e.target.value })}
                      className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-pink-300">
                      <option value="">-- Choisir --</option>
                      {CATEGORIES_DIGITAL.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <Input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Ajouter un tag..." className="flex-1" />
                      <Button type="button" size="sm" variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
                    </div>
                    {formD.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formD.tags.map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full border border-pink-200">
                            <Tag className="w-3 h-3" /> {tag}
                            <button onClick={() => setFormD(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))} className="ml-1">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div><p className="text-sm font-medium">Actif</p><p className="text-xs text-gray-400">Visible</p></div>
                      <button type="button" onClick={() => setFormD(prev => ({ ...prev, actif: !prev.actif }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${formD.actif ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formD.actif ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div><p className="text-sm font-medium">Vedette</p><p className="text-xs text-gray-400">Mis en avant</p></div>
                      <button type="button" onClick={() => setFormD(prev => ({ ...prev, vedette: !prev.vedette }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${formD.vedette ? "bg-yellow-400" : "bg-gray-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${formD.vedette ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Couverture digital */}
              {activeSection === "media" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700">Image de couverture</p>
                  {formD.photos[0] && (
                    <div className="relative w-full h-48">
                      <img src={formD.photos[0]} alt="" className="w-full h-full object-cover rounded-xl border border-gray-200" />
                      <button type="button" onClick={() => setFormD(prev => ({ ...prev, photos: [] }))}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow">×</button>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="w-full gap-2">
                    <Image className="w-4 h-4" /> {uploadingPhoto ? "Upload en cours..." : "Choisir une image de couverture"}
                  </Button>
                  <div className="flex gap-2">
                    <Input value={formD.photo_url} onChange={e => setFormD({ ...formD, photo_url: e.target.value })} placeholder="ou URL de l'image" className="flex-1" />
                    <Button type="button" size="sm" variant="outline"
                      onClick={() => { if (formD.photo_url.trim()) setFormD(prev => ({ ...prev, photos: [prev.photo_url], photo_url: "" })); }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Contenu digital */}
              {activeSection === "contenu" && (
                <div className="space-y-4">
                  {(formD.type_digital === "fichier" || formD.type_digital === "licence") && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Fichier à livrer</p>
                      {formD.fichier_url && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                          <Download className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-700 truncate">{formD.fichier_nom || "Fichier uploadé"}</p>
                            {formD.fichier_taille && <p className="text-xs text-green-500">{formD.fichier_taille}</p>}
                          </div>
                          <button type="button" onClick={() => setFormD(prev => ({ ...prev, fichier_url: "", fichier_nom: "", fichier_taille: "" }))} className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <input ref={fileProduitRef} type="file" className="hidden" onChange={handleFichierUpload} />
                      <Button type="button" variant="outline" onClick={() => fileProduitRef.current?.click()} disabled={uploadingFichier} className="w-full gap-2">
                        <Download className="w-4 h-4" /> {uploadingFichier ? "Upload en cours..." : "Uploader le fichier (PDF, ZIP, MP3...)"}
                      </Button>
                      <div>
                        <label className="text-sm font-medium">ou URL du fichier</label>
                        <Input value={formD.fichier_url} onChange={e => setFormD({ ...formD, fichier_url: e.target.value })} placeholder="https://..." className="mt-1" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Limite de téléchargements</label>
                        <Input type="number" min="1" value={formD.nb_telechargements} onChange={e => setFormD({ ...formD, nb_telechargements: e.target.value })} placeholder="vide = illimité" className="mt-1" />
                      </div>
                    </div>
                  )}

                  {formD.type_digital === "formation" && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Modules / Chapitres</p>
                      {formD.modules.map((m, i) => (
                        <div key={i} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                              <p className="text-sm font-semibold text-gray-700">{m.titre}</p>
                            </div>
                            {m.description && <p className="text-xs text-gray-400 mt-1 ml-8">{m.description}</p>}
                          </div>
                          <button type="button" onClick={() => setFormD(prev => ({ ...prev, modules: prev.modules.filter((_, j) => j !== i) }))}
                            className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center ml-2"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <div className="border border-dashed border-pink-200 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500">Nouveau module</p>
                        <Input value={newModule.titre} onChange={e => setNewModule(prev => ({ ...prev, titre: e.target.value }))} placeholder="Titre du module" />
                        <Input value={newModule.description} onChange={e => setNewModule(prev => ({ ...prev, description: e.target.value }))} placeholder="Description (optionnel)" />
                        <Button type="button" size="sm" onClick={addModule} className="w-full bg-pink-500 text-white gap-1"><Plus className="w-3 h-3" /> Ajouter</Button>
                      </div>
                    </div>
                  )}

                  {formD.type_digital === "service" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <p className="text-xs text-blue-700 font-medium mb-1">Service sur mesure</p>
                      <p className="text-xs text-blue-600">Décrivez votre service dans Général. Les clients vous contacteront après commande.</p>
                    </div>
                  )}

                  {formD.type_digital === "bundle" && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700">Contenu du bundle</p>
                      <textarea placeholder="Listez ce qui est inclus..." className="w-full h-32 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                      <div>
                        <label className="text-sm font-medium">Lien d'accès</label>
                        <Input value={formD.fichier_url} onChange={e => setFormD({ ...formD, fichier_url: e.target.value })} placeholder="https://..." className="mt-1" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500">Options de protection</p>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <div><p className="text-sm font-medium">Anti-piratage</p><p className="text-xs text-gray-400">Lien unique par acheteur</p></div>
                      </div>
                      <button type="button" onClick={() => setFormD(prev => ({ ...prev, protection_antipiratage: !prev.protection_antipiratage }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${formD.protection_antipiratage ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formD.protection_antipiratage ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <div><p className="text-sm font-medium">Livraison automatique</p><p className="text-xs text-gray-400">Envoi immédiat après paiement</p></div>
                      </div>
                      <button type="button" onClick={() => setFormD(prev => ({ ...prev, livraison_automatique: !prev.livraison_automatique }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${formD.livraison_automatique ? "bg-green-500" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${formD.livraison_automatique ? "left-7" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Prix digital */}
              {activeSection === "prix" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix *</label>
                      <Input type="number" min="0" value={formD.prix} onChange={e => setFormD({ ...formD, prix: e.target.value })} placeholder="0" className="mt-1" />
                      {formD.prix && <p className="text-xs text-red-500 font-bold line-through mt-1">{Math.round(parseFloat(formD.prix)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {boutique?.devise || "FCFA"}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Prix promo</label>
                      <Input type="number" min="0" value={formD.prix_promo} onChange={e => setFormD({ ...formD, prix_promo: e.target.value })} placeholder="0" className="mt-1" />
                      {pctD > 0 && <p className="text-xs text-green-600 font-bold mt-1">-{pctD}%</p>}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-700 font-medium">Modèle : {MODES_TARIFICATION[formD.mode_tarification]}</p>
                    <p className="text-xs text-blue-500 mt-0.5">Modifiable dans la section Type</p>
                  </div>
                </div>
              )}

              {/* Paiement digital */}
              {activeSection === "paiement" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Lien de paiement</label>
                    <Input value={formD.paiement_lien} onChange={e => setFormD({ ...formD, paiement_lien: e.target.value })} placeholder="https://pay.wave.com/..." className="mt-1" />
                  </div>
                  {formD.moyens_paiement.map((mp, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div><p className="text-sm font-semibold">{mp.reseau}</p><p className="text-xs text-gray-400">{mp.nom_titulaire} — {mp.numero}</p></div>
                      <button type="button" onClick={() => setFormD(prev => ({ ...prev, moyens_paiement: prev.moyens_paiement.filter((_, j) => j !== i) }))}
                        className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  <div className="border border-dashed border-pink-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500">Mobile Money</p>
                    <Input value={newPaiement.reseau} onChange={e => setNewPaiement(prev => ({ ...prev, reseau: e.target.value }))} placeholder="MTN MoMo, Wave, Orange..." />
                    <Input value={newPaiement.nom_titulaire} onChange={e => setNewPaiement(prev => ({ ...prev, nom_titulaire: e.target.value }))} placeholder="Nom du titulaire" />
                    <Input value={newPaiement.numero} onChange={e => setNewPaiement(prev => ({ ...prev, numero: e.target.value }))} placeholder="Numéro de téléphone" />
                    <Button type="button" size="sm" onClick={addPaiement} className="w-full bg-pink-500 text-white gap-1"><Plus className="w-3 h-3" /> Ajouter</Button>
                  </div>
                </div>
              )}

              {/* Réseaux digital */}
              {activeSection === "reseaux" && (
                <div className="space-y-3">
                  {RESEAUX_LINKS.map(r => (
                    <div key={r.key}>
                      <label className="text-sm font-medium text-gray-700">{r.icon} {r.label}</label>
                      <Input value={(formD.reseaux_sociaux as any)[r.key] || ""}
                        onChange={e => setFormD(prev => ({ ...prev, reseaux_sociaux: { ...prev.reseaux_sociaux, [r.key]: e.target.value } }))}
                        placeholder={r.placeholder} className="mt-1" />
                    </div>
                  ))}
                </div>
              )}

              {/* Politiques digital */}
              {activeSection === "politiques" && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-yellow-600" /><p className="text-xs font-semibold text-yellow-700">Important</p></div>
                    <p className="text-xs text-yellow-600">Ces politiques rassurent vos clients et protègent votre business.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Politique de remboursement</label>
                    <textarea value={formD.politique_remboursement} onChange={e => setFormD({ ...formD, politique_remboursement: e.target.value })}
                      placeholder="Ex: Aucun remboursement après téléchargement..."
                      className="mt-1 w-full h-28 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Politique de confidentialité</label>
                    <textarea value={formD.politique_confidentialite} onChange={e => setFormD({ ...formD, politique_confidentialite: e.target.value })}
                      placeholder="Ex: Vos données sont utilisées uniquement..."
                      className="mt-1 w-full h-28 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                  </div>
                </div>
              )}

              {/* SEO digital */}
              {activeSection === "seo" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs text-blue-700">Optimisez votre produit pour Google.</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Titre SEO</label>
                    <Input value={formD.seo_titre} onChange={e => setFormD({ ...formD, seo_titre: e.target.value })} placeholder="Titre SEO" className="mt-1" />
                    <p className="text-xs text-gray-400 mt-1">{formD.seo_titre.length}/60</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Description SEO</label>
                    <textarea value={formD.seo_description} onChange={e => setFormD({ ...formD, seo_description: e.target.value })}
                      placeholder="Description SEO..."
                      className="mt-1 w-full h-20 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-pink-300" />
                    <p className="text-xs text-gray-400 mt-1">{formD.seo_description.length}/160</p>
                  </div>
                  {(formD.seo_titre || formD.nom) && (
                    <div className="border border-gray-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Aperçu Google</p>
                      <p className="text-blue-600 text-sm font-medium">{formD.seo_titre || formD.nom}</p>
                      <p className="text-green-600 text-xs">votre-boutique.com/produits/{formD.nom.toLowerCase().replace(/\s/g, "-")}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{formD.seo_description || formD.description || "Aucune description SEO"}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Annuler</Button>
                <Button type="button" onClick={handleSubmitDigital} disabled={saving} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                  {saving ? "Sauvegarde..." : editingId ? "Modifier" : "Créer le produit"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            LISTE PRODUITS PHYSIQUES
        ════════════════════════════════════════ */}
        {onglet === "physique" && (
          loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : produitsPhysiques.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).length === 0 ? (
            <div className="text-center py-14 bg-white border border-gray-100 rounded-2xl">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun produit physique</p>
            </div>
          ) : (
            <div className="space-y-3">
              {produitsPhysiques.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).map(produit => {
                const isExpanded = expandedId === produit.id;
                const photo = produit.photos?.[0];
                const pctProduit = produit.prix_promo ? calcPct(produit.prix, produit.prix_promo) : 0;
                return (
                  <div key={produit.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4">
                      <div className="flex gap-3 items-start">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {photo ? <img src={photo} alt={produit.nom} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>}
                          {pctProduit > 0 && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black px-1 py-0.5 rounded-bl-lg">-{pctProduit}%</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 truncate">{produit.nom}</span>
                            {produit.vedette && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {produit.actif ? "Actif" : "Inactif"}
                            </span>
                          </div>
                          {produit.categorie && <p className="text-xs text-gray-400 mt-0.5">{produit.categorie}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            {produit.prix_promo ? (
                              <><span className="font-black text-pink-600 text-sm">{formatPrix(produit.prix_promo, boutique?.devise)}</span><span className="text-xs text-red-400 line-through font-bold">{formatPrix(produit.prix, boutique?.devise)}</span></>
                            ) : <span className="font-black text-pink-600 text-sm">{formatPrix(produit.prix, boutique?.devise)}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{produit.stock_illimite ? "Stock illimité" : `Stock : ${produit.stock}`}{produit.sku && ` • SKU: ${produit.sku}`}</p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => handleEditPhysique(produit)} className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setExpandedId(isExpanded ? null : produit.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(produit.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleField(produit.id, "actif", !produit.actif)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {produit.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} {produit.actif ? "Désactiver" : "Activer"}
                          </button>
                          <button onClick={() => toggleField(produit.id, "vedette", !produit.vedette)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${produit.vedette ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                            <Star className="w-4 h-4" /> {produit.vedette ? "Retirer vedette" : "Vedette"}
                          </button>
                        </div>
                        {produit.description && <p className="text-sm text-gray-500 line-clamp-3">{produit.description}</p>}
                        {produit.tags && produit.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {produit.tags.map((tag, i) => <span key={i} className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">#{tag}</span>)}
                          </div>
                        )}
                        {produit.photos && produit.photos.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto">
                            {produit.photos.map((url, i) => <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-100 flex-shrink-0" />)}
                          </div>
                        )}
                        {produit.variations && produit.variations.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">Variations</p>
                            {produit.variations.map((v, i) => (
                              <p key={i} className="text-sm"><span className="font-medium">{v.nom} : </span><span className="text-gray-500">{v.valeurs.join(", ")}</span></p>
                            ))}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Paiements</p>
                          <div className="flex gap-2 flex-wrap">
                            {produit.paiement_reception && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">À la réception</span>}
                            {produit.paiement_lien && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">Lien de paiement</span>}
                            {(produit.moyens_paiement || []).map((mp, i) => <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg">{mp.reseau}</span>)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ════════════════════════════════════════
            LISTE PRODUITS DIGITAUX
        ════════════════════════════════════════ */}
        {onglet === "numerique" && (
          loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : produitsDigitaux.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).length === 0 ? (
            <div className="text-center py-14 bg-white border border-gray-100 rounded-2xl">
              <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun produit digital</p>
            </div>
          ) : (
            <div className="space-y-3">
              {produitsDigitaux.filter(p => p.nom.toLowerCase().includes(searchQ.toLowerCase())).map(produit => {
                const isExpanded = expandedId === produit.id;
                const photo = produit.photos?.[0];
                const pctProd = produit.prix_promo ? calcPct(produit.prix, produit.prix_promo) : 0;
                const TypeIconP = TYPES_DIGITAL[(produit.type_digital as TypeDigital)]?.icon || FileText;
                const typeColor = TYPES_DIGITAL[(produit.type_digital as TypeDigital)]?.color || "";
                return (
                  <div key={produit.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4">
                      <div className="flex gap-3 items-start">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                          {photo ? <img src={photo} alt={produit.nom} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center border ${typeColor}`}><TypeIconP className="w-7 h-7" /></div>}
                          {pctProd > 0 && <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-black px-1 py-0.5 rounded-bl-lg">-{pctProd}%</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 truncate">{produit.nom}</span>
                            {produit.vedette && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${typeColor}`}>{TYPES_DIGITAL[(produit.type_digital as TypeDigital)]?.label || produit.type_digital}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>{produit.actif ? "Actif" : "Inactif"}</span>
                            <span className="text-xs text-gray-400">{MODES_TARIFICATION[(produit as any).mode_tarification as ModeTarification] || "Paiement unique"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {produit.prix_promo ? (
                              <><span className="font-black text-pink-600 text-sm">{formatPrix(produit.prix_promo, boutique?.devise)}</span><span className="text-xs text-red-400 line-through font-bold">{formatPrix(produit.prix, boutique?.devise)}</span></>
                            ) : <span className="font-black text-pink-600 text-sm">{formatPrix(produit.prix, boutique?.devise)}</span>}
                          </div>
                          {produit.categorie && <p className="text-xs text-gray-400 mt-0.5">{produit.categorie}</p>}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={() => handleEditDigital(produit)} className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setExpandedId(isExpanded ? null : produit.id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(produit.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleField(produit.id, "actif", !produit.actif)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${produit.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {produit.actif ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} {produit.actif ? "Désactiver" : "Activer"}
                          </button>
                          <button onClick={() => toggleField(produit.id, "vedette", !produit.vedette)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${produit.vedette ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                            <Star className="w-4 h-4" /> {produit.vedette ? "Retirer" : "Vedette"}
                          </button>
                        </div>
                        {produit.description && <p className="text-sm text-gray-500 line-clamp-3">{produit.description}</p>}
                        <div className="flex gap-2 flex-wrap">
                          {(produit as any).protection_antipiratage && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg flex items-center gap-1"><Lock className="w-3 h-3" /> Anti-piratage</span>}
                          {(produit as any).livraison_automatique && <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1"><Zap className="w-3 h-3" /> Livraison auto</span>}
                        </div>
                        {(produit as any).modules && (produit as any).modules.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">{(produit as any).modules.length} modules</p>
                            {(produit as any).modules.slice(0, 3).map((m: Module, i: number) => <p key={i} className="text-xs text-gray-600">{i + 1}. {m.titre}</p>)}
                          </div>
                        )}
                        {produit.tags && produit.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {produit.tags.map((tag, i) => <span key={i} className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">#{tag}</span>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </BoutiqueLayout>
  );
}
