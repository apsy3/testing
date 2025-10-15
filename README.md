# Luxury Heritage Web

This repository contains the Luxury Heritage website MVP built with Next.js 14
(App Router) and configured for deployment on Vercel.

## Getting started

1. Install dependencies with npm (Node 20 recommended via `.nvmrc` / `.node-version`):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and populate the required Shopify and
   Supabase credentials.
3. Run the local development server:

   ```bash
   npm run dev
   ```

The storefront is available at http://localhost:3000.

## Tooling

- Generate and run database migrations with Drizzle Kit:

  ```bash
  npm run -w packages/db drizzle:generate
  npm run -w packages/db drizzle:migrate
  ```

- Seed local data for demos and dashboards:

  ```bash
  npm run -w tools/scripts seed
  ```

- Replay a stored Shopify webhook payload (requires `processed_webhooks` data):

  ```bash
  npm run -w tools/scripts webhook:replay <webhook-id>
  ```

## Documentation

- [Luxury–Heritage MVP — Website-Only Deployment Guide (Vercel)](docs/luxury-heritage-vercel-deployment.md)

## Scripts

- [`tools/scripts/run-vercel-preview.sh`](tools/scripts/run-vercel-preview.sh):
  Automates building and deploying the Next.js app to a Vercel preview for
  end-to-end testing.
