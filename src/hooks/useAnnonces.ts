import { useState, useEffect, useCallback } from "react";
import { Annonce, Filtres } from "@/types";

const API = "http://localhost:5000/api";

export function useAnnonces(filtres?: Filtres, page = 1) {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtres?.type) params.set("type", filtres.type);
      if (filtres?.ville) params.set("ville", filtres.ville);
      if (filtres?.prixMin) params.set("prixMin", filtres.prixMin);
      if (filtres?.prixMax) params.set("prixMax", filtres.prixMax);
      if (filtres?.statut) params.set("statut", filtres.statut);
      if (filtres?.search) params.set("search", filtres.search);
      params.set("page", String(page));

      const res = await fetch(`${API}/annonces?${params}`);
      const data = await res.json();
      setAnnonces(data.annonces || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [filtres, page]);

  useEffect(() => { fetchAnnonces(); }, [fetchAnnonces]);

  return { annonces, loading, total, pages, refetch: fetchAnnonces };
}

export async function createAnnonce(formData: FormData): Promise<Annonce> {
  const res = await fetch(`${API}/annonces`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Erreur création annonce");
  return res.json();
}

export async function updateAnnonce(id: string, formData: FormData): Promise<Annonce> {
  const res = await fetch(`${API}/annonces/${id}`, {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) throw new Error("Erreur modification annonce");
  return res.json();
}

export async function deleteAnnonce(id: string): Promise<void> {
  const res = await fetch(`${API}/annonces/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erreur suppression annonce");
}

export async function toggleFavori(id: string, userId: string): Promise<string[]> {
  const res = await fetch(`${API}/annonces/${id}/favori`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Erreur favori");
  const data = await res.json();
  return data.favoris;
}

export async function getAnnonce(id: string): Promise<Annonce> {
  const res = await fetch(`${API}/annonces/${id}`);
  if (!res.ok) throw new Error("Annonce introuvable");
  return res.json();
}

export async function getMesAnnonces(auteurId: string): Promise<Annonce[]> {
  const res = await fetch(`${API}/annonces/user/${auteurId}`);
  if (!res.ok) throw new Error("Erreur");
  return res.json();
}
