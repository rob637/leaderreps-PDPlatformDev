// src/hooks/useArtifactCompletion.js
//
// Centralized completion + navigation logic for "artifact" content items
// (Leader Profile, Leadership Skills Baseline, Leadership Identity Statement).
//
// Artifacts behave like content items in the Phase Content list, but their
// completion is *auto-derived* from the underlying user data — never from a
// manual checkbox. This prevents drift between "checked" and "actually filled
// out".

import { useMemo } from 'react';
import { useAppServices } from '../services/useAppServices';
import useLeaderProfile from './useLeaderProfile';

export const ARTIFACT_KINDS = {
  LEADER_PROFILE: 'leader-profile',
  SKILLS_BASELINE: 'leadership-skills-baseline',
  IDENTITY_STATEMENT: 'leadership-identity-statement',
};

export const ARTIFACT_LIBRARY = [
  {
    id: ARTIFACT_KINDS.LEADER_PROFILE,
    title: 'Leader Profile',
    description:
      'Capture role, span of control, and leadership context. Stored in your locker.',
  },
  {
    id: ARTIFACT_KINDS.SKILLS_BASELINE,
    title: 'Leadership Skills Baseline',
    description:
      'Self-assessment across the core leadership skill areas. Stored in your locker.',
  },
  {
    id: ARTIFACT_KINDS.IDENTITY_STATEMENT,
    title: 'Leadership Identity Statement',
    description:
      'Define who you want to be as a leader. Stored in your locker.',
  },
];

// Map of alternate ids/aliases that should resolve to one of the canonical
// artifact kinds. This lets the kickoff widget treat content_library items
// (e.g. `interactive-leader-profile`) as artifacts so clicking them routes
// to the proper screen instead of opening an empty resource viewer.
const ARTIFACT_ID_ALIASES = {
  'interactive-leader-profile': ARTIFACT_KINDS.LEADER_PROFILE,
  'interactive-baseline-assessment': ARTIFACT_KINDS.SKILLS_BASELINE,
  'interactive-skills-baseline': ARTIFACT_KINDS.SKILLS_BASELINE,
  'interactive-identity-statement': ARTIFACT_KINDS.IDENTITY_STATEMENT,
};

const matchArtifactByLabel = (label) => {
  const t = (label || '').toLowerCase();
  if (!t) return null;
  if (t.includes('leader profile')) return ARTIFACT_KINDS.LEADER_PROFILE;
  if (
    t.includes('skills baseline') ||
    t.includes('baseline assessment') ||
    t.includes('skills assessment') ||
    t.includes('baseline')
  ) {
    return ARTIFACT_KINDS.SKILLS_BASELINE;
  }
  if (t.includes('identity statement') || t.includes('leadership identity')) {
    return ARTIFACT_KINDS.IDENTITY_STATEMENT;
  }
  return null;
};

// True if the item shape is one of our artifacts.
export const isArtifactItem = (item) => {
  if (!item) return false;
  if (item.resourceType === 'artifact') return true;
  const id = item.resourceId || item.id || item.contentItemId;
  if (Object.values(ARTIFACT_KINDS).includes(id)) return true;
  if (id && ARTIFACT_ID_ALIASES[id]) return true;
  // Last resort: match by label so a content_library doc titled
  // "Complete Your Leader Profile" still routes to the artifact screen.
  const label = item.contentItemLabel || item.label || item.title;
  return matchArtifactByLabel(label) != null;
};

// Get the artifact kind id from an item.
export const getArtifactKind = (item) => {
  if (!item) return null;
  const id = item.resourceId || item.id || item.contentItemId;
  if (Object.values(ARTIFACT_KINDS).includes(id)) return id;
  if (id && ARTIFACT_ID_ALIASES[id]) return ARTIFACT_ID_ALIASES[id];
  const label = item.contentItemLabel || item.label || item.title;
  return matchArtifactByLabel(label);
};

// Where clicking an artifact item should navigate.
export const getArtifactNavigation = (kind) => {
  switch (kind) {
    case ARTIFACT_KINDS.LEADER_PROFILE:
      return { screen: 'development-plan', params: { view: 'leader-profile' } };
    case ARTIFACT_KINDS.SKILLS_BASELINE:
      return { screen: 'development-plan', params: { view: 'baseline' } };
    case ARTIFACT_KINDS.IDENTITY_STATEMENT:
      return { screen: 'identity-statement', params: {} };
    default:
      return { screen: 'locker', params: {} };
  }
};

// =====================================================================
// Interactive kinds (NOT artifacts but still need special handling)
// =====================================================================
// These items live in content_library as INTERACTIVE docs but should
// open a dedicated modal, not the generic UniversalResourceViewer.
// Completion is tracked via prepStatus on the user doc.

export const INTERACTIVE_KINDS = {
  NOTIFICATION_SETUP: 'notification-setup',
  FOUNDATION_COMMITMENT: 'foundation-commitment',
  CONDITIONING_TUTORIAL: 'conditioning-tutorial',
};

const INTERACTIVE_ID_ALIASES = {
  'interactive-notification-setup': INTERACTIVE_KINDS.NOTIFICATION_SETUP,
  'interactive-foundation-commitment': INTERACTIVE_KINDS.FOUNDATION_COMMITMENT,
  'interactive-conditioning-tutorial': INTERACTIVE_KINDS.CONDITIONING_TUTORIAL,
};

const matchInteractiveByLabel = (label) => {
  const t = (label || '').toLowerCase();
  if (!t) return null;
  if (t.includes('notification')) return INTERACTIVE_KINDS.NOTIFICATION_SETUP;
  if (
    t.includes('foundation commitment') ||
    t.includes('foundation expectation')
  ) {
    return INTERACTIVE_KINDS.FOUNDATION_COMMITMENT;
  }
  if (t.includes('conditioning tutorial')) {
    return INTERACTIVE_KINDS.CONDITIONING_TUTORIAL;
  }
  return null;
};

export const getInteractiveKind = (item) => {
  if (!item) return null;
  const id = item.resourceId || item.id || item.contentItemId;
  if (id && Object.values(INTERACTIVE_KINDS).includes(id)) return id;
  if (id && INTERACTIVE_ID_ALIASES[id]) return INTERACTIVE_ID_ALIASES[id];
  const label = item.contentItemLabel || item.label || item.title;
  return matchInteractiveByLabel(label);
};

export const isInteractiveItem = (item) => getInteractiveKind(item) != null;

const useArtifactCompletion = () => {
  const { developmentPlanData, dailyPracticeData, user } = useAppServices();
  const { isComplete: leaderProfileComplete } = useLeaderProfile();

  return useMemo(() => {
    const baselineComplete = !!(
      developmentPlanData?.assessmentHistory &&
      developmentPlanData.assessmentHistory.length > 0
    );
    const identity =
      dailyPracticeData?.identityAnchor ||
      user?.identityStatement ||
      '';
    const identityComplete =
      typeof identity === 'string' && identity.trim().length > 0;

    const isComplete = (kind) => {
      switch (kind) {
        case ARTIFACT_KINDS.LEADER_PROFILE:
          return !!leaderProfileComplete;
        case ARTIFACT_KINDS.SKILLS_BASELINE:
          return baselineComplete;
        case ARTIFACT_KINDS.IDENTITY_STATEMENT:
          return identityComplete;
        default:
          return false;
      }
    };

    return { isComplete };
  }, [
    developmentPlanData?.assessmentHistory,
    dailyPracticeData?.identityAnchor,
    user?.identityStatement,
    leaderProfileComplete,
  ]);
};

export default useArtifactCompletion;
