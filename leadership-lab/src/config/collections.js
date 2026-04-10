// Firestore collection paths — namespaced with ll- prefix
import { COLLECTION_PREFIX } from './firebase.js';

const prefix = COLLECTION_PREFIX;

const collections = {
  users: `${prefix}users`,
  cohorts: `${prefix}cohorts`,
  facilitators: `${prefix}facilitators`,
  content: `${prefix}content`,
};

// Sub-collection paths for a user
export const userPaths = (userId) => ({
  profile: `${collections.users}/${userId}`,
  leadershipProfile: `${collections.users}/${userId}/leadershipProfile/current`,
  conversations: `${collections.users}/${userId}/conversations`,
  challenges: `${collections.users}/${userId}/challenges`,
  reflections: `${collections.users}/${userId}/reflections`,
  observations: `${collections.users}/${userId}/observations`,
  reveals: `${collections.users}/${userId}/reveals`,
  voiceMemos: `${collections.users}/${userId}/voiceMemos`,
});

// Sub-collection paths for a cohort
export const cohortPaths = (cohortId) => ({
  config: `${collections.cohorts}/${cohortId}`,
  members: `${collections.cohorts}/${cohortId}/members`,
  sessions: `${collections.cohorts}/${cohortId}/sessions`,
  sharedReflections: `${collections.cohorts}/${cohortId}/sharedReflections`,
  pulse: `${collections.cohorts}/${cohortId}/pulse`,
  alerts: `${collections.cohorts}/${cohortId}/alerts`,
});

// Sub-collection paths for a facilitator
export const facilitatorPaths = (userId) => ({
  profile: `${collections.facilitators}/${userId}`,
  briefs: `${collections.facilitators}/${userId}/briefs`,
  sentTexts: `${collections.facilitators}/${userId}/sentTexts`,
});

export default collections;
