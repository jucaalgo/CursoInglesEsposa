import { supabase } from "../supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Build a Gemini REST API payload from SDK-style parameters.
 * Maps the SDK's `contents` and `config` to the REST API body format.
 */
function buildPayload(contents: unknown, config?: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Normalize contents to REST API format: [{ role: "user", parts: [...] }]
  if (typeof contents === "string") {
    payload.contents = [{ role: "user", parts: [{ text: contents }] }];
  } else if (contents && typeof contents === "object" && "parts" in (contents as Record<string, unknown>)) {
    payload.contents = [{ role: "user", parts: (contents as { parts: unknown }).parts }];
  } else if (Array.isArray(contents)) {
    payload.contents = contents;
  } else {
    payload.contents = contents;
  }

  if (config) {
    const generationConfig: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(config)) {
      // Top-level fields in REST API (not inside generationConfig)
      if (key === "systemInstruction") {
        payload.systemInstruction = typeof value === "string"
          ? { parts: [{ text: value }] }
          : value;
      } else if (key === "tools" || key === "toolConfig") {
        payload[key] = value;
      } else {
        generationConfig[key] = value;
      }
    }

    if (Object.keys(generationConfig).length > 0) {
      payload.generationConfig = generationConfig;
    }
  }

  return payload;
}

/**
 * Call the Gemini API through the Supabase Edge Function proxy.
 * The API key is kept server-side — never exposed to the client bundle.
 *
 * Returns a response object compatible with the SDK's shape:
 * - `text()` returns the generated text (or null)
 * - `candidates` contains the raw Gemini API candidates array
 */
export async function callGemini(params: {
  model: string;
  contents: unknown;
  config?: Record<string, unknown>;
}): Promise<{
  text: (() => string) | null;
  candidates: unknown[];
}> {
  const { model, contents, config } = params;
  const payload = buildPayload(contents, config);

  // Get auth token from current Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Authentication required. Please sign in to use AI features.");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Gemini proxy error (${response.status}): ${(errorData as Record<string, unknown>).error || JSON.stringify(errorData)}`
    );
  }

  const data = await response.json() as Record<string, unknown>;
  const candidates = (data.candidates ?? []) as Array<Record<string, unknown>>;
  const textContent = candidates[0]
    ? (((candidates[0].content as Record<string, unknown>)?.parts as Array<Record<string, unknown>>)?.[0]?.text as string) ?? null
    : null;

  return {
    text: textContent ? () => textContent : null,
    candidates,
  };
}

/**
 * Get the Gemini API key for live WebSocket connections.
 * Gemini's live API requires client-side WebSocket auth, so the key must be
 * available to the browser. This endpoint gates access behind authentication
 * instead of shipping the key in the VITE_ env vars.
 */
export async function getLiveApiKey(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Authentication required. Please sign in to use live features.");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-key`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get API key. Please sign in.");
  }

  const data = await response.json() as { apiKey: string };
  return data.apiKey;
}