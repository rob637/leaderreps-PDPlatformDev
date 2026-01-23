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
        id: 'f1-s5',
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
        id: 'f3-s5',
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
        id: 'f3-s6',
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
        id: 'f4-s5',
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
