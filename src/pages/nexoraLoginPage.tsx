import { useState, useEffect } from "react";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, initAdminUser, isNexoraAuthenticated } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères minimum", ok: password.length >= 8 },
    { label: "Une lettre", ok: /[a-zA-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
    { label: "Un caractère spécial", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  return (
    <div className="mt-1 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          {c.ok ? (
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          ) : (
            <XCircle className="w-3 h-3 text-muted-foreground" />
          )}
          <span className={c.ok ? "text-green-600" : "text-muted-foreground"}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function NexoraLoginPage() {
  const navigate = useNavigate(); // ✅ Vite router

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

  const { toast } = useToast();

  useEffect(() => {
    try {
      initAdminUser();

      if (isNexoraAuthenticated()) {
        navigate("/dashboard");
        return;
      }
    } catch (error) {
      console.error("Erreur init:", error);
    }

    const timer = setTimeout(() => {
      setPageReady(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (!pageReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
        <Shield className="w-16 h-16 animate-pulse text-yellow-400" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast({ title: "Champs requis", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        identifier,
        password,
      });

      if (result.success) {
        toast({ title: "Connexion réussie" });
        navigate("/dashboard"); // ✅ Vite navigation
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Erreur réseau", variant: "destructive" });
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomPrenom || !username || !email || !regPassword || !confirmPassword) {
      toast({ title: "Champs requis", variant: "destructive" });
      return;
    }

    if (regPassword !== confirmPassword) {
      toast({ title: "Mot de passe incorrect", variant: "destructive" });
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
        toast({ title: "Compte créé" });
        setMode("login");
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Erreur réseau", variant: "destructive" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="border rounded-xl p-6 shadow">
          <h1 className="text-xl font-bold mb-4 text-center">NEXORA</h1>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email ou username"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
              />
              <Button className="w-full" disabled={loading}>
                Connexion
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <Input value={nomPrenom} onChange={(e) => setNomPrenom(e.target.value)} placeholder="Nom" />
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mot de passe" />
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer" />
              <Button className="w-full">Créer compte</Button>
            </form>
          )}

          <div className="text-center mt-4 text-sm">
            <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
