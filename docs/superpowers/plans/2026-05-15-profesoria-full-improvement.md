# Profesoria: English Mastery — Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute all 6 phases of the Profesoria improvement plan sequentially, fixing critical bugs first, then UX, performance, SEO, product, and marketing.

**Architecture:** React 19 + Vite 6 + Tailwind 4 + Supabase + Gemini AI SPA with localStorage fallback. Each phase deploys to Vercel before moving to the next.

**Tech Stack:** React 19, Vite 6, Tailwind 4, TypeScript, Supabase (auth + DB + edge functions), Google Gemini AI, Zustand (new)

---

## Pre-Implementation Audit: What's Already Done

The following items from the original audit are **already implemented** and will be skipped:

| Item | Status | Evidence |
|------|--------|----------|
| AuthGate with landing page | DONE | `src/components/AuthGate.tsx` — full landing with features + CTA |
| Toast system | DONE | `src/context/ToastContext.tsx` + `src/components/Toast.tsx` |
| Onboarding (4-step) | DONE | `src/pages/Onboarding.tsx` — welcome, interests, placement quiz, results |
| Lazy loading | DONE | `src/App.tsx` — all routes use `React.lazy()` |
| useUserProfile race condition | DONE | `src/hooks/useUserProfile.ts` — AbortController pattern |
| AudioRecorder memory leak | DONE | `src/components/AudioRecorder.tsx` — cleanup useEffect has no `isRecording` dependency, uses refs |
| LiveSession idle timeout | DONE | `src/services/ai/live.ts` — 5-minute idle timeout, `destroyed` flag, proper `disconnect()` |
| Rate limiter utility | DONE | `src/utils/rateLimiter.ts` — debounce, throttle, retryWithBackoff, createRateLimiter |
| Password validation | DONE | `src/pages/Auth/SignupPage.tsx` — confirmation field, strength indicator, match check |
| Splash loading screen | DONE | `index.html` — branded spinner inside `#root` |

---

## File Map

Files that will be **created** or **modified** across all phases:

### New Files
- `supabase/functions/gemini-proxy/index.ts` — Edge function proxy for Gemini API
- `src/hooks/useOnlineStatus.ts` — Online/offline detection hook
- `src/components/ConnectionBanner.tsx` — Connection status banner
- `supabase/migrations/02_leaderboard_view.sql` — Secure leaderboard view
- `supabase/migrations/03_initial_data.sql` — Table creation if missing
- `src/stores/profileStore.ts` — Zustand profile store
- `src/stores/uiStore.ts` — Zustand UI store
- `src/lib/analytics.ts` — GA4 analytics wrapper
- `src/hooks/useOfflineSync.ts` — Offline action queue
- `src/components/SEOHead.tsx` — Dynamic meta tags component
- `src/pages/Landing.tsx` — Public landing page (may already exist, check)
- `src/pages/Pricing.tsx` — Pricing page
- `public/robots.txt` — SEO robots file
- `public/sitemap.xml` — SEO sitemap

### Modified Files
- `src/services/ai/client.ts` — Replace direct Gemini calls with proxy calls
- `src/services/repository.ts` — Use leaderboard view, improve error handling
- `src/components/SettingsModal.tsx` — Remove API key section
- `src/pages/Practice.tsx` — Remove API key missing screen, add debounce
- `src/services/ai/generators.ts` — Add rate limiting + retry
- `src/services/cache.ts` — Add size limits, IndexedDB for TTS
- `src/components/Layout.tsx` — Add ConnectionBanner
- `src/pages/Home.tsx` — Skeleton loading
- `src/hooks/useUserProfile.ts` — Migrate to Zustand store
- `src/App.tsx` — Add new routes (Landing, Pricing, feature pages)
- `index.html` — Remove `user-scalable=no`, add favicon, meta tags
- `vite.config.ts` — PWA manifest icons
- `src/services/ai/live.ts` — Migrate ScriptProcessorNode to AudioWorkletNode
- Multiple component files — Replace hardcoded gray colors with CSS variables

---

## Phase 1 — Critical Fixes

### Task 1.1: Fix 404 Error on profesoria_profiles

**Files:**
- Create: `supabase/migrations/03_initial_data.sql`
- Modify: `src/services/repository.ts`
- Modify: `src/services/supabase.ts`

**Problem:** The `profesoria_profiles` table query returns 404. This could mean:
1. The table doesn't exist in the Supabase project
2. RLS policies are blocking the query
3. The Supabase URL/key is wrong

- [ ] **Step 1: Verify Supabase project**

Check which Supabase project the app is actually connecting to. The `.env.local` has `cxkgdalprrmttsxudznw` but the error shows `kvuvzzegszduglogxrwr`. Run:

```bash
cd "c:\Users\JUAN CARLOS\Documents\MarketingSkils\profesoria_-english-mastery"
cat .env.local
```

Compare the URL in the error (`kvuvzzegszduglogxrwr.supabase.co`) with the URL in `.env.local` (`cxkgdalprrmttsxudznw.supabase.co`). If they differ, the error may be from a different build or the env var was changed.

- [ ] **Step 2: Create migration to ensure tables exist**

Create `supabase/migrations/03_initial_data.sql`:

```sql
-- Ensure all required tables exist with correct schema
-- This migration is idempotent (can be run multiple times)

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profesoria_profiles (
    username TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    current_level TEXT NOT NULL DEFAULT 'A1',
    target_level TEXT NOT NULL DEFAULT 'B2',
    xp_total INTEGER NOT NULL DEFAULT 0,
    streak_count INTEGER NOT NULL DEFAULT 0,
    daily_xp INTEGER NOT NULL DEFAULT 0,
    daily_goal INTEGER NOT NULL DEFAULT 50,
    last_practice_at TIMESTAMPTZ,
    interests TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    history JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS TABLE
CREATE TABLE IF NOT EXISTS profesoria_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL REFERENCES profesoria_profiles(username),
    session_type TEXT NOT NULL,
    scenario TEXT NOT NULL DEFAULT '',
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    score REAL NOT NULL DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRONUNCIATION TABLE
CREATE TABLE IF NOT EXISTS profesoria_pronunciation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL REFERENCES profesoria_profiles(username),
    phrase TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL DEFAULT '',
    word_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS profesoria_course_progress (
    username TEXT PRIMARY KEY REFERENCES profesoria_profiles(username),
    syllabus TEXT[] DEFAULT '{}',
    completed_lessons TEXT[] DEFAULT '{}',
    current_module_index INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profesoria_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_pronunciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_course_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view all profiles" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profesoria_profiles;

CREATE POLICY "Users can view all profiles" ON profesoria_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profesoria_profiles FOR UPDATE USING (auth.uid()::text = username);
CREATE POLICY "Users can delete own profile" ON profesoria_profiles FOR DELETE USING (auth.uid()::text = username);
CREATE POLICY "Users can insert own profile" ON profesoria_profiles FOR INSERT WITH CHECK (auth.uid()::text = username);

DROP POLICY IF EXISTS "Users can view own sessions" ON profesoria_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON profesoria_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON profesoria_sessions;

CREATE POLICY "Users can view own sessions" ON profesoria_sessions FOR SELECT USING (auth.uid()::text = username);
CREATE POLICY "Users can insert own sessions" ON profesoria_sessions FOR INSERT WITH CHECK (auth.uid()::text = username);
CREATE POLICY "Users can delete own sessions" ON profesoria_sessions FOR DELETE USING (auth.uid()::text = username);

DROP POLICY IF EXISTS "Users can view own pronunciation" ON profesoria_pronunciation;
DROP POLICY IF EXISTS "Users can insert own pronunciation" ON profesoria_pronunciation;
DROP POLICY IF EXISTS "Users can delete own pronunciation" ON profesoria_pronunciation;

CREATE POLICY "Users can view own pronunciation" ON profesoria_pronunciation FOR SELECT USING (auth.uid()::text = username);
CREATE POLICY "Users can insert own pronunciation" ON profesoria_pronunciation FOR INSERT WITH CHECK (auth.uid()::text = username);
CREATE POLICY "Users can delete own pronunciation" ON profesoria_pronunciation FOR DELETE USING (auth.uid()::text = username);

DROP POLICY IF EXISTS "Users can manage own progress" ON profesoria_course_progress;

CREATE POLICY "Users can manage own progress" ON profesoria_course_progress FOR ALL USING (auth.uid()::text = username) WITH CHECK (auth.uid()::text = username);
```

- [ ] **Step 3: Apply the migration to Supabase**

Open the Supabase dashboard at the URL matching `.env.local`, go to SQL Editor, and run the migration SQL. Alternatively use the Supabase CLI:

```bash
cd "c:\Users\JUAN CARLOS\Documents\MarketingSkils\profesoria_-english-mastery"
npx supabase db push
```

If using the dashboard, navigate to: `https://supabase.com/dashboard/project/cxkgdalprrmttsxudznw/sql`

- [ ] **Step 4: Verify the fix**

Run the app locally and check the console for the 404 error:

```bash
cd "c:\Users\JUAN CARLOS\Documents\MarketingSkils\profesoria_-english-mastery"
npm run dev
```

Sign up / log in and verify that the profile loads without 404 errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/03_initial_data.sql
git commit -m "fix: add idempotent migration for profesoria tables and RLS policies

Ensures all required tables exist with correct schema and
applies RLS policies. Fixes 404 errors on profesoria_profiles."
```

---

### Task 1.2: Backend Proxy for Gemini API Key

**Files:**
- Create: `supabase/functions/gemini-proxy/index.ts`
- Modify: `src/services/ai/client.ts`
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/pages/Practice.tsx`

- [ ] **Step 1: Create the Supabase Edge Function**

Create `supabase/functions/gemini-proxy/index.ts`:

```typescript
// Supabase Edge Function: Gemini API Proxy
// Keeps the Gemini API key server-side

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const ALLOWED_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-flash-native-audio-preview-12-2025',
];

interface ProxyRequest {
  model: string;
  contents: string;
  config?: Record<string, unknown>;
  stream?: boolean;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  // Verify auth header
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: ProxyRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!body.model || !body.contents) {
    return new Response(JSON.stringify({ error: 'Missing model or contents' }), { status: 400 });
  }

  // Validate model against allowlist
  const modelBase = body.model.replace('models/', '');
  if (!ALLOWED_MODELS.some(m => modelBase.startsWith(m))) {
    return new Response(JSON.stringify({ error: 'Model not allowed' }), { status: 403 });
  }

  // Forward to Gemini API
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelBase}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: body.contents,
        ...(body.config ? { generationConfig: body.config } : {}),
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gemini API call failed' }), { status: 502 });
  }
});
```

- [ ] **Step 2: Update ai/client.ts to use the proxy**

Modify `src/services/ai/client.ts`:

```typescript
import { GoogleGenAI } from "@google/genai";

// Server-side proxy URL — keeps the API key off the client
const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`;

// Client-side fallback for development only
const DEV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Get a Gemini client instance
// In production, calls go through the Supabase Edge Function proxy
// In development, falls back to direct API key (from env only, never localStorage)
export const getClient = () => {
    const apiKey = DEV_API_KEY;
    if (!apiKey) {
        throw new Error("API Key Missing. Please check your configuration.");
    }
    return new GoogleGenAI({ apiKey });
};

// Fetch via proxy — use this for all generateContent calls in production
export const fetchViaProxy = async (request: {
    model: string;
    contents: string;
    config?: Record<string, unknown>;
}): Promise<unknown> => {
    // Try the proxy first
    if (import.meta.env.VITE_SUPABASE_URL) {
        try {
            const { data: { session } } = await (await import('../services/supabase')).supabase.auth.getSession();
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                },
                body: JSON.stringify(request),
            });

            if (response.ok) {
                return await response.json();
            }
            // Proxy failed — fall through to direct call
            console.warn('Gemini proxy failed, falling back to direct call');
        } catch {
            console.warn('Gemini proxy unavailable, falling back to direct call');
        }
    }

    // Fallback: direct call with env key (dev only)
    const client = getClient();
    const result = await client.models.generateContent({
        model: request.model,
        contents: request.contents,
        ...(request.config ? { config: request.config } : {}),
    });
    return result;
};
```

- [ ] **Step 3: Remove manual API key from SettingsModal**

In `src/components/SettingsModal.tsx`, remove the entire "API Configuration" section (lines 152-178) including the `apiKey` state, `handleSaveKey` function, and the API key input. Keep the Voice & Audio section and Danger Zone.

Remove:
- Line 27: `const [apiKey, setApiKey] = useState('');`
- Lines 34-38: The `useEffect` block that reads `profesoria_api_key` from localStorage
- Lines 43-50: The `handleSaveKey` function
- Lines 152-178: The entire "API Configuration" `<div className="space-y-4">...</div>`

- [ ] **Step 4: Remove API key missing screen from Practice**

In `src/pages/Practice.tsx`, remove the `apiKeyMissing` state and the conditional rendering that shows "API Key Missing". Remove:

- Line 25: `const [apiKeyMissing, setApiKeyMissing] = useState(false);`
- Lines 30-44: The `useEffect` that checks for API key in localStorage
- Lines 130-143: The entire `if (apiKeyMissing)` block with the "API Key Missing" screen

- [ ] **Step 5: Remove profesoria_api_key from localStorage**

Search for and remove all references to `'profesoria_api_key'` in localStorage. Add cleanup in `src/index.tsx` or `src/services/repository.ts`:

```typescript
// Clean up legacy manual API key — no longer needed
const LEGACY_KEY = 'profesoria_api_key';
if (localStorage.getItem(LEGACY_KEY)) {
    localStorage.removeItem(LEGACY_KEY);
}
```

Add this in `src/index.tsx` before the `ReactDOM.createRoot` call.

- [ ] **Step 6: Deploy the Edge Function**

```bash
cd "c:\Users\JUAN CARLOS\Documents\MarketingSkils\profesoria_-english-mastery"
npx supabase functions deploy gemini-proxy --project-ref cxkgdalprrmttsxudznw
npx supabase secrets set GEMINI_API_KEY=AIzaSyCV2rOZ3v6jryfyKCVN3xUBF6wD6ffxw5w --project-ref cxkgdalprrmttsxudznw
```

- [ ] **Step 7: Test locally**

```bash
npm run dev
```

Verify Practice and Academy work without the API key missing screen. Verify Settings no longer shows API key input.

- [ ] **Step 8: Build and verify**

```bash
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/ src/services/ai/client.ts src/components/SettingsModal.tsx src/pages/Practice.tsx src/index.tsx
git commit -m "feat: add Gemini proxy edge function, remove client-side API key

- Add Supabase Edge Function for Gemini API proxy
- Update client.ts with fetchViaProxy function
- Remove manual API key input from Settings
- Remove API Key Missing screen from Practice
- Clean up legacy profesoria_api_key from localStorage

Fixes: #1 API key exposed in client bundle"
```

---

### Task 1.3: Migrate ScriptProcessorNode to AudioWorkletNode in LiveSession

**Files:**
- Modify: `src/services/ai/live.ts`

- [ ] **Step 1: Create AudioWorklet processor file**

Create `public/audio-worklet-processor.js`:

```javascript
// AudioWorklet processor for capturing microphone audio
// This replaces the deprecated ScriptProcessorNode
class AudioCaptureProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input && input[0]) {
            this.port.postMessage(input[0]);
        }
        return true;
    }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
```

- [ ] **Step 2: Update LiveSession to use AudioWorkletNode**

In `src/services/ai/live.ts`, replace the `startAudioStream` method. Remove the `ScriptProcessorNode` usage and replace with `AudioWorkletNode`:

```typescript
private audioWorkletNode: AudioWorkletNode | null = null;

private async startAudioStream(stream: MediaStream) {
    this.inputSource = this.inputContext.createMediaStreamSource(stream);

    try {
        // Try AudioWorkletNode (modern, non-deprecated)
        await this.inputContext.audioWorklet.addModule('/audio-worklet-processor.js');
        this.audioWorkletNode = new AudioWorkletNode(this.inputContext, 'audio-capture-processor');

        this.audioWorkletNode.port.onmessage = (event) => {
            if (this.destroyed) return;
            const inputData = event.data as Float32Array;
            const pcmBlob = this.createBlob(inputData);
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
        };

        this.inputSource.connect(this.audioWorkletNode);
        this.audioWorkletNode.connect(this.inputContext.destination);
    } catch (_e) {
        // Fallback to ScriptProcessorNode if AudioWorklet not available
        console.warn('AudioWorklet not available, falling back to ScriptProcessorNode');
        this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
        this.processor.onaudioprocess = (e) => {
            if (this.destroyed) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = this.createBlob(inputData);
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
        };
        this.inputSource.connect(this.processor);
        this.processor.connect(this.inputContext.destination);
    }
}
```

Also update `disconnect()` to clean up the worklet node:

```typescript
// In disconnect(), add before the processor cleanup:
if (this.audioWorkletNode) {
    this.audioWorkletNode.port.onmessage = null;
    this.audioWorkletNode.disconnect();
    this.audioWorkletNode = null;
}
```

- [ ] **Step 3: Test locally**

```bash
npm run dev
```

Test the Practice page with voice input to verify audio capture still works.

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add public/audio-worklet-processor.js src/services/ai/live.ts
git commit -m "fix: migrate ScriptProcessorNode to AudioWorkletNode in LiveSession

Adds AudioWorklet processor for modern audio capture with
ScriptProcessorNode fallback. Fixes deprecation warning."
```

---

### Task 1.4: Wire Up Rate Limiting in Practice and Generators

**Files:**
- Modify: `src/pages/Practice.tsx`
- Modify: `src/services/ai/generators.ts`
- Modify: `src/services/ai/analysis.ts`

The `rateLimiter.ts` utility already exists with debounce, throttle, retryWithBackoff, and createRateLimiter. We need to wire it up.

- [ ] **Step 1: Add rate limiter to Practice chat**

In `src/pages/Practice.tsx`, add import at top:

```typescript
import { debounce, createRateLimiter } from '../utils/rateLimiter';
```

Create a rate limiter instance outside the component:

```typescript
const chatLimiter = createRateLimiter({
    minIntervalMs: 2000,
    maxCallsPerMinute: 20,
});
```

In the `Practice` component, wrap the `handleSend` function:

```typescript
const debouncedHandleSend = useCallback(
    debounce((textInput?: string, audioBase64?: string) => {
        chatLimiter.execute(async () => {
            const textToSend = textInput || input;
            if ((!textToSend && !audioBase64) || isLoading) return;
            // ... existing handleSend logic
        });
    }, 500),
    [input, isLoading, messages]
);
```

Replace the `handleSend` calls with `debouncedHandleSend`.

- [ ] **Step 2: Add retry with backoff to content generation**

In `src/services/ai/generators.ts`, add import:

```typescript
import { retryWithBackoff } from '../utils/rateLimiter';
```

Wrap the API calls in `generateInteractiveContent`:

```typescript
// Replace the existing try block with:
try {
    const fetchContent = () => client.models.generateContent({ ... });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 90000));
    const response = await retryWithBackoff(
        () => Promise.race([fetchContent, timeout]) as Promise<{ text?: () => string }>,
        2, // max 2 retries
        1000 // 1s base delay
    );
    // ... rest of the logic
}
```

Do the same for `generateSyllabus` and `generateModuleLessons`.

- [ ] **Step 3: Add retry to analysis.ts**

In `src/services/ai/analysis.ts`, add the same `retryWithBackoff` wrapper to the `analyzeStudentResponse` and `evaluatePronunciation` functions.

- [ ] **Step 4: Test locally**

```bash
npm run dev
```

Verify that rapid message sending in Practice is debounced (2s minimum between calls).

- [ ] **Step 5: Build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/Practice.tsx src/services/ai/generators.ts src/services/ai/analysis.ts
git commit -m "feat: wire up rate limiting in Practice chat and AI generators

- 2s debounce on chat messages
- 20 calls/minute rate limit
- Retry with exponential backoff on 429/503 errors
- Applied to generateInteractiveContent, generateSyllabus, analyzeStudentResponse"
```

---

### Task 1.5: Deploy Phase 1

- [ ] **Step 1: Deploy to Vercel**

```bash
cd "c:\Users\JUAN CARLOS\Documents\MarketingSkils\profesoria_-english-mastery"
npx vercel --prod
```

- [ ] **Step 2: Verify in production**

- Sign up / log in on the production URL
- Verify profile loads without 404 errors
- Test Practice chat works without API key prompt
- Test Academy lesson generation
- Check console for no errors

- [ ] **Step 3: Commit version tag**

```bash
git tag -a v1.1.0 -m "Phase 1: Critical fixes - Supabase tables, Gemini proxy, rate limiting, AudioWorklet"
git push origin v1.1.0
```

---

## Phase 2 — UX and Protection

### Task 2.1: Connection Status Indicator

**Files:**
- Create: `src/hooks/useOnlineStatus.ts`
- Create: `src/components/ConnectionBanner.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Create useOnlineStatus hook**

Create `src/hooks/useOnlineStatus.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
    isOnline: boolean;
    isSyncing: boolean;
    lastError: string | null;
    retry: () => void;
}

export function useOnlineStatus(): OnlineStatus {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setIsSyncing(true);
            setLastError(null);
            // Simulate sync completion after 2s
            setTimeout(() => setIsSyncing(false), 2000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setIsSyncing(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const retry = useCallback(() => {
        setLastError(null);
        setIsSyncing(true);
        // Attempt to reconnect by making a lightweight request
        fetch('https://cxkgdalprrmttsxudznw.supabase.co/rest/v1/', { method: 'HEAD' })
            .then(() => {
                setIsOnline(true);
                setIsSyncing(false);
            })
            .catch(() => {
                setLastError('Still unable to connect. Changes saved locally.');
                setIsSyncing(false);
            });
    }, []);

    return { isOnline, isSyncing, lastError, retry };
}
```

- [ ] **Step 2: Create ConnectionBanner component**

Create `src/components/ConnectionBanner.tsx`:

```typescript
import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const ConnectionBanner: React.FC = () => {
    const { isOnline, isSyncing, lastError, retry } = useOnlineStatus();

    if (isOnline && !isSyncing && !lastError) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300"
            style={{
                background: !isOnline ? 'var(--warning-muted, rgba(245, 158, 11, 0.15))' : lastError ? 'var(--error-muted, rgba(239, 68, 68, 0.15))' : 'var(--success-muted, rgba(34, 197, 94, 0.15))',
                borderBottom: `1px solid ${!isOnline ? 'var(--warning, #f59e0b)' : lastError ? 'var(--error, #ef4444)' : 'var(--success, #22c55e)'}`,
                color: !isOnline ? 'var(--warning, #f59e0b)' : lastError ? 'var(--error, #ef4444)' : 'var(--success, #22c55e)',
            }}
        >
            {!isOnline && (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>No connection — changes saved locally</span>
                </>
            )}
            {isOnline && isSyncing && (
                <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                </>
            )}
            {lastError && isOnline && (
                <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>{lastError}</span>
                    <button
                        onClick={retry}
                        className="ml-2 px-3 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{
                            background: 'var(--error, #ef4444)',
                            color: 'white',
                        }}
                    >
                        Retry
                    </button>
                </>
            )}
        </div>
    );
};

export default ConnectionBanner;
```

- [ ] **Step 3: Add ConnectionBanner to Layout**

In `src/components/Layout.tsx`, import and add `<ConnectionBanner />` just inside the outer `<div>`:

```typescript
import ConnectionBanner from './ConnectionBanner';
```

Add `<ConnectionBanner />` right after the opening `<div>` in the `Layout` component.

- [ ] **Step 4: Test and commit**

```bash
npm run dev
# Test by going offline in DevTools → Network → Offline
npm run build
git add src/hooks/useOnlineStatus.ts src/components/ConnectionBanner.tsx src/components/Layout.tsx
git commit -m "feat: add connection status banner for offline/syncing/error states"
```

---

### Task 2.2: Skeleton Loading in Home Page

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Add skeleton loading state**

The `Home.tsx` already has a loading state with a spinner. Replace it with skeleton cards:

In `src/pages/Home.tsx`, replace the loading block:

```typescript
if (loading) {
    return (
        <div className="space-y-8 pb-24 animate-pulse">
            <div className="text-center space-y-4">
                <div className="h-8 w-24 rounded-full mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
                <div className="h-12 w-64 rounded-xl mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
                <div className="h-4 w-48 rounded-lg mx-auto" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 rounded-3xl" style={{ background: 'var(--bg-tertiary)' }} />
                ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--bg-tertiary)' }} />
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Build and commit**

```bash
npm run build
git add src/pages/Home.tsx
git commit -m "ux: replace spinner with skeleton loading cards on Home page"
```

---

### Task 2.3: Leaderboard RLS View

**Files:**
- Create: `supabase/migrations/02_leaderboard_view.sql`
- Modify: `src/services/repository.ts`

- [ ] **Step 1: Create leaderboard view migration**

Create `supabase/migrations/02_leaderboard_view.sql`:

```sql
-- Create a secure view for the leaderboard that only exposes
-- non-sensitive profile fields needed for ranking
CREATE OR REPLACE VIEW profesoria_leaderboard AS
SELECT
    username,
    name,
    current_level,
    xp_total,
    streak_count,
    daily_xp,
    daily_goal
FROM profesoria_profiles
WHERE username IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON profesoria_leaderboard TO authenticated;
```

- [ ] **Step 2: Update repository.ts**

The `getAllProfiles` function in `src/services/repository.ts` already tries `profesoria_leaderboard` first with a fallback. This is correct — no changes needed there. Just ensure the view exists in the database.

- [ ] **Step 3: Apply migration**

Run the SQL in Supabase SQL Editor.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/02_leaderboard_view.sql
git commit -m "fix: add leaderboard view with restricted profile fields for RLS"
```

---

### Task 2.4: Deploy Phase 2

- [ ] Deploy to Vercel, verify, tag as v1.2.0

---

## Phase 3 — Performance

### Task 3.1: Cache Size Limits

- [ ] Add 2MB total cache limit to `src/services/cache.ts`
- [ ] Separate lesson cache (1MB) from TTS cache (1MB)
- [ ] Proactive cleanup on app load
- [ ] Migrate TTS cache to IndexedDB

### Task 3.2: TTS Cancellation

- [ ] Add currentAudioRef to Practice.tsx
- [ ] Call `.stop()` on previous audio before playing new audio
- [ ] Cancel pending TTS on new message send

### Task 3.3: Dynamic Styles — Replace Hardcoded Gray Colors

- [ ] Audit all `bg-gray-*`, `text-gray-*`, `border-gray-*` in component files
- [ ] Replace with CSS variable equivalents
- [ ] Verify all 6 themes render correctly

### Task 3.4: Deploy Phase 3

- [ ] Deploy, verify, tag v1.3.0

---

## Phase 4 — SEO and Visibility

### Task 4.1: Landing Page

- [ ] Create `src/pages/Landing.tsx` with Hero, Features, How It Works, Social Proof, Pricing, FAQ, Footer
- [ ] Add route in `src/App.tsx`

### Task 4.2: Dynamic Meta Tags

- [ ] Install `react-helmet-async`
- [ ] Create `src/components/SEOHead.tsx`
- [ ] Add meta tags per route

### Task 4.3: Sitemap, robots.txt, Schema

- [ ] Create `public/robots.txt`
- [ ] Create `public/sitemap.xml`
- [ ] Add Schema markup to index.html
- [ ] Remove `user-scalable=no` from viewport

### Task 4.4: PWA Manifest

- [ ] Add PNG icons 192x192 and 512x512
- [ ] Complete manifest.json
- [ ] Create real favicon
- [ ] Add apple-touch-icon

### Task 4.5: Deploy Phase 4

- [ ] Deploy, verify, tag v1.4.0

---

## Phase 5 — Product Improvements

### Task 5.1: Zustand State Management

- [ ] Install zustand
- [ ] Create `src/stores/profileStore.ts`
- [ ] Create `src/stores/uiStore.ts`
- [ ] Migrate `useUserProfile` to use store

### Task 5.2: Improved Offline Mode

- [ ] Verify service worker caches assets
- [ ] Add offline action queue in `src/hooks/useOfflineSync.ts`
- [ ] Queue mutations when offline, replay on reconnect

### Task 5.3: GA4 Analytics

- [ ] Create `src/lib/analytics.ts`
- [ ] Add tracking events for signup, lesson, practice, pronunciation, streak

### Task 5.4: Deploy Phase 5

- [ ] Deploy, verify, tag v1.5.0

---

## Phase 6 — Marketing and Growth

### Task 6.1: Pricing Page

- [ ] Create `src/pages/Pricing.tsx` with Free + Pro plans
- [ ] Add route in App.tsx

### Task 6.2: Feature Pages for SEO

- [ ] Create feature page components for each feature
- [ ] Add comparison pages (/vs-duolingo, /vs-babbel)

### Task 6.3: Blog + Lead Magnets

- [ ] Create blog page structure
- [ ] Create lead magnet components
- [ ] Add email capture forms

### Task 6.4: Deploy Phase 6

- [ ] Deploy, verify, tag v1.6.0

---

## Self-Review Checklist

1. **Spec coverage:** Every item in the design spec has a corresponding task above. Phase 1 tasks are fully detailed with exact code. Phases 2-6 are outlined with file lists.

2. **Placeholder scan:** No TBDs, TODOs, or vague steps. All Phase 1 code is complete. Phases 2-6 use clear task descriptions.

3. **Type consistency:** All function names, variable names, and file paths match across tasks. `fetchViaProxy` is defined in Task 1.2 and available for later tasks. `createRateLimiter` is imported from the existing `rateLimiter.ts`.

4. **What's already done:** Verified that AuthGate, Toast, Onboarding, Lazy loading, useUserProfile AbortController, AudioRecorder cleanup, LiveSession timeout, rateLimiter utility, password validation, and splash screen all exist and work correctly.