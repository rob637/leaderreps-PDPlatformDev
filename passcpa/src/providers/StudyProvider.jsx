import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthProvider';
import { format } from 'date-fns';
import { POINT_VALUES } from '../config/examConfig';

const StudyContext = createContext(null);

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};

export const StudyProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  
  // Core study state
  const [studyPlan, setStudyPlan] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch study plan when user changes
  useEffect(() => {
    if (!user || !userProfile?.studyPlanId) {
      setStudyPlan(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'study_plan', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          setStudyPlan({ id: snapshot.id, ...snapshot.data() });
        } else {
          setStudyPlan(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching study plan:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userProfile?.studyPlanId]);

  // Fetch/create today's daily log
  useEffect(() => {
    if (!user) {
      setTodayLog(null);
      return;
    }

    const dailyLogRef = doc(db, 'users', user.uid, 'daily_log', today);
    
    const unsubscribe = onSnapshot(dailyLogRef, async (snapshot) => {
      if (snapshot.exists()) {
        setTodayLog({ id: snapshot.id, ...snapshot.data() });
      } else {
        // Create today's log if it doesn't exist
        const newLog = {
          date: today,
          goalPoints: userProfile?.dailyGoal || 50,
          earnedPoints: 0,
          activities: [],
          questionsAttempted: 0,
          questionsCorrect: 0,
          lessonsCompleted: 0,
          simulationsCompleted: 0,
          studyTimeMinutes: 0,
          createdAt: serverTimestamp(),
        };
        
        await setDoc(dailyLogRef, newLog);
        setTodayLog({ id: today, ...newLog });
      }
    });

    return () => unsubscribe();
  }, [user, today, userProfile?.dailyGoal]);

  // Calculate streak
  useEffect(() => {
    if (!user) {
      setCurrentStreak(0);
      return;
    }

    const calculateStreak = async () => {
      try {
        const logsRef = collection(db, 'users', user.uid, 'daily_log');
        const logsQuery = query(logsRef);
        const snapshot = await getDocs(logsQuery);
        
        const logs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(log => log.earnedPoints >= (log.goalPoints * 0.5)) // At least 50% of goal
          .sort((a, b) => b.date.localeCompare(a.date));
        
        let streak = 0;
        const checkDate = new Date();
        
        for (const log of logs) {
          const logDate = log.date;
          const expectedDate = format(checkDate, 'yyyy-MM-dd');
          
          if (logDate === expectedDate) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        
        setCurrentStreak(streak);
      } catch (error) {
        console.error('Error calculating streak:', error);
        setCurrentStreak(0);
      }
    };

    calculateStreak();
  }, [user, todayLog?.earnedPoints]);

  // Log study activity
  const logActivity = useCallback(async (activity) => {
    if (!user) return;

    const dailyLogRef = doc(db, 'users', user.uid, 'daily_log', today);
    
    const { type, points, details } = activity;
    
    const activityEntry = {
      type,
      points,
      timestamp: new Date().toISOString(),
      ...details,
    };

    // Update daily log
    await updateDoc(dailyLogRef, {
      earnedPoints: increment(points),
      activities: [...(todayLog?.activities || []), activityEntry],
      ...(type === 'mcq' && {
        questionsAttempted: increment(details.attempted || 1),
        questionsCorrect: increment(details.correct || 0),
      }),
      ...(type === 'lesson' && {
        lessonsCompleted: increment(1),
      }),
      ...(type === 'simulation' && {
        simulationsCompleted: increment(1),
      }),
    });
  }, [user, today, todayLog]);

  // Record MCQ answer
  const recordMCQAnswer = useCallback(async (questionId, topicId, isCorrect) => {
    if (!user) return;

    const points = POINT_VALUES.mcq_medium; // Could vary by difficulty

    await logActivity({
      type: 'mcq',
      points,
      details: {
        questionId,
        topicId,
        isCorrect,
        attempted: 1,
        correct: isCorrect ? 1 : 0,
      }
    });

    // Also update topic-level progress
    const progressRef = doc(db, 'users', user.uid, 'progress', 'topics');
    await setDoc(progressRef, {
      [topicId]: {
        attempted: increment(1),
        correct: increment(isCorrect ? 1 : 0),
        lastAttempted: serverTimestamp(),
      }
    }, { merge: true });

  }, [user, logActivity]);

  // Complete a lesson
  const completeLesson = useCallback(async (lessonId, moduleId, timeSpentMinutes) => {
    if (!user) return;

    // Determine point value based on time
    let points = POINT_VALUES.lesson_short;
    if (timeSpentMinutes > 60) {
      points = POINT_VALUES.lesson_long;
    } else if (timeSpentMinutes > 30) {
      points = POINT_VALUES.lesson_medium;
    }

    await logActivity({
      type: 'lesson',
      points,
      details: {
        lessonId,
        moduleId,
        timeSpentMinutes,
      }
    });

    // Update lesson progress
    const lessonProgressRef = doc(db, 'users', user.uid, 'progress', 'lessons');
    await setDoc(lessonProgressRef, {
      [lessonId]: {
        status: 'completed',
        completedAt: serverTimestamp(),
        timeSpentMinutes,
      }
    }, { merge: true });

  }, [user, logActivity]);

  // Complete a simulation
  const completeSimulation = useCallback(async (simId, score, timeSpentMinutes) => {
    if (!user) return;

    const points = POINT_VALUES.simulation;

    await logActivity({
      type: 'simulation',
      points,
      details: {
        simId,
        score,
        timeSpentMinutes,
      }
    });

    // Update simulation progress
    const simProgressRef = doc(db, 'users', user.uid, 'progress', 'simulations');
    await setDoc(simProgressRef, {
      [simId]: {
        attempts: increment(1),
        bestScore: score, // TODO: only update if better
        lastAttempted: serverTimestamp(),
      }
    }, { merge: true });

  }, [user, logActivity]);

  // Get topic performance
  const getTopicPerformance = useCallback(async () => {
    if (!user) return {};

    try {
      const progressRef = doc(db, 'users', user.uid, 'progress', 'topics');
      const snapshot = await getDoc(progressRef);
      
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return {};
    } catch (error) {
      console.error('Error fetching topic performance:', error);
      return {};
    }
  }, [user]);

  // Calculate daily progress percentage
  const dailyProgress = todayLog 
    ? Math.min(100, Math.round((todayLog.earnedPoints / todayLog.goalPoints) * 100))
    : 0;

  // Check if daily goal is met
  const dailyGoalMet = todayLog 
    ? todayLog.earnedPoints >= todayLog.goalPoints
    : false;

  const value = {
    // State
    studyPlan,
    todayLog,
    currentStreak,
    loading,
    dailyProgress,
    dailyGoalMet,
    
    // Actions
    logActivity,
    recordMCQAnswer,
    completeLesson,
    completeSimulation,
    getTopicPerformance,
  };

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
};

export default StudyProvider;
