import { useState, useRef } from "react";
import { X, Upload, Plus, Loader2 } from "lucide-react";
import { AnnonceFormData, TypeBien, Statut } from "@/types";
import { createAnnonce, updateAnnonce } from "@/hooks/useAnnonces";

interface Props {
  initial?: Partial<AnnonceFormData> & { _id?: string; images?: string[] };
  onSuccess: () => void;
  onCancel: () => void;
}

const TYPES: { value: TypeBien; label: string; emoji: string }[] = [
  { value: "maison", label: "Maison", emoji: "🏠" },
  { value: "terrain", label: "Terrain", emoji: "🌿" },
  { value: "appartement", label: "Appartement", emoji: "🏢" },
  { value: "boutique", label: "Boutique", emoji: "🏪" },
];

export default function AnnonceForm({ initial, onSuccess, onCancel }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState<AnnonceFormData>({
    titre: initial?.titre || "",
    description: initial?.description || "",
    prix: initial?.prix ? String(initial.prix) : "",
    type: initial?.type || "maison",
    ville: initial?.ville || "",
    quartier: initial?.quartier || "",
    contact: initial?.contact || "",
    whatsapp: initial?.whatsapp || "",
    statut: initial?.statut || "disponible",
    auteurId: "user-123", // À remplacer par l'ID utilisateur réel
    auteurNom: "Utilisateur", // À remplacer
  });

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length + files.length > 8) {
      alert("Maximum 8 images"); return;
    }
    setFiles(prev => [...prev, ...selected]);
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setPreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre || !form.prix || !form.ville || !form.contact) {
      alert("Veuillez remplir tous les champs obligatoires"); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => fd.append(key, val));
      files.forEach(file => fd.append("images", file));

      if (initial?._id) {
        await updateAnnonce(initial._id, fd);
      } else {
        await createAnnonce(fd);
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-black text-xl text-gray-900">
            {initial?._id ? "Modifier l'annonce" : "Publier une annonce"}
          </h2>
          <button onClick={onCancel}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Type de bien */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Type de bien *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.type === t.value
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-gray-200 text-gray-600 hover:border-violet-200"
                  }`}>
                  <div className="text-xl mb-1">{t.emoji}</div>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Titre *</label>
            <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex: Belle villa 4 chambres avec jardin"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400" />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Description *</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Décrivez votre bien en détail (superficie, équipements, état...)"
              className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-violet-400" />
          </div>

          {/* Prix */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Prix (FCFA) *</label>
            <input type="number" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })}
              placeholder="Ex: 25000000"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400" />
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Ville *</label>
              <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}
                placeholder="Ex: Cotonou"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Quartier</label>
              <input value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })}
                placeholder="Ex: Cadjehoun"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Téléphone *</label>
              <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                placeholder="+229..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">WhatsApp</label>
              <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+229..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400" />
            </div>
          </div>

          {/* Statut */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Statut</label>
            <div className="flex gap-2">
              {[
                { value: "disponible", label: "Disponible", color: "border-green-500 bg-green-50 text-green-700" },
                { value: "vendu", label: "Vendu", color: "border-red-500 bg-red-50 text-red-700" },
                { value: "loue", label: "Loué", color: "border-yellow-500 bg-yellow-50 text-yellow-700" },
              ].map(s => (
                <button key={s.value} type="button"
                  onClick={() => setForm({ ...form, statut: s.value as Statut })}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.statut === s.value ? s.color : "border-gray-200 text-gray-500"
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Photos ({previews.length}/8)
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={handleImages} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:border-violet-400 hover:text-violet-600 transition-colors">
              <Upload className="w-4 h-4" />
              Ajouter des photos
            </button>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Publication..." : initial?._id ? "Modifier" : "Publier l'annonce"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
