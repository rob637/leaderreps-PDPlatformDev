// src/data/reppy/curriculum.js
// Reppy AI Leadership Coach - Complete Curriculum
// 52 weeks of content, SELF-PACED (not time-based)
// Each "week" has 5 sessions (~10 min each)
// User advances through sessions at their own pace

/**
 * REPPY CURRICULUM STRUCTURE
 * 
 * 4 Phases:
 * 1. FOUNDATION (Weeks 1-13) - Core leadership principles
 * 2. GROWTH (Weeks 14-26) - Building on foundations
 * 3. MASTERY (Weeks 27-39) - Advanced leadership skills
 * 4. LEGACY (Weeks 40-52) - Impact and sustainability
 * 
 * Each Week:
 * - Theme and learning objectives
 * - 5 daily sessions
 * - Recommended resources (books, videos)
 * - Practice exercises
 * 
 * Each Session (~10 min):
 * - Check-in question
 * - Micro-learning content
 * - Today's practice/experiment
 * - Reflection prompt
 */

export const REPPY_PHASES = {
  foundation: {
    id: 'foundation',
    name: 'Foundation',
    description: 'Core leadership principles and self-awareness',
    weeks: [1, 13],
    color: '#0D9488', // teal
    icon: 'Layers'
  },
  growth: {
    id: 'growth', 
    name: 'Growth',
    description: 'Building relationships and influence',
    weeks: [14, 26],
    color: '#7C3AED', // violet
    icon: 'TrendingUp'
  },
  mastery: {
    id: 'mastery',
    name: 'Mastery',
    description: 'Advanced leadership and team dynamics',
    weeks: [27, 39],
    color: '#DC2626', // red
    icon: 'Target'
  },
  legacy: {
    id: 'legacy',
    name: 'Legacy',
    description: 'Sustainable impact and developing others',
    weeks: [40, 52],
    color: '#F59E0B', // amber
    icon: 'Award'
  }
};

// Helper to get phase for a week number
export const getPhaseForWeek = (weekNum) => {
  if (weekNum <= 13) return REPPY_PHASES.foundation;
  if (weekNum <= 26) return REPPY_PHASES.growth;
  if (weekNum <= 39) return REPPY_PHASES.mastery;
  return REPPY_PHASES.legacy;
};

/**
 * CURRICULUM DATA
 * Organized by week, each week has 5 sessions
 * This is the first 13 weeks (Foundation phase) - more to follow
 */
export const REPPY_CURRICULUM = {
  // ============================================
  // PHASE 1: FOUNDATION (Weeks 1-13)
  // ============================================
  
  1: {
    week: 1,
    theme: 'The Leadership Mindset',
    objective: 'Understand what leadership really means and assess your starting point',
    keyInsight: 'Leadership is not a position—it\'s a choice to influence and serve others.',
    resources: [
      { type: 'book', title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', key: 'Begin with the end in mind' },
      { type: 'video', title: 'What Makes a Great Leader?', url: 'https://www.youtube.com/watch?v=ojpTpPiEj-Y', duration: '8 min' }
    ],
    sessions: [
      {
        day: 1,
        title: 'What is Leadership?',
        checkIn: 'On a scale of 1-10, how confident do you feel as a leader today?',
        content: `Leadership isn't about titles or corner offices. It's about **influence**—the ability to guide, inspire, and bring out the best in others.

Think about the best leader you've ever worked with. Chances are, what made them great wasn't their authority, but how they made you *feel*: seen, valued, capable of more than you thought possible.

**Key insight:** Every interaction is a leadership moment. Whether you're leading a team of 50 or simply influencing a colleague, you're practicing leadership.`,
        practice: 'Today, notice one interaction where you have the opportunity to influence someone positively. It could be a meeting, a conversation, or even an email. Be intentional about how you show up.',
        reflection: 'What did you notice about your leadership moments today?'
      },
      {
        day: 2,
        title: 'Your Leadership Why',
        checkIn: 'What motivated you to work on your leadership skills?',
        content: `Simon Sinek famously said, "People don't buy what you do; they buy why you do it." The same applies to leadership.

Your **leadership why** is your deeper purpose—the reason you want to lead beyond the obvious (career growth, more money, etc.). 

Leaders with a clear "why" are:
- More resilient during challenges
- More authentic and trustworthy
- More inspiring to their teams

**Reflection starters:**
- Who do you want to become as a leader?
- What impact do you want to have on others?
- What problem in the world do you want to solve?`,
        practice: 'Write a first draft of your leadership purpose statement: "I lead because..." Don\'t worry about making it perfect—this will evolve.',
        reflection: 'What did you discover about your "why" today?'
      },
      {
        day: 3,
        title: 'Self-Awareness: The Foundation',
        checkIn: 'How would your team describe your leadership style in three words?',
        content: `Research shows that **self-awareness** is the #1 predictor of leadership success. Yet only 10-15% of people are truly self-aware (Tasha Eurich).

Self-awareness has two dimensions:
1. **Internal** - Understanding your values, emotions, strengths, and blind spots
2. **External** - Understanding how others perceive you

The gap between how we see ourselves and how others see us is where leadership problems hide.

**The Johari Window:**
- Open Area: What you and others know about you
- Blind Spot: What others see that you don't
- Hidden Area: What you know but hide from others
- Unknown: Undiscovered potential`,
        practice: 'Ask one trusted person: "What\'s one thing I do well as a leader, and one thing I could improve?" Listen without defending.',
        reflection: 'What feedback did you receive? How did it feel to ask?'
      },
      {
        day: 4,
        title: 'Your Leadership Strengths',
        checkIn: 'What leadership task energizes you the most?',
        content: `The best leaders don't try to be good at everything. They **double down on their strengths** while managing their weaknesses.

Gallup research shows that people who use their strengths daily are:
- 6x more likely to be engaged at work
- 3x more likely to report excellent quality of life
- More productive, creative, and resilient

**Common leadership strengths:**
- Strategic thinking
- Building relationships  
- Executing and delivering
- Influencing and persuading
- Developing others
- Creating clarity

Your strengths are where you naturally excel AND feel energized. If you're good at something but it drains you, that's a skill, not a strength.`,
        practice: 'List 3 things you\'re naturally good at as a leader. For each, recall a specific moment when that strength was on display.',
        reflection: 'Which strength do you want to leverage more intentionally?'
      },
      {
        day: 5,
        title: 'Week 1 Integration',
        checkIn: 'What\'s one thing you learned about yourself this week?',
        content: `**Week 1 Recap: The Leadership Mindset**

This week you explored:
✓ Leadership as influence, not position
✓ Your leadership "why" 
✓ The power of self-awareness
✓ Your natural leadership strengths

**Key takeaway:** Leadership development starts from the inside out. Before you can lead others effectively, you must understand yourself—your motivations, your strengths, and your blind spots.

**Quote to carry forward:**
*"The first and best victory is to conquer self."* — Plato`,
        practice: 'Set one leadership intention for the coming week. What\'s one thing you\'ll do differently based on what you learned?',
        reflection: 'How has your understanding of leadership shifted this week?'
      }
    ]
  },

  2: {
    week: 2,
    theme: 'Emotional Intelligence',
    objective: 'Develop the emotional skills that separate good leaders from great ones',
    keyInsight: 'EQ is twice as important as IQ for leadership success.',
    resources: [
      { type: 'book', title: 'Emotional Intelligence 2.0', author: 'Travis Bradberry', key: 'EQ can be developed with practice' },
      { type: 'video', title: 'The Power of Emotional Intelligence', url: 'https://www.youtube.com/watch?v=Y7m9eNoB3NU', duration: '10 min' }
    ],
    sessions: [
      {
        day: 1,
        title: 'What is Emotional Intelligence?',
        checkIn: 'How aware are you of your emotions throughout the day?',
        content: `**Emotional Intelligence (EQ)** is your ability to recognize, understand, and manage your own emotions—and to recognize, understand, and influence the emotions of others.

Daniel Goleman's research shows EQ has **4 components:**

1. **Self-Awareness** - Recognizing your emotions as they happen
2. **Self-Management** - Controlling impulses and managing your emotional state
3. **Social Awareness** - Reading others' emotions and the dynamics of groups
4. **Relationship Management** - Using awareness to build positive relationships

Why it matters: Studies show EQ accounts for 58% of job performance and is the strongest predictor of leadership success.

The good news? Unlike IQ, **EQ can be developed** with intentional practice.`,
        practice: 'Set 3 "emotion alarms" on your phone today. When they go off, pause and name your current emotion. Just notice—don\'t judge.',
        reflection: 'What patterns did you notice in your emotional states today?'
      },
      {
        day: 2,
        title: 'The Emotional Hijack',
        checkIn: 'Think of a recent time you reacted emotionally. What triggered it?',
        content: `Have you ever said something in anger you immediately regretted? That's an **amygdala hijack**—when your emotional brain takes over before your rational brain can intervene.

**The science:** Your amygdala (emotional center) processes threats in 12 milliseconds. Your prefrontal cortex (rational thinking) takes 25 milliseconds. Emotions literally beat logic to the punch.

**The 6-second rule:** It takes about 6 seconds for the chemical surge of an emotional reaction to pass through your system. If you can pause for 6 seconds, you give your rational brain time to catch up.

**Hijack warning signs:**
- Tightness in chest or stomach
- Racing heart
- Feeling hot or flushed
- Tunnel vision
- Thoughts of "I can't believe they..."`,
        practice: 'When you feel triggered today, try the 6-second pause: Take a deep breath, count to 6, then choose your response. Notice the difference.',
        reflection: 'Were you able to catch an emotional reaction today? What did you notice?'
      },
      {
        day: 3,
        title: 'Reading the Room',
        checkIn: 'How tuned in are you to others\' emotions in meetings?',
        content: `**Social awareness** is your ability to read the emotional currents in a room—to sense what others are feeling even when they don't say it directly.

Great leaders have a "sixth sense" for group dynamics. They notice:
- Who's engaged vs. checked out
- When energy shifts (up or down)
- Unspoken tensions or alliances
- What's NOT being said

**How to develop it:**
1. **Observe before speaking** - Watch body language, facial expressions, tone
2. **Listen to understand** - Not just to respond
3. **Check your assumptions** - "I'm sensing some hesitation—am I reading that right?"
4. **Notice patterns** - Who speaks? Who stays silent? Who looks at whom?

The meta-skill: Getting curious about others' inner experience.`,
        practice: 'In your next meeting, spend the first 5 minutes just observing. Who seems energized? Disengaged? Anxious? What dynamics do you notice?',
        reflection: 'What did you observe about the emotional dynamics around you today?'
      },
      {
        day: 4,
        title: 'Empathy in Action',
        checkIn: 'When did you last truly put yourself in someone else\'s shoes?',
        content: `**Empathy** is the ability to understand and share the feelings of another. It's not sympathy (feeling sorry for someone)—it's actually *feeling with* them.

Brené Brown distinguishes:
- **Sympathy:** "That's too bad" (distance)
- **Empathy:** "I've been there. This is hard." (connection)

**Three types of empathy:**
1. **Cognitive** - Understanding someone's perspective intellectually
2. **Emotional** - Actually feeling what they feel
3. **Compassionate** - Understanding + feeling + being moved to help

**Empathy blockers:**
- Rushing to fix or give advice
- Making it about you ("I know exactly how you feel, when I...")
- Minimizing ("It's not that bad")
- Silver lining ("At least...")

**Empathy builders:**
- "Tell me more..."
- "That sounds really difficult."
- "What do you need right now?"
- Comfortable silence`,
        practice: 'Have a conversation today where you focus 100% on understanding the other person\'s experience. Don\'t give advice—just listen and reflect back.',
        reflection: 'How did it feel to listen with empathy? What did you learn?'
      },
      {
        day: 5,
        title: 'Week 2 Integration',
        checkIn: 'What\'s one EQ skill you want to strengthen?',
        content: `**Week 2 Recap: Emotional Intelligence**

This week you explored:
✓ The 4 components of EQ
✓ Managing emotional hijacks with the 6-second pause
✓ Reading the room (social awareness)
✓ Empathy vs. sympathy

**Key takeaway:** Emotions drive behavior—yours and others'. The leader who masters emotional intelligence can navigate any situation with more skill, build deeper trust, and bring out the best in people.

**Quote to carry forward:**
*"People will forget what you said, people will forget what you did, but people will never forget how you made them feel."* — Maya Angelou`,
        practice: 'Choose one EQ skill to focus on next week: self-awareness, self-management, social awareness, or relationship management. Set a specific practice.',
        reflection: 'How has your emotional intelligence developed this week?'
      }
    ]
  },

  3: {
    week: 3,
    theme: 'Building Trust',
    objective: 'Learn to build and maintain trust—the foundation of all leadership',
    keyInsight: 'Trust is built in drops and lost in buckets.',
    resources: [
      { type: 'book', title: 'The Speed of Trust', author: 'Stephen M.R. Covey', key: 'Trust is an economic driver' },
      { type: 'video', title: 'The Anatomy of Trust', url: 'https://www.youtube.com/watch?v=psN1DORYYV0', duration: '23 min' }
    ],
    sessions: [
      {
        day: 1,
        title: 'Why Trust Matters',
        checkIn: 'Think of someone you deeply trust. What makes you trust them?',
        content: `**Trust is the foundation of leadership.** Without it, nothing else works—your influence, your communication, your ability to inspire change.

Stephen M.R. Covey's research reveals: When trust is high, everything moves faster and costs less. When trust is low, everything takes longer and costs more.

**The Trust Tax vs. Trust Dividend:**
- Low trust = 30-50% "tax" on every interaction (extra time, politics, verification)
- High trust = 30-50% "dividend" (speed, collaboration, innovation)

**Trust operates on two levels:**
1. **Character** - Do I believe you're a good person? (Integrity, intent)
2. **Competence** - Do I believe you can deliver? (Capability, results)

You need both. A trustworthy person who can't perform won't be trusted. A capable person with bad intentions won't be trusted.`,
        practice: 'Identify one relationship where trust could be stronger. Is the gap about character or competence? What\'s one small action you could take?',
        reflection: 'What did you notice about trust dynamics in your relationships today?'
      },
      {
        day: 2,
        title: 'The Trust Equation',
        checkIn: 'What erodes trust fastest for you personally?',
        content: `David Maister's **Trust Equation** breaks down what creates trustworthiness:

**Trust = (Credibility + Reliability + Intimacy) / Self-Orientation**

- **Credibility** - Your expertise and knowledge ("I trust their input")
- **Reliability** - Your track record of follow-through ("I can count on them")
- **Intimacy** - Safety of sharing with you ("I trust them with this")
- **Self-Orientation** - How focused you are on yourself vs. others

The denominator matters most: Even if you're credible, reliable, and create intimacy—high self-orientation destroys trust.

**Self-orientation red flags:**
- Talking more than listening
- Waiting to speak rather than seeking to understand
- Making conversations about your needs
- Taking credit, deflecting blame
- Not remembering what matters to others`,
        practice: 'In conversations today, notice your self-orientation. Are you focused on being understood or on understanding? On looking good or on helping?',
        reflection: 'What did you discover about your self-orientation today?'
      },
      {
        day: 3,
        title: 'Building Trust Through Consistency',
        checkIn: 'How reliable are you with small commitments?',
        content: `**Trust is built in drops and lost in buckets.**

The small things matter more than the big gestures:
- Following through on minor commitments
- Showing up on time
- Remembering what someone told you
- Doing what you said you'd do

**The 4 Behaviors of High-Trust Leaders:**
1. **Talk straight** - Be honest, don't spin, let people know where they stand
2. **Demonstrate respect** - Treat everyone with dignity, especially those who can't help you
3. **Create transparency** - Share information openly, no hidden agendas
4. **Right wrongs** - Apologize quickly, make restitution, don't cover up

**Trust audit question:** If your team kept a ledger of your commitments kept vs. broken, what would the balance be?`,
        practice: 'Make one small commitment today—and keep it meticulously. Notice how it feels to be 100% reliable.',
        reflection: 'What commitment did you keep today? How did it impact the relationship?'
      },
      {
        day: 4,
        title: 'Rebuilding Broken Trust',
        checkIn: 'Have you ever successfully rebuilt trust with someone? How?',
        content: `Trust can be rebuilt, but it requires intention and time. The process:

**1. Acknowledge the breach**
Don't minimize or explain away. "I understand that when I [specific action], it damaged your trust in me."

**2. Apologize authentically**
A real apology has three parts:
- Acknowledgment of what you did
- Recognition of the impact
- Commitment to change

**3. Change the behavior**
Words mean nothing without action. Show, don't tell.

**4. Give it time**
Trust is rebuilt through consistent behavior over time. Don't expect overnight recovery.

**What doesn't work:**
- Expecting forgiveness
- Bringing it up constantly
- Overcompensating
- Getting defensive when reminded`,
        practice: 'If there\'s a trust breach you need to address, take the first step today—even if it\'s just acknowledging it to yourself.',
        reflection: 'What did you learn about trust repair today?'
      },
      {
        day: 5,
        title: 'Week 3 Integration',
        checkIn: 'How would you rate the trust level in your most important professional relationship?',
        content: `**Week 3 Recap: Building Trust**

This week you explored:
✓ Trust as the foundation of leadership
✓ The Trust Equation (Credibility + Reliability + Intimacy / Self-Orientation)
✓ Building trust through consistency
✓ Rebuilding broken trust

**Key takeaway:** Trust isn't given—it's earned through countless small moments of keeping commitments, telling the truth, and putting others first. High-trust leaders can accomplish anything; low-trust leaders struggle with everything.

**Quote to carry forward:**
*"The best way to find out if you can trust somebody is to trust them."* — Ernest Hemingway`,
        practice: 'Set a trust goal for the coming week: One relationship to strengthen, one behavior to improve, or one trust breach to address.',
        reflection: 'How has your understanding of trust evolved this week?'
      }
    ]
  },

  // Weeks 4-13 continue the Foundation phase...
  // Adding abbreviated structures for planning

  4: {
    week: 4,
    theme: 'Communication Mastery',
    objective: 'Learn to communicate with clarity, impact, and presence',
    keyInsight: 'The meaning of your communication is the response you get.',
    resources: [
      { type: 'book', title: 'Crucial Conversations', author: 'Patterson, Grenny, et al.', key: 'Dialogue when stakes are high' },
      { type: 'video', title: 'How to Speak So People Listen', url: 'https://www.youtube.com/watch?v=eIho2S0ZahI', duration: '10 min' }
    ],
    sessions: [
      { day: 1, title: 'The Communication Gap', checkIn: 'When do you feel most understood?', content: 'Understanding the gap between intent and impact...', practice: 'Notice one communication gap today.', reflection: 'What did you learn?' },
      { day: 2, title: 'Active Listening', checkIn: 'How often do you listen to understand vs. to respond?', content: 'The art of truly hearing others...', practice: 'Practice reflective listening in one conversation.', reflection: 'How did it change the dynamic?' },
      { day: 3, title: 'Speaking with Clarity', checkIn: 'Do people often misunderstand you?', content: 'Clear thinking = clear speaking...', practice: 'Prepare one message using the "What, So What, Now What" framework.', reflection: 'Did the structure help?' },
      { day: 4, title: 'Difficult Conversations', checkIn: 'What conversation are you avoiding?', content: 'Moving toward, not away from, hard talks...', practice: 'Identify the conversation you need to have.', reflection: 'What makes it difficult?' },
      { day: 5, title: 'Week 4 Integration', checkIn: 'How has your communication improved?', content: 'Recap and integration...', practice: 'Set a communication goal.', reflection: 'What will you practice?' }
    ]
  },

  5: {
    week: 5,
    theme: 'Personal Productivity',
    objective: 'Master your time, energy, and attention to lead effectively',
    keyInsight: 'You cannot manage time—you can only manage yourself.',
    resources: [
      { type: 'book', title: 'Getting Things Done', author: 'David Allen', key: 'Mind like water' },
      { type: 'video', title: 'Time Management Tips', url: 'https://www.youtube.com/watch?v=iONDebHX9qk', duration: '12 min' }
    ],
    sessions: [
      { day: 1, title: 'The Leadership Productivity Trap', checkIn: 'How often do you end the day feeling accomplished?', content: 'Busy vs. productive leadership...', practice: 'Track where your time actually goes today.', reflection: 'What surprised you?' },
      { day: 2, title: 'Energy Management', checkIn: 'When is your peak energy time?', content: 'Protecting your best hours for your best work...', practice: 'Block your peak hours for important work.', reflection: 'Did it make a difference?' },
      { day: 3, title: 'The Power of No', checkIn: 'What should you have said no to recently?', content: 'Every yes is a no to something else...', practice: 'Say no to one thing today (gracefully).', reflection: 'How did it feel?' },
      { day: 4, title: 'Deep Work', checkIn: 'How long can you focus without distraction?', content: 'Creating space for meaningful work...', practice: 'Do a 90-minute deep work block.', reflection: 'What enabled focus? What broke it?' },
      { day: 5, title: 'Week 5 Integration', checkIn: 'What productivity habit will you adopt?', content: 'Recap and integration...', practice: 'Design your ideal leadership day.', reflection: 'What will you implement?' }
    ]
  },

  6: {
    week: 6,
    theme: 'Decision Making',
    objective: 'Learn frameworks for better, faster decisions',
    keyInsight: 'The quality of your life is determined by the quality of your decisions.',
    resources: [
      { type: 'book', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', key: 'System 1 vs System 2' },
      { type: 'video', title: 'How to Make Better Decisions', url: 'https://www.youtube.com/watch?v=d7Jnmi2BkS8', duration: '15 min' }
    ],
    sessions: [
      { day: 1, title: 'Decision Quality', checkIn: 'What decision are you currently struggling with?', content: 'Judging decisions by process, not outcome...', practice: 'Identify a pending decision.', reflection: 'What makes it hard?' },
      { day: 2, title: 'Cognitive Biases', checkIn: 'What bias do you fall into most often?', content: 'How our brains trick us...', practice: 'Notice one bias in action today.', reflection: 'What did you observe?' },
      { day: 3, title: 'Decision Frameworks', checkIn: 'Do you have a go-to decision process?', content: 'Tools for clearer thinking...', practice: 'Apply a framework to your pending decision.', reflection: 'Did it help?' },
      { day: 4, title: 'Deciding with Incomplete Information', checkIn: 'How comfortable are you with uncertainty?', content: 'Good enough decisions at the right time...', practice: 'Make a decision you\'ve been postponing.', reflection: 'What enabled the decision?' },
      { day: 5, title: 'Week 6 Integration', checkIn: 'How has your decision-making evolved?', content: 'Recap and integration...', practice: 'Commit to a decision-making practice.', reflection: 'What will you do differently?' }
    ]
  },

  7: {
    week: 7,
    theme: 'Feedback & Growth',
    objective: 'Master giving and receiving feedback that drives growth',
    keyInsight: 'Feedback is a gift—but only if you can receive it.',
    resources: [
      { type: 'book', title: 'Thanks for the Feedback', author: 'Stone & Heen', key: 'Receiving feedback is a skill' },
      { type: 'video', title: 'The Art of Giving Feedback', url: 'https://www.youtube.com/watch?v=wtl5UrrgU8c', duration: '8 min' }
    ],
    sessions: [
      { day: 1, title: 'Your Feedback Triggers', checkIn: 'When does feedback feel threatening?', content: 'Understanding why feedback is hard...', practice: 'Notice your feedback reactions today.', reflection: 'What triggers you?' },
      { day: 2, title: 'Receiving Feedback Well', checkIn: 'What feedback have you dismissed that might be true?', content: 'The skill of taking in feedback...', practice: 'Ask for feedback and just say thank you.', reflection: 'What did you learn?' },
      { day: 3, title: 'Giving Effective Feedback', checkIn: 'How comfortable are you giving critical feedback?', content: 'SBI and other models...', practice: 'Give one piece of feedback using SBI.', reflection: 'How did it land?' },
      { day: 4, title: 'Creating a Feedback Culture', checkIn: 'Does your team give each other honest feedback?', content: 'Making feedback normal...', practice: 'Invite feedback in a team setting.', reflection: 'What happened?' },
      { day: 5, title: 'Week 7 Integration', checkIn: 'What\'s your biggest feedback growth edge?', content: 'Recap and integration...', practice: 'Set a feedback goal.', reflection: 'What will you practice?' }
    ]
  },

  8: {
    week: 8,
    theme: 'Resilience & Stress',
    objective: 'Build the mental strength to thrive under pressure',
    keyInsight: 'Resilience is not about avoiding stress—it\'s about recovering faster.',
    resources: [
      { type: 'book', title: 'Option B', author: 'Sheryl Sandberg', key: 'Building resilience after adversity' },
      { type: 'video', title: 'The 3 Secrets of Resilient People', url: 'https://www.youtube.com/watch?v=NWH8N-BvhAw', duration: '16 min' }
    ],
    sessions: [
      { day: 1, title: 'Understanding Stress', checkIn: 'What stresses you most in your leadership role?', content: 'Good stress vs. bad stress...', practice: 'Map your current stressors.', reflection: 'Which can you control?' },
      { day: 2, title: 'The Resilience Mindset', checkIn: 'How do you typically respond to setbacks?', content: 'Fixed vs. growth mindset under pressure...', practice: 'Reframe one challenge as growth.', reflection: 'Did the reframe help?' },
      { day: 3, title: 'Recovery Practices', checkIn: 'How do you recharge?', content: 'Strategic recovery, not just rest...', practice: 'Schedule one recovery activity.', reflection: 'How did it impact your energy?' },
      { day: 4, title: 'Leading Through Crisis', checkIn: 'How do you show up when things go wrong?', content: 'Calm, clear, compassionate leadership...', practice: 'Recall a crisis and assess your response.', reflection: 'What would you do differently?' },
      { day: 5, title: 'Week 8 Integration', checkIn: 'How resilient do you feel?', content: 'Recap and integration...', practice: 'Build a resilience routine.', reflection: 'What practices will you adopt?' }
    ]
  },

  9: {
    week: 9,
    theme: 'Influence Without Authority',
    objective: 'Learn to lead and influence regardless of your position',
    keyInsight: 'Influence comes from credibility and relationships, not titles.',
    resources: [
      { type: 'book', title: 'Influence', author: 'Robert Cialdini', key: 'The 6 principles of persuasion' },
      { type: 'video', title: 'How to Influence People', url: 'https://www.youtube.com/watch?v=cFdCzN7RYbw', duration: '14 min' }
    ],
    sessions: [
      { day: 1, title: 'The Nature of Influence', checkIn: 'Who influences you? Why?', content: 'Authority vs. influence...', practice: 'Notice how you\'re influenced today.', reflection: 'What techniques were used?' },
      { day: 2, title: 'Building Credibility', checkIn: 'What are you the go-to person for?', content: 'Expertise + character = credibility...', practice: 'Share your expertise in one situation.', reflection: 'How was it received?' },
      { day: 3, title: 'Relationship Capital', checkIn: 'How strong is your network?', content: 'The currency of trust...', practice: 'Strengthen one relationship today.', reflection: 'What did you do?' },
      { day: 4, title: 'Persuasion Ethics', checkIn: 'Where\'s the line between influence and manipulation?', content: 'Win-win persuasion...', practice: 'Use influence for mutual benefit.', reflection: 'How did it feel?' },
      { day: 5, title: 'Week 9 Integration', checkIn: 'How has your influence grown?', content: 'Recap and integration...', practice: 'Set an influence goal.', reflection: 'What will you practice?' }
    ]
  },

  10: {
    week: 10,
    theme: 'Coaching Others',
    objective: 'Develop your ability to unlock potential in others',
    keyInsight: 'Great leaders ask more than they tell.',
    resources: [
      { type: 'book', title: 'The Coaching Habit', author: 'Michael Bungay Stanier', key: '7 essential coaching questions' },
      { type: 'video', title: 'What is Coaching?', url: 'https://www.youtube.com/watch?v=UY75MQte4RU', duration: '6 min' }
    ],
    sessions: [
      { day: 1, title: 'Leader as Coach', checkIn: 'How often do you coach vs. direct?', content: 'Shifting from telling to asking...', practice: 'Ask more questions than you give answers today.', reflection: 'What did you notice?' },
      { day: 2, title: 'Powerful Questions', checkIn: 'What question has changed your thinking?', content: 'Questions that unlock insight...', practice: 'Use "What else?" in conversations.', reflection: 'What emerged?' },
      { day: 3, title: 'The GROW Model', checkIn: 'Do you have a coaching framework?', content: 'Goal, Reality, Options, Will...', practice: 'Coach someone through a challenge using GROW.', reflection: 'How did it go?' },
      { day: 4, title: 'Coaching in the Moment', checkIn: 'Can you coach in 5 minutes?', content: 'Micro-coaching opportunities...', practice: 'Look for a 5-minute coaching moment.', reflection: 'What happened?' },
      { day: 5, title: 'Week 10 Integration', checkIn: 'Are you becoming more coach-like?', content: 'Recap and integration...', practice: 'Set a coaching goal.', reflection: 'What will you practice?' }
    ]
  },

  11: {
    week: 11,
    theme: 'Delegation & Empowerment',
    objective: 'Learn to multiply your impact through effective delegation',
    keyInsight: 'Delegation is not about getting rid of work—it\'s about developing people.',
    resources: [
      { type: 'book', title: 'Turn the Ship Around', author: 'L. David Marquet', key: 'Intent-based leadership' },
      { type: 'video', title: 'The Art of Delegation', url: 'https://www.youtube.com/watch?v=TH8PlFKVLnw', duration: '10 min' }
    ],
    sessions: [
      { day: 1, title: 'Why Leaders Don\'t Delegate', checkIn: 'What do you struggle to let go of?', content: 'The delegation paradox...', practice: 'Identify something you should delegate.', reflection: 'What\'s stopping you?' },
      { day: 2, title: 'What to Delegate', checkIn: 'What only you can do?', content: 'The delegation matrix...', practice: 'Categorize your tasks by delegation potential.', reflection: 'What surprised you?' },
      { day: 3, title: 'How to Delegate Well', checkIn: 'What makes delegation fail?', content: 'Clear outcomes, not micromanagement...', practice: 'Delegate something with clear success criteria.', reflection: 'How did it go?' },
      { day: 4, title: 'From Delegation to Empowerment', checkIn: 'Do your people feel empowered?', content: 'Moving from permission to initiative...', practice: 'Expand someone\'s decision-making authority.', reflection: 'What happened?' },
      { day: 5, title: 'Week 11 Integration', checkIn: 'How is your delegation improving?', content: 'Recap and integration...', practice: 'Set a delegation goal.', reflection: 'What will you let go of?' }
    ]
  },

  12: {
    week: 12,
    theme: 'Leading Meetings',
    objective: 'Transform meetings from time-wasters into leadership moments',
    keyInsight: 'Meetings are where culture is created or destroyed.',
    resources: [
      { type: 'book', title: 'Death by Meeting', author: 'Patrick Lencioni', key: 'Different meeting types for different purposes' },
      { type: 'video', title: 'How to Run Effective Meetings', url: 'https://www.youtube.com/watch?v=zradsxOy4w8', duration: '11 min' }
    ],
    sessions: [
      { day: 1, title: 'The Meeting Problem', checkIn: 'How much time do you spend in meetings?', content: 'Why most meetings fail...', practice: 'Audit your meeting load.', reflection: 'Which meetings add value?' },
      { day: 2, title: 'Meeting Design', checkIn: 'Do your meetings have clear purposes?', content: 'Types of meetings, types of outcomes...', practice: 'Redesign one recurring meeting.', reflection: 'What did you change?' },
      { day: 3, title: 'Facilitation Skills', checkIn: 'How do you handle difficult meeting dynamics?', content: 'Leading conversations, not dominating them...', practice: 'Facilitate more, contribute less.', reflection: 'What did you notice?' },
      { day: 4, title: 'Meeting Culture', checkIn: 'What\'s the vibe of your meetings?', content: 'Creating psychological safety...', practice: 'Open your next meeting differently.', reflection: 'How did it land?' },
      { day: 5, title: 'Week 12 Integration', checkIn: 'Are your meetings improving?', content: 'Recap and integration...', practice: 'Set a meeting goal.', reflection: 'What will you change?' }
    ]
  },

  13: {
    week: 13,
    theme: 'Foundation Phase Integration',
    objective: 'Consolidate learning and prepare for the Growth phase',
    keyInsight: 'Leadership is a practice, not a destination.',
    resources: [
      { type: 'book', title: 'Atomic Habits', author: 'James Clear', key: 'Small habits, remarkable results' },
      { type: 'video', title: 'The Power of Small Wins', url: 'https://www.youtube.com/watch?v=U_nzqnXWvSo', duration: '10 min' }
    ],
    sessions: [
      { day: 1, title: 'Journey Reflection', checkIn: 'How have you grown in 13 weeks?', content: 'Reviewing your leadership journey...', practice: 'Write a letter to your past self.', reflection: 'What would you tell them?' },
      { day: 2, title: 'Strengths Amplified', checkIn: 'What strength has grown the most?', content: 'Leveraging your development...', practice: 'Share your growth with someone.', reflection: 'How did it feel?' },
      { day: 3, title: 'Gaps & Opportunities', checkIn: 'What still needs work?', content: 'Honest assessment of growth edges...', practice: 'Identify your top 3 development areas.', reflection: 'What will you focus on?' },
      { day: 4, title: 'Building Leadership Habits', checkIn: 'What practices have stuck?', content: 'From learning to habit...', practice: 'Design your daily leadership routine.', reflection: 'What will you commit to?' },
      { day: 5, title: 'Foundation Complete', checkIn: 'Are you ready for the next level?', content: 'Celebrating progress, preparing for Growth...', practice: 'Set 3 goals for the Growth phase.', reflection: 'What excites you about the journey ahead?' }
    ]
  }

  // Weeks 14-52 follow similar structure...
  // Growth Phase (14-26): Teams, Conflict, Culture, Strategy
  // Mastery Phase (27-39): Change, Innovation, Crisis, Executive Presence
  // Legacy Phase (40-52): Developing Leaders, Succession, Impact, Renewal
};

/**
 * Get total session count
 */
export const getTotalSessions = () => {
  return Object.values(REPPY_CURRICULUM).reduce((total, week) => {
    return total + (week.sessions?.length || 5);
  }, 0);
};

/**
 * Get session by progress (1-indexed)
 * @param {number} sessionNumber - 1-indexed session number
 */
export const getSessionByNumber = (sessionNumber) => {
  let count = 0;
  for (const weekNum of Object.keys(REPPY_CURRICULUM).sort((a, b) => Number(a) - Number(b))) {
    const week = REPPY_CURRICULUM[weekNum];
    for (const session of week.sessions) {
      count++;
      if (count === sessionNumber) {
        return {
          week: Number(weekNum),
          weekTheme: week.theme,
          weekObjective: week.objective,
          keyInsight: week.keyInsight,
          resources: week.resources,
          phase: getPhaseForWeek(Number(weekNum)),
          session,
          sessionNumber: count,
          totalSessions: getTotalSessions()
        };
      }
    }
  }
  return null;
};

export default REPPY_CURRICULUM;
