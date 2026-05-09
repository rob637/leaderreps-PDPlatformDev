import React from 'react';

/**
 * BootSkeleton
 *
 * Mirrors the inline #boot-skeleton in index.html exactly so React's first
 * paint reuses the same visual layout and LCP element as the static HTML
 * skeleton. This keeps the LCP candidate stable through:
 *   index.html skeleton  →  React Suspense fallback  →  !isAuthReady loader
 *   →  AuthPanel/AppContent
 *
 * Without this, each transition introduces a new LCP candidate and pushes
 * Lighthouse's reported LCP out to the final paint (~9s).
 */
export default function BootSkeleton({ fullHeight = true }) {
  return (
    <div
      style={{
        background: '#FAFBFC',
        minHeight: fullHeight ? '100vh' : undefined,
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>
        <header style={{ padding: '12px 0 16px', textAlign: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 9999,
              background: 'rgba(71, 168, 141, 0.15)',
              color: '#1F6B59',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Ascent
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.2,
              fontWeight: 600,
              color: '#002E47',
              letterSpacing: '-0.02em',
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              color: '#475569',
              fontSize: 14,
            }}
          >
            Welcome to the Arena.
          </p>
        </header>
        <div style={{ padding: '8px 0 20px', display: 'grid', gap: 20 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 120,
                background: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
