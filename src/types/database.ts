// Hand-maintained types mirroring the SQL migrations in
// supabase/migrations/. For production, prefer generating these with:
//   supabase gen types typescript --local > src/types/database.ts

export type ListingStatus = "draft" | "pending_review" | "published" | "rejected" | "sold" | "archived";
export type AppRole = "user" | "seller" | "business_owner" | "agent" | "admin";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  country: string | null;
  city: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachment_url: string | null;
  capability: string | null;
  created_at: string;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  price: number | null;
  currency: string;
  condition: string | null;
  country: string | null;
  city: string | null;
  location_text: string | null;
  status: ListingStatus;
  ai_generated: boolean;
  ai_suggested_price_min: number | null;
  ai_suggested_price_max: number | null;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  property_type: string;
  purpose: "sale" | "rent";
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  rent_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  country: string | null;
  city: string | null;
  status: ListingStatus;
  is_featured: boolean;
  featured_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  status: ListingStatus;
  created_at: string;
}
