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

// True if the item shape is one of our artifacts.
export const isArtifactItem = (item) => {
  if (!item) return false;
  if (item.resourceType === 'artifact') return true;
  const id = item.resourceId || item.id || item.contentItemId;
  return Object.values(ARTIFACT_KINDS).includes(id);
};

// Get the artifact kind id from an item.
export const getArtifactKind = (item) => {
  if (!item) return null;
  const id = item.resourceId || item.id || item.contentItemId;
  if (Object.values(ARTIFACT_KINDS).includes(id)) return id;
  return null;
};

// Where clicking an artifact item should navigate.
export const getArtifactNavigation = (kind) => {
  switch (kind) {
    case ARTIFACT_KINDS.LEADER_PROFILE:
      return { screen: 'development-plan', params: { view: 'leader-profile' } };
    case ARTIFACT_KINDS.SKILLS_BASELINE:
      return { screen: 'development-plan', params: { view: 'baseline' } };
    case ARTIFACT_KINDS.IDENTITY_STATEMENT:
      return { screen: 'identity-statement', params: { startEdit: true } };
    default:
      return { screen: 'locker', params: {} };
  }
};

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
