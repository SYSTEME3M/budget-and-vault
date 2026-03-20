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
        className="fixed inset-0 z-50"
        style={{
          background: "radial-gradient(ellipse at center, #0d2d6b 0%, #061530 100%)",
        }}
      >
        {/* Logo + Nom : positionnés au-dessus du centre */}
        <div
          className="absolute left-1/2 flex flex-col items-center gap-6"
          style={{ top: "38%", transform: "translate(-50%, -50%)" }}
        >
          <img
            src={nexoraLogo}
            alt="Nexora"
            className="w-20 h-20 object-contain drop-shadow-2xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div
            className="text-3xl font-black"
            style={{ color: "#ffffff", letterSpacing: "0.3em", fontFamily: "sans-serif" }}
          >
            NEXORA
          </div>
        </div>

        {/* Points : centrés exactement au milieu de l'écran */}
        <div
          className="absolute left-1/2 flex items-center gap-4"
          style={{ top: "50%", transform: "translate(-50%, -50%)" }}
        >
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
    );
  }

  return <>{children}</>;
}
