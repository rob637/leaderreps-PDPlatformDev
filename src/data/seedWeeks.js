export const SEED_WEEKS = [
  {
    weekNumber: 1,
    title: "The Foundation",
    focus: "Leadership Identity",
    phase: "QuickStart",
    description: "Establish your core leadership identity and values.",
    startOffsetWeeks: 0,
    estimatedTimeMinutes: 60,
    skills: ["Leadership Identity", "Self-Awareness"],
    pillars: ["Lead Self"],
    difficultyLevel: "Foundation",
    content: [
      { contentItemId: "vid-001", contentItemType: "Video", contentItemLabel: "Defining Your Leadership Style", isRequiredContent: true },
      { contentItemId: "art-001", contentItemType: "Article", contentItemLabel: "The 3 Pillars of Trust", isRequiredContent: true }
    ],
    community: [
      { communityItemId: "intro-thread", communityItemType: "Forum Thread", communityItemLabel: "Introduce Yourself", recommendedWeekDay: "Monday" }
    ],
    coaching: [
      { coachingItemId: "og-001", coachingItemType: "Open Gym", coachingItemLabel: "Weekly Kickoff", isOptionalCoachingItem: true }
    ],
    reps: [
      { repId: "rep-w1-1", repType: "Daily", repLabel: "Write down 3 leadership wins from yesterday", isRequired: true },
      { repId: "rep-w1-2", repType: "Daily", repLabel: "Identify one person to recognize today", isRequired: true }
    ],
    reflectionPrompt: "What is one core value that defines your leadership style?",
    isDraft: false
  },
  {
    weekNumber: 2,
    title: "Building Trust",
    focus: "Trust",
    phase: "QuickStart",
    description: "Learn the mechanics of trust and how to build it rapidly.",
    startOffsetWeeks: 1,
    estimatedTimeMinutes: 75,
    skills: ["Trust", "Vulnerability-Based Trust"],
    pillars: ["Lead People"],
    difficultyLevel: "Foundation",
    content: [
      { contentItemId: "vid-002", contentItemType: "Video", contentItemLabel: "The Trust Equation", isRequiredContent: true },
      { contentItemId: "wkt-001", contentItemType: "Workout", contentItemLabel: "Trust Audit", isRequiredContent: true }
    ],
    community: [
      { communityItemId: "trust-challenge", communityItemType: "Leader Circle", communityItemLabel: "Trust Challenge Share", recommendedWeekDay: "Wednesday" }
    ],
    coaching: [],
    reps: [
      { repId: "rep-w2-1", repType: "Daily", repLabel: "Share one vulnerable moment with a team member", isRequired: true },
      { repId: "rep-w2-2", repType: "Daily", repLabel: "Follow through on one small commitment", isRequired: true }
    ],
    reflectionPrompt: "Identify one relationship where trust needs to be rebuilt. What is your first step?",
    isDraft: false
  },
  {
    weekNumber: 3,
    title: "Effective Communication",
    focus: "Feedback",
    phase: "QuickStart",
    description: "Master the art of giving and receiving feedback.",
    startOffsetWeeks: 2,
    estimatedTimeMinutes: 90,
    skills: ["Feedback", "Communication"],
    pillars: ["Lead People"],
    difficultyLevel: "Intermediate",
    content: [
      { contentItemId: "mod-001", contentItemType: "Module", contentItemLabel: "Radical Candor Basics", isRequiredContent: true }
    ],
    community: [],
    coaching: [
      { coachingItemId: "roleplay-feedback", coachingItemType: "AI Coach", coachingItemLabel: "Feedback Roleplay", isOptionalCoachingItem: false }
    ],
    reps: [
      { repId: "rep-w3-1", repType: "Daily", repLabel: "Give one piece of specific positive feedback", isRequired: true },
      { repId: "rep-w3-2", repType: "Daily", repLabel: "Ask for feedback from someone on your team", isRequired: true }
    ],
    reflectionPrompt: "When was the last time you held back feedback? Why?",
    isDraft: false
  },
  {
    weekNumber: 4,
    title: "Delegation Mastery",
    focus: "Delegation",
    phase: "Spaced Learning",
    description: "Stop doing everything yourself. Learn to delegate effectively.",
    startOffsetWeeks: 3,
    estimatedTimeMinutes: 60,
    skills: ["Delegation", "Accountability"],
    pillars: ["Lead Work"],
    difficultyLevel: "Intermediate",
    content: [
      { contentItemId: "vid-003", contentItemType: "Video", contentItemLabel: "The 6 Levels of Delegation", isRequiredContent: true }
    ],
    community: [
      { communityItemId: "del-discussion", communityItemType: "Forum Thread", communityItemLabel: "Delegation Wins & Fails", recommendedWeekDay: "Friday" }
    ],
    coaching: [],
    reps: [
      { repId: "rep-w4-1", repType: "Daily", repLabel: "Delegate one task you normally do yourself", isRequired: true },
      { repId: "rep-w4-2", repType: "Daily", repLabel: "Check in on a delegated task (without micromanaging)", isRequired: true }
    ],
    reflectionPrompt: "What is one task you did this week that you should have delegated?",
    isDraft: false
  },
  {
    weekNumber: 5,
    title: "Strategic Thinking",
    focus: "Strategic Thinking",
    phase: "Spaced Learning",
    description: "Shift from reactive firefighting to proactive strategy.",
    startOffsetWeeks: 4,
    estimatedTimeMinutes: 90,
    skills: ["Strategic Thinking", "Decision Making"],
    pillars: ["Lead Work"],
    difficultyLevel: "Advanced",
    content: [
      { contentItemId: "art-002", contentItemType: "Article", contentItemLabel: "The Eisenhower Matrix", isRequiredContent: true },
      { contentItemId: "wkt-002", contentItemType: "Workout", contentItemLabel: "Strategic Plan Draft", isRequiredContent: true }
    ],
    community: [],
    coaching: [
      { coachingItemId: "strat-review", coachingItemType: "Group Coaching", coachingItemLabel: "Strategy Review", isOptionalCoachingItem: true }
    ],
    reps: [
      { repId: "rep-w5-1", repType: "Daily", repLabel: "Block 15 minutes for strategic thinking", isRequired: true },
      { repId: "rep-w5-2", repType: "Daily", repLabel: "Identify one urgent-but-not-important task to eliminate", isRequired: true }
    ],
    reflectionPrompt: "How much time did you spend on strategy vs. tactics this week?",
    isDraft: false
  },
  {
    weekNumber: 6,
    title: "High Performance Teams",
    focus: "Coaching",
    phase: "Clear Performance",
    description: "Unlock the potential of your team through coaching.",
    startOffsetWeeks: 5,
    estimatedTimeMinutes: 75,
    skills: ["Coaching", "Team Dynamics"],
    pillars: ["Lead People"],
    difficultyLevel: "Advanced",
    content: [
      { contentItemId: "vid-004", contentItemType: "Video", contentItemLabel: "The GROW Model", isRequiredContent: true }
    ],
    community: [
      { communityItemId: "coach-circle", communityItemType: "Leader Circle", communityItemLabel: "Coaching Practice", recommendedWeekDay: "Thursday" }
    ],
    coaching: [],
    reps: [
      { repId: "rep-w6-1", repType: "Daily", repLabel: "Ask a coaching question instead of giving an answer", isRequired: true },
      { repId: "rep-w6-2", repType: "Daily", repLabel: "Observe one team member's strengths in action", isRequired: true }
    ],
    reflectionPrompt: "Who on your team has the most untapped potential?",
    isDraft: false
  },
  {
    weekNumber: 7,
    title: "Conflict Resolution",
    focus: "Conflict",
    phase: "Clear Performance",
    description: "Navigate difficult conversations and resolve conflict.",
    startOffsetWeeks: 6,
    estimatedTimeMinutes: 60,
    skills: ["Conflict", "Emotional Intelligence"],
    pillars: ["Lead People"],
    difficultyLevel: "Intermediate",
    content: [
      { contentItemId: "mod-002", contentItemType: "Module", contentItemLabel: "Crucial Conversations", isRequiredContent: true }
    ],
    community: [],
    coaching: [
      { coachingItemId: "conflict-sim", coachingItemType: "AI Coach", coachingItemLabel: "Conflict Simulation", isOptionalCoachingItem: false }
    ],
    reps: [
      { repId: "rep-w7-1", repType: "Daily", repLabel: "Address one small tension before it grows", isRequired: true },
      { repId: "rep-w7-2", repType: "Daily", repLabel: "Practice active listening for 5 minutes", isRequired: true }
    ],
    reflectionPrompt: "What conflict are you currently avoiding?",
    isDraft: false
  },
  {
    weekNumber: 8,
    title: "Execution & Accountability",
    focus: "Accountability",
    phase: "Impact",
    description: "Drive results through clear accountability.",
    startOffsetWeeks: 7,
    estimatedTimeMinutes: 60,
    skills: ["Accountability", "Execution"],
    pillars: ["Lead Work"],
    difficultyLevel: "Advanced",
    content: [
      { contentItemId: "art-003", contentItemType: "Article", contentItemLabel: "The 4 Disciplines of Execution", isRequiredContent: true }
    ],
    community: [
      { communityItemId: "exec-share", communityItemType: "Forum Thread", communityItemLabel: "Execution Blockers", recommendedWeekDay: "Tuesday" }
    ],
    coaching: [],
    reps: [
      { repId: "rep-w8-1", repType: "Daily", repLabel: "Review your scoreboard metrics", isRequired: true },
      { repId: "rep-w8-2", repType: "Daily", repLabel: "Hold one accountability conversation", isRequired: true }
    ],
    reflectionPrompt: "Where is execution slipping in your team right now?",
    isDraft: false
  }
];
