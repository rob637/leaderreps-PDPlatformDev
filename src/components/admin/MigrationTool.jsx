import React, { useState } from 'react';
import { getFirestore, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

// Import Data directly
import readingCatalog from '../../../reading-catalog-firestore.json';
import resourceLibrary from '../../../resource_library_items.json';

const MigrationTool = () => {
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [logs, setLogs] = useState([]);
  const db = getFirestore();

  const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const runMigration = async () => {
    setStatus('running');
    setLogs([]);
    addLog('🚀 Starting Migration...');

    try {
      const batch = writeBatch(db);
      let opCount = 0;

      // Helper to commit batch if full
      const checkBatch = async () => {
        opCount++;
        if (opCount >= 400) {
          addLog('💾 Committing batch...');
          await batch.commit();
          opCount = 0;
          // In client SDK, we need a new batch after commit? 
          // Actually, batch.commit() returns a promise. We can't reuse the batch instance.
          // So this simple batch logic won't work easily without re-instantiating.
          // For simplicity in client-side migration, let's just use setDoc individually 
          // or manage batches more carefully. 
          // Given the size, individual setDoc is fine for < 1000 items, just slower.
        }
      };

      // 1. MIGRATE READINGS
      addLog('📚 Migrating Readings...');
      const categories = readingCatalog.metadata?.reading_catalog?.items || {};
      
      for (const [category, books] of Object.entries(categories)) {
        for (const book of books) {
          const id = `rr_${slugify(book.title)}`;
          const docRef = doc(db, 'content', id);
          
          await setDoc(docRef, {
            id: id,
            type: 'READ_REP',
            title: book.title,
            slug: slugify(book.title),
            description: book.theme || '',
            status: 'PUBLISHED',
            metadata: {
              author: book.author,
              complexity: book.complexity,
              durationMin: book.duration,
              focusAreas: book.focus ? book.focus.split(',').map(s => s.trim()) : [],
              category: category
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          addLog(`✅ Wrote Reading: ${book.title}`);
        }
      }

      // 2. MIGRATE RESOURCES
      addLog('🛠️ Migrating Resources...');
      const items = resourceLibrary.items || [];
      
      for (const item of items) {
        let type = 'TOOL';
        let toolType = 'RESOURCE';
        
        if (item.type === 'Video') {
          type = 'TOOL'; 
          toolType = 'VIDEO_RESOURCE';
        } else if (item.type === 'Article') {
          type = 'TOOL';
          toolType = 'ARTICLE';
        } else if (item.type === 'Tool') {
          type = 'TOOL';
          toolType = 'TEMPLATE';
        }

        const id = item.resource_id || `res_${slugify(item.title)}`;
        const docRef = doc(db, 'content', id);

        await setDoc(docRef, {
          id: id,
          type: type,
          title: item.title,
          slug: slugify(item.title),
          description: item.summary || '',
          status: 'PUBLISHED',
          metadata: {
            url: item.url,
            toolType: toolType,
            domainId: item.domain_id
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        addLog(`✅ Wrote Resource: ${item.title}`);
      }

      // 3. SCAFFOLDING
      addLog('🏗️ Scaffolding Programs & Workouts...');
      
      // Skills
      const skills = ['Feedback', 'Delegation', 'Coaching', 'Trust', 'Accountability'];
      for (const skill of skills) {
        const id = `skill_${slugify(skill)}`;
        await setDoc(doc(db, 'skills', id), {
          id: id,
          name: skill,
          slug: slugify(skill),
          description: `Master the art of ${skill}.`
        }, { merge: true });
      }

      // Workout: Feedback
      const feedbackWorkoutId = 'wkt_feedback_foundations';
      await setDoc(doc(db, 'content', feedbackWorkoutId), {
        id: feedbackWorkoutId,
        type: 'WORKOUT',
        title: 'Feedback Foundations',
        slug: 'feedback-foundations',
        description: 'Learn the core principles of giving effective feedback.',
        status: 'PUBLISHED',
        metadata: {
          durationMin: 45,
          difficulty: 'FOUNDATION',
          skills: ['skill_feedback']
        }
      }, { merge: true });

      // Program: QuickStart
      const programId = 'prog_quickstart';
      await setDoc(doc(db, 'content', programId), {
        id: programId,
        type: 'PROGRAM',
        title: 'LeaderReps QuickStart',
        slug: 'quickstart',
        description: 'The essential 4-week program for new managers.',
        status: 'PUBLISHED',
        metadata: {
          durationWeeks: 4,
          outcome: 'Shift from player to coach.',
          difficulty: 'Foundation'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      addLog('✅ Created Program: QuickStart');

      // 3.2 Create Workouts for QuickStart
      const workouts = [
        {
          id: 'wkt_foundation_identity',
          title: 'Foundations & Identity',
          description: 'Define your leadership identity and shift from player to coach.',
          sequenceOrder: 1,
          durationMin: 45
        },
        {
          id: 'wkt_delivering_results',
          title: 'Delivering Results',
          description: 'Learn how to drive team performance and hit goals.',
          sequenceOrder: 2,
          durationMin: 60
        },
        {
          id: 'wkt_building_relationships',
          title: 'Building Relationships',
          description: 'Build trust and strong connections with your direct reports.',
          sequenceOrder: 3,
          durationMin: 45
        },
        {
          id: 'wkt_lead_the_moment',
          title: 'Lead the Moment',
          description: 'Handle real-time leadership challenges effectively.',
          sequenceOrder: 4,
          durationMin: 60
        }
      ];

      for (const wkt of workouts) {
        await setDoc(doc(db, 'content', wkt.id), {
          id: wkt.id,
          type: 'WORKOUT',
          title: wkt.title,
          description: wkt.description,
          parentId: programId, // LINK TO PARENT PROGRAM
          parentType: 'PROGRAM',
          sequenceOrder: wkt.sequenceOrder,
          status: 'PUBLISHED',
          metadata: {
            durationMin: wkt.durationMin,
            difficulty: 'Foundation'
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        addLog(`✅ Created Workout: ${wkt.title}`);
      }

      addLog('✨ Migration Complete!');
      setStatus('success');

    } catch (error) {
      console.error(error);
      addLog(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  const seedSkills = async () => {
    setStatus('running');
    addLog('🧠 Seeding Skills Taxonomy...');
    
    // Comprehensive skills aligned with boss's vision
    const skills = [
      // Lead Self
      { id: 'strategic-thinking', name: 'Strategic Thinking', description: 'Analyze complex situations and plan for the future.', pillar: 'LEAD_SELF' },
      { id: 'decision-making', name: 'Decision Making', description: 'Make timely and effective choices under uncertainty.', pillar: 'LEAD_SELF' },
      { id: 'emotional-intelligence', name: 'Emotional Intelligence', description: 'Understand and manage your own emotions and those of others.', pillar: 'LEAD_SELF' },
      { id: 'prioritization', name: 'Prioritization', description: 'Focus on what matters most and manage competing demands.', pillar: 'LEAD_SELF' },
      
      // Lead Work
      { id: 'goal-setting', name: 'Goal Setting', description: 'Define clear objectives and measurable outcomes.', pillar: 'LEAD_WORK' },
      { id: 'delegation', name: 'Delegation', description: 'Assign work effectively while maintaining accountability.', pillar: 'LEAD_WORK' },
      { id: 'accountability', name: 'Accountability', description: 'Hold yourself and others responsible for commitments.', pillar: 'LEAD_WORK' },
      { id: 'change-management', name: 'Change Management', description: 'Lead teams through organizational transitions.', pillar: 'LEAD_WORK' },
      
      // Lead People
      { id: 'feedback', name: 'Feedback', description: 'Give and receive feedback that drives growth and performance.', pillar: 'LEAD_PEOPLE' },
      { id: 'coaching', name: 'Coaching', description: 'Develop talent and drive performance through guidance.', pillar: 'LEAD_PEOPLE' },
      { id: 'communication', name: 'Communication', description: 'Convey ideas clearly and effectively to diverse audiences.', pillar: 'LEAD_PEOPLE' },
      { id: 'trust', name: 'Trust & Vulnerability', description: 'Build psychological safety and authentic connections.', pillar: 'LEAD_PEOPLE' },
      { id: 'conflict', name: 'Conflict Resolution', description: 'Navigate disagreements and find constructive solutions.', pillar: 'LEAD_PEOPLE' }
    ];

    try {
      // 1. Create Skills
      for (const skill of skills) {
        await setDoc(doc(db, 'skills', skill.id), {
          ...skill,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        addLog(`✅ Created Skill: ${skill.name}`);
      }

      // 2. Tag existing content with skills
      // Tag QuickStart Program
      await setDoc(doc(db, 'content', 'prog_quickstart'), {
        skills: ['feedback', 'coaching', 'delegation', 'accountability']
      }, { merge: true });
      addLog(`🏷️ Tagged QuickStart Program`);

      // Tag Feedback Mastery Program
      await setDoc(doc(db, 'content', 'prog_feedback_mastery'), {
        skills: ['feedback', 'coaching', 'communication']
      }, { merge: true });
      addLog(`🏷️ Tagged Feedback Mastery Program`);

      // Tag Workouts
      await setDoc(doc(db, 'content', 'wkt_feedback_workout'), {
        skills: ['feedback', 'communication']
      }, { merge: true });
      addLog(`🏷️ Tagged Feedback Workout`);

      await setDoc(doc(db, 'content', 'wkt_foundation_identity'), {
        skills: ['strategic-thinking', 'emotional-intelligence']
      }, { merge: true });
      addLog(`🏷️ Tagged Foundation Identity Workout`);

      await setDoc(doc(db, 'content', 'wkt_delivering_results'), {
        skills: ['goal-setting', 'accountability', 'delegation']
      }, { merge: true });
      addLog(`🏷️ Tagged Delivering Results Workout`);

      await setDoc(doc(db, 'content', 'wkt_building_relationships'), {
        skills: ['trust', 'communication', 'coaching']
      }, { merge: true });
      addLog(`🏷️ Tagged Building Relationships Workout`);

      await setDoc(doc(db, 'content', 'wkt_lead_the_moment'), {
        skills: ['decision-making', 'conflict', 'communication']
      }, { merge: true });
      addLog(`🏷️ Tagged Lead the Moment Workout`);

      await setDoc(doc(db, 'content', 'feedbackWorkoutId'), {
        skills: ['feedback']
      }, { merge: true });
      addLog(`🏷️ Tagged Feedback Foundations Workout`);

      // Tag Exercises
      await setDoc(doc(db, 'content', 'ex_feedback_mindset'), {
        skills: ['feedback', 'emotional-intelligence']
      }, { merge: true });

      await setDoc(doc(db, 'content', 'ex_reinforcing_roleplay'), {
        skills: ['feedback', 'coaching']
      }, { merge: true });

      await setDoc(doc(db, 'content', 'ex_redirecting_roleplay'), {
        skills: ['feedback', 'conflict']
      }, { merge: true });
      addLog(`🏷️ Tagged Exercises`);

      setStatus('success');
      addLog('✨ Skills Seeding Complete!');

    } catch (error) {
      console.error(error);
      setStatus('error');
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const seedCoaching = async () => {
    setStatus('running');
    addLog('🤝 Seeding Coaching Sessions...');
    
    // Helper to get future date
    const futureDate = (daysFromNow) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    };
    
    const sessions = [
      // OPEN GYM Sessions (weekly, peer discussion)
      { 
        id: 'coach_open_gym_1', 
        sessionType: 'OPEN_GYM',
        title: 'Open Gym: Difficult Conversations', 
        description: 'Bring your real scenarios. Practice with peers. Get coached in real-time.',
        date: futureDate(3),
        time: '12:00 PM EST',
        coach: 'Coach Mike',
        spotsLeft: 8,
        skills: ['skill_feedback', 'skill_conflict', 'skill_communication']
      },
      { 
        id: 'coach_open_gym_2', 
        sessionType: 'OPEN_GYM',
        title: 'Open Gym: Managing Up', 
        description: 'Strategies for influencing without authority and managing stakeholder expectations.',
        date: futureDate(10),
        time: '12:00 PM EST',
        coach: 'Coach Sarah',
        spotsLeft: 12,
        skills: ['skill_influence', 'skill_communication']
      },
      { 
        id: 'coach_open_gym_3', 
        sessionType: 'OPEN_GYM',
        title: 'Open Gym: Team Dynamics', 
        description: 'Navigate team conflict, build trust, and create psychological safety.',
        date: futureDate(17),
        time: '12:00 PM EST',
        coach: 'Coach Mike',
        spotsLeft: 10,
        skills: ['skill_team_building', 'skill_conflict', 'skill_motivation']
      },
      
      // LEADER CIRCLE Sessions (monthly, cohort-based)
      { 
        id: 'coach_circle_1', 
        sessionType: 'LEADER_CIRCLE',
        title: 'Leader Circle: First-Time Managers', 
        description: 'Monthly cohort for new managers navigating the transition from IC to leader.',
        date: futureDate(7),
        time: '5:00 PM EST',
        coach: 'Coach Amy',
        spotsLeft: 6,
        skills: ['skill_delegation', 'skill_accountability', 'skill_coaching']
      },
      { 
        id: 'coach_circle_2', 
        sessionType: 'LEADER_CIRCLE',
        title: 'Leader Circle: Senior Leaders', 
        description: 'Executive-level peer group tackling strategy, culture, and organizational challenges.',
        date: futureDate(14),
        time: '5:00 PM EST',
        coach: 'Coach David',
        spotsLeft: 4,
        skills: ['skill_strategic_thinking', 'skill_change_mgmt', 'skill_executive_presence']
      },
      
      // WORKSHOP Sessions (special topics, deep dives)
      { 
        id: 'coach_workshop_1', 
        sessionType: 'WORKSHOP',
        title: 'Workshop: Feedback Frameworks', 
        description: 'Master SBI, COIN, and other proven frameworks for delivering feedback that lands.',
        date: futureDate(5),
        time: '10:00 AM EST',
        coach: 'Dr. Jennifer Hall',
        spotsLeft: 20,
        skills: ['skill_feedback', 'skill_communication']
      },
      { 
        id: 'coach_workshop_2', 
        sessionType: 'WORKSHOP',
        title: 'Workshop: Executive Presence', 
        description: 'Command the room. Communicate with gravitas. Lead with confidence.',
        date: futureDate(12),
        time: '2:00 PM EST',
        coach: 'Coach Victoria',
        spotsLeft: 15,
        skills: ['skill_executive_presence', 'skill_communication']
      },
      { 
        id: 'coach_workshop_3', 
        sessionType: 'WORKSHOP',
        title: 'Workshop: 2025 Strategic Planning', 
        description: 'Frameworks and templates for setting your team up for success next year.',
        date: futureDate(20),
        time: '1:00 PM EST',
        coach: 'Coach Alex',
        spotsLeft: 25,
        skills: ['skill_strategic_thinking', 'skill_prioritization']
      }
    ];

    try {
      for (const session of sessions) {
        await setDoc(doc(db, 'content', session.id), {
          id: session.id,
          type: 'COACHING_SESSION',
          sessionType: session.sessionType,
          title: session.title,
          description: session.description,
          status: 'PUBLISHED',
          date: session.date,
          time: session.time,
          coach: session.coach,
          spotsLeft: session.spotsLeft,
          skills: session.skills || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        addLog(`✅ Created ${session.sessionType}: ${session.title}`);
      }

      setStatus('success');
      addLog('✨ Coaching Seeding Complete!');

    } catch (error) {
      console.error(error);
      setStatus('error');
      addLog(`❌ Error: ${error.message}`);
    }
  };

  const seedFullHierarchy = async () => {
    setStatus('running');
    addLog('🏗️ Seeding Full 4-Level Hierarchy...');

    try {
      // 1. Create Program: Feedback Mastery
      const programId = 'prog_feedback_mastery';
      await setDoc(doc(db, 'content', programId), {
        id: programId,
        type: 'PROGRAM',
        title: 'Feedback Mastery',
        description: 'Master the art of giving and receiving feedback.',
        status: 'PUBLISHED',
        metadata: {
          durationWeeks: 3,
          difficulty: 'PRO',
          outcomeSummary: 'Learn to give feedback that lands and drives behavior change.'
        },
        skills: ['coaching', 'communication'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      addLog('✅ Created Program: Feedback Mastery');

      // 2. Create Workout: The Feedback Workout
      const workoutId = 'wkt_feedback_workout';
      await setDoc(doc(db, 'content', workoutId), {
        id: workoutId,
        type: 'WORKOUT',
        title: 'The Feedback Workout',
        description: 'A practical session to practice the CLEAR feedback model.',
        parentId: programId,
        parentType: 'PROGRAM',
        sequenceOrder: 1,
        status: 'PUBLISHED',
        metadata: {
          durationMin: 60,
          difficulty: 'PRO',
          sessionType: 'SELF_PACED'
        },
        skills: ['coaching'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      addLog('✅ Created Workout: The Feedback Workout');

      // 3. Create Exercises
      const exercises = [
        {
          id: 'ex_feedback_mindset',
          title: 'Feedback Mindset Primer',
          description: 'Prepare your mind for a constructive conversation.',
          sequenceOrder: 1,
          type: 'REFLECTION',
          durationMin: 10
        },
        {
          id: 'ex_reinforcing_roleplay',
          title: 'Reinforcing Feedback Roleplay',
          description: 'Practice giving positive feedback that sticks.',
          sequenceOrder: 2,
          type: 'ROLEPLAY',
          durationMin: 20
        },
        {
          id: 'ex_redirecting_roleplay',
          title: 'Redirecting Feedback Roleplay',
          description: 'Practice addressing performance gaps.',
          sequenceOrder: 3,
          type: 'ROLEPLAY',
          durationMin: 20
        }
      ];

      for (const ex of exercises) {
        await setDoc(doc(db, 'content', ex.id), {
          id: ex.id,
          type: 'EXERCISE',
          title: ex.title,
          description: ex.description,
          parentId: workoutId,
          parentType: 'WORKOUT',
          sequenceOrder: ex.sequenceOrder,
          status: 'PUBLISHED',
          metadata: {
            exerciseType: ex.type,
            durationMin: ex.durationMin
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        addLog(`✅ Created Exercise: ${ex.title}`);

        // 4. Create Reps for Roleplay Exercises
        if (ex.type === 'ROLEPLAY') {
          const reps = [
            { id: `rep_${ex.id}_mild`, title: 'Mild Intensity', intensity: 'MILD', prompt: 'Partner is receptive and open.' },
            { id: `rep_${ex.id}_mod`, title: 'Moderate Intensity', intensity: 'MODERATE', prompt: 'Partner is slightly defensive.' },
            { id: `rep_${ex.id}_int`, title: 'Intense Intensity', intensity: 'INTENSE', prompt: 'Partner denies the issue.' }
          ];

          for (const rep of reps) {
            await setDoc(doc(db, 'content', rep.id), {
              id: rep.id,
              type: 'REP',
              title: rep.title,
              parentId: ex.id,
              parentType: 'EXERCISE',
              status: 'PUBLISHED',
              metadata: {
                intensityLevel: rep.intensity,
                repPrompt: rep.prompt
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            addLog(`   🔹 Created Rep: ${rep.title}`);
          }
        }
      }

      setStatus('success');
      addLog('✨ Full Hierarchy Seeding Complete!');

    } catch (error) {
      console.error(error);
      setStatus('error');
      addLog(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Content Migration Tool</h1>
        <p className="mb-6 text-gray-600">
          This tool will migrate data from <code>reading-catalog-firestore.json</code> and 
          <code>resource_library_items.json</code> into the new <code>content</code> collection.
        </p>

        <div className="mb-6 p-4 bg-gray-100 rounded h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? <span className="text-gray-400">Ready to start...</span> : logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={runMigration}
            disabled={status === 'running'}
            className={`px-6 py-3 rounded font-bold text-white ${
              status === 'running' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {status === 'running' ? 'Migrating...' : 'Run Migration'}
          </button>

          <button
            onClick={seedSkills}
            disabled={status === 'running'}
            className={`px-6 py-3 rounded font-bold text-white ${
              status === 'running' ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            Seed Skills
          </button>

          <button
            onClick={seedCoaching}
            disabled={status === 'running'}
            className={`px-6 py-3 rounded font-bold text-white ${
              status === 'running' ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            Seed Coaching
          </button>

          <button
            onClick={seedFullHierarchy}
            disabled={status === 'running'}
            className={`px-6 py-3 rounded font-bold text-white ${
              status === 'running' ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            Seed Hierarchy
          </button>
        </div>
      </div>
    </div>
  );
};

export default MigrationTool;
