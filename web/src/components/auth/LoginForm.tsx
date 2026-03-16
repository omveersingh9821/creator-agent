import { useState } from "react";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let AuthContext redirect via ProtectedRoute
    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md p-3 text-[13px]" style={{ background: "color-mix(in srgb, var(--c-red) 12%, transparent)", color: "var(--c-red)" }}>
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--c-text)" }}>Email address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--c-text-subtle)" }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md py-2.5 pl-10 pr-4 text-[13px] outline-none transition-colors"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--c-text)" }}>Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--c-text-subtle)" }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md py-2.5 pl-10 pr-4 text-[13px] outline-none transition-colors"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text)" }}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer mt-2 flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "var(--c-green)", color: "#fff" }}
      >
        {loading ? "Signing in..." : "Sign in"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
