import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

type Props = { children: ReactNode };

/** Oturum yoksa /login (AuthProvider session yüklenene kadar zaten bekletir). */
export function ProtectedRoute({ children }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
