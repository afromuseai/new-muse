# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Replit Migration Notes

- The project is configured to run on Replit with separate workflows for the Vite frontend on port 5000 and the Express API on port 8080.
- The frontend uses relative `/api` requests proxied to the API server in development, preserving client/server separation.
- The development PostgreSQL database is provisioned through Replit and the Drizzle schema has been pushed for local startup.
- Vite is configured with `allowedHosts: true` and a strict configured port for predictable Replit preview behavior.
- On April 15, 2026, the frontend workflow command was simplified to run from the workspace root without an absolute `cd`, and port 5000 was mapped to the web preview.
- On April 15, 2026, the AI Music API instrumental polling loop was repaired after an import produced invalid `continue`/`break` placement outside the polling loop.

## Audio Provider: AI Music API

- **Instrumental generation** is handled by [AI Music API](https://aimusicapi.org) (`AI_MUSIC_API_KEY` env var required).
- POST `/api/v2/generate` → receive `task_id` → poll GET `/api/v2/query?task_id=` every 6 s (up to 30 attempts).
- **Custom Mode** (lyrics present): `prompt` (lyrics text) + `style` string + `title` + `gender`.
- **Inspiration Mode** (no lyrics): `gpt_description_prompt` + `make_instrumental: true`.
- Auth header: `Authorization: Bearer <AI_MUSIC_API_KEY>`.
- **ElevenLabs has been fully removed** — no `xi-api-key`, no IVC (Instant Voice Clone), no ElevenLabs TTS. All vocal routes now return an AI text brief only; real vocal synthesis is pending a new provider.
- Key files: `artifacts/api-server/src/engine/providers/instrumental.ts`, `providerCredentials.ts`, `engineConfig.ts`, `providers/registry.ts`, `providers/vocal.ts`.

## AfroMuse Engine

- The lyrics generation system prompt has been replaced with the AFROMUSE_ENGINE, a clean structured prompt with a fixed song structure (INTRO → CHORUS → VERSE1 → CHORUS → VERSE2 → CHORUS → BRIDGE → OUTRO) and simple rules: catchy chorus, storytelling verses, natural phrasing, short rhythmic lines.
- User inputs map to: theme (topic), mood, language (languageFlavor), style (genre).
- The JSON output format is preserved for frontend compatibility: title, intro, hook, verse1, verse2, bridge, outro, diversityReport, and analytics fields.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

- `pnpm --filter @workspace/scripts run create-admin` — interactively create or promote a user to the admin role

## AfroMuse V3+ Architecture (Monetization & Access Control)

### 3-Tier Plan System
- **Free** — 10 song generations total, basic lyric gen, 3 audio trials
- **Creator Pro** ($20/mo) — Unlimited generations, full lyric controls, full rewrite stack (Humanize/Catchier/Harder), Audio Studio V2, exports, unlimited saves
- **Artist Pro** ($40/mo) — Everything in Creator Pro + Artist DNA engine, voice clone placeholder, persistent memory

### DB Schema (V3 additions to `lib/db/src/schema/users.ts`)
- `planExpiry` — datetime, when the paid plan expires
- `artistDna` — jsonb, persisted Artist DNA style profile
- `voiceCloneData` — jsonb, voice clone metadata placeholder
- `usageStats` — jsonb, per-user usage counters

### DB Schema (new `lib/db/src/schema/usageLogs.ts`)
- `usageLogsTable` — tracks feature-level usage events for analytics

### Backend Access Layer (`artifacts/api-server/src/access/`)
- `types.ts` — `ServerPlanId`, `FeatureKey` union types
- `plans.ts` — PLANS config map, `getPlan()`, `resolveServerPlan()` (bridges legacy "Pro"/"Gold" to new IDs)
- `featureGate.ts` — `checkFeatureAccess()`, `getFeatureGateLabel()`
- `middleware.ts` — `requireAuth`, `attachPlanFromDb`, `requireFeature(key)` middleware chain

### Backend Routes (V3 additions)
- `routes/artist-dna.ts` — `GET/POST /api/artist-dna` (Artist Pro gated)
- `routes/voice-clone.ts` — `POST /api/voice-clone/sing` (Personal Voice Clone Singing Engine — active), `GET /api/voice-clone/job/:jobId` (job polling), `GET /api/voice-clone/status`
- `routes/stripe.ts` — `POST /api/stripe/create-checkout-session`, `POST /api/stripe/webhook`; gracefully returns 503 if `STRIPE_SECRET_KEY` not set
- `routes/usage.ts` — `GET /api/usage/stats`
- `routes/generate-song.ts` — `/rewrite-lyrics`, `/harden-lyrics`, `/catchier-lyrics` now gated with Creator Pro middleware

### Frontend Access Layer (`artifacts/afromuse-ai/src/`)
- `lib/access/types.ts` — `PlanId`, `FeatureKey` types
- `lib/access/plans.ts` — `PLANS`, `resolveServerPlan()`, `getPlan()`
- `context/PlanContext.tsx` — `Plan` = `"Free" | "Creator Pro" | "Artist Pro"`, `PLAN_LIMITS`, `PLAN_COLORS`, `FEATURES`, `usePlan()`

### Frontend UI (V3 additions)
- `components/ui/SubscriptionModal.tsx` — Stripe checkout flow modal with monthly/yearly toggle
- `components/ui/UpgradeModal.tsx` — 3-tier upgrade prompt
- `pages/Pricing.tsx` + `components/sections/Pricing.tsx` — Updated with Creator Pro/Artist Pro cards
- `pages/Studio.tsx` — Advanced Songwriting controls gated (Creator Pro), rewrite buttons gated (Creator Pro), Artist DNA panel added (Artist Pro only)
- `components/layout/Navbar.tsx` — Plan badge with Crown/Zap icons for Artist Pro/Creator Pro

### Stripe Integration Notes
- Add `STRIPE_SECRET_KEY` env var to enable payments
- Add `STRIPE_WEBHOOK_SECRET` env var to verify webhooks
- `app.ts` applies `express.raw()` before JSON middleware for `/api/stripe/webhook`
- `build.mjs` externalizes `stripe` so runtime `require("stripe")` works without bundling

## Live Engine Control Layer (V2 Operations Upgrade)

Second architectural upgrade adding full operational control before real audio API integration. Zero UI changes. Zero breaking changes to existing engine, routes, or providers.

### New Files

**`artifacts/api-server/src/engine/engineConfig.ts`**
Per-environment engine mode configuration. Defines `EngineMode` ("mock" | "live" | "disabled") and `EngineEnvironment` ("development" | "staging" | "production"). Each environment (dev/staging/prod) has independent mode defaults and `fallbackToMock` flags per provider. Supports runtime overrides via `setProviderModeOverride(category, mode)` / `clearProviderModeOverride(category)`. Key exports: `getActiveEngineConfig()`, `getProviderModeConfig(category)`, `getProviderModeOverride(category)`.

**`artifacts/api-server/src/engine/providerCredentials.ts`**
Credential slot registry for future live provider API keys. Each provider (instrumental, vocal, mastering, stems) has a `ProviderCredentialSlot` with `apiKey`, `endpoint`, `model`, `region`, `timeoutMs` — all sourced from env vars (e.g. `INSTRUMENTAL_API_KEY`, `INSTRUMENTAL_API_ENDPOINT`). All null by default — safe to deploy now. Key exports: `getProviderCredentials(category)`, `isCredentialReady(category)`, `getCredentialSummary(category)` (no secret values).

**`artifacts/api-server/src/engine/providerResolver.ts`**
Single decision point for "what mode should this provider run in?" Resolution priority: (1) caller-specified override → (2) runtime override → (3) env-config default → (4) registry forced-disabled. Safety guard prevents live mode from running in development unless `allowLiveInDev` is explicitly set. Returns `ResolvedProviderMode` with `resolvedMode`, `source`, `isLiveCapable`, `credentialsReady`, `canRun`, `disabledReason`. Key exports: `resolveProviderMode(category, requestedMode?)`, `resolveAllProviders()`.

**`artifacts/api-server/src/engine/fallback.ts`**
Structured fallback behavior for live provider failures. Supports two strategies per provider: "fall back to mock" (reads `fallbackToMock` from env config) or "fail cleanly" (structured `NormalizedResponse` with error). Never silently swallows failures. Key exports: `buildFailureResponse(jobId, category, reason, message)`, `executeFallback(jobId, category, error, mockRunner)`.

**`artifacts/api-server/src/engine/diagnostics.ts`**
Complete engine state snapshot for admin/debug inspection. Reports: current environment, resolved modes and their sources, registry statuses, credential slot readiness (no secret values), capability profiles, fallback config, overall engine mode classification ("all-mock" | "partial-live" | "all-live" | "all-disabled"), safety settings. Key exports: `getEngineDiagnostics()` → `EngineDiagnostics`.

### Updated Files

**`artifacts/api-server/src/engine/types.ts`**
Added `EngineMode` type ("mock" | "live" | "disabled") alongside existing `ProviderStatus`.

**`artifacts/api-server/src/routes/generate-audio.ts`**
Added `GET /engine/diagnostics` endpoint that returns a full `EngineDiagnostics` snapshot. Internal/admin use only — gate with auth middleware before exposing publicly in production.

### Live Provider Activation Checklist (per category)
1. Set registry `status → "live-ready"`, `isLive → true` in `providers/registry.ts`
2. Set environment config `mode → "live"` in `engineConfig.ts`
3. Configure credential env vars (`<CATEGORY>_API_KEY`, `<CATEGORY>_API_ENDPOINT`, etc.)
4. Implement the live `run()` logic inside the provider module
5. The resolver automatically enables it — routes and UI untouched

### Diagnostics Endpoint
`GET /api/engine/diagnostics` — returns full engine state. No auth required in development. Add auth middleware before exposing in production.

## Instrumental Live Provider Bridge (V2 First Live Provider Path)

Focused upgrade to the instrumental provider only. All other providers (vocal, mastering, stems) are untouched and remain fully mocked.

### What Changed

**`artifacts/api-server/src/engine/providers/instrumental.ts`** — Complete refactor. File structure:

1. **`InstrumentalPayload`** — unchanged public interface (routes still work as-is)
2. **`LiveInstrumentalProviderResponse`** — new shape for real provider responses, including: `previewUrl`, `wavUrl`, `externalJobId`, `generationTitle`, `sonicNotes`, `duration`, `coverArtUrl`, `waveformMeta`
3. **`buildBaseMetadata()`** — extracted helper (was inline in `run()`)
4. **`fetchAiSessionBrief()`** — unchanged AI brief logic, now called by both mock and live paths
5. **`runMock()`** — all previous mock logic, cleanly isolated
6. **`callLiveInstrumentalProvider()`** — isolated live request execution block. Reads credentials from `getProviderCredentials("instrumental")`. Contains the clearly marked DROP-IN ZONE where real API call logic goes. Throws a structured error until implemented (triggers fallback correctly)
7. **`runLive()`** — complete live execution path: calls provider → enriches with AI brief → maps into `RawInstrumentalResponse` → normalizes through adapter
8. **`run()`** — new dispatcher: calls `resolveProviderMode("instrumental")`, routes to mock/live/disabled, wires live failures through `executeFallback()`

### Live Drop-in Checklist (Instrumental)
1. Set `registry.ts` → `status: "live-ready"`, `isLive: true`
2. Set `engineConfig.ts` dev/staging/prod → `instrumental.mode: "live"`
3. Set env vars: `INSTRUMENTAL_API_KEY`, `INSTRUMENTAL_API_ENDPOINT`, `INSTRUMENTAL_MODEL`, `INSTRUMENTAL_TIMEOUT_MS`
4. Implement the body of `callLiveInstrumentalProvider()` — map provider response to `LiveInstrumentalProviderResponse`
5. Zero changes to routes, adapters, job store, or UI

### Fallback Behavior (Instrumental)
- In development/staging: `fallbackToMock: true` — live failure → mock run, annotated in notes
- In production: `fallbackToMock: false` — live failure → clean `NormalizedResponse` with structured error
- Disabled mode → immediate clean failure, no dispatch

## Engine Integration Readiness Layer (V2 Architecture Upgrade)

Six-component internal architecture upgrade hardening the engine before real audio API integration. No UI changes.

### New Files

**`artifacts/api-server/src/engine/capabilities.ts`**
Capability profiles for all four providers. Each profile declares 10 boolean flags:
`supportsInstrumental`, `supportsVocals`, `supportsBlueprint`, `supportsMastering`, `supportsStems`, `supportsPreviewOnly`, `supportsFullExport`, `supportsPolling`, `supportsRealtime`, `supportsCustomLyrics`.
Exports `getCapabilities(category)` and `listAllCapabilities()`.

**`artifacts/api-server/src/engine/translators.ts`**
Payload translation layer. Five functions translate the internal `AfroMuseSessionState` into each provider's specific request payload:
`toInstrumentalPayload`, `toVocalDemoPayload`, `toLeadVocalPayload`, `toMasteringPayload`, `toStemExtractionPayload`.
When a new real provider has a different request shape, only the relevant translator changes.

**`artifacts/api-server/src/engine/adapters.ts`**
Response adapter layer. Four raw provider response types (`RawInstrumentalResponse`, `RawVocalResponse`, `RawMasteringResponse`, `RawStemExtractionResponse`) with adapter functions that normalize them to `NormalizedResponse`.
All four mock providers now build a raw response and pass it through the adapter — proving the architecture end-to-end with current mock data.

**`artifacts/api-server/src/engine/compatibility.ts`**
Feature/mode compatibility checks called before dispatching jobs:
`canProviderHandleBuildMode`, `canProviderHandleMasteredExport`, `canProviderHandleCustomLyrics`, `canProviderHandleStems`, `canProviderHandleRealtime`, `canProviderHandlePolling`, `checkCapability` (generic).

### Updated Files

**`artifacts/api-server/src/engine/types.ts`**
Added `ProviderStatus` ("mock" | "live-ready" | "unavailable" | "disabled"), `ProviderCapabilities` interface, and `AfroMuseSessionState` (canonical session input to all translators).

**`artifacts/api-server/src/engine/providers/registry.ts`**
`ProviderConfig` now has `status: ProviderStatus` alongside `isLive`. `listProviders()` now includes the full capability profile per provider. Added `isProviderActive(category)` helper.

**`artifacts/api-server/src/engine/providers/instrumental.ts` / `vocal.ts` / `mastering.ts` / `stems.ts`**
All four providers refactored: they build a `RawXxxResponse` and call `adaptXxx()` before returning. Live swap pattern is documented inline — replace the raw response block with a real API call.

**`artifacts/api-server/src/routes/generate-audio.ts`**
Compatibility checks wired into dispatch routes: `canProviderHandleCustomLyrics` before lead-vocal, `canProviderHandleMasteredExport` before mix-master, `canProviderHandleStems` before extract-stems. `GET /engine/providers` now returns capability profiles and `engineMode` field.

### Live Swap Pattern
When a real API is ready for any provider:
1. Call the real API with the translated payload (from `translators.ts`).
2. Map its response to the relevant `RawXxxResponse` type.
3. Pass it to the adapter (`adaptXxx()`).
4. Set `status: "live-ready"` and `isLive: true` in `registry.ts`.
5. Update capability profile in `capabilities.ts` if the real API has different capabilities.
Changes are isolated to the relevant provider module + its translator — routes and UI are untouched.

## Project Library / Saved Sessions (V2 Upgrade)

Local-first session persistence layer added to the Studio page. Architecture is designed to be swapped for a real backend later without touching the UI layer.

### New Files

- **`artifacts/afromuse-ai/src/lib/projectLibrary.ts`** — `SavedSession` model, localStorage persistence (up to 50 sessions), status intelligence (`Draft → In Progress → Instrumental Ready → Vocal Ready → Export Ready`), CRUD helpers (`saveSession`, `deleteSessionById`, `duplicateSessionById`, `updateSessionOutputRegistry`).
- **`artifacts/afromuse-ai/src/context/ProjectLibraryContext.tsx`** — React context provider (`ProjectLibraryProvider`) with `saveCurrentSession`, `deleteSession`, `duplicateSession`, and `refresh`. Also exports `extractResumeState` helper.
- **`artifacts/afromuse-ai/src/components/studio/ProjectLibraryPanel.tsx`** — Compact collapsible "Project Library" sidebar panel showing saved sessions with status badges, last-updated timestamps, and Resume / Duplicate / Delete actions.

### Integration Points

- **`artifacts/afromuse-ai/src/App.tsx`** — `ProjectLibraryProvider` wraps the Studio route.
- **`artifacts/afromuse-ai/src/pages/Studio.tsx`** — Uses `useProjectLibrary` to save sessions, and `handleResume` to restore all form state + draft from a saved session. "Save to Projects" button now saves locally without requiring login.

### Session Fields

`sessionId`, `sessionTitle`, `topic`, `genre`, `mood`, `songLength`, `lyricsSource`, `lyricsText`, `languageFlavor`, `customFlavor`, `style`, `notes`, `commercialMode`, `lyricalDepth`, `hookRepeat`, `genderVoiceModel`, `performanceFeel`, `bpm`, `key`, `energy`, `atmosphere`, `leadVoice`, `mixFeel`, `buildMode`, `currentStage`, `exportStatus`, `draft`, `outputRegistry`, `createdAt`, `updatedAt`.

## Lyrics-Aware Beat Shaping System

Deep lyrical analysis layer that intelligently shapes instrumental direction from song content — making the Audio Studio feel like it builds a beat around the song, not beside it.

**`deriveLyricsSignal(lyrics: string): LyricsSignal`** — the core analysis function that derives:
- `tone` — existing LyricsTone keyword scan (spiritual / intimate / street / party / defiant / neutral)
- `energyLevel` — high/medium/low from energy word lists + exclamations + ALL CAPS
- `hookPotential` — high/medium/low from line repetition and short-line ratio  
- `pacingFeel` — slow/medium/fast from average words-per-line
- `intimacyScale` — intimate or performance (derived from tone)
- `writingLead` — storytelling or vibe (narrative word density + uniqueness ratio)
- `beatShapingHints` — array of actionable beat direction strings derived from all signals
- `diagnosticSummary` — compact one-line internal diagnostic string

**Wired into the intelligence pipeline:**
- `buildFullIntelligence` computes `lyricsSignal` first, uses it for `lyricsTone`, and passes it through all builders
- `buildArrangementStyle` now receives `lyricsTone` (previously missing — arrangement hints were never applied)
- `buildProducerNotes` uses top 3 `beatShapingHints` for lyrics-aware beat shaping (replaces simple tone note)
- `buildStudioExportNotes` surfaces lyrics intelligence, beat shaping derived hints, hook direction, and arrangement signal in the Session Notes block
- `FullIntelligence` includes `lyricsSignal` for diagnostic access

**UI microcopy:** "· lyrics-aware" badge appears in the lyrics section header when lyrics contain sufficient content (>30 chars)

**Works for:** Lyrics Studio generated lyrics AND user-pasted custom lyrics — both flow through `audioLyrics` state and into `buildFullIntelligence`

## Beat DNA Feature (V2 Completion)

A premium musical control layer inside the Audio Studio that makes AfroMuse producer-aware and beat-intentional.

**Four controls added to the Audio Studio UI:**
- **Bounce Style** — groove motion feel (Smooth Glide, Club Bounce, Street Bounce, Late Night Swing, Festival Lift, Slow Wine, Log Drum Drive)
- **Melody Density** — melodic layer weight (Minimal, Balanced, Rich, Lush, Cinematic)
- **Drum Character** — percussion texture feel (Clean, Punchy, Raw, Dusty, Percussive, Heavy Groove)
- **Hook Lift** — chorus/drop energy level (Subtle, Balanced, Big, Anthemic, Explosive)

**Intelligence integration:** All four Beat DNA values are passed into `buildFullIntelligence()` and flow through to `buildProducerNotes`, `buildHookFocus`, `buildBeatSummary`, `buildStudioExportNotes` — each one generating specific, meaningful language about groove, melody, drums, and hook payoff.

**Session persistence:** Beat DNA fields are saved to the project library (`SavedSession` + `SaveSessionParams`) and restored on resume via `AudioStudioV2Handle.getBeatDNAState()` / `setBeatDNAState()`. They survive session duplication (spread on clone in `duplicateSessionById`).

**Key files:** `lib/audioIntelligence.ts`, `components/studio/AudioStudioV2.tsx`, `lib/projectLibrary.ts`, `context/ProjectLibraryContext.tsx`, `pages/Studio.tsx`

## Lead Vocal Generation Feature

Added `POST /api/generate-lead-vocals` endpoint in `artifacts/api-server/src/routes/generate-audio.ts`.

**Inputs**: `lyrics`, `instrumentalUrl`, `gender`, `performanceFeel`, `vocalStyle`, `emotionalTone`, `buildMode`, `genre`, `bpm`, `key`

**Backend flow**:
- Creates an in-memory job (type `"lead-vocal"`) and returns a `jobId` immediately
- Calls NVIDIA AI (`qwen/qwen3.5-122b-a10b`) to generate a detailed `LeadVocalSessionData` brief
- Poll progress via `GET /api/audio-job/:jobId` — returns `leadVocalSessionData` when complete
- Gracefully skips AI brief if `NVIDIA_API_KEY` is not set

**LeadVocalSessionData fields**: `vocalBrief`, `phrasingGuide`, `emotionalArc`, `syncNotes`, `performanceDirection`, `deliveryStyle`, `vocalProcessingNotes`

**Frontend** (`artifacts/afromuse-ai/src/components/studio/AudioStudioV2.tsx`):
- Lead Vocal Identity section (Section 3) now includes: Emotional Tone picker, Instrumental Track URL input, Session Build Mode toggle (Full / Vocal Demo), and "Generate Lead Vocals" button
- Result renders as a full-width panel below the main 3-card grid with colour-coded sub-sections for each brief field
- "Copy Full Brief" button copies all 7 fields to clipboard

**Requires**: `NVIDIA_API_KEY` environment secret for AI brief generation.

## Personal Voice Clone Singing Engine

Full AI singing engine where the user's own 30-second voice recording is the sole reference. No artist imitation. 

**Parameters** (from user spec):
- **Performance Feel**: Smooth / Melodic / Gritty / Emotional / Soulful / Intimate / Confident / Airy / Prayerful / Street
- **Dialect Depth**: Light / Medium / Deep
- **Voice Texture**: Warm / Bright / Breathier / Raspy / Powerful
- **Hitmaker Mode**: On / Off — enhances energy, timing, phrasing without altering voice identity

**Backend** (`artifacts/api-server/src/`):
- `engine/providers/vocal.ts` — `VoiceClonePayload` interface + `runVoiceCloneSing()` function with dedicated NVIDIA AI prompt
- `routes/voice-clone.ts` — `POST /api/voice-clone/sing` (multipart-free — base64 JSON), `GET /api/voice-clone/job/:jobId`, `GET /api/voice-clone/status`
- `engine/types.ts` — `SessionBlueprintData` extended with `singingBrief`, `voiceAnalysis`, `singingDirection`, `performanceNotes`, `stemConfig`, `voiceCloneProcessingChain`, `voiceCloneMetadata`; `AudioJobType` extended with `"voice-clone-sing"`

**Frontend** (`AudioStudioV2.tsx`):
- `VoiceCloneData` interface
- Voice recorder (MediaRecorder API, webm/opus, 30s max) with waveform animation, countdown progress bar, playback, discard/redo
- "Personal Voice Clone" sub-section inside Voice Engine expander panel with: recorder, Performance Feel selector (10 options), Hitmaker Mode toggle, "Generate My Singing Demo" CTA button (visible only when recording captured)
- Voice Clone Singing Demo result card: Singing Directive, Voice Analysis, Singing Direction, Performance Notes, Processing Chain, Stem Configuration, Ad-lib Suggestions, vocal demo stem slot (with "Export Stem" button that notifies when synthesis API not yet connected), Copy Directive button
- Recording stored as `Blob`, converted to base64 on submit, sent as JSON to `/api/voice-clone/sing`

**Synthesis API slot**: Audio URL slots remain `null` until a real voice synthesis provider (e.g. ElevenLabs Voice Clone API) is connected.

## Authentication System

Real server-side authentication using JWT cookies.

- **Users table**: `lib/db/src/schema/users.ts` — stores name, email, bcrypt password hash, role (`user` | `admin`)
- **Auth routes** (`/api/auth/*`):
  - `POST /api/auth/register` — create account, returns user + sets httpOnly JWT cookie
  - `POST /api/auth/login` — verify credentials, returns user + sets httpOnly JWT cookie
  - `POST /api/auth/logout` — clears the auth cookie
  - `GET /api/auth/me` — returns current user from cookie (used on app load to restore session)
- **JWT**: signed with `SESSION_SECRET` env var, 7-day expiry, stored in httpOnly cookie
- **Password hashing**: bcryptjs, 12 rounds
- **Frontend AuthContext** (`artifacts/afromuse-ai/src/context/AuthContext.tsx`):
  - Calls `/api/auth/me` on mount to restore session
  - `login()` and `signup()` are async, return `{success, error?}`
  - `user` object includes `role` field
- **Route guards**:
  - `ProtectedRoute` — redirects to `/auth` if not logged in
  - `AdminRoute` — redirects to `/` if not admin (role !== 'admin')
- **Admin visibility**: Admin link and panel only shown when `user.role === 'admin'`
- **Create admin**: Run `pnpm --filter @workspace/scripts run create-admin` in Shell tab

## AfroMuse V2 Final Polish Pass (Completed)

The V2 Studio has gone through a final completion pass. Key fixes applied:

- **`AudioStudioV2.tsx`**: "Blueprint Locked" status label → "Blueprint Ready"; removed dead-end "WAV Preparing" button in instrumental preview footer; changed per-stem "WAV Preparing" buttons to static non-interactive "WAV · Coming Soon" badges; removed dead-end "Export Session" button from session export bar; FinalExportCard export toasts are now honest (directing users to MP3 player or noting coming Pro features); ProToolsSection "Prepare My Session" button removed; "See What's Coming" is now a real `/pricing` link; Studio Export Notes section gets `id="studio-export-notes"` anchor for scroll-to navigation; FinalExportCard footer copy updated to be accurate.
- **`SendToAudioCard.tsx`**: Removed duplicate "Instrumental Only" quick mode (was identical to the primary "Instrumental Quick Setup" button) — replaced with "Full Session" (default mode) so all three quick-mode grid items are distinct.
- **`BringToLifeCard.tsx`**: `downloadProductionNotes` now handles V2 drafts that don't have V1 fields (`chordVibe`, `melodyDirection`, `arrangement`) by using optional spread — falls back to just writing the hook if available. No more undefined values in exported notes.

These changes align with the V2 completion spec: no fake future UX, honest available-now vs coming-soon states, and a coherent premium studio feel.
