// Global Constants
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const API_KEY = (typeof window !== "undefined" && (window.__GEMINI_API_KEY || window.GEMINI_API_KEY)) || "";

// Utility to check if API key is present (used for conditional rendering)
export function hasGeminiKey() { 
    try { 
        return (typeof window !== "undefined") && (!!window.__GEMINI_API_KEY || !!window.GEMINI_API_KEY); 
    } catch { 
        return false; 
    } 
}

// SECURE GEMINI API PROXY FUNCTION
export async function callSecureGeminiAPI(payload, endpoint = '/generateContent') {
    if (!hasGeminiKey()) {
        throw new Error("API Key Missing: The Gemini API Key is not configured in the execution environment.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}${endpoint}?key=${API_KEY}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(`API call failed with status ${response.status}. Details: ${errorBody.substring(0, 200)}...`);
    }

    return response.json();
}

// --- MARKDOWN UTILITY FUNCTIONS (Needed by screens for critique rendering) ---

// Helper function to ensure script loads (dependency for mdToHtml)
const ensureScript = (src) => new Promise((resolve, reject) => {
    let el = document.querySelector(`script[src="${src}"]`);
    if (el) {
        if (el.dataset.loaded) return resolve();
        el.addEventListener('load', () => resolve(), { once: true });
        el.addEventListener('error', reject, { once: true });
        return;
    }
    el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => { el.dataset.loaded = '1'; resolve(); };
    el.onerror = reject;
    document.head.appendChild(el);
});

// Function to convert Markdown to safe HTML
export async function mdToHtml(md) {
    if (typeof window === 'undefined') return md;

    if (!window.marked) await ensureScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    if (!window.DOMPurify) await ensureScript('https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.min.js');

    // Use a simple retry mechanism for CDN load race conditions
    if (!window.marked || !window.DOMPurify) {
        await new Promise(r => setTimeout(r, 50));
    }

    // Ensure marked is available and call it
    const raw = window.marked ? window.marked.parse(md) : md;
    
    // Ensure DOMPurify is available and sanitize the result
    return window.DOMPurify ? window.DOMPurify.sanitize(raw) : raw;
}

// Exported items: GEMINI_MODEL is implicitly exported via constants in other modules or can be added here if needed.
export { GEMINI_MODEL, API_KEY };
