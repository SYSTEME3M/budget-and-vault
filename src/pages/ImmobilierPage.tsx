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
import { Input } from "@/components/ui/input";

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

const TYPES: { value: TypeBien; label: string; emoji: string; color: string }[] = [
  { value: "maison",      label: "Maison",      emoji: "🏠", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "terrain",     label: "Terrain",     emoji: "🌿", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "appartement", label: "Appartement", emoji: "🏢", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "boutique",    label: "Boutique",    emoji: "🏪", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const STATUTS: { value: Statut; label: string; color: string; dot: string }[] = [
  { value: "disponible", label: "Disponible", color: "bg-green-500",  dot: "bg-green-500" },
  { value: "vendu",      label: "Vendu",      color: "bg-red-500",    dot: "bg-red-500" },
  { value: "loue",       label: "Loué",       color: "bg-yellow-500", dot: "bg-yellow-500" },
];

function formatPrix(prix: number): string {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        display: "flex", alignItems: "center", gap: "3px",
        padding: "3px 7px", borderRadius: "8px",
        fontSize: "10px", fontWeight: 600,
        flexShrink: 0, whiteSpace: "nowrap",
        background: copied ? "#22c55e" : "#ede9fe",
        color: copied ? "#fff" : "#6d28d9",
        border: "none", cursor: "pointer",
      }}>
      {copied
        ? <CheckCircle2 style={{ width: 10, height: 10 }} />
        : <Copy style={{ width: 10, height: 10 }} />
      }
      {copied ? "✓" : "📋"}
    </button>
  );
}

function AnnonceCard({
  annonce, userId, onFavori, onEdit, onDelete, isOwner,
}: {
  annonce: Annonce;
  userId: string;
  onFavori: (id: string) => void;
  onEdit: (a: Annonce) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}) {
  const [showLinks, setShowLinks] = useState(false);
  const typeInfo   = TYPES.find(t => t.value === annonce.type)   || TYPES[0];
  const statutInfo = STATUTS.find(s => s.value === annonce.statut) || STATUTS[0];
  const isFavori   = annonce.favoris?.includes(userId);
  const photo      = annonce.images?.[0];

  const annonceUrl = `${window.location.origin}/immobilier/annonce/${annonce.id}`;
  const vendeurUrl = `${window.location.origin}/immobilier/vendeur/${annonce.user_id}`;

  return (
    <div style={{
      background: "#fff", borderRadius: "16px",
      overflow: "hidden", border: "1px solid #f1f5f9",
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      display: "flex", flexDirection: "column",
      width: "100%", boxSizing: "border-box",
    }}>

      {/* Image */}
      <div style={{ position: "relative", width: "100%", height: "160px", flexShrink: 0, background: "#f1f5f9", overflow: "hidden" }}>
        {photo
          ? <img src={photo} alt={annonce.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>{typeInfo.emoji}</div>
        }
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: statutInfo.color.replace("bg-", "").includes("green") ? "#22c55e" : statutInfo.color.includes("red") ? "#ef4444" : "#eab308",
          color: "#fff", fontSize: "10px", fontWeight: 700,
          padding: "2px 8px", borderRadius: "999px",
        }}>
          {statutInfo.label}
        </div>
        <button
          onClick={() => onFavori(annonce.id)}
          style={{
            position: "absolute", top: 8, right: 8,
            width: 30, height: 30, borderRadius: "999px",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isFavori ? "#ef4444" : "rgba(255,255,255,0.85)",
            color: isFavori ? "#fff" : "#4b5563",
          }}>
          <Heart style={{ width: 13, height: 13, fill: isFavori ? "#fff" : "none" }} />
        </button>
        {annonce.images?.length > 1 && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,0.5)", color: "#fff",
            fontSize: "9px", padding: "2px 6px", borderRadius: "999px",
          }}>
            📷 {annonce.images.length}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Badge type */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "3px",
          fontSize: "10px", fontWeight: 600,
          padding: "2px 8px", borderRadius: "999px",
          border: "1px solid",
          alignSelf: "flex-start",
        }} className={typeInfo.color}>
          {typeInfo.emoji} {typeInfo.label}
        </span>

        {/* Titre */}
        <div style={{
          fontWeight: 700, fontSize: "12px", marginTop: "6px",
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          lineHeight: 1.3, color: "#111827",
        }}>
          {annonce.titre}
        </div>

        {/* Localisation */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "4px", color: "#6b7280" }}>
          <MapPin style={{ width: 10, height: 10, flexShrink: 0 }} />
          <span style={{ fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {annonce.quartier ? `${annonce.quartier}, ` : ""}{annonce.ville}
          </span>
        </div>

        {/* Prix */}
        <div style={{ fontWeight: 900, fontSize: "14px", color: "#7c3aed", marginTop: "6px" }}>
          {formatPrix(annonce.prix)}
        </div>

        {/* Vendeur */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", gap: "6px" }}>
          <span style={{ fontSize: "9px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Par {annonce.auteur_nom}
          </span>
          <Link to={`/immobilier/vendeur/${annonce.user_id}`}
            style={{ fontSize: "9px", color: "#7c3aed", fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none", flexShrink: 0 }}>
            <User style={{ width: 9, height: 9, display: "inline", marginRight: 2 }} />
            Boutique
          </Link>
        </div>

        {/* Liens partage collapsible */}
        <div style={{ marginTop: "6px" }}>
          <button
            onClick={() => setShowLinks(!showLinks)}
            style={{
              width: "100%", display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "5px 8px",
              borderRadius: "8px", background: "#f8fafc",
              border: "1px solid #e2e8f0", fontSize: "10px",
              fontWeight: 600, color: "#4b5563", cursor: "pointer",
            }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Share2 style={{ width: 10, height: 10, color: "#7c3aed" }} />
              Liens
            </span>
            {showLinks
              ? <ChevronUp style={{ width: 10, height: 10 }} />
              : <ChevronDown style={{ width: 10, height: 10 }} />
            }
          </button>

          {showLinks && (
            <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f5f3ff", borderRadius: "10px", padding: "6px 8px", border: "1px solid #ede9fe" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "9px", color: "#7c3aed", fontWeight: 600 }}>🔗 Cette annonce</div>
                  <div style={{ fontSize: "9px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {annonceUrl.replace("https://", "").substring(0, 28)}...
                  </div>
                </div>
                <CopyButton text={annonceUrl} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#eff6ff", borderRadius: "10px", padding: "6px 8px", border: "1px solid #dbeafe" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "9px", color: "#2563eb", fontWeight: 600 }}>🏪 Boutique vendeur</div>
                  <div style={{ fontSize: "9px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                    {vendeurUrl.replace("https://", "").substring(0, 28)}...
                  </div>
                </div>
                <CopyButton text={vendeurUrl} />
              </div>
            </div>
          )}
        </div>

        {/* Actions contact */}
        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
          {annonce.whatsapp && (
            <a href={`https://wa.me/${annonce.whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, je suis intéressé par : ${annonce.titre}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: "4px", padding: "7px 6px", borderRadius: "10px",
                background: "#25D366", color: "#fff", fontSize: "10px",
                fontWeight: 700, textDecoration: "none",
              }}>
              <MessageCircle style={{ width: 11, height: 11 }} /> WA
            </a>
          )}
          <a href={`tel:${annonce.contact}`}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: "4px", padding: "7px 6px", borderRadius: "10px",
              background: "#f1f5f9", color: "#374151", fontSize: "10px",
              fontWeight: 700, textDecoration: "none",
            }}>
            <Phone style={{ width: 11, height: 11 }} /> Appel
          </a>
        </div>

        {/* Actions propriétaire */}
        {isOwner && (
          <div style={{ display: "flex", gap: "6px", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #f1f5f9" }}>
            <button onClick={() => onEdit(annonce)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: "3px", padding: "6px", borderRadius: "8px",
                background: "#f5f3ff", color: "#6d28d9",
                fontSize: "10px", fontWeight: 600, border: "none", cursor: "pointer",
              }}>
              <Edit2 style={{ width: 10, height: 10 }} /> Modifier
            </button>
            <button onClick={() => onDelete(annonce.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: "3px", padding: "6px", borderRadius: "8px",
                background: "#fef2f2", color: "#ef4444",
                fontSize: "10px", fontWeight: 600, border: "none", cursor: "pointer",
              }}>
              <Trash2 style={{ width: 10, height: 10 }} /> Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImmobilierPage() {
  const user       = getNexoraUser();
  const { toast }  = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPremium = user?.plan === "premium" || user?.plan === "admin";
  const userId     = user?.id || "guest";

  const [annonces,       setAnnonces]       = useState<Annonce[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showFiltres,    setShowFiltres]    = useState(false);
  const [copiedProfil,   setCopiedProfil]   = useState(false);

  const [searchQ,       setSearchQ]       = useState("");
  const [filterType,    setFilterType]    = useState<TypeBien | "">("");
  const [filterVille,   setFilterVille]   = useState("");
  const [filterPrixMax, setFilterPrixMax] = useState("");
  const [filterStatut,  setFilterStatut]  = useState<Statut | "">("");

  const emptyForm = {
    titre: "", description: "", prix: "",
    type: "maison" as TypeBien,
    ville: "", quartier: "",
    contact: "", whatsapp: "",
    statut: "disponible" as Statut,
    images: [] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  const monProfilUrl = `${window.location.origin}/immobilier/vendeur/${userId}`;

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
        const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file, { upsert: true });
        if (error) throw error;
        const { data: u } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
        urls.push(u.publicUrl);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast({ title: `✅ ${urls.length} photo(s) ajoutée(s)` });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.prix || !form.ville || !form.contact) {
      toast({ title: "Remplissez tous les champs obligatoires", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      user_id: userId,
      auteur_nom: user?.nom_prenom || "Utilisateur",
      titre: form.titre, description: form.description || null,
      prix: parseFloat(form.prix), type: form.type,
      ville: form.ville, quartier: form.quartier || null,
      contact: form.contact, whatsapp: form.whatsapp || null,
      statut: form.statut, images: form.images, favoris: [],
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
      setForm(emptyForm); setEditingId(null); setShowForm(false);
      loadAnnonces();
    }
    setSaving(false);
  };

  const handleEdit = (a: Annonce) => {
    setForm({
      titre: a.titre, description: a.description || "",
      prix: String(a.prix), type: a.type, ville: a.ville,
      quartier: a.quartier || "", contact: a.contact,
      whatsapp: a.whatsapp || "", statut: a.statut, images: a.images || [],
    });
    setEditingId(a.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await supabase.from("nexora_annonces_immo" as any).delete().eq("id", id);
    toast({ title: "Annonce supprimée" });
    loadAnnonces();
  };

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

  const filtered = annonces.filter(a => {
    const matchSearch  = !searchQ     || a.titre.toLowerCase().includes(searchQ.toLowerCase()) || a.ville.toLowerCase().includes(searchQ.toLowerCase()) || a.auteur_nom.toLowerCase().includes(searchQ.toLowerCase());
    const matchType    = !filterType  || a.type === filterType;
    const matchVille   = !filterVille || a.ville.toLowerCase().includes(filterVille.toLowerCase());
    const matchPrix    = !filterPrixMax || a.prix <= parseFloat(filterPrixMax);
    const matchStatut  = !filterStatut || a.statut === filterStatut;
    return matchSearch && matchType && matchVille && matchPrix && matchStatut;
  });

  const hasFilters  = filterType || filterVille || filterPrixMax || filterStatut;
  const mesAnnonces = annonces.filter(a => a.user_id === userId);

  return (
    <AppLayout>
      {/* Conteneur principal — soudé, rien ne dépasse */}
      <div style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}>

        {/* ── Hero ── */}
        <div style={{
          position: "relative", overflow: "hidden",
          borderRadius: "14px", padding: "12px 14px",
          flexShrink: 0, boxSizing: "border-box",
        }} className="bg-primary text-primary-foreground shadow-brand-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-2 border-white" />
            <div className="absolute -bottom-4 right-12 w-20 h-20 rounded-full border-2 border-white" />
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <MapPin style={{ width: 18, height: 18, color: "#fbbf24", flexShrink: 0 }} />
                <span style={{ fontWeight: 900, fontSize: "15px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Marché Immobilier
                </span>
              </div>
              <p style={{ fontSize: "10px", opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Publiez et découvrez des biens — maisons, terrains, appartements, boutiques.
              </p>
              <p style={{ fontSize: "9px", opacity: 0.6, marginTop: "2px" }}>
                {annonces.length} annonce{annonces.length > 1 ? "s" : ""}
              </p>
            </div>
            {hasPremium && (
              <button
                onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: "5px",
                  background: "#fff", color: "var(--primary)",
                  fontWeight: 700, padding: "7px 12px",
                  borderRadius: "10px", fontSize: "11px",
                  border: "none", cursor: "pointer", whiteSpace: "nowrap",
                }}>
                <Plus style={{ width: 13, height: 13 }} /> Publier
              </button>
            )}
          </div>
        </div>

        {/* ── Bannière lien profil (Premium) ── */}
        {hasPremium && (
          <div style={{
            background: "linear-gradient(to right, #eff6ff, #f5f3ff)",
            border: "1px solid #bfdbfe", borderRadius: "12px",
            padding: "10px 12px", boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 32, height: 32, background: "#dbeafe", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Share2 style={{ width: 14, height: 14, color: "#2563eb" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "11px", color: "#1f2937" }}>🏪 Votre boutique</span>
                  <span style={{ fontSize: "9px", background: "#3b82f6", color: "#fff", padding: "1px 6px", borderRadius: "999px" }}>
                    {mesAnnonces.length} annonce{mesAnnonces.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px", background: "#fff", borderRadius: "8px", padding: "4px 8px", border: "1px solid #dbeafe" }}>
                  <span style={{ fontSize: "9px", color: "#7c3aed", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {monProfilUrl.replace("https://", "")}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(monProfilUrl); setCopiedProfil(true); setTimeout(() => setCopiedProfil(false), 2500); }}
                    style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: "3px",
                      padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700,
                      background: copiedProfil ? "#22c55e" : "#7c3aed", color: "#fff",
                      border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    }}>
                    {copiedProfil ? <CheckCircle2 style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
                    {copiedProfil ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>
              <Link to={`/immobilier/vendeur/${userId}`}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: "3px",
                  padding: "6px 8px", borderRadius: "8px",
                  background: "#7c3aed", color: "#fff",
                  fontSize: "10px", fontWeight: 700, textDecoration: "none",
                }}>
                <ExternalLink style={{ width: 11, height: 11 }} /> Voir
              </Link>
            </div>
          </div>
        )}

        {/* ── Accès Premium requis ── */}
        {!hasPremium && (
          <div style={{
            background: "linear-gradient(135deg, #f5f3ff, #eef2ff)",
            border: "2px solid #c4b5fd", borderRadius: "12px",
            padding: "16px 14px", textAlign: "center",
            boxSizing: "border-box",
          }}>
            <div style={{ width: 40, height: 40, background: "#ede9fe", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
              <Lock style={{ width: 20, height: 20, color: "#7c3aed" }} />
            </div>
            <div style={{ fontWeight: 900, fontSize: "13px", color: "#111827", marginBottom: "6px" }}>
              Publication réservée aux membres Premium
            </div>
            <p style={{ fontSize: "10px", color: "#6b7280", marginBottom: "10px" }}>
              Activez le Premium pour publier vos annonces. La consultation est gratuite.
            </p>
            <Link to="/abonnement"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "linear-gradient(to right, #7c3aed, #4f46e5)",
                color: "#fff", fontWeight: 700,
                padding: "8px 16px", borderRadius: "10px",
                fontSize: "11px", textDecoration: "none",
              }}>
              <Zap style={{ width: 12, height: 12 }} /> Passer au Premium — 10$/mois
            </Link>
          </div>
        )}

        {/* ── Formulaire publication ── */}
        {showForm && hasPremium && (
          <div style={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: "14px", overflow: "hidden",
            boxSizing: "border-box",
          }}>
            <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 900, fontSize: "13px", color: "#111827", display: "flex", alignItems: "center", gap: "6px" }}>
                <Home style={{ width: 14, height: 14, color: "#7c3aed" }} />
                {editingId ? "Modifier l'annonce" : "Publier une annonce"}
              </span>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                style={{ width: 28, height: 28, borderRadius: "999px", background: "#e5e7eb", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* Type */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Type de bien *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      style={{
                        padding: "8px 6px", borderRadius: "10px",
                        fontSize: "11px", fontWeight: 500,
                        border: form.type === t.value ? "2px solid #7c3aed" : "2px solid #e5e7eb",
                        background: form.type === t.value ? "#f5f3ff" : "#fff",
                        color: form.type === t.value ? "#7c3aed" : "#4b5563",
                        cursor: "pointer", textAlign: "center",
                      }}>
                      <div style={{ fontSize: "16px", marginBottom: "2px" }}>{t.emoji}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titre */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Titre *</label>
                <Input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
                  placeholder="Ex: Belle villa 4 chambres" style={{ fontSize: "12px", height: "36px" }} />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre bien..."
                  style={{ width: "100%", height: "80px", padding: "8px 10px", borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px", resize: "none", outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Prix */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Prix ($) *</label>
                <Input type="number" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })}
                  placeholder="Ex: 25000" style={{ fontSize: "12px", height: "36px" }} />
              </div>

              {/* Localisation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Ville *</label>
                  <Input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}
                    placeholder="Cotonou" style={{ fontSize: "12px", height: "36px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Quartier</label>
                  <Input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })}
                    placeholder="Cadjehoun" style={{ fontSize: "12px", height: "36px" }} />
                </div>
              </div>

              {/* Contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>Téléphone *</label>
                  <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                    placeholder="+229..." style={{ fontSize: "12px", height: "36px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>WhatsApp</label>
                  <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="+229..." style={{ fontSize: "12px", height: "36px" }} />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Statut</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  {STATUTS.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setForm({ ...form, statut: s.value })}
                      style={{
                        flex: 1, padding: "7px", borderRadius: "10px",
                        fontSize: "10px", fontWeight: 600, cursor: "pointer",
                        border: form.statut === s.value ? "2px solid transparent" : "2px solid #e5e7eb",
                        background: form.statut === s.value
                          ? s.value === "disponible" ? "#22c55e" : s.value === "vendu" ? "#ef4444" : "#eab308"
                          : "#fff",
                        color: form.statut === s.value ? "#fff" : "#6b7280",
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
                  Photos ({form.images.length}/6)
                </label>
                {form.images.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                    {form.images.map((url, i) => (
                      <div key={i} style={{ position: "relative", aspectRatio: "1" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                        {i === 0 && <span style={{ position: "absolute", bottom: 3, left: 3, background: "#7c3aed", color: "#fff", fontSize: "8px", padding: "1px 4px", borderRadius: "999px" }}>⭐</span>}
                        <button type="button"
                          onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                          style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "999px", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto || form.images.length >= 6}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "10px",
                    border: "2px dashed #d1d5db", background: "#fff",
                    color: "#6b7280", fontSize: "11px", fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    cursor: "pointer", boxSizing: "border-box",
                  }}>
                  <Image style={{ width: 14, height: 14 }} />
                  {uploadingPhoto ? "Upload en cours..." : "Ajouter des photos"}
                </button>
              </div>

              {/* Boutons submit */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                <button type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px",
                    border: "1px solid #e5e7eb", background: "#fff",
                    color: "#4b5563", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  }}>
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px",
                    background: "linear-gradient(to right, #7c3aed, #4f46e5)",
                    color: "#fff", fontSize: "11px", fontWeight: 700,
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    opacity: saving ? 0.6 : 1,
                  }}>
                  {saving && <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "999px", animation: "spin 0.8s linear infinite" }} />}
                  {saving ? "Publication..." : editingId ? "✅ Modifier" : "✅ Publier"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Recherche & Filtres ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", boxSizing: "border-box" }}>

          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, color: "#9ca3af" }} />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Rechercher..."
                style={{
                  width: "100%", paddingLeft: "28px", paddingRight: "10px",
                  height: "34px", borderRadius: "10px",
                  border: "1px solid #e5e7eb", background: "#fff",
                  fontSize: "11px", outline: "none", boxSizing: "border-box",
                }} />
            </div>
            <button onClick={() => setShowFiltres(!showFiltres)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "0 10px", height: "34px", borderRadius: "10px",
                fontSize: "11px", fontWeight: 600, flexShrink: 0,
                border: hasFilters ? "none" : "1px solid #e5e7eb",
                background: hasFilters ? "#7c3aed" : "#fff",
                color: hasFilters ? "#fff" : "#4b5563",
                cursor: "pointer",
              }}>
              <Filter style={{ width: 12, height: 12 }} />
              Filtres
              {hasFilters && <span style={{ width: 6, height: 6, borderRadius: "999px", background: "#fff", display: "inline-block" }} />}
            </button>
          </div>

          {/* Types rapides */}
          <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "2px" }}>
            <button onClick={() => setFilterType("")}
              style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: "999px",
                fontSize: "10px", fontWeight: 600, cursor: "pointer",
                border: !filterType ? "none" : "1px solid #e5e7eb",
                background: !filterType ? "#7c3aed" : "#fff",
                color: !filterType ? "#fff" : "#4b5563",
              }}>
              🏘️ Tout ({annonces.length})
            </button>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setFilterType(filterType === t.value ? "" : t.value)}
                style={{
                  flexShrink: 0, padding: "4px 10px", borderRadius: "999px",
                  fontSize: "10px", fontWeight: 600, cursor: "pointer",
                  border: filterType === t.value ? "none" : "1px solid #e5e7eb",
                  background: filterType === t.value ? "#7c3aed" : "#fff",
                  color: filterType === t.value ? "#fff" : "#4b5563",
                }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {/* Filtres avancés */}
          {showFiltres && (
            <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "8px", boxSizing: "border-box" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "3px" }}>Ville</label>
                  <Input value={filterVille} onChange={e => setFilterVille(e.target.value)}
                    placeholder="Cotonou" style={{ height: "32px", fontSize: "11px" }} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "3px" }}>Prix max ($)</label>
                  <Input type="number" value={filterPrixMax} onChange={e => setFilterPrixMax(e.target.value)}
                    placeholder="50000" style={{ height: "32px", fontSize: "11px" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#6b7280", display: "block", marginBottom: "3px" }}>Statut</label>
                <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as Statut | "")}
                  style={{ width: "100%", height: "32px", padding: "0 10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px", background: "#fff", boxSizing: "border-box" }}>
                  <option value="">Tous</option>
                  {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              {hasFilters && (
                <button onClick={() => { setFilterType(""); setFilterVille(""); setFilterPrixMax(""); setFilterStatut(""); }}
                  style={{ padding: "7px", borderRadius: "8px", border: "1px solid #fecaca", background: "#fff", color: "#ef4444", fontSize: "10px", fontWeight: 600, cursor: "pointer" }}>
                  ✕ Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Liste annonces ── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                <div style={{ height: "140px", background: "#e5e7eb", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "4px", width: "75%" }} />
                  <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "4px", width: "50%" }} />
                  <div style={{ height: "12px", background: "#e5e7eb", borderRadius: "4px", width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>🏘️</div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#374151" }}>
              {annonces.length === 0 ? "Aucune annonce publiée" : "Aucun résultat"}
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
              {annonces.length === 0
                ? hasPremium ? "Soyez le premier à publier !" : "Les annonces apparaîtront ici."
                : "Essayez de modifier vos filtres."
              }
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500 }}>
              {filtered.length} annonce{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
            </p>
            {/* Grille : 1 col mobile, 2 col si plus large */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
              gap: "10px",
            }}>
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
