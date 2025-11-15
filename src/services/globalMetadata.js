// src/services/globalMetadata.js
import { useState, useEffect } from 'react';
import { getDocEx } from './firestoreUtils'; // Assuming firestoreUtils.js exists
import { 
    MOCK_FEATURE_FLAGS, LEADERSHIP_TIERS_FALLBACK, MOCK_REP_LIBRARY, MOCK_EXERCISE_LIBRARY,
    MOCK_WORKOUT_LIBRARY, MOCK_COURSE_LIBRARY, MOCK_SKILL_CATALOG, MOCK_IDENTITY_ANCHOR_CATALOG,
    MOCK_HABIT_ANCHOR_CATALOG, MOCK_WHY_CATALOG, MOCK_READING_CATALOG, MOCK_VIDEO_CATALOG,
    MOCK_SCENARIO_CATALOG, MOCK_MEMBERSHIP_PLANS
} from './mockData';
import { HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap, ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, User as UserIcon, DollarSign } from 'lucide-react';

const ADMIN_EMAILS = process.env.VITE_ADMIN_EMAILS ? process.env.VITE_ADMIN_EMAILS.split(',') : ['rob@sagecg.com'];
const GEMINI_MODEL = 'gemini-pro';

const cfg = (obj, keys, fallback) => {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return fallback;
};

export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({
    featureFlags: MOCK_FEATURE_FLAGS,
    LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
    REP_LIBRARY: MOCK_REP_LIBRARY,
    EXERCISE_LIBRARY: MOCK_EXERCISE_LIBRARY,
    WORKOUT_LIBRARY: MOCK_WORKOUT_LIBRARY,
    COURSE_LIBRARY: MOCK_COURSE_LIBRARY,
    SKILL_CATALOG: MOCK_SKILL_CATALOG,
    IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_ANCHOR_CATALOG,
    HABIT_ANCHOR_CATALOG: MOCK_HABIT_ANCHOR_CATALOG,
    WHY_CATALOG: MOCK_WHY_CATALOG,
    READING_CATALOG: MOCK_READING_CATALOG,
    VIDEO_CATALOG: MOCK_VIDEO_CATALOG,
    SCENARIO_CATALOG: MOCK_SCENARIO_CATALOG,
    MEMBERSHIP_PLANS: MOCK_MEMBERSHIP_PLANS,
    RESOURCE_LIBRARY: {},
    IconMap: {},
    APP_ID: 'default-app-id',
    GEMINI_MODEL: GEMINI_MODEL,
    adminemails: ADMIN_EMAILS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !isAuthReady) {
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
          const configSnap = await getDocEx(db, 'metadata/config');
          const configData = configSnap.exists() ? configSnap.data() : {};

          const iconComponents = {
            HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap,
            ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, UserIcon, DollarSign
          };
          const iconMap = {};
          Object.keys(iconComponents).forEach(name => {
              iconMap[name] = iconComponents[name];
          });

          setMetadata(prev => ({
              ...prev,
              featureFlags: cfg(configData, ['feature_flags', 'featureFlags'], MOCK_FEATURE_FLAGS),
              adminemails: cfg(configData, ['adminemails', 'ADMIN_EMAILS'], ADMIN_EMAILS),
              LEADERSHIP_TIERS: cfg(configData, ['leadership_tiers', 'LEADERSHIP_TIERS'], LEADERSHIP_TIERS_FALLBACK),
              REP_LIBRARY: cfg(configData, ['rep_library', 'REP_LIBRARY'], MOCK_REP_LIBRARY),
              EXERCISE_LIBRARY: cfg(configData, ['exercise_library', 'EXERCISE_LIBRARY'], MOCK_EXERCISE_LIBRARY),
              WORKOUT_LIBRARY: cfg(configData, ['workout_library', 'WORKOUT_LIBRARY'], MOCK_WORKOUT_LIBRARY),
              COURSE_LIBRARY: cfg(configData, ['course_library', 'COURSE_LIBRARY'], MOCK_COURSE_LIBRARY),
              SKILL_CATALOG: cfg(configData, ['skill_catalog', 'SKILL_CATALOG'], MOCK_SKILL_CATALOG),
              IDENTITY_ANCHOR_CATALOG: cfg(configData, ['identity_anchor_catalog', 'IDENTITY_ANCHOR_CATALOG'], MOCK_IDENTITY_ANCHOR_CATALOG),
              HABIT_ANCHOR_CATALOG: cfg(configData, ['habit_anchor_catalog', 'HABIT_ANCHOR_CATALOG'], MOCK_HABIT_ANCHOR_CATALOG),
              WHY_CATALOG: cfg(configData, ['why_catalog', 'WHY_CATALOG'], MOCK_WHY_CATALOG),
              READING_CATALOG: cfg(configData, ['reading_catalog', 'READING_CATALOG'], MOCK_READING_CATALOG),
              VIDEO_CATALOG: cfg(configData, ['video_catalog', 'VIDEO_CATALOG'], MOCK_VIDEO_CATALOG),
              SCENARIO_CATALOG: cfg(configData, ['scenario_catalog', 'SCENARIO_CATALOG'], MOCK_SCENARIO_CATALOG),
              MEMBERSHIP_PLANS: cfg(configData, ['membership_plans', 'MEMBERSHIP_PLANS'], MOCK_MEMBERSHIP_PLANS),
              RESOURCE_LIBRARY: cfg(configData, ['resource_library', 'RESOURCE_LIBRARY'], {}),
              APP_ID: cfg(configData, ['app_id', 'APP_ID'], 'default-app-id'),
              GEMINI_MODEL: cfg(configData, ['gemini_model', 'GEMINI_MODEL'], GEMINI_MODEL),
              IconMap: iconMap,
          }));

      } catch (e) {
          console.error("[CRITICAL GLOBAL READ FAIL] Metadata fetch failed.", e);
          setError(e);
          setMetadata({
              featureFlags: MOCK_FEATURE_FLAGS,
              LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
              IconMap: {},
              GEMINI_MODEL: GEMINI_MODEL,
              APP_ID: 'error-app-id',
              adminemails: ADMIN_EMAILS,
          });
      } finally {
          setLoading(false);
      }
    };

    fetchMetadata();

  }, [db, isAuthReady]);

  return { metadata, isLoading: loading, error };
};
