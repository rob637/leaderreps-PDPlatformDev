// src/services/ensureUserDocs.js
import { getDocEx, setDocEx } from './firestoreUtils';
import { buildUserProfilePath, buildModulePath } from './pathUtils.js';
import { serverTimestamp } from 'firebase/firestore';

export const ensureUserDocs = async (db, uid) => {
  try {
    if (!db || !uid) {
        console.warn('[ensureUserDocs] DB or UID missing, skipping.');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; 

    // ==================== USER PROFILE ====================
    const userProfilePath = buildUserProfilePath(uid);
    const userProfileSnap = await getDocEx(db, userProfilePath);
    
    if (!userProfileSnap.exists()) {
        await setDocEx(db, userProfilePath, {
            userId: uid,
            createdAt: new Date().toISOString(),
            _createdAt: serverTimestamp()
        });
    }

    // ==================== DEVELOPMENT PLAN MODULE ====================
    const devPlanPath = buildModulePath(uid, 'development_plan', 'current');
    const devPlanSnap = await getDocEx(db, devPlanPath);
    
    if (!devPlanSnap.exists()) {
        const defaultPlan = {
            currentCycle: 1,
            createdAt: serverTimestamp(),
            lastAssessmentDate: null,
            assessmentHistory: [], 
            planHistory: [],
            currentPlan: null, 
        };
        await setDocEx(db, devPlanPath, defaultPlan);
    }

    // ==================== DAILY PRACTICE MODULE ====================
    const dailyPracticePath = buildModulePath(uid, 'daily_practice', 'current');
    const dailyPracticeSnap = await getDocEx(db, dailyPracticePath);
    
    if (!dailyPracticeSnap.exists()) {
        const defaultDailyPractice = {
            activeCommitments: [], 
            identityAnchor: '', 
            habitAnchor: '', 
            whyStatement: '',
            dailyTargetRepId: null, 
            dailyTargetRepDate: null, 
            dailyTargetRepStatus: 'Pending', 
            streakCount: 0,
            streakCoins: 0,
            lastUpdated: todayStr,
            completedRepsToday: [],
            _createdAt: serverTimestamp()
        };
        await setDocEx(db, dailyPracticePath, defaultDailyPractice);
    }

    // ==================== STRATEGIC CONTENT MODULE ====================
    const strategicPath = buildModulePath(uid, 'strategic_content', 'vision_mission');
    const strategicSnap = await getDocEx(db, strategicPath);
    
    if (!strategicSnap.exists()) {
        const defaultStrategic = {
            vision: '',
            mission: '',
            values: [],
            goals: [],
            purpose: '',
            _createdAt: serverTimestamp()
        };
        await setDocEx(db, strategicPath, defaultStrategic);
    }
    
    // ==================== MEMBERSHIP MODULE (NEW) ====================
    const membershipPath = buildModulePath(uid, 'membership', 'current');
    const membershipSnap = await getDocEx(db, membershipPath);

    if (!membershipSnap.exists()) {
        const defaultMembership = {
            status: 'Trial',
            currentPlanId: 'trial',
            nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            paymentHistory: [],
            notifications: [
                { id: 'welcome', message: 'Welcome to your 7-day free trial! Upgrade now to maintain access.', type: 'warning', isRead: false }
            ],
            _createdAt: serverTimestamp()
        };
        await setDocEx(db, membershipPath, defaultMembership);
    }
  } catch (e) {
    console.error('[ensureUserDocs] Error:', e);
  }
};
