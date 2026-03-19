import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import {
  ShoppingBag, ChevronDown, ChevronUp, Phone,
  MapPin, Clock, CheckCircle, Truck, Package,
  XCircle, Search, Filter
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────
type StatutCommande = "nouvelle" | "confirmee" | "en_preparation" | "expediee" | "livree" | "annulee";
type StatutPaiement = "en_attente" | "paye" | "echoue" | "rembourse";

interface ArticleCommande {
  id: string;
  nom_produit: string;
  prix_unitaire: number;
  quantite: number;
  montant: number;
  photo_url: string | null;
  variations_choisies: Record<string, string>;
}

interface Commande {
  id: string;
  numero: string;
  boutique_id: string;
  client_nom: string;
  client_telephone: string;
  client_email: string | null;
  client_adresse: string;
  client_ville: string;
  client_pays: string;
  sous_total: number;
  frais_livraison: number;
  total: number;
  devise: string;
  mode_paiement: string;
  statut_paiement: StatutPaiement;
  statut: StatutCommande;
  note: string | null;
  created_at: string;
  articles?: ArticleCommande[];
}

// ─── Constantes ───────────────────────────────────────────
const STATUTS: Record<StatutCommande, { label: string; color: string; icon: any }> = {
  nouvelle: { label: "Nouvelle", color: "bg-blue-100 text-blue-800", icon: ShoppingBag },
  confirmee: { label: "Confirmée", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  en_preparation: { label: "En préparation", color: "bg-yellow-100 text-yellow-800", icon: Package },
  expediee: { label: "Expédiée", color: "bg-orange-100 text-orange-800", icon: Truck },
  livree: { label: "Livrée", color: "bg-green-100 text-green-800", icon: CheckCircle },
  annulee: { label: "Annulée", color: "bg-red-100 text-red-800", icon: XCircle },
};

const STATUTS_PAIEMENT: Record<StatutPaiement, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  paye: { label: "Payé", color: "bg-green-100 text-green-800" },
  echoue: { label: "Échoué", color: "bg-red-100 text-red-800" },
  rembourse: { label: "Remboursé", color: "bg-gray-100 text-gray-800" },
};

const ORDRE_STATUTS: StatutCommande[] = [
  "nouvelle", "confirmee", "en_preparation", "expediee", "livree", "annulee"
];

function formatMontant(amount: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${amount.toFixed(2)}`;
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

function formatDate(dt: string): string {
  return new Date(dt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ─── Composant principal ──────────────────────────────────
export default function CommandesPage() {
  const { toast } = useToast();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutCommande | "">("");
  const [filterPaiement, setFilterPaiement] = useState<StatutPaiement | "">("");
  const [stats, setStats] = useState({
    total: 0, nouvelles: 0, chiffre: 0, livrees: 0
  });

  const load = async () => {
    setLoading(true);
    const { data: boutique } = await supabase
      .from("boutiques" as any).select("id, devise").limit(1).single();
    if (boutique) setBoutiqueId((boutique as any).id);

    if (boutique) {
      const { data } = await supabase
        .from("commandes" as any)
        .select("*, articles_commande(*)")
        .eq("boutique_id", (boutique as any).id)
        .order("created_at", { ascending: false });

      const list = (data as any[] || []).map(c => ({
        ...c, articles: c.articles_commande || []
      }));
      setCommandes(list);

      // Stats
      setStats({
        total: list.length,
        nouvelles: list.filter(c => c.statut === "nouvelle").length,
        chiffre: list.filter(c => c.statut !== "annulee")
          .reduce((sum: number, c: any) => sum + c.total, 0),
        livrees: list.filter(c => c.statut === "livree").length,
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Changer statut commande
  const changeStatut = async (id: string, statut: StatutCommande) => {
    await supabase.from("commandes" as any).update({ statut }).eq("id", id);
    toast({ title: `✅ Statut mis à jour : ${STATUTS[statut].label}` });
    load();
  };

  // ── Changer statut paiement
  const changePaiement = async (id: string, statut_paiement: StatutPaiement) => {
    await supabase.from("commandes" as any).update({ statut_paiement }).eq("id", id);
    toast({ title: `✅ Paiement : ${STATUTS_PAIEMENT[statut_paiement].label}` });
    load();
  };

  // ── Filtres
  const filtered = commandes.filter(c => {
    const matchSearch = c.client_nom.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.numero.toLowerCase().includes(searchQ.toLowerCase());
    const matchStatut = filterStatut ? c.statut === filterStatut : true;
    const matchPaiement = filterPaiement ? c.statut_paiement === filterPaiement : true;
    return matchSearch && matchStatut && matchPaiement;
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black">Commandes</h1>
          <p className="text-sm text-muted-foreground">{commandes.length} commande{commandes.length > 1 ? "s" : ""}</p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-600 font-medium">Nouvelles</p>
            <p className="text-2xl font-black text-blue-700">{stats.nouvelles}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs text-green-600 font-medium">Livrées</p>
            <p className="text-2xl font-black text-green-700">{stats.livrees}</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 col-span-2">
            <p className="text-xs text-primary font-medium">Chiffre d'affaires total</p>
            <p className="text-2xl font-black text-primary">
              {Math.round(stats.chiffre).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher client, numéro..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as any)}
              className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Tous statuts</option>
              {ORDRE_STATUTS.map(s => (
                <option key={s} value={s}>{STATUTS[s].label}</option>
              ))}
            </select>
            <select value={filterPaiement} onChange={e => setFilterPaiement(e.target.value as any)}
              className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm">
              <option value="">Tout paiement</option>
              {Object.entries(STATUTS_PAIEMENT).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 bg-card border border-border rounded-2xl">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucune commande</p>
            <p className="text-xs text-muted-foreground mt-1">Les commandes de vos clients apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(cmd => {
              const isExpanded = expandedId === cmd.id;
              const StatutIcon = STATUTS[cmd.statut].icon;

              return (
                <div key={cmd.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Numéro + statuts */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-primary text-sm">#{cmd.numero}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${STATUTS[cmd.statut].color}`}>
                            <StatutIcon className="w-3 h-3" />
                            {STATUTS[cmd.statut].label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUTS_PAIEMENT[cmd.statut_paiement].color}`}>
                            {STATUTS_PAIEMENT[cmd.statut_paiement].label}
                          </span>
                        </div>

                        {/* Client */}
                        <div className="mt-1">
                          <span className="font-semibold">{cmd.client_nom}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />{cmd.client_telephone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{cmd.client_ville}, {cmd.client_pays}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDate(cmd.created_at)}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="text-lg font-black text-primary mt-1">
                          {formatMontant(cmd.total, cmd.devise)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {cmd.articles?.length || 0} article{(cmd.articles?.length || 0) > 1 ? "s" : ""} • {cmd.mode_paiement}
                        </div>
                      </div>

                      {/* Bouton expand */}
                      <button onClick={() => setExpandedId(isExpanded ? null : cmd.id)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Détails expandés */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4 space-y-4">

                      {/* Articles */}
                      {cmd.articles && cmd.articles.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Articles commandés</p>
                          <div className="space-y-2">
                            {cmd.articles.map((art, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white border border-border rounded-xl p-3">
                                {art.photo_url && (
                                  <img src={art.photo_url} alt=""
                                    className="w-12 h-12 object-cover rounded-lg border border-border flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{art.nom_produit}</p>
                                  {art.variations_choisies && Object.keys(art.variations_choisies).length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {Object.entries(art.variations_choisies).map(([k, v]) => `${k}: ${v}`).join(" • ")}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {art.quantite} × {formatMontant(art.prix_unitaire, cmd.devise)}
                                  </p>
                                </div>
                                <span className="font-bold text-primary text-sm flex-shrink-0">
                                  {formatMontant(art.montant, cmd.devise)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Récap montants */}
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                              <span>Sous-total</span>
                              <span>{formatMontant(cmd.sous_total, cmd.devise)}</span>
                            </div>
                            {cmd.frais_livraison > 0 && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Livraison</span>
                                <span>{formatMontant(cmd.frais_livraison, cmd.devise)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-primary border-t border-border pt-1">
                              <span>Total</span>
                              <span>{formatMontant(cmd.total, cmd.devise)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Adresse livraison */}
                      <div className="bg-white border border-border rounded-xl p-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Adresse de livraison</p>
                        <p className="text-sm">{cmd.client_adresse}</p>
                        <p className="text-sm text-muted-foreground">{cmd.client_ville}, {cmd.client_pays}</p>
                        {cmd.client_email && <p className="text-xs text-muted-foreground mt-1">{cmd.client_email}</p>}
                      </div>

                      {/* Note */}
                      {cmd.note && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Note client</p>
                          <p className="text-sm text-yellow-700">{cmd.note}</p>
                        </div>
                      )}

                      {/* Changer statut commande */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Changer le statut</p>
                        <div className="flex gap-2 flex-wrap">
                          {ORDRE_STATUTS.filter(s => s !== cmd.statut).map(s => (
                            <button key={s} onClick={() => changeStatut(cmd.id, s)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${STATUTS[s].color} hover:opacity-80`}>
                              → {STATUTS[s].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Changer statut paiement */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Statut paiement</p>
                        <div className="flex gap-2 flex-wrap">
                          {(Object.keys(STATUTS_PAIEMENT) as StatutPaiement[])
                            .filter(s => s !== cmd.statut_paiement)
                            .map(s => (
                              <button key={s} onClick={() => changePaiement(cmd.id, s)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${STATUTS_PAIEMENT[s].color} hover:opacity-80`}>
                                → {STATUTS_PAIEMENT[s].label}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Contact rapide */}
                      <div className="flex gap-2">
                        <a href={`tel:${cmd.client_telephone}`}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                          <Phone className="w-4 h-4" /> Appeler
                        </a>
                        <a href={`https://wa.me/${cmd.client_telephone.replace(/[^0-9]/g, "")}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-2.5 text-sm font-semibold">
                          <Phone className="w-4 h-4" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
