// functions/conditioning/patternDetection.js
//
// Detects recurring weaknesses across a user's recent reps.
// Per spec §10 + §6 of the Implementation Rules Addendum:
//
//   A. Pattern (short window): same condition is the LOWEST in 3 of last 5 reps
//   B. Escalation: condition never scores STRONG in last 6 reps
//   C. RED-specific: Request <= 2 in 3 of last 5 reps
//
// Suppression: same pattern key may not fire more than once per 3 reps.
// Reset: a pattern resets when the condition hits STRONG in any subsequent rep.
//
// Patterns ONLY fire after fail logic has been checked. If a fail triggered,
// pattern logic is skipped entirely (per Implementation Rules Addendum §1).

'use strict';

const { SCORE } = require('./rrConfig');

const SHORT_WINDOW = 5; // reps to look back
const SHORT_WINDOW_HITS = 3; // condition must be lowest in this many
const ESCALATION_WINDOW = 6;
const RED_REQUEST_WINDOW = 5;
const RED_REQUEST_HITS = 3;
const SUPPRESSION_WINDOW = 3; // can't repeat same pattern within last N reps

/**
 * Find the lowest-scoring condition in a single rep's scores object.
 * Ties broken by alphabetical condition name (deterministic).
 * Conditions with score 0 (Missing) DO count as the lowest.
 */
const findLowestCondition = (scores) => {
  if (!scores || typeof scores !== 'object') return null;
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  let lowest = entries[0];
  for (const entry of entries.slice(1)) {
    if (
      entry[1] < lowest[1] ||
      (entry[1] === lowest[1] && entry[0] < lowest[0])
    ) {
      lowest = entry;
    }
  }
  return lowest[0];
};

/**
 * Check whether a previously-fired pattern should reset because the same
 * condition has since hit STRONG.
 */
const isPatternReset = (recentReps, condition) => {
  // recentReps newest-first (index 0 = most recent)
  for (const rep of recentReps) {
    const s = rep?.conditionScores?.[condition];
    if (typeof s === 'number' && s >= SCORE.STRONG) return true;
  }
  return false;
};

/**
 * Determine if a candidate pattern was already surfaced too recently.
 * `recentPatterns` = array (newest-first) of `{ key, repIndex }` from the
 * last few reps' stored output.
 */
const isSuppressed = (candidateKey, recentPatterns) => {
  if (!Array.isArray(recentPatterns) || recentPatterns.length === 0) {
    return false;
  }
  return recentPatterns
    .slice(0, SUPPRESSION_WINDOW)
    .some((p) => p?.key === candidateKey);
};

/**
 * Detect any pattern that should fire for the CURRENT rep, given a set of
 * recent prior reps.
 *
 * @param {object} currentRep - { rrType, conditionScores, result }
 * @param {Array}  recentReps - Newest-first array of recent prior reps,
 *                              each `{ rrType, conditionScores, result, patternKey? }`.
 *                              Should NOT include the current rep.
 * @returns {{ key: string, condition: string, kind: 'short'|'escalation'|'red-request' } | null}
 */
const detectPattern = (currentRep, recentReps) => {
  if (!currentRep || !Array.isArray(recentReps)) return null;

  const lastFive = recentReps.slice(0, SHORT_WINDOW);
  const lastSix = recentReps.slice(0, ESCALATION_WINDOW);
  const recentPatterns = recentReps
    .map((r) => (r?.patternKey ? { key: r.patternKey } : null))
    .filter(Boolean);

  const candidates = [];

  // ---------------- Short-window pattern ----------------
  // For each condition that appeared in any rep, count how often it was the
  // lowest. If it was lowest in >= 3 of last 5, that's a pattern.
  const lowestCounts = {};
  for (const rep of lastFive) {
    const lowest = findLowestCondition(rep?.conditionScores);
    if (lowest) lowestCounts[lowest] = (lowestCounts[lowest] || 0) + 1;
  }
  // Also include the current rep's lowest in the count
  const currentLowest = findLowestCondition(currentRep.conditionScores);
  if (currentLowest) {
    lowestCounts[currentLowest] = (lowestCounts[currentLowest] || 0) + 1;
  }

  for (const [condition, count] of Object.entries(lowestCounts)) {
    if (count >= SHORT_WINDOW_HITS) {
      candidates.push({
        key: `short:${condition}`,
        condition,
        kind: 'short',
        priority: 2,
      });
    }
  }

  // ---------------- Escalation pattern ----------------
  // Condition never STRONG in last 6 reps (including current).
  const allReps = [currentRep, ...lastSix];
  const conditionsSeen = new Set();
  allReps.forEach((rep) => {
    Object.keys(rep?.conditionScores || {}).forEach((c) => conditionsSeen.add(c));
  });

  if (allReps.length >= ESCALATION_WINDOW) {
    for (const condition of conditionsSeen) {
      const everStrong = allReps.some(
        (rep) => (rep?.conditionScores?.[condition] ?? 0) >= SCORE.STRONG
      );
      if (!everStrong) {
        candidates.push({
          key: `escalation:${condition}`,
          condition,
          kind: 'escalation',
          priority: 1, // higher priority than short-window
        });
      }
    }
  }

  // ---------------- RED-specific Request pattern ----------------
  if (currentRep.rrType === 'RED') {
    const redReps = [currentRep, ...lastFive].filter((r) => r?.rrType === 'RED');
    if (redReps.length >= RED_REQUEST_HITS) {
      const lowRequestCount = redReps
        .slice(0, RED_REQUEST_WINDOW)
        .filter((r) => (r?.conditionScores?.Request ?? 0) <= SCORE.ADEQUATE)
        .length;
      if (lowRequestCount >= RED_REQUEST_HITS) {
        candidates.push({
          key: 'red-request',
          condition: 'Request',
          kind: 'red-request',
          priority: 0, // highest priority — RED protection rule
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort by priority (lowest number = highest priority), filter suppressed
  // and reset patterns, return the first survivor.
  candidates.sort((a, b) => a.priority - b.priority);

  for (const candidate of candidates) {
    if (isPatternReset(recentReps, candidate.condition)) continue;
    if (isSuppressed(candidate.key, recentPatterns)) continue;
    // Strip internal `priority` field from public return
    const { priority: _p, ...result } = candidate;
    return result;
  }

  return null;
};

module.exports = {
  detectPattern,
  findLowestCondition,
  // exposed for tests
  SHORT_WINDOW,
  SHORT_WINDOW_HITS,
  ESCALATION_WINDOW,
  RED_REQUEST_HITS,
};
