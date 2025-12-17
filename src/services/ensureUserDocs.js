// src/services/ensureUserDocs.js
import { getDocEx, setDocEx } from './firestoreUtils';
import { buildUserProfilePath, buildModulePath } from './pathUtils.js';
import { serverTimestamp } from 'firebase/firestore';
import { timeService } from './timeService';

export const ensureUserDocs = async (db, uidOrUser) => {
  try {
    // Support both uid string and user object
    const uid = typeof uidOrUser === 'string' ? uidOrUser : uidOrUser?.uid;
    const user = typeof uidOrUser === 'object' ? uidOrUser : null;
    
    if (!db || !uid) {
        console.warn('[ensureUserDocs] DB or UID missing, skipping.');
        return;
    }

    const todayStr = timeService.getISOString().split('T')[0]; 

    // ==================== USER PROFILE ====================
    const userProfilePath = buildUserProfilePath(uid);
    const userProfileSnap = await getDocEx(db, userProfilePath);
    
    if (!userProfileSnap.exists()) {
        // Create new profile with user info from Firebase Auth
        await setDocEx(db, userProfilePath, {
            userId: uid,
            email: user?.email || null,
            displayName: user?.displayName || null,
            photoURL: user?.photoURL || null,
            createdAt: timeService.getISOString(),
            arenaEntryDate: serverTimestamp(), // When user first entered the arena
            _createdAt: serverTimestamp()
        });
    } else {
        // Update existing profile with latest user info (in case name/email changed)
        const existingData = userProfileSnap.data();
        const updates = {};
        
        if (user?.email && user.email !== existingData.email) {
            updates.email = user.email;
        }
        if (user?.displayName && user.displayName !== existingData.displayName) {
            updates.displayName = user.displayName;
        }
        if (user?.photoURL && user.photoURL !== existingData.photoURL) {
            updates.photoURL = user.photoURL;
        }
        
        if (Object.keys(updates).length > 0) {
            updates.lastActive = serverTimestamp();
            await setDocEx(db, userProfilePath, updates, true); // merge: true
        }
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
            nextBillingDate: new Date(timeService.getNow().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
