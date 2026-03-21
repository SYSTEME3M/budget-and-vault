"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { getNexoraUser, isNexoraAdmin, hasNexoraPremium } from "@/lib/nexora-auth";
import { BadgeCheck, Zap, Crown, CheckCircle2, Star, CreditCard, Smartphone, X } from "lucide-react";

declare global {
  interface Window {
    openKkiapayWidget: (options: Record<string, unknown>) => void;
  }
}

const KKIAPAY_KEY = "f19f84bbf2bbe4249947974bc0929691d3afd5ae";

export default function AbonnementPage() {
  const user = getNexoraUser();
  const isAdmin = isNexoraAdmin();
  const isPremium = hasNexoraPremium();
  const [kkiapayReady, setKkiapayReady] = useState(false);

  // Charger le SDK KKiaPay
  useEffect(() => {
    if (document.getElementById("kkiapay-sdk")) {
      setKkiapayReady(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "kkiapay-sdk";
    script.src = "https://cdn.kkiapay.me/k.js";
    script.async = true;
    script.onload = () => setKkiapayReady(true);
    script.onerror = () => console.error("Échec du chargement KKiaPay SDK");
    document.body.appendChild(script);
  }, []);

  // Détecter retour après paiement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      window.history.replaceState({}, "", "/abonnement");
      window.location.reload();
    }
  }, []);

  const handleSubscribe = () => {
    if (!user?.id) {
      alert("Vous devez être connecté pour vous abonner.");
      return;
    }
    if (!kkiapayReady || !window.openKkiapayWidget) {
      alert("Paiement en cours de chargement, réessayez dans 2 secondes.");
      return;
    }
    window.openKkiapayWidget({
      amount: 6500,
      key: KKIAPAY_KEY,
      sandbox: false,
      email: user.email ?? "",
      data: JSON.stringify({ userId: user.id }),
      callback: `${window.location.origin}/abonnement?payment=success`,
      theme: "#7c3aed",
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">

        {/* ── En-tête ── */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Plans & Abonnements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>

        {/* ── Bannière Admin ── */}
        {isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-amber-700 flex items-center gap-2">
                Accès Administrateur
                <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" /> Admin
                </span>
              </div>
              <div className="text-sm text-amber-600">
                Toutes les fonctionnalités sont gratuites et illimitées pour vous.
              </div>
            </div>
          </div>
        )}

        {/* ── Bannière Premium actif ── */}
        {isPremium && !isAdmin && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <BadgeCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-green-700 flex items-center gap-2">
                Vous êtes Premium
                <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3" /> Premium
                </span>
              </div>
              <div className="text-sm text-green-600">
                Vous bénéficiez de toutes les fonctionnalités illimitées.
              </div>
            </div>
          </div>
        )}

        {/* ── Plan Gratuit ── */}
        <div className={`bg-white border-2 rounded-2xl p-6 transition-all shadow-sm ${
          !isPremium && !isAdmin ? "border-violet-500 shadow-violet-100" : "border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-lg flex items-center gap-2 text-gray-900">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Plan Gratuit
              </h2>
              <p className="text-gray-500 text-sm font-semibold">0$ / mois</p>
            </div>
            {!isPremium && !isAdmin && (
              <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Votre plan actuel
              </span>
            )}
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Inclus</p>
          <ul className="space-y-2.5 text-sm mb-5">
            {[
              { label: "Factures",         desc: "5 factures maximum",             badge: "5 max",    badgeColor: "bg-orange-100 text-orange-700" },
              { label: "Coffre-fort",      desc: "10 comptes maximum",             badge: "10 max",   badgeColor: "bg-orange-100 text-orange-700" },
              { label: "Liens & Contacts", desc: "Sans limite",                    badge: "Illimité", badgeColor: "bg-green-100 text-green-700" },
              { label: "Tableau de bord",  desc: "Vue d'ensemble de vos finances", badge: null,       badgeColor: "" },
              { label: "Historique",       desc: "Consulter l'historique",         badge: null,       badgeColor: "" },
            ].map((f) => (
              <li key={f.label} className="flex items-start gap-2 text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="font-medium text-gray-700">{f.label}</span>
                    <span className="text-gray-400"> — {f.desc}</span>
                  </div>
                  {f.badge && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${f.badgeColor}`}>
                      {f.badge}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Non inclus</p>
          <ul className="space-y-2 text-sm">
            {[
              "Boutique (Premium uniquement)",
              "Entrées & Dépenses",
              "Investissements",
              "Prêts & Dettes",
              "Médias",
              "Marché Immobilier",
              "Badge Premium",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-gray-400">
                <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="line-through">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Plan Premium ── */}
        <div className={`border-2 rounded-2xl p-6 relative overflow-hidden transition-all ${
          isPremium && !isAdmin
            ? "border-violet-500 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-lg shadow-violet-100"
            : "border-violet-200 bg-gradient-to-br from-violet-50/50 to-indigo-50/50"
        }`}>
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-violet-200/30 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-indigo-200/30 rounded-full" />

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-lg flex items-center gap-2 text-gray-900">
                  <Star className="w-5 h-5 text-violet-600 fill-violet-600" />
                  Plan Premium
                </h2>
                <p className="text-gray-900 font-black text-2xl mt-0.5">
                  10$
                  <span className="text-sm font-normal text-gray-500"> / mois</span>
                </p>
              </div>
              {isPremium && !isAdmin && (
                <span className="bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Votre plan actuel
                </span>
              )}
              {isAdmin && (
                <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Gratuit Admin
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Tout inclus — Illimité
            </p>

            <ul className="space-y-2.5 text-sm mb-6">
              {[
                { label: "Factures illimitées",           desc: "Aucune limite" },
                { label: "Coffre-fort illimité",          desc: "Aucune limite de comptes" },
                { label: "Liens & Contacts illimités",    desc: "Sans limite" },
                { label: "Boutique complète",             desc: "Créer et gérer votre boutique" },
                { label: "Entrées & Dépenses illimitées", desc: "Suivi financier complet" },
                { label: "Investissements illimités",     desc: "Gérer tous vos investissements" },
                { label: "Prêts & Dettes illimités",      desc: "Suivre tous vos prêts" },
                { label: "Médias illimités",              desc: "Stocker tous vos fichiers" },
                { label: "Marché Immobilier",             desc: "Publier des annonces immobilières" },
                { label: "Badge Premium sur le profil",   desc: "Badge vert visible partout" },
              ].map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800">{f.label}</span>
                    <span className="text-gray-500"> — {f.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── Bouton abonnement ── */}
            {!isPremium && !isAdmin && (
              <div className="space-y-3">
                <button
                  onClick={handleSubscribe}
                  disabled={!kkiapayReady}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <Zap className="w-4 h-4" />
                  {kkiapayReady ? "S'abonner — 10$ / mois" : "Chargement..."}
                </button>

                <div className="bg-white/70 rounded-xl p-3 border border-violet-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2 text-center">
                    Moyens de paiement disponibles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100">
                      <Smartphone className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-700">Mobile Money</p>
                        <p className="text-xs text-gray-400">MTN, Wave, Orange...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100">
                      <CreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-700">Carte Bancaire</p>
                        <p className="text-xs text-gray-400">Visa, Mastercard...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Abonnement actif ── */}
            {isPremium && !isAdmin && (
              <div className="bg-white/70 rounded-xl p-3 border border-green-200 text-center">
                <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  Abonnement actif — Merci pour votre confiance !
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Note admin ── */}
        {isAdmin && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              En tant qu'administrateur, vous avez accès à toutes les fonctionnalités
              gratuitement et de façon permanente.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
