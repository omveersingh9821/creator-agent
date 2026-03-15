import { Link, Navigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { LoginForm } from "../components/auth/LoginForm";
import { GoogleLoginButton } from "../components/auth/GoogleLoginButton";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { user } = useAuth();

  // If already logged in, go to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: "var(--c-canvas)" }}>
      <div className="w-full max-w-[400px]">
        {/* Logo/Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "color-mix(in srgb, var(--c-green) 12%, transparent)", color: "var(--c-green)" }}
          >
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--c-text)" }}>
            Welcome back
          </h1>
          <p className="mt-1.5 text-[14px]" style={{ color: "var(--c-text-muted)" }}>
            Sign in to access your AI content dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <LoginForm />

          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid var(--c-border)" }} />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-widest text-center">
              <span className="px-3" style={{ background: "var(--c-surface)", color: "var(--c-text-subtle)" }}>
                Or continue with
              </span>
            </div>
          </div>

          <GoogleLoginButton />
        </div>

        <p className="mt-8 text-center text-[13px]" style={{ color: "var(--c-text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold transition-colors hover:underline" style={{ color: "var(--c-blue)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
