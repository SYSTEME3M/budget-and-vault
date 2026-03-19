import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import {
  Store, Globe, Facebook, Bell, CreditCard,
  Truck, Palette, Save, Eye, EyeOff, Plus, Trash2
} from "lucide-react";

const PAYS = [
  "Bénin", "Togo", "Côte d'Ivoire", "Sénégal", "Mali",
  "Burkina Faso", "Niger", "Guinée", "Cameroun", "Ghana",
  "Nigeria", "France", "États-Unis", "Canada", "Autre"
];

const DEVISES = ["XOF", "USD", "EUR", "GHS", "NGN"];

const RESEAUX_PAIEMENT = [
  { id: "mtn", label: "MTN Mobile Money" },
  { id: "moov", label: "Moov Money" },
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "airtel", label: "Airtel Money" },
  { id: "paypal", label: "PayPal" },
];

interface MoyenPaiement {
  reseau: string;
  nom_titulaire: string;
  numero: string;
  actif: boolean;
}

interface ZoneLivraison {
  nom: string;
  frais: number;
  delai: string;
}

interface Boutique {
  id?: string;
  nom: string;
  slug: string;
  description: string;
  logo_url: string;
  banniere_url: string;
  couleur_primaire: string;
  couleur_secondaire: string;
  email: string;
  whatsapp: string;
  telephone: string;
  adresse: string;
  pays: string;
  ville: string;
  domaine_personnalise: string;
  domaine_actif: boolean;
  pixel_facebook_id: string;
  pixel_actif: boolean;
  api_conversion_token: string;
  api_conversion_actif: boolean;
  paiement_reception: boolean;
  paiement_lien: string;
  moyens_paiement: MoyenPaiement[];
  frais_livraison: number;
  livraison_gratuite_min: number;
  zones_livraison: ZoneLivraison[];
  notifications_actives: boolean;
  actif: boolean;
  devise: string;
}

const defaultBoutique: Boutique = {
  nom: "", slug: "", description: "", logo_url: "", banniere_url: "",
  couleur_primaire: "#1a56db", couleur_secondaire: "#f59e0b",
  email: "", whatsapp: "", telephone: "", adresse: "", pays: "Bénin", ville: "",
  domaine_personnalise: "", domaine_actif: false,
  pixel_facebook_id: "", pixel_actif: false,
  api_conversion_token: "", api_conversion_actif: false,
  paiement_reception: true, paiement_lien: "",
  moyens_paiement: [],
  frais_livraison: 0, livraison_gratuite_min: 0,
  zones_livraison: [],
  notifications_actives: true, actif: true, devise: "XOF",
};

const TABS = [
  { id: "general", label: "Général", icon: Store },
  { id: "paiement", label: "Paiements", icon: CreditCard },
  { id: "livraison", label: "Livraison", icon: Truck },
  { id: "pixel", label: "Facebook Pixel", icon: Facebook },
  { id: "domaine", label: "Domaine", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function BoutiqueParametresPage() {
  const { toast } = useToast();
  const [boutique, setBoutique] = useState<Boutique>(defaultBoutique);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showToken, setShowToken] = useState(false);
  const [nouveauReseau, setNouveauReseau] = useState<MoyenPaiement>({
    reseau: "", nom_titulaire: "", numero: "", actif: true,
  });
  const [nouvelleZone, setNouvelleZone] = useState<ZoneLivraison>({
    nom: "", frais: 0, delai: "",
  });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("boutiques" as any)
      .select("*")
      .limit(1)
      .single();
    if (data) {
      setBoutique({
        ...defaultBoutique,
        ...(data as any),
        moyens_paiement: (data as any).moyens_paiement || [],
        zones_livraison: (data as any).zones_livraison || [],
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const genSlug = (nom: string) =>
    nom.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSave = async () => {
    if (!boutique.nom || !boutique.email) {
      toast({ title: "Nom et email obligatoires", variant: "destructive" }); return;
    }
    setSaving(true);
    const payload = {
      ...boutique,
      slug: boutique.slug || genSlug(boutique.nom),
    };

    let error;
    if (boutique.id) {
      ({ error } = await supabase.from("boutiques" as any).update(payload).eq("id", boutique.id));
    } else {
      const { error: err, data } = await supabase.from("boutiques" as any).insert(payload).select().single();
      error = err;
      if (data) setBoutique({ ...boutique, id: (data as any).id });
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Boutique sauvegardée !" });
    }
    setSaving(false);
  };

  const addMoyenPaiement = () => {
    if (!nouveauReseau.reseau || !nouveauReseau.numero) {
      toast({ title: "Réseau et numéro requis", variant: "destructive" }); return;
    }
    setBoutique(prev => ({
      ...prev,
      moyens_paiement: [...prev.moyens_paiement, { ...nouveauReseau }],
    }));
    setNouveauReseau({ reseau: "", nom_titulaire: "", numero: "", actif: true });
  };

  const removeMoyenPaiement = (idx: number) => {
    setBoutique(prev => ({
      ...prev,
      moyens_paiement: prev.moyens_paiement.filter((_, i) => i !== idx),
    }));
  };

  const addZoneLivraison = () => {
    if (!nouvelleZone.nom) {
      toast({ title: "Nom de zone requis", variant: "destructive" }); return;
    }
    setBoutique(prev => ({
      ...prev,
      zones_livraison: [...prev.zones_livraison, { ...nouvelleZone }],
    }));
    setNouvelleZone({ nom: "", frais: 0, delai: "" });
  };

  const removeZoneLivraison = (idx: number) => {
    setBoutique(prev => ({
      ...prev,
      zones_livraison: prev.zones_livraison.filter((_, i) => i !== idx),
    }));
  };

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Paramètres Boutique</h1>
            <p className="text-sm text-muted-foreground">Configurez votre boutique en ligne</p>
          </div>
          <div className="flex gap-2">
            {boutique.slug && (
              <Button variant="outline" size="sm" className="gap-1"
                onClick={() => window.open(`/shop/${boutique.slug}`, "_blank")}>
                <Eye className="w-4 h-4" /> Voir
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} className="bg-primary text-white gap-1">
              <Save className="w-4 h-4" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>

        {/* Statut boutique */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${boutique.actif ? "bg-green-500" : "bg-red-400"}`} />
            <span className="font-medium text-sm">
              Boutique {boutique.actif ? "active" : "inactive"}
            </span>
          </div>
          <button
            onClick={() => setBoutique(prev => ({ ...prev, actif: !prev.actif }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${boutique.actif ? "bg-green-500" : "bg-gray-300"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${boutique.actif ? "left-7" : "left-1"}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                ${activeTab === tab.id ? "bg-primary text-white shadow" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB : Général ── */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-primary">Informations générales</p>
              <div>
                <label className="text-sm font-medium">Nom de la boutique *</label>
                <Input value={boutique.nom}
                  onChange={e => setBoutique(prev => ({ ...prev, nom: e.target.value, slug: genSlug(e.target.value) }))}
                  placeholder="Ma Super Boutique" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-2 rounded-md">/shop/</span>
                  <Input value={boutique.slug}
                    onChange={e => setBoutique(prev => ({ ...prev, slug: genSlug(e.target.value) }))}
                    placeholder="ma-boutique" className="flex-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea value={boutique.description}
                  onChange={e => setBoutique(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre boutique..."
                  className="mt-1 w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Couleur principale</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={boutique.couleur_primaire}
                      onChange={e => setBoutique(prev => ({ ...prev, couleur_primaire: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border border-input" />
                    <Input value={boutique.couleur_primaire}
                      onChange={e => setBoutique(prev => ({ ...prev, couleur_primaire: e.target.value }))}
                      className="flex-1 font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Couleur secondaire</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={boutique.couleur_secondaire}
                      onChange={e => setBoutique(prev => ({ ...prev, couleur_secondaire: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border border-input" />
                    <Input value={boutique.couleur_secondaire}
                      onChange={e => setBoutique(prev => ({ ...prev, couleur_secondaire: e.target.value }))}
                      className="flex-1 font-mono text-sm" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Devise</label>
                <select value={boutique.devise}
                  onChange={e => setBoutique(prev => ({ ...prev, devise: e.target.value }))}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-primary">Contact vendeur</p>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={boutique.email}
                  onChange={e => setBoutique(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@maboutique.com" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">WhatsApp</label>
                  <Input value={boutique.whatsapp}
                    onChange={e => setBoutique(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="+229..." className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input value={boutique.telephone}
                    onChange={e => setBoutique(prev => ({ ...prev, telephone: e.target.value }))}
                    placeholder="+229..." className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Pays</label>
                  <select value={boutique.pays}
                    onChange={e => setBoutique(prev => ({ ...prev, pays: e.target.value }))}
                    className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Ville</label>
                  <Input value={boutique.ville}
                    onChange={e => setBoutique(prev => ({ ...prev, ville: e.target.value }))}
                    placeholder="Cotonou" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Adresse</label>
                <Input value={boutique.adresse}
                  onChange={e => setBoutique(prev => ({ ...prev, adresse: e.target.value }))}
                  placeholder="Adresse complète" className="mt-1" />
              </div>
            </div>
          </div>
        )}

        {/* ── TAB : Paiements ── */}
        {activeTab === "paiement" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-primary">Options de paiement</p>

              {/* Paiement à la réception */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Paiement à la réception</p>
                  <p className="text-xs text-muted-foreground">Le client paie à la livraison</p>
                </div>
                <button
                  onClick={() => setBoutique(prev => ({ ...prev, paiement_reception: !prev.paiement_reception }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${boutique.paiement_reception ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${boutique.paiement_reception ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Lien de paiement */}
              <div>
                <label className="text-sm font-medium">Lien de paiement (optionnel)</label>
                <Input value={boutique.paiement_lien}
                  onChange={e => setBoutique(prev => ({ ...prev, paiement_lien: e.target.value }))}
                  placeholder="https://pay.wave.com/..." className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Ex: lien Wave, PayPal, etc.</p>
              </div>
            </div>

            {/* Moyens de paiement mobile */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-primary">Numéros Mobile Money</p>

              {boutique.moyens_paiement.map((mp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm">{mp.reseau}</p>
                    <p className="text-xs text-muted-foreground">{mp.nom_titulaire} — {mp.numero}</p>
                  </div>
                  <button onClick={() => removeMoyenPaiement(idx)}
                    className="w-7 h-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <div className="border border-dashed border-primary/30 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Ajouter un moyen de paiement</p>
                <select value={nouveauReseau.reseau}
                  onChange={e => setNouveauReseau(prev => ({ ...prev, reseau: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="">-- Choisir le réseau --</option>
                  {RESEAUX_PAIEMENT.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
                </select>
                <Input value={nouveauReseau.nom_titulaire}
                  onChange={e => setNouveauReseau(prev => ({ ...prev, nom_titulaire: e.target.value }))}
                  placeholder="Nom du titulaire" />
                <Input value={nouveauReseau.numero}
                  onChange={e => setNouveauReseau(prev => ({ ...prev, numero: e.target.value }))}
                  placeholder="Numéro de téléphone" />
                <Button type="button" size="sm" onClick={addMoyenPaiement} className="w-full gap-1 bg-primary text-white">
                  <Plus className="w-3 h-3" /> Ajouter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB : Livraison ── */}
        {activeTab === "livraison" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-primary">Frais de livraison</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Frais par défaut</label>
                  <Input type="number" value={boutique.frais_livraison}
                    onChange={e => setBoutique(prev => ({ ...prev, frais_livraison: Number(e.target.value) }))}
                    placeholder="0" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Livraison gratuite dès</label>
                  <Input type="number" value={boutique.livraison_gratuite_min || ""}
                    onChange={e => setBoutique(prev => ({ ...prev, livraison_gratuite_min: Number(e.target.value) }))}
                    placeholder="0 = désactivé" className="mt-1" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-primary">Zones de livraison</p>

              {boutique.zones_livraison.map((zone, idx) => (
                <div key={idx} className="flex items-center justify-between bg-muted/40 rounded-xl p-3">
                  <div>
                    <p className="font-medium text-sm">{zone.nom}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone.frais === 0 ? "Gratuit" : `${zone.frais} ${boutique.devise}`} • {zone.delai}
                    </p>
                  </div>
                  <button onClick={() => removeZoneLivraison(idx)}
                    className="w-7 h-7 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <div className="border border-dashed border-primary/30 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground">Ajouter une zone</p>
                <Input value={nouvelleZone.nom}
                  onChange={e => setNouvelleZone(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Ex: Cotonou, Abomey-Calavi..." />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={nouvelleZone.frais || ""}
                    onChange={e => setNouvelleZone(prev => ({ ...prev, frais: Number(e.target.value) }))}
                    placeholder="Frais (0 = gratuit)" />
                  <Input value={nouvelleZone.delai}
                    onChange={e => setNouvelleZone(prev => ({ ...prev, delai: e.target.value }))}
                    placeholder="Délai (ex: 24h)" />
                </div>
                <Button type="button" size="sm" onClick={addZoneLivraison} className="w-full gap-1 bg-primary text-white">
                  <Plus className="w-3 h-3" /> Ajouter la zone
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB : Facebook Pixel ── */}
        {activeTab === "pixel" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" />
                <p className="font-semibold text-sm">Pixel Facebook</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Le Pixel Facebook permet de suivre les visites, ajouts au panier et achats sur votre boutique.
              </p>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Activer le Pixel</p>
                  <p className="text-xs text-muted-foreground">Tracking côté navigateur</p>
                </div>
                <button
                  onClick={() => setBoutique(prev => ({ ...prev, pixel_actif: !prev.pixel_actif }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${boutique.pixel_actif ? "bg-blue-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${boutique.pixel_actif ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">ID du Pixel Facebook</label>
                <Input value={boutique.pixel_facebook_id}
                  onChange={e => setBoutique(prev => ({ ...prev, pixel_facebook_id: e.target.value }))}
                  placeholder="123456789012345" className="mt-1 font-mono" />
                <p className="text-xs text-muted-foreground mt-1">
                  Trouvez votre Pixel ID dans Facebook Events Manager
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <p className="font-semibold text-sm text-blue-700">API Conversions Facebook</p>
              <p className="text-xs text-muted-foreground">
                L'API Conversions envoie les événements depuis le serveur — plus fiable que le Pixel seul, contourne les bloqueurs de publicité.
              </p>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Activer l'API Conversions</p>
                  <p className="text-xs text-muted-foreground">Tracking côté serveur</p>
                </div>
                <button
                  onClick={() => setBoutique(prev => ({ ...prev, api_conversion_actif: !prev.api_conversion_actif }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${boutique.api_conversion_actif ? "bg-blue-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${boutique.api_conversion_actif ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium">Token d'accès API</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={boutique.api_conversion_token}
                    onChange={e => setBoutique(prev => ({ ...prev, api_conversion_token: e.target.value }))}
                    placeholder="EAAxxxxxxxx..."
                    className="font-mono flex-1"
                  />
                  <button onClick={() => setShowToken(!showToken)}
                    className="px-3 rounded-md border border-input bg-muted hover:bg-muted/80">
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Générez votre token dans Facebook Events Manager → Paramètres API
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-yellow-800 mb-1">📋 Événements trackés automatiquement :</p>
                <ul className="text-xs text-yellow-700 space-y-0.5">
                  <li>• <strong>PageView</strong> — visite de la boutique</li>
                  <li>• <strong>ViewContent</strong> — vue d'un produit</li>
                  <li>• <strong>AddToCart</strong> — ajout au panier</li>
                  <li>• <strong>InitiateCheckout</strong> — début checkout</li>
                  <li>• <strong>Purchase</strong> — commande confirmée</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB : Domaine ── */}
        {activeTab === "domaine" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <p className="font-semibold text-sm">Domaine personnalisé</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-800 mb-2">URL actuelle de votre boutique :</p>
                <p className="text-sm font-mono text-blue-700 break-all">
                  https://budget-and-vault.vercel.app/shop/{boutique.slug || "votre-slug"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Votre domaine personnalisé</label>
                <Input value={boutique.domaine_personnalise}
                  onChange={e => setBoutique(prev => ({ ...prev, domaine_personnalise: e.target.value }))}
                  placeholder="www.maboutique.com" className="mt-1 font-mono" />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Activer le domaine personnalisé</p>
                  <p className="text-xs text-muted-foreground">Après avoir configuré le DNS</p>
                </div>
                <button
                  onClick={() => setBoutique(prev => ({ ...prev, domaine_actif: !prev.domaine_actif }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${boutique.domaine_actif ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${boutique.domaine_actif ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700">📋 Comment configurer votre domaine :</p>
                <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
                  <li>Achetez votre domaine (Namecheap, GoDaddy, etc.)</li>
                  <li>Allez dans la gestion DNS de votre domaine</li>
                  <li>Ajoutez un enregistrement CNAME :</li>
                </ol>
                <div className="bg-white border rounded-lg p-2 font-mono text-xs">
                  <p><span className="text-blue-600">Type :</span> CNAME</p>
                  <p><span className="text-blue-600">Nom :</span> www (ou @)</p>
                  <p><span className="text-blue-600">Valeur :</span> cname.vercel-dns.com</p>
                  <p><span className="text-blue-600">TTL :</span> Auto</p>
                </div>
                <ol start={4} className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Ajoutez le domaine dans votre projet Vercel → Settings → Domains</li>
                  <li>Activez ici et sauvegardez</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB : Notifications ── */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <p className="font-semibold text-sm">Notifications Push</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Recevez une notification sur votre téléphone dès qu'une nouvelle commande arrive, même si vous n'êtes pas connecté.
              </p>

              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Activer les notifications</p>
                  <p className="text-xs text-muted-foreground">Nouvelles commandes en temps réel</p>
                </div>
                <button
                  onClick={() => setBoutique(prev => ({ ...prev, notifications_actives: !prev.notifications_actives }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${boutique.notifications_actives ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${boutique.notifications_actives ? "left-7" : "left-1"}`} />
                </button>
              </div>

              <Button className="w-full bg-primary text-white gap-2"
                onClick={async () => {
                  try {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                      toast({ title: "✅ Notifications activées !", description: "Vous recevrez les alertes commandes." });
                    } else {
                      toast({ title: "❌ Permission refusée", description: "Autorisez les notifications dans votre navigateur.", variant: "destructive" });
                    }
                  } catch {
                    toast({ title: "Erreur", description: "Notifications non supportées.", variant: "destructive" });
                  }
                }}>
                <Bell className="w-4 h-4" />
                Activer les notifications sur cet appareil
              </Button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-yellow-800 mb-1">📱 Pour les notifications mobiles :</p>
                <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Ouvrez la boutique dans Chrome sur votre téléphone</li>
                  <li>Cliquez "Ajouter à l'écran d'accueil"</li>
                  <li>Cliquez le bouton ci-dessus pour activer</li>
                  <li>Vous recevrez les notifications même écran fermé</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Bouton sauvegarder en bas */}
        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-white py-3 text-base font-bold gap-2">
          <Save className="w-5 h-5" />
          {saving ? "Sauvegarde en cours..." : "Sauvegarder les paramètres"}
        </Button>
      </div>
    </AppLayout>
  );
}
