// netlify/functions/gemini.js

// ESM export signature for Netlify Functions
export async function handler(event) {
  // ---- CORS (adjust origin if you want to lock it down) ----
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Only POST is allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Allow': 'POST,OPTIONS' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing GEMINI_API_KEY env var' }),
      };
    }

    const base = 'https://generativelanguage.googleapis.com';

    // Parse client payload
    /** Expected shape:
     * {
     *   model?: "gemini-1.5-flash" | "models/gemini-1.5-flash" | "gemini-2.0-flash" | "tunedModels/..."
     *   contents: [{ parts: [{ text: "..." }] }]
     *   systemInstruction? / system_instruction?
     *   tools?: [{ google_search?: {...} | googleSearch?: {...} }]
     *   ...other Gemini fields...
     * }
     */
    const req = JSON.parse(event.body || '{}');

    // --- normalize model ---
    const DEFAULT_MODEL = 'gemini-1.5-flash';
    const chosenModelRaw = String(req.model || DEFAULT_MODEL).trim().replace(/-latest$/, '');
    const modelPath = normalizeModelPath(chosenModelRaw);
    delete req.model; // model goes in URL, not body

    // --- normalize payload for v1 vs v1beta quirks ---
    const translateForV1 = (payload) => {
      const p = shallowClone(payload);
      // v1 prefers camelCase "systemInstruction"
      if (p.system_instruction && !p.systemInstruction) {
        p.systemInstruction = p.system_instruction;
        delete p.system_instruction;
      }
      // normalize tools.google_search -> tools.googleSearch
      if (Array.isArray(p.tools)) {
        p.tools = p.tools.map((t) =>
          t && t.google_search ? { googleSearch: t.google_search } : t
        );
      }
      return p;
    };

    const translateForV1beta = (payload) => {
      const p = shallowClone(payload);
      // v1beta prefers snake_case "system_instruction"
      if (p.systemInstruction && !p.system_instruction) {
        p.system_instruction = p.systemInstruction;
        delete p.systemInstruction;
      }
      // normalize tools.google_search -> tools.googleSearch (v1beta also uses googleSearch)
      if (Array.isArray(p.tools)) {
        p.tools = p.tools.map((t) =>
          t && t.google_search ? { googleSearch: t.google_search } : t
        );
      }
      return p;
    };

    // --- 1) Try v1 first ---
    let url = `${base}/v1/${modelPath}:generateContent?key=${API_KEY}`;
    let res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(translateForV1(req)),
    });
    let text = await res.text();

    // --- 2) Fallback to v1beta on model/method errors ---
    if (!res.ok && shouldFallbackToV1beta(res.status, text)) {
      url = `${base}/v1beta/${modelPath}:generateContent?key=${API_KEY}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(translateForV1beta(req)),
      });
      text = await res.text();
    }

    // --- redact key if error and echo minimal debug ---
    const redactedUrl = redactKey(url);
    if (!res.ok) {
      try {
        const json = JSON.parse(text || '{}');
        json.debug = { endpoint: redactedUrl, status: res.status };
        return {
          statusCode: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        };
      } catch {
        return {
          statusCode: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
          body: (text || 'Gemini error') + `\n\n[debug] ${redactedUrl}`,
        };
      }
    }

    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: text };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Server error', details: String(err?.message || err) }),
    };
  }
}

/* ------------------ Helpers ------------------ */

function shallowClone(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((x) => x);
  return { ...obj };
}

/**
 * Accepts:
 *   "gemini-1.5-flash"
 *   "models/gemini-1.5-flash"
 *   "tunedModels/abc123"
 * Returns:
 *   "models/gemini-1.5-flash" or "tunedModels/abc123"
 */
function normalizeModelPath(model) {
  const cleaned = model.replace(/^models\//, '').replace(/^tunedModels\//, '');
  // If original started with tunedModels/, keep tunedModels
  if (/^tunedModels\//.test(model)) return `tunedModels/${cleaned}`;
  return `models/${cleaned}`;
}

/**
 * Whether to try v1beta after a v1 error.
 * 404/400/501 typically indicate model/method availability mismatches.
 */
function shouldFallbackToV1beta(status, bodyText) {
  if (status === 404 || status === 400 || status === 501) return true;
  // Some edge responses embed hints in the payload; keep it simple for now.
  return false;
}

function redactKey(url) {
  return String(url || '').replace(/(key=)[^&]+/i, '$1[redacted]');
}
