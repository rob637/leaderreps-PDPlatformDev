// netlify/functions/gemini.js
// Fully featured Gemini proxy for Netlify Functions (ESM)

const BASE_URL = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.0-flash'; // stable default
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // Optional: add 'Vary: Origin' if you later restrict origins
};

export async function handler(event) {
  // --- CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // --- Only POST allowed
  if (event.httpMethod !== 'POST') {
    return respJSON(405, { error: 'Method Not Allowed' });
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      return respJSON(500, { error: 'Missing GEMINI_API_KEY env var' });
    }

    // Parse request
    const req = parseJSONSafe(event.body, {});
    // Allow env override for model if the client omits it
    const envModel = (process.env.GEMINI_MODEL || '').trim();
    const rawModel = String(req.model || envModel || DEFAULT_MODEL).trim().replace(/-latest$/, '');
    delete req.model; // keep URL as source of truth

    // Normalize payload shape per API version quirks
    const reqForV1 = normalizeForV1(req);
    const reqForV1b = normalizeForV1beta(req);

    // 1) Model candidates: try caller’s first, then stable fallbacks
    const candidates = Array.from(new Set([
      rawModel,
      'gemini-2.0-flash',     // widely available
      'gemini-1.5-flash-002', // stable 1.5 flash
      'gemini-1.5-pro',       // older but broadly enabled
    ]));

    // 2) Try each candidate on v1, then v1beta for model/method errors
    let last = null;
    for (const m of candidates) {
      // v1
      const urlV1 = `${BASE_URL}/v1/${normalizeModelPath(m)}:generateContent?key=${API_KEY}`;
      let r = await fetch(urlV1, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reqForV1),
      });
      let txt = await r.text();
      if (r.ok) return respUpstreamOK(txt);

      // record last failure
      last = { status: r.status, url: urlV1, text: txt };

      // v1beta only on model/method availability problems
      if (shouldFallbackToV1beta(r.status, txt)) {
        const urlV1b = `${BASE_URL}/v1beta/${normalizeModelPath(m)}:generateContent?key=${API_KEY}`;
        r = await fetch(urlV1b, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(reqForV1b),
        });
        txt = await r.text();
        if (r.ok) return respUpstreamOK(txt);

        // record v1beta failure as well
        last = { status: r.status, url: urlV1b, text: txt };
      }
      // else try next candidate
    }

    // If we got here, everything failed — return best error with redacted debug
    const redacted = redactKey(last?.url || '');
    const body = parseJSONSafe(last?.text, { error: 'Gemini error' });
    body.debug = { endpoint: redacted, status: last?.status ?? 500, tried: candidates };
    return respJSON(last?.status ?? 500, body);

  } catch (err) {
    return respJSON(500, { error: 'Server error', details: String(err?.message || err) });
  }
}

/* ------------------ Helpers ------------------ */

function respUpstreamOK(text) {
  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: text,
  };
}

function respJSON(status, obj) {
  return {
    statusCode: status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

function parseJSONSafe(str, fallback) {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
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

/** Minimal heuristic: only fallback to v1beta when v1 signals model/method issues. */
function shouldFallbackToV1beta(status, _bodyText) {
  return status === 404 || status === 400 || status === 501;
}

function redactKey(url) {
  return String(url || '').replace(/(key=)[^&]+/i, '$1[redacted]');
}

/** Deep-ish clone without mutating arrays/objects we forward */
function shallowClone(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(x => shallowClone(x));
  const out = {};
  for (const k of Object.keys(obj)) out[k] = shallowClone(obj[k]);
  return out;
}

/* --------- Payload normalizers for API version quirks --------- */

function normalizeTools(tools) {
  if (!Array.isArray(tools)) return tools;
  return tools.map(t => {
    if (t && typeof t === 'object' && 'google_search' in t && !('googleSearch' in t)) {
      return { googleSearch: t.google_search };
    }
    return t;
  });
}

function normalizeForV1(payload) {
  const p = shallowClone(payload);

  // system_instruction -> systemInstruction (camelCase)
  if (p.system_instruction && !p.systemInstruction) {
    p.systemInstruction = p.system_instruction;
    delete p.system_instruction;
  }

  // tools.google_search -> tools.googleSearch
  if (Array.isArray(p.tools)) {
    p.tools = normalizeTools(p.tools);
  }

  // only forward expected Gemini fields; others are passed through but harmless
  // keep: contents, systemInstruction, tools, safetySettings, generationConfig, toolConfig
  return p;
}

function normalizeForV1beta(payload) {
  const p = shallowClone(payload);

  // systemInstruction -> system_instruction (snake_case)
  if (p.systemInstruction && !p.system_instruction) {
    p.system_instruction = p.systemInstruction;
    delete p.systemInstruction;
  }

  // tools.google_search -> tools.googleSearch (v1beta also uses googleSearch)
  if (Array.isArray(p.tools)) {
    p.tools = normalizeTools(p.tools);
  }

  return p;
}
