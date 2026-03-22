import { useState, useEffect } from "react";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  loginUser,
  registerUser,
  initAdminUser,
  isNexoraAuthenticated,
  validatePassword,
} from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères minimum", ok: password.length >= 8 },
    { label: "Une lettre", ok: /[a-zA-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
    { label: "Un caractère spécial", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  return (
    <div className="mt-1 space-y-1">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1.5 text-xs">
          {check.ok ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={check.ok ? "text-green-600" : "text-muted-foreground"}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NexoraLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [nomPrenom, setNomPrenom] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await initAdminUser();

        if (isNexoraAuthenticated()) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Erreur init:", error);
      } finally {
        if (mounted) {
          setPageReady(true);
        }
      }
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir votre identifiant et votre mot de passe.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        identifier,
        password,
        remember: true,
      });

      if (result.success) {
        toast({ title: "Connexion réussie" });
        navigate("/dashboard", { replace: true });
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur réseau",
        description: "Impossible de se connecter.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomPrenom || !username || !email || !regPassword || !confirmPassword) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    if (regPassword !== confirmPassword) {
      toast({
        title: "Mot de passe incorrect",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    const passwordCheck = validatePassword(regPassword);
    if (!passwordCheck.valid) {
      toast({
        title: "Mot de passe faible",
        description: passwordCheck.error,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        nom_prenom: nomPrenom,
        username,
        email,
        password: regPassword,
      });

      if (result.success) {
        toast({
          title: "Compte créé",
          description: "Vous pouvez maintenant vous connecter.",
        });
        setMode("login");
        setPassword("");
        setRegPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur réseau",
        description: "Impossible de créer le compte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
        <Shield className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="mb-4 text-center text-xl font-bold text-foreground">NEXORA</h1>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email ou username"
                autoComplete="username"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="current-password"
              />
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Connexion..." : "Connexion"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <Input
                value={nomPrenom}
                onChange={(e) => setNomPrenom(e.target.value)}
                placeholder="Nom et prénom"
                autoComplete="name"
              />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
              />
              <Input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mot de passe"
                autoComplete="new-password"
              />
              <PasswordStrength password={regPassword} />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer"
                autoComplete="new-password"
              />
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Création..." : "Créer compte"}
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
