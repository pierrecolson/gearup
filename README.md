# GearUp

Personal gear sorting tool — track every laptop, camera, lens, battery, console you own. What you paid, what it's worth today, when the warranty runs out, when you bought it and where, what you wish you owned next.

Local-only for now. Storage is plain JSON in `data/` so it can be moved behind a GitHub-as-DB backend later by swapping one module.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For sample data:

```bash
npm run seed
```

## What lives where

```
data/devices.json      # all owned + wishlist + sold + retired devices
data/groups.json       # device groupings (e.g. "Sony A7III Kit")
data/categories.json   # user-defined categories (built-ins live in code)
data/resellers.json    # shops + sellers with cached logos
data/settings.json     # display currency, default input currency, date format
data/uploads/          # receipt PDFs / images (gitignored)
data/.cache/           # FX rates, thiings icons, version lookups (gitignored)
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui (base-nova) · Recharts · date-fns · Zod · Phosphor icons.

External data sources: Frankfurter (historical FX) · logo.dev (brand/reseller logos) · Google s2 favicons (reseller fallback) · thiings API (9000 category icons) · OpenRouter (optional version-release lookup; defaults to `openai/gpt-5-mini`).

## Currency model

- Every device stores both the original price (e.g. ₩4,500,000) and a **frozen snapshot** of its EUR-equivalent at the time of purchase, looked up via Frankfurter using the actual purchase-date rate.
- Today's-value views compute live using today's rate; the frozen snapshot never changes when rates move.
- Defaults: KRW input, EUR display. Change in `/settings`.

## Environment

Hand-build `.env.local` (gitignored) with the keys you want enabled:

```
NEXT_PUBLIC_LOGODEV_KEY=pk_...   # brand & reseller logos (publishable; safe in client)
LOGODEV_SECRET=sk_...            # logo.dev server-side ops (currently unused; reserve)
THIINGS_API_URL=...              # self-hosted thiings catalog
THIINGS_API_KEY=...              # bearer for the thiings API
OPENROUTER_API_KEY=sk-or-...     # optional — enables AI version-release lookup
OPENROUTER_MODEL=openai/gpt-5-mini  # optional override; e.g. google/gemini-2.5-flash
```

All keys are optional; the app gracefully degrades (letter-monogram logos, no thiings icons, no AI lookup) when any are missing.
