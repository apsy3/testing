# Luxury–Heritage MVP — Website-Only Deployment Guide (Vercel)

> **Scope**: Website-only MVP for Luxury–Heritage built with Next.js App Router, Shopify, and Supabase. Excludes ChatGPT app and non-MVP features (queues, vectors, WhatsApp, payouts automation).

## 1. Architecture (Simplified, Deploy-Friendly)
- **Runtime**: Next.js 14 (App Router) deployed on Vercel.
- **Data & Auth**: Supabase (Postgres, Auth, Storage) with Row Level Security (RLS).
- **ORM & Validation**: Drizzle ORM for schema/migrations; Zod for input validation.
- **Commerce**: Shopify Storefront API for catalog/cart; checkout redirects; Admin webhooks for products and orders.
- **Security Requirements**: HMAC verification on raw webhook body, idempotency on webhook IDs, Supabase RLS, rate limits, no PII in logs.

## 2. Minimal Repo Layout
```
/apps
  /web                # Next.js app (UI + API routes)
/packages
  /db                 # Drizzle schema + migrations + seeds
  /ui                 # UI primitives (optional)
  /types              # Zod schemas + domain types
  /config             # eslint/tsconfig/prettier (shared)
/tools
  /scripts            # seed, webhook replay, smoke tests
```

## 3. Prerequisites
- Vercel account with GitHub/GitLab integration.
- Supabase project (URL, anon key, service role key, database connection string).
- Shopify store with Storefront token and private app for Admin webhooks.
- Local environment: Node.js 20 (see `.nvmrc`/`.node-version`), npm, Supabase CLI (optional), Drizzle CLI (optional).

## 4. Environment Variables (`.env.local` / Vercel)
```
NODE_ENV=development
APP_URL=http://localhost:3000

# Shopify
SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=***
SHOPIFY_ADMIN_API_KEY=***
SHOPIFY_ADMIN_API_SECRET=***
SHOPIFY_WEBHOOK_SHARED_SECRET=***
SHOPIFY_API_VERSION=2025-01

# Supabase
SUPABASE_URL=***
SUPABASE_ANON_KEY=***
SUPABASE_SERVICE_ROLE_KEY=***
DATABASE_URL=postgresql://user:password@host:5432/dbname
CUSTOMER_HASH_SALT=***

# Analytics (optional, behind consent)
POSTHOG_KEY=
GA_MEASUREMENT_ID=
```

## 5. Supabase: Tables, Indexes, RLS
- **Tables**: `profiles`, `artisans`, `products`, `orders`, `order_items`, `processed_webhooks`.
- **Indexes**: `created_at` on `orders`; `artisan_id` on `products` and `order_items`.
- **RLS policies**: Owner/staff read-all; artisans limited to rows matching their `artisan_id`.
- **Customer data**: Store minimal details (e.g., hashed email for deduplication).

## 6. Webhooks in Next.js (App Router)
- Route: `POST /api/webhooks/shopify` (Node runtime for crypto API).
- Verify HMAC on raw body, enforce idempotency via `X-Shopify-Webhook-Id`.
- Example implementation:

The repository ships with a production-ready handler under `apps/web/app/api/webhooks/shopify/route.ts` that performs HMAC
verification on the raw payload, enforces idempotency via the `processed_webhooks` table, and synchronizes products and orders
using Drizzle transactions.

## 7. Middleware Security Headers (CSP/HSTS)
- Apply conservative security headers using middleware; adjust CSP for Shopify and asset domains.
- Enable HSTS only in production.

Security middleware ships preconfigured to allow Shopify and Supabase origins while enforcing CSP, HSTS (production-only),
and baseline hardening headers.

## 8. Local Development
1. Copy `.env.example` to `.env.local` and populate secrets.
2. Run Drizzle migrations to create tables; apply RLS SQL in Supabase dashboard.
3. Start dev server: `node .yarn/releases/yarn-4.4.1.cjs run dev`.
4. (Optional) Use a secure tunnel for Shopify webhook testing.

## 9. Vercel Deployment Steps (Website Only)
1. Push repository to GitHub and import project in Vercel (Add New Project).
2. Framework preset: Next.js (default build command `next build`, output `.next`).
3. Configure environment variables for Production and Preview.
4. Deploy `main` branch to Production.
5. Avoid pointing Shopify webhooks to preview deployments (prevents duplicates).

### Automated Preview Deployments for Testing
- Use `tools/scripts/run-vercel-preview.sh` to build and deploy the website to a temporary preview URL for QA or stakeholder sign-off.
- Defaults to the Next.js app living in `apps/web`; override with `APP_DIR=/path/to/app` if the layout differs.
- Prerequisites: logged-in Vercel CLI plus `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` environment variables (obtain from Vercel dashboard or `vercel link`). Optional variables: `VERCEL_SCOPE`/`VERCEL_TEAM` for team slug, `ENVIRONMENT` (defaults to `preview`), `ENV_FILE` for a specific env file, and `TEST_ALIAS` to update a stable alias.
- Example run from repo root:

```bash
ENVIRONMENT=preview \
ENV_FILE=.env.preview \
VERCEL_TOKEN=xxxxx \
VERCEL_ORG_ID=org_abc123 \
VERCEL_PROJECT_ID=prj_abc123 \
./tools/scripts/run-vercel-preview.sh
```

- The script installs dependencies, builds the Next.js app under `apps/web`, pulls Vercel environment settings, deploys a prebuilt preview, and prints the resulting test URL. Set `TEST_ALIAS=test.luxury-heritage.vercel.app` (or similar) to update a reusable QA hostname.

## 10. Configure Shopify Webhooks (Production URL)
1. In Shopify Admin → Notifications → Webhooks (or via private app).
2. Topics: `products/create`, `products/update`, `orders/create`, `orders/paid`.
3. URL: `https://your-prod.vercel.app/api/webhooks/shopify`.
4. Secret: `SHOPIFY_WEBHOOK_SHARED_SECRET` (must match Vercel environment variable).
5. Send a test delivery — expect `200 OK`; invalid HMAC should return `401`.

## 11. Post-Deploy Smoke Tests
- Visit `/` and `/catalog` (ensure no console errors).
- Call `/api/kpis` (stub JSON initially, real values after sync).
- Update a product in Shopify → product upserted in database.
- Place test order → order and items synced; KPIs update.
- Confirm Vercel logs show no HMAC errors or PII.

## 12. Minimal Search (Postgres FTS)
- Implement full-text search on `products` (title + description) using `tsvector`.
- Endpoint: `GET /api/search?q=ring` → `{ query: "ring", results: [{ id, title, slug, priceCents, currency, imageUrl }] }`.

## 13. Brand-Safe Styling (SCSS Tokens)
- Define SCSS tokens for colors, typography, spacing; import in layout for consistent theming.
- Design language: luxury aesthetic with whitespace, restrained accent color usage, consistent imagery.
- Self-host fonts; preload WOFF2; meet WCAG AA contrast.

```scss
// apps/web/app/styles/_tokens.scss (example)
$brand-primary: #0E0E0E;
$brand-accent:  #C1A36E;
$surface:       #FFFFFA;
$text-primary:  #0A0A0A;
$font-sans: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
$font-serif: "Canela", "Georgia", serif;
```

## 14. Rate Limits (MVP)
- Introduce minimal per-IP rate limits for login, search, and webhooks.
- Use in-memory counters for MVP or Supabase table for persistence.

## 15. SEO & Core Web Vitals Quick Wins
- Use `next/image` with AVIF/WebP; lazy-load below the fold.
- Preload critical fonts; set `font-display: swap`.
- Keep client JavaScript light on storefront pages.
- Add `sitemap.xml`, `robots.txt`, and Product structured data.

## 16. Troubleshooting
- **Webhook 401**: Check HMAC secret and ensure Node runtime; verify raw body read.
- **Duplicate orders**: Ensure idempotency check on `X-Shopify-Webhook-Id`.
- **Artisan data issues**: Confirm RLS policy and `profile.artisan_id` assignment.
- **Slow images**: Adopt `next/image` or optimize assets.
- **Preview deployments receiving webhooks**: Only configure Shopify for production URL.

## 17. Cut List (Deferred Items)
- Redis/queues, vectors/embeddings, WhatsApp integration, returns module, payout automation, advanced audit/crypto, SSE streams.

## 18. Go-Live Checklist
- ✅ Shopify checkout flow works end-to-end.
- ✅ Webhooks deliver, HMAC verified, idempotency enforced.
- ✅ Admin dashboard: GMV/day, orders count, top products (7/30/90 days).
- ✅ Artisan dashboard: Today/7d/30d metrics, orders to fulfill, payouts summary.
- ✅ CSP/HSTS enabled in production; logs free of PII.
- ✅ Supabase backups enabled; restoration drill documented.
