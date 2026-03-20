import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";

import {
  MapPin, Heart, Phone, MessageCircle,
  Trash2, Edit2, Plus, Copy, CheckCircle2
} from "lucide-react";

// Types
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
  { value: "maison", label: "Maison", emoji: "🏠", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "terrain", label: "Terrain", emoji: "🌱", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "appartement", label: "Appartement", emoji: "🏢", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "boutique", label: "Boutique", emoji: "🏪", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const STATUTS = [
  { value: "disponible", label: "Disponible", color: "bg-green-500" },
  { value: "vendu", label: "Vendu", color: "bg-red-500" },
  { value: "loue", label: "Loué", color: "bg-yellow-500" },
];

function formatPrix(prix: number) {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}

// Copy Button
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
    </button>
  );
}

// Card
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
  onEdit: (annonce: Annonce) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
}) {
  const typeInfo = TYPES.find(t => t.value === annonce.type) || TYPES[0];
  const statutInfo = STATUTS.find(s => s.value === annonce.statut) || STATUTS[0];

  const isFavori = annonce.favoris?.includes(userId);
  const photo = annonce.images?.[0];

  return (
    <div className="bg-white rounded-xl shadow">

      {photo && <img src={photo} alt="" />}

      <h3>{annonce.titre}</h3>
      <p>{formatPrix(annonce.prix)}</p>

      <button onClick={() => onFavori(annonce.id)}>
        <Heart />
      </button>

      <a href={`tel:${annonce.contact}`}>
        <Phone />
      </a>

      {annonce.whatsapp && (
        <a href={`https://wa.me/${annonce.whatsapp}`}>
          <MessageCircle />
        </a>
      )}

      {isOwner && (
        <>
          <button onClick={() => onEdit(annonce)}>
            <Edit2 />
          </button>
          <button onClick={() => onDelete(annonce.id)}>
            <Trash2 />
          </button>
        </>
      )}
    </div>
  );
}

// Page
export default function ImmobilierPage() {
  const user = getNexoraUser();
  const { toast } = useToast();

  const userId = user?.id || "guest";
  const hasPremium = user?.plan === "premium" || user?.plan === "admin";

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnnonces = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nexora_annonces_immo")
      .select("*")
      .order("created_at", { ascending: false });

    setAnnonces((data || []) as Annonce[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAnnonces();
  }, []);

  const handleFavori = (id: string) => {
    console.log("favori", id);
  };

  return (
    <AppLayout>
      <div>

        {hasPremium && (
          <button>
            <Plus /> Publier
          </button>
        )}

        <div>
          {annonces.map((annonce) => (
            <AnnonceCard
              key={annonce.id}
              annonce={annonce}
              userId={userId}
              isOwner={annonce.user_id === userId}
              onFavori={handleFavori}
              onDelete={() => {}}
              onEdit={() => {}}
            />
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
