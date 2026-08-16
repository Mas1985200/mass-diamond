import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ConfigRequired } from "@/components/States";

// Implements spec section 20 "AI Assisted Listing": seller supplies
// photos/price/condition; AI drafts title/description/category;
// listing enters pending_review; only admins can publish (enforced
// server-side by the enforce_listing_review() trigger, not just UI).
export default function MarketplaceCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<File[]>([]);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("good");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [aiDraft, setAiDraft] = useState<{ title: string; description: string } | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  async function generateDraft() {
    setDrafting(true);
    setConfigError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: `Draft a marketplace listing title and description for: condition=${condition}, price=${price}, notes=${notes}. Respond as "Title: ...\\nDescription: ..."`,
          capability: "MARKETPLACE",
          language: navigator.language.split("-")[0]
        }
      });
      if (error) throw error;
      if (data.status === "CONFIGURATION_REQUIRED") {
        setConfigError(data.message);
        return;
      }
      const titleMatch = data.reply.match(/Title:\s*(.+)/i);
      const descMatch = data.reply.match(/Description:\s*([\s\S]+)/i);
      setAiDraft({
        title: titleMatch?.[1]?.trim() ?? notes.slice(0, 60),
        description: descMatch?.[1]?.trim() ?? data.reply
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDrafting(false);
    }
  }

  async function submitListing() {
    if (!user || !aiDraft) return;
    setSubmitting(true);
    try {
      const { data: listing, error } = await supabase
        .from("marketplace_listings")
        .insert({
          seller_id: user.id,
          title: aiDraft.title,
          description: aiDraft.description,
          price: price ? Number(price) : null,
          condition,
          city,
          status: "pending_review",
          ai_generated: true
        })
        .select("id")
        .single();
      if (error) throw error;

      for (const photo of photos) {
        const path = `${user.id}/${listing.id}/${crypto.randomUUID()}-${photo.name}`;
        await supabase.storage.from("marketplace").upload(path, photo);
        await supabase.from("marketplace_images").insert({ listing_id: listing.id, storage_path: path });
      }

      navigate(`/marketplace/${listing.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return <div className="p-6 text-text-muted">Sign in to create a listing.</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-1">Sell an item</h1>
      <p className="text-sm text-text-muted mb-6">Upload photos and basic details — Mass Diamond drafts the rest.</p>

      <div className="space-y-3">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
          className="md-input w-full"
        />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="md-input w-full" />
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="md-input w-full">
          <option value="new">New</option>
          <option value="like_new">Like new</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="for_parts">For parts</option>
        </select>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="md-input w-full" />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else? (brand, model, condition details...)"
          className="md-input w-full"
          rows={3}
        />

        {configError && <ConfigRequired label={configError} />}

        <button onClick={generateDraft} disabled={drafting} className="md-btn-ghost w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Sparkles size={16} /> {drafting ? "Drafting..." : "Generate title & description with AI"}
        </button>

        {aiDraft && (
          <div className="md-panel p-4 space-y-2">
            <label className="text-xs text-text-muted">Title</label>
            <input
              value={aiDraft.title}
              onChange={(e) => setAiDraft({ ...aiDraft, title: e.target.value })}
              className="md-input w-full"
            />
            <label className="text-xs text-text-muted">Description</label>
            <textarea
              value={aiDraft.description}
              onChange={(e) => setAiDraft({ ...aiDraft, description: e.target.value })}
              className="md-input w-full"
              rows={4}
            />
            <p className="text-xs text-text-muted">This listing will be submitted for review before it goes live.</p>
            <button onClick={submitListing} disabled={submitting} className="md-btn-primary w-full disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
