import { useState, useEffect } from "react";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, initAdminUser, isNexoraAuthenticated } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register";

export default function NexoraLoginPage() {
  const navigate = useNavigate();
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
      if (isNexoraAuthenticated()) { navigate("/dashboard"); return; }
    } catch {}
    setTimeout(() => setPageReady(true), 800);
  }, []);

  if (!pageReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-primary text-primary-foreground">
        <Shield className="w-16 h-16 animate-pulse text-accent" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) { toast({ title: "Champs requis", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const result = await loginUser({ identifier, password });
      if (result.success) { toast({ title: "Connexion réussie" }); navigate("/dashboard"); }
      else { toast({ title: "Erreur", description: result.error, variant: "destructive" }); }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPrenom || !username || !email || !regPassword || !confirmPassword) { toast({ title: "Champs requis", variant: "destructive" }); return; }
    if (regPassword !== confirmPassword) { toast({ title: "Mots de passe différents", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const result = await registerUser({ nom_prenom: nomPrenom, username, email, password: regPassword });
      if (result.success) { toast({ title: "Compte créé" }); setMode("login"); }
      else { toast({ title: "Erreur", description: result.error, variant: "destructive" }); }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-xl p-6 shadow-brand">
          <h1 className="text-xl font-display font-bold mb-4 text-center text-primary">NEXORA</h1>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Input value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="Email ou username" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" />
              <Button className="w-full" disabled={loading}>Connexion</Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <Input value={nomPrenom} onChange={e => setNomPrenom(e.target.value)} placeholder="Nom complet" />
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
              <Input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Mot de passe" />
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmer" />
              <Button className="w-full" disabled={loading}>Créer compte</Button>
            </form>
          )}
          <div className="text-center mt-4 text-sm">
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-primary hover:underline">
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
