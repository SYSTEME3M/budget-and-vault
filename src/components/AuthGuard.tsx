import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier la session Supabase au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
      if (!session) {
        navigate("/login", { replace: true });
      }
    });

    // Écouter les changements d'authentification
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
        if (!session) {
          navigate("/login", { replace: true });
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [location.pathname]);

  // ⬅️ Pendant le chargement, afficher un spinner
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500 text-lg">Chargement...</p>
    </div>
  );

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
}
