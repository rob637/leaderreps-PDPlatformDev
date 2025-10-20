// netlify/functions/gemini.js
// Runs on Netlify Functions (AWS Lambda). Node 18+ has global fetch.
const API_KEY = process.env.GEMINI_API_KEY;        // <-- set in Netlify UI (server-only)
const MODEL   = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export async function handler(event) {
  try {
    if (!API_KEY) {
      return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    }
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Your UI should POST: { systemInstruction, contents, tools }
    const payload = JSON.parse(event.body || '{}');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: payload.systemInstruction,
        contents: payload.contents,
        tools: payload.tools, // safe to omit if unused
      }),
    });

    const bodyText = await upstream.text();

    // Pass through upstream failures so your UI can show a clear error
    if (!upstream.ok) {
      return { statusCode: upstream.status, body: bodyText || 'Gemini error (empty body)' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: bodyText, // already JSON
    };
  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
}
