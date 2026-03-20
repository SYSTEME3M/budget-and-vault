import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { Bell, X, AlertTriangle, CheckCircle, Info, XCircle, ShoppingBag } from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { bg: string; icon: any; color: string }> = {
  success:  { bg: "bg-green-50 border-green-200",   icon: CheckCircle,   color: "text-green-600"  },
  warning:  { bg: "bg-yellow-50 border-yellow-200",  icon: AlertTriangle, color: "text-yellow-600" },
  danger:   { bg: "bg-red-50 border-red-200",        icon: XCircle,       color: "text-red-600"    },
  info:     { bg: "bg-blue-50 border-blue-200",       icon: Info,          color: "text-blue-600"   },
  commande: { bg: "bg-pink-50 border-pink-200",       icon: ShoppingBag,   color: "text-pink-600"   },
};

// ── Son de notification commande ─────────────────────────
function playOrderSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, start: number, duration: number, volume = 0.3) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };

    // Mélodie joyeuse : Do-Mi-Sol-Do
    playTone(523, 0.0,  0.15, 0.3);
    playTone(659, 0.18, 0.15, 0.3);
    playTone(784, 0.36, 0.15, 0.3);
    playTone(1047, 0.54, 0.3, 0.4);
  } catch {}
}

// ── Son générique notification ────────────────────────────
function playNotifSound() {
  try {
    const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export default function NexoraNotifications() {
  const user = getNexoraUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState<Notification | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNotifs = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("nexora_notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data as Notification[]) || []);
  };

  // ── Écoute des nouvelles commandes en temps réel ─────────
  useEffect(() => {
    if (!user?.id) return;
    loadNotifs();

    // Écoute notifications générales
    const notifChannel = supabase
      .channel("notifs_" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "nexora_notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notif = payload.new as Notification;
        setNotifications(prev => [notif, ...prev]);
        showToast(notif);
        if (notif.type === "commande") {
          playOrderSound();
        } else {
          playNotifSound();
        }
      })
      .subscribe();

    // Écoute des nouvelles commandes dans les boutiques du vendeur
    const commandeChannel = supabase
      .channel("commandes_vendeur_" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "commandes",
      }, async (payload) => {
        const cmd = payload.new as any;

        // Vérifier que la commande appartient à une boutique de cet utilisateur
        const { data: boutique } = await supabase
          .from("boutiques" as any)
          .select("id, nom")
          .eq("id", cmd.boutique_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!boutique) return; // pas sa boutique

        // Créer la notification en base
        const newNotif = {
          user_id: user.id,
          titre: "Nouvelle commande reçue !",
          message: `${cmd.client_nom} vient de passer une commande de ${Math.round(cmd.total).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${cmd.devise || "FCFA"} sur ${(boutique as any).nom}`,
          type: "commande",
          lu: false,
        };

        await supabase.from("nexora_notifications" as any).insert(newNotif);
        // Le canal notifChannel ci-dessus détectera l'insertion et jouera le son
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(commandeChannel);
    };
  }, [user?.id]);

  const showToast = (notif: Notification) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setVisible(notif);
    toastTimer.current = setTimeout(() => setVisible(null), 6000);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("nexora_notifications" as any).update({ lu: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("nexora_notifications" as any)
      .update({ lu: true })
      .eq("user_id", user.id)
      .eq("lu", false);
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("nexora_notifications" as any).delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <>
      {/* ── Toast flottant ── */}
      {visible && (() => {
        const cfg  = TYPE_CONFIG[visible.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-sm border-2 rounded-2xl p-4 shadow-2xl flex items-start gap-3 ${cfg.bg}`}
            style={{ animation: "slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${visible.type === "commande" ? "bg-pink-100" : "bg-white"} shadow-sm`}>
              <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900">{visible.titre}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{visible.message}</p>
            </div>
            <button
              onClick={() => { if (toastTimer.current) clearTimeout(toastTimer.current); setVisible(null); }}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        );
      })()}

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -30px); opacity: 0; }
          to   { transform: translate(-50%, 0);     opacity: 1; }
        }
      `}</style>

      {/* ── Cloche ── */}
      <div className="relative">
        <button
          onClick={() => { setOpen(!open); if (!open) loadNotifs(); }}
          className="relative p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-primary" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-80 max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">

              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="font-black text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                    Tout lire
                  </button>
                )}
              </div>

              {/* Liste */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Aucune notification</p>
                  </div>
                ) : notifications.map(notif => {
                  const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group ${!notif.lu ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${cfg.bg} shadow-sm`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-sm font-bold leading-tight ${!notif.lu ? "text-foreground" : "text-muted-foreground"}`}>
                              {notif.titre}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notif.lu && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                              <button
                                onClick={e => deleteNotif(notif.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-all"
                              >
                                <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit", month: "short",
                              hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
