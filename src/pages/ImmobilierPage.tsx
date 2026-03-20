import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Home, Zap, Lock, Plus, X, Search,
  Heart, Phone, MessageCircle, Trash2, Edit2,
  Filter, Image, Copy, CheckCircle2, ExternalLink,
  Share2, User
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────
type TypeBien = "maison" | "terrain" | "appartement" | "boutique";
type Statut = "disponible" | "vendu" | "loue";

interface Annonce {
  id: string;
  user_id: string;
  auteur_nom: string;
  titre: string;
  description: string;
  prix: number;
  type: TypeBien;
  ville: string;
  quartier: string;
  images: string[];
  contact: string;
  whatsapp: string;
  statut: Statut;
  favoris: string[];
  created_at: string;
}

// ─── Constantes ───────────────────────────────────────────
const TYPES: { value: TypeBien; label: string; emoji: string; color: string }[] = [
  { value: "maison", label: "Maison", emoji: "🏠", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "terrain", label: "Terrain", emoji: "🌿", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "appartement", label: "Appartement", emoji: "🏢", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "boutique", label: "Boutique", emoji: "🏪", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const STATUTS: { value: Statut; label: string; color: string }[] = [
  { value: "disponible", label: "Disponible", color: "bg-green-500" },
  { value: "vendu", label: "Vendu", color: "bg-red-500" },
  { value: "loue", label: "Loué", color: "bg-yellow-500" },
];

function formatPrix(prix: number): string {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}

// ─── Composant CopyButton ─────────────────────────────────
function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
        copied ? "bg-green-500 text-white" : "bg-violet-100 text-violet-700 hover:bg-violet-200"
      }`}>
      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copié !" : label}
    </button>
  );
}

// ─── Composant Card Annonce ───────────────────────────────
function AnnonceCard({
  annonce,
  userId,
  onFavori,
  onEdit,
  onDelete,
  isOwner,
}: {
  annonce: Annonce;
  userId: string;
  onFavori: (id: string) => void;
  onEdit: (a: Annonce) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}) {
  const typeInfo = TYPES.find(t => t.value === annonce.type) || TYPES[0];
  const statutInfo = STATUTS.find(s => s.value === annonce.statut) || STATUTS[0];
  const isFavori = annonce.favoris?.includes(userId);
  const photo = annonce.images?.[0];

  // URLs
  const annonceUrl = `${window.location.origin}/immobilier/annonce/${annonce.id}`;
  const vendeurUrl = `${window.location.origin}/immobilier/vendeur/${annonce.user_id}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">

      {/* Image */}
      <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {photo ? (
          <img src={photo} alt={annonce.titre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{typeInfo.emoji}</span>
          </div>
        )}

        {/* Statut */}
        <div className={`absolute top-3 left-3 ${statutInfo.color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
          {statutInfo.label}
        </div>

        {/* Favori */}
        <button onClick={() => onFavori(annonce.id)}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
            isFavori ? "bg-red-500 text-white" : "bg-white/80 text-gray-600 hover:bg-white"
          }`}>
          <Heart className={`w-4 h-4 ${isFavori ? "fill-white" : ""}`} />
        </button>

        {/* Nb photos */}
        {annonce.images?.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            📷 {annonce.images.length}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${typeInfo.color}`}>
          {typeInfo.emoji} {typeInfo.label}
        </span>

        <h3 className="font-bold text-gray-900 mt-2 line-clamp-1 text-base">{annonce.titre}</h3>

        <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {annonce.quartier ? `${annonce.quartier}, ` : ""}{annonce.ville}
          </span>
        </div>

        {annonce.description && (
          <p className="text-gray-400 text-xs mt-1.5 line-clamp-2">{annonce.description}</p>
        )}

        <p className="text-violet-600 font-black text-lg mt-2">{formatPrix(annonce.prix)}</p>

        {/* Vendeur + lien profil */}
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">Par {annonce.auteur_nom}</p>
          <Link to={`/immobilier/vendeur/${annonce.user_id}`}
            className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1">
            <User className="w-3 h-3" /> Voir sa boutique
          </Link>
        </div>

        {/* ── Liens de partage ── */}
        <div className="mt-3 space-y-2">
          {/* Lien annonce */}
          <div className="flex items-center gap-2 bg-violet-50 rounded-xl p-2 border border-violet-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-violet-500 font-semibold mb-0.5">🔗 Lien de cette annonce</p>
              <p className="text-xs text-gray-500 font-mono truncate">{annonceUrl.replace("https://", "")}</p>
            </div>
            <CopyButton text={annonceUrl} label="Copier" />
          </div>

          {/* Lien profil vendeur */}
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-2 border border-blue-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-500 font-semibold mb-0.5">🏪 Boutique du vendeur</p>
              <p className="text-xs text-gray-500 font-mono truncate">{vendeurUrl.replace("https://", "")}</p>
            </div>
            <CopyButton text={vendeurUrl} label="Copier" />
          </div>
        </div>

        {/* Actions contact */}
        <div className="flex gap-2 mt-3">
          {annonce.whatsapp && (
            <a href={`https://wa.me/${annonce.whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, je suis intéressé par : ${annonce.titre} — ${annonceUrl}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
          <a href={`tel:${annonce.contact}`}
            className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-gray-200">
            <Phone className="w-3.5 h-3.5" /> Appeler
          </a>
        </div>

        {/* Actions propriétaire */}
        {isOwner && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            <button onClick={() => onEdit(annonce)}
              className="flex-1 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-violet-100">
              <Edit2 className="w-3 h-3" /> Modifier
            </button>
            <button onClick={() => onDelete(annonce.id)}
              className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-red-100">
              <Trash2 className="w-3 h-3" /> Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────
export default function ImmobilierPage() {
  const user = getNexoraUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const hasPremium = user?.plan === "premium" || user?.plan === "admin";
  const userId = user?.id || "guest";

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showFiltres, setShowFiltres] = useState(false);
  const [copiedProfil, setCopiedProfil] = useState(false);

  // Filtres
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<TypeBien | "">("");
  const [filterVille, setFilterVille] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [filterStatut, setFilterStatut] = useState<Statut | "">("");

  // Formulaire
  const emptyForm = {
    titre: "", description: "", prix: "",
    type: "maison" as TypeBien,
    ville: "", quartier: "",
    contact: "", whatsapp: "",
    statut: "disponible" as Statut,
    images: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  // URL profil vendeur de l'utilisateur connecté
  const monProfilUrl = `${window.location.origin}/immobilier/vendeur/${userId}`;

  // ── Charger annonces
  const loadAnnonces = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nexora_annonces_immo" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setAnnonces((data || []) as unknown as Annonce[]);
    setLoading(false);
  };

  useEffect(() => { loadAnnonces(); }, []);

  // ── Upload photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + form.images.length > 6) {
      toast({ title: "Maximum 6 photos", variant: "destructive" }); return;
    }
    setUploadingPhoto(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const path = `immobilier/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
          .from("mes-secrets-media")
          .upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from("mes-secrets-media").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast({ title: `✅ ${urls.length} photo(s) ajoutée(s)` });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  // ── Soumettre
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.prix || !form.ville || !form.contact) {
      toast({ title: "Remplissez tous les champs obligatoires", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      auteur_nom: user?.nom_prenom || "Utilisateur",
      titre: form.titre,
      description: form.description || null,
      prix: parseFloat(form.prix),
      type: form.type,
      ville: form.ville,
      quartier: form.quartier || null,
      contact: form.contact,
      whatsapp: form.whatsapp || null,
      statut: form.statut,
      images: form.images,
      favoris: [],
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("nexora_annonces_immo" as any).update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("nexora_annonces_immo" as any).insert(payload));
    }
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `✅ Annonce ${editingId ? "modifiée" : "publiée"} !` });
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadAnnonces();
    }
    setSaving(false);
  };

  // ── Modifier
  const handleEdit = (a: Annonce) => {
    setForm({
      titre: a.titre, description: a.description || "",
      prix: String(a.prix), type: a.type,
      ville: a.ville, quartier: a.quartier || "",
      contact: a.contact, whatsapp: a.whatsapp || "",
      statut: a.statut, images: a.images || [],
    });
    setEditingId(a.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await supabase.from("nexora_annonces_immo" as any).delete().eq("id", id);
    toast({ title: "Annonce supprimée" });
    loadAnnonces();
  };

  // ── Favori
  const handleFavori = async (id: string) => {
    const annonce = annonces.find(a => a.id === id);
    if (!annonce) return;
    const favoris = annonce.favoris || [];
    const newFavoris = favoris.includes(userId)
      ? favoris.filter(f => f !== userId)
      : [...favoris, userId];
    await supabase.from("nexora_annonces_immo" as any).update({ favoris: newFavoris }).eq("id", id);
    setAnnonces(prev => prev.map(a => a.id === id ? { ...a, favoris: newFavoris } : a));
  };

  // ── Copier lien profil
  const handleCopyProfil = () => {
    navigator.clipboard.writeText(monProfilUrl);
    setCopiedProfil(true);
    setTimeout(() => setCopiedProfil(false), 2500);
  };

  // ── Filtrer
  const filtered = annonces.filter(a => {
    const matchSearch = !searchQ ||
      a.titre.toLowerCase().includes(searchQ.toLowerCase()) ||
      a.ville.toLowerCase().includes(searchQ.toLowerCase()) ||
      a.auteur_nom.toLowerCase().includes(searchQ.toLowerCase());
    const matchType = !filterType || a.type === filterType;
    const matchVille = !filterVille || a.ville.toLowerCase().includes(filterVille.toLowerCase());
    const matchPrix = !filterPrixMax || a.prix <= parseFloat(filterPrixMax);
    const matchStatut = !filterStatut || a.statut === filterStatut;
    return matchSearch && matchType && matchVille && matchPrix && matchStatut;
  });

  const hasFilters = filterType || filterVille || filterPrixMax || filterStatut;
  const mesAnnonces = annonces.filter(a => a.user_id === userId);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-5 animate-fade-in-up pb-10">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-brand-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full border-2 border-white" />
            <div className="absolute -bottom-6 right-20 w-32 h-32 rounded-full border-2 border-white" />
          </div>
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-8 h-8 text-yellow-400" />
                <h1 className="font-display text-2xl font-black">Marché Immobilier</h1>
              </div>
              <p className="text-primary-foreground/80 text-sm">
                Publiez et découvrez des biens — maisons, terrains, appartements, boutiques.
              </p>
              <p className="text-primary-foreground/60 text-xs mt-1">
                {annonces.length} annonce{annonces.length > 1 ? "s" : ""} disponible{annonces.length > 1 ? "s" : ""}
              </p>
            </div>
            {hasPremium && (
              <button
                onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
                className="flex-shrink-0 flex items-center gap-2 bg-white text-primary font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm">
                <Plus className="w-4 h-4" />
                Publier
              </button>
            )}
          </div>
        </div>

        {/* ── Bannière lien profil vendeur (si premium) ── */}
        {hasPremium && (
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  🏪 Votre boutique immobilière
                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-normal">
                    {mesAnnonces.length} annonce{mesAnnonces.length > 1 ? "s" : ""}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Partagez ce lien pour que les gens voient toutes vos annonces
                </p>
                <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded-xl border border-blue-100">
                  <p className="text-xs text-violet-600 font-mono truncate flex-1">{monProfilUrl}</p>
                  <button onClick={handleCopyProfil}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      copiedProfil ? "bg-green-500 text-white" : "bg-violet-600 text-white hover:bg-violet-700"
                    }`}>
                    {copiedProfil ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedProfil ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>
              <Link to={`/immobilier/vendeur/${userId}`}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Voir
              </Link>
            </div>
          </div>
        )}

        {/* ── Accès Premium requis ── */}
        {!hasPremium && (
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-violet-600" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Publication réservée aux membres Premium</h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Activez le Premium pour publier vos annonces et obtenir votre lien de boutique personnel.
              La consultation est gratuite pour tous.
            </p>
            <Link to="/abonnement"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 shadow-md">
              <Zap className="w-4 h-4" /> Passer au Premium — 10$/mois
            </Link>
          </div>
        )}

        {/* ════════════════════════════
            FORMULAIRE PUBLICATION
        ════════════════════════════ */}
        {showForm && hasPremium && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h2 className="font-black text-gray-800 flex items-center gap-2">
                <Home className="w-5 h-5 text-violet-600" />
                {editingId ? "Modifier l'annonce" : "Publier une annonce"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Type */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Type de bien *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.type === t.value
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-600 hover:border-violet-200"
                      }`}>
                      <div className="text-xl mb-1">{t.emoji}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Titre *</label>
                <Input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Belle villa 4 chambres avec jardin" />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Description</label>
                <textarea value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre bien en détail..."
                  className="w-full h-28 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-violet-400" />
              </div>

              {/* Prix */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Prix ($) *</label>
                <Input type="number" value={form.prix}
                  onChange={e => setForm({ ...form, prix: e.target.value })}
                  placeholder="Ex: 25000" />
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Ville *</label>
                  <Input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}
                    placeholder="Ex: Cotonou" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Quartier</label>
                  <Input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })}
                    placeholder="Ex: Cadjehoun" />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Téléphone *</label>
                  <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                    placeholder="+229..." />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">WhatsApp</label>
                  <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+229..." />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Statut</label>
                <div className="flex gap-2">
                  {STATUTS.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setForm({ ...form, statut: s.value })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.statut === s.value
                          ? `border-transparent text-white ${s.color}`
                          : "border-gray-200 text-gray-500 bg-white"
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Photos ({form.images.length}/6)
                </label>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {form.images.map((url, i) => (
                      <div key={i} className="relative aspect-square">
                        <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                        <button type="button"
                          onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow text-xs">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handlePhotoUpload} />
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || form.images.length >= 6}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:border-violet-400 hover:text-violet-600 transition-colors disabled:opacity-50">
                  <Image className="w-4 h-4" />
                  {uploadingPhoto ? "Upload en cours..." : "Ajouter des photos"}
                </button>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-md">
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? "Publication..." : editingId ? "✅ Modifier" : "✅ Publier l'annonce"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════════════
            RECHERCHE & FILTRES
        ════════════════════════════ */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Rechercher une annonce, ville, vendeur..."
                className="w-full pl-9 pr-4 h-10 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-violet-400 transition-colors" />
            </div>
            <button onClick={() => setShowFiltres(!showFiltres)}
              className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                hasFilters
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
              }`}>
              <Filter className="w-4 h-4" />
              Filtres {hasFilters && <span className="w-2 h-2 rounded-full bg-white" />}
            </button>
          </div>

          {/* Types rapides */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilterType("")}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !filterType ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200"
              }`}>
              🏘️ Tout ({annonces.length})
            </button>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setFilterType(filterType === t.value ? "" : t.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterType === t.value ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200"
                }`}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Filtres avancés */}
          {showFiltres && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
                <Input value={filterVille} onChange={e => setFilterVille(e.target.value)}
                  placeholder="Ex: Cotonou" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix maximum ($)</label>
                <Input type="number" value={filterPrixMax} onChange={e => setFilterPrixMax(e.target.value)}
                  placeholder="Ex: 50000" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Statut</label>
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as Statut | "")}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white">
                  <option value="">Tous</option>
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setFilterType(""); setFilterVille(""); setFilterPrixMax(""); setFilterStatut(""); }}
                  className="sm:col-span-3 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50">
                  ✕ Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════
            LISTE ANNONCES
        ════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">🏘️</p>
            <p className="font-bold text-gray-700 text-lg">
              {annonces.length === 0 ? "Aucune annonce publiée" : "Aucun résultat"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {annonces.length === 0
                ? hasPremium ? "Soyez le premier à publier une annonce !" : "Les annonces apparaîtront ici."
                : "Essayez de modifier vos filtres."
              }
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 font-medium">
              {filtered.length} annonce{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(annonce => (
                <AnnonceCard
                  key={annonce.id}
                  annonce={annonce}
                  userId={userId}
                  onFavori={handleFavori}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isOwner={annonce.user_id === userId}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </AppLayout>
  );
}
