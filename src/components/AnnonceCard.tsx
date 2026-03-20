import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Phone, MessageCircle, Eye } from "lucide-react";
import { Annonce } from "@/types";
import { toggleFavori } from "@/hooks/useAnnonces";

const TYPE_LABELS = {
maison: { label: "Maison", emoji: "🏠", color: "bg-orange-100 text-orange-700" },
terrain: { label: "Terrain", emoji: "🌿", color: "bg-green-100 text-green-700" },
appartement: { label: "Appartement", emoji: "🏢", color: "bg-blue-100 text-blue-700" },
boutique: { label: "Boutique", emoji: "🏪", color: "bg-purple-100 text-purple-700" },
};

const STATUT_LABELS = {
disponible: { label: "Disponible", color: "bg-green-500" },
vendu: { label: "Vendu", color: "bg-red-500" },
loue: { label: "Loué", color: "bg-yellow-500" },
};

function formatPrix(prix: number): string {
return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

interface Props {
annonce: Annonce;
userId?: string;
onFavoriChange?: (id: string, favoris: string[]) => void;
}

export default function AnnonceCard({ annonce, userId = "guest", onFavoriChange }: Props) {
const [favoris, setFavoris] = useState(annonce.favoris);
const [loadingFavori, setLoadingFavori] = useState(false);

const isFavori = favoris.includes(userId);
const type = TYPE_LABELS[annonce.type];
const statut = STATUT_LABELS[annonce.statut];
const photo = annonce.images?.[0]
? http://localhost:5000${annonce.images[0]}
: null;

const handleFavori = async (e: React.MouseEvent) => {
e.preventDefault();
e.stopPropagation();
if (loadingFavori) return;
setLoadingFavori(true);
try {
const newFavoris = await toggleFavori(annonce._id, userId);
setFavoris(newFavoris);
onFavoriChange?.(annonce._id, newFavoris);
} catch (err) {
console.error(err);
}
setLoadingFavori(false);
};

return (
<div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">

{/* Image */}  
  <div className="relative w-full h-52 bg-gray-100 overflow-hidden">  
    {photo ? (  
      <img src={photo} alt={annonce.titre}  
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />  
    ) : (  
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">  
        <span className="text-5xl">{type.emoji}</span>  
      </div>  
    )}  

    {/* Statut badge */}  
    <div className={`absolute top-3 left-3 ${statut.color} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>  
      {statut.label}  
    </div>  

    {/* Favori button */}  
    <button onClick={handleFavori}  
      className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${  
        isFavori ? "bg-red-500 text-white" : "bg-white/80 text-gray-600 hover:bg-white"  
      }`}>  
      <Heart className={`w-4 h-4 ${isFavori ? "fill-white" : ""}`} />  
    </button>  

    {/* Nombre photos */}  
    {annonce.images.length > 1 && (  
      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">  
        <Eye className="w-3 h-3" /> {annonce.images.length} photos  
      </div>  
    )}  
  </div>  

  {/* Contenu */}  
  <div className="p-4">  
    {/* Type badge */}  
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${type.color}`}>  
      {type.emoji} {type.label}  
    </span>  

    {/* Titre */}  
    <h3 className="font-bold text-gray-900 mt-2 line-clamp-1 text-base">{annonce.titre}</h3>  

    {/* Localisation */}  
    <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">  
      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />  
      <span className="truncate">  
        {annonce.quartier ? `${annonce.quartier}, ` : ""}{annonce.ville}  
      </span>  
    </div>  

    {/* Description */}  
    <p className="text-gray-400 text-sm mt-2 line-clamp-2">{annonce.description}</p>  

    {/* Prix */}  
    <p className="text-violet-600 font-black text-lg mt-3">  
      {formatPrix(annonce.prix)}  
    </p>  

    {/* Actions */}  
    <div className="flex gap-2 mt-3">  
      <Link to={`/annonce/${annonce._id}`}  
        className="flex-1 py-2 rounded-xl bg-violet-50 text-violet-700 text-sm font-semibold text-center hover:bg-violet-100 transition-colors">  
        Voir détail  
      </Link>  
      {annonce.whatsapp && (  
        <a href={`https://wa.me/${annonce.whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, je suis intéressé par votre annonce : ${annonce.titre}`}  
          target="_blank" rel="noopener noreferrer"  
          onClick={e => e.stopPropagation()}  
          className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white flex-shrink-0 hover:opacity-90">  
          <MessageCircle className="w-4 h-4" />  
        </a>  
      )}  
      <a href={`tel:${annonce.contact}`}  
        onClick={e => e.stopPropagation()}  
        className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0 hover:bg-gray-200">  
        <Phone className="w-4 h-4" />  
      </a>  
    </div>  
  </div>  
</div>

);
}
