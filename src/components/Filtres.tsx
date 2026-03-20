import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Filtres as FiltresType, TypeBien, Statut } from "@/types";

interface Props {
  filtres: FiltresType;
  onChange: (f: FiltresType) => void;
}

const TYPES: { value: TypeBien | ""; label: string; emoji: string }[] = [
  { value: "", label: "Tout", emoji: "🏘️" },
  { value: "maison", label: "Maison", emoji: "🏠" },
  { value: "terrain", label: "Terrain", emoji: "🌿" },
  { value: "appartement", label: "Appartement", emoji: "🏢" },
  { value: "boutique", label: "Boutique", emoji: "🏪" },
];

const STATUTS: { value: Statut | ""; label: string }[] = [
  { value: "", label: "Tous statuts" },
  { value: "disponible", label: "Disponible" },
  { value: "vendu", label: "Vendu" },
  { value: "loue", label: "Loué" },
];

export default function FiltresComponent({ filtres, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const hasFilters = filtres.type || filtres.ville || filtres.prixMin || filtres.prixMax || filtres.statut;

  const reset = () => onChange({ type: "", ville: "", prixMin: "", prixMax: "", statut: "" });

  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">

        {/* Types rapides */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {TYPES.map(t => (
            <button key={t.value}
              onClick={() => onChange({ ...filtres, type: t.value })}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                filtres.type === t.value
                  ? "bg-violet-600 text-white border-violet-600 shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
              }`}>
              {t.emoji} {t.label}
            </button>
          ))}

          {/* Bouton filtres avancés */}
          <button onClick={() => setOpen(!open)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ml-auto ${
              hasFilters
                ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filtres {hasFilters && <span className="w-2 h-2 rounded-full bg-violet-600" />}
          </button>

          {hasFilters && (
            <button onClick={reset}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50">
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>

        {/* Filtres avancés */}
        {open && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 mt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
              <input
                value={filtres.ville || ""}
                onChange={e => onChange({ ...filtres, ville: e.target.value })}
                placeholder="Ex: Cotonou, Lomé..."
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix minimum</label>
              <input
                type="number"
                value={filtres.prixMin || ""}
                onChange={e => onChange({ ...filtres, prixMin: e.target.value })}
                placeholder="0"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Prix maximum</label>
              <input
                type="number"
                value={filtres.prixMax || ""}
                onChange={e => onChange({ ...filtres, prixMax: e.target.value })}
                placeholder="Illimité"
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Statut</label>
              <select
                value={filtres.statut || ""}
                onChange={e => onChange({ ...filtres, statut: e.target.value as Statut | "" })}
                className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white">
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
