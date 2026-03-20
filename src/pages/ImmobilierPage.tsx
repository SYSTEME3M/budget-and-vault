import AppLayout from "@/components/AppLayout";
import { MapPin, Home, Zap, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { getNexoraUser } from "@/lib/nexora-auth";

export default function ImmobilierPage() {
  const user = getNexoraUser();
  const hasPremium = user?.plan === "premium" || user?.plan === "admin";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-brand-lg">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full border-2 border-white" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-8 h-8 text-accent" />
              <h1 className="font-display text-2xl font-black">Marché Immobilier</h1>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Publiez et découvrez des biens immobiliers — maisons, terrains, appartements, boutiques.
            </p>
          </div>
        </div>

        {!hasPremium ? (
          /* Accès Premium requis pour publier */
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black">Publication réservée aux membres Premium</h2>
            <p className="text-muted-foreground text-sm">
              Pour publier des annonces immobilières, vous devez activer un abonnement Premium.
              La consultation des annonces est gratuite.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                to="/abonnement"
                className="bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Passer au Premium — 10$/mois
              </Link>
            </div>
          </div>
        ) : (
          /* Accès complet pour les membres premium */
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Home className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-bold">Espace Immobilier</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Fonctionnalité en développement. Bientôt disponible !
            </p>
          </div>
        )}

        {/* Annonces publiques */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Les annonces immobilières seront affichées ici.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
