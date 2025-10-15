# Luxury Heritage Web

This repository contains the Luxury Heritage website MVP built with Next.js 14
(App Router) and configured for deployment on Vercel.

## Getting started

1. Install dependencies with [pnpm](https://pnpm.io):

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and populate the required Shopify and
   Supabase credentials.
3. Run the local development server:

   ```bash
   pnpm dev
   ```

The storefront is available at http://localhost:3000.

## Documentation

- [Luxury–Heritage MVP — Website-Only Deployment Guide (Vercel)](docs/luxury-heritage-vercel-deployment.md)

## Scripts

- [`tools/scripts/run-vercel-preview.sh`](tools/scripts/run-vercel-preview.sh):
  Automates building and deploying the Next.js app to a Vercel preview for
  end-to-end testing.
