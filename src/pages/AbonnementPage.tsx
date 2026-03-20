import AppLayout from "@/components/AppLayout";
import { BadgeCheck, Zap, Crown, CheckCircle2, Star } from "lucide-react";
import { getNexoraUser } from "@/lib/nexora-auth";
import nexoraLogo from "@/assets/nexora-logo.png";

export default function AbonnementPage() {
  const user = getNexoraUser();
  const isPremium = user?.plan === "premium" || user?.plan === "admin";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="text-center">
          <img src={nexoraLogo} alt="Nexora" className="w-16 h-16 object-contain mx-auto mb-3" />
          <h1 className="font-display text-2xl font-black">Plans & Abonnements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>

        {isPremium && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <BadgeCheck className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-green-700">Vous êtes {user?.plan === "admin" ? "Administrateur" : "Premium"}</div>
              <div className="text-sm text-green-600">Vous bénéficiez de toutes les fonctionnalités.</div>
            </div>
          </div>
        )}

        {/* Plan Gratuit */}
        <div className={`bg-card border-2 rounded-2xl p-6 transition-all ${!isPremium ? "border-primary shadow-brand" : "border-border"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Plan Gratuit
              </h2>
              <p className="text-muted-foreground text-sm">0$ / mois</p>
            </div>
            {!isPremium && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Votre plan</span>
            )}
          </div>
          <ul className="space-y-2 text-sm">
            {[
              "Boutique Nexora Shop",
              "Factures (illimitées)",
              "Coffre-fort (10 comptes max)",
              "Liens & Contacts",
              "Tableau de bord",
              "Historique",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Plan Premium */}
        <div className={`border-2 rounded-2xl p-6 relative overflow-hidden transition-all ${isPremium && user?.plan !== "admin" ? "border-primary bg-primary-bg shadow-brand-lg" : "border-accent bg-accent-bg"}`}>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent fill-accent" /> Plan Premium
                </h2>
                <p className="text-foreground font-black text-2xl">10$ <span className="text-sm font-normal text-muted-foreground">/ mois</span></p>
              </div>
              {isPremium && user?.plan !== "admin" && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">Votre plan</span>
              )}
            </div>
            <ul className="space-y-2 text-sm mb-6">
              {[
                "Tout du plan Gratuit",
                "Coffre-fort illimité",
                "Entrées & Dépenses illimitées",
                "Investissements illimités",
                "Prêts & Dettes illimités",
                "Marché Immobilier (publier)",
                "Badge Premium ✓ sur le profil",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              onClick={() => alert("Paiement en cours d'intégration. Bientôt disponible !")}
            >
              <Zap className="w-4 h-4" /> S'abonner — 10$/mois
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Paiement par Mobile Money et Carte Bancaire (bientôt)
            </p>
          </div>
        </div>

        {/* Plan Admin info */}
        {user?.plan === "admin" && (
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Crown className="w-6 h-6 text-accent flex-shrink-0" />
            <div>
              <div className="font-bold">Accès Administrateur</div>
              <div className="text-sm text-muted-foreground">Toutes les fonctionnalités sont gratuites pour vous.</div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
