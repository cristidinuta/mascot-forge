# Mascot Forge

Point it at an App Store link → get a branded mascot, a full pose turnaround, short
animations, and a **MascotSpec** (the behavior contract any consumer app can run).
Built as a generalizable GTM tool: every consumer-app mascot collapses to the same
loop — **log → reflect → rally** — so generating one for any app is filling a fixed
template with a brand and a noun.

## Pipeline

```
App Store URL
  → 01 context   (iTunes Lookup API → app name, description, genre, icon)
  → 02 direction (Gemini text → 3 art-direction questions → you answer)
  → 03 mascot    (Gemini "Nano Banana" → generate + iterate via edits)
  → 04 poses     (Gemini edits w/ the approved mascot as reference →
                  wave · point · write · celebrate · think, in parallel)
  → 05 motion    (Higgsfield image→video, async poll → MP4 per pose)
  → 06 export    (MascotSpec.json + PNGs + MP4s + inferred palette)
```

## Stack

- **Backend:** Convex (functions, storage, scheduler for async polling)
- **Frontend:** Vite + React + TypeScript + Tailwind
- **APIs (server-side only):** Apple iTunes Lookup, Gemini (Nano Banana image + text),
  Higgsfield via a gateway (WaveSpeed / Segmind / Pixazo)

## Setup

```bash
npm install
npx convex dev          # creates your deployment + the convex/_generated/ files,
                        # and writes VITE_CONVEX_URL into .env.local
```

Set the backend secrets (these are NOT read by the frontend):

```bash
npx convex env set GEMINI_API_KEY      AIza...
npx convex env set HIGGSFIELD_API_KEY <gateway key>
npx convex env set HIGGSFIELD_BASE_URL https://api.wavespeed.ai/api/v3
```

Then, in a second terminal:

```bash
npm run dev             # http://localhost:5173
```

## Deploy to Vercel

The frontend is a static Vite build; Convex hosts the backend separately. Two ways:

**Simple (point Vercel at your existing Convex deployment):**
1. Make sure `convex/_generated/` is committed (it is unless you ignored it) — Vercel
   needs those files to build. If missing, run `npx convex dev` once and commit.
2. Import the repo on vercel.com. It auto-detects Vite. Build command `npm run build`
   (now just `vite build` — no typecheck gate), output dir `dist`.
3. Add one Vercel **Environment Variable**: `VITE_CONVEX_URL` = your Convex URL
   (the one in your local `.env.local`).
4. Deploy. Keys (`GEMINI_API_KEY`, etc.) live on **Convex**, never in Vercel.

**Proper (Vercel also deploys the Convex backend to prod):**
- Set the Vercel **Build Command** to `npx convex deploy --cmd 'npm run build'`.
- Add a Vercel env var `CONVEX_DEPLOY_KEY` (Convex dashboard → Settings → Deploy Keys → Production).
- Set your `GEMINI_API_KEY` / Higgsfield keys on the **prod** deployment too:
  `npx convex env set GEMINI_API_KEY AIza... --prod`.

Note: the build failing on Vercel with `tsc` errors is fixed — the build no longer
typechecks (Vite/esbuild just transpiles). For local type safety run `npx tsc --noEmit`.

## Read this before the demo (the parts that bite)

1. **Gemini needs billing enabled.** Image *output* isn't on Gemini's free tier — the
   project behind your AI Studio key (`AIza...`) must have billing on. No identity
   verification required (unlike OpenAI), just a card / prepaid balance. Set a per-day
   request quota on the Generative Language API as a hard spend cap.
2. **Latency.** Image gen takes a few seconds; Higgsfield video is async (queue + poll).
   **Pre-generate the demo company's assets before judging.** The live "Forge" button is
   for one fast happy-path, not a row of long renders on stage.
3. **Higgsfield isn't first-party.** Access runs through a gateway. All gateway-specific
   field names are isolated in `convex/lib/higgsfield.ts` — swap providers by editing
   only that file. Its credits are not covered by the hackathon's OpenAI/Cursor credits.
4. **Hosting.** Convex hosts the backend/data/functions. The React frontend runs locally
   (`npm run dev`) for the demo, or deploy it to Vercel/Netlify and point it at your
   Convex URL. Convex does not host the SPA itself.
5. **Format reality.** Gemini image output is raster → exports are **PNG + MP4 + JSON**, not SVG.
   If you need recolorable vectors for the in-app runtime, keep the SVG-template track
   separate (see roadmap); this tool is the bespoke/AI path.

## File map

```
convex/
  schema.ts            projects · assets · jobs
  projects.ts          create/get/list + stage mutations
  assets.ts            asset list (with URLs) + internal writers
  appContext.ts        01 — iTunes Lookup
  questions.ts         02 — elicitation questions
  mascot.ts            03 — generate + iterate
  poses.ts             04 — 5-pose turnaround (parallel)
  animate.ts           05 — Higgsfield submit + scheduled poll loop
  spec.ts              06 — assemble MascotSpec
  lib/
    gemini.ts          Nano Banana generate/edit + chat JSON (swap models here)
    higgsfield.ts      gateway submit/poll                  (swap gateways here)
    prompts.ts         every prompt template
    constants.ts       POSES, archetypes, pose intents
src/
  App.tsx              landing + sidebar pipeline + stage routing
  types.ts             MascotSpec contract (frontend mirror)
  components/ui.tsx    Button / Panel / Spinner / Annot / ErrorNote
  components/steps/    one file per pipeline stage
```

## MascotSpec — the contract

The export both *defines* what the mascot can do (declarations) and *carries* its
assets. The host app binds three handlers (log / reflect / rally) to real backend
calls — that's the only per-app integration work, regardless of complexity.

```jsonc
{
  "version": "1.0",
  "brand": { "appName", "appStoreId", "iconUrl", "primary", "secondary", "palette": [] },
  "domain": "finance",
  "noun": "expense",
  "mascot": { "name", "character", "personality": [], "greeting" },
  "actions": [ { "id", "archetype": "log|reflect|rally", "name", "description", "params": [] } ],
  "challenges": [ { "id", "name", "description", "durationDays" } ],
  "assets": { "hero", "poses": {}, "videos": {} }
}
```

---

Built entirely during the hackathon as a **separate codebase** from the Welo app
(which is Flutter + Firebase). This is the generalizable mascot-generation layer;
Welo is its first reference customer.
