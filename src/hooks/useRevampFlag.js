// src/hooks/useRevampFlag.js
//
// Central source of truth for whether the Ascent Revamp UI should be shown
// to the current user. Reads the `ascentRevamp` flag from `config/features`
// (managed by FeatureProvider) and applies cohort-level scoping.
//
// Firestore shape (in `config/features` document):
//   ascentRevamp: {
//     enabled: true,                      // master kill-switch
//     cohorts: ['all']                    // OR ['cohort-263', 'cohort-264']
//   }
//
// Behavior:
//   - If feature missing or `enabled !== true`  → revamp OFF
//   - If `cohorts` includes 'all'                → revamp ON for every user
//   - If `cohorts` includes user's cohortId      → revamp ON for that user
//   - Otherwise                                  → revamp OFF
//
// Dev/QA override (NON-PROD):
//   - `localStorage.setItem('revamp-force', 'on'|'off')` overrides the flag.
//     Useful for testing both UIs in the same environment.

import { useFeatures } from '../providers/FeatureProvider';
import { useAppServices } from '../services/useAppServices.jsx';
import { useDailyPlan } from './useDailyPlan';

const REVAMP_FEATURE_ID = 'ascentRevamp';

export const useRevampFlag = () => {
  const { features } = useFeatures();
  const { user, developmentPlanData } = useAppServices();
  const { cohortData } = useDailyPlan();

  // Dev-only override
  if (typeof window !== 'undefined') {
    const override = window.localStorage?.getItem('revamp-force');
    if (override === 'on') return true;
    if (override === 'off') return false;
  }

  const flag = features?.[REVAMP_FEATURE_ID];
  if (!flag || typeof flag !== 'object') return false;
  if (flag.enabled !== true) return false;

  const cohorts = Array.isArray(flag.cohorts) ? flag.cohorts : [];
  if (cohorts.includes('all')) return true;

  const userCohortId =
    developmentPlanData?.cohortId || cohortData?.id || user?.cohortId;
  if (!userCohortId) return false;

  return cohorts.includes(userCohortId);
};

export default useRevampFlag;
