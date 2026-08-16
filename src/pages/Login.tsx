import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { signInWithEmail } from "@/hooks/useAuth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ConfigRequired } from "@/components/States";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/");
  }

  // Google/Apple sign-in: calls Supabase's real OAuth flow. If the
  // provider isn't enabled in the Supabase dashboard yet, Supabase
  // itself returns an error, which we surface as-is rather than
  // pretending the sign-in worked (spec section 8: "do not pretend
  // those providers are active unless configured").
  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) setError(`${provider} sign-in is not yet enabled: ${error.message}`);
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ConfigRequired label="Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Logo size={56} />
      <h1 className="mt-4 text-xl font-semibold">Sign in to Mass Diamond</h1>
      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="md-input w-full"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="md-input w-full"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="md-btn-primary w-full disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-6 w-full max-w-sm space-y-2">
        <button onClick={() => handleOAuth("google")} className="md-btn-ghost w-full text-sm">
          Continue with Google
        </button>
        <button onClick={() => handleOAuth("apple")} className="md-btn-ghost w-full text-sm">
          Continue with Apple
        </button>
      </div>
      <p className="mt-3 text-xs text-text-muted text-center max-w-xs">
        Google/Apple sign-in call Supabase's real OAuth flow — enable each provider in Supabase Auth settings to
        activate them; until then Supabase itself reports them as disabled.
      </p>
      <div className="mt-6 text-sm text-text-muted space-x-4">
        <Link to="/register" className="hover:text-primary">
          Create an account
        </Link>
        <Link to="/reset-password" className="hover:text-primary">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
