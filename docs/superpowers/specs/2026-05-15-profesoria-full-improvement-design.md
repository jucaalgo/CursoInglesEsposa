# Profesoria: English Mastery — Full Improvement Design

> Date: 2026-05-15
> Approach: Sequential (Phase by Phase)
> Deploy target: Vercel (prj_JaIZ7JIdifl5xndYdpZ7mNO2mGgd)
> Stack: React 19 + Vite 6 + Tailwind 4 + Supabase + Gemini AI

---

## Already Implemented (Skip)

These items from the original audit are already done:

- AuthGate with landing page for unauthenticated users
- Toast system (ToastProvider + ToastContainer)
- 4-step Onboarding flow (welcome, interests, placement quiz, results)
- Lazy loading with React.lazy + Suspense
- useUserProfile with AbortController (race condition fix)

---

## Phase 1 — Critical Fixes (Days 1-2)

### 1.1 Fix 404 Error on profesoria_profiles

**Problem:** The Supabase query to `profesoria_profiles` returns 404. The table may not exist or RLS policies may not be configured correctly for the project.

**Fix:**
- Verify the table schema exists in the Supabase dashboard for the correct project
- Create the table if missing with the schema from `supabase/migrations/01_initial_schema.sql`
- Enable RLS and apply the correct policies
- The `username` field stores `auth.uid()::text` — verify this matches the query pattern

**Files:** `supabase/migrations/`, `src/services/repository.ts`, `src/services/supabase.ts`

### 1.2 Backend Proxy for Gemini API Key

**Problem:** `VITE_GEMINI_API_KEY` is exposed in the client bundle. Anyone can extract it from DevTools.

**Fix:**
- Create Supabase Edge Function `gemini-proxy` that stores the API key as a secret
- Modify `src/services/ai/client.ts` to call the proxy instead of Gemini directly
- Remove `VITE_GEMINI_API_KEY` from `.env.local` and client code
- Remove the manual API key input option from Settings
- Remove `profesoria_api_key` from localStorage in all files

**Files:** `supabase/functions/gemini-proxy/index.ts`, `src/services/ai/client.ts`, Settings component (if exists)

### 1.3 Memory Leak in AudioRecorder + LiveSession

**Problem:** AudioRecorder's cleanup useEffect depends on `isRecording`, causing premature track stops. LiveSession never disconnects automatically and uses deprecated `ScriptProcessorNode`.

**Fix:**
- AudioRecorder: Remove `isRecording` from useEffect dependencies, use `useRef` to track recording state
- LiveSession: Add `disconnect()` call in component cleanup, add 5-minute inactivity timeout
- Migrate `ScriptProcessorNode` to `AudioWorkletNode`

**Files:** `src/components/AudioRecorder.tsx`, `src/services/ai/live.ts`, `src/hooks/useLiveSession.ts`

### 1.4 Rate Limiting on Gemini Calls

**Problem:** No debounce or throttle on AI chat input. Users can spam and generate hundreds of API calls.

**Fix:**
- Add 2-second debounce on Practice chat input
- Add throttle on `generateInteractiveContent` with same-topic cache hit
- Implement exponential backoff retry on 429 errors

**Files:** `src/utils/rateLimiter.ts` (new), `src/pages/Practice.tsx`, `src/services/ai/generators.ts`

---

## Phase 2 — UX and Protection (Days 3-4)

### 2.1 Password Validation

**Problem:** Signup only validates `minLength={6}`. No confirmation field, no strength indicator.

**Fix:**
- Add password confirmation field
- Add strength indicator (weak/medium/strong)
- Show specific errors (min 8 chars, number, symbol)
- Add password visibility toggle

**Files:** `src/pages/Auth/SignupPage.tsx`

### 2.2 Initial Loading Screen

**Problem:** Blank white screen while JS bundle loads.

**Fix:**
- Add branded spinner/splash inside `<div id="root">` in `index.html`
- React replaces it automatically on mount
- Add skeleton screens in Home while profile loads

**Files:** `index.html`, `src/pages/Home.tsx`

### 2.3 Connection Status Indicator

**Problem:** No visual feedback when offline, syncing, or when Supabase is unreachable. Errors are only in console.

**Fix:**
- Offline: yellow banner "Sin conexion — cambios guardados localmente"
- Syncing: spinning sync icon
- Error: red toast with retry button
- Differentiate: no network vs server error vs timeout

**Files:** `src/hooks/useOnlineStatus.ts` (new), `src/components/ConnectionBanner.tsx` (new), `src/components/Layout.tsx`

### 2.4 Strict RLS for Leaderboard

**Problem:** `getAllProfiles()` reads all profile fields from all users.

**Fix:**
- Create `profesoria_leaderboard` view exposing only: username, name, xp_total, streak_count, current_level
- Update `getAllProfiles()` to use the view
- Update RLS policy: SELECT on profiles only for leaderboard fields

**Files:** `supabase/migrations/02_leaderboard_view.sql` (new), `src/services/repository.ts`

---

## Phase 3 — Performance (Days 5-6)

### 3.1 Cache Size Limits

**Problem:** TTS cache stores base64 audio in localStorage without size limits. Can exceed 5-10MB quota.

**Fix:**
- Implement 2MB total cache limit
- Separate lesson cache (1MB) from TTS cache (1MB)
- Proactive cleanup on app load, not just on `setItem` failure
- Migrate TTS cache to IndexedDB for larger capacity

**Files:** `src/services/cache.ts`

### 3.2 TTS Cancellation

**Problem:** Each AI response generates a TTS call that plays completely. If user sends a new message, both audios overlap.

**Fix:**
- Maintain ref to current `AudioBufferSourceNode`
- Call `.stop()` before playing new audio
- Cancel pending TTS if user sends a new message

**Files:** `src/pages/Practice.tsx`, `src/services/audio.ts` (or equivalent TTS service)

### 3.3 Dynamic Styles — Remove Hardcoded Colors

**Problem:** Many components use `bg-gray-*`, `text-gray-*`, `border-gray-*` instead of CSS variables. This breaks theme switching.

**Fix:**
- Audit all hardcoded gray color classes
- Replace with CSS variable equivalents from the theme system
- Verify all 6 themes work in every component

**Files:** Multiple component files

---

## Phase 4 — SEO and Visibility (Days 7-8)

### 4.1 Public Landing Page

**Sections:**
- Hero: "Master English with AI" + CTA "Start Free"
- Features: 6 cards (Smart Practice, Academy, Grammar Lab, Pronunciation, Hands-Free, Streaks)
- How It Works: 3 steps (Sign up, Take placement test, Start learning)
- Social Proof: Stats + testimonials
- Pricing: Free + Pro plans
- FAQ: Schema FAQPage for Google
- Footer: Links

**Files:** `src/pages/Landing.tsx` (new), `src/App.tsx` (add route)

### 4.2 Dynamic Meta Tags

**Fix:**
- Install `react-helmet-async`
- Create `SEOHead` component with title, description, OG, canonical
- Add meta tags per route: Home, Features, Pricing, About
- Correct description to English

**Files:** `src/components/SEOHead.tsx` (new), route pages

### 4.3 Sitemap, robots.txt, Schema Markup

**Fix:**
- Create `public/robots.txt`
- Generate `sitemap.xml` with public routes
- Add Schema markup: SoftwareApplication + Organization
- Remove `user-scalable=no` from viewport

**Files:** `public/robots.txt` (new), `public/sitemap.xml` (new), `index.html`

### 4.4 PWA Manifest

**Fix:**
- Add PNG icons 192x192 and 512x512
- Complete manifest: `start_url`, `display`, `background_color`
- Create real favicon (not emoji SVG)
- Add `apple-touch-icon`

**Files:** `public/manifest.json`, `public/` icons, `index.html`

---

## Phase 5 — Product Improvements (Days 9-12)

### 5.1 Global State with Zustand

**Fix:**
- Install `zustand`
- Create `useProfileStore` — loads profile once, shared across app
- Create `useUIStore` — toasts, modals, connection status
- Migrate `useUserProfile` from repeated Supabase calls to store

**Files:** `src/stores/profileStore.ts` (new), `src/stores/uiStore.ts` (new), `src/hooks/useUserProfile.ts`

### 5.2 Improved Offline Mode

**Fix:**
- Verify service worker caches assets (vite-plugin-pwa)
- Add visual offline indicator (from 2.3)
- Cache visited lessons for offline use
- Queue offline actions that sync on reconnect

**Files:** `vite.config.ts`, `src/hooks/useOfflineSync.ts` (new), `src/services/repository.ts`

### 5.3 GA4 Analytics

**Events:**
- `signup` (method, level)
- `lesson_start` (topic, level)
- `lesson_complete` (topic, level, xp_earned, time_spent)
- `practice_message` (level, has_corrections)
- `pronunciation_attempt` (score, level)
- `streak_milestone` (streak_days)

**Files:** `src/lib/analytics.ts` (new), component hooks

---

## Phase 6 — Marketing and Growth (Days 13-16)

### 6.1 Pricing Page

| Plan | Price | Includes |
|------|-------|----------|
| Free | $0/month | 5 lessons/day, Basic Practice, Grammar Lab |
| Pro | $9.99/month | Unlimited, Offline mode, Advanced analytics, AI priority |

**Files:** `src/pages/Pricing.tsx` (new), `src/App.tsx` (add route)

### 6.2 Feature Pages for SEO

| Page | Keyword Target |
|------|---------------|
| `/features/smart-practice` | AI English tutor |
| `/features/pronunciation` | English pronunciation practice |
| `/features/grammar-lab` | English grammar checker |
| `/features/academy` | English learning course |
| `/vs-duolingo` | Duolingo alternative |
| `/vs-babbel` | Babbel alternative |

**Files:** New page components, route updates

### 6.3 Blog + Lead Magnets

**Blog articles:**
- "How AI is Changing English Learning" (AI English learning)
- "CEFR Levels Explained" (CEFR levels English)
- "How to Practice English Pronunciation" (English pronunciation tips)
- "Best English Learning Apps 2026" (best English learning app)

**Lead magnets:**
- "50 Essential English Phrases" (PDF, email capture)
- "English Level Test" (Interactive quiz, email + level)
- "Pronunciation Guide" (PDF, email)

**Files:** `src/pages/Blog.tsx` (new), content files, `src/components/LeadMagnet.tsx` (new)

---

## Execution Order

Each phase deploys to Vercel before moving to the next:

1. Phase 1 → Deploy → Verify
2. Phase 2 → Deploy → Verify
3. Phase 3 → Deploy → Verify
4. Phase 4 → Deploy → Verify
5. Phase 5 → Deploy → Verify
6. Phase 6 → Deploy → Verify

Verification per sprint: `npm run build`, local test, Vercel preview, RLS check, mobile viewport test, Lighthouse > 90.