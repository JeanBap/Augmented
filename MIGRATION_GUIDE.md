# Raise Ready Platform - Migration Guide

Complete step-by-step migration from your current scattered setup to a unified Turborepo monorepo.

## Architecture

```
raiseready-platform/
├── apps/
│   ├── www/           raisereadybook.com       (marketing, books, services, blog)
│   ├── app/           app.raisereadybook.com   (personal finance calculators)
│   └── finance/       finance.raisereadybook.com (financial model editor)
├── packages/
│   ├── auth/          Shared Supabase auth (one login across all apps)
│   ├── db/            Shared Supabase client + types
│   └── config/        Shared Tailwind + TypeScript config
└── supabase/          Database migrations + edge functions
```

Each app deploys as a **separate Vercel project**. If one goes down, the others keep running.

---

## Phase 1: Foundation (Day 1)

### 1.1 Create the GitHub repo

```bash
cd raiseready-platform
git init
git add .
git commit -m "Initial scaffold: Turborepo monorepo with www, app, finance"
gh repo create JeanBap/raiseready-platform --private --push
```

### 1.2 Install dependencies

```bash
npm install
```

### 1.3 Set up Supabase

You already have a Supabase project (ckmtgggscgjmlnuabjojo). We'll reuse it.

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your existing project
cd supabase
supabase link --project-ref ckmtgggscgjmlnuabjojo

# Run the unified schema migration
supabase db push
```

This creates the shared tables: profiles, purchases, saved_calculations, financial_models, favorites.

### 1.4 Configure Supabase Auth for subdomains

In your Supabase dashboard (supabase.com/dashboard):

1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to `https://raisereadybook.com`
3. Add **Redirect URLs**:
   - `https://raisereadybook.com/auth/callback`
   - `https://app.raisereadybook.com/auth/callback`
   - `https://finance.raisereadybook.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for dev)
   - `http://localhost:3001/auth/callback` (for dev)
   - `http://localhost:3002/auth/callback` (for dev)

4. Go to **Authentication > Providers**
   - Enable **Google** (you already have this from calculateapr)
   - Enable **Email** with magic links

### 1.5 Set up Stripe

If you don't have a Stripe account yet:

1. Create account at stripe.com
2. Get your API keys from the Stripe dashboard
3. Create products in Stripe:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Create products (or do this in the Stripe dashboard)
# Books:
stripe products create --name="Start Ready" --default-price-data[currency]=usd --default-price-data[unit_amount]=499
stripe products create --name="Raise Ready" --default-price-data[currency]=usd --default-price-data[unit_amount]=999
stripe products create --name="Model Ready" --default-price-data[currency]=usd --default-price-data[unit_amount]=999
stripe products create --name="Exit Ready" --default-price-data[currency]=usd --default-price-data[unit_amount]=999

# Services:
stripe products create --name="Fundraising Readiness Audit" --default-price-data[currency]=usd --default-price-data[unit_amount]=99000
stripe products create --name="Fractional Fundraise Advisory" --default-price-data[currency]=usd --default-price-data[unit_amount]=200000 --default-price-data[recurring][interval]=month
stripe products create --name="Model Build" --default-price-data[currency]=usd --default-price-data[unit_amount]=500000

# Tool export:
stripe products create --name="Financial Model Export" --default-price-data[currency]=usd --default-price-data[unit_amount]=1000
```

### 1.6 Create .env.local files

Each app needs its own `.env.local`. Copy from the `.env.local.example` in each app and fill in:

```bash
# In each app directory:
cp .env.local.example .env.local
```

All 3 apps use the SAME Supabase URL and keys (that's how shared auth works).

---

## Phase 2: Migrate Content from Augmented + raisereadybook.com (Days 2-3)

### 2.1 Clone the Augmented repo content

```bash
# In a temporary directory
git clone https://github.com/JeanBap/Augmented /tmp/augmented

# Copy blog content
cp -r /tmp/augmented/blog/* apps/www/src/content/blog/

# Copy book content/images
cp -r /tmp/augmented/book/* apps/www/public/books/
cp -r /tmp/augmented/covers/* apps/www/public/images/covers/

# Copy service descriptions
cp -r /tmp/augmented/services/* apps/www/src/content/services/

# Copy assets (images, media)
cp -r /tmp/augmented/assets/* apps/www/public/assets/

# Copy tool descriptions (not the tool code, just descriptions/content)
cp -r /tmp/augmented/tools/* apps/www/src/content/tools/

# Copy shared components.js and cart.js logic into Next.js components
# (Manual step: rewrite cart.js as React component using Stripe)
```

### 2.2 Convert blog posts to MDX

Blog posts from Augmented are plain HTML. Convert them:

```bash
# For each HTML blog post, create an MDX file:
# apps/www/src/content/blog/your-post-slug.mdx

# MDX format:
# ---
# title: "Post Title"
# date: "2026-01-15"
# category: "fundraising"
# description: "Brief description"
# ---
#
# Post content in markdown...
```

### 2.3 Migrate raisereadybook.com content

The live site content (book descriptions, service details, testimonials) needs to be moved into the Next.js pages. The scaffold already has the page structure - you need to fill in the real copy.

Key files to update with real content:
- `apps/www/src/app/page.tsx` (hero copy, testimonials)
- `apps/www/src/app/books/page.tsx` (book descriptions, images)
- `apps/www/src/app/services/page.tsx` (service details)

---

## Phase 3: Migrate Personal Finance Tools from calculateapr (Days 3-5)

### 3.1 Clone the calculateapr repo

```bash
git clone https://github.com/JeanBap/calculateapr /tmp/calculateapr
```

### 3.2 Copy calculation logic

The calculation engines are framework-agnostic TypeScript. They move directly:

```bash
# Core engine (financial model logic)
cp -r /tmp/calculateapr/src/engine/* apps/finance/src/lib/engine/

# Personal finance calculation utilities
# These are in src/contexts/ and src/lib/ - extract the pure math functions
# and put them in:
# apps/app/src/lib/calculations/
```

### 3.3 Migrate React components

calculateapr uses the same stack (React + shadcn + Tailwind), so components port cleanly:

```bash
# Copy shadcn UI components (they're identical in Next.js)
cp -r /tmp/calculateapr/src/components/ui/* apps/app/src/components/ui/
cp -r /tmp/calculateapr/src/components/ui/* apps/finance/src/components/ui/

# Copy calculator-specific components
# For each calculator in calculateapr/src/components/:
# 1. Identify if it's a personal finance tool -> goes to apps/app/
# 2. Or a financial model component -> goes to apps/finance/
```

### 3.4 Convert React Router to Next.js App Router

calculateapr uses React Router DOM. In Next.js, routes are file-based:

```
# Before (React Router):
<Route path="/apr-calculator" element={<APRCalculator />} />
<Route path="/mortgage" element={<MortgageCalculator />} />

# After (Next.js App Router):
apps/app/src/app/tools/apr-calculator/page.tsx
apps/app/src/app/tools/mortgage-calculator/page.tsx
```

For each route in calculateapr:
1. Create `apps/app/src/app/tools/[slug]/page.tsx` or `apps/finance/src/app/...`
2. Copy the component body
3. Replace `useNavigate()` with `useRouter()` from `next/navigation`
4. Replace `<Link to="">` with `<Link href="">` from `next/link`

### 3.5 Migrate Supabase integration

calculateapr already uses Supabase. The integration layer moves to the shared package:

```bash
# The old integration code:
# /tmp/calculateapr/src/integrations/supabase/

# Is now replaced by the shared package:
# packages/db/src/client.ts
# packages/auth/src/supabase-clients.ts

# In your migrated components, replace:
#   import { supabase } from '@/integrations/supabase/client'
# With:
#   import { createBrowserClient } from '@raiseready/auth'
#   const supabase = createBrowserClient()
```

### 3.6 Migrate Zustand stores

```bash
# Copy store definitions
cp -r /tmp/calculateapr/src/hooks/use*.ts apps/app/src/hooks/
# or apps/finance/src/hooks/ depending on the store
```

---

## Phase 4: Migrate Financial Model Pro (Days 5-7)

### 4.1 Copy the engine

```bash
# The Financial Model Pro editor and engine from calculateapr
cp -r /tmp/calculateapr/src/engine/* apps/finance/src/lib/engine/
```

### 4.2 Copy editor components

```bash
# Model editor components
cp -r /tmp/calculateapr/src/components/financial-model/* apps/finance/src/components/model-editor/
# or similar path - adapt based on actual file names
```

### 4.3 Also check Financial_Model_Pro_App repo

```bash
git clone https://github.com/JeanBap/Financial_Model_Pro_App /tmp/fmpa

# Compare with calculateapr to see if there are any unique components
# If FMPA has anything calculateapr doesn't, merge it in
diff -rq /tmp/calculateapr/src/engine /tmp/fmpa/src/engine 2>/dev/null || echo "Different engine versions"
```

### 4.4 Wire up the export payment flow

The $10 export feature uses Stripe Checkout:
1. User clicks "Export to Excel" or "Export to PDF"
2. Check if user has a completed purchase for 'tool_export' in Supabase
3. If not, redirect to Stripe Checkout ($10)
4. Stripe webhook records the purchase
5. User can now export

---

## Phase 5: Deploy to Vercel (Day 7-8)

### 5.1 Create 3 Vercel projects

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy www (main site)
cd apps/www
vercel --yes
# When asked:
# - Project name: raiseready-www
# - Root directory: apps/www

# Deploy app (personal finance)
cd ../app
vercel --yes
# Project name: raiseready-app
# Root directory: apps/app

# Deploy finance (financial model)
cd ../finance
vercel --yes
# Project name: raiseready-finance
# Root directory: apps/finance
```

### 5.2 Configure Vercel projects

In Vercel dashboard for EACH project:

1. Go to **Settings > General**
   - Root Directory: `apps/www` (or `apps/app` or `apps/finance`)
   - Build Command: `cd ../.. && npx turbo build --filter=www` (adjust filter)
   - Install Command: `cd ../.. && npm install`

2. Go to **Settings > Environment Variables**
   - Add all vars from `.env.local.example`
   - All 3 projects use the SAME Supabase URL + anon key

### 5.3 Connect GitHub repo

In each Vercel project:
1. Go to **Settings > Git**
2. Connect to `JeanBap/raiseready-platform`
3. Set the **Root Directory** for the specific app

Vercel will auto-detect which app changed and only rebuild that one.

---

## Phase 6: DNS Configuration (Day 8)

### 6.1 In Namecheap (your domain registrar)

Go to raisereadybook.com DNS settings and add:

```
Type    Host       Value                    TTL
CNAME   @          cname.vercel-dns.com     Auto
CNAME   www        cname.vercel-dns.com     Auto
CNAME   app        cname.vercel-dns.com     Auto
CNAME   finance    cname.vercel-dns.com     Auto
```

Note: For the root domain (@), Namecheap may need an A record instead:
```
Type    Host    Value           TTL
A       @       76.76.21.21     Auto
CNAME   www     cname.vercel-dns.com  Auto
CNAME   app     cname.vercel-dns.com  Auto
CNAME   finance cname.vercel-dns.com  Auto
```

### 6.2 In Vercel dashboard

For each project, add the custom domain:

1. **raiseready-www**: Add `raisereadybook.com` + `www.raisereadybook.com`
2. **raiseready-app**: Add `app.raisereadybook.com`
3. **raiseready-finance**: Add `finance.raisereadybook.com`

Vercel auto-provisions SSL certificates.

### 6.3 Set up redirects for old domains

In the **www** project's `next.config.ts`, add redirects:

```typescript
async redirects() {
  return [
    // Redirect old calculateapr.com traffic
    { source: '/:path*', has: [{ type: 'host', value: 'calculateapr.com' }],
      destination: 'https://app.raisereadybook.com/:path*', permanent: true },
    // Redirect old Vercel URLs
    { source: '/:path*', has: [{ type: 'host', value: 'calculateapr.vercel.app' }],
      destination: 'https://app.raisereadybook.com/:path*', permanent: true },
  ]
}
```

---

## Phase 7: Decommission Old Services (Day 9-10)

### 7.1 Cancel Lovable

Once all calculateapr components are migrated to the new apps:
1. Go to lovable.dev account settings
2. Cancel subscription
3. Keep the GitHub repo as archive

### 7.2 Cancel Netlify

If raisereadybook.com or Augmented was hosted on Netlify:
1. Remove the site from Netlify
2. Delete the Netlify account or downgrade to free

### 7.3 Clean up Vercel

Delete old Vercel projects:
- calculateapr.vercel.app
- financial-model-pro-app.vercel.app

### 7.4 Point old domains

In Namecheap, point calculateapr.com to the new Vercel project (raiseready-app) so old links still work via the redirect.

### 7.5 Archive old repos

```bash
# On GitHub, archive the old repos (don't delete - keep for reference)
gh repo archive JeanBap/calculateapr
gh repo archive JeanBap/Augmented
gh repo archive JeanBap/Financial_Model_Pro_App
```

---

## Phase 8: Cross-Subdomain Auth (Critical)

Supabase auth cookies are domain-scoped. For shared auth across subdomains:

### Option A: Shared cookie domain (Recommended)

In your Supabase client config, set the cookie domain to `.raisereadybook.com`:

```typescript
// In packages/auth/src/supabase-clients.ts
createBrowserClient(url, key, {
  cookieOptions: {
    domain: '.raisereadybook.com', // Note the leading dot
    path: '/',
    sameSite: 'lax',
    secure: true,
  }
})
```

This means a user who logs in on `raisereadybook.com` is automatically logged in on `app.raisereadybook.com` and `finance.raisereadybook.com`.

### Option B: Redirect-based SSO

If cookie sharing doesn't work (some browsers restrict it):
1. User logs in on `raisereadybook.com`
2. On visiting `app.raisereadybook.com`, check for session
3. If no session, redirect to `raisereadybook.com/auth/sso?redirect=app.raisereadybook.com`
4. Main site verifies session and redirects back with a one-time token

**Start with Option A** - it's simpler and works for most cases.

---

## Cost After Migration

| Service | Monthly |
|---------|---------|
| Vercel (Hobby, 3 projects) | $0 |
| Supabase (free tier) | $0 |
| Namecheap (domains) | ~$3 (amortized) |
| Stripe | 2.9% + 30c per transaction only |
| Cloudflare R2 (images) | $0 |
| **Total fixed** | **~$3/mo** |

If you need Vercel Pro for analytics or team features: $20/mo.

---

## Local Development

```bash
# Run all 3 apps simultaneously
npm run dev

# Or run individually
npm run dev:www     # http://localhost:3000
npm run dev:app     # http://localhost:3001
npm run dev:finance # http://localhost:3002
```

Configure ports in each app's `package.json`:
```json
"scripts": {
  "dev": "next dev -p 3000"  // 3001 for app, 3002 for finance
}
```

---

## Checklist

- [ ] Phase 1: Foundation (repo, deps, Supabase, Stripe)
- [ ] Phase 2: Content migration (Augmented + raisereadybook.com)
- [ ] Phase 3: Personal finance tools migration (calculateapr)
- [ ] Phase 4: Financial Model Pro migration
- [ ] Phase 5: Deploy to Vercel (3 projects)
- [ ] Phase 6: DNS configuration (Namecheap)
- [ ] Phase 7: Decommission old services
- [ ] Phase 8: Verify cross-subdomain auth works
- [ ] Final: Test all payment flows end-to-end
