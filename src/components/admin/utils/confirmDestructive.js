// src/components/admin/utils/confirmDestructive.js
//
// Shared two-step confirmation helper for destructive admin operations.
// Pattern: window.confirm(summary) → window.prompt(typeToken) with case-insensitive match.
//
// Usage:
//   if (!confirmDestructive({
//     summary: 'Permanently delete cohort "Q1 2026"?\n\nAll members will be unassigned.',
//     typeToken: 'DELETE',
//   })) return;

/**
 * Shows a two-step confirmation: summary dialog + typed-token prompt.
 *
 * @param {Object} opts
 * @param {string} opts.summary - First-step warning message.
 * @param {string} [opts.typeToken='DELETE'] - The exact token the user must type.
 * @param {string} [opts.cancelMessage] - Optional alert shown if token mismatch.
 * @returns {boolean} true if both steps were confirmed.
 */
export const confirmDestructive = ({
  summary,
  typeToken = 'DELETE',
  cancelMessage,
} = {}) => {
  if (typeof window === 'undefined') return false;
  if (!window.confirm(summary)) return false;
  const entered = window.prompt(
    `Type "${typeToken}" (without quotes) to confirm:`,
  );
  const matches = (entered || '').trim().toUpperCase() === typeToken.toUpperCase();
  if (!matches) {
    if (cancelMessage !== undefined) {
      // eslint-disable-next-line no-alert
      window.alert(cancelMessage || 'Confirmation text did not match. Cancelled.');
    }
    return false;
  }
  return true;
};
