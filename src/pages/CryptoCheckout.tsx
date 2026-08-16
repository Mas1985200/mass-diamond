import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState, EmptyState } from "@/components/States";

interface Method {
  id: string;
  asset: string;
  network: string;
  wallet_address: string;
  instructions: string | null;
}

// Buyer-facing crypto checkout (closes the gap noted in README §7
// "NOT CONNECTED"). Crypto payments cannot be auto-confirmed without a
// blockchain indexer, so this flow is intentionally honest about that:
// it shows the admin-published wallet address, lets the buyer record
// that they sent a payment (status stays 'pending'), and an admin
// confirms it manually in Admin → Payments once the funds arrive. This
// never marks a payment 'succeeded' automatically — see spec section
// 34/35: no simulated transactions, no stored private keys.
export default function CryptoCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const purpose = params.get("purpose") ?? "subscription";
  const amount = params.get("amount") ?? "";
  const referenceId = params.get("ref") ?? "";

  const [methods, setMethods] = useState<Method[] | null>(null);
  const [selected, setSelected] = useState<Method | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("support_payment_methods").select("*").eq("is_active", true);
      setMethods((data ?? []) as Method[]);
    })();
  }, []);

  async function copyAddress() {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function markAsSent() {
    if (!selected || !user) return;
    setSubmitting(true);
    try {
      await supabase.from("payments").insert({
        user_id: user.id,
        amount: amount ? Number(amount) : 0,
        currency: selected.asset,
        provider: "crypto",
        status: "pending",
        purpose,
        metadata: { network: selected.network, wallet_address: selected.wallet_address, reference_id: referenceId }
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return <div className="p-6 text-text-muted">Sign in to pay with crypto.</div>;
  if (methods === null) return <LoadingState />;
  if (methods.length === 0) return <EmptyState label="No crypto payment methods are currently available." />;

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center">
        <Check className="text-primary mx-auto mb-3" size={32} />
        <h1 className="text-lg font-semibold">Payment recorded as pending</h1>
        <p className="text-sm text-text-muted mt-2">
          We've noted that you sent {selected?.asset} via {selected?.network}. An admin will confirm it once the
          funds are received — this can take a few minutes to a few hours depending on the network.
        </p>
        <button onClick={() => navigate("/profile")} className="md-btn-primary mt-6">
          Back to profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Pay with crypto</h1>
      <p className="text-sm text-text-muted mb-6">
        Select an asset, send the exact amount to the address shown, then confirm below.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className={`md-panel p-3 text-left text-sm ${selected?.id === m.id ? "border-primary" : ""}`}
          >
            <p className="font-medium">{m.asset}</p>
            <p className="text-xs text-text-muted">{m.network}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="md-panel p-4 space-y-3">
          <div>
            <p className="text-xs text-text-muted">Send to this address</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-surface px-2 py-1.5 rounded-lg flex-1 truncate">{selected.wallet_address}</code>
              <button onClick={copyAddress} className="p-2 text-text-muted hover:text-primary">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          {amount && <p className="text-sm">Amount: <span className="text-primary">{amount} {selected.asset}</span></p>}
          {selected.instructions && <p className="text-xs text-text-muted">{selected.instructions}</p>}
          <button onClick={markAsSent} disabled={submitting} className="md-btn-primary w-full disabled:opacity-50">
            {submitting ? "Recording..." : "I've sent the payment"}
          </button>
        </div>
      )}
    </div>
  );
}
