// netlify/functions/gemini.js
// CORRECTED Gemini proxy with robust payload translation and model-path normalization.

const API_KEY = process.env.GEMINI_API_KEY;
// IMPORTANT: Model path must be clean for the URL
const DEFAULT_MODEL = 'gemini-2.5-flash'; 

// --- 1. CORE TRANSLATION HELPERS ---

/**
 * Translates the SDK-style payload (used by the frontend) into a REST API compliant body.
 * The REST API requires:
 * - systemInstruction as a string (not an object with 'parts').
 * - tools/google_search to be nested and camelCased (googleSearch) inside a 'config' object.
 *
 * @param {object} sdkPayload - The payload received from the frontend (SDK format).
 * @param {boolean} useSnakeCase - True to use snake_case keys (for v1beta).
 * @returns {object} The compliant REST API payload.
 */
function translatePayload(sdkPayload, useSnakeCase) {
  const body = {
    // 'contents' field is compatible across SDK/REST
    contents: sdkPayload.contents,
  };

  // 1. Translate systemInstruction (SDK object -> REST string)
  const sdkSystemInstruction = sdkPayload.systemInstruction;
  if (sdkSystemInstruction?.parts?.[0]?.text) {
    const key = useSnakeCase ? 'system_instruction' : 'systemInstruction';
    body[key] = sdkSystemInstruction.parts[0].text;
  }
  // NOTE: The frontend used a key 'systemInstruction' with an object value. 
  // We extract the string and map it to the REST API's string field.

  // 2. Translate tools (SDK array -> REST config.tools array)
  if (sdkPayload.tools && sdkPayload.tools.length > 0) {
    const configKey = useSnakeCase ? 'generation_config' : 'generationConfig';
    
    // The Gemini REST API uses 'googleSearch', not 'google_search' 
    // and nests tools under a config object.
    const translatedTools = sdkPayload.tools.map(tool => {
        if (tool.google_search) {
            return { googleSearch: {} }; // Correct REST name
        }
        return tool;
    });

    body[configKey] = {
      tools: translatedTools,
      // You can also add temperature, topP, etc. here if passed in the payload
    };
  }

  // 3. Handle other potential fields if needed, ensuring correct casing/structure.
  
  return body;
}


// --- 2. MODEL PATH NORMALIZATION (Fixing the bug) ---

// Normalize ANY model string into a proper path segment for the URL
function normalizeModelPath(rawIn) {
  const raw = String(rawIn || '').trim();

  // FIX: The error indicated the frontend was passing a string like "gemini_model = gemini-2.5-flash"
  // This line strips any surrounding variable assignments, spaces, and model prefixes.
  const cleaned = raw
    .replace(/^.+?=\s*/, '') // Remove 'gemini_model =' if present
    .replace(/^(?:models\/|tunedmodels\/)+/i, '') // Strip common prefixes
    .trim();

  // If the original referenced tunedModels/, keep tuned; otherwise treat as stock model
  const isTuned = /^tunedmodels\//i.test(raw);

  // Stock model IDs are lowercase; tuned IDs often preserve case
  const id = isTuned ? cleaned : cleaned.toLowerCase();

  return isTuned ? `tunedModels/${id}` : `models/${id}`;
}


// --- 3. NETLIFY HANDLER ---

exports.handler = async (event) => {
  try {
    if (!API_KEY) return { statusCode: 500, body: 'Missing GEMINI_API_KEY env var.' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    let payload = {};
    try { 
        payload = JSON.parse(event.body || '{}'); 
    } catch (e) { 
        return { statusCode: 400, body: `Bad JSON: ${e.message}` }; 
    }

    // Compute URL model path
    const chosenModel = (payload.model || DEFAULT_MODEL).trim();
    // Use the normalized model path for the URL
    const modelPath = normalizeModelPath(chosenModel); 
    delete payload.model; // Ensure 'model' is not sent in the body

    if (!payload.contents) {
      return { statusCode: 400, body: 'Missing required field: contents' };
    }

    // Core caller function
    async function call(version, useSnakeCase) {
      const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${API_KEY}`;
      // Use the new, robust translation helper
      const body = translatePayload(payload, useSnakeCase); 
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      const text = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, text, url };
    }

    // Try v1 (camelCase fields, useSnakeCase=false) first
    let r = await call('v1', false);

    // Fallback logic
    if (!r.ok) {
      const msg = (r.text || '').toLowerCase();
      const shouldFallback =
        r.status === 400 || 
        msg.includes('unexpected model name format') ||
        msg.includes('unknown name') ||
        msg.includes('not found for api version v1');

      if (shouldFallback) {
        // Fallback to v1beta (snake_case fields, useSnakeCase=true)
        r = await call('v1beta', true);
      }
    }

    if (!r.ok) {
      // Return error with debug info
      try {
        const json = JSON.parse(r.text || '{}');
        json.debugUrl = r.url;
        return { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) };
      } catch {
        return { statusCode: r.status, body: (r.text || 'Gemini error (empty body)') + `\n\n[debug url] ${r.url}` };
      }
    }

    return { 
      statusCode: 200, 
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'no-store' 
      }, 
      body: r.text 
    };

  } catch (err) {
    return { statusCode: 500, body: `Function error: ${err.message}` };
  }
};