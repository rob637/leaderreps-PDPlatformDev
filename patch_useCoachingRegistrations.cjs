const fs = require('fs');
const file = 'src/hooks/useCoachingRegistrations.js';
let content = fs.readFileSync(file, 'utf8');

const targetHelperLocation = ` * Fetches and manages user registrations for coaching sessions.`;

const helperStr = `
// Helper to get derived session type for Open Gym variants
const getDerivedSessionType = (sessionTitle, sessionType) => {
  if (sessionType === 'open_gym') {
    const title = (sessionTitle || '').toLowerCase();
    if (title.includes('redirecting feedback')) return 'open_gym_redirecting_feedback';
    if (title.includes('handling pushback')) return 'open_gym_handling_pushback';
    return 'open_gym';
  }
  return sessionType || '';
};
`;

if (!content.includes('getDerivedSessionType')) {
  content = content.replace(targetHelperLocation, targetHelperLocation + helperStr);
}

const targetLogic = `    // For 1:1 coaching sessions, only allow ONE active registration at a time
    // (regardless of coaching item - you can only have one 1:1 scheduled)
    if (sessionType === 'one_on_one') {
      const existing1on1 = registrations.find(r =>
        r.sessionType === 'one_on_one' &&
        r.status !== REGISTRATION_STATUS.CANCELLED &&
        r.status !== REGISTRATION_STATUS.NO_SHOW &&
        r.status !== REGISTRATION_STATUS.CERTIFIED &&
        r.sessionId !== session.id
      );
      if (existing1on1) {
        // If switching (coachingItemId provided), cancel the old one first
        if (coachingItemId) {
          console.log('[useCoachingRegistrations] Switching 1:1 - cancelling previous:', existing1on1.sessionId);
          try {
            const oldRegRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, existing1on1.id);
            await setDoc(oldRegRef, {
              status: REGISTRATION_STATUS.CANCELLED,
              cancelledAt: serverTimestamp(),
              cancelReason: 'switched_session'
            }, { merge: true });
            // Decrement registration count on the old session (guard against negative)
            const oldSessionRef = doc(db, COACHING_SESSIONS_COLLECTION, existing1on1.sessionId);
            const oldSessionSnap = await getDoc(oldSessionRef);
            const oldCount = oldSessionSnap.data()?.registrationCount || 0;
            if (oldCount > 0) {
              await updateDoc(oldSessionRef, {
                registrationCount: increment(-1)
              });
            } else {
              await updateDoc(oldSessionRef, { registrationCount: 0 });
            }
          } catch (err) {
            // Log error but continue - the user confirmed they want to switch
            // The old registration will remain but won't block the new one
            console.warn('[useCoachingRegistrations] Could not cancel previous 1:1, continuing with new registration:', err.message);
          }
        } else {
          // No coachingItemId means they're not switching - block the registration
          console.log('[useCoachingRegistrations] Already have active 1:1 registration');
          return { 
            success: false, 
            error: 'You already have a 1:1 coaching session scheduled. Cancel or attend your current session first.'
          };
        }
      }
    }`;

const replaceLogic = `    // For exclusive coaching sessions (1:1 and Open Gyms), only allow ONE active registration at a time per sub-type
    const derivedTargetType = getDerivedSessionType(session.title || session.name, sessionType);
    const isExclusiveSession = derivedTargetType === 'one_on_one' || 
                               derivedTargetType === 'open_gym_redirecting_feedback' || 
                               derivedTargetType === 'open_gym_handling_pushback' || 
                               derivedTargetType === 'open_gym';
                               
    if (isExclusiveSession) {
      const existingExclusive = registrations.find(r => {
        if (r.status === REGISTRATION_STATUS.CANCELLED || r.status === REGISTRATION_STATUS.NO_SHOW || r.status === REGISTRATION_STATUS.CERTIFIED) return false;
        if (r.sessionId === session.id) return false;
        
        const rType = getDerivedSessionType(r.sessionTitle, r.sessionType);
        return rType === derivedTargetType;
      });
      
      if (existingExclusive) {
        // If switching (coachingItemId provided), cancel the old one first
        if (coachingItemId) {
          console.log(\`[useCoachingRegistrations] Switching \${derivedTargetType} - cancelling previous: \`, existingExclusive.sessionId);
          try {
            const oldRegRef = doc(db, COACHING_REGISTRATIONS_COLLECTION, existingExclusive.id);
            await setDoc(oldRegRef, {
              status: REGISTRATION_STATUS.CANCELLED,
              cancelledAt: serverTimestamp(),
              cancelReason: 'switched_session'
            }, { merge: true });
            
            // Decrement registration count on the old session (guard against negative)
            const oldSessionRef = doc(db, COACHING_SESSIONS_COLLECTION, existingExclusive.sessionId);
            const oldSessionSnap = await getDoc(oldSessionRef);
            const oldCount = oldSessionSnap.data()?.registrationCount || 0;
            if (oldCount > 0) {
              await updateDoc(oldSessionRef, {
                registrationCount: increment(-1)
              });
            } else {
              await updateDoc(oldSessionRef, { registrationCount: 0 });
            }
          } catch (err) {
            console.warn(\`[useCoachingRegistrations] Could not cancel previous \${derivedTargetType}, continuing with new:\`, err.message);
          }
        } else {
          // No coachingItemId means they're not switching - block the registration
          console.log(\`[useCoachingRegistrations] Already have active \${derivedTargetType} registration\`);
          return { 
            success: false, 
            error: 'You already have a session of this type scheduled. Cancel or attend your current session first.'
          };
        }
      }
    }`;

if(content.includes('// For 1:1 coaching sessions, only allow ONE active registration at a time')) {
    content = content.replace(targetLogic, replaceLogic);
    fs.writeFileSync(file, content);
    console.log("Patched useCoachingRegistrations.js safely!");
} else {
    console.log("Could not find the target logic block in hook.");
}

