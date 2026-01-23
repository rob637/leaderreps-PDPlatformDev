/**
 * REPPY DETAILED CURRICULUM
 * 
 * This is the comprehensive curriculum data used by the Admin screen for editing.
 * It mirrors the structure of focuses.js but with enhanced content suitable for
 * AI coach prompting and detailed curriculum management.
 * 
 * SESSION TYPES:
 * - quote: Inspirational quote with context and reflection
 * - lesson: Teaching content with frameworks and insights
 * - scenario: Real-world situations for discussion
 * - book: Book summaries with leadership application
 * - video: Video content with key takeaways
 * - reflection: Self-reflection exercises
 * - challenge: Daily action challenges
 * - integration: End-of-focus synthesis
 * - win: Morning intention (WIN framework)
 * - pm: Evening reflection
 * 
 * OPTIONAL "GO DEEPER" ACTIVITIES:
 * Each session can include an optional goDeeper object with reinforcement activities:
 * - type: 'journal' | 'practice' | 'discuss' | 'watch' | 'read' | 'observe'
 * - title: Short title for the activity
 * - prompt: The activity description/instructions
 * - duration: Estimated time (e.g., "5 min", "10 min")
 */

// Session types - must match focuses.js
export const SESSION_TYPES = {
  QUOTE: 'quote',
  LESSON: 'lesson', 
  SCENARIO: 'scenario',
  BOOK: 'book',
  VIDEO: 'video',
  REFLECTION: 'reflection',
  CHALLENGE: 'challenge',
  INTEGRATION: 'integration',
  WIN_THE_DAY: 'win',
  PM_REFLECTION: 'pm',
};

// Go Deeper activity types
export const GO_DEEPER_TYPES = {
  JOURNAL: 'journal',      // Writing/reflection exercise
  PRACTICE: 'practice',    // Real-world application
  DISCUSS: 'discuss',      // Conversation with colleague/mentor
  WATCH: 'watch',          // Additional video content
  READ: 'read',            // Article or short reading
  OBSERVE: 'observe',      // Awareness/observation exercise
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
// DETAILED FOCUSES
// Enhanced curriculum with AI coach prompts
// ============================================

export const DETAILED_FOCUSES = [
  // ============================================
  // FOCUS 1: LEADERSHIP IDENTITY
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
    learningObjectives: [
      'Define your unique Leadership Identity Statement',
      'Clarify your core values as a leader',
      'Understand your leadership purpose (WHY)',
      'Build self-awareness as the foundation of leadership'
    ],
    sessions: [
      {
        id: 'f1-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Mirror of Leadership',
        theme: 'self-awareness',
        estimatedMinutes: 3,
        content: {
          quote: "The first and greatest victory is to conquer yourself.",
          author: "Plato",
          source: "Ancient Greek philosophy",
          context: "Ancient wisdom that still defines modern leadership",
          whyItMatters: "Leadership begins with self-mastery. Before you can guide others, you must understand your own values, fears, and motivations.",
          reflectionPrompts: [
            "What does 'conquering yourself' mean in your leadership context?",
            "Where do you need more self-mastery as a leader?",
            "What inner battle are you currently facing?"
          ],
          coachingPrompts: [
            "Ask about their biggest internal leadership challenge",
            "Explore what self-mastery looks like in their role",
            "Connect this to their leadership journey"
          ]
        },
        goDeeper: {
          type: 'journal',
          title: 'The Inner Battle Map',
          prompt: "Write for 5 minutes about your biggest internal leadership struggle right now. What triggers it? What would 'conquering' it look like?",
          duration: '5 min'
        }
      },
      {
        id: 'f1-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Leadership Identity Statement',
        theme: 'identity',
        estimatedMinutes: 5,
        content: {
          opening: "Every great leader knows who they are and what they stand for.",
          keyInsight: "Your Leadership Identity Statement (LIS) is a compass that guides decisions when the path isn't clear. It answers: 'What kind of leader do I want to be?' Not what you do, but who you ARE as a leader.",
          framework: {
            name: "The LIS Formula",
            description: "A three-part declaration of your leadership identity",
            steps: [
              { 
                part: "Part 1", 
                name: "I am a leader who...", 
                description: "Your core trait",
                example: "leads with calm confidence"
              },
              { 
                part: "Part 2", 
                name: "I believe...", 
                description: "Your guiding principle",
                example: "every person has untapped potential"
              },
              { 
                part: "Part 3", 
                name: "I create...", 
                description: "Your impact on others",
                example: "environments where people feel safe to grow"
              }
            ]
          },
          coachingPrompts: [
            "Help them draft their first LIS attempt",
            "Ask what feels authentic vs. aspirational",
            "Encourage specificity over generics"
          ]
        },
        goDeeper: {
          type: 'discuss',
          title: 'Share Your LIS',
          prompt: "Share your draft Leadership Identity Statement with a trusted colleague or mentor. Ask them: 'Does this sound like me? What's missing?'",
          duration: '10 min'
        }
      },
      {
        id: 'f1-s3',
        type: SESSION_TYPES.REFLECTION,
        title: 'Defining Your Core Values',
        theme: 'values',
        estimatedMinutes: 5,
        content: {
          opening: "Your values are the non-negotiables that define your leadership.",
          concept: "Values aren't what you say matters—they're what you demonstrate through your choices, especially hard ones.",
          reflectionExercise: {
            name: "The Values Clarifier",
            steps: [
              {
                step: 1,
                prompt: "Think about a time when you felt deeply proud of a decision you made as a leader. What value were you honoring in that moment?",
                followUp: "Name the specific value. Was it integrity? Courage? Compassion?"
              },
              {
                step: 2,
                prompt: "Now think about a time you felt conflicted or compromised. What value was being challenged?",
                followUp: "The gap between these two moments reveals where your growth edge lies."
              },
              {
                step: 3,
                prompt: "What are your 3 non-negotiable values as a leader?",
                followUp: "These should be values you'd uphold even at personal cost."
              }
            ]
          },
          closingInsight: "When you know your values, hard decisions become clearer—not easier, but clearer."
        }
      },
      {
        id: 'f1-s4',
        type: SESSION_TYPES.BOOK,
        title: 'Start with Why',
        theme: 'purpose',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "Start with Why",
            author: "Simon Sinek",
            published: 2009,
            oneSentenceSummary: "Great leaders inspire action by starting with WHY they do what they do, not WHAT they do.",
            bigIdea: "The Golden Circle framework reveals why some leaders inspire action while others struggle. It starts with WHY—your purpose, cause, or belief—not WHAT you do or HOW you do it.",
            keyQuotes: [
              "People don't buy what you do; they buy why you do it.",
              "Working hard for something we don't care about is called stress. Working hard for something we love is called passion.",
              "The goal is not to do business with everybody who needs what you have. The goal is to do business with people who believe what you believe."
            ],
            leadershipApplication: "When your team knows your WHY, they don't follow you for a paycheck—they follow you for a purpose."
          },
          watchInstead: {
            title: "Simon Sinek TED Talk: Start with Why",
            duration: "18 min",
            url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA"
          },
          coachingPrompts: [
            "Ask them to articulate their WHY in one sentence",
            "Explore if their team knows their WHY",
            "Discuss how purpose connects to daily work"
          ]
        }
      },
      {
        id: 'f1-s5',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Crafting Your Leadership Identity',
        theme: 'identity',
        estimatedMinutes: 7,
        content: {
          opening: "You've explored self-awareness, values, and purpose. Now let's bring it together.",
          synthesis: {
            recap: [
              "Self-mastery is the foundation (Plato)",
              "Your LIS is your leadership compass",
              "Values guide hard decisions",
              "WHY creates inspiration and alignment"
            ],
            guidingQuestions: [
              "What kind of leader do you want to be?",
              "What do you believe about people and leadership?",
              "What do you want to create for your team?"
            ]
          },
          closing: "This statement will evolve. But starting with clarity beats starting with confusion. Write your Leadership Identity Statement now."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 2: BUILDING TRUST
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
    learningObjectives: [
      'Understand the Trust Equation and its components',
      'Learn vulnerability-based trust',
      'Know how to repair broken trust',
      'Build trust rapidly with new relationships'
    ],
    sessions: [
      {
        id: 'f2-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Speed of Trust',
        theme: 'trust',
        estimatedMinutes: 3,
        content: {
          quote: "Trust is the one thing that changes everything.",
          author: "Stephen M.R. Covey",
          source: "The Speed of Trust",
          context: "From his bestselling book on organizational trust",
          whyItMatters: "When trust is high, everything moves faster. When it's low, everything becomes expensive—in time, energy, and relationships.",
          reflectionPrompts: [
            "Where in your organization does low trust slow things down?",
            "Who do you trust implicitly? What makes that relationship different?",
            "Where might you be a bottleneck because of trust issues?"
          ]
        },
        goDeeper: {
          type: 'observe',
          title: 'Trust Radar',
          prompt: "Today, notice moments when you feel yourself trusting (or not trusting) someone. What specifically triggered that feeling? Was it their words, actions, or something else?",
          duration: 'Throughout day'
        }
      },
      {
        id: 'f2-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Trust Equation',
        theme: 'trust',
        estimatedMinutes: 5,
        content: {
          opening: "Trust isn't magical—it's mathematical.",
          keyInsight: "The Trust Equation breaks down trustworthiness into four components you can actively develop.",
          framework: {
            name: "The Trust Equation",
            formula: "Trust = (Credibility + Reliability + Intimacy) / Self-Orientation",
            description: "The numerator builds trust; the denominator (self-orientation) destroys it.",
            steps: [
              { 
                letter: "C", 
                name: "Credibility", 
                description: "Can they believe what you say?",
                example: "Expertise, track record, accurate statements"
              },
              { 
                letter: "R", 
                name: "Reliability", 
                description: "Can they count on you?",
                example: "Consistency, follow-through, meeting commitments"
              },
              { 
                letter: "I", 
                name: "Intimacy", 
                description: "Do they feel safe with you?",
                example: "Confidentiality, empathy, discretion"
              },
              { 
                letter: "S", 
                name: "Self-Orientation", 
                description: "Are you focused on them or yourself?",
                example: "This is the DIVISOR—high self-orientation tanks trust"
              }
            ]
          },
          coachingPrompts: [
            "Ask which component is their strength",
            "Explore where self-orientation might be undermining trust",
            "Discuss specific relationships they want to build trust in"
          ]
        },
        goDeeper: {
          type: 'practice',
          title: 'The Trust Audit',
          prompt: "Pick one important relationship. Rate yourself 1-10 on each Trust Equation component (C, R, I, S). What's one specific action you could take to improve your weakest area?",
          duration: '5 min'
        }
      },
      {
        id: 'f2-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Broken Promise',
        theme: 'trust-repair',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You promised your team you'd advocate for their project in the leadership meeting.",
            complication: "When pushback came from the CEO, you didn't push back. Now your team knows. They're not saying anything, but the energy has shifted."
          },
          responseOptions: [
            {
              option: "Address it head-on with the team",
              analysis: "Vulnerable but powerful. Acknowledging the gap shows integrity. 'I didn't show up the way I should have. Let me tell you what happened and what I'm going to do differently.'"
            },
            {
              option: "Wait and demonstrate trustworthiness over time",
              analysis: "Actions do speak louder than words—but silence can also signal avoidance. The elephant stays in the room."
            },
            {
              option: "Go back to leadership and advocate harder",
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
        estimatedMinutes: 5,
        content: {
          opening: "Patrick Lencioni's model suggests trust requires something uncomfortable: vulnerability.",
          keyInsight: "Vulnerability-based trust means being willing to say 'I don't know,' 'I was wrong,' or 'I need help.' It's the opposite of projecting invincibility.",
          framework: {
            name: "Signals of Vulnerability-Based Trust",
            description: "Five behaviors that build deep trust",
            steps: [
              { name: "Admitting mistakes", description: "Before others discover them" },
              { name: "Asking for help", description: "Without shame or deflection" },
              { name: "Acknowledging limitations", description: "Being honest about gaps" },
              { name: "Sharing credit", description: "Generously and publicly" },
              { name: "Offering and accepting apologies", description: "Genuinely, not performatively" }
            ]
          },
          coachingPrompts: [
            "Ask when they last admitted a mistake publicly",
            "Explore what makes vulnerability feel risky",
            "Discuss the paradox of strength through vulnerability"
          ]
        }
      },
      {
        id: 'f2-s5',
        type: SESSION_TYPES.VIDEO,
        title: 'The Anatomy of Trust',
        theme: 'trust',
        estimatedMinutes: 23,
        content: {
          video: {
            title: "Brené Brown: The Anatomy of Trust",
            source: "SuperSoul Sessions",
            duration: "23 min",
            url: "https://www.youtube.com/watch?v=BRAVING",
            description: "Brené Brown breaks down trust into specific behaviors using her BRAVING framework."
          },
          keyTakeaways: [
            "Trust is built in small moments, not grand gestures",
            "BRAVING: Boundaries, Reliability, Accountability, Vault, Integrity, Non-judgment, Generosity",
            "The most trustworthy people give you the most generous interpretation of your intentions"
          ],
          reflectionPrompts: [
            "Which BRAVING element do you need to strengthen?",
            "Who do you trust completely? Why?",
            "Are you trustworthy to yourself?"
          ],
          coachingPrompts: [
            "Explore which BRAVING component surprised them",
            "Discuss self-trust as foundation",
            "Apply BRAVING to a current relationship"
          ]
        }
      },
      {
        id: 'f2-s6',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Trust Accelerator',
        theme: 'trust',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "One Vulnerable Conversation",
            description: "Have one vulnerable conversation today. Share something you're struggling with or uncertain about with someone on your team."
          },
          rules: [
            "It must be genuine—not manufactured vulnerability",
            "Choose something appropriate for the relationship",
            "Notice how they respond"
          ],
          whyThisWorks: "Trust deposits are made in small moments. One authentic conversation can shift a relationship.",
          coachingPrompts: [
            "Help them identify an appropriate vulnerability to share",
            "Discuss who would be a good person to share with",
            "Prepare them for possible responses"
          ]
        }
      },
      {
        id: 'f2-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Trust Blueprint',
        theme: 'trust',
        estimatedMinutes: 5,
        content: {
          opening: "You've learned the mechanics of trust. Now let's personalize it.",
          synthesis: {
            recap: [
              "Trust has a formula: (C + R + I) / S",
              "Self-orientation is the trust killer",
              "Vulnerability builds deeper trust",
              "Broken trust is best repaired by naming it"
            ],
            guidingQuestions: [
              "Using the Trust Equation, which component is your strength? Which needs work?",
              "Who on your team might you have an unaddressed trust gap with?",
              "What's one specific action you'll take this week to build trust?"
            ]
          },
          closing: "Trust is built in drops and lost in buckets. Protect what you build."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 3: GIVING FEEDBACK
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
    learningObjectives: [
      'Master the CLEAR feedback framework',
      'Understand Radical Candor principles',
      'Give timely, specific, actionable feedback',
      'Navigate your own feedback tendencies'
    ],
    sessions: [
      {
        id: 'f3-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Care Challenge',
        theme: 'feedback',
        estimatedMinutes: 3,
        content: {
          quote: "Radical Candor is Caring Personally while Challenging Directly.",
          author: "Kim Scott",
          source: "Radical Candor",
          context: "Former Google and Apple executive",
          whyItMatters: "Most leaders err on one side: they care but don't challenge (Ruinous Empathy), or they challenge without caring (Obnoxious Aggression). The magic is both.",
          reflectionPrompts: [
            "Which side do you tend to err on?",
            "Who needs feedback you've been avoiding?",
            "What would caring personally AND challenging directly look like for you?"
          ]
        }
      },
      {
        id: 'f3-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The CLEAR Feedback Framework',
        theme: 'feedback',
        estimatedMinutes: 5,
        content: {
          opening: "Great feedback is specific, timely, and actionable. The CLEAR framework ensures you hit all three.",
          keyInsight: "The 'Ask' step transforms feedback from a lecture into a conversation. It often reveals context you didn't have.",
          framework: {
            name: "CLEAR Feedback",
            description: "A 5-step framework for effective feedback",
            steps: [
              { 
                letter: "C", 
                name: "Context", 
                description: "Set the stage",
                example: "In yesterday's client meeting..."
              },
              { 
                letter: "L", 
                name: "Locate", 
                description: "Name the specific behavior",
                example: "When you interrupted Sarah three times..."
              },
              { 
                letter: "E", 
                name: "Effect", 
                description: "Explain the impact",
                example: "It made her hesitant to share more, and the client noticed."
              },
              { 
                letter: "A", 
                name: "Ask", 
                description: "Invite their perspective",
                example: "What was going on for you in that moment?"
              },
              { 
                letter: "R", 
                name: "Request", 
                description: "Agree on next steps",
                example: "Next time, could you let others finish before jumping in?"
              }
            ]
          }
        },
        goDeeper: {
          type: 'practice',
          title: 'CLEAR Practice Run',
          prompt: "Write out a CLEAR feedback script for a real conversation you need to have. Don't deliver it yet—just draft the exact words you would say for each step.",
          duration: '10 min'
        }
      },
      {
        id: 'f3-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Feedback You\'ve Been Avoiding',
        theme: 'feedback',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "A talented team member consistently delivers late. The work is excellent when it arrives, but deadlines are missed 80% of the time.",
            complication: "You've hinted at it, but never had the direct conversation. It's affecting the whole team's workflow."
          },
          responseOptions: [
            {
              option: "Use CLEAR to address it directly",
              analysis: "Context: 'I wanted to talk about project timelines.' Locate: 'About 8 out of 10 deliverables have been late.' Effect: 'This creates a ripple effect on the team.' Ask: 'What's getting in the way?' Request: 'Can we work on a system together?'"
            },
            {
              option: "Continue hinting and hoping",
              analysis: "This is Ruinous Empathy—you care but won't challenge. Nothing changes."
            },
            {
              option: "Escalate to HR or formal documentation",
              analysis: "Skipping the direct conversation is unfair to them. They deserve a chance to know and fix it."
            }
          ],
          principle: "Notice: no character attacks, no 'you always' language. Just observable behavior and its impact."
        },
        goDeeper: {
          type: 'journal',
          title: 'The Conversation You\'re Avoiding',
          prompt: "What feedback have you been avoiding giving someone? Write down: Who? What behavior? Why have you avoided it? What's the cost of continued silence?",
          duration: '5 min'
        }
      },
      {
        id: 'f3-s4',
        type: SESSION_TYPES.BOOK,
        title: 'Radical Candor',
        theme: 'feedback',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "Radical Candor",
            author: "Kim Scott",
            published: 2017,
            oneSentenceSummary: "The best feedback comes from genuinely caring about someone while being willing to tell them hard truths.",
            bigIdea: "The Radical Candor framework maps feedback on two axes: Care Personally and Challenge Directly. The goal is the upper-right quadrant where both are high.",
            keyQuotes: [
              "It's not mean to tell someone their fly is down. It's mean to let them walk around like that.",
              "Ruinous Empathy is 'nice' in the short-term but ultimately unkind.",
              "The single most important thing a boss can do is focus on guidance: giving it, receiving it, and encouraging it."
            ],
            leadershipApplication: "Most feedback failures come from caring without challenging (staying silent to be 'nice') or challenging without caring (being harsh)."
          },
          watchInstead: {
            title: "Kim Scott: Radical Candor",
            duration: "15 min",
            url: "https://www.youtube.com/watch?v=MIh_992Nfes"
          }
        }
      },
      {
        id: 'f3-s5',
        type: SESSION_TYPES.VIDEO,
        title: 'The Secret to Giving Great Feedback',
        theme: 'feedback',
        estimatedMinutes: 6,
        content: {
          video: {
            title: "LeeAnn Renninger: The Secret to Giving Great Feedback",
            source: "TED",
            duration: "6 min",
            url: "https://www.youtube.com/watch?v=wtl5UrrgU8c",
            description: "Cognitive psychologist shares a simple 4-part formula for delivering feedback that actually drives change."
          },
          keyTakeaways: [
            "The Micro-Yes: ask permission before giving feedback",
            "Be specific about data points, not judgments",
            "State the impact of their behavior",
            "End with a question, not a statement"
          ],
          reflectionPrompts: [
            "When has someone given you feedback that actually changed your behavior?",
            "What made that feedback land?",
            "How can you apply the Micro-Yes this week?"
          ]
        }
      },
      {
        id: 'f3-s6',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The 24-Hour Feedback',
        theme: 'feedback',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "One CLEAR Feedback Conversation",
            description: "Give one piece of constructive feedback today using the CLEAR framework. It doesn't have to be big—small, timely feedback is often more powerful."
          },
          rules: [
            "Must be genuine, not manufactured",
            "Focus on behavior, not character",
            "End with a request, not a demand",
            "Do it within 24 hours of observing the behavior"
          ],
          whyThisWorks: "Feedback delayed is feedback diluted. The closer to the moment, the more impactful."
        }
      },
      {
        id: 'f3-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Feedback Edge',
        theme: 'feedback',
        estimatedMinutes: 5,
        content: {
          opening: "Everyone has a feedback tendency. Let's identify yours.",
          synthesis: {
            recap: [
              "Radical Candor = Care Personally + Challenge Directly",
              "CLEAR provides structure: Context, Locate, Effect, Ask, Request",
              "The 'Ask' turns a lecture into a dialogue",
              "Timely feedback > Perfect feedback"
            ],
            guidingQuestions: [
              "Do you tend toward Ruinous Empathy (caring but not challenging) or Obnoxious Aggression (challenging without caring)?",
              "What feedback conversation have you been avoiding? Why?",
              "What would change if you gave that feedback this week?"
            ]
          },
          closing: "Withholding feedback isn't kindness—it's deprivation. People deserve to know where they stand."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 4: ACTIVE LISTENING
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
    learningObjectives: [
      'Understand the three levels of listening',
      'Practice the LADDER technique',
      'Become aware of listening habits',
      'Use silence as a leadership tool'
    ],
    sessions: [
      {
        id: 'f4-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Listening Gap',
        theme: 'listening',
        estimatedMinutes: 3,
        content: {
          quote: "Most people do not listen with the intent to understand; they listen with the intent to reply.",
          author: "Stephen R. Covey",
          source: "The 7 Habits of Highly Effective People",
          whyItMatters: "Notice your own listening today. Are you formulating your response while they're still talking?",
          reflectionPrompts: [
            "In your last conversation, were you listening to understand or to reply?",
            "Who in your life feels truly heard by you?",
            "What happens when you feel truly heard?"
          ]
        }
      },
      {
        id: 'f4-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Three Levels of Listening',
        theme: 'listening',
        estimatedMinutes: 5,
        content: {
          opening: "Not all listening is created equal. There are three distinct levels.",
          keyInsight: "Most workplace conversations happen at Level 1. The best leaders operate at Level 2 and 3.",
          framework: {
            name: "Three Levels of Listening",
            description: "Each level requires more presence and yields more insight",
            steps: [
              { 
                name: "Level 1: Internal Listening", 
                description: "You hear their words but you're focused on your own thoughts, judgments, and what you'll say next.",
                example: "You're waiting for them to finish so you can talk."
              },
              { 
                name: "Level 2: Focused Listening", 
                description: "You're fully present to their words, tone, and meaning. You're curious about their experience.",
                example: "You're asking follow-up questions to understand, not to steer."
              },
              { 
                name: "Level 3: Global Listening", 
                description: "You're picking up everything—words, body language, what's NOT being said, the energy in the room.",
                example: "You notice shifts and can name what's unspoken."
              }
            ]
          }
        }
      },
      {
        id: 'f4-s3',
        type: SESSION_TYPES.LESSON,
        title: 'The Listening LADDER',
        theme: 'listening',
        estimatedMinutes: 5,
        content: {
          opening: "Active listening has concrete techniques you can practice.",
          keyInsight: "The 'Reflect' step is powerful: 'What I'm hearing is...' confirms understanding and makes people feel truly heard.",
          framework: {
            name: "The LADDER",
            description: "Six techniques for active listening",
            steps: [
              { letter: "L", name: "Look", description: "Maintain appropriate eye contact" },
              { letter: "A", name: "Ask", description: "Ask clarifying questions" },
              { letter: "D", name: "Don't interrupt", description: "Let them finish completely" },
              { letter: "D", name: "Don't change the subject", description: "Stay with their topic" },
              { letter: "E", name: "Empathize", description: "Acknowledge their feelings" },
              { letter: "R", name: "Reflect", description: "Mirror back what you heard" }
            ]
          }
        },
        goDeeper: {
          type: 'practice',
          title: 'The Reflection Challenge',
          prompt: "In your next conversation, try the 'Reflect' technique: Before responding, say 'What I'm hearing is...' and summarize their point. Notice their reaction.",
          duration: '5 min'
        }
      },
      {
        id: 'f4-s4',
        type: SESSION_TYPES.VIDEO,
        title: '10 Ways to Have a Better Conversation',
        theme: 'listening',
        estimatedMinutes: 12,
        content: {
          video: {
            title: "Celeste Headlee: 10 Ways to Have a Better Conversation",
            source: "TED",
            duration: "12 min",
            url: "https://www.youtube.com/watch?v=R1vskiVDwl4",
            description: "A radio host shares practical, powerful rules for meaningful conversations—starting with actually listening."
          },
          keyTakeaways: [
            "Don't multitask—be fully present or don't bother",
            "Don't pontificate—enter every conversation assuming you have something to learn",
            "Use open-ended questions, not yes/no traps",
            "Go with the flow—thoughts will come and go, let them",
            "If you don't know, say you don't know"
          ],
          reflectionPrompts: [
            "Which of these 10 rules do you struggle with most?",
            "When did someone last make you feel truly heard?",
            "What would change in your team if you listened at this level?"
          ]
        },
        goDeeper: {
          type: 'observe',
          title: 'Listening Awareness Day',
          prompt: "Today, notice when you're truly listening vs. when you're waiting to talk. In which conversations did you give full presence? In which did you zone out?",
          duration: 'Throughout day'
        }
      },
      {
        id: 'f4-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Silent Leader',
        theme: 'listening',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "80% Listening Challenge",
            description: "In your next meeting or 1:1, commit to listening for 80% of the conversation. When you do speak, only ask questions or reflect back what you've heard."
          },
          rules: [
            "No solutions unless explicitly asked",
            "No 'That reminds me of...' stories",
            "Count to 3 after they stop talking before you respond",
            "Notice the urge to jump in—and don't"
          ],
          whyThisWorks: "Leaders often fill silence because it's uncomfortable. But silence is where insight emerges."
        }
      },
      {
        id: 'f4-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Listening Audit',
        theme: 'listening',
        estimatedMinutes: 5,
        content: {
          opening: "Let's assess your listening honestly.",
          synthesis: {
            recap: [
              "Level 1 = Internal, Level 2 = Focused, Level 3 = Global",
              "LADDER: Look, Ask, Don't interrupt, Don't change subject, Empathize, Reflect",
              "Silence is a tool, not a void to fill",
              "Reflecting back confirms understanding"
            ],
            guidingQuestions: [
              "What level of listening do you default to in most conversations?",
              "Who in your life deserves better listening from you?",
              "What gets in the way of you being fully present?"
            ]
          },
          closing: "The quality of your leadership is directly proportional to the quality of your listening."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 5: DELEGATION
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
    learningObjectives: [
      'Use the 4D Delegation Matrix',
      'Understand the five levels of delegation',
      'Overcome psychological barriers to letting go',
      'Develop others through delegation'
    ],
    sessions: [
      {
        id: 'f5-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Paradox of Control',
        theme: 'delegation',
        estimatedMinutes: 3,
        content: {
          quote: "If you want to do a few small things right, do them yourself. If you want to do great things and make a big impact, learn to delegate.",
          author: "John C. Maxwell",
          source: "Leadership expert and author",
          whyItMatters: "What are you holding onto that someone else could do—maybe even better than you?",
          reflectionPrompts: [
            "What task do you keep doing 'because no one does it as well'?",
            "What could you accomplish if you had 5 more hours a week?",
            "Who on your team is waiting for a chance to grow?"
          ]
        }
      },
      {
        id: 'f5-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Delegation Matrix',
        theme: 'delegation',
        estimatedMinutes: 5,
        content: {
          opening: "Not everything should be delegated. But more can be than you think.",
          keyInsight: "Most leaders over-index on 'Do' and under-utilize 'Delegate.' The result: burnout and underdeveloped teams.",
          framework: {
            name: "The 4D Delegation Matrix",
            description: "Sort tasks by impact and whether you're the only one who can do them",
            steps: [
              { 
                name: "Do", 
                description: "High impact + Only you can do it",
                example: "Protect this time fiercely"
              },
              { 
                name: "Delegate", 
                description: "High impact + Someone else can do it",
                example: "Invest time in training, then let go"
              },
              { 
                name: "Defer", 
                description: "Low impact + Only you can do it",
                example: "Schedule for later or batch"
              },
              { 
                name: "Delete", 
                description: "Low impact + Someone else can do it",
                example: "Eliminate or fully offload"
              }
            ]
          }
        }
      },
      {
        id: 'f5-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Reluctant Delegator',
        theme: 'delegation',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You have a high-stakes client presentation next week. You've always done these yourself because 'no one does it as well.'",
            complication: "A capable team member has asked to take the lead. It would free up 10 hours of your time and help them grow—but the risk feels real."
          },
          responseOptions: [
            {
              option: "Let them lead with your support",
              analysis: "Growth happens at the edge of comfort—theirs and yours. Offer to review together and be available for questions, but let them own it."
            },
            {
              option: "Do it yourself—too important",
              analysis: "Safe in the short term, but you've just signaled you don't trust them. And you'll be doing every presentation forever."
            },
            {
              option: "Co-present this time, they lead next time",
              analysis: "A reasonable middle ground—but notice if 'next time' keeps getting delayed."
            }
          ],
          principle: "The first time someone does something, it won't be as good as your 100th time. That's not a reason to never let them try."
        },
        goDeeper: {
          type: 'journal',
          title: 'The Task Inventory',
          prompt: "List 5 tasks you're currently holding onto. For each one, ask: Why am I doing this? Who could do this? What would I have to let go of to hand it over?",
          duration: '10 min'
        }
      },
      {
        id: 'f5-s4',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Bottleneck Boss',
        theme: 'delegation',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "Your team is waiting on you constantly. Every decision needs your sign-off. The backlog is growing. People are frustrated by the delays.",
            complication: "You created this situation by insisting on being involved in everything. Now you're overwhelmed and your team feels micromanaged."
          },
          responseOptions: [
            {
              option: "Keep approving everything—quality matters",
              analysis: "Your team stops thinking independently. They'll just do the minimum and wait for you to make the real decisions."
            },
            {
              option: "Identify which decisions truly need you",
              analysis: "Be honest: probably 20% of what crosses your desk actually requires your input. Push the rest to Level 4 or 5 delegation."
            },
            {
              option: "Create decision-making criteria for the team",
              analysis: "Teach them how you decide. Give them the principles, not just the answers. 'If X, then do Y without checking with me.'"
            },
            {
              option: "Start with one category and fully let go",
              analysis: "Pick one type of decision (e.g., budget under $500) and completely delegate it. Practice trusting."
            }
          ],
          principle: "If you're the bottleneck, you're not leading—you're limiting."
        }
      },
      {
        id: 'f5-s5',
        type: SESSION_TYPES.LESSON,
        title: 'Five Levels of Delegation',
        theme: 'delegation',
        estimatedMinutes: 5,
        content: {
          opening: "Delegation fails when we delegate the task but not the authority.",
          keyInsight: "Match the delegation level to the person's capability and the risk involved. Then trust the level you chose.",
          framework: {
            name: "Five Levels of Delegation",
            description: "Most leaders get stuck at Level 2",
            steps: [
              { name: "Level 1: Wait", description: "I tell you exactly what to do" },
              { name: "Level 2: Ask", description: "Research and recommend, but I decide" },
              { name: "Level 3: Recommend", description: "Recommend, then act unless I say no" },
              { name: "Level 4: Act and Inform", description: "Take action, then tell me what you did" },
              { name: "Level 5: Act", description: "Full ownership—no need to report" }
            ]
          }
        }
      },
      {
        id: 'f5-s6',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Delegation Experiment',
        theme: 'delegation',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Delegate One Meaningful Task",
            description: "Identify one task you've been holding onto and delegate it this week. Use the framework: match the delegation level, provide context, then step back."
          },
          rules: [
            "Choose something meaningful, not just busywork",
            "Be explicit about the delegation level",
            "Resist the urge to micromanage or 'check in' excessively",
            "Debrief with them afterward: what worked, what didn't"
          ],
          whyThisWorks: "Delegation is a muscle. It atrophies without use."
        }
      },
      {
        id: 'f5-s7',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Delegation Plan',
        theme: 'delegation',
        estimatedMinutes: 5,
        content: {
          opening: "You've learned the frameworks. Now let's make it personal.",
          synthesis: {
            recap: [
              "4D Matrix: Do, Delegate, Defer, Delete",
              "5 Levels: from 'Wait' to full autonomy",
              "Delegation develops people",
              "Trust the level you choose"
            ],
            guidingQuestions: [
              "What task have you been hoarding that's limiting someone else's growth?",
              "What's the fear underneath your reluctance to delegate?",
              "If you could free up 5 hours a week through delegation, what would you do with that time?"
            ]
          },
          closing: "Your job isn't to do the work—it's to develop people who can."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 6: WINNING THE DAY
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
    learningObjectives: [
      'Implement the WIN morning framework',
      'Build an evening reflection habit',
      'Create trigger-based daily routines',
      'Maintain consistency when life disrupts'
    ],
    sessions: [
      {
        id: 'f6-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Power of Intention',
        theme: 'intention',
        estimatedMinutes: 3,
        content: {
          quote: "Either you run the day, or the day runs you.",
          author: "Jim Rohn",
          source: "Entrepreneur and motivational speaker",
          whyItMatters: "How often do you end the day wondering where the time went? Morning intention changes that.",
          reflectionPrompts: [
            "How do you currently start your days?",
            "When do you feel most in control of your time?",
            "What would a 'winning' day look like for you?"
          ]
        }
      },
      {
        id: 'f6-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The WIN Framework',
        theme: 'intention',
        estimatedMinutes: 5,
        content: {
          opening: "WIN stands for 'What's Important Now.' It's not a to-do list—it's a priority filter.",
          keyInsight: "Most people have 10+ 'priorities.' When everything is a priority, nothing is. WIN forces clarity.",
          framework: {
            name: "The WIN System",
            description: "A 3-part morning intention practice",
            steps: [
              { 
                name: "The ONE Thing", 
                description: "If only ONE thing gets done today, what must it be?",
                example: "This is your non-negotiable. Everything else is secondary."
              },
              { 
                name: "Two Supporting Actions", 
                description: "What two other items would make today a success?",
                example: "These support your ONE thing or move important projects forward."
              },
              { 
                name: "Time Block", 
                description: "When will you do your ONE thing?",
                example: "If it's not on the calendar, it's not real."
              }
            ]
          }
        }
      },
      {
        id: 'f6-s3',
        type: SESSION_TYPES.WIN_THE_DAY,
        title: 'Your First WIN',
        theme: 'intention',
        estimatedMinutes: 5,
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
        estimatedMinutes: 5,
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
        estimatedMinutes: 5,
        content: {
          opening: "You've learned WIN and the Evening Bookend. Now let's make them stick.",
          synthesis: {
            recap: [
              "WIN = What's Important Now",
              "ONE Thing + Two Supporting Actions + Time Block",
              "Evening Bookend captures learning",
              "Consistency > perfection"
            ],
            guidingQuestions: [
              "When and where will you do your morning WIN? (Be specific: 'At 6:45 AM at my kitchen table')",
              "What will trigger your evening reflection? (After dinner? Before bed?)",
              "What will you do when you miss a day? (Because you will)"
            ]
          },
          closing: "Habit research shows that missing once is fine. Missing twice starts a new pattern. Have a 'get back on track' plan."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 7: DIFFICULT CONVERSATIONS
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
    learningObjectives: [
      'Understand why we avoid difficult conversations',
      'Use the DESC framework for structure',
      'Manage emotions during tough talks',
      'Follow up effectively after difficult conversations'
    ],
    sessions: [
      {
        id: 'f7-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Cost of Avoidance',
        theme: 'difficult-conversations',
        estimatedMinutes: 3,
        content: {
          quote: "The conversation you're avoiding is the conversation you need to have.",
          author: "Unknown",
          context: "A leadership truth",
          whyItMatters: "Every avoided conversation compounds. The longer you wait, the harder it gets—and the more damage accumulates.",
          reflectionPrompts: [
            "What conversation have you been avoiding?",
            "What's the cost of not having it?",
            "What are you really afraid of?"
          ]
        }
      },
      {
        id: 'f7-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The DESC Framework',
        theme: 'difficult-conversations',
        estimatedMinutes: 5,
        content: {
          opening: "Structure reduces anxiety. DESC gives you a roadmap for difficult conversations.",
          keyInsight: "The 'Express' step is where most people skip—they describe the behavior but don't share how it affects them. This is the bridge to being heard.",
          framework: {
            name: "DESC",
            description: "A 4-step framework for difficult conversations",
            steps: [
              { 
                letter: "D", 
                name: "Describe", 
                description: "State the specific behavior you observed",
                example: "In the last three team meetings, you've arrived 10-15 minutes late."
              },
              { 
                letter: "E", 
                name: "Express", 
                description: "Share how it affects you/others",
                example: "It disrupts the flow and signals that your time is more important than others'."
              },
              { 
                letter: "S", 
                name: "Specify", 
                description: "State what you want to happen",
                example: "I need you to be on time or let me know in advance if you'll be late."
              },
              { 
                letter: "C", 
                name: "Consequences", 
                description: "Share the positive outcome of change",
                example: "If we can get this sorted, it'll restore trust and help the team function better."
              }
            ]
          }
        }
      },
      {
        id: 'f7-s3',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Underperformer',
        theme: 'difficult-conversations',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "A team member who was once a star performer has been coasting for months. Quality is down, deadlines are slipping, and their negativity is affecting the team.",
            complication: "You've been hoping it would self-correct. It hasn't. Other team members are starting to notice—and resent—that nothing is being done."
          },
          responseOptions: [
            {
              option: "Use DESC to have a direct conversation",
              analysis: "Describe the change you've observed. Express your concern. Specify your expectations. Share consequences (both positive and, if needed, negative)."
            },
            {
              option: "Put them on a PIP immediately",
              analysis: "A formal plan without a conversation first feels punitive. They deserve to know there's a problem and have a chance to respond."
            },
            {
              option: "Ask other team members to pick up the slack",
              analysis: "This punishes the high performers and lets the problem continue. It's not leadership—it's avoidance."
            }
          ],
          principle: "Direct conversations are a kindness. People can't fix what they don't know is broken."
        }
      },
      {
        id: 'f7-s4',
        type: SESSION_TYPES.VIDEO,
        title: 'How to Have Hard Conversations',
        theme: 'difficult-conversations',
        estimatedMinutes: 13,
        content: {
          video: {
            title: "Adar Cohen: How to Have Hard Conversations",
            source: "TED",
            duration: "13 min",
            url: "https://www.youtube.com/watch?v=PbKfKLqvuSk",
            description: "A mediator shares what happens when we avoid hard conversations—and the surprising freedom in having them."
          },
          keyTakeaways: [
            "We avoid hard conversations to protect relationships—but avoidance damages them more",
            "The goal isn't to win—it's to understand and be understood",
            "Name the elephant: 'There's something I've been avoiding talking about...'",
            "Separate intent from impact—they meant well but the effect was harmful"
          ],
          reflectionPrompts: [
            "What hard conversation have you been avoiding?",
            "What's the cost of continuing to avoid it?",
            "What would it take to have it this week?"
          ]
        }
      },
      {
        id: 'f7-s5',
        type: SESSION_TYPES.LESSON,
        title: 'Managing Your Emotions',
        theme: 'emotional-regulation',
        estimatedMinutes: 5,
        content: {
          opening: "The hardest part of difficult conversations isn't what to say—it's managing yourself.",
          keyInsight: "When we're triggered, we lose access to our prefrontal cortex (rational brain) and operate from our amygdala (reactive brain). The goal isn't to eliminate emotions—it's to create space between stimulus and response.",
          framework: {
            name: "The STOP Technique",
            description: "When you feel your emotions rising",
            steps: [
              { letter: "S", name: "Stop", description: "Pause. Don't react immediately." },
              { letter: "T", name: "Take a breath", description: "One slow, deep breath resets your nervous system." },
              { letter: "O", name: "Observe", description: "Notice what you're feeling without judgment." },
              { letter: "P", name: "Proceed", description: "Choose your response intentionally." }
            ]
          }
        }
      },
      {
        id: 'f7-s6',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Conversation You\'ve Been Avoiding',
        theme: 'difficult-conversations',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Schedule the Difficult Conversation",
            description: "Identify the conversation you've been avoiding. Use DESC to prepare. Schedule it within the next 48 hours."
          },
          rules: [
            "Write out your DESC script beforehand",
            "Practice saying it out loud",
            "Go in curious, not certain",
            "Follow up within 24 hours"
          ],
          whyThisWorks: "The anticipation is almost always worse than the conversation itself. Done is better than perfect."
        }
      },
      {
        id: 'f7-s7',
        type: SESSION_TYPES.LESSON,
        title: 'After the Conversation',
        theme: 'follow-up',
        estimatedMinutes: 4,
        content: {
          opening: "A difficult conversation isn't complete when it ends. Follow-up determines impact.",
          keyInsight: "The first 24 hours after a difficult conversation are critical. Your follow-up shows whether you meant what you said.",
          framework: {
            name: "The 24-Hour Follow-Up",
            description: "Three things to do after every difficult conversation",
            steps: [
              { name: "Document", description: "Send a brief email summarizing what was discussed and agreed" },
              { name: "Check In", description: "Within 24 hours, check in briefly: 'How are you doing after our conversation?'" },
              { name: "Track", description: "Put a reminder to revisit progress in 2 weeks" }
            ]
          }
        }
      },
      {
        id: 'f7-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Difficult Conversation Playbook',
        theme: 'difficult-conversations',
        estimatedMinutes: 5,
        content: {
          opening: "You now have frameworks for before, during, and after difficult conversations.",
          synthesis: {
            recap: [
              "DESC: Describe, Express, Specify, Consequences",
              "STOP: Stop, Take a breath, Observe, Proceed",
              "Follow up within 24 hours",
              "Anticipation > the actual conversation"
            ],
            guidingQuestions: [
              "What's your go-to avoidance pattern? (Hoping it resolves, delegating it, letting it fester?)",
              "What's the conversation you need to have this week?",
              "How will you prepare yourself emotionally?"
            ]
          },
          closing: "The leaders people respect most aren't the ones who avoid hard things—they're the ones who face them with grace."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 8: COACHING YOUR TEAM
  // ============================================
  {
    id: 'focus-008',
    order: 8,
    phase: 'growth',
    title: 'Coaching Your Team',
    subtitle: 'From Manager to Coach',
    description: 'Shift from giving answers to developing thinkers who solve their own problems.',
    icon: '🎓',
    gradient: 'from-purple-500 to-violet-600',
    estimatedDays: 6,
    learningObjectives: [
      'Understand the difference between managing and coaching',
      'Master the GROW coaching model',
      'Ask powerful questions that develop thinking',
      'Know when to coach vs. direct'
    ],
    sessions: [
      {
        id: 'f8-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Shift',
        theme: 'coaching',
        estimatedMinutes: 3,
        content: {
          quote: "Leaders who coach are saying: 'You're capable of figuring this out.' Leaders who tell are saying: 'I don't trust you to think.'",
          author: "Michael Bungay Stanier",
          source: "The Coaching Habit",
          whyItMatters: "Every time you give an answer, you steal a learning opportunity. Every time you ask a good question, you build capacity.",
          reflectionPrompts: [
            "What percentage of your conversations are coaching vs. telling?",
            "Who on your team has the most untapped potential?",
            "What would happen if you asked more questions and gave fewer answers?"
          ]
        }
      },
      {
        id: 'f8-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The GROW Model',
        theme: 'coaching',
        estimatedMinutes: 5,
        content: {
          opening: "GROW is the most widely used coaching framework in the world—because it works.",
          keyInsight: "Most managers jump to 'Options' or 'Way Forward' without establishing the Goal or understanding the Reality. This makes advice premature and often wrong.",
          framework: {
            name: "GROW",
            description: "A structure for coaching conversations",
            steps: [
              { 
                letter: "G", 
                name: "Goal", 
                description: "What do you want to achieve?",
                example: "Not 'Tell me what's wrong' but 'What outcome are you hoping for?'"
              },
              { 
                letter: "R", 
                name: "Reality", 
                description: "Where are you now?",
                example: "What have you tried? What's getting in the way?"
              },
              { 
                letter: "O", 
                name: "Options", 
                description: "What could you do?",
                example: "What options do you see? What else? (Always ask 'What else?')"
              },
              { 
                letter: "W", 
                name: "Way Forward", 
                description: "What will you do?",
                example: "Which option feels right? What's your first step?"
              }
            ]
          }
        }
      },
      {
        id: 'f8-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Powerful Questions',
        theme: 'coaching',
        estimatedMinutes: 5,
        content: {
          opening: "The quality of your coaching depends on the quality of your questions.",
          keyInsight: "'What else?' is the best coaching question. It stops you from accepting the first answer and pushes them to think deeper.",
          framework: {
            name: "The Essential Coaching Questions",
            description: "Questions that develop thinking",
            steps: [
              { name: "The Focus Question", description: "What's the real challenge here for you?" },
              { name: "The Digging Question", description: "And what else?" },
              { name: "The Foundation Question", description: "What do you want?" },
              { name: "The Lazy Question", description: "How can I help?" },
              { name: "The Strategic Question", description: "If you're saying yes to this, what are you saying no to?" }
            ]
          }
        },
        goDeeper: {
          type: 'practice',
          title: 'The Question Card',
          prompt: "Write the 5 coaching questions on a card and keep it visible during your next 3 conversations. Challenge yourself to ask at least 2 of them before offering any advice.",
          duration: '5 min setup'
        }
      },
      {
        id: 'f8-s4',
        type: SESSION_TYPES.BOOK,
        title: 'The Coaching Habit',
        theme: 'coaching',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "The Coaching Habit",
            author: "Michael Bungay Stanier",
            published: 2016,
            oneSentenceSummary: "Say less, ask more, and change the way you lead forever—through seven essential questions.",
            bigIdea: "The advice monster inside every leader wants to jump in and solve problems. Taming it is the key to developing your team.",
            keyQuotes: [
              "Can you see how by giving advice, you're letting yourself off the hook?",
              "The single most powerful question you can ask is: 'And what else?'",
              "You don't need to have the answer. You need to have the question."
            ],
            leadershipApplication: "Coaching isn't an event—it's a daily stance. Every conversation is an opportunity to develop someone."
          }
        },
        goDeeper: {
          type: 'read',
          title: 'The Full Book',
          prompt: "If this resonated, read 'The Coaching Habit' by Michael Bungay Stanier. It's a quick 150 pages and will transform how you lead conversations.",
          duration: '3-4 hours'
        }
      },
      {
        id: 'f8-s5',
        type: SESSION_TYPES.VIDEO,
        title: 'How Great Leaders Inspire Action',
        theme: 'coaching',
        estimatedMinutes: 18,
        content: {
          video: {
            title: "Simon Sinek: How Great Leaders Inspire Action",
            source: "TED",
            duration: "18 min",
            url: "https://www.youtube.com/watch?v=qp0HIF3SfI4",
            description: "The most-watched TED Talk on leadership explores how great leaders inspire rather than instruct."
          },
          keyTakeaways: [
            "People don't buy WHAT you do—they buy WHY you do it",
            "The Golden Circle: Start with WHY, then HOW, then WHAT",
            "Great leaders make people feel like they belong",
            "Coaching connects daily tasks to meaningful purpose"
          ],
          reflectionPrompts: [
            "Does your team know your WHY?",
            "How do you make people feel when you coach them?",
            "Are you inspiring action or just assigning tasks?"
          ]
        }
      },
      {
        id: 'f8-s6',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Overwhelmed Team Member',
        theme: 'coaching',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "A team member comes to you clearly overwhelmed. They have too much on their plate and are starting to miss deadlines. They say: 'I don't know how I'm going to get it all done.'",
            complication: "Your instinct is to jump in and fix it—reassign work, extend deadlines, take things off their plate. But you know that won't build their capacity."
          },
          responseOptions: [
            {
              option: "Fix it: Take some of their work yourself",
              analysis: "Temporarily solves the problem but creates dependency. They learn that overwhelm = rescue."
            },
            {
              option: "Coach it: Ask 'What's the real challenge here for you?'",
              analysis: "Opens up the conversation. Maybe it's prioritization. Maybe it's saying no. Maybe it's perfectionism. You won't know until you ask."
            },
            {
              option: "Ignore it: Tell them to figure it out",
              analysis: "Abandonment isn't empowerment. They need support, just not your solutions."
            },
            {
              option: "Combine: Ask questions first, then offer to help",
              analysis: "Best approach. Coach first to build their problem-solving, then offer targeted support if needed."
            }
          ],
          principle: "The goal of coaching isn't to solve the problem—it's to develop problem-solvers."
        }
      },
      {
        id: 'f8-s7',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Coaching Challenge',
        theme: 'coaching',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "One Full Coaching Conversation",
            description: "The next time someone brings you a problem, resist the urge to solve it. Use GROW to coach them to their own solution."
          },
          rules: [
            "Ask at least 5 questions before offering any advice",
            "Use 'What else?' at least twice",
            "Don't solve the problem—let them",
            "Notice how it feels to hold back"
          ],
          whyThisWorks: "The answer they discover themselves is always more powerful than the one you give them."
        }
      },
      {
        id: 'f8-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Coaching Identity',
        theme: 'coaching',
        estimatedMinutes: 5,
        content: {
          opening: "Let's cement your shift from manager to coach.",
          synthesis: {
            recap: [
              "GROW: Goal, Reality, Options, Way Forward",
              "Powerful questions develop thinkers",
              "'What else?' is magic",
              "Coaching builds capacity; telling creates dependency"
            ],
            guidingQuestions: [
              "What's your advice monster's favorite way to take over?",
              "Who on your team would benefit most from a coaching approach?",
              "What question will you commit to asking more often?"
            ]
          },
          closing: "The best leaders aren't the ones with all the answers. They're the ones who help others find their own."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 9: EMOTIONAL INTELLIGENCE
  // ============================================
  {
    id: 'focus-009',
    order: 9,
    phase: 'growth',
    title: 'Emotional Intelligence',
    subtitle: 'The Leader\'s Edge',
    description: 'Develop the self-awareness and social skills that separate good leaders from great ones.',
    icon: '💡',
    gradient: 'from-indigo-500 to-blue-600',
    estimatedDays: 6,
    learningObjectives: [
      'Understand the four domains of EQ',
      'Build self-awareness practices',
      'Develop empathy skills',
      'Regulate emotions under pressure'
    ],
    sessions: [
      {
        id: 'f9-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The EQ Advantage',
        theme: 'emotional-intelligence',
        estimatedMinutes: 3,
        content: {
          quote: "In a high-IQ job pool, soft skills like discipline, drive, and empathy mark those who emerge as outstanding.",
          author: "Daniel Goleman",
          source: "Emotional Intelligence",
          whyItMatters: "Technical skills get you hired. Emotional intelligence gets you promoted—and determines how effective you are as a leader.",
          reflectionPrompts: [
            "When has your emotional intelligence (or lack of it) affected a leadership moment?",
            "What emotion do you find hardest to regulate?",
            "How would your team describe your emotional presence?"
          ]
        }
      },
      {
        id: 'f9-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Four Domains',
        theme: 'emotional-intelligence',
        estimatedMinutes: 5,
        content: {
          opening: "Emotional intelligence isn't one thing—it's four interconnected skills.",
          keyInsight: "Most development happens in order: Self-Awareness → Self-Management → Social Awareness → Relationship Management. You can't manage what you don't first see.",
          framework: {
            name: "The Four EQ Domains",
            description: "Daniel Goleman's model",
            steps: [
              { 
                name: "Self-Awareness", 
                description: "Recognizing your own emotions and their effects",
                example: "Knowing when you're frustrated before it shows"
              },
              { 
                name: "Self-Management", 
                description: "Managing your emotional responses",
                example: "Staying calm when attacked in a meeting"
              },
              { 
                name: "Social Awareness", 
                description: "Reading others' emotions and group dynamics",
                example: "Sensing when the room has shifted"
              },
              { 
                name: "Relationship Management", 
                description: "Using awareness to manage interactions",
                example: "Diffusing tension between team members"
              }
            ]
          }
        },
        goDeeper: {
          type: 'observe',
          title: 'Emotion Tracking',
          prompt: "Set 3 random alarms today. When each goes off, pause and name your current emotion. Write it down. At day's end, review: What patterns do you notice?",
          duration: 'Throughout day'
        }
      },
      {
        id: 'f9-s3',
        type: SESSION_TYPES.REFLECTION,
        title: 'Your Emotional Patterns',
        theme: 'self-awareness',
        estimatedMinutes: 5,
        content: {
          opening: "Self-awareness starts with noticing your patterns.",
          concept: "We all have emotional triggers—situations that predictably hijack our best selves. Knowing them is the first step to managing them.",
          reflectionExercise: {
            name: "The Trigger Map",
            steps: [
              {
                step: 1,
                prompt: "What situations consistently trigger strong negative emotions in you at work? (Interruptions? Being challenged publicly? Last-minute changes?)",
                followUp: "Name 2-3 specific triggers."
              },
              {
                step: 2,
                prompt: "For each trigger, what emotion shows up? (Anger? Anxiety? Defensiveness?)",
                followUp: "Be specific—'frustrated' and 'overwhelmed' are different."
              },
              {
                step: 3,
                prompt: "What do you typically DO when triggered? (Shut down? Get loud? Leave?)",
                followUp: "This is your default response. It can be changed."
              }
            ]
          },
          closingInsight: "Triggers aren't the problem. Automatic, unconscious reactions are. Once you see the pattern, you can interrupt it."
        }
      },
      {
        id: 'f9-s4',
        type: SESSION_TYPES.LESSON,
        title: 'The Empathy Gap',
        theme: 'empathy',
        estimatedMinutes: 5,
        content: {
          opening: "Empathy is the ability to understand and share the feelings of another. It's also wildly misunderstood.",
          keyInsight: "Empathy isn't agreement. You can deeply understand someone's perspective and still disagree with their conclusion. Empathy says: 'I see why you feel that way.' It doesn't say: 'You're right.'",
          framework: {
            name: "Three Types of Empathy",
            description: "Leaders need all three",
            steps: [
              { 
                name: "Cognitive Empathy", 
                description: "Understanding their perspective intellectually",
                example: "'I can see why that decision frustrated you.'"
              },
              { 
                name: "Emotional Empathy", 
                description: "Feeling what they feel",
                example: "Actually sensing their disappointment or excitement"
              },
              { 
                name: "Empathic Concern", 
                description: "Caring about their wellbeing",
                example: "Being moved to help, not just understand"
              }
            ]
          }
        }
      },
      {
        id: 'f9-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Empathy Practice',
        theme: 'empathy',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "One Deep Empathy Conversation",
            description: "Have a conversation where your only goal is to understand someone else's perspective—especially someone you disagree with or find difficult."
          },
          rules: [
            "Ask questions only to understand, not to rebut",
            "Summarize their position to their satisfaction before responding",
            "Notice your urge to correct or argue—and resist it",
            "Say: 'Help me understand...' at least twice"
          ],
          whyThisWorks: "Most disagreements aren't about facts—they're about unacknowledged feelings. Empathy opens doors that logic can't."
        }
      },
      {
        id: 'f9-s6',
        type: SESSION_TYPES.VIDEO,
        title: 'The Power of Emotional Intelligence',
        theme: 'emotional-intelligence',
        estimatedMinutes: 12,
        content: {
          video: {
            title: "Travis Bradberry: The Power of Emotional Intelligence",
            source: "TEDx",
            duration: "12 min",
            url: "https://www.youtube.com/watch?v=auXNnTmhHsk",
            description: "The co-author of Emotional Intelligence 2.0 explains why EQ matters more than IQ for success."
          },
          keyTakeaways: [
            "EQ accounts for 58% of job performance across all job types",
            "EQ can be learned and improved—unlike IQ",
            "The top performers are high in EQ, not necessarily IQ",
            "Self-awareness is the foundation—you can't manage what you don't see"
          ],
          reflectionPrompts: [
            "What's your biggest EQ blind spot?",
            "When has your EQ (or lack of it) impacted your leadership?",
            "What would improve if you increased your EQ by 10%?"
          ]
        }
      },
      {
        id: 'f9-s7',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Emotional Hijack',
        theme: 'emotional-intelligence',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "In a team meeting, a colleague publicly criticizes your project in a way that feels unfair and personal. Your face flushes, your heart rate spikes, and you feel an intense urge to fire back.",
            complication: "The whole team is watching. Your response will set the tone. You have about 3 seconds to choose."
          },
          responseOptions: [
            {
              option: "Fire back with equal intensity",
              analysis: "Feels satisfying for 5 seconds. Damages the relationship for months. You've just shown everyone you can be destabilized."
            },
            {
              option: "Shut down—go quiet and sullen",
              analysis: "Avoids escalation but doesn't address the issue. Your team sees you can be silenced. You'll ruminate for hours."
            },
            {
              option: "Name it neutrally: 'That's strong feedback. Help me understand your concern.'",
              analysis: "Shows composure under fire. Opens dialogue without escalating. Buys you time to regulate while engaging productively."
            },
            {
              option: "Pause, breathe, say: 'Let me think about that and follow up.'",
              analysis: "Buys time for full de-escalation. Doesn't let the moment pass but doesn't react emotionally either."
            }
          ],
          principle: "Between stimulus and response, there's a space. In that space lies your power. The emotionally intelligent leader expands that space."
        }
      },
      {
        id: 'f9-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your EQ Development Plan',
        theme: 'emotional-intelligence',
        estimatedMinutes: 5,
        content: {
          opening: "EQ isn't fixed. It can be developed at any age with intentional practice.",
          synthesis: {
            recap: [
              "Four domains: Self-Awareness → Self-Management → Social Awareness → Relationship Management",
              "Know your triggers and default responses",
              "Empathy ≠ Agreement",
              "Three types: Cognitive, Emotional, Empathic Concern"
            ],
            guidingQuestions: [
              "Which EQ domain is your strength? Which needs the most work?",
              "What's one trigger you want to manage better?",
              "Who deserves more empathy from you?"
            ]
          },
          closing: "IQ gets you in the room. EQ determines how far you go once you're there."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 10: TIME & ENERGY MANAGEMENT
  // ============================================
  {
    id: 'focus-010',
    order: 10,
    phase: 'growth',
    title: 'Time & Energy',
    subtitle: 'Protecting Your Most Precious Resources',
    description: 'Learn to manage your time, protect your energy, and eliminate the busywork that kills impact.',
    icon: '⏰',
    gradient: 'from-slate-600 to-slate-800',
    estimatedDays: 6,
    learningObjectives: [
      'Apply the Eisenhower Matrix to daily decisions',
      'Identify and eliminate time wasters',
      'Protect peak energy hours',
      'Design an ideal week structure'
    ],
    sessions: [
      {
        id: 'f10-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Productivity Trap',
        theme: 'time',
        estimatedMinutes: 3,
        content: {
          quote: "Being busy is not the same as being productive. Being productive is getting the right things done.",
          author: "Tim Ferriss",
          source: "The 4-Hour Workweek",
          whyItMatters: "Many leaders wear busyness as a badge of honor. But activity without impact is just motion.",
          reflectionPrompts: [
            "Are you busy or productive?",
            "What would you stop doing if no one was watching?",
            "What's the most important thing you haven't had 'time' for?"
          ]
        }
      },
      {
        id: 'f10-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Eisenhower Matrix',
        theme: 'prioritization',
        estimatedMinutes: 5,
        content: {
          opening: "Dwight Eisenhower led the Allied forces in WWII and served as US President. He knew something about prioritization.",
          keyInsight: "Urgent tasks demand attention. Important tasks create results. The trap is spending all your time on urgent but unimportant tasks (Quadrant 3) while neglecting important but not urgent ones (Quadrant 2).",
          framework: {
            name: "The Eisenhower Matrix",
            description: "Sort tasks by urgency and importance",
            formula: "Q1 = Important + Urgent (Do) | Q2 = Important + Not Urgent (Schedule) | Q3 = Not Important + Urgent (Delegate) | Q4 = Not Important + Not Urgent (Delete)",
            steps: [
              { 
                name: "Q1: Urgent & Important", 
                description: "Crises, deadlines, emergencies",
                example: "Do these immediately. But too much Q1 = reactive leadership."
              },
              { 
                name: "Q2: Important but Not Urgent", 
                description: "Planning, development, relationship-building",
                example: "Schedule these. This is where leadership impact lives."
              },
              { 
                name: "Q3: Urgent but Not Important", 
                description: "Interruptions, some emails, others' priorities",
                example: "Delegate or decline. These feel productive but aren't."
              },
              { 
                name: "Q4: Neither", 
                description: "Time wasters, busy work",
                example: "Delete ruthlessly. Stop pretending these matter."
              }
            ]
          }
        },
        goDeeper: {
          type: 'practice',
          title: 'The Matrix Week',
          prompt: "Plot your last week's activities on the Eisenhower Matrix. What percentage was Q2 (important, not urgent)? Most leaders are shocked at how little time they spend there.",
          duration: '15 min'
        }
      },
      {
        id: 'f10-s3',
        type: SESSION_TYPES.LESSON,
        title: 'Energy Management',
        theme: 'energy',
        estimatedMinutes: 5,
        content: {
          opening: "Time is finite. But energy is renewable—if you manage it.",
          keyInsight: "Your best thinking happens during peak energy hours. Protecting these hours for Quadrant 2 work is a leadership superpower.",
          framework: {
            name: "The Energy Audit",
            description: "Understand your natural rhythms",
            steps: [
              { 
                name: "Identify Your Peak", 
                description: "When are you sharpest? (Morning? Late morning? Evening?)",
                example: "This is when you do your most important thinking."
              },
              { 
                name: "Protect It", 
                description: "Block this time. No meetings. No email.",
                example: "This is sacred time for Q2 work."
              },
              { 
                name: "Match Tasks to Energy", 
                description: "Save low-energy tasks for low-energy times",
                example: "Email after lunch. Creative work in your peak."
              },
              { 
                name: "Build in Recovery", 
                description: "Rest isn't laziness—it's performance strategy",
                example: "Short breaks between deep work sessions."
              }
            ]
          }
        }
      },
      {
        id: 'f10-s4',
        type: SESSION_TYPES.REFLECTION,
        title: 'Where Your Time Actually Goes',
        theme: 'self-awareness',
        estimatedMinutes: 5,
        content: {
          opening: "Most leaders don't know where their time goes. They think they know—but they're usually wrong.",
          reflectionExercise: {
            name: "The Honest Assessment",
            steps: [
              {
                step: 1,
                prompt: "Estimate: What percentage of your time is spent in each quadrant? Q1: ___% Q2: ___% Q3: ___% Q4: ___%",
                followUp: "Write your estimates before moving on."
              },
              {
                step: 2,
                prompt: "Think about last week specifically. What actually filled your calendar?",
                followUp: "Be honest. Did you spend time on Q2, or did Q1 and Q3 dominate?"
              },
              {
                step: 3,
                prompt: "What would change if you spent 10% more time in Q2 (important but not urgent)?",
                followUp: "This is where proactive leadership lives."
              }
            ]
          },
          closingInsight: "Leaders who spend more time in Q2 prevent Q1 crises. Prevention beats firefighting."
        }
      },
      {
        id: 'f10-s5',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Time Audit',
        theme: 'time',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "3-Day Time Tracking",
            description: "For the next 3 days, track every activity in 30-minute increments. At the end, categorize each block into Eisenhower quadrants. Be ruthlessly honest."
          },
          rules: [
            "Track as you go—memory is unreliable",
            "Include everything: calls, 'quick' checks, context-switching",
            "At the end, calculate: What % was Q1? Q2? Q3? Q4?",
            "Identify the top 3 time thieves"
          ],
          whyThisWorks: "What gets measured gets managed. Most leaders are shocked by where their time actually goes."
        }
      },
      {
        id: 'f10-s6',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Redesigning Your Week',
        theme: 'time',
        estimatedMinutes: 5,
        content: {
          opening: "Let's apply what you've learned to create an ideal week.",
          synthesis: {
            recap: [
              "Eisenhower Matrix: Urgent ≠ Important",
              "Q2 is where impact lives",
              "Protect peak energy for important work",
              "Track time to see reality"
            ],
            guidingQuestions: [
              "What's your biggest Quadrant 3 time-waster? How can you eliminate or reduce it?",
              "What Quadrant 2 activity deserves a protected time block? When will you schedule it?",
              "What's one commitment you could say no to that would free up meaningful time?"
            ]
          },
          closing: "You can't manage time. You can only manage priorities. What's truly important gets the time."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 11: STRATEGIC THINKING
  // ============================================
  {
    id: 'focus-011',
    order: 11,
    phase: 'mastery',
    title: 'Strategic Thinking',
    subtitle: 'Seeing the Bigger Picture',
    description: 'Develop the ability to think long-term, connect dots others miss, and make decisions that shape the future.',
    icon: '🎯',
    gradient: 'from-indigo-600 to-purple-600',
    estimatedDays: 7,
    learningObjectives: [
      'Distinguish strategic from tactical thinking',
      'Use frameworks for analyzing complex situations',
      'Make decisions with incomplete information',
      'Communicate strategy compellingly'
    ],
    sessions: [
      {
        id: 'f11-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Essence of Strategy',
        theme: 'strategy',
        estimatedMinutes: 3,
        content: {
          quote: "Strategy is about making choices, trade-offs; it's about deliberately choosing to be different.",
          author: "Michael Porter",
          source: "Harvard Business School",
          whyItMatters: "Strategy isn't doing more—it's choosing what NOT to do. The essence of strategy is sacrifice.",
          reflectionPrompts: [
            "What have you said 'no' to recently to protect your strategy?",
            "Where are you trying to be everything to everyone?",
            "What trade-off are you avoiding that's holding your team back?"
          ]
        }
      },
      {
        id: 'f11-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'Simon Sinek on Strategy',
        theme: 'strategy',
        estimatedMinutes: 8,
        content: {
          video: {
            title: "Most Leaders Don't Even Know the Game They're In",
            presenter: "Simon Sinek",
            platform: "YouTube",
            duration: "35 min (watch first 8 min)",
            url: "https://www.youtube.com/watch?v=RyTQ5-SQYTo",
            keyIdea: "There are two types of games: finite games (known players, fixed rules, clear end) and infinite games (unknown players, changeable rules, no end). Business and leadership are infinite games, but most leaders play them like finite games.",
            leadershipApplication: "Stop trying to 'win' against competitors. Focus on outlasting them by staying true to your cause and constantly improving."
          },
          watchPrompts: [
            "What finite game thinking do you see in your organization?",
            "How would your decisions change if you played the infinite game?",
            "What's your 'just cause' that outlasts any single goal?"
          ],
          practiceChallenge: "Identify one decision you're making with finite game thinking and reframe it for the infinite game."
        },
        goDeeper: {
          type: 'journal',
          title: 'Your Infinite Game',
          prompt: "Write about your 'just cause' - what are you working toward that's bigger than any single win? What would you still fight for even if you never got credit?",
          duration: '10 min'
        }
      },
      {
        id: 'f11-s3',
        type: SESSION_TYPES.LESSON,
        title: 'The Strategic Thinking Framework',
        theme: 'strategy',
        estimatedMinutes: 6,
        content: {
          opening: "Strategic thinking is a skill that can be developed. It has four distinct modes.",
          keyInsight: "Most people default to one mode. Great strategists fluidly move between all four.",
          framework: {
            name: "The Four Modes of Strategic Thinking",
            description: "Developed from research on how effective strategists think",
            steps: [
              {
                name: "Scanning",
                description: "Constantly gathering information from diverse sources",
                example: "What trends are emerging? What are competitors doing? What do customers really want?"
              },
              {
                name: "Visioning",
                description: "Creating a compelling picture of the future",
                example: "What could be possible? What would wild success look like?"
              },
              {
                name: "Analyzing",
                description: "Breaking down complex situations into components",
                example: "What are the root causes? What are the dependencies? What are the risks?"
              },
              {
                name: "Synthesizing",
                description: "Connecting disparate ideas into coherent strategy",
                example: "How do these pieces fit together? What's the insight others are missing?"
              }
            ]
          },
          coachingPrompts: [
            "Which mode comes most naturally to you?",
            "Which mode do you avoid or underuse?",
            "How can you strengthen your weakest mode?"
          ]
        }
      },
      {
        id: 'f11-s4',
        type: SESSION_TYPES.BOOK,
        title: 'Good Strategy Bad Strategy',
        theme: 'strategy',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "Good Strategy Bad Strategy",
            author: "Richard Rumelt",
            published: 2011,
            oneSentenceSummary: "Good strategy is a coherent response to a challenge; bad strategy is a list of goals disguised as strategy.",
            bigIdea: "The kernel of good strategy has three parts: a diagnosis (what's going on), a guiding policy (the approach), and coherent actions (the steps). Most 'strategies' skip the diagnosis and jump to goals.",
            keyQuotes: [
              "Bad strategy is not simply the absence of good strategy. It grows out of specific misconceptions and leadership dysfunctions.",
              "A good strategy honestly acknowledges the challenges being faced and provides an approach to overcoming them.",
              "The most powerful strategies arise from game-changing insights into the situation."
            ],
            leadershipApplication: "Before setting goals, diagnose the real challenge. Your strategy should be the focused response to THAT challenge."
          },
          watchInstead: {
            title: "Richard Rumelt: Good Strategy Bad Strategy",
            duration: "60 min",
            url: "https://www.youtube.com/watch?v=UZrTl16hZdk"
          }
        }
      },
      {
        id: 'f11-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Strategic Crossroads',
        theme: 'strategy',
        estimatedMinutes: 6,
        content: {
          setup: {
            situation: "Your company has been successful with Product A for years. A new market opportunity (Product B) has emerged, but pursuing it would require significant resources currently dedicated to Product A.",
            complication: "Leadership is split. Half want to protect the cash cow (Product A). Half see Product B as the future. Both are right. Resources are limited."
          },
          responseOptions: [
            {
              option: "Go all-in on Product B",
              analysis: "Bold but risky. If Product B succeeds, you're ahead of the curve. If it fails, you've abandoned your foundation. This requires high conviction and tolerance for ambiguity."
            },
            {
              option: "Protect Product A, experiment with B",
              analysis: "Feels safe but may be the riskiest choice—you might move too slowly and lose both markets. Innovation theater without commitment."
            },
            {
              option: "Create two separate teams with different mandates",
              analysis: "The ambidextrous organization approach. Requires strong leadership to manage the tension and prevent the established team from starving the new one."
            }
          ],
          principle: "Strategy is choice. Trying to do everything often means doing nothing well. What are you willing to sacrifice?"
        }
      },
      {
        id: 'f11-s6',
        type: SESSION_TYPES.REFLECTION,
        title: 'Your Strategic Lens',
        theme: 'strategy',
        estimatedMinutes: 5,
        content: {
          opening: "Strategic thinking requires stepping back from daily operations to see patterns.",
          concept: "Most leaders are trapped in the urgent. Strategic leaders create space for the important.",
          reflectionExercise: {
            name: "The Helicopter View",
            steps: [
              {
                step: 1,
                prompt: "Imagine you're 5 years in the future looking back. What decision you make THIS year will have mattered most?",
                followUp: "Is that where your time and attention are going?"
              },
              {
                step: 2,
                prompt: "What is everyone in your industry assuming that might not be true?",
                followUp: "Strategy often comes from questioning assumptions others take for granted."
              },
              {
                step: 3,
                prompt: "If you had to cut half your initiatives, which would you keep?",
                followUp: "This reveals your true priorities—and where you might be spreading too thin."
              }
            ]
          },
          closingInsight: "Strategic leaders carve out time to think. If your calendar is 100% meetings, you're not leading strategically."
        }
      },
      {
        id: 'f11-s7',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Strategy Hour',
        theme: 'strategy',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Block One Hour for Strategic Thinking",
            description: "This week, block one uninterrupted hour on your calendar for strategic thinking. No laptop, no phone, just you and a notebook. Think about where your team/company should be in 3 years."
          },
          rules: [
            "Protect this time like your most important meeting",
            "Leave the office or go somewhere different",
            "No agenda—let your mind wander across the big picture",
            "Capture the one insight that emerges"
          ],
          whyThisWorks: "Strategic insights rarely come during busy work. They come when we create space for them. Most leaders never create this space."
        }
      },
      {
        id: 'f11-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Becoming a Strategic Leader',
        theme: 'strategy',
        estimatedMinutes: 5,
        content: {
          opening: "Strategic thinking is a practice, not an event. Let's commit to building this muscle.",
          synthesis: {
            recap: [
              "Strategy is about choices and trade-offs",
              "Four modes: Scanning, Visioning, Analyzing, Synthesizing",
              "Good strategy = Diagnosis + Guiding Policy + Coherent Actions",
              "Create space for strategic thinking"
            ],
            guidingQuestions: [
              "What's the biggest strategic question facing your team right now?",
              "How will you create regular space for strategic thinking?",
              "What assumption in your industry deserves to be challenged?"
            ]
          },
          closing: "The leaders who shape the future are the ones who take time to think about it. Be that leader."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 12: INFLUENCE & PERSUASION
  // ============================================
  {
    id: 'focus-012',
    order: 12,
    phase: 'mastery',
    title: 'Influence & Persuasion',
    subtitle: 'Moving People Without Authority',
    description: 'Master the art of influencing others through understanding, credibility, and compelling communication.',
    icon: '🎭',
    gradient: 'from-rose-500 to-pink-600',
    estimatedDays: 7,
    learningObjectives: [
      'Understand the psychology of influence',
      'Build and leverage credibility',
      'Craft persuasive arguments',
      'Navigate organizational politics ethically'
    ],
    sessions: [
      {
        id: 'f12-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Nature of Influence',
        theme: 'influence',
        estimatedMinutes: 3,
        content: {
          quote: "Leadership is the art of getting someone else to do something you want done because he wants to do it.",
          author: "Dwight D. Eisenhower",
          source: "34th President of the United States",
          whyItMatters: "True influence isn't about force or manipulation—it's about alignment. The best leaders help people see how what needs to be done serves what they care about.",
          reflectionPrompts: [
            "When have you been genuinely influenced (not manipulated) by someone?",
            "What made that influence feel welcome rather than coercive?",
            "Where do you need to influence without direct authority?"
          ]
        }
      },
      {
        id: 'f12-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'The Science of Persuasion',
        theme: 'influence',
        estimatedMinutes: 12,
        content: {
          video: {
            title: "Science of Persuasion",
            presenter: "Robert Cialdini",
            platform: "YouTube",
            duration: "12 min",
            url: "https://www.youtube.com/watch?v=cFdCzN7RYbw",
            keyIdea: "There are six universal principles of ethical persuasion: Reciprocity, Scarcity, Authority, Consistency, Liking, and Consensus. Understanding these helps you influence ethically and recognize when others are trying to influence you.",
            leadershipApplication: "Ethical influence is about helping people make decisions that are good for them. These principles work because they align with how humans naturally make decisions."
          },
          watchPrompts: [
            "Which principle do you naturally use most?",
            "Which principle could you use more effectively?",
            "Have you seen these principles used unethically? How did it feel?"
          ],
          practiceChallenge: "This week, consciously use one of Cialdini's principles in a conversation where you need to influence someone."
        }
      },
      {
        id: 'f12-s3',
        type: SESSION_TYPES.BOOK,
        title: 'Influence: The Psychology of Persuasion',
        theme: 'influence',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "Influence: The Psychology of Persuasion",
            author: "Robert Cialdini",
            published: 1984,
            oneSentenceSummary: "Six fundamental principles explain why people say 'yes'—and how to apply them ethically.",
            bigIdea: "We use mental shortcuts to make decisions. These shortcuts can be triggered by specific cues. Understanding them makes you both more influential and more resistant to manipulation.",
            keyQuotes: [
              "A well-known principle of human behavior says that when we ask someone to do us a favor we will be more successful if we provide a reason.",
              "The rule for reciprocation says that we should try to repay what another person has provided us.",
              "People prefer to say yes to those they know and like."
            ],
            leadershipApplication: "Leaders who understand influence don't manipulate—they create conditions where people naturally want to follow and contribute."
          },
          watchInstead: {
            title: "Robert Cialdini: The Power of Persuasion",
            duration: "45 min",
            url: "https://www.youtube.com/watch?v=F5fBIWNdfl4"
          }
        }
      },
      {
        id: 'f12-s4',
        type: SESSION_TYPES.LESSON,
        title: 'The Influence Equation',
        theme: 'influence',
        estimatedMinutes: 5,
        content: {
          opening: "Influence isn't magic—it follows patterns you can learn.",
          keyInsight: "Most failed attempts at influence start with what YOU want instead of what THEY need. Flip the script.",
          framework: {
            name: "The CARE Framework for Influence",
            description: "Four elements of ethical, effective influence",
            steps: [
              {
                letter: "C",
                name: "Credibility",
                description: "Have you earned the right to be heard?",
                example: "Expertise, track record, reputation. If you lack credibility, borrow it from others who have it."
              },
              {
                letter: "A",
                name: "Alignment",
                description: "Does what you want serve what they want?",
                example: "Find the overlap between your goals and their interests. Make it about them."
              },
              {
                letter: "R",
                name: "Reasoning",
                description: "Is your logic sound and clear?",
                example: "Data, evidence, clear cause-and-effect. But remember: logic rarely changes minds alone."
              },
              {
                letter: "E",
                name: "Emotion",
                description: "Have you connected to what they care about?",
                example: "Stories, values, vision. People decide emotionally and justify logically."
              }
            ]
          },
          coachingPrompts: [
            "Think of someone you need to influence. What do THEY care about?",
            "Where's the overlap between what you want and what they want?",
            "What's the story that would resonate with them?"
          ]
        }
      },
      {
        id: 'f12-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'Influencing Up',
        theme: 'influence',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You've identified a significant opportunity that would require your organization to change direction. You're convinced it's the right move, but your boss is skeptical and senior leadership hasn't shown interest.",
            complication: "You don't have authority to make this decision. You need to influence up—and possibly around—the organization."
          },
          responseOptions: [
            {
              option: "Build a compelling business case with data",
              analysis: "Necessary but rarely sufficient. Data informs but doesn't persuade. You'll need more than spreadsheets."
            },
            {
              option: "Find an ally with more organizational power",
              analysis: "Smart strategy. Influence often flows through relationships. Who already has the ear of decision-makers?"
            },
            {
              option: "Start a small pilot to prove the concept",
              analysis: "Show, don't tell. A working example is more persuasive than a prediction. Success creates its own momentum."
            },
            {
              option: "Understand your boss's concerns deeply first",
              analysis: "Often overlooked. What's driving their skepticism? Until you address THEIR concerns, they won't hear your enthusiasm."
            }
          ],
          principle: "Influencing up requires patience, proof, and politics. Start with understanding before persuading."
        }
      },
      {
        id: 'f12-s6',
        type: SESSION_TYPES.LESSON,
        title: 'Navigating Organizational Politics',
        theme: 'politics',
        estimatedMinutes: 5,
        content: {
          opening: "Politics isn't a dirty word. It's how things get done in organizations.",
          keyInsight: "Political intelligence means understanding how decisions really get made, who influences whom, and how to navigate that landscape ethically.",
          framework: {
            name: "The Political Intelligence Map",
            description: "Understanding the informal power structure",
            steps: [
              {
                name: "Identify the Real Decision-Makers",
                description: "Who actually decides? It's often not who you think.",
                example: "The person with the title may defer to someone with more expertise or longer tenure."
              },
              {
                name: "Map the Influencers",
                description: "Who do the decision-makers listen to?",
                example: "These are your potential allies—or obstacles."
              },
              {
                name: "Understand the Currencies",
                description: "What do people value? What can you offer?",
                example: "Information, connections, recognition, support on their priorities."
              },
              {
                name: "Build Before You Need",
                description: "Relationships built during crisis feel transactional.",
                example: "Invest in relationships before you need to call on them."
              }
            ]
          }
        }
      },
      {
        id: 'f12-s7',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Stakeholder Mapping',
        theme: 'influence',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Map Your Influence Landscape",
            description: "For an initiative you're trying to advance, create a stakeholder map. Identify: supporters, opponents, and the persuadable. For each, note what they care about."
          },
          rules: [
            "Be honest about who's really opposed (not just indifferent)",
            "Identify the persuadable middle—this is where to focus",
            "For each person, write down what THEY care about (not what you think they should care about)",
            "Identify one ally who can help you reach someone you can't reach directly"
          ],
          whyThisWorks: "Influence is chess, not checkers. Knowing the board is the first step to playing well."
        }
      },
      {
        id: 'f12-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Influence Identity',
        theme: 'influence',
        estimatedMinutes: 5,
        content: {
          opening: "Great leaders influence with integrity. Let's define your approach.",
          synthesis: {
            recap: [
              "True influence is about alignment, not manipulation",
              "Cialdini's 6 principles: Reciprocity, Scarcity, Authority, Consistency, Liking, Consensus",
              "CARE: Credibility, Alignment, Reasoning, Emotion",
              "Build relationships before you need them"
            ],
            guidingQuestions: [
              "Where do you need more influence in your current role?",
              "Who do you need to build a relationship with proactively?",
              "What's your ethical line when it comes to influence and persuasion?"
            ]
          },
          closing: "Influence without integrity is manipulation. Influence with integrity is leadership. Choose wisely."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 13: BUILDING HIGH-PERFORMING TEAMS
  // ============================================
  {
    id: 'focus-013',
    order: 13,
    phase: 'mastery',
    title: 'High-Performing Teams',
    subtitle: 'From Group to Greatness',
    description: 'Learn what distinguishes exceptional teams and how to build the conditions for peak performance.',
    icon: '🚀',
    gradient: 'from-emerald-500 to-teal-600',
    estimatedDays: 7,
    learningObjectives: [
      'Understand what makes teams truly high-performing',
      'Build psychological safety',
      'Create clarity around roles and goals',
      'Navigate team dysfunction'
    ],
    sessions: [
      {
        id: 'f13-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Team Difference',
        theme: 'teams',
        estimatedMinutes: 3,
        content: {
          quote: "Great things in business are never done by one person. They're done by a team of people.",
          author: "Steve Jobs",
          source: "Apple co-founder",
          whyItMatters: "Individual brilliance has a ceiling. Team excellence is unlimited. The leader's job is to build the conditions where teams can do what individuals cannot.",
          reflectionPrompts: [
            "What's the best team you've ever been on? What made it great?",
            "What would your current team say about their experience?",
            "Where is your team underperforming relative to its potential?"
          ]
        },
        goDeeper: {
          type: 'journal',
          title: 'Your Best Team',
          prompt: "Write about the best team you've ever been on. What made it special? Be specific about the behaviors, not just the people. What can you recreate in your current team?",
          duration: '10 min'
        }
      },
      {
        id: 'f13-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'Google\'s Project Aristotle',
        theme: 'teams',
        estimatedMinutes: 10,
        content: {
          video: {
            title: "What Google Learned From Its Quest to Build the Perfect Team",
            presenter: "Charles Duhigg / NYT",
            platform: "YouTube",
            duration: "10 min summary",
            url: "https://www.youtube.com/watch?v=v2PaZ8Nl2T4",
            keyIdea: "Google studied 180 teams to find what made some great. Surprisingly, WHO was on the team mattered less than HOW the team worked together. The #1 factor? Psychological safety—the belief that you won't be punished for making mistakes or speaking up.",
            leadershipApplication: "Stop trying to assemble the 'best' individuals. Instead, create conditions where any group of capable people can become a great team."
          },
          watchPrompts: [
            "How psychologically safe is your current team?",
            "What happens when someone admits a mistake on your team?",
            "When was the last time you modeled vulnerability?"
          ],
          practiceChallenge: "In your next team meeting, share a mistake you made recently. Notice how people respond."
        }
      },
      {
        id: 'f13-s3',
        type: SESSION_TYPES.BOOK,
        title: 'The Five Dysfunctions of a Team',
        theme: 'teams',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "The Five Dysfunctions of a Team",
            author: "Patrick Lencioni",
            published: 2002,
            oneSentenceSummary: "Teams fail in predictable ways—and the root cause is almost always a lack of trust.",
            bigIdea: "The five dysfunctions form a pyramid: Absence of Trust → Fear of Conflict → Lack of Commitment → Avoidance of Accountability → Inattention to Results. Fix them in order, starting with trust.",
            keyQuotes: [
              "Trust is knowing that when a team member does push you, they're doing it because they care about the team.",
              "Great teams do not hold back with one another. They are unafraid to air their dirty laundry.",
              "Teams that commit to decisions and standards of performance do not hesitate to hold one another accountable."
            ],
            leadershipApplication: "When teams struggle, most leaders address symptoms (missed results) instead of root causes (lack of trust). Start at the foundation."
          },
          watchInstead: {
            title: "Patrick Lencioni: The Five Dysfunctions of a Team",
            duration: "45 min",
            url: "https://www.youtube.com/watch?v=GCxct4CR-To"
          }
        }
      },
      {
        id: 'f13-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Creating Psychological Safety',
        theme: 'teams',
        estimatedMinutes: 5,
        content: {
          opening: "Psychological safety isn't about being nice. It's about being real.",
          keyInsight: "In psychologically safe teams, people take interpersonal risks—sharing ideas, admitting mistakes, asking questions—without fear of embarrassment or punishment. This is the foundation of innovation and learning.",
          framework: {
            name: "The Safety Builders",
            description: "Leader behaviors that create psychological safety",
            steps: [
              {
                name: "Model Fallibility",
                description: "Admit your own mistakes openly",
                example: "'I got that wrong. Here's what I learned.'"
              },
              {
                name: "Invite Input",
                description: "Ask questions that signal you want honesty",
                example: "'What am I missing?' 'What could go wrong?'"
              },
              {
                name: "Respond Productively",
                description: "React to mistakes and bad news without blame",
                example: "Focus on learning, not punishment."
              },
              {
                name: "Sanction Aggression",
                description: "Don't tolerate people who make others feel unsafe",
                example: "The brilliant jerk damages the whole team."
              }
            ]
          },
          coachingPrompts: [
            "What happens on your team when someone admits a mistake?",
            "When was the last time you said 'I don't know' in front of your team?",
            "Who on your team might not feel safe speaking up?"
          ]
        }
      },
      {
        id: 'f13-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Silent Team',
        theme: 'teams',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "Your team meetings are efficient but lifeless. People nod, agree, and rarely push back. Decisions get made quickly, but execution is inconsistent. You're starting to realize: the harmony is fake.",
            complication: "You've asked for honest feedback and gotten crickets. People tell you what you want to hear. You suspect there's a lot being said outside the meetings that doesn't make it inside."
          },
          responseOptions: [
            {
              option: "Directly confront the silence in a team meeting",
              analysis: "Bold but risky. If people don't feel safe, calling out the silence publicly might make it worse. They'll feel put on the spot."
            },
            {
              option: "Have one-on-one conversations to understand the root cause",
              analysis: "Good diagnostic approach. You'll learn more in private about what's really going on. Look for patterns."
            },
            {
              option: "Model vulnerability by sharing your own concerns and uncertainties",
              analysis: "Leaders go first. If you show it's safe to be uncertain, others may follow. But it takes time and consistency."
            },
            {
              option: "Change the meeting format to require input",
              analysis: "Structural solutions can help—round robins, pre-submitted questions, anonymous polls. But they treat symptoms, not causes."
            }
          ],
          principle: "Silence isn't agreement—it's often fear. Earning honest input takes time and demonstrated safety."
        }
      },
      {
        id: 'f13-s6',
        type: SESSION_TYPES.LESSON,
        title: 'Clarity as Kindness',
        theme: 'teams',
        estimatedMinutes: 5,
        content: {
          opening: "High-performing teams have radical clarity about what matters and who does what.",
          keyInsight: "Most team frustration comes from ambiguity, not disagreement. When everyone knows the goal, their role, and how success is measured, execution accelerates.",
          framework: {
            name: "The Clarity Checklist",
            description: "What every team member should be able to answer",
            steps: [
              {
                name: "The Goal",
                description: "What does winning look like?",
                example: "Not vague aspiration—specific, measurable outcomes."
              },
              {
                name: "Their Role",
                description: "What's uniquely yours to do?",
                example: "Where you contribute that others don't."
              },
              {
                name: "The Boundaries",
                description: "Where does your authority start and stop?",
                example: "Decisions you can make vs. decisions you must escalate."
              },
              {
                name: "The Metrics",
                description: "How will we know if we're succeeding?",
                example: "Leading indicators, not just lagging ones."
              },
              {
                name: "The Norms",
                description: "How do we work together?",
                example: "Communication expectations, meeting cadence, conflict resolution."
              }
            ]
          }
        }
      },
      {
        id: 'f13-s7',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Team Health Check',
        theme: 'teams',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Conduct a Team Health Assessment",
            description: "Ask each team member to anonymously rate (1-10) these five areas: Trust, Healthy Conflict, Commitment, Accountability, Results Focus. Discuss the results together."
          },
          rules: [
            "Make it anonymous so people are honest",
            "Share the results transparently with the team",
            "Focus on the lowest-scoring area first",
            "Commit to one specific action to improve"
          ],
          whyThisWorks: "What gets measured gets attention. Many teams have never explicitly discussed their health. The conversation itself creates improvement."
        }
      },
      {
        id: 'f13-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Team Vision',
        theme: 'teams',
        estimatedMinutes: 5,
        content: {
          opening: "You can't build a great team accidentally. Let's be intentional.",
          synthesis: {
            recap: [
              "Psychological safety is the #1 predictor of team effectiveness",
              "The five dysfunctions form a pyramid—address trust first",
              "Clarity prevents frustration and accelerates execution",
              "Leader behavior sets the tone for the entire team"
            ],
            guidingQuestions: [
              "On a scale of 1-10, how psychologically safe is your team?",
              "What's one behavior you could change to improve team safety?",
              "Where does your team lack clarity that you could provide?"
            ]
          },
          closing: "A team is not just a group of people. It's a set of relationships and norms. You're the primary architect."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 14: RESILIENCE & LEADING UNDER PRESSURE
  // ============================================
  {
    id: 'focus-014',
    order: 14,
    phase: 'mastery',
    title: 'Resilience',
    subtitle: 'Leading Through Adversity',
    description: 'Develop the mental toughness and recovery practices that allow you to lead effectively under pressure.',
    icon: '💪',
    gradient: 'from-orange-500 to-red-600',
    estimatedDays: 6,
    learningObjectives: [
      'Understand the science of resilience',
      'Build stress management practices',
      'Lead others through crisis',
      'Recover from setbacks faster'
    ],
    sessions: [
      {
        id: 'f14-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Pressure Principle',
        theme: 'resilience',
        estimatedMinutes: 3,
        content: {
          quote: "The ultimate measure of a man is not where he stands in moments of comfort and convenience, but where he stands at times of challenge and controversy.",
          author: "Martin Luther King Jr.",
          source: "Strength to Love, 1963",
          whyItMatters: "Leadership reveals itself in crisis. The leader you are when things are hard is the leader you really are.",
          reflectionPrompts: [
            "Think of a time you faced significant pressure. What did it reveal about you?",
            "How do you typically respond when things go wrong?",
            "What would others say about how you handle adversity?"
          ]
        }
      },
      {
        id: 'f14-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'How to Stay Calm Under Pressure',
        theme: 'resilience',
        estimatedMinutes: 8,
        content: {
          video: {
            title: "How to Stay Calm When You Know You'll Be Stressed",
            presenter: "Daniel Levitin",
            platform: "TED",
            duration: "12 min (watch first 8)",
            url: "https://www.youtube.com/watch?v=8jPQjjsBbIc",
            keyIdea: "When we're stressed, our brains release cortisol that impairs thinking. The solution? 'Pre-mortems'—thinking about what could go wrong BEFORE it happens, while your brain is still working well. Prepare for failure, and you'll handle it better.",
            leadershipApplication: "Great leaders prepare for problems before they arrive. The time to plan your crisis response is when there's no crisis."
          },
          watchPrompts: [
            "What's a high-stress situation you could prepare for in advance?",
            "What's your 'default' crisis response? Is it helpful?",
            "What would calm, pre-planned leadership look like in your biggest worry?"
          ],
          practiceChallenge: "Do a pre-mortem on your biggest current project. What could go wrong? What will you do when it does?"
        }
      },
      {
        id: 'f14-s3',
        type: SESSION_TYPES.LESSON,
        title: 'The Resilience Framework',
        theme: 'resilience',
        estimatedMinutes: 5,
        content: {
          opening: "Resilience isn't a personality trait—it's a set of skills you can develop.",
          keyInsight: "Resilient people aren't tougher or feel less pain. They have practices that help them process difficulty and recover faster.",
          framework: {
            name: "The 4 Pillars of Resilience",
            description: "What research shows makes people bounce back",
            steps: [
              {
                name: "Physical Foundation",
                description: "Sleep, exercise, nutrition",
                example: "You can't lead well exhausted. These aren't luxuries—they're leadership tools."
              },
              {
                name: "Emotional Awareness",
                description: "Naming and processing feelings",
                example: "Suppressing emotions doesn't make them disappear—it makes them leak out sideways."
              },
              {
                name: "Cognitive Flexibility",
                description: "Reframing setbacks as learning",
                example: "It's not 'Why is this happening to me?' but 'What can I learn from this?'"
              },
              {
                name: "Connection",
                description: "Support from others",
                example: "Resilience isn't solo. We recover faster with community."
              }
            ]
          }
        }
      },
      {
        id: 'f14-s4',
        type: SESSION_TYPES.BOOK,
        title: 'Option B',
        theme: 'resilience',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "Option B: Facing Adversity, Building Resilience, and Finding Joy",
            author: "Sheryl Sandberg & Adam Grant",
            published: 2017,
            oneSentenceSummary: "When Plan A is no longer available, you can still find meaning and growth in Option B.",
            bigIdea: "After her husband's sudden death, Sheryl Sandberg worked with psychologist Adam Grant to understand resilience. The key insight: Recovery isn't about 'getting back to normal'—it's about building a new normal with the lessons learned.",
            keyQuotes: [
              "We plant the seeds of resilience in the ways we process negative events.",
              "Resilience is not about having a backbone. It's about strengthening the muscles around our backbone.",
              "We can choose to lean into suffering—and lean into joy at the same time."
            ],
            leadershipApplication: "As a leader, you'll face setbacks—personally and professionally. How you process them models resilience for your entire team."
          },
          watchInstead: {
            title: "Sheryl Sandberg: Option B",
            duration: "25 min",
            url: "https://www.youtube.com/watch?v=_MwrXcSW8ZA"
          }
        }
      },
      {
        id: 'f14-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'Leading Through Crisis',
        theme: 'resilience',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "Your company just lost its biggest client—30% of revenue. Layoffs are possible. The team is scared, rumors are spreading, and morale is crashing.",
            complication: "You're scared too. You're not sure what's going to happen. But right now, your team needs leadership."
          },
          responseOptions: [
            {
              option: "Be fully transparent about everything you know",
              analysis: "Honesty builds trust, but unfiltered fear can be contagious. Share what you know without catastrophizing."
            },
            {
              option: "Project calm confidence even if you don't feel it",
              analysis: "Your energy is contagious. Calm breeds calm. But fake optimism destroys credibility if the truth later emerges."
            },
            {
              option: "Focus the team on what they CAN control",
              analysis: "Uncertainty is toxic when paired with helplessness. Giving people agency—even small wins—restores motivation."
            },
            {
              option: "Increase communication frequency",
              analysis: "In crisis, information vacuums fill with fear. Regular updates—even 'we don't know yet'—reduce anxiety."
            }
          ],
          principle: "In crisis, your job is to provide calm clarity and focus. You can acknowledge difficulty while still leading forward."
        }
      },
      {
        id: 'f14-s6',
        type: SESSION_TYPES.REFLECTION,
        title: 'Your Stress Patterns',
        theme: 'resilience',
        estimatedMinutes: 5,
        content: {
          opening: "Self-awareness is the first step to resilience. Let's examine your patterns.",
          concept: "We all have default stress responses—some helpful, some not. Knowing yours gives you the power to choose differently.",
          reflectionExercise: {
            name: "The Stress Autopsy",
            steps: [
              {
                step: 1,
                prompt: "Think of the last time you were really stressed at work. What physical sensations did you notice? (Tight shoulders? Racing heart? Clenched jaw?)",
                followUp: "Your body signals stress before your mind recognizes it. These are your early warning signs."
              },
              {
                step: 2,
                prompt: "What did you DO when stressed? (Work more? Withdraw? Snap at people? Eat/drink? Avoid?)",
                followUp: "These are your default coping mechanisms. Are they helpful or harmful?"
              },
              {
                step: 3,
                prompt: "What helps you recover? (Exercise? Talking to someone? Sleep? Time alone?)",
                followUp: "Knowing your recovery tools helps you use them intentionally."
              }
            ]
          },
          closingInsight: "Resilience isn't about not feeling stress. It's about noticing it early and responding wisely."
        }
      },
      {
        id: 'f14-s7',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Recovery Protocol',
        theme: 'resilience',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Build a Personal Recovery Protocol",
            description: "Create a written 'recovery protocol'—a checklist of 5 things you'll do when you notice you're stressed or depleted. Post it where you'll see it."
          },
          rules: [
            "Include at least one physical activity (walk, stretch, exercise)",
            "Include something that connects you to others",
            "Include something that brings you joy (however small)",
            "Make the actions specific and doable (not 'relax' but 'take 10 deep breaths')",
            "Test it this week—use it when you feel stressed"
          ],
          whyThisWorks: "When stressed, we lose the ability to think clearly about what helps. Having a pre-made checklist removes the need to think."
        }
      },
      {
        id: 'f14-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'The Resilient Leader',
        theme: 'resilience',
        estimatedMinutes: 5,
        content: {
          opening: "Resilience isn't about being unbreakable. It's about knowing how to recover.",
          synthesis: {
            recap: [
              "Resilience is a skill, not a trait",
              "4 Pillars: Physical, Emotional, Cognitive, Connection",
              "Pre-mortems prepare you for crisis",
              "Your calm is contagious to your team"
            ],
            guidingQuestions: [
              "What's your biggest resilience vulnerability right now?",
              "What's one practice you could adopt to strengthen your recovery?",
              "How do you want to show up during your next crisis?"
            ]
          },
          closing: "Leadership is a marathon, not a sprint. Build your resilience now, before you need it."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 15: LEADING CHANGE
  // ============================================
  {
    id: 'focus-015',
    order: 15,
    phase: 'mastery',
    title: 'Leading Change',
    subtitle: 'Navigating Transformation',
    description: 'Master the art and science of leading people through organizational change.',
    icon: '🔄',
    gradient: 'from-cyan-500 to-blue-600',
    estimatedDays: 7,
    learningObjectives: [
      'Understand why change efforts fail',
      'Build a compelling case for change',
      'Manage resistance effectively',
      'Sustain momentum through the transition'
    ],
    sessions: [
      {
        id: 'f15-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'The Change Imperative',
        theme: 'change',
        estimatedMinutes: 3,
        content: {
          quote: "It is not the strongest of the species that survives, nor the most intelligent. It is the one that is most adaptable to change.",
          author: "Charles Darwin (paraphrased)",
          source: "Origin of Species principles",
          whyItMatters: "The ability to lead change is no longer optional—it's essential. Every leader today is a change leader, whether they want to be or not.",
          reflectionPrompts: [
            "What change have you successfully led?",
            "What change have you resisted? Why?",
            "What change does your team need that isn't happening?"
          ]
        }
      },
      {
        id: 'f15-s2',
        type: SESSION_TYPES.VIDEO,
        title: 'Why Change Fails',
        theme: 'change',
        estimatedMinutes: 10,
        content: {
          video: {
            title: "How to Lead Change Management",
            presenter: "Harvard Business Review / John Kotter",
            platform: "YouTube",
            duration: "10 min",
            url: "https://www.youtube.com/watch?v=1NKti9MyAAw",
            keyIdea: "70% of change initiatives fail. Not because of bad ideas, but because of poor change management. Kotter's 8-step model addresses the most common failure points: complacency, lack of coalition, vague vision, under-communication, obstacles, lack of short-term wins, declaring victory too soon, and not anchoring in culture.",
            leadershipApplication: "Change is a process, not an event. Each step matters, and skipping steps is the #1 reason change fails."
          },
          watchPrompts: [
            "Which of Kotter's 8 steps have you seen skipped?",
            "Where is your current change effort most vulnerable?",
            "What would change if you treated change as a process, not an announcement?"
          ],
          practiceChallenge: "For a change you're leading, identify which of Kotter's 8 steps needs the most attention right now."
        }
      },
      {
        id: 'f15-s3',
        type: SESSION_TYPES.BOOK,
        title: 'Leading Change',
        theme: 'change',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "Leading Change",
            author: "John Kotter",
            published: 1996,
            oneSentenceSummary: "Successful change follows eight predictable steps, and most failures can be traced to skipping one of them.",
            bigIdea: "Kotter's 8-Step Model: 1) Create urgency, 2) Build a guiding coalition, 3) Form a strategic vision, 4) Enlist a volunteer army, 5) Enable action by removing barriers, 6) Generate short-term wins, 7) Sustain acceleration, 8) Institute change in culture.",
            keyQuotes: [
              "Whenever you are tempted to skip a step, resist.",
              "Resistance is not the problem. The problem is not engaging with the resistance.",
              "The change leader's first job is to communicate, communicate, communicate."
            ],
            leadershipApplication: "Use this model as a checklist. Before announcing any change, make sure you've done the foundational work."
          },
          watchInstead: {
            title: "John Kotter: Leading Change",
            duration: "30 min",
            url: "https://www.youtube.com/watch?v=eFpGfcHB0OA"
          }
        }
      },
      {
        id: 'f15-s4',
        type: SESSION_TYPES.LESSON,
        title: 'The Change Curve',
        theme: 'change',
        estimatedMinutes: 5,
        content: {
          opening: "People don't resist change—they resist being changed. Understanding the emotional journey helps you lead with empathy.",
          keyInsight: "The change curve (based on Kübler-Ross) shows that people go through predictable emotional stages. Trying to skip stages backfires. Meet people where they are.",
          framework: {
            name: "The Change Curve Stages",
            description: "The emotional journey of change",
            steps: [
              {
                name: "Shock/Denial",
                description: "'This won't really happen' or 'This doesn't affect me'",
                example: "Don't push—provide information and give time to process."
              },
              {
                name: "Anger/Resistance",
                description: "'Why is this happening?' 'Who decided this?'",
                example: "Listen without defensiveness. Validate feelings without abandoning the change."
              },
              {
                name: "Exploration",
                description: "'What does this mean for me?' 'How will this work?'",
                example: "Provide details, training, support. Answer questions patiently."
              },
              {
                name: "Commitment",
                description: "'I see how this could work' 'I'm ready to try'",
                example: "Reinforce, celebrate small wins, don't rush to the next change."
              }
            ]
          }
        }
      },
      {
        id: 'f15-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Resistant Team',
        theme: 'change',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You're implementing a new system that will significantly change how your team works. The decision has been made—this is happening. But your team is pushing back hard. Some are openly hostile; others are passively resisting.",
            complication: "You personally believe this is the right change. But you can't ignore that the people you lead are struggling."
          },
          responseOptions: [
            {
              option: "Push through—they'll adjust eventually",
              analysis: "Sometimes necessary, but compliance isn't commitment. You'll get minimum effort and maximum criticism."
            },
            {
              option: "Slow down and over-communicate the 'why'",
              analysis: "People support what they understand. Have you explained the reasoning enough? (The answer is almost always 'no.')"
            },
            {
              option: "Find the informal leaders and win them over first",
              analysis: "Peer influence is powerful. If respected team members embrace the change, others follow."
            },
            {
              option: "Involve resisters in solving implementation problems",
              analysis: "Convert critics into co-creators. Their objections often reveal real problems that need solving anyway."
            }
          ],
          principle: "Resistance is information, not insubordination. The best change leaders engage resistance rather than suppress it."
        }
      },
      {
        id: 'f15-s6',
        type: SESSION_TYPES.LESSON,
        title: 'Communicating Change',
        theme: 'change',
        estimatedMinutes: 5,
        content: {
          opening: "In change, you cannot over-communicate. Leaders typically under-communicate by a factor of 10.",
          keyInsight: "By the time you're tired of talking about the change, people are just starting to hear it. Communication needs to be repeated through multiple channels, multiple times.",
          framework: {
            name: "The Change Communication Formula",
            description: "What people need to hear (in this order)",
            steps: [
              {
                name: "Why Change?",
                description: "What's the burning platform? Why can't we stay where we are?",
                example: "Create urgency without panic."
              },
              {
                name: "Why This Change?",
                description: "Why this approach versus alternatives?",
                example: "Show you've considered options."
              },
              {
                name: "Why Now?",
                description: "Why is this the moment?",
                example: "Timing matters. Help people see the window."
              },
              {
                name: "What's In It For Me?",
                description: "How will this affect my daily work?",
                example: "Be honest—including about the hard parts."
              },
              {
                name: "What Do You Want Me to Do?",
                description: "Specific next steps",
                example: "Give clear, actionable guidance."
              }
            ]
          }
        }
      },
      {
        id: 'f15-s7',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Change Map',
        theme: 'change',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Map Your Current Change Initiative",
            description: "For a change you're leading (or should be leading), create a one-page change map: What's the case for change? Who are the key stakeholders? What's the timeline? What are the biggest risks?"
          },
          rules: [
            "Write the 'why' in one compelling sentence",
            "List every stakeholder group and their likely reaction",
            "Identify 3 short-term wins you can engineer",
            "Name the person most likely to resist—and plan how to engage them"
          ],
          whyThisWorks: "A plan is worthless without a map. Most change efforts fail because leaders haven't thought through the human terrain."
        }
      },
      {
        id: 'f15-s8',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Becoming a Change Leader',
        theme: 'change',
        estimatedMinutes: 5,
        content: {
          opening: "In a world of constant change, the ability to lead change is a leadership superpower.",
          synthesis: {
            recap: [
              "70% of change fails—mostly from poor change management",
              "Kotter's 8 steps: don't skip any",
              "The change curve: meet people where they are",
              "You cannot over-communicate change"
            ],
            guidingQuestions: [
              "What change does your team need that you haven't been leading?",
              "Where are you in the 8 steps for your current change?",
              "Who's resisting your change? Have you really listened to understand why?"
            ]
          },
          closing: "Change is the new normal. The leaders who thrive are those who learn to lead it—not just survive it."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 16: CULTURE & VALUES
  // ============================================
  {
    id: 'focus-016',
    order: 16,
    phase: 'mastery',
    title: 'Culture & Values',
    subtitle: 'Shaping How Work Gets Done',
    description: 'Learn to intentionally build and sustain a healthy team culture.',
    icon: '🌱',
    gradient: 'from-amber-400 to-yellow-600',
    estimatedDays: 8,
    learningObjectives: [
      'Define culture and understand its components',
      'Articulate clear team values that guide behavior',
      'Recognize culture killers and how to address them',
      'Build rituals and practices that reinforce culture'
    ],
    sessions: [
      {
        id: 'f16-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'Culture by Design',
        theme: 'culture',
        estimatedMinutes: 3,
        content: {
          quote: "Culture is not just one aspect of the game—it is the game.",
          author: "Lou Gerstner",
          source: "Former IBM CEO, Who Says Elephants Can't Dance?",
          whyItMatters: "Culture isn't a poster on the wall. It's what actually happens when no one is watching—the unwritten rules that govern behavior.",
          reflectionPrompts: [
            "What is your team's real culture (not the stated one)?",
            "What behaviors does your culture reward or punish?",
            "What would a new team member learn about 'how things really work here'?"
          ]
        }
      },
      {
        id: 'f16-s2',
        type: SESSION_TYPES.LESSON,
        title: 'What Is Culture, Really?',
        theme: 'culture',
        estimatedMinutes: 5,
        content: {
          opening: "Culture is the sum of shared beliefs, behaviors, and assumptions that define 'how we do things here.'",
          keyInsight: "Culture is formed whether you shape it or not. The question isn't whether you have a culture—it's whether you're intentional about it.",
          framework: {
            name: "The Culture Iceberg",
            description: "Culture exists at multiple levels",
            steps: [
              {
                name: "Above the Surface: Artifacts",
                description: "What you can see—office layout, dress code, rituals, language",
                example: "These are symptoms of culture, not the culture itself."
              },
              {
                name: "Just Below: Espoused Values",
                description: "What people say they believe—mission statements, official values",
                example: "Often aspirational. The gap between espoused and actual values reveals true culture."
              },
              {
                name: "Deep Below: Underlying Assumptions",
                description: "Unconscious beliefs about how things work—'the way we've always done it'",
                example: "This is where culture actually lives. Change here changes everything."
              }
            ]
          }
        }
      },
      {
        id: 'f16-s3',
        type: SESSION_TYPES.VIDEO,
        title: 'The Power of Vulnerability',
        theme: 'culture',
        estimatedMinutes: 20,
        content: {
          video: {
            title: "Brené Brown: The Power of Vulnerability",
            source: "TED",
            duration: "20 min",
            url: "https://www.youtube.com/watch?v=iCvmsMzlF7o",
            description: "The foundational talk on why vulnerability is essential to connection—and therefore to culture."
          },
          keyTakeaways: [
            "Connection is why we're here—it gives purpose and meaning to our lives",
            "Shame is the fear of disconnection—it drives silence and hiding",
            "Vulnerability is the birthplace of belonging, creativity, and trust",
            "You can't have authentic culture without emotional safety"
          ],
          reflectionPrompts: [
            "Is it safe to be vulnerable on your team?",
            "What happens when someone admits a mistake?",
            "What would your team create if everyone felt emotionally safe?"
          ]
        }
      },
      {
        id: 'f16-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Values That Mean Something',
        theme: 'values',
        estimatedMinutes: 5,
        content: {
          opening: "Most corporate values are meaningless—generic words that could apply to any company.",
          keyInsight: "Values only work if they're specific enough to guide decisions. 'Integrity' is too vague. 'We tell customers the truth even when it's bad news' is actionable.",
          framework: {
            name: "The Values Test",
            description: "How to know if your values are real",
            steps: [
              {
                name: "Specific",
                description: "Could you give a concrete example of this value in action?",
                example: "'Excellence' = vague. 'We never ship known bugs' = specific."
              },
              {
                name: "Controversial",
                description: "Would a reasonable person disagree with this value?",
                example: "If no one would disagree, it's not a value—it's a platitude."
              },
              {
                name: "Costly",
                description: "Have you sacrificed something to uphold this value?",
                example: "Values only become real when tested. What did you give up?"
              },
              {
                name: "Consistent",
                description: "Do leaders live this value even when it's hard?",
                example: "People watch what leaders do, not what they say."
              }
            ]
          }
        },
        goDeeper: {
          type: 'practice',
          title: 'The Values Test',
          prompt: "Pick your team's most important stated value. Run it through the 4 tests: Is it Specific? Controversial? Costly? Consistent? If it fails any test, how could you make it stronger?",
          duration: '10 min'
        }
      },
      {
        id: 'f16-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Culture Clash',
        theme: 'culture',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You've hired a high performer from another company. They're delivering great results, but they're dismissive of colleagues, take credit for others' work, and create tension in meetings.",
            complication: "Your stated values include 'collaboration' and 'respect.' But this person's numbers are too good to ignore. What do you do?"
          },
          responseOptions: [
            {
              option: "Keep them—results are what matter",
              analysis: "You've just announced your real values: results over people. Watch your culture shift accordingly."
            },
            {
              option: "Coach them on behavior—give clear expectations",
              analysis: "Good first step. People can change, but they need to know clearly what's expected and what the consequences are."
            },
            {
              option: "Move them off the team if they don't change",
              analysis: "Painful but culture-protecting. Nothing communicates values like letting a high performer go for values violations."
            },
            {
              option: "Isolate them—limit their damage while keeping their output",
              analysis: "Compromises culture anyway. Others see that toxic behavior is tolerated for top performers."
            }
          ],
          principle: "Culture is defined by the worst behavior you tolerate from your best performer."
        },
        goDeeper: {
          type: 'discuss',
          title: 'The Brilliant Jerk Question',
          prompt: "Ask a trusted colleague: 'Do we have any brilliant jerks on our team?' and 'What does tolerating them communicate about our values?'",
          duration: '15 min'
        }
      },
      {
        id: 'f16-s6',
        type: SESSION_TYPES.BOOK,
        title: 'No Rules Rules',
        theme: 'culture',
        estimatedMinutes: 5,
        content: {
          book: {
            title: "No Rules Rules: Netflix and the Culture of Reinvention",
            author: "Reed Hastings & Erin Meyer",
            published: 2020,
            oneSentenceSummary: "Netflix's radical culture of freedom and responsibility shows what's possible when you trust talented people.",
            bigIdea: "Most rules exist because you don't trust your people. If you hire adults, treat them like adults. High talent density + candor + freedom = innovation.",
            keyQuotes: [
              "If you give employees more freedom instead of developing processes to prevent them from exercising their own judgment, they will make better decisions and it's easier to hold them accountable.",
              "The best thing you can do for employees is hire only A players to work alongside them.",
              "A company's actual values are shown by who gets rewarded or let go."
            ],
            leadershipApplication: "Culture isn't what you write down—it's what you tolerate, reward, and punish every day."
          }
        }
      },
      {
        id: 'f16-s7',
        type: SESSION_TYPES.LESSON,
        title: 'Culture Killers',
        theme: 'culture',
        estimatedMinutes: 5,
        content: {
          opening: "Culture degrades faster than it builds. Know your threats.",
          keyInsight: "Culture doesn't die in big explosions—it dies in small, tolerated compromises that compound over time.",
          framework: {
            name: "The Five Culture Killers",
            description: "What destroys healthy team culture",
            steps: [
              {
                name: "Inconsistency",
                description: "When rules apply to some but not others",
                example: "A leader who expects punctuality but is always late."
              },
              {
                name: "Silence",
                description: "When bad behavior goes unaddressed",
                example: "Everyone knows, but no one says anything."
              },
              {
                name: "Cynicism",
                description: "When people stop believing things can change",
                example: "'They'll never actually do anything about it.'"
              },
              {
                name: "Blame",
                description: "When failure leads to finger-pointing, not learning",
                example: "People hide mistakes because it's unsafe to own them."
              },
              {
                name: "Politics",
                description: "When advancement depends on relationships, not results",
                example: "The best path to success is managing up, not delivering."
              }
            ]
          }
        }
      },
      {
        id: 'f16-s8',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Culture Audit',
        theme: 'culture',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "Observe Your Culture",
            description: "Spend one day as an anthropologist. Watch your team with fresh eyes. What do behaviors, conversations, and decisions reveal about your actual culture?"
          },
          rules: [
            "Notice what gets celebrated and what gets criticized",
            "Pay attention to how meetings actually run (not how they're supposed to)",
            "Listen for the stories people tell—who are the heroes and villains?",
            "Observe what happens when someone makes a mistake"
          ],
          whyThisWorks: "You can't change what you can't see. Most leaders are too close to their culture to see it clearly."
        }
      },
      {
        id: 'f16-s9',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Culture Blueprint',
        theme: 'culture',
        estimatedMinutes: 5,
        content: {
          opening: "Culture-building is the most underrated leadership skill. Let's make it intentional.",
          synthesis: {
            recap: [
              "Culture exists whether you shape it or not",
              "Values must be specific, costly, and consistently lived",
              "Culture is defined by the worst behavior you tolerate",
              "Small compromises compound into cultural decay"
            ],
            guidingQuestions: [
              "What three words describe your actual team culture today?",
              "What one behavior would you no longer tolerate if you were truly living your values?",
              "What ritual or practice could you start this week to reinforce healthy culture?"
            ]
          },
          closing: "Culture is a leadership choice. Every day, you're either building it or eroding it. Choose intentionally."
        }
      }
    ]
  },

  // ============================================
  // FOCUS 17: EXECUTIVE PRESENCE
  // ============================================
  {
    id: 'focus-017',
    order: 17,
    phase: 'mastery',
    title: 'Executive Presence',
    subtitle: 'How Leaders Show Up',
    description: 'Develop the gravitas, communication, and appearance that command respect.',
    icon: '👔',
    gradient: 'from-slate-600 to-slate-800',
    estimatedDays: 8,
    learningObjectives: [
      'Understand the three pillars of executive presence',
      'Develop gravitas: composure under pressure',
      'Master high-stakes communication',
      'Project confidence without arrogance'
    ],
    sessions: [
      {
        id: 'f17-s1',
        type: SESSION_TYPES.QUOTE,
        title: 'Presence Before Position',
        theme: 'presence',
        estimatedMinutes: 3,
        content: {
          quote: "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.",
          author: "Jack Welch",
          source: "Former GE CEO",
          whyItMatters: "Executive presence isn't about title or authority—it's about how you show up in every room, meeting, and conversation. Do people feel your leadership before you speak?",
          reflectionPrompts: [
            "When you walk into a room, what do people sense about you?",
            "Do you project confidence or do you hope to be given it?",
            "What would change if you acted like you belonged?"
          ]
        }
      },
      {
        id: 'f17-s2',
        type: SESSION_TYPES.LESSON,
        title: 'The Three Pillars of Presence',
        theme: 'presence',
        estimatedMinutes: 5,
        content: {
          opening: "Executive presence is the 'it factor' that makes people want to follow you.",
          keyInsight: "Research by Sylvia Ann Hewlett shows executive presence has three components: Gravitas (67%), Communication (28%), and Appearance (5%). Most people focus on the wrong 5%.",
          framework: {
            name: "The Executive Presence Model",
            description: "The three components that create leadership presence",
            steps: [
              {
                name: "Gravitas (67%)",
                description: "The core of presence—composure, decisiveness, confidence",
                example: "How you handle pressure, uncertainty, and conflict. Do people trust your judgment?"
              },
              {
                name: "Communication (28%)",
                description: "How you express ideas—clarity, conciseness, command of the room",
                example: "Can you own a room? Do people listen when you speak? Can you read the room?"
              },
              {
                name: "Appearance (5%)",
                description: "Looking appropriate and polished for the context",
                example: "Not about fashion—about being put-together enough that appearance doesn't distract from message."
              }
            ]
          }
        },
        goDeeper: {
          type: 'observe',
          title: 'Presence Spotting',
          prompt: "In your next meeting, identify the person with the strongest executive presence. What specifically do they do? How do they speak, move, and respond to challenges?",
          duration: '1 meeting'
        }
      },
      {
        id: 'f17-s3',
        type: SESSION_TYPES.VIDEO,
        title: 'Your Body Language Shapes Who You Are',
        theme: 'presence',
        estimatedMinutes: 21,
        content: {
          video: {
            title: "Amy Cuddy: Your Body Language May Shape Who You Are",
            source: "TED",
            duration: "21 min",
            url: "https://www.youtube.com/watch?v=Ks-_Mh1QhMc",
            description: "Research on how 'power poses' change your body chemistry and how you show up in high-stakes situations."
          },
          keyTakeaways: [
            "Nonverbal behavior influences how others see us AND how we see ourselves",
            "High-power poses increase testosterone and decrease cortisol",
            "Fake it till you become it—not just till you make it",
            "Two minutes before a high-stakes moment: take up space"
          ],
          reflectionPrompts: [
            "What's your body language in meetings? Do you shrink or expand?",
            "Before your next big conversation, what if you power posed for 2 minutes?",
            "How would you move if you truly believed you belonged at the table?"
          ]
        },
        goDeeper: {
          type: 'practice',
          title: 'The Power Pose Experiment',
          prompt: "Before your next important meeting, find a private space and hold a power pose (arms out, taking up space) for 2 minutes. Notice how you feel walking in.",
          duration: '2 min'
        }
      },
      {
        id: 'f17-s4',
        type: SESSION_TYPES.LESSON,
        title: 'Gravitas Under Pressure',
        theme: 'gravitas',
        estimatedMinutes: 5,
        content: {
          opening: "Gravitas isn't about being loud or dominant—it's about being centered and composed when others aren't.",
          keyInsight: "Leaders with gravitas remain calm when others panic, decisive when others waffle, and grounded when others spiral. It's emotional regulation made visible.",
          framework: {
            name: "The Gravitas Practices",
            description: "Five ways to develop gravitas",
            steps: [
              {
                name: "Pause Before Responding",
                description: "Don't fill silence immediately. Think, then speak.",
                example: "The pause signals confidence. Reactive answers signal anxiety."
              },
              {
                name: "Lower Your Voice, Slow Your Speech",
                description: "Anxiety speeds us up and raises pitch. Consciously reverse it.",
                example: "Speak 20% slower than feels natural. It sounds commanding."
              },
              {
                name: "Own the Space",
                description: "Plant your feet. Use gestures deliberately. Don't fidget.",
                example: "Physical stillness projects mental steadiness."
              },
              {
                name: "Stay Curious Under Fire",
                description: "When challenged, get curious instead of defensive.",
                example: "'That's an interesting perspective. Tell me more.'"
              },
              {
                name: "Separate Facts from Feelings",
                description: "In crisis, state what's true before reacting to it.",
                example: "'Here's what we know. Here's what we don't. Here's what we're doing.'"
              }
            ]
          }
        }
      },
      {
        id: 'f17-s5',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Unexpected Challenge',
        theme: 'gravitas',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You're presenting to senior leadership when a VP suddenly challenges your data, questioning your methodology in front of everyone. The room goes quiet.",
            complication: "You're not sure if they're right. You don't have the specific data they're asking about. All eyes are on you."
          },
          responseOptions: [
            {
              option: "Defend your position immediately",
              analysis: "Might come across as defensive and reactive. If you're wrong, you've doubled down on a mistake publicly."
            },
            {
              option: "Acknowledge their point, commit to follow up",
              analysis: "Shows composure: 'That's a fair challenge. Let me verify that data and get back to you by EOD.' Buys time while showing you take it seriously."
            },
            {
              option: "Redirect: 'Let's take that offline'",
              analysis: "Can seem like avoidance. Use sparingly—sometimes it's the right move, but don't make it a habit."
            },
            {
              option: "Ask a clarifying question",
              analysis: "Shows curiosity over defensiveness: 'Help me understand the concern—which part of the methodology?' This buys time and demonstrates engagement."
            }
          ],
          principle: "Executive presence isn't never being challenged. It's how you respond when you are."
        }
      },
      {
        id: 'f17-s6',
        type: SESSION_TYPES.LESSON,
        title: 'Commanding Communication',
        theme: 'communication',
        estimatedMinutes: 5,
        content: {
          opening: "Leaders with presence communicate with clarity and conviction. They don't ramble, hedge, or apologize for their ideas.",
          keyInsight: "Most people lose executive presence through communication habits they don't notice: uptalk, hedge words, over-explaining, and burying the point.",
          framework: {
            name: "The Presence-Killing Habits",
            description: "Communication patterns that undermine your presence",
            steps: [
              {
                name: "Uptalk",
                description: "Ending statements like questions?",
                example: "Fix: Drop your voice at the end of sentences."
              },
              {
                name: "Hedge Words",
                description: "'I think,' 'sort of,' 'maybe,' 'just'",
                example: "Fix: Delete 'I think' from your vocabulary. State your view as a view."
              },
              {
                name: "Apologizing for Speaking",
                description: "'Sorry to bother you,' 'This might be stupid, but...'",
                example: "Fix: You have a right to speak. Act like it."
              },
              {
                name: "Burying the Point",
                description: "Building up to the main idea instead of leading with it",
                example: "Fix: Start with the headline. Context comes after."
              },
              {
                name: "Over-Explaining",
                description: "Giving more detail than anyone asked for",
                example: "Fix: State your point. Pause. Add detail only if asked."
              }
            ]
          }
        },
        goDeeper: {
          type: 'observe',
          title: 'The Hedge Word Audit',
          prompt: "In your next 3 meetings, notice how often you use hedge words ('I think,' 'just,' 'maybe,' 'sort of'). Tally them. The awareness alone will start changing your habits.",
          duration: '3 meetings'
        }
      },
      {
        id: 'f17-s7',
        type: SESSION_TYPES.SCENARIO,
        title: 'The Quiet Room',
        theme: 'communication',
        estimatedMinutes: 5,
        content: {
          setup: {
            situation: "You're in a meeting with several senior leaders. You have an idea that could be valuable, but you're the most junior person in the room. You've been silent for 20 minutes.",
            complication: "The conversation is moving fast. There are no natural pauses. You're starting to doubt if your idea is even worth sharing."
          },
          responseOptions: [
            {
              option: "Stay silent—you're outranked",
              analysis: "Safe but invisible. If you never speak, you never add value. Leaders will remember who contributed."
            },
            {
              option: "Wait for a perfect opening",
              analysis: "The perfect opening may never come. Meanwhile, someone else might say your idea."
            },
            {
              option: "Interject clearly: 'I want to add something.'",
              analysis: "Direct but appropriate. Don't apologize. Don't ask permission. State your point concisely and sit back."
            },
            {
              option: "Send your idea in a follow-up email",
              analysis: "Better than nothing, but you miss the live impact. Use this as backup, not default."
            }
          ],
          principle: "Presence requires showing up—not just being in the room, but being in the conversation."
        }
      },
      {
        id: 'f17-s8',
        type: SESSION_TYPES.VIDEO,
        title: 'How to Speak So That People Listen',
        theme: 'communication',
        estimatedMinutes: 10,
        content: {
          video: {
            title: "Julian Treasure: How to Speak So That People Want to Listen",
            source: "TED",
            duration: "10 min",
            url: "https://www.youtube.com/watch?v=eIho2S0ZahI",
            description: "A sound expert reveals the tools and habits that make people listen—and the ones that turn them off."
          },
          keyTakeaways: [
            "The 7 deadly sins of speaking: gossip, judging, negativity, complaining, excuses, lying, dogmatism",
            "HAIL: Honesty, Authenticity, Integrity, Love—the foundation of powerful speaking",
            "The tools: register (depth), timbre (richness), prosody (musicality), pace, pitch, volume",
            "Silence is powerful—use it intentionally"
          ],
          reflectionPrompts: [
            "Which of the 7 deadly sins do you fall into most?",
            "How would you describe your voice's 'register'? Powerful or tentative?",
            "What would change if you used silence more intentionally?"
          ]
        }
      },
      {
        id: 'f17-s9',
        type: SESSION_TYPES.CHALLENGE,
        title: 'The Presence Practice',
        theme: 'presence',
        estimatedMinutes: 3,
        content: {
          challenge: {
            title: "One Week of Intentional Presence",
            description: "For the next week, before every meeting, ask yourself: 'How do I want to show up?' Then practice one gravitas technique from this module."
          },
          rules: [
            "Before each meeting: power pose for 30 seconds",
            "In meetings: speak 20% slower than normal",
            "Remove one hedge word from your vocabulary entirely",
            "When challenged: pause, breathe, then respond"
          ],
          whyThisWorks: "Executive presence isn't a gift you have or don't have. It's a set of practices you can develop with intention."
        }
      },
      {
        id: 'f17-s10',
        type: SESSION_TYPES.INTEGRATION,
        title: 'Your Presence Platform',
        theme: 'presence',
        estimatedMinutes: 5,
        content: {
          opening: "Executive presence is the outer expression of inner confidence. Let's make it yours.",
          synthesis: {
            recap: [
              "Presence = Gravitas (67%) + Communication (28%) + Appearance (5%)",
              "Gravitas is composure under pressure—learnable, not innate",
              "Communication habits make or break presence",
              "Your body shapes your psychology"
            ],
            guidingQuestions: [
              "What's your presence gap? Gravitas, communication, or appearance?",
              "What one habit would most improve how you show up?",
              "Who do you know with strong executive presence? What specifically do they do?"
            ]
          },
          closing: "Presence isn't about being someone you're not. It's about showing up fully as who you are—with intention, confidence, and composure."
        }
      }
    ]
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current focus based on session count
 */
export const getCurrentFocus = (completedSessions) => {
  let sessionCount = 0;
  for (const focus of DETAILED_FOCUSES) {
    sessionCount += focus.sessions.length;
    if (completedSessions < sessionCount) {
      return focus;
    }
  }
  // If beyond all focuses, rotate through them
  const totalSessions = DETAILED_FOCUSES.reduce((acc, f) => acc + f.sessions.length, 0);
  const rotatedSession = completedSessions % totalSessions;
  return getCurrentFocus(rotatedSession);
};

/**
 * Get session within the current focus
 */
export const getCurrentSession = (completedSessions) => {
  let sessionCount = 0;
  for (const focus of DETAILED_FOCUSES) {
    for (const session of focus.sessions) {
      if (sessionCount === completedSessions) {
        return { focus, session, sessionInFocus: completedSessions - (sessionCount - focus.sessions.indexOf(session)) + 1 };
      }
      sessionCount++;
    }
  }
  // Rotate for infinite sessions
  const totalSessions = DETAILED_FOCUSES.reduce((acc, f) => acc + f.sessions.length, 0);
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
export const getAllFocuses = () => DETAILED_FOCUSES;

/**
 * Get focus by ID
 */
export const getFocusById = (id) => DETAILED_FOCUSES.find(f => f.id === id);

/**
 * Get total session count
 */
export const getTotalSessionCount = () => 
  DETAILED_FOCUSES.reduce((acc, f) => acc + f.sessions.length, 0);
