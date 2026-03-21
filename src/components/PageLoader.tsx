import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import nexoraLogo from "@/assets/nexora-logo.png";

interface PageLoaderProps {
  duration?: number;
  children: React.ReactNode;
  onlyAuth?: boolean;
}

export default function PageLoader({
  duration = 600,
  children,
  onlyAuth = false,
}: PageLoaderProps) {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Détecte si on est sur une page d'authentification
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    // 1. On remet le loading à true dès que l'URL change (pour re-déclencher l'animation)
    setLoading(true);

    // 2. Logique de skip
    if (onlyAuth && !isAuthPage) {
      setLoading(false);
      return;
    }

    // 3. Timer de chargement
    const timer = setTimeout(() => {
      setLoading(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [location.pathname, duration, onlyAuth, isAuthPage]); // Ajout de location.pathname ici

  // Si on n'est pas en chargement, on affiche direct les enfants
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-10 bg-gradient-to-br from-[#061530] via-[#0d2d6b] to-[#020617]">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <img
          src={nexoraLogo}
          alt="Nexora"
          className="w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
        />
        <h1 className="text-3xl font-black tracking-[0.3em] text-white">
          NEXORA
        </h1>
      </div>

      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full bg-yellow-400 animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
