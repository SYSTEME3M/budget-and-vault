import { useEffect, useState } from "react";
import nexoraLogo from "@/assets/nexora-logo.png";

interface PageLoaderProps {
  duration?: number;
  children: React.ReactNode;
}

export default function PageLoader({ duration = 15000, children }: PageLoaderProps) {
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
        <div className="flex flex-col items-center gap-8">
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
            className="text-3xl font-black"
            style={{ color: "#ffffff", letterSpacing: "0.3em", fontFamily: "sans-serif" }}
          >
            NEXORA
          </div>

          {/* Points de chargement jaunes — centrés */}
          <div className="flex items-center justify-center gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
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
