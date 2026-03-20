import { useEffect, useState } from "react";
import nexoraLogo from "@/assets/nexora-logo.png";

interface PageLoaderProps {
  duration?: number;
  children: React.ReactNode;
}

export default function PageLoader({ duration = 2000, children }: PageLoaderProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at center, #0d2d6b 0%, #061530 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-6 animate-fade-in-up">
          {/* Logo */}
          <img
            src={nexoraLogo}
            alt="Nexora"
            className="w-20 h-20 object-contain drop-shadow-2xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          {/* Nom */}
          <div
            className="text-3xl font-black tracking-[0.3em]"
            style={{ color: "#ffffff", fontFamily: "sans-serif" }}
          >
            NEXORA
          </div>

          {/* Points de chargement jaunes */}
          <div className="flex gap-3 mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: "#f5c200",
                  animation: "bounce 0.8s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
