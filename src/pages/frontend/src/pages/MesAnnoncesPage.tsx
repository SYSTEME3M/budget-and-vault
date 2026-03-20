import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Annonce } from "@/types";
import { getMesAnnonces, deleteAnnonce } from "@/hooks/useAnnonces";
import AnnonceForm from "@/components/AnnonceForm";

const USER_ID = "user-123";

function formatPrix(prix: number): string {
  return prix.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

export default function MesAnnoncesPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAnnonce, setEditingAnnonce] = useState<Annonce | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMesAnnonces(USER_ID);
      setAnnonces(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await deleteAnnonce(id);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Mes annonces</h1>
            <p className="text-gray-500 text-sm mt-0.5">{annonces.length} annonce{annonces.length > 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle annonce
          </button>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : annonces.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">🏠</p>
            <p className="font-bold text-gray-700 text-lg">Aucune annonce publiée</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Commencez par publier votre première annonce</p>
            <button onClick={() => setShowNew(true)}
              className="px-6 py-3 rounded-full bg-violet-600 text-white font-semibold hover:bg-violet-700">
              Publier une annonce
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {annonces.map(annonce => {
              const photo = annonce.images?.[0]
                ? `http://localhost:5000${annonce.images[0]}`
                : null;

              return (
                <div key={annonce._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex gap-4 p-4">
                    {/* Photo */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {photo ? (
                        <img src={photo} alt={annonce.titre} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {annonce.type === "maison" ? "🏠" : annonce.type === "terrain" ? "🌿" : annonce.type === "appartement" ? "🏢" : "🏪"}
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 truncate">{annonce.titre}</h3>
                        <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                          annonce.statut === "disponible" ? "bg-green-100 text-green-700" :
                          annonce.statut === "vendu" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {annonce.statut === "disponible" ? "Disponible" : annonce.statut === "vendu" ? "Vendu" : "Loué"}
                        </span>
                      </div>
                      <p className="text-violet-600 font-black mt-1">{formatPrix(annonce.prix)}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{annonce.ville}{annonce.quartier ? `, ${annonce.quartier}` : ""}</p>
                      <p className="text-gray-300 text-xs mt-0.5">
                        Publié le {new Date(annonce.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100">
                    <Link to={`/annonce/${annonce._id}`}
                      className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4" /> Voir
                    </Link>
                    <button onClick={() => setEditingAnnonce(annonce)}
                      className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors border-x border-gray-100">
                      <Edit2 className="w-4 h-4" /> Modifier
                    </button>
                    <button onClick={() => handleDelete(annonce._id)}
                      className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulaire nouvelle annonce */}
      {showNew && (
        <AnnonceForm
          onSuccess={() => { setShowNew(false); load(); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {/* Formulaire modification */}
      {editingAnnonce && (
        <AnnonceForm
          initial={{ ...editingAnnonce, prix: String(editingAnnonce.prix) }}
          onSuccess={() => { setEditingAnnonce(null); load(); }}
          onCancel={() => setEditingAnnonce(null)}
        />
      )}
    </div>
  );
}
