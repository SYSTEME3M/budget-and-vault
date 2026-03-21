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
      const p = Math.min((elapsed / duration) * 100, 98);
      setProgress(p);
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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 60% 40%, #0d2d6b 0%, #061530 60%, #020617 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)" }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute w-28 h-28 rounded-full opacity-20 animate-ping"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
          />
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <img
              src={nexoraLogo}
              alt="Nexora"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-black tracking-[0.35em] text-white">
            NEXORA
          </h1>
          <p className="text-xs text-white/40 tracking-widest mt-1 uppercase">
            Votre univers financier
          </p>
        </div>

        <div className="w-56 flex flex-col gap-2">
          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150 ease-linear"
              style={{
                width: progress + "%",
                background: "linear-gradient(90deg, #3b82f6, #f59e0b)",
              }}
            />
          </div>
          <div className="text-center text-xs text-white/30 font-mono">
            {Math.round(progress)}%
          </div>
        </div>

        <div className="flex gap-2.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{
                background: i === 0 ? "#3b82f6" : i === 1 ? "#f59e0b" : "#10b981",
                animationDelay: i * 0.2 + "s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
