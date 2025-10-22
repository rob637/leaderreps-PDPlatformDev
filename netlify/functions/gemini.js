// netlify/functions/gemini.js
// CORRECTED Gemini proxy with robust payload translation and model-path normalization.

const API_KEY = process.env.GEMINI_API_KEY;
// IMPORTANT: Model path must be clean for the URL
const DEFAULT_MODEL = 'gemini-1.5-flash';  // safe, widely available default

// --- 1. CORE TRANSLATION HELPERS ---

/**
 * Translates the SDK-style payload (used by the frontend) into a REST API compliant body.
 * * @param {object} sdkPayload - The payload received from the frontend (SDK format).
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
    // FIX: Only set the system instruction field if we are NOT using the v1beta endpoint.
    // The v1beta endpoint often rejects the top-level system_instruction string field
    // with "Invalid value," requiring us to rely only on the prompt in 'contents'.
    if (!useSnakeCase) { 
        const key = 'systemInstruction'; // Use camelCase key for v1
        body[key] = sdkSystemInstruction.parts[0].text;
    }
  }
  
  // 2. Translate tools (SDK array -> REST top-level tools array)
  if (sdkPayload.tools && sdkPayload.tools.length > 0) {
    // Tools must be a top-level field for both versions.
    const toolKey = 'tools'; // Key name is 'tools' for both versions
    
    const translatedTools = sdkPayload.tools.map(tool => {
        if (tool.google_search) {
            // FIX: 'google_search' must be camelCase 'googleSearch' for the object content
            return { googleSearch: {} }; 
        }
        return tool;
    });

    body[toolKey] = translatedTools; // Add the tools array as a top-level field
  }

  // 3. (Optional) Add generation config fields (temperature, topP, etc.) if needed
  // Note: Only add if you have other generation parameters to pass, otherwise omit.
  
  return body;
}


// --- 2. MODEL PATH NORMALIZATION (No changes needed, this logic is correct) ---

// Normalize ANY model string into a proper path segment for the URL
function normalizeModelPath(rawIn) {
  const raw = String(rawIn || '').trim();

  // FIX: This section correctly handles model assignment strings like 'gemini_model = ...'
  const cleaned = raw
    .replace(/^.+?=\s*/, '') 
    .replace(/^(?:models\/|tunedmodels\/)+/i, '') 
    .trim();

  const isTuned = /^tunedmodels\//i.test(raw);
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
const chosenModel = (payload.model || DEFAULT_MODEL).trim().replace(/-latest$/, '');
const modelPath = normalizeModelPath(chosenModel);
    delete payload.model; 

    if (!payload.contents) {
      return { statusCode: 400, body: 'Missing required field: contents' };
    }

    // Core caller function
    async function call(version, useSnakeCase) {
      const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${API_KEY}`;
      // Use the corrected translation helper
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
      // Only fallback if the error suggests a version/casing issue
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
  try {
    const json = JSON.parse(r.text || '{}');
    // redact any key=value in the URL
    const redactedUrl = String(r.url || '').replace(/(key=)[^&]+/i, '$1[redacted]');
    // include minimal debug without leaking secrets
    json.debug = { endpoint: redactedUrl, status: r.status };
    return { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(json) };
  } catch {
    const redactedUrl = String(r.url || '').replace(/(key=)[^&]+/i, '$1[redacted]');
    return { statusCode: r.status, body: (r.text || 'Gemini error (empty body)') + `\n\n[debug] ${redactedUrl}` };
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