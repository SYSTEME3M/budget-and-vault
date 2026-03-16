import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hashCode, playSuccessSound } from "@/lib/app-utils";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Key, Camera, Save } from "lucide-react";

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
      setNom(data.nom);
      setEmail(data.email);
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ nom, email, avatar_url: avatarUrl }).eq("id", profile.id);
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    playSuccessSound();
    toast({ title: "✅ Succès !", description: "Profil mis à jour." });
    loadProfile();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("mes-secrets-media").upload(path, file);
    if (error) { toast({ title: "Erreur", variant: "destructive" }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("mes-secrets-media").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const handleChangeCode = async () => {
    if (!oldCode || !newCode || !confirmCode) { toast({ title: "Remplissez tous les champs", variant: "destructive" }); return; }
    if (newCode !== confirmCode) { toast({ title: "Les codes ne correspondent pas", variant: "destructive" }); return; }
    if (newCode.length < 4) { toast({ title: "Code trop court (min 4 caractères)", variant: "destructive" }); return; }
    const oldHash = await hashCode(oldCode);
    if (oldHash !== profile.access_code_hash) { toast({ title: "Ancien code incorrect", variant: "destructive" }); return; }
    const newHash = await hashCode(newCode);
    const { error } = await supabase.from("profiles").update({ access_code_hash: newHash }).eq("id", profile.id);
    if (error) { toast({ title: "Erreur", variant: "destructive" }); return; }
    playSuccessSound();
    toast({ title: "✅ Code d'accès modifié !" });
    setOldCode(""); setNewCode(""); setConfirmCode("");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
        <h1 className="font-display font-bold text-xl flex items-center gap-2">
          <User className="w-6 h-6 text-primary" /> Mon Profil
        </h1>

        {/* Photo & infos */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src={avatarUrl || "https://i.ibb.co/pvMbk9MY/1771882604239.jpg"} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-primary" />
              <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-light transition-colors">
                <Camera className="w-3.5 h-3.5 text-accent-foreground" />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <div className="font-display font-bold text-lg">{nom || "Eric Kpakpo"}</div>
              <div className="text-sm text-muted-foreground">{email}</div>
              {uploading && <div className="text-xs text-primary mt-1">Téléversement...</div>}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Nom complet</label>
              <Input value={nom} onChange={e => setNom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">URL photo de profil</label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full bg-primary text-primary-foreground gap-2">
              <Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Sauvegarder le profil"}
            </Button>
          </div>
        </div>

        {/* Code d'accès */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-display font-bold flex items-center gap-2 text-base">
            <Key className="w-5 h-5 text-primary" /> Changer le code d'accès
          </h2>
          <div className="space-y-3">
            <Input type="password" placeholder="Ancien code d'accès" value={oldCode} onChange={e => setOldCode(e.target.value)} />
            <Input type="password" placeholder="Nouveau code d'accès" value={newCode} onChange={e => setNewCode(e.target.value)} />
            <Input type="password" placeholder="Confirmer le nouveau code" value={confirmCode} onChange={e => setConfirmCode(e.target.value)} />
            <Button onClick={handleChangeCode} className="w-full bg-primary text-primary-foreground gap-2">
              <Key className="w-4 h-4" /> Modifier le code
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Le code est hashé et sécurisé. Personne ne peut le voir.</p>
        </div>
      </div>
    </AppLayout>
  );
}
