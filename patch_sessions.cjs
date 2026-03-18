const fs = require('fs');
const file = 'src/components/widgets/CoachingUpcomingSessionsWidget.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add new definitions to SESSION_TYPE_CONFIG
const configTarget = `    calendarColor: 'bg-blue-100 text-blue-700'
  },
  leader_circle: {`;
const configReplace = `    calendarColor: 'bg-blue-100 text-blue-700'
  },
  open_gym_redirecting_feedback: {
    label: 'Open Gym - Redirecting Feedback',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    accent: 'border-l-orange-500',
    calendarColor: 'bg-blue-100 text-blue-700'
  },
  open_gym_handling_pushback: {
    label: 'Open Gym - Handling Pushback',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    accent: 'border-l-orange-500',
    calendarColor: 'bg-blue-100 text-blue-700'
  },
  leader_circle: {`;

content = content.replace(configTarget, configReplace);

if (!content.includes('open_gym_redirecting_feedback')) {
   console.log("Failed to insert new config");
   process.exit(1);
}

// 2. Add derivedType helper before component
const helperAddStr = `// Session Card Component`;
const helperReplacement = `// Helper to get derived session type for Open Gym variants
const getDerivedSessionType = (session) => {
  if (session?.sessionType === 'open_gym') {
    const title = (session.title || '').toLowerCase();
    if (title.includes('redirecting feedback')) return 'open_gym_redirecting_feedback';
    if (title.includes('handling pushback')) return 'open_gym_handling_pushback';
    return 'open_gym';
  }
  return session?.sessionType || 'workshop';
};

// Session Card Component`;
content = content.replace(helperAddStr, helperReplacement);


// 3. Update displaySessions useMemo
const filterTarget = `  const displaySessions = useMemo(() => {
    if (typeFilter === 'all') return allUpcomingSessions;
    return allUpcomingSessions.filter(s => s.sessionType === typeFilter);
  }, [allUpcomingSessions, typeFilter]);`;
  
const filterReplacement = `  const displaySessions = useMemo(() => {
    if (typeFilter === 'all') return allUpcomingSessions;
    return allUpcomingSessions.filter(s => {
      // Allow fallback: if typeFilter is 'open_gym', match all open gyms.
      // But if we have specific filters selected, only match those.
      const derivedType = getDerivedSessionType(s);
      if (typeFilter === 'open_gym') return s.sessionType === 'open_gym';
      return derivedType === typeFilter || s.sessionType === typeFilter;
    });
  }, [allUpcomingSessions, typeFilter]);`;

content = content.replace(filterTarget, filterReplacement);

// 4. Update availableTypes useMemo
const typesTarget = `  const availableTypes = useMemo(() => {
    const types = new Set(allUpcomingSessions.map(s => s.sessionType).filter(Boolean));
    return Array.from(types);
  }, [allUpcomingSessions]);`;

const typesReplacement = `  const availableTypes = useMemo(() => {
    const types = new Set(allUpcomingSessions.map(s => getDerivedSessionType(s)).filter(Boolean));
    return Array.from(types).sort(); // simple string sort puts 1:1 first, then open gym
  }, [allUpcomingSessions]);`;

content = content.replace(typesTarget, typesReplacement);

// 5. Update counts in filter rendering
const countTarget = `                const count = allUpcomingSessions.filter(s => s.sessionType === type).length;`;
const countReplacement = `                const count = allUpcomingSessions.filter(s => {
                  if (type === 'open_gym') return s.sessionType === 'open_gym';
                  return getDerivedSessionType(s) === type || s.sessionType === type;
                }).length;`;

content = content.replace(countTarget, countReplacement);


fs.writeFileSync(file, content);
console.log("Patched CoachingUpcomingSessionsWidget.jsx successfully!");
