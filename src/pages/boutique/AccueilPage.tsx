import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import BoutiqueLayout from "@/components/BoutiqueLayout";
import {
  ShoppingBag, Package, TrendingUp, Clock,
  CheckCircle, Truck, XCircle, BarChart2
} from "lucide-react";

type Periode = "jour" | "semaine" | "mois";

interface Stat {
  label: string;
  valeur: number | string;
  icon: any;
  color: string;
  bg: string;
}

function formatMontant(amount: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${amount.toFixed(2)}`;
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

export default function BoutiqueAccueilPage() {
  const [boutique, setBoutique] = useState<any>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<Periode>("semaine");

  const load = async () => {
    setLoading(true);
    const { data: b } = await supabase
      .from("boutiques" as any).select("*").limit(1).single();
    if (!b) { setLoading(false); return; }
    setBoutique(b);

    const { data: cmds } = await supabase
      .from("commandes" as any)
      .select("*, articles_commande(*)")
      .eq("boutique_id", (b as any).id)
      .order("created_at", { ascending: false });
    setCommandes(cmds as any[] || []);

    const { data: prods } = await supabase
      .from("produits" as any)
      .select("*")
      .eq("boutique_id", (b as any).id);
    setProduits(prods as any[] || []);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Filtrer par période
  const filtrerParPeriode = (liste: any[]) => {
    const now = new Date();
    return liste.filter(c => {
      const date = new Date(c.created_at);
      if (periode === "jour") {
        return date.toDateString() === now.toDateString();
      } else if (periode === "semaine") {
        const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      } else {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
    });
  };

  const commandesFiltrees = filtrerParPeriode(commandes);
  const totalMontant = commandesFiltrees.reduce((sum, c) => sum + (c.total || 0), 0);

  // Stats par statut
  const parStatut = (statut: string) => commandes.filter(c => c.statut === statut).length;

  // Top produits vendus
  const topProduits = () => {
    const compteur: Record<string, { nom: string; quantite: number; montant: number }> = {};
    commandes.forEach(cmd => {
      (cmd.articles_commande || []).forEach((art: any) => {
        if (!compteur[art.produit_id]) {
          compteur[art.produit_id] = { nom: art.nom_produit, quantite: 0, montant: 0 };
        }
        compteur[art.produit_id].quantite += art.quantite;
        compteur[art.produit_id].montant += art.montant;
      });
    });
    return Object.values(compteur).sort((a, b) => b.quantite - a.quantite).slice(0, 5);
  };

  // Graphique par jour (7 derniers jours)
  const graphData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const cmdsJour = commandes.filter(c => new Date(c.created_at).toDateString() === dateStr);
      days.push({
        label: date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        commandes: cmdsJour.length,
        montant: cmdsJour.reduce((sum, c) => sum + (c.total || 0), 0),
      });
    }
    return days;
  };

  const graph = graphData();
  const maxMontant = Math.max(...graph.map(d => d.montant), 1);

  if (loading) return (
    <BoutiqueLayout boutiqueName={boutique?.nom}>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </BoutiqueLayout>
  );

  if (!boutique) return (
    <BoutiqueLayout>
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🏪</p>
        <h2 className="text-xl font-bold text-gray-800">Boutique non configurée</h2>
        <p className="text-gray-500 mt-2">Allez dans Paramètres pour créer votre boutique</p>
        <a href="/boutique/parametres"
          className="mt-4 inline-block bg-pink-500 text-white px-6 py-3 rounded-xl font-semibold">
          Configurer ma boutique
        </a>
      </div>
    </BoutiqueLayout>
  );

  return (
    <BoutiqueLayout boutiqueName={boutique?.nom} boutiqueSlug={boutique?.slug}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">Bienvenue dans votre boutique</p>
          </div>
          {/* Période */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(["jour", "semaine", "mois"] as Periode[]).map(p => (
              <button key={p} onClick={() => setPeriode(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  periode === p ? "bg-white text-pink-600 shadow" : "text-gray-500"
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-pink-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Commandes</p>
            </div>
            <p className="text-3xl font-black text-gray-800">{commandesFiltrees.length}</p>
            <p className="text-xs text-gray-400 mt-1">ce{periode === "jour" ? "tte journée" : periode === "semaine" ? "tte semaine" : " mois"}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Revenus</p>
            </div>
            <p className="text-2xl font-black text-gray-800">
              {Math.round(totalMontant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            </p>
            <p className="text-xs text-gray-400 mt-1">{boutique.devise || "FCFA"}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Produits</p>
            </div>
            <p className="text-3xl font-black text-gray-800">{produits.length}</p>
            <p className="text-xs text-gray-400 mt-1">{produits.filter(p => p.actif).length} actifs</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">En attente</p>
            </div>
            <p className="text-3xl font-black text-gray-800">{parStatut("nouvelle")}</p>
            <p className="text-xs text-gray-400 mt-1">à traiter</p>
          </div>
        </div>

        {/* Statuts commandes */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="font-bold text-gray-800 mb-3">Statuts des commandes</p>
          <div className="space-y-2">
            {[
              { label: "Nouvelle", statut: "nouvelle", color: "bg-blue-500", icon: ShoppingBag },
              { label: "Confirmée", statut: "confirmee", color: "bg-purple-500", icon: CheckCircle },
              { label: "En préparation", statut: "en_preparation", color: "bg-yellow-500", icon: Package },
              { label: "Expédiée", statut: "expediee", color: "bg-orange-500", icon: Truck },
              { label: "Livrée", statut: "livree", color: "bg-green-500", icon: CheckCircle },
              { label: "Annulée", statut: "annulee", color: "bg-red-400", icon: XCircle },
            ].map(s => {
              const count = parStatut(s.statut);
              const pct = commandes.length > 0 ? (count / commandes.length) * 100 : 0;
              return (
                <div key={s.statut} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{s.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${s.color} transition-all`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graphique 7 derniers jours */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-pink-500" />
            <p className="font-bold text-gray-800">7 derniers jours</p>
          </div>
          <div className="flex items-end gap-2 h-32">
            {graph.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium">
                  {d.commandes > 0 ? d.commandes : ""}
                </span>
                <div className="w-full rounded-t-lg bg-pink-100 relative overflow-hidden"
                  style={{ height: `${Math.max((d.montant / maxMontant) * 100, d.commandes > 0 ? 10 : 4)}%` }}>
                  <div className="absolute inset-0 bg-pink-500 opacity-80" />
                </div>
                <span className="text-xs text-gray-400 text-center leading-tight">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top produits */}
        {topProduits().length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="font-bold text-gray-800 mb-3">🏆 Top produits vendus</p>
            <div className="space-y-2">
              {topProduits().map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                      i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-gray-200"
                    }`}>{i + 1}</span>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-40">{p.nom}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-pink-600">{p.quantite} vendus</p>
                    <p className="text-xs text-gray-400">
                      {Math.round(p.montant).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {boutique.devise || "FCFA"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dernières commandes */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="font-bold text-gray-800 mb-3">Dernières commandes</p>
          {commandes.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Aucune commande pour l'instant</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commandes.slice(0, 5).map(cmd => (
                <div key={cmd.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{cmd.client_nom}</p>
                    <p className="text-xs text-gray-400">#{cmd.numero} • {new Date(cmd.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-pink-600">
                      {Math.round(cmd.total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} {boutique.devise || "FCFA"}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      cmd.statut === "nouvelle" ? "bg-blue-100 text-blue-700" :
                      cmd.statut === "livree" ? "bg-green-100 text-green-700" :
                      cmd.statut === "annulee" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{cmd.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </BoutiqueLayout>
  );
}
