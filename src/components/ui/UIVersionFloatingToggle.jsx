// src/components/ui/UIVersionFloatingToggle.jsx
// A small floating toggle anchored to the bottom-right of the screen.
// Lets anyone (including the boss in a demo) flip between Classic and Next
// UI without hunting through settings. Visible on every screen except the
// auth panel. Auto-hides on mobile to avoid blocking the bottom nav.

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useUIVersion } from '../../providers/UIVersionProvider';

const UIVersionFloatingToggle = () => {
  const { isV2, setUIVersion } = useUIVersion();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="fixed z-40 bottom-4 right-4 hidden md:flex items-center gap-2 pointer-events-none"
      aria-live="polite"
    >
      <div
        className={[
          'ui-version-floating-toggle',
          'pointer-events-auto group relative flex items-center gap-2 pl-3 pr-2 py-2 rounded-full',
          'transition-all duration-300',
          isV2
            ? 'bg-gradient-to-r from-corporate-teal to-corporate-teal-dark text-white shadow-[0_8px_28px_-6px_rgba(71,168,141,0.55)]'
            : 'bg-corporate-navy text-white shadow-[0_8px_28px_-6px_rgba(0,46,71,0.55)] hover:shadow-[0_12px_36px_-6px_rgba(0,46,71,0.7)] hover:-translate-y-0.5',
        ].join(' ')}
        style={{ backdropFilter: 'saturate(180%) blur(12px)' }}
      >
        <button
          type="button"
          onClick={() => setUIVersion(isV2 ? 'v1' : 'v2')}
          className="flex items-center gap-2 text-sm font-semibold"
          aria-label={isV2 ? 'Switch to classic UI' : 'Preview the next-generation UI'}
        >
          <Sparkles className={`w-4 h-4 ${isV2 ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
          <span>{isV2 ? 'Next UI' : 'Try the Next UI'}</span>
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-1 rounded-full p-1 hover:bg-white/15 transition-colors"
          aria-label="Hide UI toggle"
          title="Hide"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default UIVersionFloatingToggle;
