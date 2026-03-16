import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/app-utils";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
    }
  }, [location.pathname]);

  if (!isAuthenticated()) return null;
  return <>{children}</>;
}
