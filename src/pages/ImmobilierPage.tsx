import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Home, Zap, Lock, Plus, X, Search,
  Heart, Phone, MessageCircle, Trash2, Edit2,
  Filter, Image, Copy, CheckCircle2, ExternalLink,
  Share2, User, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";

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

const TYPES = [
  { value: "maison" as TypeBien,      label: "Maison",      emoji: "🏠", bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  { value: "terrain" as TypeBien,     label: "Terrain",     emoji: "🌿", bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  { value: "appartement" as TypeBien, label: "Appart.",     emoji: "🏢", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  { value: "boutique" as TypeBien,    label: "Boutique",    emoji: "🏪", bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
];

const STATUTS = [
  { value: "disponible" as Statut, label: "Disponible", bg: "#22c55e" },
  { value: "vendu" as Statut,      label: "Vendu",      bg: "#ef4444" },
  { value: "loue" as Statut,       label: "Loué",       bg: "#eab308" },
];

function formatPrix(prix: number) {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ flexShrink: 0, padding: "2px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 700, border: "none", cursor: "pointer", background: copied ? "#22c55e" : "#ede9fe", color: copied ? "#fff" : "#6d28d9", whiteSpace: "nowrap" }}>
      {copied ? "✓ Copié" : "📋 Copier"}
    </button>
  );
}

function AnnonceCard({ annonce, userId, onFavori, onEdit, onDelete, isOwner }: {
  annonce: Annonce; userId: string;
  onFavori: (id: string) => void; onEdit: (a: Annonce) => void;
  onDelete: (id: string) => void; isOwner: boolean;
}) {
  const [showLinks, setShowLinks] = useState(false);
  const typeInfo   = TYPES.find(t => t.value === annonce.type) || TYPES[0];
  const statutInfo = STATUTS.find(s => s.value === annonce.statut) || STATUTS[0];
  const isFavori   = annonce.favoris?.includes(userId);
  const photo      = annonce.images?.[0];
  const annonceUrl = `${window.location.origin}/immobilier/annonce/${annonce.id}`;
  const vendeurUrl = `${window.location.origin}/immobilier/vendeur/${annonce.user_id}`;

  return (
    <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>

      {/* Image */}
      <div style={{ position: "relative", width: "100%", height: "130px", background: "#f1f5f9", overflow: "hidden", flexShrink: 0 }}>
        {photo
          ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "34px" }}>{typeInfo.emoji}</div>
        }
        <div style={{ position: "absolute", top: 6, left: 6, background: statutInfo.bg, color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px" }}>
          {statutInfo.label}
        </div>
        <button onClick={() => onFavori(annonce.id)}
          style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: "999px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: isFavori ? "#ef4444" : "rgba(255,255,255,0.85)" }}>
          <Heart style={{ width: 11, height: 11, color: isFavori ? "#fff" : "#6b7280", fill: isFavori ? "#fff" : "none" }} />
        </button>
      </div>

      {/* Contenu */}
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", flex: 1, gap: "4px" }}>

        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px", alignSelf: "flex-start", background: typeInfo.bg, color: typeInfo.color, border: `1px solid ${typeInfo.border}` }}>
          {typeInfo.emoji} {typeInfo.label}
        </span>

        <div style={{ fontWeight: 700, fontSize: "11px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {annonce.titre}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "#6b7280" }}>
          <MapPin style={{ width: 9, height: 9, flexShrink: 0 }} />
          <span style={{ fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {annonce.quartier ? `${annonce.quartier}, ` : ""}{annonce.ville}
          </span>
        </div>

        <div style={{ fontWeight: 900, fontSize: "13px", color: "#7c3aed" }}>
          {formatPrix(annonce.prix)}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
          <span style={{ fontSize: "8px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Par {annonce.auteur_nom}</span>
          <Link to={`/immobilier/vendeur/${annonce.user_id}`}
            style={{ fontSize: "8px", color: "#7c3aed", fontWeight: 700, whiteSpace: "nowrap", textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: "2px" }}>
            <User style={{ width: 8, height: 8 }} /> Boutique
          </Link>
        </div>

        {/* Liens collapsible */}
        <button onClick={() => setShowLinks(!showLinks)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 7px", borderRadius: "7px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "9px", fontWeight: 600, color: "#4b5563", cursor: "pointer" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <Share2 style={{ width: 9, height: 9, color: "#7c3aed" }} /> Liens
          </span>
          {showLinks ? <ChevronUp style={{ width: 9, height: 9 }} /> : <ChevronDown style={{ width: 9, height: 9 }} />}
        </button>

        {showLinks && (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#f5f3ff", borderRadius: "8px", padding: "5px 7px", border: "1px solid #ede9fe" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "8px", color: "#7c3aed", fontWeight: 700 }}>🔗 Annonce</div>
                <div style={{ fontSize: "8px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{annonceUrl.replace("https://", "").substring(0, 25)}...</div>
              </div>
              <CopyBtn text={annonceUrl} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", background: "#eff6ff", borderRadius: "8px", padding: "5px 7px", border: "1px solid #dbeafe" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "8px", color: "#2563eb", fontWeight: 700 }}>🏪 Boutique</div>
                <div style={{ fontSize: "8px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{vendeurUrl.replace("https://", "").substring(0, 25)}...</div>
              </div>
              <CopyBtn text={vendeurUrl} />
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ display: "flex", gap: "5px" }}>
          {annonce.whatsapp && (
            <a href={`https://wa.me/${annonce.whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, annonce: ${annonce.titre}`}
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", padding: "6px", borderRadius: "8px", background: "#25D366", color: "#fff", fontSize: "9px", fontWeight: 700, textDecoration: "none" }}>
              <MessageCircle style={{ width: 10, height: 10 }} /> WA
            </a>
          )}
          <a href={`tel:${annonce.contact}`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", padding: "6px", borderRadius: "8px", background: "#f1f5f9", color: "#374151", fontSize: "9px", fontWeight: 700, textDecoration: "none" }}>
            <Phone style={{ width: 10, height: 10 }} /> Appel
          </a>
        </div>

        {isOwner && (
          <div style={{ display: "flex", gap: "5px", paddingTop: "4px", borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => onEdit(annonce)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", padding: "5px", borderRadius: "7px", background: "#f5f3ff", color: "#6d28d9", fontSize: "9px", fontWeight: 700, border: "none", cursor: "pointer" }}>
              <Edit2 style={{ width: 9, height: 9 }} /> Modifier
            </button>
            <button onClick={() => onDelete(annonce.id)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", padding: "5px", borderRadius: "7px", background: "#fef2f2", color: "#ef4444", fontSize: "9px", fontWeight: 700, border: "none", cursor: "pointer" }}>
              <Trash2 style={{ width: 9, height: 9 }} /> Suppr.
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImmobilierPage() {
  const user = getNexoraUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<TypeBien | "">("");
  const [filterVille, setFilterVille] = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [filterStatut, setFilterStatut] = useState<Statut | "">("");

  const emptyForm = { titre: "", description: "", prix: "", type: "maison" as TypeBien, ville: "", quartier: "", contact: "", whatsapp: "", statut: "disponible" as Statut, images: [] as string[] };
  const [form, setForm] = useState(emptyForm);
  const monProfilUrl = `${window.location.origin}/immobilier/vendeur/${userId}`;

  const loadAnnonces = async () => {
    setLoading(true);
    const { data } = await supabase.from("nexora_annonces_immo" as any).select("*").order("created_at", { ascending: false });
    setAnnonces((data || []) as unknown as Annonce[]);
    setLoading(false);
  };
  useEffect(() => { loadAnnonces(); }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + form.images.length > 6) { toast({ title: "Maximum 6 photos", variant: "destructive" }); return; }
    setUploadingPhoto(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const path = `immobilier/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: u } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
        urls.push(u.publicUrl);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast({ title: `✅ ${urls.length} photo(s) ajoutée(s)` });
    } catch (err: any) { toast({ title: "Erreur upload", description: err.message, variant: "destructive" }); }
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.prix || !form.ville || !form.contact) { toast({ title: "Remplissez tous les champs obligatoires", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { user_id: userId, auteur_nom: user?.nom_prenom || "Utilisateur", titre: form.titre, description: form.description || null, prix: parseFloat(form.prix), type: form.type, ville: form.ville, quartier: form.quartier || null, contact: form.contact, whatsapp: form.whatsapp || null, statut: form.statut, images: form.images, favoris: [] };
    let error;
    if (editingId) { ({ error } = await supabase.from("nexora_annonces_immo" as any).update(payload).eq("id", editingId)); }
    else { ({ error } = await supabase.from("nexora_annonces_immo" as any).insert(payload)); }
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: `✅ Annonce ${editingId ? "modifiée" : "publiée"} !` }); setForm(emptyForm); setEditingId(null); setShowForm(false); loadAnnonces(); }
    setSaving(false);
  };

  const handleEdit = (a: Annonce) => { setForm({ titre: a.titre, description: a.description || "", prix: String(a.prix), type: a.type, ville: a.ville, quartier: a.quartier || "", contact: a.contact, whatsapp: a.whatsapp || "", statut: a.statut, images: a.images || [] }); setEditingId(a.id); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const handleDelete = async (id: string) => { if (!confirm("Supprimer ?")) return; await supabase.from("nexora_annonces_immo" as any).delete().eq("id", id); toast({ title: "Annonce supprimée" }); loadAnnonces(); };
  const handleFavori = async (id: string) => { const a = annonces.find(x => x.id === id); if (!a) return; const f = a.favoris || []; const nf = f.includes(userId) ? f.filter(x => x !== userId) : [...f, userId]; await supabase.from("nexora_annonces_immo" as any).update({ favoris: nf }).eq("id", id); setAnnonces(prev => prev.map(x => x.id === id ? { ...x, favoris: nf } : x)); };

  const filtered = annonces.filter(a => {
    const ms = !searchQ || a.titre.toLowerCase().includes(searchQ.toLowerCase()) || a.ville.toLowerCase().includes(searchQ.toLowerCase());
    const mt = !filterType || a.type === filterType;
    const mv = !filterVille || a.ville.toLowerCase().includes(filterVille.toLowerCase());
    const mp = !filterPrixMax || a.prix <= parseFloat(filterPrixMax);
    const mst = !filterStatut || a.statut === filterStatut;
    return ms && mt && mv && mp && mst;
  });

  const hasFilters = filterType || filterVille || filterPrixMax || filterStatut;
  const mesAnnonces = annonces.filter(a => a.user_id === userId);

  // Input style réutilisable
  const inputStyle: React.CSSProperties = { width: "100%", height: "32px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px", outline: "none", boxSizing: "border-box", background: "#fff" };

  return (
    <AppLayout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Conteneur principal soudé ── */}
      <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", gap: "8px" }}>

        {/* ══ HERO ══ */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "12px", padding: "10px 12px", flexShrink: 0, boxSizing: "border-box" }} className="bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full border-2 border-white" />
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <MapPin style={{ width: 15, height: 15, color: "#fbbf24", flexShrink: 0 }} />
                <span style={{ fontWeight: 900, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Marché Immobilier</span>
              </div>
              <p style={{ fontSize: "9px", opacity: 0.75, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                Maisons, terrains, appartements, boutiques — {annonces.length} annonce{annonces.length > 1 ? "s" : ""}
              </p>
            </div>
            {/* ✅ Bouton Publier JAUNE */}
            {hasPremium && (
              <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "4px", background: "#facc15", color: "#1c1917", fontWeight: 800, padding: "6px 12px", borderRadius: "9px", fontSize: "11px", border: "none", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(250,204,21,0.4)" }}>
                <Plus style={{ width: 12, height: 12 }} /> Publier
              </button>
            )}
          </div>
        </div>

        {/* ══ BANNIÈRE PROFIL (Premium) ══ */}
        {hasPremium && (
          <div style={{ background: "linear-gradient(to right, #eff6ff, #f5f3ff)", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "8px 10px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: 28, height: 28, background: "#dbeafe", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Share2 style={{ width: 12, height: 12, color: "#2563eb" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ fontWeight: 700, fontSize: "10px", color: "#1f2937" }}>🏪 Votre boutique</span>
                  <span style={{ fontSize: "8px", background: "#3b82f6", color: "#fff", padding: "1px 5px", borderRadius: "999px" }}>{mesAnnonces.length} annonce{mesAnnonces.length > 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px", background: "#fff", borderRadius: "7px", padding: "3px 7px", border: "1px solid #dbeafe" }}>
                  <span style={{ fontSize: "8px", color: "#7c3aed", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{monProfilUrl.replace("https://", "")}</span>
                  <button onClick={() => { navigator.clipboard.writeText(monProfilUrl); setCopiedProfil(true); setTimeout(() => setCopiedProfil(false), 2500); }}
                    style={{ flexShrink: 0, padding: "2px 7px", borderRadius: "5px", fontSize: "9px", fontWeight: 700, background: copiedProfil ? "#22c55e" : "#7c3aed", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                    {copiedProfil ? "✓ Copié" : "Copier"}
                  </button>
                </div>
              </div>
              <Link to={`/immobilier/vendeur/${userId}`}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "2px", padding: "5px 7px", borderRadius: "7px", background: "#7c3aed", color: "#fff", fontSize: "9px", fontWeight: 700, textDecoration: "none" }}>
                <ExternalLink style={{ width: 9, height: 9 }} /> Voir
              </Link>
            </div>
          </div>
        )}

        {/* ══ ACCÈS PREMIUM REQUIS ══ */}
        {!hasPremium && (
          <div style={{ background: "linear-gradient(135deg, #f5f3ff, #eef2ff)", border: "2px solid #c4b5fd", borderRadius: "10px", padding: "14px 12px", textAlign: "center", boxSizing: "border-box" }}>
            <div style={{ width: 36, height: 36, background: "#ede9fe", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px" }}>
              <Lock style={{ width: 18, height: 18, color: "#7c3aed" }} />
            </div>
            <div style={{ fontWeight: 900, fontSize: "12px", color: "#111827", marginBottom: "5px" }}>Publication réservée aux membres Premium</div>
            <p style={{ fontSize: "9px", color: "#6b7280", marginBottom: "9px", margin: "0 0 9px" }}>Activez le Premium pour publier. La consultation est gratuite.</p>
            <Link to="/abonnement" style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: "linear-gradient(to right, #7c3aed, #4f46e5)", color: "#fff", fontWeight: 700, padding: "7px 14px", borderRadius: "9px", fontSize: "10px", textDecoration: "none" }}>
              <Zap style={{ width: 11, height: 11 }} /> Premium — 10$/mois
            </Link>
          </div>
        )}

        {/* ══ FORMULAIRE ══ */}
        {showForm && hasPremium && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", boxSizing: "border-box" }}>
            <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", gap: "5px" }}>
                <Home style={{ width: 13, height: 13, color: "#7c3aed" }} />
                {editingId ? "Modifier l'annonce" : "Publier une annonce"}
              </span>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                style={{ width: 25, height: 25, borderRadius: "999px", background: "#e5e7eb", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 11, height: 11 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "9px" }}>

              {/* Type */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "5px" }}>Type de bien *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                  {TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                      style={{ padding: "7px 5px", borderRadius: "9px", fontSize: "10px", fontWeight: 600, border: form.type === t.value ? `2px solid #7c3aed` : "2px solid #e5e7eb", background: form.type === t.value ? "#f5f3ff" : "#fff", color: form.type === t.value ? "#7c3aed" : "#4b5563", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: "15px", marginBottom: "2px" }}>{t.emoji}</div>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Ex: Belle villa 4 chambres" style={inputStyle} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Décrivez votre bien..."
                  style={{ ...inputStyle, height: "70px", padding: "7px 10px", resize: "none" }} />
              </div>

              {/* Prix */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>Prix ($) *</label>
                <input type="number" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} placeholder="Ex: 25000" style={inputStyle} />
              </div>

              {/* Localisation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>Ville *</label>
                  <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} placeholder="Cotonou" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>Quartier</label>
                  <input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} placeholder="Cadjehoun" style={inputStyle} />
                </div>
              </div>

              {/* Contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>Téléphone *</label>
                  <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="+229..." style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "3px" }}>WhatsApp</label>
                  <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="+229..." style={inputStyle} />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "5px" }}>Statut</label>
                <div style={{ display: "flex", gap: "5px" }}>
                  {STATUTS.map(s => (
                    <button key={s.value} type="button" onClick={() => setForm({ ...form, statut: s.value })}
                      style={{ flex: 1, padding: "6px", borderRadius: "9px", fontSize: "9px", fontWeight: 700, cursor: "pointer", border: "2px solid transparent", background: form.statut === s.value ? s.bg : "#f9fafb", color: form.statut === s.value ? "#fff" : "#6b7280" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#374151", display: "block", marginBottom: "5px" }}>Photos ({form.images.length}/6)</label>
                {form.images.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "5px", marginBottom: "6px" }}>
                    {form.images.map((url, i) => (
                      <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "7px" }} />
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                          style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "999px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto || form.images.length >= 6}
                  style={{ width: "100%", padding: "9px", borderRadius: "9px", border: "2px dashed #d1d5db", background: "#fff", color: "#6b7280", fontSize: "10px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", cursor: "pointer", boxSizing: "border-box" }}>
                  <Image style={{ width: 12, height: 12 }} />
                  {uploadingPhoto ? "Upload..." : "Ajouter des photos"}
                </button>
              </div>

              {/* Boutons */}
              <div style={{ display: "flex", gap: "7px" }}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  style={{ flex: 1, padding: "9px", borderRadius: "9px", border: "1px solid #e5e7eb", background: "#fff", color: "#4b5563", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                  Annuler
                </button>
                {/* ✅ Bouton submit jaune */}
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: "9px", borderRadius: "9px", background: saving ? "#fde68a" : "#facc15", color: "#1c1917", fontSize: "10px", fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  {saving && <div style={{ width: 10, height: 10, border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #1c1917", borderRadius: "999px", animation: "spin 0.8s linear infinite" }} />}
                  {saving ? "Publication..." : editingId ? "✅ Modifier" : "✅ Publier"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══ RECHERCHE & FILTRES ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", boxSizing: "border-box" }}>

          <div style={{ display: "flex", gap: "5px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, color: "#9ca3af" }} />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher..."
                style={{ width: "100%", paddingLeft: "26px", paddingRight: "8px", height: "32px", borderRadius: "9px", border: "1px solid #e5e7eb", background: "#fff", fontSize: "10px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={() => setShowFiltres(!showFiltres)}
              style={{ display: "flex", alignItems: "center", gap: "3px", padding: "0 9px", height: "32px", borderRadius: "9px", fontSize: "10px", fontWeight: 700, flexShrink: 0, border: hasFilters ? "none" : "1px solid #e5e7eb", background: hasFilters ? "#7c3aed" : "#fff", color: hasFilters ? "#fff" : "#4b5563", cursor: "pointer" }}>
              <Filter style={{ width: 10, height: 10 }} /> Filtres
            </button>
          </div>

          {/* Types rapides */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "1px" }}>
            <button onClick={() => setFilterType("")}
              style={{ flexShrink: 0, padding: "3px 9px", borderRadius: "999px", fontSize: "9px", fontWeight: 700, cursor: "pointer", border: "none", background: !filterType ? "#7c3aed" : "#f1f5f9", color: !filterType ? "#fff" : "#4b5563" }}>
              🏘️ Tout ({annonces.length})
            </button>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setFilterType(filterType === t.value ? "" : t.value)}
                style={{ flexShrink: 0, padding: "3px 9px", borderRadius: "999px", fontSize: "9px", fontWeight: 700, cursor: "pointer", border: "none", background: filterType === t.value ? "#7c3aed" : "#f1f5f9", color: filterType === t.value ? "#fff" : "#4b5563" }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Filtres avancés */}
          {showFiltres && (
            <div style={{ background: "#fff", borderRadius: "9px", border: "1px solid #e5e7eb", padding: "9px 10px", display: "flex", flexDirection: "column", gap: "7px", boxSizing: "border-box" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                <div>
                  <label style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", display: "block", marginBottom: "2px" }}>Ville</label>
                  <input value={filterVille} onChange={e => setFilterVille(e.target.value)} placeholder="Cotonou" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", display: "block", marginBottom: "2px" }}>Prix max ($)</label>
                  <input type="number" value={filterPrixMax} onChange={e => setFilterPrixMax(e.target.value)} placeholder="50000" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", display: "block", marginBottom: "2px" }}>Statut</label>
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as Statut | "")}
                  style={{ ...inputStyle, padding: "0 8px" }}>
                  <option value="">Tous</option>
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => { setFilterType(""); setFilterVille(""); setFilterPrixMax(""); setFilterStatut(""); }}
                  style={{ padding: "6px", borderRadius: "7px", border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: "9px", fontWeight: 700, cursor: "pointer" }}>
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {/* ══ LISTE ANNONCES ══ */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <div style={{ height: "120px", background: "#e5e7eb" }} />
                <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ height: "9px", background: "#e5e7eb", borderRadius: "4px", width: "75%" }} />
                  <div style={{ height: "9px", background: "#e5e7eb", borderRadius: "4px", width: "50%" }} />
                  <div style={{ height: "11px", background: "#e5e7eb", borderRadius: "4px", width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 16px", background: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: "30px", marginBottom: "7px" }}>🏘️</div>
            <div style={{ fontWeight: 700, fontSize: "12px", color: "#374151" }}>{annonces.length === 0 ? "Aucune annonce publiée" : "Aucun résultat"}</div>
            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px" }}>{annonces.length === 0 ? hasPremium ? "Soyez le premier à publier !" : "Les annonces apparaîtront ici." : "Modifiez vos filtres."}</div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "9px", color: "#6b7280", fontWeight: 600, margin: 0 }}>
              {filtered.length} annonce{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {filtered.map(annonce => (
                <AnnonceCard key={annonce.id} annonce={annonce} userId={userId} onFavori={handleFavori} onEdit={handleEdit} onDelete={handleDelete} isOwner={annonce.user_id === userId} />
              ))}
            </div>
          </>
        )}

      </div>
    </AppLayout>
  );
}
