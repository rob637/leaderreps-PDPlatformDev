// src/routing/screenAliases.js
//
// Maps legacy screen keys to revamp screen keys. Used by ScreenRouter when
// the Ascent Revamp flag is ON for the current user.
//
// Why aliases instead of renames? Many call-sites (widget templates, modals,
// notification deep links, dashboard CTAs) hardcode old screen keys. Aliasing
// keeps those working without a coordinated rename across dozens of files.
//
// IMPORTANT: Do NOT delete legacy screen keys from ScreenRouter.jsx — they
// must remain registered. The alias is applied in the router AFTER lookup
// fails OR transparently when revamp is on. See ScreenRouter.jsx.

export const REVAMP_SCREEN_ALIASES = {
  // Old → New (revamp UI)
  'community': 'events',
  'community-hub': 'events',
  'community-feed': 'events',
  'coaching-hub': 'events',
  'coaching-lab': 'events',
  'labs': 'events',
  'conditioning': 'conditioning-light',
};

/**
 * Resolve a screen key against the revamp alias map.
 * @param {string} screenKey - The requested screen key
 * @param {boolean} revampEnabled - Whether the revamp UI is active
 * @returns {string} The effective screen key to render
 */
export const resolveScreenKey = (screenKey, revampEnabled) => {
  if (!revampEnabled) return screenKey;
  return REVAMP_SCREEN_ALIASES[screenKey] || screenKey;
};
