/**
 * REPPY FOCUS-BASED CURRICULUM
 * 
 * Each Focus is a themed deep-dive spanning 3-7 sessions.
 * Users complete one focus at a time, building mastery before moving on.
 * 
 * STRUCTURE:
 * - Focus: A theme/skill area (e.g., "Communication", "Trust")
 * - Sessions: Individual learning moments within a focus
 * - Session Types: quote, lesson, scenario, book, video, reflection, challenge, integration
 * 
 * PHASES remain for overall progression tracking:
 * - Foundation (Focuses 1-5): Core leadership fundamentals
 * - Growth (Focuses 6-12): Advanced skills  
 * - Mastery (Focuses 13-20): Excellence & influence
 * - Daily (21+): Rotating personalized content
 */

// Session types
export const SESSION_TYPES = {
  QUOTE: 'quote',
  LESSON: 'lesson', 
  SCENARIO: 'scenario',
  BOOK: 'book',
  VIDEO: 'video',
  REFLECTION: 'reflection',
  CHALLENGE: 'challenge',
  INTEGRATION: 'integration', // End-of-focus conversation
  MISSION: 'mission', // Real-world action to do with team, report back
  ROLEPLAY: 'roleplay', // Practice conversations, AI plays the other person
  WIN_THE_DAY: 'win', // Arena-style morning intention
  PM_REFLECTION: 'pm', // Arena-style evening reflection
};

// Focus gradients for visual variety
export const FOCUS_GRADIENTS = {
  communication: 'from-violet-600 to-indigo-600',
  trust: 'from-emerald-500 to-teal-600',
  feedback: 'from-amber-500 to-orange-600',
  delegation: 'from-blue-500 to-cyan-600',
  influence: 'from-rose-500 to-pink-600',
  execution: 'from-slate-600 to-slate-800',
  conflict: 'from-red-500 to-rose-600',
  coaching: 'from-purple-500 to-violet-600',
  vision: 'from-indigo-500 to-blue-600',
  resilience: 'from-teal-500 to-green-600',
  presence: 'from-fuchsia-500 to-purple-600',
  empathy: 'from-pink-500 to-rose-500',
  accountability: 'from-orange-500 to-red-600',
  growth: 'from-lime-500 to-emerald-600',
  innovation: 'from-cyan-500 to-blue-600',
  culture: 'from-amber-400 to-yellow-600',
};

// ============================================
// FOUNDATION FOCUSES (1-5)
// Core leadership fundamentals
// ============================================

export const FOCUSES = [
  // ============================================
  // FOCUS 1: LEADERSHIP IDENTITY (5 sessions)
  // ============================================
  {
    id: 'focus-001',
    order: 1,
    phase: 'foundation',
    title: 'Leadership Identity',
    subtitle: 'Know Who You Are',
    description: 'Discover your authentic leadership voice and build unshakeable self-awareness.',
    icon: '🪞',
    gradient: 'from-violet-600 to-indigo-600',
    estimatedDays: 5,
    sessions: [
      {
        id: 'f1-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Mirror of Leadership',
        theme: 'self-awareness',
        content: {
          quote: "The first and greatest victory is to conquer yourself.",
          author: "Plato",
          context: "Ancient wisdom that still defines modern leadership",
          reflection: "Leadership begins with self-mastery. Before you can guide others, you must understand your own values, fears, and motivations."
        }
      },
      {
        id: 'f1-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Leadership Identity Statement',
        theme: 'identity',
        content: {
          opening: "Every great leader knows who they are and what they stand for.",
          lesson: "Your Leadership Identity Statement (LIS) is a compass that guides decisions when the path isn't clear. It answers: 'What kind of leader do I want to be?' Not what you do, but who you ARE as a leader.",
          framework: {
            name: "The LIS Formula",
            steps: [
              "I am a leader who... (core trait)",
              "I believe... (guiding principle)", 
              "I create... (impact on others)"
            ]
          },
          example: "I am a leader who leads with calm confidence. I believe every person has untapped potential. I create environments where people feel safe to grow.",
          insight: "Your LIS isn't aspirational—it's declarative. Speak it as truth."
        }
      },
      {
        id: 'f1-s3',
        type: SESSION_TYPES.REFLECTION,
        title: 'Defining Your Core Values',
        theme: 'values',
        content: {
          opening: "Your values are the non-negotiables that define your leadership.",
          prompt: "Think about a time when you felt deeply proud of a decision you made as a leader. What value were you honoring in that moment?",
          deeperPrompt: "Now think about a time you felt conflicted or compromised. What value was being challenged?",
          insight: "The gap between these two moments reveals where your growth edge lies."
        }
      },
      {
        id: 'f1-s4',
        type: SESSION_TYPES.VIDEO,
        title: 'Simon Sinek: Start with Why',
        theme: 'purpose',
        content: {
          videoTitle: "Start with Why - Simon Sinek TED Talk",
          videoUrl: "https://www.youtube.com/watch?v=u4ZoJKF_VuA",
          duration: "18 minutes",
          description: "One of the most-watched TED talks ever. Sinek explains why some leaders inspire action while others struggle—and it all starts with WHY.",
          watchFor: "The Golden Circle framework: Why → How → What. Notice how Apple and Martin Luther King Jr. both 'start with why.'",
          discussionPrompt: "What's YOUR why as a leader? Not what you do—why do you do it?"
        }
      },
      {
        id: 'f1-s5',
        type: SESSION_TYPES.BOOK,
        title: 'Start with Why',
        theme: 'purpose',
        content: {
          book: {
            title: "Start with Why",
            author: "Simon Sinek",
            year: 2009,
            synopsis: "Sinek's Golden Circle framework reveals why some leaders inspire action while others struggle. It starts with WHY—your purpose, cause, or belief—not WHAT you do or HOW you do it.",
            keyInsight: "People don't buy what you do; they buy why you do it. The same applies to leading people.",
            leadershipConnection: "When your team knows your WHY, they don't follow you for a paycheck—they follow you for a purpose.",
            actionableIdea: "Can you articulate your WHY in one sentence? Try it."
          }
        }
      },
      {
        id: 'f1-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Crafting Your Leadership Identity',
        theme: 'identity',
        content: {
          opening: "You've explored self-awareness, values, and purpose. Now let's bring it together.",
          challenge: "Write your Leadership Identity Statement. Use what you've learned this week.",
          prompts: [
            "What kind of leader do you want to be?",
            "What do you believe about people and leadership?",
            "What do you want to create for your team?"
          ],
          closing: "This statement will evolve. But starting with clarity beats starting with confusion."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 2: BUILDING TRUST (6 sessions)
  // ============================================
  {
    id: 'focus-002',
    order: 2,
    phase: 'foundation',
    title: 'Building Trust',
    subtitle: 'The Foundation of Influence',
    description: 'Master the mechanics of trust—how to build it rapidly and repair it when broken.',
    icon: '🤝',
    gradient: 'from-emerald-500 to-teal-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f2-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Speed of Trust',
        theme: 'trust',
        content: {
          quote: "Trust is the one thing that changes everything.",
          author: "Stephen M.R. Covey",
          context: "From his book 'The Speed of Trust'",
          reflection: "When trust is high, everything moves faster. When it's low, everything becomes expensive—in time, energy, and relationships."
        }
      },
      {
        id: 'f2-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Trust Equation',
        theme: 'trust',
        content: {
          opening: "Trust isn't magical—it's mathematical.",
          lesson: "The Trust Equation breaks down trustworthiness into four components you can actively develop.",
          framework: {
            name: "The Trust Equation",
            formula: "Trust = (Credibility + Reliability + Intimacy) / Self-Orientation",
            components: [
              { name: "Credibility", description: "Can they believe what you say? (Expertise, track record)" },
              { name: "Reliability", description: "Can they count on you? (Consistency, follow-through)" },
              { name: "Intimacy", description: "Do they feel safe with you? (Confidentiality, empathy)" },
              { name: "Self-Orientation", description: "Are you focused on them or yourself? (This is the divisor—it tanks trust)" }
            ]
          },
          insight: "Most trust issues aren't about competence. They're about self-orientation. Are you truly focused on them?"
        }
      },
      {
        id: 'f2-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Broken Promise',
        theme: 'trust-repair',
        content: {
          setup: "You promised your team you'd advocate for their project in the leadership meeting. But when pushback came from the CEO, you didn't push back. Now your team knows. They're not saying anything, but the energy has shifted.",
          context: "Trust breaks in moments but takes time to repair.",
          question: "What do you do?",
          options: [
            {
              choice: "Address it head-on with the team",
              analysis: "Vulnerable but powerful. Acknowledging the gap shows integrity. 'I didn't show up the way I should have. Let me tell you what happened and what I'm going to do differently.'"
            },
            {
              choice: "Wait and demonstrate trustworthiness over time",
              analysis: "Actions do speak louder than words—but silence can also signal avoidance. The elephant stays in the room."
            },
            {
              choice: "Go back to leadership and advocate harder",
              analysis: "Good follow-through, but without addressing it with your team first, they may never know you tried to make it right."
            }
          ],
          principle: "The fastest way to repair trust is to name the break. Avoiding it extends the damage."
        }
      },
      {
        id: 'f2-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Vulnerability-Based Trust',
        theme: 'vulnerability',
        content: {
          opening: "Patrick Lencioni's model suggests trust requires something uncomfortable: vulnerability.",
          lesson: "Vulnerability-based trust means being willing to say 'I don't know,' 'I was wrong,' or 'I need help.' It's the opposite of projecting invincibility.",
          framework: {
            name: "Signals of Vulnerability-Based Trust",
            signals: [
              "Admitting mistakes before others discover them",
              "Asking for help without shame",
              "Acknowledging limitations and gaps",
              "Sharing credit generously",
              "Offering and accepting apologies"
            ]
          },
          insight: "Paradoxically, showing weakness builds stronger teams. Perfection is isolating; humanity is connecting."
        }
      },
      {
        id: 'f2-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Trust Accelerator',
        theme: 'trust',
        content: {
          challenge: "Have one vulnerable conversation today. Share something you're struggling with or uncertain about with someone on your team.",
          rules: [
            "It must be genuine—not manufactured vulnerability",
            "Choose something appropriate for the relationship",
            "Notice how they respond"
          ],
          why: "Trust deposits are made in small moments. One authentic conversation can shift a relationship."
        }
      },
      {
        id: 'f2-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Trust Blueprint',
        theme: 'trust',
        content: {
          opening: "You've learned the mechanics of trust. Now let's personalize it.",
          prompts: [
            "Using the Trust Equation, which component is your strength? Which needs work?",
            "Who on your team might you have an unaddressed trust gap with?",
            "What's one specific action you'll take this week to build trust?"
          ],
          closing: "Trust is built in drops and lost in buckets. Protect what you build."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 3: GIVING FEEDBACK (6 sessions)
  // ============================================
  {
    id: 'focus-003',
    order: 3,
    phase: 'foundation',
    title: 'Giving Feedback',
    subtitle: 'The Gift That Grows People',
    description: 'Learn to give feedback that people actually hear, accept, and act on.',
    icon: '💬',
    gradient: 'from-amber-500 to-orange-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f3-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Care Challenge',
        theme: 'feedback',
        content: {
          quote: "Radical Candor is Caring Personally while Challenging Directly.",
          author: "Kim Scott",
          context: "Former Google and Apple executive, author of 'Radical Candor'",
          reflection: "Most leaders err on one side: they care but don't challenge (Ruinous Empathy), or they challenge without caring (Obnoxious Aggression). The magic is both."
        }
      },
      {
        id: 'f3-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The CLEAR Feedback Framework',
        theme: 'feedback',
        content: {
          opening: "Great feedback is specific, timely, and actionable. The CLEAR framework ensures you hit all three.",
          framework: {
            name: "CLEAR Feedback",
            steps: [
              { letter: "C", name: "Context", description: "Set the stage. 'In yesterday's meeting...'" },
              { letter: "L", name: "Locate", description: "Name the specific behavior. 'When you interrupted Sarah...'" },
              { letter: "E", name: "Effect", description: "Explain the impact. 'It made her hesitant to share more.'" },
              { letter: "A", name: "Ask", description: "Invite their perspective. 'What was going on for you?'" },
              { letter: "R", name: "Request", description: "Agree on next steps. 'Next time, could you...'" }
            ]
          },
          insight: "The 'Ask' step transforms feedback from a lecture into a conversation. It often reveals context you didn't have."
        }
      },
      {
        id: 'f3-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Feedback You\'ve Been Avoiding',
        theme: 'feedback',
        content: {
          setup: "A talented team member consistently delivers late. The work is excellent when it arrives, but deadlines are missed 80% of the time. You've hinted at it, but never had the direct conversation. It's affecting the whole team's workflow.",
          question: "How do you approach this using CLEAR?",
          example: {
            context: "I wanted to talk about our project timelines over the past quarter.",
            locate: "I've noticed that about 8 out of 10 deliverables have come in past the deadline we agreed on.",
            effect: "This creates a ripple effect—the team has to scramble, and it's starting to affect client trust.",
            ask: "I'm curious what's happening on your end. What's getting in the way?",
            request: "Can we work together on a system that helps you hit dates more consistently?"
          },
          principle: "Notice: no character attacks, no 'you always' language. Just observable behavior and its impact."
        }
      },
      {
        id: 'f3-s4',
        type: SESSION_TYPES.ROLEPLAY,
        title: 'Practice: The Late Deliverables Conversation',
        theme: 'feedback',
        content: {
          setup: "Let's practice giving feedback using the CLEAR framework. This is a safe space to try the words out loud.",
          situation: "Your team member Alex consistently delivers excellent work, but 80% of the time it's late. This is affecting the whole team. You need to have a direct conversation.",
          yourRole: "The manager having this conversation",
          myRole: "Alex, your team member",
          myRoleDescription: "I'm Alex. I'm talented and I know it. I don't think deadlines are that serious because my work is good. I might get a little defensive at first, but I'm not unreasonable if you approach me well.",
          goal: "Use the CLEAR framework to address the pattern of late work without damaging the relationship.",
          coachingNotes: "Watch for: Do they start with specific behavior (not character)? Do they explain impact? Do they ask for Alex's perspective? Do they end with a clear request?"
        }
      },
      {
        id: 'f3-s5',
        type: SESSION_TYPES.BOOK,
        title: 'Radical Candor',
        theme: 'feedback',
        content: {
          book: {
            title: "Radical Candor",
            author: "Kim Scott",
            year: 2017,
            synopsis: "Kim Scott's framework maps feedback approaches on two axes: Care Personally and Challenge Directly. The goal is the upper-right quadrant: Radical Candor—where you care enough to be honest.",
            keyInsight: "It's not mean to tell someone their fly is down. It's mean to let them walk around like that. The same applies to professional feedback.",
            leadershipConnection: "Most feedback failures come from caring without challenging (staying silent to be 'nice') or challenging without caring (being harsh).",
            actionableIdea: "Think of feedback you've been avoiding. Is it because you don't care enough to bother, or you care too much to risk the relationship?"
          }
        }
      },
      {
        id: 'f3-s6',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The 24-Hour Feedback',
        theme: 'feedback',
        content: {
          challenge: "Give one piece of constructive feedback today using the CLEAR framework. It doesn't have to be big—small, timely feedback is often more powerful.",
          rules: [
            "Must be genuine, not manufactured",
            "Focus on behavior, not character",
            "End with a request, not a demand",
            "Do it within 24 hours of observing the behavior"
          ],
          why: "Feedback delayed is feedback diluted. The closer to the moment, the more impactful."
        }
      },
      {
        id: 'f3-s7',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Feedback Edge',
        theme: 'feedback',
        content: {
          opening: "Everyone has a feedback tendency. Let's identify yours.",
          prompts: [
            "Do you tend toward Ruinous Empathy (caring but not challenging) or Obnoxious Aggression (challenging without caring)?",
            "What feedback conversation have you been avoiding? Why?",
            "What would change if you gave that feedback this week?"
          ],
          closing: "Withholding feedback isn't kindness—it's deprivation. People deserve to know where they stand."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 4: ACTIVE LISTENING (5 sessions)
  // ============================================
  {
    id: 'focus-004',
    order: 4,
    phase: 'foundation',
    title: 'Active Listening',
    subtitle: 'The Most Underrated Skill',
    description: 'Transform your conversations by mastering the art of truly hearing people.',
    icon: '👂',
    gradient: 'from-blue-500 to-cyan-600',
    estimatedDays: 5,
    sessions: [
      {
        id: 'f4-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Listening Gap',
        theme: 'listening',
        content: {
          quote: "Most people do not listen with the intent to understand; they listen with the intent to reply.",
          author: "Stephen R. Covey",
          context: "From 'The 7 Habits of Highly Effective People'",
          reflection: "Notice your own listening today. Are you formulating your response while they're still talking?"
        }
      },
      {
        id: 'f4-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Three Levels of Listening',
        theme: 'listening',
        content: {
          opening: "Not all listening is created equal. There are three distinct levels.",
          framework: {
            name: "Three Levels of Listening",
            levels: [
              { 
                level: 1, 
                name: "Internal Listening", 
                description: "You hear their words but you're focused on your own thoughts, judgments, and what you'll say next.",
                signal: "You're waiting for them to finish so you can talk."
              },
              { 
                level: 2, 
                name: "Focused Listening", 
                description: "You're fully present to their words, tone, and meaning. You're curious about their experience.",
                signal: "You're asking follow-up questions to understand, not to steer."
              },
              { 
                level: 3, 
                name: "Global Listening", 
                description: "You're picking up everything—words, body language, what's NOT being said, the energy in the room.",
                signal: "You notice shifts and can name what's unspoken."
              }
            ]
          },
          insight: "Most workplace conversations happen at Level 1. The best leaders operate at Level 2 and 3."
        }
      },
      {
        id: 'f4-s3',
        type: SESSION_TYPES.LESSON,
        title: 'The Listening LADDER',
        theme: 'listening',
        content: {
          opening: "Active listening has concrete techniques you can practice.",
          framework: {
            name: "The LADDER",
            steps: [
              { letter: "L", name: "Look", description: "Maintain appropriate eye contact" },
              { letter: "A", name: "Ask", description: "Ask clarifying questions" },
              { letter: "D", name: "Don't interrupt", description: "Let them finish completely" },
              { letter: "D", name: "Don't change the subject", description: "Stay with their topic" },
              { letter: "E", name: "Empathize", description: "Acknowledge their feelings" },
              { letter: "R", name: "Reflect", description: "Mirror back what you heard" }
            ]
          },
          insight: "The 'Reflect' step is powerful: 'What I'm hearing is...' confirms understanding and makes people feel truly heard."
        }
      },
      {
        id: 'f4-s4',
        type: SESSION_TYPES.MISSION,
        title: 'The Listening Lab',
        theme: 'listening',
        content: {
          mission: "Have a 10-minute conversation with someone on your team where your ONLY job is to listen. Ask questions. Reflect back what you hear. Do NOT give advice, share your opinion, or solve their problem.",
          context: "This is harder than it sounds. Most leaders fill silence with solutions. Today, you're just a mirror.",
          tips: [
            "Start with: 'I want to understand what's going on for you. No agenda, just listening.'",
            "When you want to give advice, ask a question instead",
            "Use 'What I'm hearing is...' to reflect back",
            "Notice the urge to fix—and resist it"
          ],
          timeframe: "Complete this mission within the next 24 hours",
          followUp: "What did you notice? How did they respond to being truly heard?"
        }
      },
      {
        id: 'f4-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Silent Leader',
        theme: 'listening',
        content: {
          challenge: "In your next meeting or 1:1, commit to listening for 80% of the conversation. When you do speak, only ask questions or reflect back what you've heard.",
          rules: [
            "No solutions unless explicitly asked",
            "No 'That reminds me of...' stories",
            "Count to 3 after they stop talking before you respond",
            "Notice the urge to jump in—and don't"
          ],
          why: "Leaders often fill silence because it's uncomfortable. But silence is where insight emerges."
        }
      },
      {
        id: 'f4-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Listening Audit',
        theme: 'listening',
        content: {
          opening: "Let's assess your listening honestly.",
          prompts: [
            "What level of listening do you default to in most conversations?",
            "Who in your life deserves better listening from you?",
            "What gets in the way of you being fully present?"
          ],
          closing: "The quality of your leadership is directly proportional to the quality of your listening."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 5: DELEGATION (6 sessions)
  // ============================================
  {
    id: 'focus-005',
    order: 5,
    phase: 'foundation',
    title: 'Delegation',
    subtitle: 'Multiplying Your Impact',
    description: 'Learn to let go of tasks and empower others to grow.',
    icon: '🎯',
    gradient: 'from-rose-500 to-pink-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f5-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Paradox of Control',
        theme: 'delegation',
        content: {
          quote: "If you want to do a few small things right, do them yourself. If you want to do great things and make a big impact, learn to delegate.",
          author: "John C. Maxwell",
          context: "Leadership expert and author",
          reflection: "What are you holding onto that someone else could do—maybe even better than you?"
        }
      },
      {
        id: 'f5-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Delegation Matrix',
        theme: 'delegation',
        content: {
          opening: "Not everything should be delegated. But more can be than you think.",
          framework: {
            name: "The 4D Delegation Matrix",
            quadrants: [
              { 
                name: "Do", 
                criteria: "High impact + Only you can do it", 
                action: "Protect this time fiercely" 
              },
              { 
                name: "Delegate", 
                criteria: "High impact + Someone else can do it", 
                action: "Invest time in training, then let go" 
              },
              { 
                name: "Defer", 
                criteria: "Low impact + Only you can do it", 
                action: "Schedule for later or batch" 
              },
              { 
                name: "Delete", 
                criteria: "Low impact + Someone else can do it", 
                action: "Eliminate or fully offload" 
              }
            ]
          },
          insight: "Most leaders over-index on 'Do' and under-utilize 'Delegate.' The result: burnout and underdeveloped teams."
        }
      },
      {
        id: 'f5-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Reluctant Delegator',
        theme: 'delegation',
        content: {
          setup: "You have a high-stakes client presentation next week. You've always done these yourself because 'no one does it as well.' A capable team member has asked to take the lead. It would free up 10 hours of your time and help them grow—but the risk feels real.",
          question: "What do you do?",
          options: [
            {
              choice: "Let them lead with your support",
              analysis: "Growth happens at the edge of comfort—theirs and yours. Offer to review together and be available for questions, but let them own it."
            },
            {
              choice: "Do it yourself—too important",
              analysis: "Safe in the short term, but you've just signaled you don't trust them. And you'll be doing every presentation forever."
            },
            {
              choice: "Co-present this time, they lead next time",
              analysis: "A reasonable middle ground—but notice if 'next time' keeps getting delayed."
            }
          ],
          principle: "The first time someone does something, it won't be as good as your 100th time. That's not a reason to never let them try."
        }
      },
      {
        id: 'f5-s4',
        type: SESSION_TYPES.LESSON,
        title: 'The Art of Letting Go',
        theme: 'delegation',
        content: {
          opening: "Delegation fails when we delegate the task but not the authority.",
          lesson: "True delegation has five levels. Most leaders get stuck at Level 2.",
          framework: {
            name: "Five Levels of Delegation",
            levels: [
              { level: 1, name: "Wait to be told", description: "I tell you exactly what to do" },
              { level: 2, name: "Ask", description: "Research and recommend, but I decide" },
              { level: 3, name: "Recommend", description: "Recommend, then act unless I say no" },
              { level: 4, name: "Act and inform", description: "Take action, then tell me what you did" },
              { level: 5, name: "Act", description: "Full ownership—no need to report" }
            ]
          },
          insight: "Match the delegation level to the person's capability and the risk involved. Then trust the level you chose."
        }
      },
      {
        id: 'f5-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Delegation Experiment',
        theme: 'delegation',
        content: {
          challenge: "Identify one task you've been holding onto and delegate it this week. Use the framework: match the delegation level, provide context, then step back.",
          rules: [
            "Choose something meaningful, not just busywork",
            "Be explicit about the delegation level",
            "Resist the urge to micromanage or 'check in' excessively",
            "Debrief with them afterward: what worked, what didn't"
          ],
          why: "Delegation is a muscle. It atrophies without use."
        }
      },
      {
        id: 'f5-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Delegation Plan',
        theme: 'delegation',
        content: {
          opening: "You've learned the frameworks. Now let's make it personal.",
          prompts: [
            "What task have you been hoarding that's limiting someone else's growth?",
            "What's the fear underneath your reluctance to delegate?",
            "If you could free up 5 hours a week through delegation, what would you do with that time?"
          ],
          closing: "Your job isn't to do the work—it's to develop people who can."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 6: WINNING THE DAY (5 sessions)
  // Arena-style morning intention & evening reflection
  // ============================================
  {
    id: 'focus-006',
    order: 6,
    phase: 'growth',
    title: 'Winning the Day',
    subtitle: 'Mastering Your Daily Rhythm',
    description: 'Build the morning intention and evening reflection habits that elite leaders use.',
    icon: '🏆',
    gradient: 'from-amber-400 to-yellow-600',
    estimatedDays: 5,
    sessions: [
      {
        id: 'f6-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Power of Intention',
        theme: 'intention',
        content: {
          quote: "Either you run the day, or the day runs you.",
          author: "Jim Rohn",
          context: "Entrepreneur and motivational speaker",
          reflection: "How often do you end the day wondering where the time went? Morning intention changes that."
        }
      },
      {
        id: 'f6-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The WIN Framework',
        theme: 'intention',
        content: {
          opening: "WIN stands for 'What's Important Now.' It's not a to-do list—it's a priority filter.",
          framework: {
            name: "The WIN System",
            components: [
              { 
                name: "The ONE Thing", 
                description: "If only ONE thing gets done today, what must it be?",
                key: "This is your non-negotiable. Everything else is secondary."
              },
              { 
                name: "Two Supporting Actions", 
                description: "What two other items would make today a success?",
                key: "These support your ONE thing or move important projects forward."
              },
              { 
                name: "Time Block", 
                description: "When will you do your ONE thing?",
                key: "If it's not on the calendar, it's not real."
              }
            ]
          },
          insight: "Most people have 10+ 'priorities.' When everything is a priority, nothing is. WIN forces clarity."
        }
      },
      {
        id: 'f6-s3',
        type: SESSION_TYPES.WIN_THE_DAY,
        title: 'Your First WIN',
        theme: 'intention',
        content: {
          opening: "Let's practice the WIN framework right now.",
          prompts: [
            { 
              label: "My ONE Thing Today",
              placeholder: "The single most important thing...",
              hint: "What would make today a success even if nothing else happened?"
            },
            { 
              label: "Supporting Action #1",
              placeholder: "My second priority...",
              hint: "What else matters today?"
            },
            { 
              label: "Supporting Action #2", 
              placeholder: "My third priority...",
              hint: "What would round out a great day?"
            }
          ],
          closing: "Now protect these. When distractions come (and they will), return to your WIN."
        }
      },
      {
        id: 'f6-s4',
        type: SESSION_TYPES.PM_REFLECTION,
        title: 'The Evening Bookend',
        theme: 'reflection',
        content: {
          opening: "Morning intention sets direction. Evening reflection captures wisdom.",
          prompts: [
            {
              label: "What went well today?",
              placeholder: "Celebrate the wins, however small...",
              hint: "Gratitude rewires your brain for positivity."
            },
            {
              label: "What needs work?",
              placeholder: "Be honest but kind...",
              hint: "Not self-criticism—growth awareness."
            },
            {
              label: "What's one word for tomorrow?",
              placeholder: "Focus, courage, patience...",
              hint: "Set an intention for who you'll be."
            }
          ],
          closing: "This 2-minute practice compounds into massive self-awareness over time."
        }
      },
      {
        id: 'f6-s5',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Building Your Daily Rhythm',
        theme: 'habits',
        content: {
          opening: "You've learned WIN and the Evening Bookend. Now let's make them stick.",
          prompts: [
            "When and where will you do your morning WIN? (Be specific: 'At 6:45 AM at my kitchen table')",
            "What will trigger your evening reflection? (After dinner? Before bed?)",
            "What will you do when you miss a day? (Because you will)"
          ],
          insight: "Habit research shows that missing once is fine. Missing twice starts a new pattern. Have a 'get back on track' plan.",
          closing: "Leaders who master their days master their results."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 7: DIFFICULT CONVERSATIONS (7 sessions)
  // ============================================
  {
    id: 'focus-007',
    order: 7,
    phase: 'growth',
    title: 'Difficult Conversations',
    subtitle: 'Navigating the Uncomfortable',
    description: 'Build confidence for the conversations most leaders avoid.',
    icon: '🗣️',
    gradient: 'from-red-500 to-rose-600',
    estimatedDays: 7,
    sessions: [
      {
        id: 'f7-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Cost of Avoidance',
        theme: 'difficult-conversations',
        content: {
          quote: "The conversation you're avoiding is the conversation you need to have.",
          author: "Unknown",
          reflection: "What conversation have you been putting off? What's it costing you?"
        }
      },
      {
        id: 'f7-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Three Conversations',
        theme: 'difficult-conversations',
        content: {
          opening: "Every difficult conversation is actually three conversations happening at once.",
          framework: {
            name: "The Three Conversations (from 'Difficult Conversations' by Stone, Patton & Heen)",
            conversations: [
              {
                name: "The What Happened Conversation",
                description: "The facts, the story, who's right. Where we usually get stuck.",
                shift: "Move from certainty to curiosity. 'Help me understand your perspective.'"
              },
              {
                name: "The Feelings Conversation",
                description: "Emotions—often unspoken but always present.",
                shift: "Name feelings without blame. 'I felt frustrated' not 'You made me frustrated.'"
              },
              {
                name: "The Identity Conversation",
                description: "What this says about me. Am I competent? A good person?",
                shift: "Recognize both of you are protecting your self-image."
              }
            ]
          },
          insight: "Most difficult conversations fail because we stay in 'What Happened' and ignore Feelings and Identity."
        }
      },
      {
        id: 'f7-s3',
        type: SESSION_TYPES.BOOK,
        title: 'Crucial Conversations',
        theme: 'difficult-conversations',
        content: {
          book: {
            title: "Crucial Conversations",
            author: "Patterson, Grenny, McMillan & Switzler",
            year: 2002,
            synopsis: "This classic identifies 'crucial conversations' as high-stakes discussions where opinions vary and emotions run strong. The authors provide tools to speak persuasively, not abrasively, and get results.",
            keyInsight: "When stakes are high, we tend to either go silent (withholding) or become aggressive (forcing). Neither works. The goal is dialogue.",
            leadershipConnection: "Your team's safety in having difficult conversations with YOU determines whether problems surface early or fester.",
            actionableIdea: "In your next tough conversation, start with 'I want to share my perspective, and I want to understand yours.'"
          }
        }
      },
      {
        id: 'f7-s4',
        type: SESSION_TYPES.LESSON,
        title: 'The STATE Method',
        theme: 'difficult-conversations',
        content: {
          opening: "When you need to address something difficult, use STATE to keep it productive.",
          framework: {
            name: "STATE",
            steps: [
              { letter: "S", name: "Share your facts", description: "Start with the objective data, not your conclusions." },
              { letter: "T", name: "Tell your story", description: "Share your interpretation—clearly labeled as YOUR story." },
              { letter: "A", name: "Ask for their path", description: "Invite their perspective genuinely." },
              { letter: "T", name: "Talk tentatively", description: "Use 'I wonder' or 'In my view' not 'Obviously you...'." },
              { letter: "E", name: "Encourage testing", description: "Make it safe for them to disagree with you." }
            ]
          },
          example: "S: 'We've missed the last three deadlines.' T: 'My story is that the workload isn't sustainable.' A: 'What's your take?' T: 'I could be missing something.' E: 'Tell me if you see it differently.'"
        }
      },
      {
        id: 'f7-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Performance Conversation',
        theme: 'difficult-conversations',
        content: {
          setup: "A long-time team member's performance has declined over the past 6 months. They're a good person, well-liked, but their work isn't meeting the bar. You've given feedback, but nothing has changed. The team is noticing and starting to question fairness.",
          question: "How do you approach this?",
          options: [
            {
              choice: "Have a direct conversation about consequences",
              analysis: "Necessary. Use STATE: facts, your story, their perspective. But also be clear about what happens if things don't change. Kindness without clarity is cruelty."
            },
            {
              choice: "Give it more time and support",
              analysis: "If you've already done this for 6 months, more time without clarity isn't kindness—it's avoidance. The team sees it."
            },
            {
              choice: "Work around them quietly",
              analysis: "Erodes their dignity and your credibility. They deserve to know where they stand."
            }
          ],
          principle: "Hard conversations delayed become harder. The kindest thing is often the clearest thing."
        }
      },
      {
        id: 'f7-s6',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Conversation You\'ve Been Avoiding',
        theme: 'difficult-conversations',
        content: {
          challenge: "Identify the difficult conversation you've been putting off longest. Write out what you would say using the STATE method. Then schedule it within the next 48 hours.",
          rules: [
            "Don't script it word-for-word—that feels rehearsed",
            "Do clarify your key points and desired outcome",
            "Have it in person if possible",
            "Open with intent: 'I want to address something because I care about our working relationship'"
          ],
          why: "Avoidance has a compound interest effect—the cost grows daily."
        }
      },
      {
        id: 'f7-s7',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Conversation Confidence',
        theme: 'difficult-conversations',
        content: {
          opening: "Let's reflect on your relationship with difficult conversations.",
          prompts: [
            "What's your typical avoidance pattern? (Going silent? Getting aggressive? Something else?)",
            "What's the story you tell yourself about why you avoid?",
            "What would it mean for your leadership if you became someone who handles hard conversations with skill and courage?"
          ],
          closing: "Difficult conversations are a skill. The more you practice, the less difficult they become."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 8: COACHING YOUR TEAM (6 sessions)
  // ============================================
  {
    id: 'focus-008',
    order: 8,
    phase: 'growth',
    title: 'Coaching Your Team',
    subtitle: 'From Boss to Coach',
    description: 'Shift from giving answers to asking questions that develop your people.',
    icon: '🌱',
    gradient: 'from-purple-500 to-violet-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f8-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Coaching Mindset',
        theme: 'coaching',
        content: {
          quote: "A coach is someone who tells you what you don't want to hear, who has you see what you don't want to see, so you can be who you always knew you could be.",
          author: "Tom Landry",
          context: "Legendary NFL coach",
          reflection: "Are you developing your team, or just directing them?"
        }
      },
      {
        id: 'f8-s2',
        type: SESSION_TYPES.LESSON,
        title: 'Ask, Don\'t Tell',
        theme: 'coaching',
        content: {
          opening: "The #1 coaching skill: Replace giving advice with asking questions.",
          lesson: "When someone brings you a problem, your instinct is to solve it. But that creates dependency. Questions create capability.",
          framework: {
            name: "The Ask First Rule",
            principle: "For every advice you want to give, ask two questions first.",
            examples: [
              { instead: "Here's what you should do...", ask: "What options have you considered?" },
              { instead: "The answer is obvious...", ask: "What's your instinct telling you?" },
              { instead: "Let me tell you what I would do...", ask: "What would you do if I wasn't here?" }
            ]
          },
          insight: "The best coaching question: 'What do you think?' Then shut up and wait."
        }
      },
      {
        id: 'f8-s3',
        type: SESSION_TYPES.LESSON,
        title: 'The GROW Model',
        theme: 'coaching',
        content: {
          opening: "GROW is the most widely used coaching framework. It provides structure for any coaching conversation.",
          framework: {
            name: "GROW",
            steps: [
              { 
                letter: "G", 
                name: "Goal", 
                description: "What do you want to achieve?",
                questions: ["What would success look like?", "What's the outcome you want?"]
              },
              { 
                letter: "R", 
                name: "Reality", 
                description: "What's happening now?",
                questions: ["What have you tried?", "What's getting in the way?"]
              },
              { 
                letter: "O", 
                name: "Options", 
                description: "What could you do?",
                questions: ["What are your options?", "What else could you try?", "If you had no constraints, what would you do?"]
              },
              { 
                letter: "W", 
                name: "Will", 
                description: "What will you do?",
                questions: ["What's your first step?", "When will you do it?", "How committed are you, 1-10?"]
              }
            ]
          },
          insight: "Most managers jump straight to Options. But without clarity on Goal and Reality, you're solving the wrong problem."
        }
      },
      {
        id: 'f8-s4',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Advice Trap',
        theme: 'coaching',
        content: {
          setup: "A team member comes to you: 'I'm stuck on this project. What should I do?' You have a clear answer in your head. They're looking at you expectantly, waiting for direction.",
          question: "How do you respond?",
          options: [
            {
              choice: "Ask 'What options have you considered?'",
              analysis: "The coaching response. It honors their capability and helps them build problem-solving muscle. They may land on your answer—or something better."
            },
            {
              choice: "Give them the answer directly",
              analysis: "Fast, but they'll be back tomorrow with the next problem. You've just taught them that you have the answers, not them."
            },
            {
              choice: "Give them the answer, then explain your reasoning",
              analysis: "Better—but still centers you as the expert. Consider coaching first, then sharing perspective if they're truly stuck."
            }
          ],
          principle: "Your job isn't to have all the answers. It's to develop people who can find their own."
        }
      },
      {
        id: 'f8-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Coaching Day',
        theme: 'coaching',
        content: {
          challenge: "For one full day, commit to coaching mode: ask questions before giving any advice or direction. Keep a tally of how many times you succeed vs. revert to telling.",
          rules: [
            "Use 'What do you think?' liberally",
            "When you feel the urge to give advice, ask 'What options have you considered?' first",
            "If they genuinely don't know, ask permission: 'Would it be helpful if I shared a perspective?'",
            "At day's end, reflect on how it changed the conversations"
          ],
          why: "Leaders who coach produce leaders. Leaders who tell produce followers."
        }
      },
      {
        id: 'f8-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Coaching Identity',
        theme: 'coaching',
        content: {
          opening: "Let's assess your current coaching stance.",
          prompts: [
            "On a scale of 1-10, how much do you default to 'telling' vs 'asking'?",
            "What's one situation this week where you could use GROW?",
            "What belief about your role makes it hard to ask instead of tell?"
          ],
          closing: "The irony: the more you let go of being the expert, the more valuable you become."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 9: EXECUTIVE PRESENCE (5 sessions)
  // ============================================
  {
    id: 'focus-009',
    order: 9,
    phase: 'growth',
    title: 'Executive Presence',
    subtitle: 'Commanding the Room',
    description: 'Develop the gravitas, communication, and appearance that inspire confidence.',
    icon: '👔',
    gradient: 'from-slate-600 to-slate-800',
    estimatedDays: 5,
    sessions: [
      {
        id: 'f9-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'Presence Defined',
        theme: 'presence',
        content: {
          quote: "Executive presence is the ability to inspire confidence—in your subordinates that you're the leader they want to follow, in your peers that you're capable and reliable, and in senior leaders that you have the potential for great achievements.",
          author: "Sylvia Ann Hewlett",
          context: "Author of 'Executive Presence'",
          reflection: "When you walk into a room, what do people feel?"
        }
      },
      {
        id: 'f9-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Three Pillars of Presence',
        theme: 'presence',
        content: {
          opening: "Executive presence isn't one thing—it's three.",
          framework: {
            name: "The Three Pillars",
            pillars: [
              {
                name: "Gravitas",
                weight: "Core of presence",
                description: "How you project confidence, decisiveness, and integrity. The substance behind the style.",
                behaviors: ["Show emotional intelligence under pressure", "Make decisions", "Own your mistakes", "Project confidence without arrogance"]
              },
              {
                name: "Communication",
                weight: "How you convey gravitas",
                description: "Ability to command a room, articulate a vision, and read the room.",
                behaviors: ["Speak with conviction", "Be concise", "Tell stories", "Master silence"]
              },
              {
                name: "Appearance",
                weight: "The first impression",
                description: "How you show up visually and physically—appropriateness and intention.",
                behaviors: ["Dress appropriately for the room + 1 level", "Project energy and health", "Posture signals confidence", "Be present, not distracted"]
              }
            ]
          },
          insight: "Gravitas is 67% of presence. Communication is 28%. Appearance is only 5%—but it's the first thing people see."
        }
      },
      {
        id: 'f9-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Gravitas Under Pressure',
        theme: 'presence',
        content: {
          opening: "Executive presence is tested when things go wrong, not when they're easy.",
          lesson: "The leaders who rise are the ones who stay calm, collected, and confident when everyone else is panicking. This isn't about suppressing emotions—it's about regulating them.",
          framework: {
            name: "The Presence Protocol",
            steps: [
              { name: "Pause", description: "Before reacting, take one breath. Create space between stimulus and response." },
              { name: "Posture", description: "Stand tall, shoulders back. Your body influences your mind." },
              { name: "Pace", description: "Speak slower than feels natural. Speed signals panic." },
              { name: "Perspective", description: "Ask: 'What will this matter in a year?' to right-size the situation." }
            ]
          },
          insight: "Calm is contagious. So is panic. Your emotional state sets the team's thermostat."
        }
      },
      {
        id: 'f9-s4',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Power Posture',
        theme: 'presence',
        content: {
          challenge: "Before your next important meeting or presentation, spend 2 minutes in a 'power pose'—feet planted, chest open, hands on hips or stretched wide. Notice how you feel going in.",
          rules: [
            "Do this in private (bathroom, empty office)",
            "Hold for a full 2 minutes—longer than is comfortable",
            "Focus on taking up space",
            "Notice your emotional state before and after"
          ],
          why: "Amy Cuddy's research shows that power posing shifts hormones: increases testosterone, decreases cortisol. You literally feel more confident."
        }
      },
      {
        id: 'f9-s5',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Presence Profile',
        theme: 'presence',
        content: {
          opening: "Let's assess your executive presence honestly.",
          prompts: [
            "Which of the three pillars (Gravitas, Communication, Appearance) is your strength? Which needs work?",
            "How do you typically respond under pressure? Does your team see you as calm or reactive?",
            "What's one specific thing you could change that would increase your presence?"
          ],
          closing: "Presence isn't about being someone you're not. It's about being the most grounded, confident version of yourself."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 10: TIME & PRIORITIES (6 sessions)  
  // ============================================
  {
    id: 'focus-010',
    order: 10,
    phase: 'growth',
    title: 'Time & Priorities',
    subtitle: 'Leading Your Calendar',
    description: 'Master the art of spending time where it matters most.',
    icon: '⏱️',
    gradient: 'from-indigo-500 to-blue-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f10-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Time Truth',
        theme: 'time',
        content: {
          quote: "You will never find time for anything. If you want time, you must make it.",
          author: "Charles Buxton",
          context: "19th-century English brewer and philanthropist",
          reflection: "Where is your time actually going? Do you know, or just feel busy?"
        }
      },
      {
        id: 'f10-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Eisenhower Matrix',
        theme: 'priorities',
        content: {
          opening: "Dwight Eisenhower managed leading the Allied Forces AND becoming President. His secret: distinguishing urgent from important.",
          framework: {
            name: "The Eisenhower Matrix",
            quadrants: [
              { 
                name: "Quadrant 1: Urgent + Important", 
                label: "DO",
                description: "Crises, deadlines, emergencies. Handle immediately.",
                risk: "Living here = burnout. Indicates poor planning or boundary issues."
              },
              { 
                name: "Quadrant 2: Not Urgent + Important", 
                label: "SCHEDULE",
                description: "Strategy, relationships, development, prevention. Where leaders should live.",
                key: "If you don't schedule Q2, it never happens. Q1 always seems more pressing."
              },
              { 
                name: "Quadrant 3: Urgent + Not Important", 
                label: "DELEGATE",
                description: "Interruptions, some meetings, some emails. Feels urgent but doesn't move the needle.",
                trap: "This is where most people spend their day and wonder why nothing important gets done."
              },
              { 
                name: "Quadrant 4: Not Urgent + Not Important", 
                label: "ELIMINATE",
                description: "Busywork, time-wasters, pleasant distractions.",
                truth: "Be honest about how much time goes here."
              }
            ]
          },
          insight: "The best leaders spend 60%+ of their time in Quadrant 2. Most spend less than 20%."
        }
      },
      {
        id: 'f10-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Time Blocking',
        theme: 'time',
        content: {
          opening: "If it's not on your calendar, it's not real.",
          lesson: "Time blocking is the practice of assigning every hour of your day to a specific purpose—before the day starts. It's the antidote to reactive work.",
          framework: {
            name: "Time Blocking Rules",
            rules: [
              { name: "Block your priorities first", description: "Before anything else, schedule your Q2 work: thinking time, 1:1s, learning." },
              { name: "Batch similar work", description: "Group emails, meetings, creative work. Context-switching is expensive." },
              { name: "Build in buffer", description: "Things take longer than expected. Leave 30% slack." },
              { name: "Protect your blocks", description: "Treat them like doctor's appointments—non-negotiable." },
              { name: "Review and adjust weekly", description: "What worked? What didn't? Iterate." }
            ]
          },
          insight: "You don't 'find' time. You design it."
        }
      },
      {
        id: 'f10-s4',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Calendar Hijack',
        theme: 'time',
        content: {
          setup: "You've blocked 2 hours this morning for strategic planning—true Quadrant 2 work. Your boss's assistant calls: 'Can you join a meeting in 30 minutes? It's about next quarter's budget.' You have no context on whether you're essential.",
          question: "What do you do?",
          options: [
            {
              choice: "Ask clarifying questions first",
              analysis: "Best option. 'Can you tell me what's needed from me specifically? I have strategic work blocked that I'd need to move.' Get information before deciding."
            },
            {
              choice: "Accept immediately",
              analysis: "The default response—but it signals your time is infinitely flexible. You just traded Q2 for Q3."
            },
            {
              choice: "Decline—you're committed",
              analysis: "Bold, but without information you might be declining something truly important. Ask first."
            }
          ],
          principle: "Your yes is only valuable if you're willing to say no. Ask questions before committing."
        }
      },
      {
        id: 'f10-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Time Audit',
        theme: 'time',
        content: {
          challenge: "For the next 3 days, track every activity in 30-minute increments. At the end, categorize each block into Eisenhower quadrants. Be ruthlessly honest.",
          rules: [
            "Track as you go—memory is unreliable",
            "Include everything: calls, 'quick' checks, context-switching",
            "At the end, calculate: What % was Q1? Q2? Q3? Q4?",
            "Identify the top 3 time thieves"
          ],
          why: "What gets measured gets managed. Most leaders are shocked by where their time actually goes."
        }
      },
      {
        id: 'f10-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Redesigning Your Week',
        theme: 'time',
        content: {
          opening: "Let's apply what you've learned to create an ideal week.",
          prompts: [
            "What's your biggest Quadrant 3 time-waster? How can you eliminate or reduce it?",
            "What Quadrant 2 activity deserves a protected time block? When will you schedule it?",
            "What's one commitment you could say no to that would free up meaningful time?"
          ],
          closing: "You can't manage time. You can only manage priorities. What's truly important gets the time."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 11: MOTIVATION & ENGAGEMENT (6 sessions)
  // ============================================
  {
    id: 'focus-011',
    order: 11,
    phase: 'growth',
    title: 'Motivation & Engagement',
    subtitle: 'Igniting Your Team',
    description: 'Understand what truly drives people and create environments where they thrive.',
    icon: '🔥',
    gradient: 'from-orange-500 to-red-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f11-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Motivation Myth',
        theme: 'motivation',
        content: {
          quote: "People are not your most important asset. The RIGHT people are.",
          author: "Jim Collins",
          context: "From 'Good to Great'",
          reflection: "Motivation isn't about tricks—it's about fit, purpose, and environment. You can't motivate someone who doesn't want to be there."
        }
      },
      {
        id: 'f11-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'The Puzzle of Motivation',
        theme: 'motivation',
        content: {
          videoTitle: "Dan Pink: The Puzzle of Motivation",
          videoUrl: "https://www.youtube.com/watch?v=rrkrvAUbU9Y",
          duration: "18 minutes",
          description: "Dan Pink challenges everything we think we know about motivation. Spoiler: carrots and sticks don't work for complex work.",
          watchFor: "The three elements of intrinsic motivation: Autonomy, Mastery, and Purpose. Notice how they apply to YOUR team.",
          discussionPrompt: "Which of the three—autonomy, mastery, or purpose—is most lacking on your team right now?"
        }
      },
      {
        id: 'f11-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Autonomy, Mastery, Purpose',
        theme: 'motivation',
        content: {
          opening: "Dan Pink's research shows that for complex, creative work, intrinsic motivation beats external rewards every time.",
          framework: {
            name: "The Three Pillars of Intrinsic Motivation",
            pillars: [
              {
                name: "Autonomy",
                description: "The desire to direct our own lives.",
                leader_action: "Give people control over task, time, technique, or team when possible.",
                question: "Where could you give more autonomy this week?"
              },
              {
                name: "Mastery",
                description: "The urge to get better at something that matters.",
                leader_action: "Provide stretch assignments, feedback, and time for skill development.",
                question: "Who on your team is ready for a growth opportunity?"
              },
              {
                name: "Purpose",
                description: "The yearning to do what we do in service of something larger than ourselves.",
                leader_action: "Connect daily work to meaningful outcomes. Answer 'why this matters.'",
                question: "When did you last explain the WHY behind the work?"
              }
            ]
          },
          insight: "Money is a threshold motivator—pay people enough to take the issue off the table. Beyond that, these three drive performance."
        }
      },
      {
        id: 'f11-s4',
        type: SESSION_TYPES.MISSION,
        title: 'The Motivation Conversation',
        theme: 'motivation',
        content: {
          mission: "Have a 1:1 conversation with one team member specifically about what motivates them. Don't assume—ask.",
          context: "Most leaders guess what motivates their people. The best leaders ask directly and remember the answer.",
          tips: [
            "Ask: 'What part of your work energizes you most?'",
            "Ask: 'What would make this role a 10/10 for you?'",
            "Ask: 'What's one thing I could do to better support you?'",
            "Listen more than you talk—this is about discovery"
          ],
          timeframe: "Complete this mission within the next 48 hours",
          followUp: "What surprised you? What will you do differently based on what you learned?"
        }
      },
      {
        id: 'f11-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Disengaged Star',
        theme: 'engagement',
        content: {
          setup: "Your highest performer has become noticeably disengaged. They're still hitting targets, but the spark is gone. They used to volunteer for projects; now they do the minimum. You suspect they're quietly looking for other opportunities.",
          question: "How do you approach this conversation?",
          options: [
            {
              choice: "Have a direct conversation about what you've noticed",
              analysis: "Best approach. Name the change without accusation: 'I've noticed a shift and I care about your experience here. What's going on?' Show you see them and value them."
            },
            {
              choice: "Offer them a raise or promotion",
              analysis: "Might help short-term, but if the root cause is purpose, autonomy, or growth, money won't fix it. You need to understand the real issue first."
            },
            {
              choice: "Give them space—maybe they'll work through it",
              analysis: "Risky. Silence can feel like indifference. By the time disengaged stars leave, it's usually too late. Act now."
            }
          ],
          principle: "Engagement problems rarely fix themselves. The earlier you address them, the more options you have."
        }
      },
      {
        id: 'f11-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Engagement Strategy',
        theme: 'engagement',
        content: {
          opening: "Let's create a practical plan for boosting engagement on your team.",
          prompts: [
            "Think about your team members individually. Who needs more autonomy? Who needs a growth opportunity? Who needs to reconnect with purpose?",
            "What's one systemic change you could make that would improve engagement for everyone?",
            "What engagement conversation do you need to have that you've been avoiding?"
          ],
          closing: "Engagement is a leading indicator. By the time performance drops, disengagement has been brewing for months. Stay ahead of it."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 12: HIGH-PERFORMING TEAMS (7 sessions)
  // ============================================
  {
    id: 'focus-012',
    order: 12,
    phase: 'growth',
    title: 'High-Performing Teams',
    subtitle: 'From Group to Team',
    description: 'Build teams that achieve more together than individuals ever could alone.',
    icon: '🚀',
    gradient: 'from-blue-600 to-indigo-700',
    estimatedDays: 7,
    sessions: [
      {
        id: 'f12-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Team Advantage',
        theme: 'teams',
        content: {
          quote: "Great things in business are never done by one person. They're done by a team of people.",
          author: "Steve Jobs",
          reflection: "Think about your team right now. Are they a real team—or just a group of individuals who happen to report to the same person?"
        }
      },
      {
        id: 'f12-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Five Dysfunctions',
        theme: 'teams',
        content: {
          opening: "Patrick Lencioni's model shows that team dysfunction cascades. Fix the foundation, and the rest follows.",
          framework: {
            name: "The Five Dysfunctions of a Team (Lencioni)",
            pyramid: [
              {
                level: 1,
                dysfunction: "Absence of Trust",
                description: "Team members unwilling to be vulnerable or admit mistakes.",
                fix: "Leader models vulnerability. Create psychological safety. Build personal connections."
              },
              {
                level: 2,
                dysfunction: "Fear of Conflict",
                description: "Artificial harmony. Important issues don't get debated.",
                fix: "Mine for conflict. Make it safe to disagree. Distinguish productive conflict from personal attacks."
              },
              {
                level: 3,
                dysfunction: "Lack of Commitment",
                description: "Ambiguity about decisions. People don't buy in.",
                fix: "Clarify decisions. Ensure everyone's voice is heard. Commit even when you disagree."
              },
              {
                level: 4,
                dysfunction: "Avoidance of Accountability",
                description: "Hesitation to call out peers on performance or behavior.",
                fix: "Make expectations clear. Create peer-to-peer accountability culture."
              },
              {
                level: 5,
                dysfunction: "Inattention to Results",
                description: "Individual ego or department success over team outcomes.",
                fix: "Define shared goals. Celebrate team wins. Make collective results visible."
              }
            ]
          },
          insight: "Start at the bottom. You can't have accountability without commitment. You can't have commitment without healthy conflict. You can't have healthy conflict without trust."
        }
      },
      {
        id: 'f12-s3',
        type: SESSION_TYPES.VIDEO,
        title: 'Building Psychological Safety',
        theme: 'teams',
        content: {
          videoTitle: "Amy Edmondson: Building a Psychologically Safe Workplace",
          videoUrl: "https://www.youtube.com/watch?v=LhoLuui9gX8",
          duration: "11 minutes",
          description: "Harvard professor Amy Edmondson explains why psychological safety is THE critical factor in team performance—and how to create it.",
          watchFor: "The difference between psychological safety and 'being nice.' Notice how Google's Project Aristotle confirms this.",
          discussionPrompt: "On a scale of 1-10, how psychologically safe is your team? What's one thing you could do to raise that number?"
        }
      },
      {
        id: 'f12-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Team Norms That Work',
        theme: 'teams',
        content: {
          opening: "High-performing teams aren't accidents. They have explicit norms—agreements about how they operate.",
          lesson: "Norms are the unwritten (or better, written) rules of engagement. When they're implicit, they're inconsistent.",
          framework: {
            name: "Essential Team Norms to Define",
            categories: [
              {
                area: "Communication",
                questions: ["How quickly do we respond to messages?", "When do we use email vs. Slack vs. meetings?", "How do we handle after-hours communication?"]
              },
              {
                area: "Meetings",
                questions: ["What's required for a meeting to happen?", "How do we handle running over time?", "What does 'camera on' mean for us?"]
              },
              {
                area: "Decisions",
                questions: ["Who makes what decisions?", "How do we handle disagreement?", "When is consensus required vs. leader decides?"]
              },
              {
                area: "Conflict",
                questions: ["How do we raise concerns?", "Is it okay to disagree in meetings?", "How do we handle issues between team members?"]
              },
              {
                area: "Feedback",
                questions: ["How often do we give feedback?", "Is it public or private?", "How do we hold each other accountable?"]
              }
            ]
          },
          insight: "The best teams co-create their norms. Don't dictate—facilitate a discussion and document what you agree on."
        }
      },
      {
        id: 'f12-s5',
        type: SESSION_TYPES.MISSION,
        title: 'The Team Health Check',
        theme: 'teams',
        content: {
          mission: "Facilitate a 15-minute discussion at your next team meeting using ONE question: 'What's one thing we could do differently to work better together?'",
          context: "This simple question opens the door to honest conversation about team dynamics without making it heavy.",
          tips: [
            "Set it up: 'I want us to keep getting better as a team. I have one question.'",
            "Give people a minute to think before sharing",
            "Write down what you hear—show it matters",
            "Pick ONE thing to actually change based on the conversation",
            "Follow up next meeting on how it went"
          ],
          timeframe: "Do this at your next team meeting",
          followUp: "What emerged? What will you do about it?"
        }
      },
      {
        id: 'f12-s6',
        type: SESSION_TYPES.ROLEPLAY,
        title: 'Practice: Addressing Team Dysfunction',
        theme: 'teams',
        content: {
          setup: "Let's practice addressing a team dysfunction directly but constructively.",
          situation: "Your team has a pattern of agreeing in meetings, then complaining privately afterward. Decisions get relitigated. You want to address this pattern with the team.",
          yourRole: "The leader opening this conversation at a team meeting",
          myRole: "Your team (I'll respond as team members would)",
          myRoleDescription: "I'll play a somewhat defensive team. Some will be receptive, others might push back or deflect. A realistic response.",
          goal: "Name the pattern without blaming, get buy-in to change it, and agree on a new norm.",
          coachingNotes: "Look for: Do they name the pattern clearly? Do they take ownership ('we' not 'you')? Do they invite dialogue? Do they propose a concrete change?"
        }
      },
      {
        id: 'f12-s7',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Team Transformation Plan',
        theme: 'teams',
        content: {
          opening: "Let's create an actionable plan for strengthening your team.",
          prompts: [
            "Using Lencioni's model, which dysfunction is most present on your team right now?",
            "What's one norm your team needs to establish or clarify?",
            "What's your first step this week to address your team's biggest gap?"
          ],
          closing: "Great teams don't happen by accident. They're built intentionally, one conversation, one norm, one moment of trust at a time."
        }
      }
    ]
  },

  // ============================================
  // MASTERY PHASE (Focuses 13-20)
  // Excellence & influence at the highest level
  // ============================================

  // ============================================
  // FOCUS 13: STRATEGIC THINKING (6 sessions)
  // ============================================
  {
    id: 'focus-013',
    order: 13,
    phase: 'mastery',
    title: 'Strategic Thinking',
    subtitle: 'Seeing the Bigger Picture',
    description: 'Develop the ability to think beyond tactics and shape the future.',
    icon: '🎯',
    gradient: 'from-emerald-600 to-teal-700',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f13-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'Strategy vs. Tactics',
        theme: 'strategy',
        content: {
          quote: "Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat.",
          author: "Sun Tzu",
          context: "Ancient Chinese military strategist, 'The Art of War'",
          reflection: "How much of your time is spent on tactics (doing things right) vs. strategy (doing the right things)?"
        }
      },
      {
        id: 'f13-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Strategic Leader\'s Mindset',
        theme: 'strategy',
        content: {
          opening: "Strategic thinking isn't about being smarter—it's about zooming out, asking different questions, and seeing patterns.",
          framework: {
            name: "Five Questions Strategic Thinkers Ask",
            questions: [
              {
                question: "What game are we actually playing?",
                explanation: "Are you competing on price? Innovation? Service? You can't win if you don't know the game."
              },
              {
                question: "What's changing that we haven't adapted to?",
                explanation: "Strategic thinkers see shifts early—technology, customer behavior, market dynamics."
              },
              {
                question: "What would we do if we were starting fresh today?",
                explanation: "Legacy decisions create blind spots. This question exposes what you're doing just because 'we've always done it.'"
              },
              {
                question: "What are we NOT doing that we should be?",
                explanation: "Strategy is as much about what you choose not to do as what you choose to do."
              },
              {
                question: "If this succeeds wildly, then what?",
                explanation: "Second-order thinking. What happens after you win? Strategic leaders think ahead."
              }
            ]
          },
          insight: "Schedule time to think strategically. It won't happen in the margins of a busy day."
        }
      },
      {
        id: 'f13-s3',
        type: SESSION_TYPES.BOOK,
        title: 'Good Strategy Bad Strategy',
        theme: 'strategy',
        content: {
          book: {
            title: "Good Strategy Bad Strategy",
            author: "Richard Rumelt",
            year: 2011,
            synopsis: "Rumelt argues that most 'strategies' are actually just goals or wishful thinking. Good strategy has three elements: a diagnosis of the challenge, a guiding policy, and coherent actions.",
            keyInsight: "Bad strategy is fluffy goals and buzzwords. Good strategy honestly diagnoses the obstacle, makes hard choices, and focuses resources on a decisive point.",
            leadershipConnection: "As a leader, your job is to identify the ONE thing that would make the biggest difference—and focus disproportionate resources there.",
            actionableIdea: "What's the KERNEL of your current strategy? Can you state the diagnosis, guiding policy, and key actions in one paragraph?"
          }
        }
      },
      {
        id: 'f13-s4',
        type: SESSION_TYPES.REFLECTION,
        title: 'Your Strategic Blind Spots',
        theme: 'strategy',
        content: {
          opening: "Every leader has strategic blind spots—assumptions we don't question, trends we don't see.",
          prompt: "What belief about your industry, team, or role might be outdated? What are you assuming is true that might not be?",
          deeperPrompt: "Who sees things differently than you? What might they be right about?",
          insight: "The most dangerous strategic mistakes come not from bad analysis, but from unquestioned assumptions."
        }
      },
      {
        id: 'f13-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The 30-Minute Strategy Session',
        theme: 'strategy',
        content: {
          challenge: "Block 30 minutes this week for pure strategic thinking. No email, no tasks—just thinking about the bigger picture.",
          rules: [
            "Put it on your calendar as a real appointment",
            "Go somewhere different—a coffee shop, a walk, anywhere but your desk",
            "Bring ONE strategic question to think about",
            "Write down what emerges, even if it's messy"
          ],
          why: "Strategic thinking requires space. Leaders who don't create that space get trapped in the operational weeds forever."
        }
      },
      {
        id: 'f13-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Strategic Priorities',
        theme: 'strategy',
        content: {
          opening: "Let's translate strategic thinking into strategic action.",
          prompts: [
            "What's the single biggest challenge or opportunity facing your team/organization right now? State it clearly.",
            "What's your guiding policy—the approach you're taking to address it?",
            "What are 2-3 coherent actions that would make the biggest impact?"
          ],
          closing: "A clear strategy on one page beats a 50-page deck. Simplicity forces clarity."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 14: LEADING CHANGE (7 sessions)
  // ============================================
  {
    id: 'focus-014',
    order: 14,
    phase: 'mastery',
    title: 'Leading Change',
    subtitle: 'Making Change Stick',
    description: 'Master the art of leading people through change without losing them.',
    icon: '🔄',
    gradient: 'from-purple-600 to-pink-600',
    estimatedDays: 7,
    sessions: [
      {
        id: 'f14-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Change Reality',
        theme: 'change',
        content: {
          quote: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.",
          author: "Charles Darwin (paraphrased)",
          reflection: "Change is the only constant. The question isn't whether you'll face change—it's whether you'll lead it or be dragged by it."
        }
      },
      {
        id: 'f14-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Change Curve',
        theme: 'change',
        content: {
          opening: "People move through change in predictable stages. Understanding this helps you lead them through it.",
          framework: {
            name: "The Kübler-Ross Change Curve (Adapted for Organizations)",
            stages: [
              {
                stage: "Shock",
                description: "Initial surprise and disorientation.",
                leader_action: "Acknowledge the disruption. Give people time to absorb."
              },
              {
                stage: "Denial",
                description: "'This won't really affect me' or 'This will blow over.'",
                leader_action: "Be clear and consistent. Repeat the message."
              },
              {
                stage: "Frustration/Anger",
                description: "Resistance emerges. 'Why are we doing this?'",
                leader_action: "Listen without defensiveness. Validate emotions while holding the line."
              },
              {
                stage: "Depression/Confusion",
                description: "Energy drops. The old way is gone, the new way isn't working yet.",
                leader_action: "Provide support and quick wins. This is the hardest stage."
              },
              {
                stage: "Experiment",
                description: "People start trying the new approach.",
                leader_action: "Celebrate early adopters. Make it safe to fail."
              },
              {
                stage: "Decision/Integration",
                description: "The new way becomes the way.",
                leader_action: "Reinforce the change. Share success stories."
              }
            ]
          },
          insight: "People move through these stages at different speeds. Your early adopters will be in 'experiment' while others are still in 'denial.' That's normal."
        }
      },
      {
        id: 'f14-s3',
        type: SESSION_TYPES.VIDEO,
        title: 'Leading Change That Sticks',
        theme: 'change',
        content: {
          videoTitle: "John Kotter: Why Transformation Efforts Fail",
          videoUrl: "https://www.youtube.com/watch?v=Wdroj6F3VlQ",
          duration: "8 minutes",
          description: "John Kotter, the leading authority on change management, explains the 8 steps to successful organizational change.",
          watchFor: "The importance of creating urgency and building a guiding coalition BEFORE you launch change.",
          discussionPrompt: "Think about a change that failed in your organization. Which of Kotter's steps was missing?"
        }
      },
      {
        id: 'f14-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Kotter\'s 8 Steps',
        theme: 'change',
        content: {
          opening: "Kotter's research shows that 70% of change initiatives fail. His 8-step model dramatically improves the odds.",
          framework: {
            name: "Kotter's 8-Step Change Model",
            steps: [
              { step: 1, name: "Create Urgency", key: "Why must we change NOW? Make the status quo more dangerous than the change." },
              { step: 2, name: "Build a Guiding Coalition", key: "Assemble a group with enough power and credibility to lead the change." },
              { step: 3, name: "Form a Strategic Vision", key: "Create a clear, compelling picture of the future." },
              { step: 4, name: "Enlist a Volunteer Army", key: "Communicate the vision so people want to join, not because they're told to." },
              { step: 5, name: "Enable Action by Removing Barriers", key: "Remove obstacles—systems, structures, or people—blocking progress." },
              { step: 6, name: "Generate Short-Term Wins", key: "Create visible, unambiguous success quickly. Nothing builds momentum like success." },
              { step: 7, name: "Sustain Acceleration", key: "Use credibility from wins to tackle bigger challenges. Don't declare victory too soon." },
              { step: 8, name: "Institute Change", key: "Anchor new behaviors in culture. Make it 'how we do things here.'" }
            ]
          },
          insight: "Most failed changes skip steps 1-4. Leaders jump straight to 'just do it' without creating urgency or coalition. The foundation matters."
        }
      },
      {
        id: 'f14-s5',
        type: SESSION_TYPES.ROLEPLAY,
        title: 'Practice: Announcing Difficult Change',
        theme: 'change',
        content: {
          setup: "Let's practice communicating a significant change to your team in a way that builds buy-in rather than resistance.",
          situation: "Your organization is restructuring. Your team will be merged with another team under a new structure. Some roles may change. You need to announce this at your next team meeting.",
          yourRole: "The leader announcing this change",
          myRole: "Your team members hearing this for the first time",
          myRoleDescription: "I'll respond with realistic reactions—some anxious questions, some skepticism, maybe some pushback. A few will be cautiously supportive.",
          goal: "Communicate the change clearly, acknowledge the emotional impact, and create a sense of forward momentum.",
          coachingNotes: "Watch for: Do they lead with why? Do they acknowledge feelings? Do they leave room for questions? Do they show confidence without dismissing concerns?"
        }
      },
      {
        id: 'f14-s6',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Change Resistor',
        theme: 'change',
        content: {
          setup: "You're implementing a significant process change. Most of the team is on board, but one influential team member is actively resisting—not just passively, but vocally challenging the change in meetings and private conversations.",
          question: "How do you handle this person without alienating them or letting them derail the change?",
          options: [
            {
              choice: "Have a private, direct conversation to understand their concerns",
              analysis: "Best first step. Often resistors have legitimate concerns that weren't addressed. They may also have influence you can leverage if you convert them."
            },
            {
              choice: "Address it publicly in the next meeting",
              analysis: "Risky. This can feel like calling them out and may increase resistance. Better to start private."
            },
            {
              choice: "Move forward and let results speak for themselves",
              analysis: "Dangerous. An influential resistor can slow momentum and convert others. Unaddressed resistance festers."
            }
          ],
          principle: "Resistors often have information you need or influence you want. Engage them early, directly, and with genuine curiosity."
        }
      },
      {
        id: 'f14-s7',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Change Leadership Plan',
        theme: 'change',
        content: {
          opening: "Let's apply change leadership to a real situation you're facing.",
          prompts: [
            "What change are you currently leading or about to lead? Describe it briefly.",
            "Using Kotter's model, which step are you on? Which steps have you skipped or underinvested in?",
            "Who are your potential resistors? What might they be concerned about? How will you engage them?"
          ],
          closing: "Change leadership is a skill. The more intentionally you apply these frameworks, the better you get. And your people notice."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 15: BUILDING CULTURE (6 sessions)
  // ============================================
  {
    id: 'focus-015',
    order: 15,
    phase: 'mastery',
    title: 'Building Culture',
    subtitle: 'Shaping How Work Gets Done',
    description: 'Create and sustain a culture that attracts talent and drives results.',
    icon: '🏛️',
    gradient: 'from-amber-500 to-orange-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f15-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'Culture Eats Strategy',
        theme: 'culture',
        content: {
          quote: "Culture eats strategy for breakfast.",
          author: "Peter Drucker",
          reflection: "You can have the best strategy in the world, but if your culture doesn't support it, execution will fail. Culture is the invisible operating system."
        }
      },
      {
        id: 'f15-s2',
        type: SESSION_TYPES.LESSON,
        title: 'What Culture Actually Is',
        theme: 'culture',
        content: {
          opening: "Culture isn't ping pong tables and free snacks. It's the behaviors that get rewarded, tolerated, and punished.",
          framework: {
            name: "The Three Levels of Culture (Edgar Schein)",
            levels: [
              {
                level: "Artifacts",
                description: "The visible stuff—office design, dress code, perks, rituals.",
                insight: "Easy to see, easy to copy, but superficial. Ping pong tables don't create culture."
              },
              {
                level: "Espoused Values",
                description: "What we SAY we value—our mission statement, core values, official policies.",
                insight: "These matter only if they're lived. Values on a wall mean nothing if behavior contradicts them."
              },
              {
                level: "Basic Assumptions",
                description: "The unspoken, often unconscious beliefs that really drive behavior.",
                insight: "This is the real culture. 'We say we value work-life balance, but everyone knows the top performers are here at 8pm.'"
              }
            ]
          },
          insight: "To understand your real culture, ignore what's written. Watch what gets rewarded, what gets tolerated, and what gets you fired."
        }
      },
      {
        id: 'f15-s3',
        type: SESSION_TYPES.VIDEO,
        title: 'Netflix\'s Culture of Freedom & Responsibility',
        theme: 'culture',
        content: {
          videoTitle: "Netflix Culture - Explained by Reed Hastings",
          videoUrl: "https://www.youtube.com/watch?v=o3e1lnixKBM",
          duration: "15 minutes",
          description: "Netflix CEO Reed Hastings explains their famous culture deck—one of the most influential documents in business. Love it or hate it, it's intentional.",
          watchFor: "How they explicitly state what they value AND what they don't. Notice the 'keeper test' and unlimited vacation concepts.",
          discussionPrompt: "What elements of Netflix's culture would work for your team? What wouldn't? Why?"
        }
      },
      {
        id: 'f15-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Culture Is What You Tolerate',
        theme: 'culture',
        content: {
          opening: "The most powerful statement of culture isn't what you celebrate—it's what you tolerate.",
          lesson: "Every time you ignore bad behavior from a high performer, you're saying 'results matter more than values.' Every time you let a toxic person stay because they're productive, you're telling everyone what the REAL culture is.",
          framework: {
            name: "The Culture Test Questions",
            questions: [
              "What behavior do we tolerate from top performers that we wouldn't accept from others?",
              "What's the last value violation that had real consequences?",
              "What do people complain about in private that never gets addressed?",
              "What would a new hire find surprising about how we really work?"
            ]
          },
          insight: "Your culture isn't what you proclaim. It's what you permit."
        }
      },
      {
        id: 'f15-s5',
        type: SESSION_TYPES.MISSION,
        title: 'The Culture Observation',
        theme: 'culture',
        content: {
          mission: "Spend one day consciously observing your team's actual culture—not what's supposed to happen, but what really happens.",
          context: "We're often too close to see our own culture clearly. This exercise builds awareness.",
          tips: [
            "Notice: How do people behave in meetings? Who talks, who listens, who gets interrupted?",
            "Notice: What gets celebrated? What gets ignored?",
            "Notice: How do people respond to bad news or mistakes?",
            "Notice: What happens when someone disagrees with leadership?",
            "Write down specific observations, not judgments"
          ],
          timeframe: "One full day of observation, then reflect",
          followUp: "What did you notice that you hadn't seen before? What surprised you?"
        }
      },
      {
        id: 'f15-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Culture Blueprint',
        theme: 'culture',
        content: {
          opening: "Let's define the culture you want to build—and the gap between that and today.",
          prompts: [
            "Describe your ideal team culture in 3-5 specific behaviors (not values). What would someone see if they observed your team?",
            "What's the biggest gap between your current culture and that ideal?",
            "What's one thing you're currently tolerating that contradicts your desired culture? What would it take to address it?"
          ],
          closing: "Culture change is slow but it compounds. Every day you model the desired behavior, you're shaping the culture. Start now."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 16: INFLUENCE & PERSUASION (6 sessions)
  // ============================================
  {
    id: 'focus-016',
    order: 16,
    phase: 'mastery',
    title: 'Influence & Persuasion',
    subtitle: 'Leading Without Authority',
    description: 'Master the art of influence when you can\'t rely on position power.',
    icon: '🎭',
    gradient: 'from-rose-500 to-pink-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f16-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Influence Imperative',
        theme: 'influence',
        content: {
          quote: "Leadership is not about titles, positions, or flowcharts. It is about one life influencing another.",
          author: "John Maxwell",
          reflection: "The higher you rise, the more you need to influence people you don't control—peers, stakeholders, executives, partners. Position power only gets you so far."
        }
      },
      {
        id: 'f16-s2',
        type: SESSION_TYPES.LESSON,
        title: 'Cialdini\'s Principles of Influence',
        theme: 'influence',
        content: {
          opening: "Robert Cialdini's research identified six universal principles of influence. Used ethically, they're powerful leadership tools.",
          framework: {
            name: "The 6 Principles of Influence",
            principles: [
              {
                name: "Reciprocity",
                description: "People feel obligated to return favors.",
                application: "Give first. Help others before you need something. Build goodwill deposits."
              },
              {
                name: "Commitment & Consistency",
                description: "People want to be consistent with what they've already said or done.",
                application: "Get small commitments first. Ask 'Do you agree this is important?' before asking for action."
              },
              {
                name: "Social Proof",
                description: "People look to others to determine correct behavior.",
                application: "Show who else is on board. 'The leadership team has aligned on this' carries weight."
              },
              {
                name: "Authority",
                description: "People defer to experts.",
                application: "Establish credibility early. Reference your experience or bring in experts who support your position."
              },
              {
                name: "Liking",
                description: "People say yes to people they like.",
                application: "Build relationships before you need them. Find common ground. Be genuinely interested."
              },
              {
                name: "Scarcity",
                description: "People value what's rare or exclusive.",
                application: "Highlight what's unique about the opportunity. 'We have a narrow window to act on this.'"
              }
            ]
          },
          insight: "These principles work because they're wired into human psychology. Use them to help people make good decisions, not to manipulate."
        }
      },
      {
        id: 'f16-s3',
        type: SESSION_TYPES.BOOK,
        title: 'Influence Without Authority',
        theme: 'influence',
        content: {
          book: {
            title: "Influence Without Authority",
            author: "Allan Cohen & David Bradford",
            year: 2005,
            synopsis: "Cohen and Bradford introduce the 'currencies' model: everyone has something others value—resources, information, recognition, support. Influence is about exchange.",
            keyInsight: "To influence, understand what the other person values (their 'currency') and find ways to offer it in exchange for what you need.",
            leadershipConnection: "Map your stakeholders. What does each one value? Recognition? Information? Access? Support for their goals? That's how you influence them.",
            actionableIdea: "Think of someone you need to influence. What's their currency? What can you offer them?"
          }
        }
      },
      {
        id: 'f16-s4',
        type: SESSION_TYPES.ROLEPLAY,
        title: 'Practice: Influencing Up',
        theme: 'influence',
        content: {
          setup: "One of the hardest influence challenges: getting a senior leader to support your idea when they're skeptical.",
          situation: "You want to propose a new initiative to your boss's boss. They're known for being data-driven and skeptical of 'soft' initiatives. You believe this project would significantly improve team performance.",
          yourRole: "A leader pitching an initiative to a skeptical senior executive",
          myRole: "The senior executive—skeptical, time-pressured, focused on results",
          myRoleDescription: "I'm tough but fair. I'll ask hard questions. I need to see the business case and don't have patience for vague promises. Convince me.",
          goal: "Get my agreement to pilot the initiative or at least a follow-up meeting.",
          coachingNotes: "Watch for: Do they lead with business impact? Do they anticipate objections? Do they ask for a specific next step? Do they stay confident under pressure?"
        }
      },
      {
        id: 'f16-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Peer Blocker',
        theme: 'influence',
        content: {
          setup: "You need a peer's team to prioritize your project, but they keep deprioritizing it. You don't have authority over them. Your boss says to 'work it out.' Their boss isn't getting involved either.",
          question: "How do you get this peer to cooperate?",
          options: [
            {
              choice: "Have a direct conversation to understand their priorities and find mutual benefit",
              analysis: "Best approach. Understand their world. What are they measured on? What pressures are they facing? Find where your goals align."
            },
            {
              choice: "Escalate to your boss to put pressure on their boss",
              analysis: "May work short-term but damages the relationship. They'll cooperate minimally and remember you went over their head."
            },
            {
              choice: "Find another way to achieve your goal without them",
              analysis: "Sometimes necessary, but often there's no substitute. Don't give up on influence too quickly."
            }
          ],
          principle: "With peers, you have no authority. You have only influence. Invest in understanding their world before asking for their help."
        }
      },
      {
        id: 'f16-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Influence Map',
        theme: 'influence',
        content: {
          opening: "Let's build a practical influence strategy for a real situation.",
          prompts: [
            "Who do you most need to influence right now? Why?",
            "What's their 'currency'—what do they value most? What pressures are they facing?",
            "Which of Cialdini's principles could you apply? What's your approach?"
          ],
          closing: "Influence is a skill that compounds. Every successful influence interaction builds your reputation and your relationships. Invest intentionally."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 17: LEADING THROUGH CRISIS (6 sessions)
  // ============================================
  {
    id: 'focus-017',
    order: 17,
    phase: 'mastery',
    title: 'Leading Through Crisis',
    subtitle: 'Calm in the Storm',
    description: 'Develop the presence and skills to lead effectively when everything is uncertain.',
    icon: '🌊',
    gradient: 'from-slate-600 to-gray-800',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f17-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Crisis Test',
        theme: 'crisis',
        content: {
          quote: "In a crisis, be aware of the danger—but recognize the opportunity.",
          author: "John F. Kennedy",
          reflection: "Crisis reveals character. It's also when leaders are most watched, most needed, and most remembered. How you show up in crisis defines your legacy."
        }
      },
      {
        id: 'f17-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Crisis Leadership Playbook',
        theme: 'crisis',
        content: {
          opening: "Crisis leadership requires a different mode than normal operations. Here's what changes.",
          framework: {
            name: "The Four Shifts in Crisis",
            shifts: [
              {
                from: "Distributed decisions",
                to: "Centralized command",
                why: "In crisis, speed matters. Clearer decision rights reduce confusion.",
                but: "Still communicate the 'why' so people can adapt when you can't be reached."
              },
              {
                from: "Long-term planning",
                to: "Short planning cycles",
                why: "The situation changes rapidly. Plan in days or weeks, not months.",
                but: "Keep sight of where you're trying to end up. Tactics serve strategy."
              },
              {
                from: "Normal communication cadence",
                to: "Overcommunication",
                why: "Silence breeds anxiety. In uncertainty, people fill the void with worst-case scenarios.",
                but: "Be honest about what you don't know. False certainty destroys trust."
              },
              {
                from: "Performance focus",
                to: "Wellbeing + performance",
                why: "People can't perform if they're overwhelmed. Check on people, not just tasks.",
                but: "Don't eliminate accountability. People still need to deliver."
              }
            ]
          },
          insight: "Crisis leadership isn't about having all the answers. It's about projecting calm confidence while acknowledging uncertainty."
        }
      },
      {
        id: 'f17-s3',
        type: SESSION_TYPES.VIDEO,
        title: 'Leadership in Uncertain Times',
        theme: 'crisis',
        content: {
          videoTitle: "Jacinda Ardern: Leadership in Crisis",
          videoUrl: "https://www.youtube.com/watch?v=Tcr6qXd3qMI",
          duration: "12 minutes",
          description: "Study how former New Zealand PM Jacinda Ardern communicated during crisis—combining empathy, clarity, and decisiveness.",
          watchFor: "How she acknowledges fear while projecting confidence. Notice her language: 'we' not 'I', specific actions people can take, authentic emotion.",
          discussionPrompt: "What can you take from her approach that would work in your context?"
        }
      },
      {
        id: 'f17-s4',
        type: SESSION_TYPES.LESSON,
        title: 'The Stockdale Paradox',
        theme: 'crisis',
        content: {
          opening: "Admiral Jim Stockdale survived 7 years as a POW. His philosophy for endurance became a framework for crisis leadership.",
          framework: {
            name: "The Stockdale Paradox",
            essence: "Confront the brutal facts of your current reality AND maintain unwavering faith that you will prevail in the end.",
            balance: [
              {
                side: "Face Reality",
                description: "Don't sugarcoat. Acknowledge what's hard. Deal with facts, not wishful thinking.",
                danger: "Without faith, this becomes despair."
              },
              {
                side: "Keep Faith",
                description: "Believe that you will prevail. Maintain a vision of the other side.",
                danger: "Without realism, this becomes delusion."
              }
            ],
            stockdale_quote: "You must never confuse faith that you will prevail in the end—which you can never afford to lose—with the discipline to confront the most brutal facts of your current reality."
          },
          insight: "Leaders who lie to their teams about how bad things are destroy trust. Leaders who can't see beyond the crisis destroy hope. You need both truth and hope."
        }
      },
      {
        id: 'f17-s5',
        type: SESSION_TYPES.REFLECTION,
        title: 'Your Crisis Response',
        theme: 'crisis',
        content: {
          opening: "Think about a crisis you've lived through—as a leader or team member.",
          prompt: "What did leadership do well? What did they do poorly? How did their response affect your trust and engagement?",
          deeperPrompt: "If you were leading that crisis, what would you do differently?",
          insight: "Every crisis you observe is a case study. Learn from others' successes and mistakes."
        }
      },
      {
        id: 'f17-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Crisis Preparedness',
        theme: 'crisis',
        content: {
          opening: "Crises come unannounced. The best time to prepare is before you need it.",
          prompts: [
            "What's the most likely crisis that could hit your team in the next year? How prepared are you?",
            "If a crisis hit tomorrow, what would your first 3 actions be? Who would you contact?",
            "What relationships should you strengthen now that you'll need during a crisis?"
          ],
          closing: "You can't predict every crisis, but you can prepare your mindset, your relationships, and your playbook. That preparation shows when it matters most."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 18: DEVELOPING LEADERS (6 sessions)
  // ============================================
  {
    id: 'focus-018',
    order: 18,
    phase: 'mastery',
    title: 'Developing Leaders',
    subtitle: 'Building Your Bench',
    description: 'Multiply your impact by developing other leaders who can lead without you.',
    icon: '🌱',
    gradient: 'from-green-600 to-emerald-700',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f18-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Ultimate Test',
        theme: 'developing-leaders',
        content: {
          quote: "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.",
          author: "Jack Welch",
          context: "Former CEO of General Electric",
          reflection: "Your ultimate measure as a leader isn't what you accomplish—it's what your people accomplish and who they become."
        }
      },
      {
        id: 'f18-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Leadership Pipeline',
        theme: 'developing-leaders',
        content: {
          opening: "Most organizations under-invest in developing leaders until there's a gap. By then, it's too late.",
          framework: {
            name: "Building Your Leadership Pipeline",
            stages: [
              {
                stage: "Identify",
                description: "Spot high-potential future leaders early.",
                questions: ["Who demonstrates initiative beyond their role?", "Who do others naturally follow?", "Who handles ambiguity well?"]
              },
              {
                stage: "Develop",
                description: "Invest in their growth intentionally.",
                methods: ["Stretch assignments", "Exposure to senior leaders", "Formal training", "Your coaching time"]
              },
              {
                stage: "Test",
                description: "Give them real leadership opportunities with stakes.",
                examples: ["Lead a project", "Manage a team temporarily", "Handle a difficult stakeholder"]
              },
              {
                stage: "Promote",
                description: "Move them into leadership roles when ready—not before, not after.",
                key: "Timing matters. Too early breaks them. Too late loses them."
              }
            ]
          },
          insight: "Who on your team could be ready for a leadership role in 1-2 years? What are you doing to develop them?"
        }
      },
      {
        id: 'f18-s3',
        type: SESSION_TYPES.LESSON,
        title: 'The 70-20-10 Model',
        theme: 'developing-leaders',
        content: {
          opening: "Research shows that leadership development is 70% experience, 20% relationships, and 10% formal training.",
          framework: {
            name: "The 70-20-10 Development Model",
            components: [
              {
                percentage: "70%",
                source: "Challenging Experiences",
                description: "Real work that stretches them. Not more of the same—different.",
                your_role: "Give stretch assignments. Let them struggle. Debrief with them.",
                examples: ["Leading a cross-functional project", "Handling a crisis", "Managing up", "Starting something new"]
              },
              {
                percentage: "20%",
                source: "Relationships",
                description: "Learning from others—mentors, coaches, peers, feedback.",
                your_role: "Connect them with senior leaders. Give direct feedback. Be their mentor.",
                examples: ["Mentorship", "Peer coaching", "360 feedback", "Observing great leaders"]
              },
              {
                percentage: "10%",
                source: "Formal Training",
                description: "Courses, workshops, books, programs.",
                your_role: "Invest in good training. More importantly, help them apply it.",
                examples: ["Leadership programs", "Skill workshops", "Executive education"]
              }
            ]
          },
          insight: "Most organizations over-invest in the 10% (training) and under-invest in the 70% (experience). Flip that ratio."
        }
      },
      {
        id: 'f18-s4',
        type: SESSION_TYPES.MISSION,
        title: 'The Development Conversation',
        theme: 'developing-leaders',
        content: {
          mission: "Have a specific development conversation with someone on your team who has leadership potential. Don't talk about their current job—talk about their future.",
          context: "Many high-potential employees leave because no one talks to them about their growth path. This conversation signals you see them and you're invested.",
          tips: [
            "Start with: 'I want to talk about your development and where you could go from here.'",
            "Ask: 'Where do you see yourself in 2-3 years?'",
            "Ask: 'What skills do you want to develop?'",
            "Share what YOU see: 'I think you have potential for X because...'",
            "Agree on ONE development action you'll both commit to"
          ],
          timeframe: "Have this conversation within the next week",
          followUp: "What did you learn about them? What will you do to support their development?"
        }
      },
      {
        id: 'f18-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Flight Risk',
        theme: 'developing-leaders',
        content: {
          setup: "Your strongest emerging leader has just told you they've been approached by another company. They haven't decided yet, but they're considering it. This person is critical to your team's future.",
          question: "How do you handle this conversation?",
          options: [
            {
              choice: "Ask what would make them stay and try to match it",
              analysis: "Good to understand their motivations, but be careful about negotiating in the moment. Counteroffers often fail long-term—if they're looking, there's usually a deeper issue."
            },
            {
              choice: "Have an honest conversation about their career path here",
              analysis: "Best approach. Understand what's driving them to look. Is it money? Growth? Recognition? A better opportunity? Sometimes you can address it. Sometimes you can't—but honest dialogue preserves the relationship."
            },
            {
              choice: "Wish them well—you don't want to keep someone who's looking",
              analysis: "Premature. They came to you, which means they're not certain. There may be something you can do. Don't give up too easily on great talent."
            }
          ],
          principle: "The goal isn't to keep everyone forever. It's to create an environment where great people WANT to stay—and to part well with those who leave."
        }
      },
      {
        id: 'f18-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Development Strategy',
        theme: 'developing-leaders',
        content: {
          opening: "Let's build a practical plan for developing leaders on your team.",
          prompts: [
            "Who are your top 2-3 high-potential future leaders? What evidence tells you they have potential?",
            "For each one: What's ONE stretch experience you could give them in the next quarter?",
            "What's keeping you from investing more time in developing others? How can you address that?"
          ],
          closing: "The leaders you develop today are your legacy tomorrow. Time invested in them is the highest-leverage activity you can do."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 19: ORGANIZATIONAL POLITICS (6 sessions)
  // ============================================
  {
    id: 'focus-019',
    order: 19,
    phase: 'mastery',
    title: 'Organizational Politics',
    subtitle: 'Playing the Game Ethically',
    description: 'Navigate organizational dynamics without compromising your integrity.',
    icon: '♟️',
    gradient: 'from-gray-700 to-slate-800',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f19-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Political Reality',
        theme: 'politics',
        content: {
          quote: "Politics is the art of the possible.",
          author: "Otto von Bismarck",
          reflection: "You can opt out of playing politics, but you can't opt out of its effects. The question isn't whether politics exist—it's whether you'll engage skillfully and ethically."
        }
      },
      {
        id: 'f19-s2',
        type: SESSION_TYPES.LESSON,
        title: 'Political Intelligence',
        theme: 'politics',
        content: {
          opening: "Political intelligence isn't about manipulation. It's about understanding how decisions really get made.",
          framework: {
            name: "The Political Landscape Map",
            elements: [
              {
                element: "Power",
                questions: ["Who holds formal power?", "Who holds informal power?", "Who can make things happen without a title?"]
              },
              {
                element: "Interests",
                questions: ["What does each stakeholder want?", "What are they measured on?", "What threatens them?"]
              },
              {
                element: "Relationships",
                questions: ["Who has alliances?", "Who has conflicts?", "Who influences whom?"]
              },
              {
                element: "Information",
                questions: ["Who knows what?", "How does information flow (and not flow)?", "What are the informal channels?"]
              }
            ]
          },
          insight: "Org charts show formal structure. Political intelligence reveals how things actually work."
        }
      },
      {
        id: 'f19-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Ethical vs. Toxic Politics',
        theme: 'politics',
        content: {
          opening: "There's a big difference between political skill and political toxicity. Know the line.",
          framework: {
            name: "The Ethics of Political Behavior",
            columns: [
              {
                type: "Ethical Political Behavior",
                behaviors: [
                  "Building genuine relationships before you need them",
                  "Understanding stakeholders' interests to find win-wins",
                  "Timing and framing your proposals strategically",
                  "Building coalitions around shared goals",
                  "Managing your reputation by delivering results"
                ]
              },
              {
                type: "Toxic Political Behavior",
                behaviors: [
                  "Taking credit for others' work",
                  "Throwing people under the bus",
                  "Spreading rumors or withholding information",
                  "Sabotaging others to make yourself look good",
                  "Making promises you don't intend to keep"
                ]
              }
            ]
          },
          insight: "The test: Would you be comfortable if everyone knew what you were doing and why? If not, you've crossed the line."
        }
      },
      {
        id: 'f19-s4',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Credit Thief',
        theme: 'politics',
        content: {
          setup: "A peer has a pattern of presenting your ideas to senior leadership as their own. It's happened multiple times now. They're skilled at positioning and have strong relationships with the executive team.",
          question: "How do you handle this without creating an enemy?",
          options: [
            {
              choice: "Document your work and establish ownership before sharing",
              analysis: "Good preventive measure going forward. Send emails that timestamp your contributions. Loop in your boss earlier so your involvement is known."
            },
            {
              choice: "Have a direct conversation with the peer",
              analysis: "Worth trying, but frame it carefully: 'I noticed the idea I shared with you was presented as yours. I'm sure that wasn't intentional, but can we figure out how to give credit where it's due?' Give them a graceful exit."
            },
            {
              choice: "Build direct relationships with executives yourself",
              analysis: "Smart long-term strategy. If executives know you directly, a peer can't misrepresent your contributions as easily. Don't wait to be introduced."
            }
          ],
          principle: "In politics, prevention beats reaction. Establish your presence and document your contributions proactively."
        }
      },
      {
        id: 'f19-s5',
        type: SESSION_TYPES.REFLECTION,
        title: 'Your Political Blind Spots',
        theme: 'politics',
        content: {
          opening: "Many talented leaders stall not because of competence, but because they ignore politics.",
          prompt: "Where might you be politically naive? What dynamics are you not paying attention to? Who might see you as a threat that you haven't considered?",
          deeperPrompt: "Think about someone who is politically skilled but ethical. What do they do that you don't?",
          insight: "Ignoring politics doesn't make you noble. It makes you vulnerable. Engage—just do it with integrity."
        }
      },
      {
        id: 'f19-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Political Strategy',
        theme: 'politics',
        content: {
          opening: "Let's build a political map and strategy for your current environment.",
          prompts: [
            "Who are the 3-5 most important stakeholders for your success? What does each one want? Where are the conflicts between them?",
            "Who are your allies? Who could be? Where should you invest relationship time?",
            "What's one political dynamic you've been avoiding that you need to address?"
          ],
          closing: "You don't have to like politics to be good at them. You just have to engage with intention and integrity."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 20: LEGACY & IMPACT (6 sessions)
  // ============================================
  {
    id: 'focus-020',
    order: 20,
    phase: 'mastery',
    title: 'Legacy & Impact',
    subtitle: 'What You Leave Behind',
    description: 'Define and build the lasting impact you want to have as a leader.',
    icon: '🏆',
    gradient: 'from-yellow-500 to-amber-600',
    estimatedDays: 6,
    sessions: [
      {
        id: 'f20-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Long View',
        theme: 'legacy',
        content: {
          quote: "The greatest use of a life is to spend it on something that will outlast it.",
          author: "William James",
          reflection: "When you're no longer in your role, what will remain? Who will you have shaped? What will have changed because you were there?"
        }
      },
      {
        id: 'f20-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'The Last Lecture',
        theme: 'legacy',
        content: {
          videoTitle: "Randy Pausch: The Last Lecture",
          videoUrl: "https://www.youtube.com/watch?v=ji5_MqicxSo",
          duration: "76 minutes (or watch first 20)",
          description: "Professor Randy Pausch, facing terminal cancer, gave one final lecture on 'Really Achieving Your Childhood Dreams.' It's really about living with purpose and what matters.",
          watchFor: "His emphasis on people over achievements. 'Brick walls are there to show us how badly we want things.' Notice what he focuses on knowing his time is limited.",
          discussionPrompt: "If you had to give a 'last lecture' on leadership, what would you say?"
        }
      },
      {
        id: 'f20-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Three Kinds of Legacy',
        theme: 'legacy',
        content: {
          opening: "Legacy isn't just about grand achievements. It shows up in three dimensions.",
          framework: {
            name: "The Leadership Legacy Framework",
            dimensions: [
              {
                type: "People Legacy",
                description: "The leaders you develop and lives you change.",
                questions: ["Who have you helped grow into leadership?", "Whose career path changed because of you?", "What values did you instill that will carry forward?"],
                longevity: "Highest longevity—people spread your influence beyond your reach."
              },
              {
                type: "Capability Legacy",
                description: "The systems, skills, and strengths you build in the organization.",
                questions: ["What can your team do now that they couldn't before?", "What processes will outlast you?", "What problems did you solve permanently?"],
                longevity: "High longevity if institutionalized."
              },
              {
                type: "Results Legacy",
                description: "The outcomes and achievements under your leadership.",
                questions: ["What did you accomplish?", "What changed because of your work?", "What impact did you have on customers/stakeholders?"],
                longevity: "Medium longevity—results are remembered but fade over time."
              }
            ]
          },
          insight: "Most leaders focus on Results Legacy. The longest-lasting impact comes from People Legacy. Who are you investing in?"
        }
      },
      {
        id: 'f20-s4',
        type: SESSION_TYPES.REFLECTION,
        title: 'The Rocking Chair Test',
        theme: 'legacy',
        content: {
          opening: "Imagine yourself at 80, looking back on your leadership career.",
          prompt: "You're rocking on your porch, reflecting on your years as a leader. What do you hope you'll be proud of? What would you regret not doing? What stories would you want to tell?",
          deeperPrompt: "If former team members were asked about you 10 years from now, what would you want them to say?",
          insight: "No one on their deathbed wishes they had spent more time in meetings or responded to more emails. What will actually matter?"
        }
      },
      {
        id: 'f20-s5',
        type: SESSION_TYPES.MISSION,
        title: 'The Legacy Letter',
        theme: 'legacy',
        content: {
          mission: "Write a short 'legacy letter' to a future leader who will take your role someday. Share the most important lessons you've learned about leadership.",
          context: "This exercise crystallizes your wisdom and forces you to name what matters most. It's also a gift to someone else.",
          tips: [
            "Write as if you're leaving your role tomorrow",
            "Include: What you wish you'd known when you started",
            "Include: The biggest mistakes to avoid",
            "Include: What truly matters in this role",
            "Don't edit too much—let it flow authentically"
          ],
          timeframe: "Take 30 minutes this week to write this",
          followUp: "What surprised you about what you wrote? What does it tell you about what you value?"
        }
      },
      {
        id: 'f20-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Designing Your Legacy',
        theme: 'legacy',
        content: {
          opening: "You've completed the mastery phase. Let's design the legacy you want to build from here.",
          prompts: [
            "Describe the leader you want to be known as in ONE sentence. What's your leadership identity statement now?",
            "In the People, Capability, and Results dimensions—what's the most important legacy you want to build?",
            "What's one thing you'll do differently starting tomorrow based on your legacy vision?"
          ],
          closing: "Legacy is built daily, not at the end. Every conversation, every decision, every person you develop—it all compounds. The leader you become is the legacy you leave. Lead well."
        }
      }
    ]
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current focus based on session count
 */
export const getCurrentFocus = (completedSessions) => {
  let sessionCount = 0;
  for (const focus of FOCUSES) {
    sessionCount += focus.sessions.length;
    if (completedSessions < sessionCount) {
      return focus;
    }
  }
  // If beyond all focuses, rotate through them
  const totalSessions = FOCUSES.reduce((acc, f) => acc + f.sessions.length, 0);
  const rotatedSession = completedSessions % totalSessions;
  return getCurrentFocus(rotatedSession);
};

/**
 * Get session within the current focus
 */
export const getCurrentSession = (completedSessions) => {
  let sessionCount = 0;
  for (const focus of FOCUSES) {
    for (const session of focus.sessions) {
      if (sessionCount === completedSessions) {
        return { focus, session, sessionInFocus: completedSessions - (sessionCount - focus.sessions.indexOf(session)) + 1 };
      }
      sessionCount++;
    }
  }
  // Rotate for infinite sessions
  const totalSessions = FOCUSES.reduce((acc, f) => acc + f.sessions.length, 0);
  const rotatedSession = completedSessions % totalSessions;
  return getCurrentSession(rotatedSession);
};

/**
 * Get focus progress
 */
export const getFocusProgress = (completedSessions) => {
  const { focus, sessionInFocus } = getCurrentSession(completedSessions);
  return {
    focus,
    currentSession: sessionInFocus,
    totalSessions: focus.sessions.length,
    percentage: Math.round((sessionInFocus / focus.sessions.length) * 100)
  };
};

/**
 * Get all focuses for admin view
 */
export const getAllFocuses = () => FOCUSES;

/**
 * Get focus by ID
 */
export const getFocusById = (id) => FOCUSES.find(f => f.id === id);

/**
 * Get total session count
 */
export const getTotalSessionCount = () => 
  FOCUSES.reduce((acc, f) => acc + f.sessions.length, 0);
