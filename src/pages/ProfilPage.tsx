import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hashCode, playSuccessSound } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Key, Camera, Save, Mail, AtSign } from "lucide-react";

export default function ProfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [oldCode, setOldCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").limit(1).single();
    if (data) {
      setProfile(data);
      setNom(data.nom || "Eric Kpakpo");
      setEmail(data.email || "erickpakpo786@gmail.com");
      setAvatarUrl(data.avatar_url || "https://i.ibb.co/pvMbk9MY/1771882604239.jpg");
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nom, email, avatar_url: avatarUrl }).eq("id", profile.id);
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    playSuccessSound();
    toast({ title: "✅ Profil mis à jour !" });
    loadProfile();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Erreur upload", variant: "destructive" }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
    toast({ title: "✅ Photo téléversée !" });
  };

  const handleChangeCode = async () => {
    if (!oldCode || !newCode || !confirmCode) { toast({ title: "Remplissez tous les champs", variant: "destructive" }); return; }
    if (newCode !== confirmCode) { toast({ title: "Les codes ne correspondent pas", variant: "destructive" }); return; }
    if (newCode.length < 4) { toast({ title: "Code trop court (min 4 caractères)", variant: "destructive" }); return; }
    const oldHash = await hashCode(oldCode);
    if (oldHash !== profile?.access_code_hash) { toast({ title: "Ancien code incorrect", variant: "destructive" }); return; }
    const newHash = await hashCode(newCode);
    const { error } = await supabase.from("profiles").update({ access_code_hash: newHash }).eq("id", profile.id);
    if (error) { toast({ title: "Erreur", variant: "destructive" }); return; }
    playSuccessSound();
    toast({ title: "✅ Code d'accès modifié !", description: "Reconnectez-vous avec votre nouveau code." });
    setOldCode(""); setNewCode(""); setConfirmCode("");
  };

  const avatarDisplay = avatarUrl || "https://i.ibb.co/pvMbk9MY/1771882604239.jpg";

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        <h1 className="font-display font-bold text-xl flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Mon Profil
        </h1>

        {/* Photo & infos */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          {/* Avatar section */}
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
              <div className="font-display font-bold text-lg">{nom || "Eric Kpakpo"}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" /> {email}
              </div>
              <div className="mt-1">
                <span className="text-xs bg-primary-bg text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">Administrateur</span>
              </div>
              {uploading && <div className="text-xs text-primary mt-1 animate-pulse">Téléversement en cours...</div>}
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
                <Camera className="w-4 h-4" /> URL photo de profil (ou téléversez ci-dessus)
              </label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
              {avatarUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={avatarUrl} alt="Aperçu" className="w-10 h-10 rounded-full object-cover border-2 border-border" onError={e => (e.currentTarget.style.display = "none")} />
                  <span className="text-xs text-muted-foreground truncate">{avatarUrl.substring(0, 50)}...</span>
                </div>
              )}
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-primary text-primary-foreground gap-2">
              <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "✅ Sauvegarder le profil"}
            </Button>
          </div>
        </div>

        {/* Code d'accès */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display font-bold flex items-center gap-2 text-base">
              <Key className="w-5 h-5 text-primary" /> Changer le code d'accès
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Le code est hashé avec SHA-256. Personne ne peut le voir en clair.</p>
          </div>
          <div className="space-y-3">
            <Input type="password" placeholder="Ancien code d'accès" value={oldCode} onChange={e => setOldCode(e.target.value)} />
            <Input type="password" placeholder="Nouveau code d'accès (min 4 caractères)" value={newCode} onChange={e => setNewCode(e.target.value)} />
            <Input type="password" placeholder="Confirmer le nouveau code" value={confirmCode} onChange={e => setConfirmCode(e.target.value)} />
            <Button onClick={handleChangeCode} className="w-full bg-primary text-primary-foreground gap-2">
              <Key className="w-4 h-4" /> Modifier le code d'accès
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
