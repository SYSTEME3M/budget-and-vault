import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Plus, Minus, X, Phone, MessageCircle, Search, Star, Tag, Truck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────
interface Boutique {
  id: string;
  nom: string;
  slug: string;
  description: string;
  logo_url: string;
  banniere_url: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  whatsapp: string;
  telephone: string;
  adresse: string;
  pays: string;
  ville: string;
  frais_livraison: number;
  livraison_gratuite_min: number;
  moyens_paiement: any[];
  paiement_reception: boolean;
  paiement_lien: string;
  devise: string;
  pixel_facebook_id: string;
  pixel_actif: boolean;
}

interface Produit {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prix_promo: number | null;
  type: string;
  categorie: string;
  stock: number;
  stock_illimite: boolean;
  photos: string[];
  vedette: boolean;
  variations: { nom: string; valeurs: string[] }[];
}

interface PanierItem {
  produit: Produit;
  quantite: number;
  variations_choisies: Record<string, string>;
}

function formatPrix(prix: number, devise: string = "XOF"): string {
  if (devise === "USD") return `$${prix.toFixed(2)}`;
  return Math.round(prix).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " " + devise;
}

function genNumeroCommande(): string {
  return `CMD-${Date.now().toString(36).toUpperCase()}`;
}

// ─── Pixel Facebook ───────────────────────────────────────
function fbTrack(boutique: Boutique | null, event: string, params?: any) {
  if (!boutique?.pixel_actif || !boutique?.pixel_facebook_id) return;
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", event, params);
  }
}

// ─── Composant principal ──────────────────────────────────
export default function VitrinePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [filterCateg, setFilterCateg] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const [panier, setPanier] = useState<PanierItem[]>([]);
  const [showPanier, setShowPanier] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [produitDetail, setProduitDetail] = useState<Produit | null>(null);
  const [variationsChoisies, setVariationsChoisies] = useState<Record<string, string>>({});
  const [qte, setQte] = useState(1);

  const [checkoutForm, setCheckoutForm] = useState({
    nom: "", telephone: "", email: "",
    adresse: "", ville: "", pays: "Bénin",
    mode_paiement: "reception", note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [commandeSuccess, setCommandeSuccess] = useState(false);
  const [commandeNumero, setCommandeNumero] = useState("");

  // ── Chargement boutique
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Chercher par slug
      const { data: b } = await supabase
        .from("boutiques" as any)
        .select("*")
        .eq("slug", slug)
        .eq("actif", true)
        .single();

      if (!b) { setNotFound(true); setLoading(false); return; }
      setBoutique(b as any);

      // Charger produits actifs
      const { data: prods } = await supabase
        .from("produits" as any)
        .select("*, variations_produit(*)")
        .eq("boutique_id", (b as any).id)
        .eq("actif", true)
        .order("vedette", { ascending: false });

      const list = (prods as any[] || []).map(p => ({
        ...p, variations: p.variations_produit || []
      }));
      setProduits(list);

      // Catégories uniques
      const cats = [...new Set(list.map((p: any) => p.categorie).filter(Boolean))] as string[];
      setCategories(cats);

      // Pixel Facebook
      if ((b as any).pixel_actif && (b as any).pixel_facebook_id) {
        const script = document.createElement("script");
        script.innerHTML = `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${(b as any).pixel_facebook_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }

      setLoading(false);
    };
    if (slug) load();
  }, [slug]);

  // ── Panier
  const totalPanier = panier.reduce((sum, item) => {
    const prix = item.produit.prix_promo || item.produit.prix;
    return sum + prix * item.quantite;
  }, 0);

  const nbArticles = panier.reduce((sum, item) => sum + item.quantite, 0);

  const addToCart = (produit: Produit, quantite: number, variations: Record<string, string>) => {
    setPanier(prev => {
      const existing = prev.findIndex(i =>
        i.produit.id === produit.id &&
        JSON.stringify(i.variations_choisies) === JSON.stringify(variations)
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantite += quantite;
        return updated;
      }
      return [...prev, { produit, quantite, variations_choisies: variations }];
    });
    fbTrack(boutique, "AddToCart", {
      content_ids: [produit.id],
      content_name: produit.nom,
      value: produit.prix_promo || produit.prix,
      currency: boutique?.devise || "XOF",
    });
    setProduitDetail(null);
    setShowPanier(true);
  };

  const removeFromCart = (idx: number) => {
    setPanier(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQte = (idx: number, delta: number) => {
    setPanier(prev => {
      const updated = [...prev];
      updated[idx].quantite = Math.max(1, updated[idx].quantite + delta);
      return updated;
    });
  };

  // ── Ouvrir détail produit
  const openProduit = (p: Produit) => {
    setProduitDetail(p);
    setVariationsChoisies({});
    setQte(1);
    fbTrack(boutique, "ViewContent", {
      content_ids: [p.id],
      content_name: p.nom,
      value: p.prix_promo || p.prix,
      currency: boutique?.devise || "XOF",
    });
  };

  // ── Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boutique) return;
    if (!checkoutForm.nom || !checkoutForm.telephone || !checkoutForm.adresse || !checkoutForm.ville) {
      alert("Veuillez remplir tous les champs obligatoires"); return;
    }

    setSubmitting(true);
    fbTrack(boutique, "InitiateCheckout", {
      value: totalPanier,
      currency: boutique.devise,
      num_items: nbArticles,
    });

    const frais = boutique.livraison_gratuite_min && totalPanier >= boutique.livraison_gratuite_min
      ? 0 : boutique.frais_livraison || 0;
    const total = totalPanier + frais;
    const numero = genNumeroCommande();

    const { data: cmd, error } = await supabase.from("commandes" as any).insert({
      boutique_id: boutique.id,
      numero,
      client_nom: checkoutForm.nom,
      client_telephone: checkoutForm.telephone,
      client_email: checkoutForm.email || null,
      client_adresse: checkoutForm.adresse,
      client_ville: checkoutForm.ville,
      client_pays: checkoutForm.pays,
      sous_total: totalPanier,
      frais_livraison: frais,
      total,
      devise: boutique.devise,
      mode_paiement: checkoutForm.mode_paiement,
      statut_paiement: "en_attente",
      statut: "nouvelle",
      note: checkoutForm.note || null,
    }).select().single();

    if (!error && cmd) {
      // Articles commande
      await supabase.from("articles_commande" as any).insert(
        panier.map(item => ({
          commande_id: (cmd as any).id,
          produit_id: item.produit.id,
          nom_produit: item.produit.nom,
          prix_unitaire: item.produit.prix_promo || item.produit.prix,
          quantite: item.quantite,
          montant: (item.produit.prix_promo || item.produit.prix) * item.quantite,
          variations_choisies: item.variations_choisies,
          photo_url: item.produit.photos?.[0] || null,
        }))
      );

      // Réduire stock
      for (const item of panier) {
        if (!item.produit.stock_illimite) {
          await supabase.from("produits" as any)
            .update({ stock: Math.max(0, item.produit.stock - item.quantite) })
            .eq("id", item.produit.id);
        }
      }

      fbTrack(boutique, "Purchase", {
        value: total,
        currency: boutique.devise,
        num_items: nbArticles,
      });

      setCommandeNumero(numero);
      setCommandeSuccess(true);
      setPanier([]);
      setShowCheckout(false);
    }
    setSubmitting(false);
  };

  const filteredProduits = produits.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(searchQ.toLowerCase());
    const matchCateg = filterCateg ? p.categorie === filterCateg : true;
    return matchSearch && matchCateg;
  });

  // ── Page non trouvée
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl mb-4">🏪</p>
        <h1 className="text-2xl font-bold text-gray-800">Boutique introuvable</h1>
        <p className="text-gray-500 mt-2">Cette boutique n'existe pas ou n'est plus active.</p>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Chargement de la boutique...</p>
      </div>
    </div>
  );

  const couleur = boutique?.couleur_primaire || "#1a56db";

  // ── Commande réussie
  if (commandeSuccess) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-gray-800">Commande confirmée !</h2>
        <p className="text-gray-500 mt-2">Votre commande <strong>{commandeNumero}</strong> a été reçue.</p>
        <p className="text-gray-400 text-sm mt-2">Le vendeur vous contactera bientôt.</p>
        {boutique?.whatsapp && (
          <a href={`https://wa.me/${boutique.whatsapp.replace(/[^0-9]/g, "")}?text=Bonjour, j'ai passé la commande ${commandeNumero}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-3 font-semibold w-full">
            <MessageCircle className="w-5 h-5" /> Contacter via WhatsApp
          </a>
        )}
        <button onClick={() => setCommandeSuccess(false)}
          className="mt-3 w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium">
          Continuer les achats
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header boutique */}
      <div style={{ background: couleur }} className="relative">
        {boutique?.banniere_url && (
          <img src={boutique.banniere_url} alt="" className="w-full h-40 object-cover opacity-30 absolute inset-0" />
        )}
        <div className="relative z-10 px-4 py-6">
          <div className="flex items-center gap-4">
            {boutique?.logo_url ? (
              <img src={boutique.logo_url} alt={boutique.nom}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-black">{boutique?.nom?.[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white truncate">{boutique?.nom}</h1>
              {boutique?.description && (
                <p className="text-white/80 text-sm mt-0.5 line-clamp-2">{boutique.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 text-white/70 text-xs">
                {boutique?.ville && <span>{boutique.ville}</span>}
                {boutique?.pays && <span>• {boutique.pays}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre recherche + panier */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-primary" />
          </div>
          <button onClick={() => setShowPanier(true)}
            style={{ background: couleur }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <ShoppingCart className="w-5 h-5" />
            {nbArticles > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {nbArticles}
              </span>
            )}
          </button>
        </div>

        {/* Catégories */}
        {categories.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 max-w-2xl mx-auto">
            <button onClick={() => setFilterCateg("")}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filterCateg ? "text-white" : "bg-gray-100 text-gray-600"}`}
              style={!filterCateg ? { background: couleur } : {}}>
              Tout
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilterCateg(filterCateg === cat ? "" : cat)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterCateg === cat ? "text-white" : "bg-gray-100 text-gray-600"}`}
                style={filterCateg === cat ? { background: couleur } : {}}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Info livraison */}
      {boutique?.frais_livraison !== undefined && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700">
            <Truck className="w-4 h-4 flex-shrink-0" />
            {boutique.livraison_gratuite_min && boutique.livraison_gratuite_min > 0
              ? `Livraison gratuite dès ${formatPrix(boutique.livraison_gratuite_min, boutique.devise)} • Sinon ${formatPrix(boutique.frais_livraison, boutique.devise)}`
              : boutique.frais_livraison === 0
                ? "Livraison gratuite"
                : `Frais de livraison : ${formatPrix(boutique.frais_livraison, boutique.devise)}`
            }
          </div>
        </div>
      )}

      {/* ── Grille produits */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {filteredProduits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-gray-500 font-medium">Aucun produit disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProduits.map(produit => {
              const prix = produit.prix_promo || produit.prix;
              const photo = produit.photos?.[0];
              const enRupture = !produit.stock_illimite && produit.stock <= 0;

              return (
                <div key={produit.id}
                  onClick={() => !enRupture && openProduit(produit)}
                  className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-transform ${enRupture ? "opacity-60" : "cursor-pointer active:scale-95"}`}>
                  {/* Photo */}
                  <div className="relative w-full h-40 bg-gray-100">
                    {photo ? (
                      <img src={photo} alt={produit.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {produit.vedette && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" /> Vedette
                      </div>
                    )}
                    {produit.prix_promo && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        Promo
                      </div>
                    )}
                    {enRupture && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Rupture de stock</span>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="p-3">
                    <p className="font-semibold text-gray-800 text-sm line-clamp-2">{produit.nom}</p>
                    {produit.categorie && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{produit.categorie}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="font-black text-sm" style={{ color: couleur }}>
                        {formatPrix(prix, boutique?.devise)}
                      </span>
                      {produit.prix_promo && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrix(produit.prix, boutique?.devise)}
                        </span>
                      )}
                    </div>
                    {!enRupture && (
                      <button
                        onClick={e => { e.stopPropagation(); openProduit(produit); }}
                        style={{ background: couleur }}
                        className="mt-2 w-full py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" /> Ajouter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal détail produit */}
      {produitDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-0">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-black text-lg">{produitDetail.nom}</h2>
                <button onClick={() => setProduitDetail(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photos */}
              {produitDetail.photos && produitDetail.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {produitDetail.photos.map((url, i) => (
                    <img key={i} src={url} alt="" className="w-32 h-32 object-cover rounded-xl flex-shrink-0 border border-gray-100" />
                  ))}
                </div>
              )}

              {/* Prix */}
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black" style={{ color: couleur }}>
                  {formatPrix(produitDetail.prix_promo || produitDetail.prix, boutique?.devise)}
                </span>
                {produitDetail.prix_promo && (
                  <span className="text-gray-400 line-through text-lg">
                    {formatPrix(produitDetail.prix, boutique?.devise)}
                  </span>
                )}
              </div>

              {/* Description */}
              {produitDetail.description && (
                <p className="text-gray-600 text-sm">{produitDetail.description}</p>
              )}

              {/* Variations */}
              {produitDetail.variations?.map(v => (
                <div key={v.nom}>
                  <p className="text-sm font-semibold mb-2">{v.nom}</p>
                  <div className="flex gap-2 flex-wrap">
                    {v.valeurs.map(val => (
                      <button key={val}
                        onClick={() => setVariationsChoisies(prev => ({ ...prev, [v.nom]: val }))}
                        className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors ${variationsChoisies[v.nom] === val ? "border-primary text-primary" : "border-gray-200 text-gray-600"}`}
                        style={variationsChoisies[v.nom] === val ? { borderColor: couleur, color: couleur } : {}}>
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Quantité */}
              <div>
                <p className="text-sm font-semibold mb-2">Quantité</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQte(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-black w-8 text-center">{qte}</span>
                  <button onClick={() => setQte(q => q + 1)}
                    className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => addToCart(produitDetail, qte, variationsChoisies)}
                style={{ background: couleur }}
                className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Ajouter au panier — {formatPrix((produitDetail.prix_promo || produitDetail.prix) * qte, boutique?.devise)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Panier */}
      {showPanier && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-black text-lg">Mon panier ({nbArticles})</h2>
              <button onClick={() => setShowPanier(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {panier.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Votre panier est vide</p>
                </div>
              ) : (
                panier.map((item, i) => (
                  <div key={i} className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
                    {item.produit.photos?.[0] && (
                      <img src={item.produit.photos[0]} alt=""
                        className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.produit.nom}</p>
                      {Object.keys(item.variations_choisies).length > 0 && (
                        <p className="text-xs text-gray-400">
                          {Object.entries(item.variations_choisies).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </p>
                      )}
                      <p className="text-sm font-black mt-0.5" style={{ color: couleur }}>
                        {formatPrix((item.produit.prix_promo || item.produit.prix) * item.quantite, boutique?.devise)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQte(i, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.quantite}</span>
                      <button onClick={() => updateQte(i, 1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(i)}
                        className="w-7 h-7 rounded-lg bg-red-100 text-red-500 flex items-center justify-center ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {panier.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span style={{ color: couleur }}>{formatPrix(totalPanier, boutique?.devise)}</span>
                </div>
                <button
                  onClick={() => { setShowPanier(false); setShowCheckout(true); }}
                  style={{ background: couleur }}
                  className="w-full py-4 rounded-2xl text-white font-black text-base">
                  Commander maintenant
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-black text-lg">Finaliser la commande</h2>
              <button onClick={() => setShowCheckout(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-4 space-y-4">
              <p className="font-semibold text-sm" style={{ color: couleur }}>Vos informations</p>

              <div>
                <label className="text-sm font-medium">Nom complet *</label>
                <Input value={checkoutForm.nom}
                  onChange={e => setCheckoutForm({ ...checkoutForm, nom: e.target.value })}
                  placeholder="Votre nom" className="mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone *</label>
                <Input value={checkoutForm.telephone}
                  onChange={e => setCheckoutForm({ ...checkoutForm, telephone: e.target.value })}
                  placeholder="+229..." className="mt-1" required />
              </div>
              <div>
                <label className="text-sm font-medium">Email (optionnel)</label>
                <Input type="email" value={checkoutForm.email}
                  onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                  placeholder="email@exemple.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Adresse de livraison *</label>
                <Input value={checkoutForm.adresse}
                  onChange={e => setCheckoutForm({ ...checkoutForm, adresse: e.target.value })}
                  placeholder="Adresse complète" className="mt-1" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Ville *</label>
                  <Input value={checkoutForm.ville}
                    onChange={e => setCheckoutForm({ ...checkoutForm, ville: e.target.value })}
                    placeholder="Cotonou" className="mt-1" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Pays</label>
                  <Input value={checkoutForm.pays}
                    onChange={e => setCheckoutForm({ ...checkoutForm, pays: e.target.value })}
                    className="mt-1" />
                </div>
              </div>

              {/* Mode paiement */}
              <div>
                <p className="font-semibold text-sm mb-2" style={{ color: couleur }}>Mode de paiement</p>
                <div className="space-y-2">
                  {boutique?.paiement_reception && (
                    <label className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors"
                      style={checkoutForm.mode_paiement === "reception" ? { borderColor: couleur } : { borderColor: "#e5e7eb" }}>
                      <input type="radio" name="paiement" value="reception"
                        checked={checkoutForm.mode_paiement === "reception"}
                        onChange={() => setCheckoutForm({ ...checkoutForm, mode_paiement: "reception" })}
                        className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center`}
                        style={{ borderColor: couleur }}>
                        {checkoutForm.mode_paiement === "reception" && (
                          <div className="w-3 h-3 rounded-full" style={{ background: couleur }} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Paiement à la réception</p>
                        <p className="text-xs text-gray-400">Payez à la livraison</p>
                      </div>
                    </label>
                  )}
                  {boutique?.moyens_paiement?.map((mp: any, i: number) => (
                    <label key={i} className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer"
                      style={checkoutForm.mode_paiement === mp.reseau ? { borderColor: couleur } : { borderColor: "#e5e7eb" }}>
                      <input type="radio" name="paiement" value={mp.reseau}
                        checked={checkoutForm.mode_paiement === mp.reseau}
                        onChange={() => setCheckoutForm({ ...checkoutForm, mode_paiement: mp.reseau })}
                        className="hidden" />
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: couleur }}>
                        {checkoutForm.mode_paiement === mp.reseau && (
                          <div className="w-3 h-3 rounded-full" style={{ background: couleur }} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{mp.reseau}</p>
                        <p className="text-xs text-gray-400">{mp.numero} — {mp.nom_titulaire}</p>
                      </div>
                    </label>
                  ))}
                  {boutique?.paiement_lien && (
                    <label className="flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer"
                      style={checkoutForm.mode_paiement === "lien" ? { borderColor: couleur } : { borderColor: "#e5e7eb" }}>
                      <input type="radio" name="paiement" value="lien"
                        checked={checkoutForm.mode_paiement === "lien"}
                        onChange={() => setCheckoutForm({ ...checkoutForm, mode_paiement: "lien" })}
                        className="hidden" />
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: couleur }}>
                        {checkoutForm.mode_paiement === "lien" && (
                          <div className="w-3 h-3 rounded-full" style={{ background: couleur }} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Paiement en ligne</p>
                        <p className="text-xs text-gray-400">Via lien de paiement sécurisé</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Note (optionnel)</label>
                <textarea value={checkoutForm.note}
                  onChange={e => setCheckoutForm({ ...checkoutForm, note: e.target.value })}
                  placeholder="Instructions spéciales..."
                  className="mt-1 w-full h-20 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none" />
              </div>

              {/* Récap */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total ({nbArticles} articles)</span>
                  <span>{formatPrix(totalPanier, boutique?.devise)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Livraison</span>
                  <span>
                    {boutique?.livraison_gratuite_min && totalPanier >= boutique.livraison_gratuite_min
                      ? "Gratuit 🎉"
                      : formatPrix(boutique?.frais_livraison || 0, boutique?.devise)
                    }
                  </span>
                </div>
                <div className="flex justify-between font-black text-base border-t border-gray-200 pt-1">
                  <span>Total</span>
                  <span style={{ color: couleur }}>
                    {formatPrix(
                      totalPanier + (boutique?.livraison_gratuite_min && totalPanier >= boutique.livraison_gratuite_min ? 0 : boutique?.frais_livraison || 0),
                      boutique?.devise
                    )}
                  </span>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                style={{ background: couleur }}
                className="w-full py-4 rounded-2xl text-white font-black text-base">
                {submitting ? "Envoi en cours..." : "Confirmer la commande"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Footer */}
      <div className="text-center py-6 text-xs text-gray-400 px-4">
        {boutique?.telephone && (
          <a href={`tel:${boutique.telephone}`} className="flex items-center justify-center gap-1 mb-2 text-gray-500">
            <Phone className="w-4 h-4" /> {boutique.telephone}
          </a>
        )}
        <p>Boutique propulsée par MES SECRETS</p>
      </div>
    </div>
  );
}
