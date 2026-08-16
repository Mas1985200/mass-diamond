import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Business } from "@/types/database";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import { useAuth } from "@/hooks/useAuth";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  user_id: string;
}

export default function BusinessDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSent, setClaimSent] = useState(false);

  async function load() {
    const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single();
    if (error) {
      setError(error.message);
      return;
    }
    setBusiness(data as Business);

    const { data: reviewData } = await supabase
      .from("business_reviews")
      .select("id, rating, text, created_at, user_id")
      .eq("business_id", id)
      .order("created_at", { ascending: false });
    setReviews((reviewData ?? []) as Review[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitReview() {
    if (!user || !business) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("business_reviews").insert({
        business_id: business.id,
        user_id: user.id,
        rating,
        text: reviewText.trim() || null
      });
      if (error) throw error;
      setReviewText("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  }

  async function claimBusiness() {
    if (!user || !business) return;
    setClaiming(true);
    try {
      const { error } = await supabase.from("business_claims").insert({
        business_id: business.id,
        claimant_id: user.id
      });
      if (error) throw error;
      setClaimSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(false);
    }
  }

  if (error) return <ErrorState label={error} />;
  if (!business) return <LoadingState />;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold">{business.name}</h1>
      <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
        {avgRating && (
          <span className="flex items-center gap-1 text-primary">
            <Star size={14} fill="currentColor" /> {avgRating} ({reviews.length})
          </span>
        )}
        <span>{business.city}, {business.country}</span>
      </div>
      {business.phone && <p className="text-sm text-text-muted mt-1">Contact via Mass Diamond messaging (direct numbers are private)</p>}
      {business.website && (
        <a href={business.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block mt-1">
          {business.website}
        </a>
      )}
      <p className="mt-4 whitespace-pre-wrap">{business.description}</p>

      {!business.owner_id && user && !claimSent && (
        <button onClick={claimBusiness} disabled={claiming} className="md-btn-ghost mt-4 text-sm disabled:opacity-50">
          {claiming ? "Submitting claim..." : "Is this your business? Claim it"}
        </button>
      )}
      {claimSent && <p className="text-sm text-primary mt-4">Claim submitted — an admin will review it.</p>}

      <h2 className="text-lg font-semibold mt-8 mb-3">Reviews</h2>
      {reviews.length === 0 && <EmptyState label="No reviews yet." />}
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="md-panel p-3">
            <div className="flex items-center gap-1 text-primary text-sm">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
            {r.text && <p className="text-sm mt-1">{r.text}</p>}
          </div>
        ))}
      </div>

      {user && (
        <div className="md-panel p-4 mt-4">
          <p className="text-sm font-medium mb-2">Leave a review</p>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="md-input mb-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} stars</option>
            ))}
          </select>
          <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Your experience..." className="md-input w-full" rows={2} />
          <button onClick={submitReview} disabled={submittingReview} className="md-btn-primary mt-2 text-sm disabled:opacity-50">
            {submittingReview ? "Posting..." : "Post review"}
          </button>
        </div>
      )}
    </div>
  );
}
