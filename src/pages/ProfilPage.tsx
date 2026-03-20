import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword } from "@/lib/nexora-auth";
import { playSuccessSound } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Key, Camera, Save, Mail, AtSign, BadgeCheck, Crown, Zap } from "lucide-react";
import { getNexoraUser, isNexoraAuthenticated } from "@/lib/nexora-auth";
import { Link } from "react-router-dom";
import nexoraLogo from "@/assets/nexora-logo.png";

export default function ProfilPage() {
  const nexoraUser = getNexoraUser();
  const [nom, setNom] = useState(nexoraUser?.nom_prenom || "");
  const [email, setEmail] = useState(nexoraUser?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(nexoraUser?.avatar_url || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const hasBadge = nexoraUser?.badge_premium || nexoraUser?.is_admin;
  const isPremium = nexoraUser?.plan === "premium" || nexoraUser?.plan === "admin";

  const handleSaveProfile = async () => {
    if (!nexoraUser) return;
    setSaving(true);
    const { error } = await supabase
      .from("nexora_users" as any)
      .update({ nom_prenom: nom, email, avatar_url: avatarUrl || null })
      .eq("id", nexoraUser.id);
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    playSuccessSound();
    toast({ title: "Profil mis à jour !" });
    // Update local storage
    const stored = localStorage.getItem("nexora_current_user") || sessionStorage.getItem("nexora_current_user");
    if (stored) {
      const user = JSON.parse(stored);
      const updated = { ...user, nom_prenom: nom, email, avatar_url: avatarUrl || null };
      if (localStorage.getItem("nexora_current_user")) localStorage.setItem("nexora_current_user", JSON.stringify(updated));
      else sessionStorage.setItem("nexora_current_user", JSON.stringify(updated));
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `avatars/${nexoraUser?.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erreur upload", variant: "destructive" }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast({ title: "Photo téléversée !" });
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({ title: "Remplissez tous les champs", variant: "destructive" }); return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Les mots de passe ne correspondent pas", variant: "destructive" }); return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Minimum 8 caractères", variant: "destructive" }); return;
    }
    if (!nexoraUser) return;
    const oldHash = await hashPassword(oldPassword);
    const { data: check } = await supabase
      .from("nexora_users" as any)
      .select("id")
      .eq("id", nexoraUser.id)
      .eq("password_hash", oldHash)
      .maybeSingle();
    if (!check) { toast({ title: "Ancien mot de passe incorrect", variant: "destructive" }); return; }
    const newHash = await hashPassword(newPassword);
    await supabase.from("nexora_users" as any).update({ password_hash: newHash }).eq("id", nexoraUser.id);
    playSuccessSound();
    toast({ title: "Mot de passe modifié !" });
    setOldPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  const avatarDisplay = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nom)}&background=1a56db&color=fff&size=128`;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        <h1 className="font-display font-bold text-xl flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Mon Profil
        </h1>

        {/* Carte profil */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-brand">
                <img src={avatarDisplay} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <label htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-light transition-colors shadow-sm border-2 border-card">
                <Camera className="w-4 h-4 text-accent-foreground" />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <div className="font-display font-bold text-lg flex items-center gap-2">
                {nom}
                {hasBadge && <BadgeCheck className="w-5 h-5 text-primary" />}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {email}
              </div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {nexoraUser?.is_admin && (
                  <span className="text-xs bg-primary-bg text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Administrateur
                  </span>
                )}
                {isPremium && (
                  <span className="text-xs bg-yellow-50 text-yellow-700 font-semibold px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Badge Premium ✓
                  </span>
                )}
                {!isPremium && (
                  <span className="text-xs bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded-full border border-border">
                    Plan Gratuit
                  </span>
                )}
              </div>
              {uploading && <div className="text-xs text-primary mt-1 animate-pulse">Téléversement...</div>}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <AtSign className="w-4 h-4" /> Nom complet
              </label>
              <Input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre nom" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> Email
              </label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> URL photo de profil
              </label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-primary text-primary-foreground gap-2">
              <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Sauvegarder le profil"}
            </Button>
          </div>
        </div>

        {/* Abonnement */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-5 text-primary-foreground flex items-center gap-4">
            <Zap className="w-10 h-10 text-accent flex-shrink-0" />
            <div className="flex-1">
              <div className="font-bold">Passez au Premium</div>
              <div className="text-sm text-primary-foreground/80">Toutes les fonctionnalités + Badge ✓ sur votre profil</div>
            </div>
            <Link to="/abonnement" className="bg-accent text-accent-foreground font-bold text-sm px-4 py-2 rounded-lg flex-shrink-0">
              Voir les plans
            </Link>
          </div>
        )}

        {/* Changer mot de passe */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold flex items-center gap-2 text-base">
              <Key className="w-5 h-5 text-primary" /> Changer le mot de passe
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Haché avec SHA-256 + sel sécurisé.</p>
          </div>
          <div className="space-y-3">
            <Input type="password" placeholder="Ancien mot de passe" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
            <Input type="password" placeholder="Nouveau mot de passe (min 8 car.)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <Input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <Button onClick={handleChangePassword} className="w-full bg-primary text-primary-foreground gap-2">
              <Key className="w-4 h-4" /> Modifier le mot de passe
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
