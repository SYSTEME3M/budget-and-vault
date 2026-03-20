import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, TrendingUp, MapPin } from "lucide-react";
import AnnonceCard from "@/components/AnnonceCard";
import FiltresComponent from "@/components/Filtres";
import AnnonceForm from "@/components/AnnonceForm";
import { useAnnonces } from "@/hooks/useAnnonces";
import { Filtres } from "@/types";

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const [filtres, setFiltres] = useState<Filtres>({
    search: searchParams.get("search") || "",
  });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { annonces, loading, total, pages, refetch } = useAnnonces(filtres, page);

  useEffect(() => {
    setPage(1);
  }, [filtres]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            Trouvez votre bien idéal
          </h1>
          <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
            Des milliers d'annonces immobilières — maisons, terrains, appartements et boutiques
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-300" />
              <span className="font-bold">{total} annonces</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-violet-300" />
              <span className="font-bold">Toute l'Afrique</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-300" />
              <span className="font-bold">Mis à jour quotidiennement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <FiltresComponent filtres={filtres} onChange={f => { setFiltres(f); setPage(1); }} />

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header résultats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 font-medium">
            {loading ? "Chargement..." : `${total} annonce${total > 1 ? "s" : ""} trouvée${total > 1 ? "s" : ""}`}
          </p>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            + Publier
          </button>
        </div>

        {/* Grille */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse">
                <div className="h-52 bg-gray-200 rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🏘️</p>
            <p className="text-xl font-bold text-gray-700">Aucune annonce trouvée</p>
            <p className="text-gray-500 mt-2">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {annonces.map(annonce => (
              <AnnonceCard key={annonce._id} annonce={annonce} userId="user-123" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50">
              ← Précédent
            </button>
            {[...Array(pages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                  page === i + 1
                    ? "bg-violet-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50">
              Suivant →
            </button>
          </div>
        )}
      </div>

      {/* Formulaire publication */}
      {showForm && (
        <AnnonceForm
          onSuccess={() => { setShowForm(false); refetch(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
