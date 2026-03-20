import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Plus, Heart, Phone, MessageCircle, Trash2, Edit2, 
  Image as ImageIcon, Copy, CheckCircle2
} from "lucide-react";

// Types stricts pour éviter les erreurs de build
type TypeBien = "maison" | "terrain" | "appartement" | "boutique";
type Statut = "disponible" | "vendu" | "loue";

interface Annonce {
  id: string;
  user_id: string;
  auteur_nom: string | null;
  titre: string;
  description: string | null;
  prix: number;
  type: TypeBien;
  ville: string;
  quartier: string | null;
  images: string[] | null;
  contact: string;
  whatsapp: string | null;
  statut: Statut;
  favoris: string[] | null;
  created_at: string;
}

const TYPES: { value: TypeBien; label: string; emoji: string; color: string }[] = [
  { value: "maison", label: "Maison", emoji: "🏠", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "terrain", label: "Terrain", emoji: "🌱", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "appartement", label: "Appartement", emoji: "🏢", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "boutique", label: "Boutique", emoji: "🏪", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const STATUTS: { value: Statut; label: string; color: string; dot: string }[] = [
  { value: "disponible", label: "Disponible", color: "bg-green-500", dot: "bg-green-500" },
  { value: "vendu", label: "Vendu", color: "bg-red-500", dot: "bg-red-500" },
  { value: "loue", label: "Loué", color: "bg-yellow-500", dot: "bg-yellow-500" },
];

function formatPrix(prix: number): string {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}

function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
        copied ? "bg-green-500 text-white" : "bg-violet-100 text-violet-700"
      }`}
    >
      {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? "Copié!" : label}</span>
    </button>
  );
}

function AnnonceCard({ annonce, userId, onFavori, onEdit, onDelete, isOwner }: any) {
  const typeInfo = TYPES.find(t => t.value === annonce.type) || TYPES[0];
  const statutInfo = STATUTS.find(s => s.value === annonce.statut) || STATUTS[0];
  const isFavori = annonce.favoris?.includes(userId);
  const photo = annonce.images && annonce.images.length > 0 ? annonce.images[0] : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
        {photo ? (
          <img src={photo} alt={annonce.titre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{typeInfo.emoji}</div>
        )}
        <div className={`absolute top-2 left-2 ${statutInfo.color} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase`}>
          {statutInfo.label}
        </div>
        <button 
          onClick={() => onFavori(annonce.id)} 
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center ${isFavori ? "bg-red-500 text-white" : "bg-white/80"}`}
        >
          <Heart className={`w-4 h-4 ${isFavori ? "fill-white" : ""}`} />
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border self-start ${typeInfo.color}`}>
          {typeInfo.label}
        </span>
        <h3 className="font-bold text-gray-900 mt-2 text-sm line-clamp-1">{annonce.titre}</h3>
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
           <MapPin className="w-3 h-3" /> {annonce.ville}
        </div>
        <p className="text-violet-600 font-black text-lg mt-2">{formatPrix(annonce.prix)}</p>
        
        <div className="flex gap-2 mt-4">
          <a href={`tel:${annonce.contact}`} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center gap-1">
            <Phone className="w-3.5 h-3.5" /> Appeler
          </a>
          {annonce.whatsapp && (
             <a href={`https://wa.me/${annonce.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold flex items-center justify-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
             </a>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
            <button onClick={() => onEdit(annonce)} className="flex-1 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[10px] font-bold flex items-center justify-center gap-1">
              <Edit2 className="w-3 h-3" /> Modifier
            </button>
            <button onClick={() => onDelete(annonce.id)} className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-500 text-[10px] font-bold flex items-center justify-center gap-1">
              <Trash2 className="w-3 h-3" /> Supprimer
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
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const userId = user?.id || "guest";
  const hasPremium = user?.plan === "premium" || user?.plan === "admin";

  const loadAnnonces = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("nexora_annonces_immo")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setAnnonces((data || []) as Annonce[]);
    setLoading(false);
  };

  useEffect(() => { loadAnnonces(); }, []);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        <div className="bg-violet-600 p-6 rounded-3xl text-white flex justify-between items-center shadow-lg shadow-violet-200">
          <div>
            <h1 className="text-2xl font-black">Marché Immobilier</h1>
            <p className="text-xs opacity-90">{annonces.length} annonces en ligne</p>
          </div>
          {hasPremium && (
            <button onClick={() => setShowForm(!showForm)} className="bg-white text-violet-600 px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Publier
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20 opacity-50 italic">Chargement des biens...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {annonces.map(annonce => (
              <AnnonceCard 
                key={annonce.id} 
                annonce={annonce} 
                userId={userId} 
                isOwner={annonce.user_id === userId}
                onDelete={() => {}} 
                onEdit={() => {}} 
                onFavori={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
