import { useEffect, useState } from "react";
import nexoraLogo from "@/assets/nexora-logo.png";

interface PageLoaderProps {
  duration?: number; // ms
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
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-fade-in-up">
          <img
            src={nexoraLogo}
            alt="Nexora"
            className="w-24 h-24 object-contain drop-shadow-lg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="text-2xl font-black text-primary tracking-widest font-display">
            NEXORA
          </div>
          <div className="flex gap-3 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-primary"
                style={{
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
