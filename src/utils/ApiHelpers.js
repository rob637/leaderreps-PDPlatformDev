// src/utils/ApiHelpers.js
// Utilities for API access + Gemini (Vite/ESM + Netlify-friendly)

// ---------------- Env helpers ----------------
export function getEnv(key, fallback = '') {
  try {
    const v = import.meta?.env?.[key];
    return v === undefined || v === null || v === '' ? fallback : v;
  } catch {
    return fallback;
  }
}

// Prefer using a server-side proxy (e.g., Netlify function) for Gemini calls.
export const PROXY_URL = getEnv('VITE_GEMINI_PROXY_URL', ''); // e.g. '/.netlify/functions/gemini'
export const GEMINI_MODEL = getEnv('VITE_GEMINI_MODEL', 'gemini-1.5-pro');
// Only for direct client calls in dev. Prefer PROXY_URL in production.
export const API_KEY = getEnv('VITE_GEMINI_API_KEY', '');

export function hasGeminiKey() {
  return Boolean(PROXY_URL) || Boolean(API_KEY);
}

// ---------------- Generic fetch helpers ----------------
export async function fetchJSON(input, init = {}) {
  const url = typeof input === 'string' ? input : String(input);
  const res = await fetch(url, {
    credentials: 'include',
    headers: { ...(init.headers || {}) },
    ...init,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text; // non-JSON
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.statusText = res.statusText;
    err.body = data;
    throw err;
  }
  return data;
}

export function getJSON(url, init = {}) {
  return fetchJSON(url, { method: 'GET', ...init });
}

export function postJSON(url, body, init = {}) {
  return fetchJSON(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: JSON.stringify(body ?? {}),
    ...init,
  });
}

// ---------------- Gemini helper ----------------
// callSecureGeminiAPI(options)
// options: { prompt?: string, messages?: Array<any>, systemInstruction?: string, model?: string, stream?: boolean, ... }
export async function callSecureGeminiAPI(opts = {}) {
  const {
    prompt,
    messages,
    systemInstruction,
    model = GEMINI_MODEL,
    stream = false,
    ...extra
  } = opts || {};

  // Prefer proxy (keeps your API key server-side)
  if (PROXY_URL) {
    return postJSON(PROXY_URL, {
      model,
      prompt,
      messages,
      systemInstruction,
      stream,
      ...extra,
    });
  }

  // Fallback: direct call to Google API (dev-only)
  if (!API_KEY) {
    throw new Error('No PROXY_URL or API_KEY configured for Gemini calls.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  const contents =
    Array.isArray(messages) && messages.length
      ? normalizeToGeminiContents(messages)
      : [{ role: 'user', parts: [{ text: String(prompt ?? '') }] }];

  const body = {
    contents,
    ...(systemInstruction
      ? { system_instruction: { parts: [{ text: String(systemInstruction) }] } }
      : {}),
  };

  return postJSON(endpoint, body);
}

function normalizeToGeminiContents(msgs) {
  return msgs.map((m) => {
    if (m?.parts) return m;
    // allow { role, text }
    return { role: m.role || 'user', parts: [{ text: String(m.text ?? '') }] };
  });
}

// ---------------- Tiny local storage utils ----------------
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, Number(ms) || 0));
}
export function readLocal(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
export function removeLocal(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// Optional default export for namespace import
const ApiHelpers = {
  PROXY_URL,
  GEMINI_MODEL,
  API_KEY,
  hasGeminiKey,
  fetchJSON,
  getJSON,
  postJSON,
  callSecureGeminiAPI,
  sleep,
  readLocal,
  writeLocal,
  removeLocal,
};

export default ApiHelpers;
