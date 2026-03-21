import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser, isNexoraAdmin, hasNexoraPremium, hasNexoraBoss, hasNexoraRoi, getPlanLabel } from "@/lib/nexora-auth";
import { BadgeCheck, Zap, Crown, CheckCircle2, X, CreditCard, Smartphone, Star, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window { openKkiapayWidget: (o: Record<string, unknown>) => void; }
}

const KKIAPAY_KEY = "f19f84bbf2bbe4249947974bc0929691d3afd5ae";

const PLANS = [
  {
    id: "gratuit", label: "Gratuit", price: 0, priceLabel: "0$",
    color: "#6b7280", gradient: "from-gray-500 to-gray-600",
    icon: Shield,
    features: [
      { label: "5 factures maximum",        ok: true  },
      { label: "5 prêts/dettes maximum",    ok: true  },
      { label: "2 épargnes maximum",        ok: true  },
      { label: "Coffre-fort (10 comptes)",  ok: true  },
      { label: "Liens & Contacts",          ok: true  },
      { label: "Tableau de bord",           ok: true  },
      { label: "Boutique",                  ok: false },
      { label: "Marché Immobilier",         ok: false },
      { label: "Badge premium",             ok: false },
    ],
  },
  {
    id: "boss", label: "BOSS", price: 10, priceLabel: "10$",
    color: "#f59e0b", gradient: "from-yellow-500 to-orange-500",
    badge: "Populaire",
    icon: Star,
    features: [
      { label: "50 factures par mois",         ok: true  },
      { label: "20 prêts/dettes",              ok: true  },
      { label: "10 épargnes",                  ok: true  },
      { label: "Coffre-fort (100 comptes)",    ok: true  },
      { label: "Boutique (20 produits min)",   ok: true  },
      { label: "Entrées & Dépenses",           ok: true  },
      { label: "Badge BOSS",                   ok: true  },
      { label: "Marché Immobilier",            ok: false },
      { label: "Produits illimités",           ok: false },
    ],
  },
  {
    id: "roi", label: "ROI", price: 20, priceLabel: "20$",
    color: "#8b5cf6", gradient: "from-violet-600 to-purple-700",
    badge: "Tout illimité",
    icon: Crown,
    features: [
      { label: "Factures illimitées",       ok: true },
      { label: "Prêts/dettes illimités",    ok: true },
      { label: "Épargnes illimitées",       ok: true },
      { label: "Coffre-fort illimité",      ok: true },
      { label: "Boutique illimitée",        ok: true },
      { label: "Marché Immobilier",         ok: true },
      { label: "Entrées & Dépenses",        ok: true },
      { label: "Badge ROI premium",         ok: true },
      { label: "Support prioritaire",       ok: true },
    ],
  },
];

export default function AbonnementPage() {
  const user      = getNexoraUser();
  const isAdmin   = isNexoraAdmin();
  const isBoss    = hasNexoraBoss && hasNexoraBoss();
  const isRoi     = hasNexoraRoi && hasNexoraRoi();
  const { toast } = useToast();
  const [kkiapayReady, setKkiapayReady] = useState(false);
  const [subscribing, setSubscribing]   = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById("kkiapay-sdk")) { setKkiapayReady(true); return; }
    const s = document.createElement("script");
    s.id = "kkiapay-sdk";
    s.src = "https://cdn.kkiapay.me/k.js";
    s.async = true;
    s.onload = () => setKkiapayReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", "/abonnement");
      toast({ title: "Paiement reçu !", description: "Votre abonnement sera activé sous peu." });
    }
  }, []);

  const handleSubscribe = (planId: string, price: number) => {
    if (!user?.id) { toast({ title: "Connectez-vous d'abord", variant: "destructive" }); return; }
    if (!kkiapayReady || !window.openKkiapayWidget) {
      toast({ title: "Paiement en chargement...", description: "Réessayez dans 2 secondes." }); return;
    }
    setSubscribing(planId);
    window.openKkiapayWidget({
      amount: price * 620,
      key: KKIAPAY_KEY,
      sandbox: false,
      email: user.email ?? "",
      data: JSON.stringify({ userId: user.id, plan: planId }),
      callback: `${window.location.origin}/abonnement?payment=success`,
      theme: planId === "boss" ? "#f59e0b" : "#8b5cf6",
    });
    setTimeout(() => setSubscribing(null), 3000);
  };

  const currentPlan = isAdmin ? "admin" : (user?.plan ?? "gratuit");

  const isCurrentPlan = (planId: string) => {
    if (isAdmin) return planId === "roi";
    if (planId === "boss") return currentPlan === "boss";
    if (planId === "roi")  return currentPlan === "roi";
    return currentPlan === "gratuit";
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">

        {/* En-tête */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Plans & Abonnements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            1$ = 620 FCFA · Paiement sécurisé via KKiaPay
          </p>
        </div>

        {/* Bannière Admin */}
        {isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-amber-700">Accès Administrateur — Tout illimité</div>
              <div className="text-sm text-amber-600">Toutes les fonctionnalités sont gratuites et permanentes.</div>
            </div>
          </div>
        )}

        {/* Bannière plan actif */}
        {!isAdmin && currentPlan !== "gratuit" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <BadgeCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-green-700">
                Plan {currentPlan === "boss" ? "BOSS" : "ROI"} actif ✓
              </div>
              <div className="text-sm text-green-600">Vous bénéficiez de tous les avantages de votre plan.</div>
            </div>
          </div>
        )}

        {/* Grille des plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const active = isCurrentPlan(plan.id);
            const Icon   = plan.icon;
            return (
              <div key={plan.id}
                className={`relative rounded-2xl border-2 overflow-hidden transition-all duration-200 bg-card ${
                  active ? "shadow-xl scale-[1.02]" : "border-border shadow-sm hover:shadow-md"
                }`}
                style={{ borderColor: active ? plan.color : undefined }}>

                {/* Badge */}
                {"badge" in plan && plan.badge && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white"
                      style={{ background: plan.color }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-5">
                  {/* Icône */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Titre & prix */}
                  <div className="font-black text-xl" style={{ color: active ? plan.color : undefined }}>
                    {plan.label}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-foreground">{plan.priceLabel}</span>
                    <span className="text-sm text-muted-foreground">/mois</span>
                  </div>
                  {plan.price > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      = {(plan.price * 620).toLocaleString("fr-FR")} FCFA/mois
                    </div>
                  )}

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {plan.features.map(f => (
                      <li key={f.label} className="flex items-center gap-2 text-xs">
                        {f.ok
                          ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
                          : <X className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />}
                        <span className={f.ok ? "text-foreground" : "text-muted-foreground/40 line-through"}>
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Bouton */}
                  <div className="mt-5">
                    {active || (isAdmin && plan.id === "roi") ? (
                      <div className="w-full py-2.5 rounded-xl text-center text-sm font-bold"
                        style={{ background: `${plan.color}20`, color: plan.color }}>
                        {isAdmin ? "Gratuit Admin ✓" : "Plan actuel ✓"}
                      </div>
                    ) : plan.id === "gratuit" ? (
                      <div className="w-full py-2.5 rounded-xl text-center text-sm text-muted-foreground bg-muted">
                        Plan de base
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.id, plan.price)}
                        disabled={!kkiapayReady || subscribing === plan.id}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:opacity-90"
                        style={{
                          background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                          boxShadow: `0 4px 15px ${plan.color}40`,
                        }}>
                        {subscribing === plan.id
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><Zap className="w-4 h-4" /> S'abonner — {plan.priceLabel}/mois</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Moyens de paiement */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3 text-foreground">Moyens de paiement acceptés</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Smartphone className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">Mobile Money</p>
                <p className="text-xs text-muted-foreground">MTN, Moov, Wave, Orange</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">Carte bancaire</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Paiement 100% sécurisé · 1$ = 620 FCFA · Support : erickpakpo786@gmail.com
          </p>
        </div>

      </div>
    </AppLayout>
  );
}
