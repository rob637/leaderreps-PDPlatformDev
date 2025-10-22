// netlify/functions/gemini.js

const API_ROOT = "https://generativelanguage.googleapis.com/v1";
const DEFAULT_MODEL = "gemini-1.5-flash-latest";

// Helper function to send the request to the Gemini API
async function callGemini({ apiKey, model, body }) {
    const targetModel = model || DEFAULT_MODEL;
    const url = `${API_ROOT}/models/${targetModel}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed;

    try { 
        parsed = JSON.parse(text); 
    } catch { 
        parsed = { raw: text }; 
    }

    if (!res.ok) {
        const err = new Error("Gemini API error");
        err.status = res.status;
        err.data = parsed;
        throw err;
    }
    return parsed;
}

// Helper for structured JSON response
function json(body, status = 200) {
    return {
        statusCode: status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify(body),
    };
}

// Helper to normalize model name (for debugging/error messages)
const normalizeModel = (modelName) => {
    return modelName.toLowerCase().replace(/[^\w-]/g, '').trim();
};


exports.handler = async function handler(event) {
try {
    // CORS preflight
    if (event.httpMethod === "OPTIONS") return json({ ok: true });

    // Health check / quick debug
    if (event.httpMethod === "GET") {
        return json({ ok: true, message: "Gemini function is up", env: { hasKey: !!process.env.GEMINI_API_KEY } });
    }

    if (event.httpMethod !== "POST") {
        return json({ error: "Method Not Allowed" }, 405);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    // CRITICAL FIX: Ensure the function returns 500 if the key is missing in production
    if (!apiKey) return json({ error: "Missing GEMINI_API_KEY env var (Netlify Secret)" }, 500);

    let payload;
    try { payload = JSON.parse(event.body || "{}"); } catch {
        return json({ error: "Invalid JSON body" }, 400);
    }

    const { model, contents, systemInstruction, tools, safetySettings, generationConfig } = payload || {};

    // Build request body exactly as Gemini expects
    const requestBody = {
        contents: contents || [],
        ...(systemInstruction ? { system_instruction: systemInstruction } : {}), // FIX: Use correct key for system_instruction
        ...(tools ? { tools } : {}),
        ...(safetySettings ? { safetySettings } : {}),
        ...(generationConfig ? { generationConfig } : {}),
    };


    // Basic retry for transient 5xx
    const maxAttempts = 3;
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const out = await callGemini({ apiKey, model, body: requestBody });
            return json(out);
        } catch (e) {
            lastErr = e;
            const status = e.status || 0;
            if (status >= 500 && status < 600 && attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, 250 * attempt));
                continue;
            }
            // CRITICAL FIX: Enhanced error response for debugging
            return json({
                error: {
                    code: e.status || 500,
                    message: e?.data?.error?.message || String(e),
                    status: e?.data?.error?.status || "API_ERROR",
                },
                debug: {
                    status: e.status || 0,
                    endpoint: `${API_ROOT}/models/${normalizeModel(model || DEFAULT_MODEL)}:generateContent?key=[redacted]`,
                    upstream: e?.data || null,
                    requestBodySent: requestBody // Show what was sent
                },
            }, e.status || 500);
        }
    }


    // Should not reach here
    return json({ error: "Unknown error" }, 500);
} catch (err) {
    return json({ error: String(err?.message || err) }, 500);
}
};