import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState, EmptyState } from "@/components/States";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
      setItems((data ?? []) as Notification[]);
    })();
  }, [user]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, is_read: true } : n)) ?? null);
  }

  if (!user) return <div className="p-6 text-text-muted">Sign in to view notifications.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Notifications</h1>
      {items === null && <LoadingState />}
      {items && items.length === 0 && <EmptyState label={t("empty.notifications")} />}
      <div className="space-y-2">
        {items?.map((n) => (
          <button
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`md-panel p-3 w-full text-left ${!n.is_read ? "border-primary/40" : ""}`}
          >
            <p className="text-sm font-medium">{n.title}</p>
            {n.body && <p className="text-xs text-text-muted mt-0.5">{n.body}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
