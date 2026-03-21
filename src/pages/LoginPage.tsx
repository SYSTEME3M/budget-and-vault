cat > /home/claude/budget-and-vault-fixed/src/pages/NexoraLoginPage.tsx << 'ENDOFFILE'
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, Mail, AtSign, ArrowRight, CheckCircle2, XCircle, Sparkles, Crown, Star, Shield } from "lucide-react";
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
    { label: "Une lettre",           ok: /[a-zA-Z]/.test(password) },
    { label: "Un chiffre",           ok: /[0-9]/.test(password) },
    { label: "Un caractère spécial", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-white/10"}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.ok
              ? <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
              : <XCircle     className="w-3 h-3 text-white/30 flex-shrink-0" />
            }
            <span className={c.ok ? "text-green-300" : "text-white/40"}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NexoraLoginPage() {
  const [mode, setMode]           = useState<Mode>("login");
  const [loading, setLoading]     = useState(false);
  const [pageReady, setPageReady] = useState(false);

  const [identifier, setIdentifier]         = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [remember, setRemember]             = useState(false);

  const [nomPrenom, setNomPrenom]           = useState("");
  const [username, setUsername]             = useState("");
  const [email, setEmail]                   = useState("");
  const [regPassword, setRegPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    initAdminUser();
    if (isNexoraAuthenticated()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const t = setTimeout(() => setPageReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Splash
  if (!pageReady) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(ellipse at center, #0d2d6b 0%, #020617 100%)" }}>
        <div className="flex flex-col items-center gap-5">
          <img src={nexoraLogo} alt="Nexora" className="w-20 h-20 object-contain animate-pulse drop-shadow-2xl" />
          <div className="text-3xl font-black text-white tracking-[0.3em]">NEXORA</div>
          <div className="flex gap-3 mt-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-4 h-4 rounded-full bg-yellow-400"
                style={{ animation: "bounce 0.7s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast({ title: "Tous les champs sont requis", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const result = await loginUser({ identifier: identifier.trim(), password: password.trim(), remember });
      if (result.success && result.user) {
        toast({ title: `Bienvenue ${result.user.nom_prenom.split(" ")[0]} !`, description: result.user.is_admin ? "Connexion administrateur" : "Connexion réussie ✓" });
        navigate("/dashboard", { replace: true });
      } else {
        toast({ title: "Échec de connexion", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Veuillez réessayer.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPrenom.trim() || !username.trim() || !email.trim() || !regPassword || !confirmPassword) {
      toast({ title: "Tous les champs sont requis", variant: "destructive" }); return;
    }
    if (regPassword !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" }); return;
    }
    const v = validatePassword(regPassword);
    if (!v.valid) { toast({ title: "Mot de passe invalide", description: v.error, variant: "destructive" }); return; }

    setLoading(true);
    try {
      const result = await registerUser({ nom_prenom: nomPrenom.trim(), username: username.trim(), email: email.trim(), password: regPassword });
      if (result.success) {
        toast({ title: "Compte créé avec succès !", description: "Vous pouvez maintenant vous connecter." });
        setMode("login");
        setIdentifier(username.trim());
      } else {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur réseau", description: "Veuillez réessayer.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex"
      style={{ background: "radial-gradient(ellipse at 60% 30%, #0d2d6b 0%, #061530 50%, #020617 100%)" }}>

      {/* Panneau gauche — Branding (desktop) */}
      <div className="hidden lg:flex w-[480px] flex-shrink-0 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
        </div>
        <div className="relative flex flex-col items-center gap-8 text-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-white/10 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)" }}>
            <img src={nexoraLogo} alt="Nexora" className="w-16 h-16 object-contain" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-widest">NEXORA</h1>
            <p className="text-white/50 mt-2 text-sm tracking-wider">Votre univers financier intelligent</p>
          </div>
          <div className="flex flex-col gap-3 w-full mt-4">
            {[
              { icon: Crown,    label: "Plans BOSS & ROI",          sub: "Fonctionnalités adaptées à vos besoins", color: "#f59e0b" },
              { icon: Shield,   label: "Données sécurisées",         sub: "Chaque compte isolé et protégé",         color: "#3b82f6" },
              { icon: Sparkles, label: "Boutique & Épargnes",        sub: "Gérez vos finances et ventes",           color: "#10b981" },
              { icon: Star,     label: "Panel Admin complet",        sub: "Contrôle total de la plateforme",        color: "#8b5cf6" },
            ].map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{label}</div>
                  <div className="text-white/40 text-xs">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulaire droite */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <img src={nexoraLogo} alt="Nexora" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-black text-white tracking-widest">NEXORA</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {(["login","register"] as Mode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-4 text-sm font-bold tracking-wide transition-all duration-200 ${mode === m
                    ? "text-white border-b-2 border-yellow-400"
                    : "text-white/40 hover:text-white/70"
                  }`}>
                  {m === "login" ? "Connexion" : "Créer un compte"}
                </button>
              ))}
            </div>

            <div className="p-7">
              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                      Identifiant ou email
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                        placeholder="username ou email"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded accent-yellow-400" />
                    <label htmlFor="remember" className="text-xs text-white/50 cursor-pointer">Rester connecté</label>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 mt-2"
                    style={{ background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #1d4ed8, #3b82f6)", color: "white", boxShadow: "0 4px 20px rgba(59,130,246,0.3)" }}>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><span>Se connecter</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3">
                  {[
                    { label: "Nom complet",        icon: User,  value: nomPrenom,  set: setNomPrenom,  type: "text",  placeholder: "Prénom Nom" },
                    { label: "Nom d'utilisateur",  icon: AtSign,value: username,   set: setUsername,   type: "text",  placeholder: "username" },
                    { label: "Adresse email",      icon: Mail,  value: email,      set: setEmail,      type: "email", placeholder: "exemple@email.com" },
                  ].map(({ label, icon: Icon, value, set, type, placeholder }) => (
                    <div key={label}>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input type={type} value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type={showRegPassword ? "text" : "password"} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {regPassword && <PasswordStrength password={regPassword} />}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Confirmer</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none"
                        style={{ background: confirmPassword && confirmPassword !== regPassword ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)", border: confirmPassword && confirmPassword !== regPassword ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.1)" }} />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== regPassword && (
                      <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 mt-2"
                    style={{ background: loading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #059669, #10b981)", color: "white", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>Créer mon compte</span><Sparkles className="w-4 h-4" /></>
                    }
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Plans aperçu */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { label: "Gratuit",  price: "0$",  color: "#6b7280" },
              { label: "BOSS",     price: "10$", color: "#f59e0b" },
              { label: "ROI",      price: "20$", color: "#8b5cf6" },
            ].map(({ label, price, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30` }}>
                <span className="text-xs font-bold" style={{ color }}>{label}</span>
                <span className="text-white/40 text-xs">{price}/mois</span>
              </div>
            ))}
          </div>

          <p className="text-center text-white/20 text-xs mt-4">
            NEXORA © {new Date().getFullYear()} — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
ENDOFFILE
echo "OK"
Sortie

OK
