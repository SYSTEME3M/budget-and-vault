import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getNexoraUser } from "@/lib/nexora-auth";
import { Bell, X, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface Notification {
  id: string;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { bg: string; icon: any; color: string }> = {
  success: { bg: "bg-green-50 border-green-200",  icon: CheckCircle,   color: "text-green-600"  },
  warning: { bg: "bg-yellow-50 border-yellow-200", icon: AlertTriangle, color: "text-yellow-600" },
  danger:  { bg: "bg-red-50 border-red-200",       icon: XCircle,       color: "text-red-600"    },
  info:    { bg: "bg-blue-50 border-blue-200",      icon: Info,          color: "text-blue-600"   },
};

export default function NexoraNotifications() {
  const user = getNexoraUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen]       = useState(false);
  const [visible, setVisible] = useState<Notification | null>(null);

  const loadNotifs = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("nexora_notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as Notification[]) || []);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadNotifs();

    const channel = supabase
      .channel("notifs_" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "nexora_notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const notif = payload.new as Notification;
        setNotifications(prev => [notif, ...prev]);
        setVisible(notif);
        setTimeout(() => setVisible(null), 5000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    await supabase.from("nexora_notifications" as any).update({ lu: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("nexora_notifications" as any).update({ lu: true }).eq("user_id", user.id).eq("lu", false);
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <>
      {/* Toast en haut */}
      {visible && (() => {
        const cfg = TYPE_CONFIG[visible.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-sm border rounded-2xl p-4 shadow-xl flex items-start gap-3 ${cfg.bg}`}
            style={{ animation: "slideDown 0.3s ease" }}>
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900">{visible.titre}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{visible.message}</p>
            </div>
            <button onClick={() => setVisible(null)} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        );
      })()}

      <style>{`@keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>

      {/* Cloche */}
      <div className="relative">
        <button onClick={() => { setOpen(!open); if (!open) loadNotifs(); }}
          className="relative p-2 rounded-xl hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-12 z-50 w-80 max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Tout marquer lu</button>
                )}
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Aucune notification
                  </div>
                ) : notifications.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <div key={notif.id} onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${!notif.lu ? "bg-primary/5" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-sm font-semibold ${!notif.lu ? "text-foreground" : "text-muted-foreground"}`}>{notif.titre}</p>
                            {!notif.lu && <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
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
