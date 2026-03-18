const fs = require('fs');

// ==== 1. Patch CoachingHub.jsx ====
const hubFile = 'src/components/screens/CoachingHub.jsx';
let hubContent = fs.readFileSync(hubFile, 'utf8');

// A. Insert the helper
const helperStrHub = `
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

if (!hubContent.includes('getDerivedSessionType')) {
    hubContent = hubContent.replace(`import { NoWidgetsEnabled, TabButton } from '../ui';`, `import { NoWidgetsEnabled, TabButton } from '../ui';\n` + helperStrHub);
}

// B. Replace existing1on1Registration with a mapping of all active exclusive registrations
const searchHub1 = `  // Find existing 1:1 registration (for Switch UX)
  const existing1on1Registration = useMemo(() => {
    if (!registrations) return null;
    return registrations.find(r => 
      (r.sessionType === 'one_on_one' || r.sessionType === '1:1') &&
      r.status !== 'cancelled' &&
      r.status !== 'no_show' &&
      r.status !== 'certified'
    );
  }, [registrations]);

  // Get the session details for the existing 1:1
  const existing1on1Session = useMemo(() => {
    if (!existing1on1Registration) return null;
    return sessions.find(s => s.id === existing1on1Registration.sessionId);
  }, [existing1on1Registration, sessions]);`;

const replaceHub1 = `  // Find existing exclusive registrations (for Switch UX)
  const existingExclusiveRegistrations = useMemo(() => {
    if (!registrations) return {};
    
    const active = registrations.filter(r => 
      r.status !== 'cancelled' &&
      r.status !== 'no_show' &&
      r.status !== 'certified'
    );
    
    const map = {};
    active.forEach(r => {
      const derivedType = getDerivedSessionType(r.sessionTitle, r.sessionType);
      if (['one_on_one', '1:1', 'open_gym_redirecting_feedback', 'open_gym_handling_pushback', 'open_gym'].includes(derivedType)) {
        map[derivedType] = r;
      }
    });
    
    // Normalize '1:1'
    if (map['1:1']) map['one_on_one'] = map['1:1'];
    return map;
  }, [registrations]);`;

hubContent = hubContent.replace(searchHub1, replaceHub1);

// C. Replace handleRegister confirmation
const searchHub2 = `    // For 1:1 coaching, check if user already has a registration
    const is1on1 = session.sessionType === 'one_on_one' || session.sessionType === '1:1';
    const additionalData = {};
    
    if (is1on1 && existing1on1Registration && existing1on1Registration.sessionId !== session.id) {
      // User already has a 1:1 - show confirmation to switch
      // Add T12:00:00 to ensure local timezone interpretation
      const existingTime = existing1on1Session?.time || 'scheduled';
      const existingDate = existing1on1Session?.date 
        ? new Date(existing1on1Session.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : '';
      const newTime = session.time || 'scheduled';
      const newDate = session.date 
        ? new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : '';
      
      const confirmed = window.confirm(
        \`Switch your 1:1 coaching session?\\n\\n\` +
        \`Current: \${existingDate} at \${existingTime}\\n\` +
        \`New: \${newDate} at \${newTime}\\n\\n\` +
        \`Click OK to switch, or Cancel to keep your current session.\`
      );
      
      if (!confirmed) return;
      
      // User confirmed - proceed with switch
      additionalData.coachingItemId = targetCoachingItemId || \`milestone-\${currentMilestone}-coaching-one_on_one\`;
    } else if (is1on1) {
      // First 1:1 registration
      additionalData.coachingItemId = targetCoachingItemId || \`milestone-\${currentMilestone}-coaching-one_on_one\`;
    }`;

const replaceHub2 = `    // Check if user already has a registration for an exclusive session
    const targetDerivedType = getDerivedSessionType(session.title || session.name, session.sessionType);
    const isExclusiveSession = ['one_on_one', '1:1', 'open_gym_redirecting_feedback', 'open_gym_handling_pushback', 'open_gym'].includes(targetDerivedType);
    const normalizedTargetType = targetDerivedType === '1:1' ? 'one_on_one' : targetDerivedType;
    
    const existingRegistration = existingExclusiveRegistrations[normalizedTargetType];
    const additionalData = {};
    
    if (isExclusiveSession && existingRegistration && existingRegistration.sessionId !== session.id) {
      // User already has a session of this type - show confirmation to switch
      const existingSessionDetails = sessions.find(s => s.id === existingRegistration.sessionId);
      
      const existingTime = existingSessionDetails?.time || 'scheduled';
      const existingDate = existingSessionDetails?.date 
        ? new Date(existingSessionDetails.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : '';
      const newTime = session.time || 'scheduled';
      const newDate = session.date 
        ? new Date(session.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : '';
        
      const sessionLabel = targetDerivedType === 'one_on_one' ? '1:1 coaching' : 'Open Gym';
      
      const confirmed = window.confirm(
        \`Switch your \${sessionLabel} session?\\n\\n\` +
        \`Current: \${existingDate} at \${existingTime}\\n\` +
        \`New: \${newDate} at \${newTime}\\n\\n\` +
        \`Click OK to switch, or Cancel to keep your current session.\`
      );
      
      if (!confirmed) return;
      
      // User confirmed - proceed with switch
      additionalData.coachingItemId = targetCoachingItemId || existingRegistration.coachingItemId || \`milestone-\${currentMilestone}-coaching-\${session.sessionType}\`;
    } else if (isExclusiveSession) {
      // First registration
      additionalData.coachingItemId = targetCoachingItemId || \`milestone-\${currentMilestone}-coaching-\${session.sessionType}\`;
    }`;
    
hubContent = hubContent.replace(searchHub2, replaceHub2);


// D. Change the existing1on1SessionId prop down below
const searchHub3 = `    // For Switch UX - existing 1:1 info
    existing1on1SessionId: existing1on1Registration?.sessionId || null`;
const replaceHub3 = `    // For Switch UX - existing exclusive session info
    existingExclusiveRegistrations`;
hubContent = hubContent.replace(searchHub3, replaceHub3);

// Replace the success message
const searchHub4 = `    // Success feedback
    if (is1on1 && existing1on1Registration) {
      alert('Session switched! You will receive a confirmation email.');
    }`;
const replaceHub4 = `    // Success feedback
    if (isExclusiveSession && existingRegistration) {
      alert('Session switched! You will receive a confirmation email.');
    }`;
hubContent = hubContent.replace(searchHub4, replaceHub4);

fs.writeFileSync(hubFile, hubContent);
console.log("Patched CoachingHub.jsx!");



// ==== 2. Patch CoachingUpcomingSessionsWidget.jsx ====

const widgetFile = 'src/components/widgets/CoachingUpcomingSessionsWidget.jsx';
let widgetContent = fs.readFileSync(widgetFile, 'utf8');

// Update props
const searchWidget1 = `    setSessionTypeFilter: externalSetFilter,
    existing1on1SessionId = null  // For Switch UX
  } = scope;`;
const replaceWidget1 = `    setSessionTypeFilter: externalSetFilter,
    existingExclusiveRegistrations = {}  // For Switch UX
  } = scope;`;
widgetContent = widgetContent.replace(searchWidget1, replaceWidget1);
// also in DaySessionsModal
const searchWidget1_1 = `existing1on1SessionId }) => {`;
const replaceWidget1_1 = `existingExclusiveRegistrations }) => {`;
widgetContent = widgetContent.replace(searchWidget1_1, replaceWidget1_1);


const searchWidget2 = `  // Determine button text for 1:1 sessions
  const is1on1 = session.sessionType === 'one_on_one' || session.sessionType === '1:1';
  const buttonText = is1on1 && showSwitch ? 'Switch' : 'Register';
  const buttonColor = is1on1 && showSwitch 
    ? 'bg-amber-500 hover:bg-amber-600' 
    : 'bg-corporate-teal hover:bg-teal-700';`;

const replaceWidget2 = `  // Determine button text for exclusive sessions switching
  const buttonText = showSwitch ? 'Switch' : 'Register';
  const buttonColor = showSwitch 
    ? 'bg-amber-500 hover:bg-amber-600' 
    : 'bg-corporate-teal hover:bg-teal-700';`;
widgetContent = widgetContent.replace(searchWidget2, replaceWidget2);


const searchWidget3 = `              // Show "Switch" for 1:1 sessions when user already has a different 1:1 registered
              const is1on1 = session.sessionType === 'one_on_one' || session.sessionType === '1:1';
              const showSwitch = is1on1 && existing1on1SessionId && existing1on1SessionId !== session.id;`;
const replaceWidget3 = `              // Show "Switch" for exclusive sessions when user already has a different session of the same type registered
              const derivedTargetType = getDerivedSessionType(session);
              const normalizedTargetType = derivedTargetType === '1:1' ? 'one_on_one' : derivedTargetType;
              const isExclusiveSession = ['one_on_one', 'open_gym_redirecting_feedback', 'open_gym_handling_pushback', 'open_gym'].includes(normalizedTargetType);
              
              const existingReg = isExclusiveSession ? existingExclusiveRegistrations[normalizedTargetType] : null;
              const showSwitch = isExclusiveSession && existingReg && existingReg.sessionId !== session.id;`;
widgetContent = widgetContent.replace(searchWidget3, replaceWidget3);


const searchWidget4 = `            existing1on1SessionId={existing1on1SessionId}`;
const replaceWidget4 = `            existingExclusiveRegistrations={existingExclusiveRegistrations}`;
widgetContent = widgetContent.replace(searchWidget4, replaceWidget4);


// We need to also patch the day sessions modal logic inside DaySessionsModal!
const searchWidget5 = `            const is1on1 = session.sessionType === 'one_on_one' || session.sessionType === '1:1';
            const showSwitch = is1on1 && existing1on1SessionId && existing1on1SessionId !== session.id;`;
const replaceWidget5 = `            const derivedTargetType = getDerivedSessionType(session);
            const normalizedTargetType = derivedTargetType === '1:1' ? 'one_on_one' : derivedTargetType;
            const isExclusiveSession = ['one_on_one', 'open_gym_redirecting_feedback', 'open_gym_handling_pushback', 'open_gym'].includes(normalizedTargetType);
            const existingReg = isExclusiveSession ? (existingExclusiveRegistrations || {})[normalizedTargetType] : null;
            const showSwitch = isExclusiveSession && existingReg && existingReg.sessionId !== session.id;`;
if (widgetContent.includes(searchWidget5)) {
    widgetContent = widgetContent.replace(searchWidget5, replaceWidget5);
}

fs.writeFileSync(widgetFile, widgetContent);
console.log("Patched CoachingUpcomingSessionsWidget.jsx!");

