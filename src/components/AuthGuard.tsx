import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/app-utils";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    try {
      const result = isAuthenticated(); // ⚡ stable check
      setIsAuth(result);
    } catch (err) {
      console.error("Erreur AuthGuard:", err);
      setIsAuth(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // Affiche loader pendant le check
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Chargement...</p>
      </div>
    );
  }

  // Si non authentifié → redirect
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Auth ok → render children
  return <>{children}</>;
}
