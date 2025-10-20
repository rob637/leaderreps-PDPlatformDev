// netlify/functions/gemini.js
// Gemini proxy (REST, v1beta). Normalizes model path and maps camelCase → snake_case safely.

const API_VERSION   = 'v1beta'; // REST generateContent uses v1beta reliably
const DEFAULT_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
const API_KEY       = process.env.GEMINI_API_KEY;

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // Parse JSON body
    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch (e) { return { statusCode: 400, body: `Bad JSON: ${e.message}` }; }

    // ---- FIX: normalize model for URL ONLY, never include in body ----
    const rawModel  = payload.model || DEFAULT_MODEL;
    const modelId   = String(rawModel).replace(/^models\//, '');
    const modelPath = `models/${modelId}`;
    const url = `https://generativelanguage.googleapis.com/${API_VERSION}/${modelPath}:generateContent?key=${API_KEY}`;

    // ---- Map app-friendly (camelCase) → REST (snake_case) ----
    const body = {
      contents: payload.contents,
      system_instruction: payload.systemInstruction ?? payload.system_instruction,
      tools: payload.tools,
      tool_config: payload.toolConfig ?? payload.tool_config,
      safety_settings: payload.safetySettings ?? payload.safety_settings,
      generation_config: payload.generationConfig ?? payload.config ?? payload.generation_config,
      cached_content: payload.cachedContent ?? payload.cached_content,
    };

    // Required field check (helps surface client issues early)
    if (!body.contents) {
      return { statusCode: 400, body: 'Missing required field: contents' };
    }

    // Strip undefined keys to keep the payload clean
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    // Node 18+/Netlify provides global fetch
    if (typeof fetch !== 'function') {
      return { statusCode: 500, body: 'Global fetch is unavailable. Use Node 18+.' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      // Bubble Google’s error straight through for easier debugging in the UI
      return { statusCode: res.status, body: text || 'Gemini error (empty body)' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: text,
    };
  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};
