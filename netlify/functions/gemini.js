// netlify/functions/gemini.js
// Robust Gemini proxy (Node 18/20). Uses v1 + returns upstream errors verbatim.

const API_VERSION   = 'v1';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const API_KEY       = process.env.GEMINI_API_KEY;

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: `Bad JSON: ${e.message}` };
    }

    const model = (payload.model || DEFAULT_MODEL).trim();
    const url = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${model}:generateContent?key=${API_KEY}`;

    // v1 expects camelCase systemInstruction
    const body = {
      systemInstruction: payload.systemInstruction,
      contents: payload.contents,
    };
    if (payload.tools) body.tools = payload.tools; // optional

    if (typeof fetch !== 'function') {
      // Netlify/Node 18+ should always have fetch; helpful message if not.
      return { statusCode: 500, body: 'Global fetch is unavailable. Use Node 18+.' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      return { statusCode: res.status, body: text || 'Gemini error (empty body)' };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: text,
    };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};
