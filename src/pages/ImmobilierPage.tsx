import { useState, useEffect, useRef } from "react"; [cite: 2]
import AppLayout from "@/components/AppLayout"; [cite: 3]
import { supabase } from "@/integrations/supabase/client"; [cite: 3]
import { getNexoraUser } from "@/lib/nexora-auth"; [cite: 4]
import { useToast } from "@/hooks/use-toast"; [cite: 4]
import { 
  MapPin, Home, Zap, Lock, Plus, X, Search, Heart, Phone, 
  MessageCircle, Trash2, Edit2, Filter, Image, Copy, 
  CheckCircle2, ExternalLink, Share2, User, ChevronDown, ChevronUp 
} from "lucide-react"; [cite: 5, 6, 7, 8]
import { Link } from "react-router-dom"; [cite: 9]
import { Input } from "@/components/ui/input"; [cite: 10]

// Types
type TypeBien = "maison" | "terrain" | "appartement" | "boutique"; [cite: 13]
type Statut = "disponible" | "vendu" | "loue"; [cite: 13]

interface Annonce { [cite: 14]
  id: string; [cite: 15]
  user_id: string; [cite: 16]
  auteur_nom: string; [cite: 17]
  titre: string; [cite: 18]
  description: string; [cite: 19]
  prix: number; [cite: 20]
  type: TypeBien; [cite: 21]
  ville: string; [cite: 22]
  quartier: string; [cite: 23]
  images: string[]; [cite: 24]
  contact: string; [cite: 25]
  whatsapp: string; [cite: 28]
  statut: Statut; [cite: 29]
  favoris: string[]; [cite: 30]
  created_at: string; [cite: 31]
}

const TYPES: { value: TypeBien; label: string; emoji: string; color: string }[] = [ [cite: 33]
  { value: "maison", label: "Maison", emoji: "🏠", color: "bg-orange-100 text-orange-700 border-orange-200" }, [cite: 34, 35]
  { value: "terrain", label: "Terrain", emoji: "🌱", color: "bg-green-100 text-green-700 border-green-200" }, [cite: 36, 37, 39]
  { value: "appartement", label: "Appartement", emoji: "🏢", color: "bg-blue-100 text-blue-700 border-blue-200" }, [cite: 40]
  { value: "boutique", label: "Boutique", emoji: "🏪", color: "bg-purple-100 text-purple-700 border-purple-200" }, [cite: 41]
];

const STATUTS: { value: Statut; label: string; color: string; dot: string }[] = [ [cite: 43]
  { value: "disponible", label: "Disponible", color: "bg-green-500", dot: "bg-green-500" }, [cite: 44]
  { value: "vendu", label: "Vendu", color: "bg-red-500", dot: "bg-red-500" }, [cite: 45, 46]
  { value: "loue", label: "Loué", color: "bg-yellow-500", dot: "bg-yellow-500" }, [cite: 47, 48, 49]
];

function formatPrix(prix: number): string { [cite: 51]
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $"; [cite: 52]
}

// Composants Internes (CopyButton & AnnonceCard)
function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) { [cite: 56]
  const [copied, setCopied] = useState(false); [cite: 57]
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); [cite: 62]
        navigator.clipboard.writeText(text); [cite: 63]
        setCopied(true); [cite: 64]
        setTimeout(() => setCopied(false), 2000); [cite: 65]
      }}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
        copied ? "bg-green-500 text-white" : "bg-violet-100 text-violet-700 hover:bg-violet-200"
      }`} [cite: 66, 67]
    >
      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />} [cite: 68]
      <span className="hidden sm:inline">{copied ? "Copié!" : label}</span> [cite: 69]
    </button>
  );
}

function AnnonceCard({ annonce, userId, onFavori, onEdit, onDelete, isOwner }: any) { [cite: 76, 77]
  const [showLinks, setShowLinks] = useState(false); [cite: 86]
  const typeInfo = TYPES.find(t => t.value === annonce.type) || TYPES[0]; [cite: 87]
  const statutInfo = STATUTS.find(s => s.value === annonce.statut) || STATUTS[0]; [cite: 88]
  const isFavori = annonce.favoris?.includes(userId); [cite: 89]
  const photo = annonce.images?.[0]; [cite: 90]
  const annonceUrl = `${window.location.origin}/immobilier/annonce/${annonce.id}`; [cite: 91]

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col"> [cite: 93]
      <div className="relative w-full h-44 sm:h-48 bg-gray-100 overflow-hidden"> [cite: 95]
        {photo ? (
          <img src={photo} alt={annonce.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> [cite: 97, 98]
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{typeInfo.emoji}</div> [cite: 101, 102]
        )}
        <div className={`absolute top-2 left-2 ${statutInfo.color} text-white text-xs font-bold px-2 py-1 rounded-full`}> [cite: 105]
          {statutInfo.label} [cite: 106]
        </div>
        <button onClick={() => onFavori(annonce.id)} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${isFavori ? "bg-red-500 text-white" : "bg-white/80"}`}> [cite: 109, 110, 111]
          <Heart className={`w-4 h-4 ${isFavori ? "fill-white" : ""}`} /> [cite: 112]
        </button>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1"> [cite: 124]
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border self-start ${typeInfo.color}`}> [cite: 126, 127]
          {typeInfo.emoji} {typeInfo.label} [cite: 128]
        </span>
        <h3 className="font-bold text-gray-900 mt-2 text-sm sm:text-base">{annonce.titre}</h3> [cite: 131, 133]
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs"> [cite: 136, 137]
           <MapPin className="w-3 h-3" /> {annonce.quartier ? `${annonce.quartier}, ` : ""}{annonce.ville} [cite: 139]
        </div>
        <p className="text-violet-600 font-black text-lg mt-2">{formatPrix(annonce.prix)}</p> [cite: 149, 150]
        
        <div className="flex gap-2 mt-3"> [cite: 211]
          {annonce.whatsapp && (
            <a href={`https://wa.me/${annonce.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" className="flex-1 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1"> [cite: 213, 215]
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp [cite: 218, 219]
            </a>
          )}
          <a href={`tel:${annonce.contact}`} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center gap-1"> [cite: 221, 222, 223]
            <Phone className="w-3.5 h-3.5" /> Appeler [cite: 224, 225]
          </a>
        </div>

        {isOwner && ( [cite: 229]
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100"> [cite: 231]
            <button onClick={() => onEdit(annonce)} className="flex-1 py-2 rounded-lg bg-violet-50 text-violet-700 text-xs font-semibold flex items-center justify-center gap-1"> [cite: 232, 233]
              <Edit2 className="w-3 h-3" /> Modifier [cite: 235]
            </button>
            <button onClick={() => onDelete(annonce.id)} className="flex-1 py-2 rounded-lg bg-red-50 text-red-500 text-xs font-semibold flex items-center justify-center gap-1"> [cite: 237, 238]
              <Trash2 className="w-3 h-3" /> Supprimer [cite: 240]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImmobilierPage() { 
  const user = getNexoraUser(); [cite: 251]
  const { toast } = useToast(); [cite: 252]
  const fileInputRef = useRef<HTMLInputElement>(null); [cite: 253]
  const hasPremium = user?.plan === "premium" || user?.plan === "admin"; [cite: 254]
  const userId = user?.id || "guest"; [cite: 255]

  const [annonces, setAnnonces] = useState<Annonce[]>([]); [cite: 256, 257]
  const [loading, setLoading] = useState(true); [cite: 258, 259]
  const [showForm, setShowForm] = useState(false); [cite: 260, 262]
  const [editingId, setEditingId] = useState<string | null>(null); [cite: 263, 265]
  const [form, setForm] = useState({
    titre: "", description: "", prix: "", type: "maison" as TypeBien,
    ville: "", quartier: "", contact: "", whatsapp: "", statut: "disponible" as Statut,
    images: [] as string[]
  }); [cite: 283, 284, 287, 288, 289]

  const loadAnnonces = async () => { [cite: 293]
    setLoading(true); [cite: 295]
    const { data } = await supabase.from("nexora_annonces_immo").select("*").order("created_at", { ascending: false }); [cite: 296, 297, 299]
    setAnnonces((data || []) as unknown as Annonce[]); [cite: 300]
    setLoading(false); [cite: 301]
  };

  useEffect(() => { loadAnnonces(); }, []); [cite: 302]

  const handleSubmit = async (e: React.FormEvent) => { [cite: 327, 328]
    e.preventDefault();
    if (!form.titre || !form.prix || !form.ville || !form.contact) { [cite: 329]
      toast({ title: "Champs obligatoires manquants", variant: "destructive" }); return; [cite: 331]
    }
    const payload = { ...form, user_id: userId, auteur_nom: user?.nom_prenom || "Utilisateur", prix: parseFloat(form.prix), favoris: [] }; [cite: 333, 335, 336, 338, 341]
    
    let error;
    if (editingId) { [cite: 343]
      ({ error } = await supabase.from("nexora_annonces_immo").update(payload).eq("id", editingId)); [cite: 344, 345]
    } else {
      ({ error } = await supabase.from("nexora_annonces_immo").insert(payload)); [cite: 348]
    }

    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" }); [cite: 349, 350]
    else {
      toast({ title: `Annonce ${editingId ? "modifiée" : "publiée"} !` }); [cite: 351, 354]
      setShowForm(false); loadAnnonces(); [cite: 355, 356]
    }
  };

  return (
    <AppLayout> [cite: 397]
      <div className="max-w-4xl mx-auto p-4 space-y-6"> [cite: 398]
        {/* Hero Section */}
        <div className="bg-primary p-6 rounded-2xl text-white flex justify-between items-center"> [cite: 402, 403, 409]
          <div>
            <h1 className="text-2xl font-black">Marché Immobilier</h1> [cite: 413, 414]
            <p className="text-sm opacity-80">{annonces.length} annonces disponibles</p> [cite: 421]
          </div>
          {hasPremium && ( [cite: 423]
            <button onClick={() => setShowForm(!showForm)} className="bg-white text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2"> [cite: 425, 426, 427]
              <Plus className="w-4 h-4" /> Publier [cite: 429, 430]
            </button>
          )}
        </div>

        {/* Liste des annonces */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> [cite: 478]
          {annonces.map(annonce => (
            <AnnonceCard 
              key={annonce.id} 
              annonce={annonce} 
              userId={userId} 
              isOwner={annonce.user_id === userId}
              onDelete={() => {}} // À implémenter
              onEdit={() => {}} // À implémenter
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
