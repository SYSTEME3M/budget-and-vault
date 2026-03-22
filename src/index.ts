export type TypeBien = "maison" | "terrain" | "appartement" | "boutique";
export type Statut = "disponible" | "vendu" | "loue";

export interface Annonce {
  id: string; // Changé _id en id
  titre: string;
  description: string;
  prix: number;
  type: TypeBien;
  ville: string;
  quartier?: string;
  images: string[];
  contact: string;
  whatsapp?: string;
  statut: Statut;
  favoris: string[];
  auteurId: string;
  auteurNom: string;
  created_at: string; // Format Supabase standard
  updated_at: string; // Format Supabase standard
}

export interface Filtres {
  type?: TypeBien | "";
  ville?: string;
  prixMin?: string;
  prixMax?: string;
  statut?: Statut | "";
  search?: string;
}

export interface AnnonceFormData {
  titre: string;
  description: string;
  prix: number; // Mis en number pour correspondre à la DB
  type: TypeBien;
  ville: string;
  quartier: string;
  contact: string;
  whatsapp: string;
  statut: Statut;
  auteurId: string;
  auteurNom: string;
}
