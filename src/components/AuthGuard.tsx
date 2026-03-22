import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isNexoraAuthenticated } from "@/lib/nexora-auth";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    try {
      const result = isNexoraAuthenticated();
      setIsAuth(result);
    } catch (err) {
      console.error("Erreur AuthGuard:", err);
      setIsAuth(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Chargement...</p>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
