import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { signUpWithEmail } from "@/hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Logo size={56} />
        <h1 className="mt-4 text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-text-muted max-w-sm">
          We sent a confirmation link to {email}. Confirm your address, then sign in.
        </p>
        <button onClick={() => navigate("/login")} className="md-btn-primary mt-6">
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Logo size={56} />
      <h1 className="mt-4 text-xl font-semibold">Create your Mass Diamond account</h1>
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
          minLength={8}
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="md-input w-full"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="md-btn-primary w-full disabled:opacity-50">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
