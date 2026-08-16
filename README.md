# Mass Diamond

**One app. Every need. Anywhere in the world.**

A multilingual global super-app: AI chat as the primary interface, backed by
real marketplace, real-estate, and business-directory modules, sharing one
authentication system, one database, and one design system.

This repository is a **project scaffold**, not a finished, deployed product.
It gives you real database schema, real Row Level Security, a real
authentication flow, and working core screens — wired to Supabase — plus
clearly-marked configuration points for AI, search, voice, payment, and map
providers. See **Status** below for exactly what runs today versus what
needs credentials.

---

## 1. Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (Mass Diamond design tokens in `tailwind.config.ts`)
- React Router
- Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- i18next (8 languages, RTL-aware)
- vite-plugin-pwa (installable PWA)

## 2. Project structure

```
mass-diamond/
├── src/
│   ├── components/       Logo, Sidebar, BottomNav, ChatInput, AdBanner,
│   │                      AffiliateProducts, state components
│   ├── pages/             All routed screens, incl. pages/Admin/,
│   │                      CryptoCheckout
│   ├── hooks/              useAuth
│   ├── lib/                 supabase client, i18n, capability routing,
│   │                      location (GPS/IP)
│   ├── types/               hand-written DB types (mirrors SQL schema)
│   └── __tests__/           Vitest unit tests
├── supabase/
│   ├── migrations/        0001–0011, full schema + RLS policies + storage
│   ├── functions/
│   │   ├── ai-chat/           capability routing + AI provider abstraction
│   │   │                      (+ router.test.ts, Deno unit tests)
│   │   ├── search/             search provider abstraction
│   │   ├── voice-stt/          real speech-to-text (OpenAI Whisper / ElevenLabs)
│   │   ├── voice-tts/          real text-to-speech (OpenAI / ElevenLabs)
│   │   ├── create-checkout/    real Stripe Checkout Session creation
│   │   │                      (subscriptions, featured listings, marketplace orders)
│   │   ├── stripe-webhook/     verifies Stripe signature, activates payments
│   │   ├── affiliate-webhook/  receives real affiliate conversion pings
│   │   ├── geo-lookup/         IP-based approximate location
│   │   └── maps-geocode/       GPS coordinates → city/country
│   └── config.toml
├── .github/workflows/ci.yml   lint, typecheck, unit tests, build
├── public/                 manifest assets, favicon, real generated PWA icons
├── capacitor.config.ts     native Android/iOS packaging (opt-in, see §9)
├── vitest.config.ts
├── .env.example
└── package.json
```

## 3. Getting started

```bash
npm install
cp .env.example .env   # fill in Supabase values, see below
npm run dev
```

### Supabase setup

1. Create a project at https://supabase.com.
2. Copy the Project URL and anon key into `.env` as `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY`.
3. Run the migrations in order (Supabase CLI):
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   This creates every table listed below, all RLS policies, storage
   buckets, and taxonomy seed data (categories only — no fake listings).
4. Deploy Edge Functions:
   ```bash
   supabase functions deploy ai-chat
   supabase functions deploy search
   supabase functions deploy voice-stt
   supabase functions deploy voice-tts
   supabase functions deploy create-checkout
   supabase functions deploy stripe-webhook --no-verify-jwt
   supabase functions deploy affiliate-webhook --no-verify-jwt
   supabase functions deploy geo-lookup
   supabase functions deploy maps-geocode
   ```
5. Set Edge Function secrets (server-side only, never in the frontend):
   ```bash
   supabase secrets set AI_PROVIDER=anthropic AI_PROVIDER_API_KEY=sk-...
   supabase secrets set SEARCH_PROVIDER=bing SEARCH_PROVIDER_API_KEY=...
   supabase secrets set VOICE_PROVIDER=openai VOICE_PROVIDER_API_KEY=sk-...
   supabase secrets set MAPS_PROVIDER=google MAPS_PROVIDER_API_KEY=...
   supabase secrets set PAYMENT_PROVIDER=stripe PAYMENT_PROVIDER_SECRET=sk_live_...
   supabase secrets set PAYMENT_WEBHOOK_SECRET=whsec_...
   supabase secrets set AFFILIATE_WEBHOOK_SECRET=$(openssl rand -hex 32)
   ```
   The `SUPABASE_SERVICE_ROLE_KEY` used by `ai-chat`, `stripe-webhook`, and
   `affiliate-webhook` is injected automatically by the Supabase Edge
   Function runtime — you do not set it yourself.
6. In the Stripe Dashboard, add a webhook endpoint pointing to
   `https://<project-ref>.functions.supabase.co/stripe-webhook` listening
   for `checkout.session.completed`, `checkout.session.expired`, and
   `customer.subscription.deleted`, then copy its signing secret into
   `PAYMENT_WEBHOOK_SECRET` above.

### Deploying via Lovable

This project uses only standard Vite/React/Supabase primitives, so it can
be opened directly in Lovable: import the repository (via the GitHub
integration, see below), then connect the same Supabase project in
Lovable's integration panel and provide the Edge Function secrets there.

## 4. Environment variables

See `.env.example` for the full list. Frontend-visible variables are
prefixed `VITE_` and contain no secrets. Everything else (`AI_PROVIDER_API_KEY`,
payment secrets, service-role key) is set as a Supabase Edge Function
secret, never committed, never shipped to the browser.

## 5. Database schema

| Migration | Tables |
|---|---|
| 0001 | `user_roles`, `profiles`, `public_profiles` (view) |
| 0002 | `conversations`, `messages`, `ai_usage_logs` |
| 0003 | `marketplace_categories`, `marketplace_listings`, `marketplace_images`, `favorites` |
| 0004 | `properties`, `property_images`, `property_features` |
| 0005 | `business_categories`, `businesses`, `business_hours`, `business_images`, `business_reviews`, `business_claims` |
| 0006 | `message_threads`, `thread_participants`, `thread_messages`, `message_reports` |
| 0007 | `notifications`, `reports` |
| 0008 | `subscriptions`, `payments`, `orders`, `advertisements`, `affiliate_partners`, `affiliate_products`, `affiliate_clicks`, `affiliate_conversions`, `commissions`, `support_payment_methods` |
| 0009 | Storage buckets: `avatars`, `marketplace`, `properties`, `businesses`, `chat-attachments` (private) + policies |
| 0010 | Seed: marketplace/business **categories only** — no fake listings |
| 0011 | `is_featured` / `featured_until` columns on listings/properties, writable only by admins or the service-role webhook |

Every table has Row Level Security enabled. Roles (`user`, `seller`,
`business_owner`, `agent`, `admin`) are enforced via a `has_role()`
security-definer function used throughout the policies — admin access is a
database-level guarantee, not a UI-level hide/show.

## 6. AI integration

`supabase/functions/ai-chat` is the single entry point for the assistant:

1. Authenticates the caller via their Supabase JWT.
2. Classifies the message into `GENERAL_CHAT | SEARCH | MARKETPLACE | REAL_ESTATE | BUSINESS`
   (`router.ts`) using the same configured provider.
3. Answers with a capability-aware system prompt.
4. Persists both the user and assistant messages to `messages`.
5. Logs token usage to `ai_usage_logs` (service-role write, admin-only read).

`provider.ts` implements a small `AIProvider` interface with Anthropic and
OpenAI backends; add another provider by implementing the interface and
registering it in `getProvider()`. **If no provider is configured, the
function returns `{ status: "CONFIGURATION_REQUIRED" }` — it never
fabricates a reply.**

## 7. Status: functional vs. configuration required vs. not connected

**FUNCTIONAL** (works today once Supabase is configured, no other
credentials needed):
- Email auth: sign up, sign in, sign out, password reset
- Google/Apple sign-in buttons call Supabase's real OAuth flow (Supabase
  itself reports "provider disabled" until you enable it — no fake success)
- Profile editing, avatar upload, language switching, RTL/LTR layout
- Precise GPS location on explicit user request ("Use my current
  location" button — never automatic); falls back gracefully to manual
  city/country entry, including when permission is denied
- Marketplace: browse, search, create (pending_review), favorite, images
- Real estate: browse, filter, create (pending_review), images
- Business directory: browse, business profile, reviews, claim flow
- In-app messaging (realtime), block user (server-enforced via RLS, not
  just hidden in UI), report conversation, notifications
- Sponsored/ad banner and affiliate product grid with real click
  tracking into `affiliate_clicks` (render nothing if no active
  ad/product exists — never a placeholder ad)
- **Payments**: real Stripe Checkout for subscriptions (Pro AI,
  Business Basic) and for featuring a marketplace listing or property.
  `create-checkout` creates an actual Stripe Checkout Session;
  `stripe-webhook` verifies Stripe's signature and is the *only* place
  that marks a payment succeeded, activates a subscription, or flips
  `is_featured` to true — enforced further by a database trigger that
  rejects any client attempt to set `is_featured` directly
- **Voice**: `voice-stt`/`voice-tts` call real OpenAI Whisper/TTS or
  ElevenLabs APIs once `VOICE_PROVIDER`/`VOICE_PROVIDER_API_KEY` are
  set — no longer stubs
- **Location**: IP-based approximate location (`geo-lookup`, via
  ipapi.co, no key required) prefills a new user's city/country;
  precise GPS + reverse geocoding (`maps-geocode`, Google or Mapbox)
  available via "Use my current location"
- **Affiliate conversions**: `affiliate-webhook` is a real,
  shared-secret-verified endpoint that records genuine conversions +
  commissions when your affiliate network calls it back
- **Marketplace checkout**: "Buy now" on a listing creates a real
  Stripe Checkout Session and a pending `orders` row; `stripe-webhook`
  marks the order `paid` only after Stripe confirms
- **Crypto checkout**: buyers can pay via any admin-activated wallet
  address (subscriptions, featured listings/properties, or marketplace
  orders) at `/checkout/crypto` — copies the address, records a
  `pending` payment, and is honest that confirmation is manual (crypto
  payments can't be auto-verified without a blockchain indexer); an
  admin confirms it from Admin → Payments once funds arrive
- Admin: Dashboard, Users, Moderation, AI Usage, Reviews, Reports,
  Subscriptions, Payments, Advertisements, Settings (crypto wallet
  address management) — all 10 sections, all reading/writing real
  RLS-protected tables
- Listing publication is server-enforced via `enforce_listing_review()`
  trigger — the client cannot publish a listing by editing request
  payloads, regardless of what the admin UI shows
- PWA install with real generated app icons, responsive layout, i18n
  (8 languages)
- CI (`.github/workflows/ci.yml`): typecheck, lint, unit tests (Vitest
  + Deno), and build run automatically on every push/PR
- Native packaging seam (`capacitor.config.ts`) — opt-in step to wrap
  the PWA for the Play Store / App Store, not run by default

**CONFIGURATION REQUIRED** (architecture + real code complete, just needs API keys):
- AI chat replies (`AI_PROVIDER` / `AI_PROVIDER_API_KEY`)
- AI-assisted listing drafting (same as above)
- Web search (`SEARCH_PROVIDER` / `SEARCH_PROVIDER_API_KEY`)
- Voice input/output (`VOICE_PROVIDER` / `VOICE_PROVIDER_API_KEY`) —
  real OpenAI Whisper/TTS and ElevenLabs calls are implemented; set the
  provider and key to activate
- Card payments/subscriptions/featured listings/marketplace orders
  (`PAYMENT_PROVIDER=stripe`, `PAYMENT_PROVIDER_SECRET`,
  `PAYMENT_WEBHOOK_SECRET`) — Checkout Session creation and webhook
  confirmation are both implemented; nothing simulates a successful
  charge without Stripe actually confirming one
- Reverse geocoding of GPS coordinates into city/country
  (`MAPS_PROVIDER` / `MAPS_PROVIDER_API_KEY`, Google or Mapbox) — GPS
  capture and the Edge Function call both work now; only the provider
  key is missing
- IP-based approximate location: works out of the box via ipapi.co's
  free tier (no key needed); set `IP_GEOLOCATION_ENABLED=false` to
  disable it, or swap the provider in `geo-lookup/index.ts`
- Affiliate conversions (`AFFILIATE_WEBHOOK_SECRET`) — the webhook
  receiver is implemented and shared-secret-verified; point your
  affiliate network's conversion postback at it

**NOT CONNECTED** (would need additional product decisions, not just a key):
- Automatic crypto payment confirmation (would require a blockchain
  indexer/oracle per asset+network — deliberately out of scope; the
  manual admin-confirms-it model is the honest alternative built here)
- Android/iOS native packaging (this is a PWA; wrapping it with
  Capacitor/similar is a follow-up step, not started)

## 8. Security notes

- No API keys, service-role keys, or payment secrets are ever sent to the
  frontend or committed to this repository.
- Every table has RLS; policies are written to fail closed (default deny),
  with explicit `select`/`insert`/`update`/`delete` grants.
- Listing publication (`status = 'published'`) is enforced by a database
  trigger that checks `has_role(auth.uid(), 'admin')` — bypassing the
  admin UI does not bypass this check.
- Seller/owner phone numbers are collected but never exposed through any
  `select` policy on `businesses`/profile data to non-owners; contact
  happens via `message_threads`.
- Storage buckets use per-user path prefixes (`{user_id}/...`) enforced
  by storage policies, so users cannot write into each other's folders.

## 9. GitHub

Connect this repository through Lovable's GitHub integration (Project →
GitHub → Connect), or push manually:

```bash
git init
git add .
git commit -m "Initial Mass Diamond scaffold"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

`.gitignore` excludes `node_modules/`, `dist/`, `.env`, and (once you
run `npx cap add`) the generated `android/`/`ios/` native projects.

## 9b. Testing

```bash
npm run test        # Vitest — frontend logic (i18n/RTL, capability routing)
deno test --allow-net supabase/functions/ai-chat/router.test.ts
```

`.github/workflows/ci.yml` runs type-checking, lint, both test suites,
and a production build on every push/PR. Coverage today is intentionally
narrow — pure logic (RTL detection, capability→route mapping, the AI
router's classification fallback) rather than full component/integration
tests, which would need a real or mocked Supabase backend to be
meaningful.

## 9c. Native packaging (Android/iOS)

`capacitor.config.ts` wraps the built PWA in a native shell via
[Capacitor](https://capacitorjs.com), fulfilling spec section 3's
requirement that the architecture support this later without a rewrite:

```bash
npm run build
npm install -D @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # or: npx cap open ios
```

This is opt-in and not run by default — the shipped app is a PWA. Native
builds get you real app-store distribution and access to native APIs
(camera, push notifications) beyond what a PWA can do on some platforms.

## 10. Known limitations

- Search/marketplace/real-estate filtering is done client-side against
  Supabase queries; there's no dedicated search index — fine at small
  scale, worth revisiting (e.g. Postgres full-text search or an external
  search provider) as listing volume grows.
- Test coverage is intentionally narrow (pure logic only, see §9b) —
  there's no integration test suite exercising real Supabase
  auth/RLS/storage yet, since that needs a live or containerized
  Supabase instance in CI, which isn't set up here.
- Crypto payments are confirmed manually by an admin (see §7) rather
  than automatically, by design — see "NOT CONNECTED" above for why.
- Email notifications aren't sent yet — `notifications` rows are
  created and shown in-app, but there's no `EMAIL_PROVIDER` integration
  triggering a real email on events like "listing approved" or "new
  message". This is the most natural next Edge Function to add
  (`send-email`, triggered from a Postgres webhook on `notifications`
  inserts).

## 11. Next steps (suggested order)

1. Configure Supabase project + run migrations + deploy all functions.
2. Set `AI_PROVIDER_API_KEY` to bring the AI chat to life end-to-end.
3. Set `PAYMENT_PROVIDER_SECRET` + `PAYMENT_WEBHOOK_SECRET` and register
   the Stripe webhook endpoint to activate subscriptions, featured
   listings/properties, and marketplace "Buy now" checkout.
4. Set `VOICE_PROVIDER_API_KEY` and `MAPS_PROVIDER_API_KEY` to complete
   voice input/output and precise-location place names.
5. Wire a real email provider for transactional notifications (see
   "Known limitations" above).
6. Connect GitHub (CI is already configured in `.github/workflows/ci.yml`).
7. Optionally run `npx cap add android/ios` once the web app is stable
   to produce native app-store builds (see §9c).
