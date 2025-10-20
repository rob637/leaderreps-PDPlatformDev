// netlify/functions/gemini.js
// Gemini proxy (v1, camelCase). Normalizes model path & avoids model in body.

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // Parse request body
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: `Bad JSON: ${e.message}` };
    }

    // ---- Normalize model & choose correct path segment ----
    const raw = String(payload.model || DEFAULT_MODEL).trim();

    // If a full publisher path is provided, trust it as-is (minus whitespace)
    const isPublisherPath = /^publishers\/[^/]+\/models\/.+$/i.test(raw);
    let modelPath;
    if (isPublisherPath) {
      modelPath = raw.replace(/\s+/g, '');
    } else {
      // Strip ANY leading "models/" or "tunedModels/" prefixes (case-insensitive)
      const cleaned = raw.replace(/^(?:models\/|tunedmodels\/)+/i, '').trim();
      const isTuned = /^tunedmodels\//i.test(raw);
      const id = isTuned ? cleaned : cleaned.toLowerCase(); // stock ids are lowercase
      modelPath = isTuned ? `tunedModels/${id}` : `models/${id}`;
    }

    // Build v1 (camelCase) request body. Accept snake_case from caller too.
    const body = {
      contents: payload.contents,
      systemInstruction: payload.systemInstruction ?? payload.system_instruction,
      tools: payload.tools,
      toolConfig: payload.toolConfig ?? payload.tool_config,
      safetySettings: payload.safetySettings ?? payload.safety_settings,
      generationConfig: payload.generationConfig ?? payload.config ?? payload.generation_config,
      cachedContent: payload.cachedContent ?? payload.cached_content,
    };

    if (!body.contents) {
      return { statusCode: 400, body: 'Missing required field: contents' };
    }

    // Remove undefined keys
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    // Model must be in the URL, not in the body
    const url = `https://generativelanguage.googleapis.com/v1/${modelPath}:generateContent?key=${API_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      return {
        statusCode: res.status,
        body: text || `Gemini error (empty body). [debug url] ${url}`,
      };
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
