// src/components/screens/ascent/foundationContentMap.js
//
// Lead Team — curated Foundation content recommendations per conversation.
//
// Hand-curated for the demo. Each entry points to a real existing surface
// (screen + optional series/category) so users can step OUT of the journey
// into Foundation content and step back in via the JourneyResumeBar.
//
// `kind`:
//   'video'   → opens leadership-videos (filter hint via `category`)
//   'reading' → opens business-readings
//   'series'  → opens a video-series screen
//   'rep'     → conditioning rep
//   'screen'  → arbitrary screen route
//
// Add/swap real series IDs once Foundation content tagging is in place.

export const FOUNDATION_CONTENT_BY_CONVERSATION = {
  expectation: [
    { kind: 'reading', title: 'Lead Work Read: Setting Clear Expectations', screen: 'business-readings', accent: '#002E47', minutes: 6 },
    { kind: 'video',   title: 'Lead Work Video: Defining "Done"',           screen: 'leadership-videos', accent: '#002E47', minutes: 4 },
    { kind: 'rep',     title: 'Daily Rep: Expectation Reset',               screen: 'conditioning',      accent: '#002E47', minutes: 3 },
  ],
  feedback: [
    { kind: 'video',   title: 'Lead Work Video: Why Feedback Fails',       screen: 'leadership-videos',  accent: '#47A88D', minutes: 5 },
    { kind: 'reading', title: 'Lead Work Read: SBI in Practice',           screen: 'business-readings',  accent: '#47A88D', minutes: 7 },
    { kind: 'screen',  title: 'Applied Leadership: Feedback Drill',        screen: 'applied-leadership', accent: '#47A88D', minutes: 10 },
    { kind: 'rep',     title: 'Daily Rep: Catch Someone Doing Right',      screen: 'conditioning',       accent: '#47A88D', minutes: 3 },
  ],
  coaching: [
    { kind: 'reading', title: 'Lead Work Read: Ask, Don\'t Tell',          screen: 'business-readings', accent: '#E04E1B', minutes: 6 },
    { kind: 'video',   title: 'Lead Work Video: The GROW Arc',             screen: 'leadership-videos', accent: '#E04E1B', minutes: 5 },
    { kind: 'rep',     title: 'Daily Rep: One Question, Then Silence',     screen: 'conditioning',      accent: '#E04E1B', minutes: 3 },
  ],
  decision: [
    { kind: 'reading', title: 'Lead Work Read: Two-Way Doors',             screen: 'business-readings', accent: '#349881', minutes: 5 },
    { kind: 'video',   title: 'Lead Work Video: How Decisions Get Made',   screen: 'leadership-videos', accent: '#349881', minutes: 4 },
    { kind: 'screen',  title: 'Planning Hub: Decision Log',                screen: 'planning-hub',      accent: '#349881', minutes: 8 },
  ],
  'one-on-one': [
    { kind: 'reading', title: 'Lead Work Read: 1:1s That Matter',      screen: 'business-readings', accent: '#6366F1', minutes: 6 },
    { kind: 'video',   title: 'Lead Work Video: The Recurring Container', screen: 'leadership-videos', accent: '#6366F1', minutes: 4 },
    { kind: 'rep',     title: 'Daily Rep: Open with "What\'s on your mind?"', screen: 'conditioning', accent: '#6366F1', minutes: 3 },
  ],
  recognition: [
    { kind: 'reading', title: 'Lead Work Read: Recognition That Sticks',  screen: 'business-readings',  accent: '#10B981', minutes: 5 },
    { kind: 'video',   title: 'Lead Work Video: SBI for the Win',          screen: 'leadership-videos',  accent: '#10B981', minutes: 3 },
    { kind: 'rep',     title: 'Daily Rep: Catch Someone Doing It Right',   screen: 'conditioning',       accent: '#10B981', minutes: 3 },
  ],
  debate: [
    { kind: 'reading', title: 'Lead Work Read: Six Thinking Hats',        screen: 'business-readings',  accent: '#F59E0B', minutes: 7 },
    { kind: 'video',   title: 'Lead Work Video: Silence Isn\'t Agreement', screen: 'leadership-videos',  accent: '#F59E0B', minutes: 4 },
    { kind: 'rep',     title: 'Daily Rep: Ask the Contrary Question',      screen: 'conditioning',       accent: '#F59E0B', minutes: 3 },
  ],
  conflict: [
    { kind: 'reading', title: 'Lead Work Read: Conflict Radar Check',     screen: 'business-readings',  accent: '#EF4444', minutes: 6 },
    { kind: 'video',   title: 'Lead Work Video: Name It Before It Festers', screen: 'leadership-videos', accent: '#EF4444', minutes: 5 },
    { kind: 'screen',  title: 'Applied Leadership: Conflict Facilitation', screen: 'applied-leadership', accent: '#EF4444', minutes: 10 },
  ],
  'feedback-elicit': [
    { kind: 'reading', title: 'Lead Work Read: Getting Feedback Up',       screen: 'business-readings',  accent: '#8B5CF6', minutes: 5 },
    { kind: 'video',   title: 'Lead Work Video: Prompts That Get Answers', screen: 'leadership-videos',  accent: '#8B5CF6', minutes: 4 },
    { kind: 'rep',     title: 'Daily Rep: Ask the One Hard Question',      screen: 'conditioning',       accent: '#8B5CF6', minutes: 3 },
  ],
};

export const getFoundationContentForConversation = (conversationId) =>
  FOUNDATION_CONTENT_BY_CONVERSATION[conversationId] || [];
