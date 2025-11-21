import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc,
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

const MOCK_FEED_FALLBACK = [
    { id: 't1', ownerName: 'Alex H.', ownerId: 'user-alex-h', rep: 'AH', content: 'Used CLEAR framework in 1:1. Felt structured.', tier: 'T2', time: '15m ago', reactions: 8, comments: 2, isPodMember: true, impact: false },
    { id: 't2', ownerName: 'System Admin', ownerId: 'system', rep: 'SA', content: 'New Rep Streak Coins unlocked! Keep up the great work.', tier: 'System', time: '1h ago', reactions: 25, comments: 5, isPodMember: false, impact: false },
    { id: 't3', ownerName: 'Sarah K.', ownerId: 'user-sarah-k', rep: 'SK', content: 'Practiced mindful check-in before the QBR. Helped stay centered.', tier: 'T1', time: '3h ago', reactions: 12, comments: 1, isPodMember: true, impact: false },
    { id: 't4', ownerName: 'Justin M.', ownerId: 'user-justin-m', rep: 'JM', content: 'Retired a rep (Delegation SOP). Shifting focus to T5 Strategic Alignment.', tier: 'T5', time: 'Yesterday', reactions: 18, comments: 3, isPodMember: true, impact: true },
    { id: 't5', ownerName: 'Coach Support', ownerId: 'system-coach', rep: 'CS', content: 'Reminder: Office Hours today at 2 PM ET for T3 Coaching skills.', tier: 'System', time: 'Yesterday', reactions: 9, comments: 0, isPodMember: false, impact: false },
];

const MOCK_SCENARIO_CATALOG = [
  {
    id: 'underperformer-feedback',
    title: 'Addressing Chronic Underperformance',
    description: 'A previously strong team member has been missing deadlines and delivering subpar work for the past quarter. You need to address the performance gap while maintaining the relationship.',
    persona: 'Defensive Senior Developer',
    context: 'Jordan has been with the company for 4 years and was a top performer until recently. They seem disengaged in meetings and have missed three major deadlines. Other team members are starting to notice and picking up the slack.',
    complexity: 'intermediate',
    category: 'performance',
    suggestedApproach: 'Use the SBI framework to provide specific examples of the performance issues. Be curious about underlying causes—burnout, personal issues, or misalignment with work. Balance accountability with empathy.',
    learningObjectives: [
      'Deliver specific, behavior-based feedback',
      'Balance accountability with compassion',
      'Uncover root causes of performance decline',
      'Create a clear performance improvement plan'
    ]
  },
  {
    id: 'team-conflict-resolution',
    title: 'Resolving Team Conflict',
    description: 'Two high-performing team members are in constant conflict, creating tension across the entire team. Their disagreements are disrupting meetings and affecting team morale.',
    persona: 'Passive-Aggressive Marketing Manager',
    context: 'Alex and Sam have different work styles—Alex is detail-oriented and process-driven, while Sam is creative and prefers flexibility. Their differences have escalated from healthy debate to personal attacks in Slack and team meetings.',
    complexity: 'advanced',
    category: 'conflict',
    suggestedApproach: 'Meet with each person individually first to understand their perspective. Then facilitate a joint conversation focused on shared goals and professional collaboration. Set clear expectations for respectful communication.',
    learningObjectives: [
      'Navigate emotionally charged conversations',
      'Find common ground between opposing viewpoints',
      'Establish team norms for healthy conflict',
      'Address behavior without taking sides'
    ]
  },
  {
    id: 'compensation-request',
    title: 'Handling a Compensation Request',
    description: 'A valued team member has requested a significant raise, citing market rates and increased responsibilities. Budget constraints limit your ability to meet their request.',
    persona: 'High-Performer Threatening to Leave',
    context: 'Casey has been with the company for 2 years and recently took on additional project leadership responsibilities. They have a competing offer from another company and are asking for a 25% raise to stay. Your budget only allows for a 10% increase.',
    complexity: 'advanced',
    category: 'compensation',
    suggestedApproach: 'Acknowledge their contributions and value. Be transparent about budget constraints. Explore creative solutions beyond salary—title change, equity, flexible work, professional development. Avoid making promises you cannot keep.',
    learningObjectives: [
      'Navigate difficult financial conversations',
      'Balance employee needs with business constraints',
      'Explore non-monetary value propositions',
      'Make informed retention decisions'
    ]
  },
  {
    id: 'delegation-micromanager',
    title: 'Coaching an Over-Controlling Manager',
    description: 'One of your direct reports manages their team with excessive oversight, creating bottlenecks and limiting team growth. Team members have complained about lack of autonomy.',
    persona: 'Insecure First-Time Manager',
    context: 'Taylor was recently promoted to team lead after being an individual contributor. They are struggling to let go of hands-on work and are reviewing every detail of their team\'s output. Team velocity has decreased, and two team members have requested transfers.',
    complexity: 'intermediate',
    category: 'coaching',
    suggestedApproach: 'Understand the root of the controlling behavior—fear of failure, lack of trust, unclear expectations. Help them distinguish between delegation and abdication. Create a coaching plan focused on building trust and developing their team.',
    learningObjectives: [
      'Coach managers through common leadership transitions',
      'Address controlling behavior with empathy',
      'Teach effective delegation practices',
      'Balance manager development with team impact'
    ]
  },
  {
    id: 'diversity-incident',
    title: 'Responding to a Bias Incident',
    description: 'A team member has reported feeling excluded and experiencing microaggressions from a colleague. You need to investigate and address the situation while maintaining psychological safety.',
    persona: 'Defensive Colleague Accused of Bias',
    context: 'Morgan, a woman of color, reported that Drew has repeatedly talked over her in meetings, dismissed her ideas only to champion similar ideas from male colleagues, and made comments about her "being aggressive" when she advocates for herself.',
    complexity: 'expert',
    category: 'dei',
    suggestedApproach: 'Take the complaint seriously and investigate promptly. Meet with Morgan to understand her experience. Then address Drew\'s behavior with specific examples without labeling them as "racist" or "sexist" initially. Focus on impact over intent.',
    learningObjectives: [
      'Handle sensitive DEI issues with care',
      'Distinguish between impact and intent',
      'Create accountability without defensiveness',
      'Foster inclusive team behaviors'
    ]
  },
  {
    id: 'difficult-termination',
    title: 'Conducting a Difficult Termination',
    description: 'You need to terminate an employee who is well-liked by the team but has failed to meet performance standards after multiple improvement plans.',
    persona: 'Shocked Employee Facing Termination',
    context: 'Riley has been on a performance improvement plan for 90 days. Despite coaching and support, they have not demonstrated the required improvement. The team likes Riley personally, but their underperformance is creating additional burden on others.',
    complexity: 'expert',
    category: 'termination',
    suggestedApproach: 'Be clear, direct, and compassionate. This should not be a surprise if you\'ve given proper feedback. Explain the decision, outline next steps, and provide separation details. Keep it brief and dignified. Have HR present.',
    learningObjectives: [
      'Deliver difficult messages with clarity and compassion',
      'Maintain professionalism during emotional conversations',
      'Navigate legal and HR considerations',
      'Protect remaining team morale'
    ]
  },
  {
    id: 'executive-pushback',
    title: 'Pushing Back on Executive Decision',
    description: 'Senior leadership has announced a strategic decision that you believe will negatively impact your team and customers. You need to advocate for your team while managing up effectively.',
    persona: 'Impatient C-Suite Executive',
    context: 'The executive team has decided to cut your team\'s headcount by 30% while simultaneously increasing quarterly targets by 40%. You have data showing this is unrealistic and will lead to burnout, attrition, and quality issues.',
    complexity: 'expert',
    category: 'influence',
    suggestedApproach: 'Present data-driven concerns focused on business impact, not personal disagreement. Propose alternative solutions. Understand the constraints leadership is facing. Be prepared to implement the decision if your pushback is unsuccessful.',
    learningObjectives: [
      'Influence senior leadership with data and business cases',
      'Advocate for your team without being insubordinate',
      'Navigate power dynamics effectively',
      'Balance loyalty to team and organization'
    ]
  },
  {
    id: 'burnout-intervention',
    title: 'Intervening with a Burned-Out Employee',
    description: 'You notice a high-performing team member showing signs of severe burnout—working excessive hours, declining quality, emotional exhaustion. They are resistant to taking time off.',
    persona: 'Exhausted High-Achiever in Denial',
    context: 'Jamie has been working 70+ hour weeks for the past 3 months to meet a critical project deadline. The project is complete, but they continue to work excessive hours. They appear exhausted, have become irritable with teammates, and dismissively respond to suggestions to take time off.',
    complexity: 'intermediate',
    category: 'wellbeing',
    suggestedApproach: 'Express concern for their wellbeing with specific observations. Acknowledge their contributions while emphasizing that sustainable performance is the goal. Make taking time off non-negotiable, not optional. Discuss workload redistribution.',
    learningObjectives: [
      'Recognize and address burnout proactively',
      'Balance empathy with firm boundaries',
      'Model sustainable work practices',
      'Create psychological safety for vulnerability'
    ]
  }
];

const LEADERSHIP_TIERS_META_FALLBACK = {
    'All': { name: 'All Tiers', hex: '#47A88D', color: 'teal-500' },
    'T1': { name: 'Lead Self', hex: '#47A88D', color: 'green-500' },
    'T2': { name: 'Lead Work', hex: '#002E47', color: 'blue-500' },
    'T3': { name: 'Lead People', hex: '#E04E1B', color: 'amber-500' },
    'T4': { name: 'Lead Teams', hex: '#E04E1B', color: 'orange-500' },
    'T5': { name: 'Lead Strategy', hex: '#47A88D', color: 'purple-500' },
    'System': { name: 'System Info', hex: '#47A88D', color: 'gray-500' },
};

const CONTENT_CATEGORIES = [
    'Leadership Fundamentals',
    'Communication & Influence', 
    'Strategy & Decision Making',
    'Team Building & Culture',
    'Change Management',
    'Innovation & Creativity',
    'Executive Excellence',
    'Emotional Intelligence',
    'Performance & Productivity',
    'Negotiation & Conflict',
    'Sales & Marketing Leadership',
    'Finance & Operations',
    'Digital Transformation',
    'Global Leadership',
    'Entrepreneurship',
    'Personal Mastery',
    'Crisis Leadership',
    'Ethics & Purpose'
];

const SYSTEM_QUOTES = [
    "Leadership is not about being in charge. It is about taking care of those in your charge.|Simon Sinek",
    "The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.|Ronald Reagan",
    "Innovation distinguishes between a leader and a follower.|Steve Jobs",
    "A leader is one who knows the way, goes the way, and shows the way.|John C. Maxwell",
    "To handle yourself, use your head; to handle others, use your heart.|Eleanor Roosevelt",
    "The function of leadership is to produce more leaders, not more followers.|Ralph Nader",
    "Leadership is the capacity to translate vision into reality.|Warren Bennis",
    "Before you are a leader, success is all about growing yourself. When you become a leader, success is all about growing others.|Jack Welch",
    "A good leader takes a little more than his share of the blame, a little less than his share of the credit.|Arnold H. Glasow",
    "Leadership is unlocking people's potential to become better.|Bill Bradley",
    "Management is doing things right; leadership is doing the right things.|Peter Drucker",
    "The art of leadership is saying no, not saying yes. It is very easy to say yes.|Tony Blair",
    "Leadership and learning are indispensable to each other.|John F. Kennedy",
    "A leader is a dealer in hope.|Napoleon Bonaparte",
    "You don't lead by pointing and telling people some place to go. You lead by going to that place and making a case.|Ken Kesey",
    "The quality of a leader is reflected in the standards they set for themselves.|Ray Kroc",
    "Leadership is the art of giving people a platform for spreading ideas that work.|Seth Godin",
    "Great leaders are not defined by the absence of weakness, but rather by the presence of clear strengths.|John Zenger",
    "The challenge of leadership is to be strong, but not rude; be kind, but not weak; be bold, but not bully; be thoughtful, but not lazy; be humble, but not timid; be proud, but not arrogant; have humor, but without folly.|Jim Rohn",
    "Outstanding leaders go out of their way to boost the self-esteem of their personnel. If people believe in themselves, it's amazing what they can accomplish.|Sam Walton",
    "Leadership is about making others better as a result of your presence and making sure that impact lasts in your absence.|Sheryl Sandberg",
    "The task of the leader is to get his people from where they are to where they have not been.|Henry Kissinger",
    "Earn your leadership every day.|Michael Jordan",
    "Leadership is an action, not a position.|Donald McGannon",
    "The supreme quality for leadership is unquestionably integrity. Without it, no real success is possible.|Dwight D. Eisenhower",
    "Effective leadership is not about making speeches or being liked; leadership is defined by results not attributes.|Peter Drucker",
    "A true leader has the confidence to stand alone, the courage to make tough decisions, and the compassion to listen to the needs of others.|Douglas MacArthur",
    "Leadership is the ability to guide others without force into a direction or decision that leaves them still feeling empowered and accomplished.|Lisa Cash Hanson",
    "The best executive is the one who has sense enough to pick good men to do what he wants done, and self-restraint to keep from meddling with them while they do it.|Theodore Roosevelt",
    "Leadership is solving problems. The day soldiers stop bringing you their problems is the day you have stopped leading them.|Colin Powell",
    "Don't find fault, find a remedy.|Henry Ford",
    "Leaders think and talk about the solutions. Followers think and talk about the problems.|Brian Tracy",
    "The key to successful leadership today is influence, not authority.|Ken Blanchard",
    "Leadership is the capacity to influence others through inspiration motivated by a passion, generated by a vision, produced by a conviction, ignited by a purpose.|Myles Munroe",
    "A leader takes people where they want to go. A great leader takes people where they don't necessarily want to go, but ought to be.|Rosalynn Carter",
    "Leadership is the art of getting someone else to do something you want done because he wants to do it.|Dwight D. Eisenhower",
    "The very essence of leadership is that you have to have vision. You can't blow an uncertain trumpet.|Theodore Hesburgh",
    "Leadership is not a license to do less; it is a responsibility to do more.|Simon Sinek",
    "The growth and development of people is the highest calling of leadership.|Harvey S. Firestone",
    "True leadership lies in guiding others to success. In ensuring that everyone is performing at their best, doing the work they are pledged to do and doing it well.|Bill Owens",
    "Leadership is the ability to hide your panic from others.|Lao Tzu",
    "If your actions inspire others to dream more, learn more, do more and become more, you are a leader.|John Quincy Adams",
    "No man will make a great leader who wants to do it all himself, or to get all the credit for doing it.|Andrew Carnegie",
    "Leadership is the wise use of power. Power is the capacity to translate intention into reality and sustain it.|Warren Bennis",
    "The first responsibility of a leader is to define reality. The last is to say thank you. In between, the leader is a servant.|Max De Pree",
    "Leadership is about empathy. It is about having the ability to relate to and connect with people for the purpose of inspiring and empowering their lives.|Oprah Winfrey",
    "A leader is best when people barely know he exists, when his work is done, his aim fulfilled, they will say: we did it ourselves.|Lao Tzu",
    "Leadership is the ability to facilitate movement in the needed direction and have people feel good about it.|Tom Smith",
    "The mediocre teacher tells. The good teacher explains. The superior teacher demonstrates. The great teacher inspires.|William Arthur Ward",
    "Leadership is the lifting of a man's vision to higher sights, the raising of a man's performance to a higher standard, the building of a man's personality beyond its normal limitations.|Peter Drucker"
];

export const seedDatabase = async (db) => {
    console.log('🚀 Starting Client-Side Migration...');
    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    try {
        // 1. Community
        log('👥 Migrating Community Feed...');
        const communityRef = collection(db, 'content_community');
        
        for (const item of MOCK_FEED_FALLBACK) {
            // Check if exists (simple check by content to avoid dupes if run multiple times)
            const q = query(communityRef, where('content', '==', item.content));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                log(`   Updating existing thread: ${item.id}`);
                const docId = snapshot.docs[0].id;
                // Update existing doc to ensure it has dateAdded and other new fields
                await updateDoc(doc(communityRef, docId), {
                    ...item,
                    title: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : ''), // Generate a title from content
                    author: item.ownerName,
                    authorId: item.ownerId,
                    updatedAt: serverTimestamp(),
                    // Only set dateAdded if it's missing, or just update it to ensure sort works
                    dateAdded: serverTimestamp(), 
                    order: 999,
                    isActive: true,
                    type: 'post'
                });
                continue;
            }

            const newItem = {
                ...item,
                title: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : ''),
                author: item.ownerName,
                authorId: item.ownerId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                dateAdded: serverTimestamp(),
                order: 999,
                isActive: true,
                type: 'post'
            };
            delete newItem.id; // Let Firestore generate ID

            await addDoc(communityRef, newItem);
            log(`   ✅ Added thread: ${item.id}`);
        }

        // 2. Coaching
        log('🧠 Migrating Coaching Scenarios...');
        const coachingRef = collection(db, 'content_coaching');

        for (const item of MOCK_SCENARIO_CATALOG) {
             const q = query(coachingRef, where('title', '==', item.title));
             const snapshot = await getDocs(q);
             
             if (!snapshot.empty) {
                 log(`   Updating existing scenario: ${item.title}`);
                 const docId = snapshot.docs[0].id;
                 await updateDoc(doc(coachingRef, docId), {
                     ...item,
                     isActive: true,
                     updatedAt: serverTimestamp(),
                     dateAdded: serverTimestamp(),
                     order: 999,
                 });
                 continue;
             }

             const newItem = {
                 ...item,
                 isActive: true,
                 createdAt: serverTimestamp(),
                 updatedAt: serverTimestamp(),
                 dateAdded: serverTimestamp(),
                 order: 999,
             };
             delete newItem.id;

             await addDoc(coachingRef, newItem);
             log(`   ✅ Added scenario: ${item.title}`);
        }

        // 3. LOVs
        log('📋 Migrating LOVs...');
        const lovRef = collection(db, 'system_lovs');

        // Leadership Tiers
        const tiersDocRef = doc(lovRef, 'leadership_tiers');
        // We can use setDoc with merge: true to be safe
        const tiersData = {
            title: 'Leadership Tiers', // Changed from name to title for consistency with LOVManager
            description: 'System-wide leadership tiers',
            values: Object.entries(LEADERSHIP_TIERS_META_FALLBACK).map(([key, val]) => ({
                code: key,
                label: val.name,
                color: val.hex,
                isActive: true
            })),
            // Also add 'items' for LOVManager compatibility (simple list of names)
            items: Object.values(LEADERSHIP_TIERS_META_FALLBACK).map(v => v.name),
            isActive: true,
            dateAdded: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(tiersDocRef, tiersData, { merge: true });
        log('   ✅ Added/Updated LOV: leadership_tiers');

        // Content Categories
        const catsDocRef = doc(lovRef, 'content_categories');
        const catsData = {
            title: 'Content Categories',
            description: 'Categories for readings, videos, and courses',
            values: CONTENT_CATEGORIES.map(cat => ({
                code: cat.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                label: cat,
                isActive: true
            })),
            items: CONTENT_CATEGORIES,
            isActive: true,
            dateAdded: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(catsDocRef, catsData, { merge: true });
        log('   ✅ Added/Updated LOV: content_categories');

        // System Quotes
        const quotesDocRef = doc(lovRef, 'system_quotes');
        const quotesData = {
            title: 'System Quotes',
            description: 'Scrolling quotes for the top banner (Format: Quote|Author)',
            items: SYSTEM_QUOTES,
            isActive: true,
            dateAdded: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(quotesDocRef, quotesData, { merge: true });
        log('   ✅ Added/Updated LOV: system_quotes');

        log('✨ Migration Complete!');
        return { success: true, logs };
    } catch (error) {
        console.error('Migration failed:', error);
        log(`❌ Migration failed: ${error.message}`);
        return { success: false, logs, error };
    }
};
