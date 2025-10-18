// src/utils/ApiHelpers.js
/**
 * Utilities for API access + Gemini.
 * Works with Vite/ESM and Netlify (Linux case-sensitive).
 *
 * Exports used by App.jsx:
 *   callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY
 * Also includes: fetchJSON, getJSON, postJSON, sleep, readLocal, writeLocal, removeLocal
 */

// -------- Env helpers --------
export function getEnv(key, fallback = '') {
  try {
    const v = import.meta?.env?.[key];
    return (v === undefined || v === null || v === '') ? fallback : v;
  } catch {
    return fallback;
  }
}

// Prefer using a proxy function so the API key stays server-side.
export const PROXY_URL   = getEnv('VITE_GEMINI_PROXY_URL', '/.netlify/functions/gemini');
export const GEMINI_MODEL = getEnv('VITE_GEMINI_MODEL', 'gemini-1.5-pro');
// Only use this for direct client-side calls in dev; proxy is safer.
export const API_KEY      = getEnv('VITE_GEMINI_API_KEY', '');

export function hasGeminiKey() {
  // You either configured a proxy URL or provided a client-side key.
  return Boolean(PROXY_URL) || Boolean(API_KEY);
}

// -------- Generic fetch helpers --------
export async function fetchJSON(input, init = {}) {
  const url = typeof input === 'string' ? input : String(input);
  const res = await fetch(url, {
    credentials: 'include',
    headers: { ...(init.headers || {}) },
    ...init,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

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

// -------- Gemini helper --------
/**
 * callSecureGeminiAPI({
 *   prompt?: string,
 *   messages?: Array<{role:'user'|'model'|'system', parts?:Ar*
