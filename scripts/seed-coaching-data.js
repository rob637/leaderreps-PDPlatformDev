/**
 * Seed Coaching Data Script
 * 
 * Run this in the browser console after logging in to the app.
 * 
 * Usage (in browser console):
 *   // Seed data
 *   await seedCoachingData()
 *   
 *   // Clear all coaching data  
 *   await clearCoachingData()
 *   
 *   // Clear and re-seed
 *   await clearCoachingData(); await seedCoachingData()
 */

/* global firebase */

// Copy this entire block into the browser console

(function() {
  const { collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp, writeBatch } = firebase.firestore;
  const db = firebase.firestore();

  const SESSION_TYPES = {
    OPEN_GYM: 'open_gym',
    LEADER_CIRCLE: 'leader_circle',
    WORKSHOP: 'workshop',
    LIVE_WORKOUT: 'live_workout',
    ONE_ON_ONE: 'one_on_one'
  };

  const SESSION_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  };

  // Generate dates for the next N weeks
  const getNextDate = (dayOfWeek, weeksAhead = 0) => {
    const now = new Date();
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil + (weeksAhead * 7));
    return nextDate.toISOString().split('T')[0];
  };

  // Session Types (templates)
  const sessionTypes = [
    {
      id: 'open-gym-feedback',
      title: 'Open Gym: Feedback',
      description: 'Live practice session for real-world feedback scenarios. Bring a situation you\'re facing.',
      sessionType: SESSION_TYPES.OPEN_GYM,
      coach: 'Ryan',
      durationMinutes: 60,
      maxAttendees: 15,
      skillFocus: ['feedback', 'coaching-conversations'],
      recurrence: { type: 'weekly', dayOfWeek: 2, time: '12:00 PM' },
      status: 'active'
    },
    {
      id: 'open-gym-delegation',
      title: 'Open Gym: Delegation',
      description: 'Practice delegating effectively. Learn to let go and empower your team.',
      sessionType: SESSION_TYPES.OPEN_GYM,
      coach: 'Ryan',
      durationMinutes: 60,
      maxAttendees: 15,
      skillFocus: ['delegation', 'empowerment'],
      recurrence: { type: 'weekly', dayOfWeek: 4, time: '1:00 PM' },
      status: 'active'
    },
    {
      id: 'leader-circle-new-managers',
      title: 'Leader Circle: New Managers',
      description: 'Peer coaching circle for leaders in their first 2 years of management.',
      sessionType: SESSION_TYPES.LEADER_CIRCLE,
      coach: 'Ryan',
      durationMinutes: 90,
      maxAttendees: 12,
      skillFocus: ['leadership', 'management'],
      recurrence: { type: 'biweekly', dayOfWeek: 3, time: '3:00 PM' },
      status: 'active'
    },
    {
      id: 'live-workout-quickstart',
      title: 'QuickStart Live Workout',
      description: 'Live delivery of QuickStart workout with interactive Q&A.',
      sessionType: SESSION_TYPES.LIVE_WORKOUT,
      coach: 'Ryan',
      durationMinutes: 90,
      maxAttendees: 30,
      skillFocus: ['leadership-foundations'],
      recurrence: { type: 'none' },
      status: 'active'
    }
  ];

  // Generate session instances for next 4 weeks
  const generateSessions = () => {
    const sessions = [];
    
    sessionTypes.forEach(type => {
      if (type.recurrence.type === 'none') {
        // One-off session - schedule for next week
        sessions.push({
          id: `${type.id}-${Date.now()}`,
          ...type,
          typeId: type.id,
          date: getNextDate(type.recurrence.dayOfWeek || 1, 1),
          time: type.recurrence.time || '10:00 AM',
          status: SESSION_STATUS.SCHEDULED,
          registrationCount: 0,
          spotsLeft: type.maxAttendees
        });
      } else {
        // Recurring - generate 4 weeks
        for (let week = 0; week < 4; week++) {
          if (type.recurrence.type === 'biweekly' && week % 2 !== 0) continue;
          
          sessions.push({
            id: `${type.id}-week${week}-${Date.now()}`,
            title: type.title,
            description: type.description,
            sessionType: type.sessionType,
            coach: type.coach,
            durationMinutes: type.durationMinutes,
            maxAttendees: type.maxAttendees,
            skillFocus: type.skillFocus,
            typeId: type.id,
            date: getNextDate(type.recurrence.dayOfWeek, week),
            time: type.recurrence.time,
            status: SESSION_STATUS.SCHEDULED,
            registrationCount: 0,
            spotsLeft: type.maxAttendees
          });
        }
      }
    });
    
    return sessions;
  };

  // SEED FUNCTION
  window.seedCoachingData = async function() {
    console.log('🌱 Seeding coaching data...');
    
    try {
      // 1. Seed session types
      console.log('  Creating session types...');
      for (const type of sessionTypes) {
        await setDoc(doc(db, 'coaching_session_types', type.id), {
          ...type,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log(`  ✓ Created ${sessionTypes.length} session types`);
      
      // 2. Seed session instances
      const sessions = generateSessions();
      console.log('  Creating session instances...');
      for (const session of sessions) {
        await setDoc(doc(db, 'coaching_sessions', session.id), {
          ...session,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      console.log(`  ✓ Created ${sessions.length} session instances`);
      
      console.log('✅ Coaching data seeded successfully!');
      console.log('');
      console.log('📅 Sessions created:');
      sessions.forEach(s => {
        console.log(`   ${s.date} - ${s.title} (${s.sessionType})`);
      });
      
      return { sessionTypes: sessionTypes.length, sessions: sessions.length };
    } catch (error) {
      console.error('❌ Error seeding data:', error);
      throw error;
    }
  };

  // CLEAR FUNCTION
  window.clearCoachingData = async function() {
    console.log('🧹 Clearing coaching data...');
    
    try {
      // Clear session types
      const typesSnap = await getDocs(collection(db, 'coaching_session_types'));
      console.log(`  Deleting ${typesSnap.size} session types...`);
      for (const docSnap of typesSnap.docs) {
        await deleteDoc(doc(db, 'coaching_session_types', docSnap.id));
      }
      
      // Clear sessions
      const sessionsSnap = await getDocs(collection(db, 'coaching_sessions'));
      console.log(`  Deleting ${sessionsSnap.size} sessions...`);
      for (const docSnap of sessionsSnap.docs) {
        await deleteDoc(doc(db, 'coaching_sessions', docSnap.id));
      }
      
      // Clear registrations
      const regsSnap = await getDocs(collection(db, 'coaching_registrations'));
      console.log(`  Deleting ${regsSnap.size} registrations...`);
      for (const docSnap of regsSnap.docs) {
        await deleteDoc(doc(db, 'coaching_registrations', docSnap.id));
      }
      
      console.log('✅ All coaching data cleared!');
      return { 
        typesDeleted: typesSnap.size, 
        sessionsDeleted: sessionsSnap.size,
        registrationsDeleted: regsSnap.size 
      };
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  };

  // LIST FUNCTION
  window.listCoachingSessions = async function() {
    const sessionsSnap = await getDocs(collection(db, 'coaching_sessions'));
    const sessions = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`📅 Found ${sessions.length} sessions:`);
    sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    sessions.forEach(s => {
      console.log(`   ${s.date} ${s.time} - ${s.title}`);
    });
    
    return sessions;
  };

  console.log('');
  console.log('🎯 Coaching Data Scripts Loaded!');
  console.log('');
  console.log('Available commands:');
  console.log('  await seedCoachingData()     - Create sample sessions');
  console.log('  await clearCoachingData()    - Delete all coaching data');
  console.log('  await listCoachingSessions() - List all sessions');
  console.log('');
})();
