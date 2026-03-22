import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  isNexoraAuthenticated,
  refreshNexoraSession,
} from "@/lib/nexora-auth";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await refreshNexoraSession();
        const result = isNexoraAuthenticated();

        if (!mounted) return;
        setIsAuth(result);
      } catch (error) {
        console.error("Erreur AuthGuard:", error);
        if (!mounted) return;
        setIsAuth(false);
      } finally {
        if (mounted) {
          setAuthChecked(true);
        }
      }
    };

    void checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
