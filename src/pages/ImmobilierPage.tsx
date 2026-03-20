import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Plus, Heart, Phone, MessageCircle, 
  Trash2, Edit2, Image as ImageIcon, Search
} from "lucide-react";

// Définition stricte des types pour le build
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

export default function ImmobilierPage() {
  const { toast } = useToast();
  const user = getNexoraUser();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id || "";

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nexora_annonces_immo")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnonces((data as Annonce[]) || []);
    } catch (error: any) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnonces();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Immobilier</h1>
            <p className="text-gray-500 text-sm">Trouvez votre futur chez-vous</p>
          </div>
          <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
            <Plus className="w-5 h-5" /> Publier une annonce
          </button>
        </div>

        {/* Grille d'annonces */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {annonces.map((annonce) => (
              <div key={annonce.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {annonce.images && annonce.images.length > 0 ? (
                    <img 
                      src={annonce.images[0]} 
                      alt={annonce.titre} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-violet-700 shadow-sm">
                    {annonce.type.toUpperCase()}
                  </div>
                </div>

                {/* Infos */}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{annonce.titre}</h3>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                    <MapPin className="w-3 h-3" /> {annonce.ville}{annonce.quartier ? `, ${annonce.quartier}` : ""}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-black text-violet-600">
                      {annonce.prix.toLocaleString()} $
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-5">
                    <a 
                      href={`tel:${annonce.contact}`}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                    >
                      <Phone className="w-4 h-4" /> Appeler
                    </a>
                    {annonce.whatsapp && (
                      <a 
                        href={`https://wa.me/${annonce.whatsapp.replace(/\D/g,'')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
