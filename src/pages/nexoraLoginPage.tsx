import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, Mail, AtSign, ChevronRight, CheckCircle2, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, validatePassword, initAdminUser, isNexoraAuthenticated } from "@/lib/nexora-auth";
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
          <span className={c.ok ? "text-green-600" : "text-muted-foreground"}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function NexoraLoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  // Login fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // Register fields
  const [nomPrenom, setNomPrenom] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    initAdminUser();
    
    if (isNexoraAuthenticated()) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setPageReady(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!pageReady) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at center, hsl(217 89% 20%) 0%, hsl(217 89% 10%) 100%)"
        }}>
        <div className="flex flex-col items-center gap-6">
          <Shield className="w-20 h-20 text-yellow-400 animate-pulse" />
          <div className="text-3xl font-black text-white tracking-widest">NEXORA</div>
          <div className="flex gap-4 mt-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className="w-3 h-3 rounded-full bg-yellow-400"
                style={{
                  animation: "bounce 0.7s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`
                }} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast({ title: "Tous les champs sont requis", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser({
        identifier: identifier.trim(),
        password: password.trim(),
        remember,
      });
      if (result.success && result.user) {
        toast({ title: `Bienvenue ${result.user.nom_prenom} !` });
        setTimeout(() => { navigate("/dashboard", { replace: true }); }, 300);
      } else {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
        setPassword("");
      }
    } catch (error) {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPrenom || !username || !email || !regPassword || !confirmPassword) {
      toast({ title: "Tous les champs sont requis", variant: "destructive" });
      return;
    }
    if (regPassword !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await registerUser({
        nom_prenom: nomPrenom.trim(),
        username: username.trim(),
        email: email.trim(),
        password: regPassword,
      });
      if (result.success) {
        toast({ title: "Compte créé !", description: "Connectez-vous." });
        setMode("login");
      } else {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur réseau", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-primary px-6 py-8 text-center text-white">
            <Shield className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
            <h1 className="text-2xl font-black tracking-tight">NEXORA</h1>
            <p className="text-white/70 text-xs mt-1">
              {mode === "login" ? "Accès sécurisé" : "Créer un compte"}
            </p>
          </div>

          <div className="flex border-b">
            <button onClick={() => setMode("login")} className={`flex-1 py-3 text-sm font-bold ${mode === "login" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>Se connecter</button>
            <button onClick={() => setMode("register")} className={`flex-1 py-3 text-sm font-bold ${mode === "register" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>S'inscrire</button>
          </div>

          <div className="px-6 py-6">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username ou Email" disabled={loading} />
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" disabled={loading} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">Connexion</Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <Input value={nomPrenom} onChange={(e) => setNomPrenom(e.target.value)} placeholder="Nom Complet" disabled={loading} />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" disabled={loading} />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={loading} />
                <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Mot de passe" disabled={loading} />
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer" disabled={loading} />
                <Button type="submit" disabled={loading} className="w-full">S'inscrire</Button>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}
