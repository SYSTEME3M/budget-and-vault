import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, MessageCircle, Heart, ArrowLeft, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { Annonce } from "@/types";
import { getAnnonce, toggleFavori } from "@/hooks/useAnnonces";

const TYPE_LABELS = {
  maison: { label: "Maison", emoji: "🏠" },
  terrain: { label: "Terrain", emoji: "🌿" },
  appartement: { label: "Appartement", emoji: "🏢" },
  boutique: { label: "Boutique", emoji: "🏪" },
};

const STATUT_COLORS = {
  disponible: "bg-green-500",
  vendu: "bg-red-500",
  loue: "bg-yellow-500",
};

function formatPrix(prix: number): string {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isFavori, setIsFavori] = useState(false);

  const userId = "user-123";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAnnonce(id)
      .then(data => {
        setAnnonce(data);
        setIsFavori(data.favoris.includes(userId));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleFavori = async () => {
    if (!annonce) return;
    const newFavoris = await toggleFavori(annonce._id, userId);
    setIsFavori(newFavoris.includes(userId));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!annonce) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Annonce introuvable
    </div>
  );

  const type = TYPE_LABELS[annonce.type];
  const photos = annonce.images.map(img => `http://localhost:5000${img}`);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Galerie photos */}
      <div className="relative w-full h-72 sm:h-96 bg-gray-900">
        {photos.length > 0 ? (
          <img src={photos[photoIdx]} alt={annonce.titre}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <span className="text-8xl">{type.emoji}</span>
          </div>
        )}

        {/* Navigation photos */}
        {photos.length > 1 && (
          <>
            <button onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
              disabled={photoIdx === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setPhotoIdx(i => Math.min(photos.length - 1, i + 1))}
              disabled={photoIdx === photos.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === photoIdx ? "bg-white w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}

        {/* Actions overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => navigator.share?.({ title: annonce.titre, url: window.location.href })}
            className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
            <Share2 className="w-5 h-5" />
          </button>
          <button onClick={handleFavori}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isFavori ? "bg-red-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
            }`}>
            <Heart className={`w-5 h-5 ${isFavori ? "fill-white" : ""}`} />
          </button>
        </div>

        {/* Statut */}
        <div className={`absolute bottom-4 right-4 ${STATUT_COLORS[annonce.statut]} text-white text-sm font-bold px-3 py-1.5 rounded-full`}>
          {annonce.statut === "disponible" ? "Disponible" : annonce.statut === "vendu" ? "Vendu" : "Loué"}
        </div>
      </div>

      {/* Miniatures */}
      {photos.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100">
          {photos.map((src, i) => (
            <button key={i} onClick={() => setPhotoIdx(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                i === photoIdx ? "border-violet-500" : "border-transparent"
              }`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Infos principales */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              annonce.type === "maison" ? "bg-orange-100 text-orange-700" :
              annonce.type === "terrain" ? "bg-green-100 text-green-700" :
              annonce.type === "appartement" ? "bg-blue-100 text-blue-700" :
              "bg-purple-100 text-purple-700"
            }`}>
              {type.emoji} {type.label}
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-2">{annonce.titre}</h1>
            <div className="flex items-center gap-1 mt-2 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{annonce.quartier ? `${annonce.quartier}, ` : ""}{annonce.ville}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{annonce.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-3">Informations</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Type</p>
                <p className="font-semibold text-gray-700 mt-0.5">{type.emoji} {type.label}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Statut</p>
                <p className="font-semibold text-gray-700 mt-0.5">
                  {annonce.statut === "disponible" ? "✅ Disponible" : annonce.statut === "vendu" ? "🔴 Vendu" : "🟡 Loué"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Localisation</p>
                <p className="font-semibold text-gray-700 mt-0.5">{annonce.ville}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Publié par</p>
                <p className="font-semibold text-gray-700 mt-0.5">{annonce.auteurNom}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar contact */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 sticky top-20">
            <p className="text-3xl font-black text-violet-600 mb-1">
              {formatPrix(annonce.prix)}
            </p>
            <p className="text-gray-400 text-sm mb-5">Prix de vente</p>

            <div className="space-y-3">
              <a href={`tel:${annonce.contact}`}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
                <Phone className="w-4 h-4" /> Appeler
              </a>

              {annonce.whatsapp && (
                <a href={`https://wa.me/${annonce.whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, je suis intéressé par votre annonce : ${annonce.titre}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}

              <button onClick={handleFavori}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                  isFavori
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600 hover:border-red-300"
                }`}>
                <Heart className={`w-4 h-4 ${isFavori ? "fill-red-500" : ""}`} />
                {isFavori ? "Retiré des favoris" : "Ajouter aux favoris"}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              Publié le {new Date(annonce.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
