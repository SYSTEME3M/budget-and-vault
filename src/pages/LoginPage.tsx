import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { verifyAccessCode, ensureProfile, setSession } from "@/lib/app-utils";
import { useToast } from "@/hooks/use-toast";

const PROFILE_PHOTO = "https://i.ibb.co/pvMbk9MY/1771882604239.jpg";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    ensureProfile();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const ok = await verifyAccessCode(code.trim());
      if (ok) {
        setSession();
        toast({ title: "✅ Accès autorisé", description: "Bienvenue Eric !" });
        navigate("/dashboard");
      } else {
        toast({ title: "❌ Code incorrect", description: "Veuillez réessayer.", variant: "destructive" });
        setCode("");
      }
    } catch {
      toast({ title: "Erreur", description: "Problème de connexion.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background décor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary opacity-5" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary opacity-5" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        {/* Card principale */}
        <div className="bg-card border border-border rounded-2xl shadow-brand-lg overflow-hidden">
          {/* Header bleu */}
          <div className="bg-primary px-8 py-10 text-center relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-6 w-16 h-16 rounded-full border-2 border-white" />
              <div className="absolute bottom-2 right-6 w-10 h-10 rounded-full border-2 border-white" />
            </div>
            {/* Photo profil */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mx-auto shadow-brand-lg">
                <img
                  src={PROFILE_PHOTO}
                  alt="Eric Kpakpo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent-foreground" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">MES SECRETS</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Application privée de Eric Kpakpo</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-primary-bg text-primary px-4 py-2 rounded-full text-sm font-semibold">
                <Lock className="w-4 h-4" />
                Entrer votre code d'accès
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Input
                  type={showCode ? "text" : "password"}
                  placeholder="Code d'accès..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-12 text-center text-lg tracking-widest font-mono pr-12 border-2 focus:border-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
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

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ERIC KPAKPO</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="mt-4 flex justify-center gap-4">
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
