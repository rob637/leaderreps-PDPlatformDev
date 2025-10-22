// netlify/functions/gemini.js

// ESM export signature for Netlify Functions
export async function handler(event) {
  // ---- CORS (adjust origin if you want to restrict) ----
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

    // Parse incoming payload
    // Expected:
    // {
    //   model?: 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'models/...' | 'tunedModels/...'
    //   contents: [{ parts: [{ text: '...' }] }],
    //   systemInstruction? / system_instruction?,
    //   tools?: [{ google_search?: {...} | googleSearch?: {...} }],
    //   ...
    // }
    const req = JSON.parse(event.body || '{}');

    // --- normalize model (strip -latest alias) ---
    const DEFAULT_MODEL = 'gemini-2.0-flash';
    const chosenModelRaw = String(req.model || DEFAULT_MODEL).trim().replace(/-latest$/, '');
    delete req.model; // model goes in the URL, not the body

    // --- normalizers for payload quirks across API versions ---
    const translateForV1 = (payload) => {
      const p = shallowClone(payload);
      // v1 prefers camelCase "systemInstruction"
      if (p.system_instruction && !p.systemInstruction) {
        p.systemInstruction = p.system_instruction;
        delete p.system_instruction;
      }
      // normalize tools.google_search -> tools.googleSearch
      if (Array.isArray(p.tools)) {
        p.tools = p.tools.map(t => (t?.google_search ? { googleSearch: t.google_search } : t));
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
      // normalize tools.google_search -> tools.googleSearch (v1beta uses googleSearch too)
      if (Array.isArray(p.tools)) {
        p.tools = p.tools.map(t => (t?.google_search ? { googleSearch: t.google_search } : t));
      }
      return p;
    };

    // --- model candidates: caller's choice + stable fallbacks ---
    const candidates = Array.from(new Set([
      chosenModelRaw,           // what caller asked for (already stripped -latest)
      'gemini-2.0-flash',       // very widely available
      'gemini-1.5-flash-002',   // stable 1.5 flash variant
      'gemini-1.5-pro',         // last resort
    ]));

    let res, text, url;

    // Try each candidate on v1, then v1beta (only on model/method errors)
    for (const m of candidates) {
      const modelPathV1 = normalizeModelPath(m);

      // 1) try v1
      url = `${base}/v1/${modelPathV1}:generateContent?key=${API_KEY}`;
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(translateForV1(req)),
      });
      text = await res.text();
      if (res.ok) break;

      // 2) fallback to v1beta on clear model/method availability errors
      if (shouldFallbackToV1beta(res.status, text)) {
        const modelPathV1b = normalizeModelPath(m);
        url = `${base}/v1beta/${modelPathV1b}:generateContent?key=${API_KEY}`;
        res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(translateForV1beta(req)),
        });
        text = await res.text();
        if (res.ok) break;
      }
    }

    // Redact key in any error echo
    const redactedUrl = redactKey(url);

    if (!res?.ok) {
      try {
        const json = JSON.parse(text || '{}');
        json.debug = { endpoint: redactedUrl, status: res?.status ?? 500 };
        return {
          statusCode: res?.status ?? 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        };
      } catch {
        return {
          statusCode: res?.status ?? 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
          body: (text || 'Gemini error') + `\n\n[debug] ${redactedUrl}`,
        };
      }
    }

    // Success
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server error', details: String(err?.message || err) }),
    };
  }
}

/* ------------------ Helpers ------------------ */

function shallowClone(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(x => x);
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
  if (/^tunedModels\//.test(model)) return `tunedModels/${cleaned}`;
  return `models/${cleaned}`;
}

/**
 * Whether to try v1beta after a v1 error.
 * 404/400/501 typically indicate model/method availability mismatches.
 */
function shouldFallbackToV1beta(status, bodyText) {
  if (status === 404 || status === 400 || status === 501) return true;
  // Some edge responses may contain hints; keep it simple for now.
  return false;
}

function redactKey(url) {
  return String(url || '').replace(/(key=)[^&]+/i, '$1[redacted]');
}
