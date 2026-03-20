import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, Mail, AtSign, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, validatePassword, initAdminUser, isNexoraAuthenticated } from "@/lib/nexora-auth";
import { useToast } from "@/hooks/use-toast";
import nexoraLogo from "@/assets/nexora-logo.png";

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
    const ready = setTimeout(() => setPageReady(true), 800);
    if (isNexoraAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
    return () => clearTimeout(ready);
  }, []);

  // ── Splash screen
  if (!pageReady) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at center, hsl(217 89% 20%) 0%, hsl(217 89% 10%) 100%)"
        }}>
        <div className="flex flex-col items-center gap-6">
          <img src={nexoraLogo} alt="Nexora"
            className="w-24 h-24 object-contain drop-shadow-2xl animate-pulse" />
          <div className="text-3xl font-black text-white tracking-widest">NEXORA</div>
          <div className="flex gap-4 mt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-yellow-400"
                style={{
                  animation: "bounce 0.7s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`
                }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Login
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
        toast({
          title: `Bienvenue ${result.user.nom_prenom} !`,
          description: result.user.is_admin ? "Connexion administrateur" : "Connexion réussie",
        });
        setTimeout(() => navigate("/dashboard", { replace: true }), 300);
      } else {
        toast({ title: "Erreur de connexion", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Veuillez réessayer.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Register
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
    const pwdCheck = validatePassword(regPassword);
    if (!pwdCheck.valid) {
      toast({ title: "Mot de passe invalide", description: pwdCheck.error, variant: "destructive" });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({ title: "Username invalide", description: "Lettres, chiffres et _ seulement", variant: "destructive" });
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
        toast({ title: "Compte créé !", description: "Vous pouvez maintenant vous connecter." });
        setMode("login");
        setIdentifier(username);
        setNomPrenom(""); setUsername(""); setEmail("");
        setRegPassword(""); setConfirmPassword("");
      } else {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Veuillez réessayer.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 60% 40%, hsl(217 89% 96%) 0%, hsl(217 30% 94%) 100%)"
      }}>

      {/* ── Fond décoratif ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "hsl(217 89% 40%)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "hsl(45 100% 50%)" }} />
        <img src={nexoraLogo} alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-5 object-contain pointer-events-none select-none" />
      </div>

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">

        <div className="bg-card border border-border rounded-2xl shadow-brand-lg overflow-hidden">

          {/* ── Header logo ── */}
          <div className="bg-primary px-6 py-7 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-2 border-white" />
              <div className="absolute -bottom-4 right-16 w-20 h-20 rounded-full border-2 border-white" />
            </div>
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/30 flex items-center justify-center mb-3 overflow-hidden">
                <img src={nexoraLogo} alt="Nexora" className="w-16 h-16 object-contain" />
              </div>
              <h1 className="font-display text-2xl font-black text-white tracking-wide">NEXORA</h1>
              <p className="text-white/70 text-xs mt-1">
                {mode === "login"
                  ? "Connectez-vous à votre espace"
                  : "Créez votre compte Nexora"
                }
              </p>
            </div>
          </div>

          {/* ── Onglets ── */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary bg-primary-bg"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              Se connecter
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === "register"
                  ? "text-primary border-b-2 border-primary bg-primary-bg"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              S'inscrire
            </button>
          </div>

          <div className="px-6 py-6">

            {/* ════════════════════════
                FORMULAIRE CONNEXION
            ════════════════════════ */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Username ou Email
                  </label>
                  <Input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="username ou email@example.com"
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-12"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                    Se souvenir de moi (30 jours)
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Lock className="w-4 h-4" /> Se connecter</>
                  )}
                </Button>

              </form>
            )}

            {/* ════════════════════════
                FORMULAIRE INSCRIPTION
            ════════════════════════ */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-3.5">

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Nom et Prénom *
                  </label>
                  <Input
                    value={nomPrenom}
                    onChange={(e) => setNomPrenom(e.target.value)}
                    placeholder="Jean Dupont"
                    className="h-10"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5" /> Username *
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ""))}
                    placeholder="mon_username"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">Lettres, chiffres et _ uniquement</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email *
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@gmail.com"
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Mot de passe *
                  </label>
                  <div className="relative">
                    <Input
                      type={showRegPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mot de passe sécurisé"
                      className="h-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regPassword && <PasswordStrength password={regPassword} />}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer"
                      className="h-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && regPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Les mots de passe ne correspondent pas.
                    </p>
                  )}
                  {confirmPassword && regPassword === confirmPassword && confirmPassword.length > 0 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Les mots de passe correspondent.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 mt-1">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><ChevronRight className="w-4 h-4" /> Créer mon compte</>
                  )}
                </Button>

              </form>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          NEXORA © {new Date().getFullYear()} — Plateforme sécurisée
        </p>
      </div>
    </div>
  );
}
