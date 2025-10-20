// netlify/functions/gemini.js
// Gemini proxy with robust model-path normalization & v1↔v1beta fallback.

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

// Helpers to build bodies
const toCamel = (p) => {
  const b = {
    contents: p.contents,
    systemInstruction: p.systemInstruction ?? p.system_instruction,
    tools: p.tools,
    toolConfig: p.toolConfig ?? p.tool_config,
    safetySettings: p.safetySettings ?? p.safety_settings,
    generationConfig: p.generationConfig ?? p.config ?? p.generation_config,
    cachedContent: p.cachedContent ?? p.cached_content,
  };
  Object.keys(b).forEach((k) => b[k] === undefined && delete b[k]);
  return b;
};

const toSnake = (p) => {
  const b = {
    contents: p.contents,
    system_instruction: p.systemInstruction ?? p.system_instruction,
    tools: p.tools,
    tool_config: p.toolConfig ?? p.tool_config,
    safety_settings: p.safetySettings ?? p.safety_settings,
    generation_config: p.generationConfig ?? p.config ?? p.generation_config,
    cached_content: p.cachedContent ?? p.cached_content,
  };
  Object.keys(b).forEach((k) => b[k] === undefined && delete b[k]);
  return b;
};

// Normalize ANY model string into a proper path segment for the URL
function normalizeModelPath(rawIn) {
  const raw = String(rawIn || '').trim();

  // Full publisher path? keep as-is (no spaces)
  if (/^publishers\/[^/]+\/models\/.+$/i.test(raw)) {
    return raw.replace(/\s+/g, '');
  }

  // Strip any number of leading prefixes (models/ or tunedModels/), case-insensitive
  const cleaned = raw.replace(/^(?:models\/|tunedmodels\/)+/i, '').trim();

  // If the original referenced tunedModels/, keep tuned; otherwise treat as stock model
  const isTuned = /^tunedmodels\//i.test(raw);

  // Stock model IDs are lowercase; tuned IDs often preserve case
  const id = isTuned ? cleaned : cleaned.toLowerCase();

  return isTuned ? `tunedModels/${id}` : `models/${id}`;
}

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // Parse request
    let payload = {};
    try { payload = JSON.parse(event.body || '{}'); }
    catch (e) { return { statusCode: 400, body: `Bad JSON: ${e.message}` }; }

    // Compute URL model path (URL only; never in body)
    const chosenModel = (payload.model ?? DEFAULT_MODEL).trim();
    const modelPath = normalizeModelPath(chosenModel);
    delete payload.model;

    if (!payload.contents) {
      return { statusCode: 400, body: 'Missing required field: contents' };
    }

    // Core caller
    async function call(version, styleBuilder) {
      const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${API_KEY}`;
      const body = styleBuilder(payload);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, text, url };
    }

    // Try v1 (camelCase) first
    let r = await call('v1', toCamel);

    // Fallback to v1beta (snake_case) if server complains about fields/version/model format
    if (!r.ok) {
      const msg = (r.text || '').toLowerCase();
      const shouldFallback =
        r.status === 400 ||
        msg.includes('unexpected model name format') ||
        msg.includes('cannot find field') ||
        msg.includes('unknown name') ||
        msg.includes('not found for api version v1');

      if (shouldFallback) {
        r = await call('v1beta', toSnake);
      }
    }

    if (!r.ok) {
      // Try to attach debug URL alongside upstream JSON
      try {
        const json = JSON.parse(r.text || '{}');
        json.debugUrl = r.url;
        return { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) };
      } catch {
        return { statusCode: r.status, body: (r.text || 'Gemini error (empty body)') + `\n\n[debug url] ${r.url}` };
      }
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: r.text };
  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};
