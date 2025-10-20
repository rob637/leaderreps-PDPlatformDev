// netlify/functions/gemini.js
// Gemini proxy with REST-safe field mapping.

const API_VERSION   = 'v1beta'; // REST docs show v1beta for generateContent
const DEFAULT_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
const API_KEY       = process.env.GEMINI_API_KEY;

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    let payload;
    try { payload = JSON.parse(event.body || '{}'); }
    catch (e) { return { statusCode: 400, body: `Bad JSON: ${e.message}` }; }

    // choose model for URL only; never send a model field in body
    const model = String((payload.model || DEFAULT_MODEL)).replace(/^models\//, '');
    const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${API_KEY}`;

    // Map app-friendly camelCase → REST snake_case
    const body = {
      contents: payload.contents,
      system_instruction: payload.systemInstruction ?? payload.system_instruction,
      tools: payload.tools,                                   // allowed
      tool_config: payload.toolConfig ?? payload.tool_config, // optional
      safety_settings: payload.safetySettings ?? payload.safety_settings,
      generation_config: payload.generationConfig ?? payload.config ?? payload.generation_config,
      cached_content: payload.cachedContent ?? payload.cached_content,
    };

    // Remove undefined keys
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');
    if (!res.ok) return { statusCode: res.status, body: text || 'Gemini error (empty body)' };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: text };
  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};
