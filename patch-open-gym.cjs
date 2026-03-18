const fs = require('fs');
const filePath = 'src/components/widgets/ThisWeeksActionsWidget.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. First milestoneNames map
code = code.replace(
  `      const milestoneNames = {
        1: 'Deliberate Practice',
        2: '1:1 Coaching',
        3: 'Open Gym: Feedback',
        4: 'Open Gym: Pushback',
        5: 'Graduation'
      };`,
  `      const milestoneNames = {
        1: 'Deliberate Practice',
        2: '1:1 Coaching',
        3: 'Open Gym: Redirecting Feedback',
        4: 'Open Gym: Handling Pushback',
        5: 'Graduation'
      };`
);

// 2. MILESTONE_SESSION_LABELS map
code = code.replace(
  `      const MILESTONE_SESSION_LABELS = {
        2: 'Attend 1:1 Coaching',
        3: 'Session 3: Open Gym Feedback',
        4: 'Session 4: Open Gym Pushback',
        5: 'Session 5: Graduation'
      };`,
  `      const MILESTONE_SESSION_LABELS = {
        2: 'Attend 1:1 Coaching',
        3: 'Session 3: Attend Open Gym Redirecting Feedback',
        4: 'Session 4: Attend Open Gym Handling Pushback',
        5: 'Session 5: Graduation'
      };`
);

// 3. Dynamic labels for coaching scheduling
code = code.replace(
  `      if (milestoneDoc?.coachingSessionTypes && milestoneDoc.coachingSessionTypes.length > 0) {
        coachingActions = milestoneDoc.coachingSessionTypes.map((sessionType) => {
          const typeInfo = COACHING_SESSION_LABELS[sessionType] || { label: 'Coaching Session', description: '', icon: '🎯' };
          return {
            id: \`milestone-\${displayMilestone}-coaching-\${sessionType}\`,
            type: 'coaching',
            displayType: 'coaching',
            sessionType: sessionType, // Pass to SessionPickerModal for filtering
            label: typeInfo.label,`,
  `      if (milestoneDoc?.coachingSessionTypes && milestoneDoc.coachingSessionTypes.length > 0) {
        coachingActions = milestoneDoc.coachingSessionTypes.map((sessionType) => {
          const typeInfo = COACHING_SESSION_LABELS[sessionType] || { label: 'Coaching Session', description: '', icon: '🎯' };
          
          let actionLabel = typeInfo.label;
          if (sessionType === 'open_gym' || sessionType === 'OPEN_GYM') {
            if (displayMilestone === 2) actionLabel = 'Schedule Open Gym: Redirecting Feedback';
            if (displayMilestone === 3) actionLabel = 'Schedule Open Gym: Handling Pushback';
          }
          
          return {
            id: \`milestone-\${displayMilestone}-coaching-\${sessionType}\`,
            type: 'coaching',
            displayType: 'coaching',
            sessionType: sessionType, // Pass to SessionPickerModal for filtering
            label: actionLabel,`
);

// 4. Second milestoneNames map
code = code.replace(
  `    const milestoneNames = {
      1: 'Deliberate Practice',
      2: '1:1 Coaching',
      3: 'Open Gym: Feedback',
      4: 'Open Gym: Pushback',
      5: 'Graduation'
    };`,
  `    const milestoneNames = {
      1: 'Deliberate Practice',
      2: '1:1 Coaching',
      3: 'Open Gym: Redirecting Feedback',
      4: 'Open Gym: Handling Pushback',
      5: 'Graduation'
    };`
);

fs.writeFileSync(filePath, code);
console.log('Patched ThisWeeksActionsWidget.jsx');
