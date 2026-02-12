# Ascent Phase: Engagement Strategy Discussion

**Date:** January 11, 2026  
**Status:** Draft - To be revisited later this week

---

## Context

The **Ascent** phase (formerly "Post Phase") is the indefinite, subscription-based phase after users complete the 8-week Foundation program. The goal is to keep users engaged daily with fresh content.

---

## Options Discussed

### Option 1: Rolling Weekly Themes
A curated weekly rotation that cycles through leadership topics:

```
Week 1: Communication & Influence
Week 2: Strategic Thinking
Week 3: Team Building
Week 4: Self-Mastery
Week 5: Execution & Accountability
Week 6: Coaching Others
Week 7: Conflict & Difficult Conversations
Week 8: Innovation & Change
→ Repeat with NEW content each cycle
```

**Pros:** Predictable, comprehensive coverage, easy to plan content  
**Cons:** Can feel repetitive if not refreshed

---

### Option 2: Adaptive Based on User Profile
Use their Baseline Assessment + Leader Profile to serve personalized content:

- **Low score in Delegation?** → More delegation content this week
- **High score in Communication?** → Advanced communication challenges
- **Their role is Manager?** → Manager-specific scenarios

**Pros:** Highly relevant, feels personalized  
**Cons:** Requires more content, complex logic

---

### Option 3: Event-Driven Content
Tie content to real-world leadership moments:

- **Q1:** Goal-setting, annual planning content
- **Performance review season:** Feedback & coaching content
- **Summer:** Team building, motivation during slow periods
- **Q4:** Strategic planning, year-end reflection

**Pros:** Timely, immediately applicable  
**Cons:** Less flexible, requires planning calendar

---

### Option 4: Challenge-Based Engagement ⭐ (Recommended)
**Weekly Challenges + Daily Micro-Actions:**

```
WEEKLY CHALLENGE: "Have 3 coaching conversations this week"

Daily Actions:
- Mon: Watch "Coaching Conversation Starters" (3 min video)
- Tue: Read & Rep: "The GROW Model Simplified"
- Wed: Community Session: "Share your coaching wins"
- Thu: Tool: Coaching Conversation Planner
- Fri: Reflection: "Rate your 3 conversations"
- Weekend: Celebrate/Rest
```

**Why this works:**
1. **Clear weekly goal** - Users know what they're working toward
2. **Variety of content types** - Keeps it fresh
3. **Community accountability** - Others are doing the same challenge
4. **Measurable progress** - Did they complete the challenge?
5. **Builds habits** - Daily touch points

---

## Recommended Hybrid Model

| Component | Cadence | Purpose |
|-----------|---------|---------|
| **Weekly Challenge** | Weekly | Primary engagement driver |
| **Daily Actions** | Daily | Micro-learning (2-5 min) |
| **Community Sessions** | 2x/month | Connection & accountability |
| **Deep Dive Content** | Weekly | Substantial learning (video/article) |
| **Assessments** | Monthly | Track growth, adjust content |

---

## Proposed Database Structure

```
ascent_challenges_v1/
  ├── challenge-001/
  │   ├── title: "Coaching Week"
  │   ├── description: "Have 3 coaching conversations"
  │   ├── weekTheme: "Coaching Others"
  │   ├── dailyActions: [...]
  │   └── communitySessionId: "session-xyz"
  └── challenge-002/
      └── ...

ascent_content_pools_v1/
  ├── videos/
  ├── read-reps/
  ├── tools/
  └── reflections/
```

---

## Open Questions (To Discuss)

1. **How much new content can you produce?** Weekly? Monthly?
2. **Is community engagement critical?** (Live sessions, discussions)
3. **Should challenges be competitive?** (Leaderboards, team challenges)
4. **What's the subscription model?** (Monthly, annual, tiered?)

---

## Next Steps

- [ ] Answer open questions above
- [ ] Decide on primary engagement model
- [ ] Design Ascent content admin interface
- [ ] Create initial challenge templates
- [ ] Implement content rotation logic

---

*This document will be updated after further discussion.*
