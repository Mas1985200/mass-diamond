import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { resetPassword } from "@/hooks/useAuth";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <Logo size={56} />
      <h1 className="mt-4 text-xl font-semibold">Reset your password</h1>
      {sent ? (
        <p className="mt-4 text-text-muted max-w-sm">
          If an account exists for {email}, a reset link has been sent.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="md-input w-full"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="md-btn-primary w-full">
            Send reset link
          </button>
        </form>
      )}
      <Link to="/login" className="mt-6 text-sm text-primary hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
