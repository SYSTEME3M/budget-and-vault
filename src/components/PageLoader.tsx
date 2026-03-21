cat > /home/claude/budget-and-vault-fixed/src/components/PageLoader.tsx << 'ENDOFFILE'
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import nexoraLogo from "@/assets/nexora-logo.png";

interface PageLoaderProps {
  duration?: number;
  children: React.ReactNode;
}

export default function PageLoader({ duration = 6000, children }: PageLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    setProgress(0);
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min((elapsed / duration) * 100, 98));
      if (elapsed >= duration) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setLoading(false), 150);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [location.pathname, duration]);

  if (!loading) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 60% 40%, #0d2d6b 0%, #061530 60%, #020617 100%)" }}>

      {/* Orbes décoratifs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }} />
      </div>

      {/* Contenu centré */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo avec halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full opacity-20 animate-ping"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)" }}>
            <img src={nexoraLogo} alt="Nexora" className="w-14 h-14 object-contain drop-shadow-2xl" />
          </div>
        </div>

        {/* Nom */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-[0.35em] text-white drop-shadow-lg">
            NEXORA
          </h1>
          <p className="text-xs text-white/40 tracking-widest mt-1 uppercase">
            Votre univers financier
          </p>
        </div>

        {/* Barre de progression */}
        <div className="w-56 flex flex-col gap-2">
          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150 ease-linear"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #3b82f6, #f59e0b, #3b82f6)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s linear infinite",
              }}
            />
          </div>
          <div className="text-center text-xs text-white/30 font-mono">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Points animés */}
        <div className="flex gap-2.5">
          {[0, 1, 2].map((i) => (
            <span key={i}
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: i === 0 ? "#3b82f6" : i === 1 ? "#f59e0b" : "#10b981",
                animation: "bounce 0.8s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
ENDOFFILE
echo "OK"
Sortie

OK
