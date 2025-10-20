// netlify/functions/gemini.js
// Gemini proxy with model-path normalization and v1↔v1beta fallback.

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash');

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // Parse body
    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch (e) { return { statusCode: 400, body: `Bad JSON: ${e.message}` }; }

    // ---- Normalize model & choose correct path segment ----
    const raw = String((payload.model || DEFAULT_MODEL)).trim();
    // remove any accidental leading prefixes; normalize case
    const cleaned = raw.replace(/^models\//i, '').replace(/^tunedmodels\//i, '');
    const isTuned = /^tunedmodels\//i.test(raw);
    const modelId = isTuned ? cleaned : cleaned.toLowerCase(); // stock models are lowercase
    const modelPath = isTuned ? `tunedModels/${modelId}` : `models/${modelId}`;

    // never send model in body
    delete payload.model;

    // Build bodies for v1 (camelCase) and v1beta (snake_case)
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

    if (!payload.contents) {
      return { statusCode: 400, body: 'Missing required field: contents' };
    }
    if (typeof fetch !== 'function') {
      return { statusCode: 500, body: 'Global fetch is unavailable. Use Node 18+.' };
    }

    const call = async (version, style) => {
      const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${API_KEY}`;
      const body = style === 'camel' ? toCamel(payload) : toSnake(payload);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const text = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, text, url };
    };

    // Try v1 first (camelCase fields)
    let r = await call('v1', 'camel');

    // Fallback to v1beta (snake_case) on schema/version-style errors
    if (!r.ok) {
      const msg = (r.text || '').toLowerCase();
      const shouldFallback =
        r.status === 400 ||
        msg.includes('unexpected model name format') ||
        msg.includes('cannot find field') ||
        msg.includes('unknown name') ||
        msg.includes('not found for api version v1');

      if (shouldFallback) r = await call('v1beta', 'snake');
    }

    if (!r.ok) {
      // Return exact upstream error + the URL we used
      const body = r.text || 'Gemini error (empty body)';
      return { statusCode: r.status, body: `${body}\n\n[debug url] ${r.url}` };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: r.text };
  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};
