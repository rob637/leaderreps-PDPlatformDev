import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, Dumbbell, Clock, BarChart, Play, CheckCircle, ChevronDown, ChevronUp, Zap, Lock } from 'lucide-react';
import { Button } from '../../screens/developmentplan/DevPlanComponents.jsx';

const WorkoutDetail = ({ navParams }) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const workoutId = navParams?.id;

  useEffect(() => {
    const fetchWorkoutData = async () => {
      if (!workoutId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Workout Details
        const workoutRef = doc(db, UNIFIED_COLLECTION, workoutId);
        const workoutSnap = await getDoc(workoutRef);
        
        if (workoutSnap.exists()) {
          setWorkout({ id: workoutSnap.id, ...workoutSnap.data() });
          
          // 2. Fetch Child Exercises
          const exercisesRef = collection(db, UNIFIED_COLLECTION);
          const q = query(
            exercisesRef, 
            where('type', '==', 'EXERCISE'),
            where('parentId', '==', workoutId),
            orderBy('sequenceOrder', 'asc')
          );
          
          const exercisesSnap = await getDocs(q);
          const exercisesData = await Promise.all(exercisesSnap.docs.map(async (docSnap) => {
            const exercise = { id: docSnap.id, ...docSnap.data() };
            
            // 3. Fetch Child Reps for each Exercise (Nested fetch)
            const repsQ = query(
              collection(db, UNIFIED_COLLECTION),
              where('type', '==', 'REP'),
              where('parentId', '==', exercise.id)
            );
            const repsSnap = await getDocs(repsQ);
            exercise.reps = repsSnap.docs.map(r => ({ id: r.id, ...r.data() }));
            
            return exercise;
          }));
          
          setExercises(exercisesData);
        }
      } catch (error) {
        console.error("Error fetching workout details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutData();
  }, [db, workoutId]);

  const toggleExercise = (id) => {
    setExpandedExercise(expandedExercise === id ? null : id);
  };

  if (loading) {
    return (
      <PageLayout title="Loading Workout..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!workout) {
    return (
      <PageLayout title="Workout Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600">The requested workout could not be found.</p>
          <Button onClick={() => navigate('workouts-index')} className="mt-4">
            Back to Workouts
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (!isContentUnlocked(workout)) {
    return (
      <PageLayout title="Content Locked" showBack={true}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">This Workout is Locked</h2>
          <p className="text-slate-500 max-w-md mb-8">
            You haven't unlocked this content yet. Continue your Development Plan to gain access.
          </p>
          <Button onClick={() => navigate('workouts-index')}>
            Back to Workouts
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={workout.title} 
      subtitle={workout.description}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Workouts', path: 'workouts-index' },
        { label: workout.title, path: null }
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-5 h-5 text-corporate-teal" />
              <span className="font-medium">{workout.metadata?.durationMin || 45} min</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <BarChart className="w-5 h-5 text-corporate-orange" />
              <span className="font-medium">{workout.metadata?.difficulty || 'General'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Dumbbell className="w-5 h-5 text-indigo-500" />
              <span className="font-medium">{exercises.length} Exercises</span>
            </div>
          </div>
          <Button className="bg-corporate-teal hover:bg-teal-700 text-white">
            Start Workout
          </Button>
        </div>

        {/* Exercises List */}
        <div>
          <h3 className="text-lg font-bold text-corporate-navy mb-4">Workout Plan</h3>
          <div className="space-y-4">
            {exercises.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500">
                No exercises defined for this workout yet.
              </div>
            ) : (
              exercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div 
                    onClick={() => toggleExercise(exercise.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{exercise.title}</h4>
                        <p className="text-xs text-slate-500">{exercise.metadata?.durationMin} min • {exercise.metadata?.exerciseType || 'Drill'}</p>
                      </div>
                    </div>
                    {expandedExercise === exercise.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                  
                  {expandedExercise === exercise.id && (
                    <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                      <p className="text-sm text-slate-600 mb-4 mt-4">{exercise.description}</p>
                      
                      {/* Reps List */}
                      {exercise.reps && exercise.reps.length > 0 && (
                        <div className="space-y-2 pl-12">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reps Variations</h5>
                          {exercise.reps.map(rep => (
                            <div key={rep.id} className="bg-white p-3 rounded border border-slate-200 flex items-start gap-3">
                              <Zap className={`w-4 h-4 mt-0.5 ${
                                rep.metadata?.intensityLevel === 'INTENSE' ? 'text-red-500' : 
                                rep.metadata?.intensityLevel === 'MODERATE' ? 'text-orange-500' : 'text-green-500'
                              }`} />
                              <div>
                                <span className="text-sm font-bold text-slate-700 block">{rep.title}</span>
                                <span className="text-xs text-slate-500">{rep.metadata?.repPrompt}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default WorkoutDetail;