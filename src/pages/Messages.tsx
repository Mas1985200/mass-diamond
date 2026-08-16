import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MoreVertical, Flag, Ban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState, EmptyState } from "@/components/States";
import { useTranslation } from "react-i18next";

interface Thread {
  id: string;
  context_type: string;
  updated_at: string;
}

interface Msg {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function Messages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeThread = params.get("thread");
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("message_threads")
        .select("id, context_type, updated_at, thread_participants!inner(user_id)")
        .eq("thread_participants.user_id", user.id)
        .order("updated_at", { ascending: false });
      setThreads((data ?? []) as unknown as Thread[]);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeThread) return;
    (async () => {
      const { data } = await supabase
        .from("thread_messages")
        .select("id, sender_id, content, created_at")
        .eq("thread_id", activeThread)
        .order("created_at", { ascending: true });
      setMsgs((data ?? []) as Msg[]);

      // Realtime subscription for new messages in the active thread.
      const channel = supabase
        .channel(`thread-${activeThread}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "thread_messages", filter: `thread_id=eq.${activeThread}` },
          (payload) => setMsgs((prev) => [...prev, payload.new as Msg])
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, [activeThread]);

  async function send() {
    if (!text.trim() || !activeThread || !user) return;
    await supabase.from("thread_messages").insert({ thread_id: activeThread, sender_id: user.id, content: text.trim() });
    setText("");
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReportBox, setShowReportBox] = useState(false);

  // Blocks the OTHER participant from sending further messages in this
  // thread, by flipping is_blocked on their own participant row. RLS on
  // thread_messages (0006_messaging.sql) checks is_blocked = false on
  // insert, so a blocked participant is stopped server-side, not just
  // hidden in the UI.
  async function blockOtherParticipant() {
    if (!activeThread || !user) return;
    const { data: participants } = await supabase
      .from("thread_participants")
      .select("id, user_id")
      .eq("thread_id", activeThread);
    const other = participants?.find((p) => p.user_id !== user.id);
    if (!other) return;
    await supabase.from("thread_participants").update({ is_blocked: true }).eq("id", other.id);
    setMenuOpen(false);
  }

  async function submitReport() {
    if (!activeThread || !user || !reportReason.trim()) return;
    await supabase.from("message_reports").insert({ thread_id: activeThread, reported_by: user.id, reason: reportReason.trim() });
    setReportReason("");
    setShowReportBox(false);
    setMenuOpen(false);
  }

  if (!user) return <div className="p-6 text-text-muted">Sign in to view messages.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md-panel p-2 md:col-span-1">
        <h2 className="text-sm font-semibold px-2 py-2">Conversations</h2>
        {threads === null && <LoadingState label="Loading..." />}
        {threads && threads.length === 0 && <EmptyState label={t("empty.conversations")} />}
        {threads?.map((th) => (
          <button
            key={th.id}
            onClick={() => setParams({ thread: th.id })}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${activeThread === th.id ? "bg-surface text-primary" : "hover:bg-surface/60"}`}
          >
            {th.context_type} conversation
          </button>
        ))}
      </div>
      <div className="md-panel p-3 md:col-span-2 flex flex-col min-h-[400px]">
        {!activeThread ? (
          <EmptyState label="Select a conversation." />
        ) : (
          <>
            <div className="flex justify-end mb-2 relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="p-1.5 text-text-muted hover:text-text">
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <div className="absolute top-8 right-0 md-panel p-1.5 z-10 w-44">
                  <button
                    onClick={() => setShowReportBox(true)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm hover:bg-surface rounded-lg"
                  >
                    <Flag size={14} /> Report conversation
                  </button>
                  <button
                    onClick={blockOtherParticipant}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-sm hover:bg-surface rounded-lg text-red-400"
                  >
                    <Ban size={14} /> Block other user
                  </button>
                </div>
              )}
            </div>
            {showReportBox && (
              <div className="md-panel p-3 mb-3 space-y-2">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Why are you reporting this conversation?"
                  className="md-input w-full"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button onClick={submitReport} className="md-btn-primary text-xs px-3 py-1.5">Submit</button>
                  <button onClick={() => setShowReportBox(false)} className="md-btn-ghost text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            )}
            <div className="flex-1 space-y-2 overflow-y-auto mb-3">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl2 px-3 py-2 text-sm ${m.sender_id === user.id ? "bg-primary text-background" : "bg-surface"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="md-input flex-1" placeholder="Message..." />
              <button onClick={send} className="md-btn-primary">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
