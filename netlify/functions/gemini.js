// netlify/functions/gemini.js
// Robust Gemini proxy with auto-fallback between v1 (camelCase) and v1beta (snake_case).
// Fixes "GenerateContentRequest.model: unexpected model name format" by normalizing paths.

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = String(process.env.GEMINI_MODEL || 'gemini-2.5-flash');

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    // ---- Parse and normalize payload ----
    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch (e) { return { statusCode: 400, body: `Bad JSON: ${e.message}` }; }

    // Normalize model: strip any leading "models/" then rebuild the URL path consistently.
    const rawModel = (payload.model || DEFAULT_MODEL).trim();
    const modelId  = rawModel.replace(/^models\//, '').replace(/^tunedModels\//, '');
    // We never include "model" in the body; URL only.
    delete payload.model;

    // Builders for body styles:
    const camelBody = (p) => {
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

    const snakeBody = (p) => {
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

    // Core caller
    const call = async (version, style) => {
      const modelPath = `models/${modelId}`;
      const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${API_KEY}`;
      const body = style === 'camel' ? camelBody(payload) : snakeBody(payload);

      if (!body.contents) {
        return { ok: false, status: 400, text: 'Missing required field: contents', url };
      }
      if (typeof fetch !== 'function') {
        return { ok: false, status: 500, text: 'Global fetch is unavailable. Use Node 18+.', url };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, text, url };
    };

    // Try v1 (camelCase) first
    let r = await call('v1', 'camel');

    // If that fails with common schema/version errors, fall back to v1beta (snake_case)
    if (!r.ok) {
      const msg = (r.text || '').toLowerCase();
      const shouldFallback =
        r.status === 400 ||
        msg.includes('unexpected model name format') ||
        msg.includes('unknown name "systeminstruction"') ||
        msg.includes('not found for api version v1') ||
        msg.includes('cannot find field');

      if (shouldFallback) {
        r = await call('v1beta', 'snake');
      }
    }

    if (!r.ok) {
      // Surface exact upstream error and the URL we used (to spot model path issues quickly)
      return { statusCode: r.status, body: r.text || `Gemini error (empty body). URL: ${r.url}` };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: r.text,
    };
  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};
