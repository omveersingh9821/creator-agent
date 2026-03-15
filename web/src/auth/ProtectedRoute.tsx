import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--c-canvas)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent pt-4" style={{ borderColor: "var(--c-border-muted)", borderTopColor: "var(--c-green)" }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
