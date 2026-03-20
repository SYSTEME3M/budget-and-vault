import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyAccessCode, verifyUserToken, ensureProfile, setSession, setUserSession } from "@/lib/app-utils";
import { useToast } from "@/hooks/use-toast";
import avatarMale from "@/assets/avatar-male.png";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isAdmin = location.pathname === "/admin-login" || window.location.pathname.includes("admin");

  useEffect(() => {
    ensureProfile();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const userId = params.get("user");

      if (token && userId && !isAdmin) {
        const result = await verifyUserToken(userId, code.trim());
        if (result) {
          setUserSession(userId, result.nom);
          toast({ title: "Accès autorisé", description: `Bienvenue ${result.nom} !` });
          await new Promise(r => setTimeout(r, 100));
          window.location.href = "/dashboard";
        } else {
          toast({ title: "Code incorrect", description: "Veuillez réessayer.", variant: "destructive" });
          setCode("");
        }
      } else {
        const ok = await verifyAccessCode(code.trim());
        if (ok) {
          setSession();
          toast({ title: "Accès autorisé", description: "Bienvenue Eric !" });
          await new Promise(r => setTimeout(r, 100));
          window.location.href = "/dashboard";
        } else {
          toast({ title: "Code incorrect", description: "Veuillez réessayer.", variant: "destructive" });
          setCode("");
        }
      }
    } catch {
      toast({ title: "Erreur", description: "Problème de connexion.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const params = new URLSearchParams(window.location.search);
  const hasUserToken = params.get("token") && params.get("user");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Décorations fond ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-destructive" />
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary opacity-5" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-accent opacity-10" />
      </div>

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">

        {/* ── Carte principale ── */}
        <div className="bg-card border border-border rounded-2xl shadow-brand-lg overflow-hidden">

          {/* ── Header avec avatar ── */}
          <div className="bg-primary px-8 py-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border-2 border-white" />
              <div className="absolute -bottom-4 right-16 w-20 h-20 rounded-full border-2 border-white" />
            </div>
            <div className="relative inline-block mb-3">
              <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mx-auto shadow-brand-lg">
                <img src={avatarMale} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-black text-primary-foreground tracking-wide">
              MES SECRETS
            </h1>
            <p className="text-primary-foreground/70 text-xs mt-1">
              {hasUserToken ? "Connexion utilisateur" : "Application privée • Administrateur"}
            </p>
          </div>

          {/* ── Formulaire ── */}
          <div className="px-7 py-7">
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-primary-bg text-primary px-4 py-2 rounded-full text-sm font-semibold border border-primary/20">
                <Lock className="w-4 h-4" />
                Entrer votre code d'accès
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type={showCode ? "text" : "password"}
                  placeholder="••••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-12 text-center text-xl tracking-[0.4em] font-mono pr-12 border-2 focus:border-primary rounded-xl"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-brand">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Vérification...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Accéder à l'application
                  </span>
                )}
              </Button>
            </form>

            {/* ── Points décoratifs ── */}
            <div className="mt-5 flex justify-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-accent" />
              <div className="w-3 h-3 rounded-full bg-destructive" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Application personnelle et privée • Tous droits réservés
        </p>
      </div>
    </div>
  );
}
