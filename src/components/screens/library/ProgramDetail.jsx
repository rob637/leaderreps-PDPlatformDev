import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, PlayCircle, CheckCircle, Clock, BarChart, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from '../../screens/developmentplan/DevPlanComponents.jsx';

const ProgramDetail = ({ navParams }) => {
  const { db, navigate } = useAppServices();
  const [program, setProgram] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const programId = navParams?.id;

  useEffect(() => {
    const fetchProgramData = async () => {
      if (!programId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Program Details
        const programRef = doc(db, 'content', programId);
        const programSnap = await getDoc(programRef);
        
        if (programSnap.exists()) {
          setProgram({ id: programSnap.id, ...programSnap.data() });
          
          // 2. Fetch Child Workouts
          // Query: type=WORKOUT, parentId=programId, orderBy sequenceOrder
          const workoutsRef = collection(db, 'content');
          const q = query(
            workoutsRef, 
            where('type', '==', 'WORKOUT'),
            where('parentId', '==', programId),
            orderBy('sequenceOrder', 'asc')
          );
          
          const workoutsSnap = await getDocs(q);
          const workoutsData = workoutsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setWorkouts(workoutsData);
        }
      } catch (error) {
        console.error("Error fetching program details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [db, programId]);

  if (loading) {
    return (
      <PageLayout title="Loading Program..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!program) {
    return (
      <PageLayout title="Program Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600">The requested program could not be found.</p>
          <Button onClick={() => navigate('programs-index')} className="mt-4">
            Back to Programs
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={program.title} 
      subtitle={program.description}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Programs', path: 'programs-index' },
        { label: program.title, path: null }
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Program Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-corporate-navy mb-4">Program Overview</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {program.metadata?.outcomeSummary || program.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Badge variant="blue" icon={Clock}>
                  {program.metadata?.durationWeeks || 4} Weeks
                </Badge>
                <Badge variant="purple" icon={BarChart}>
                  {program.metadata?.difficulty || 'Foundation'} Level
                </Badge>
                <Badge variant="teal" icon={CheckCircle}>
                  {workouts.length} Workouts
                </Badge>
              </div>
            </div>
            
            {/* Progress / CTA Section (Placeholder for now) */}
            <div className="w-full md:w-72 bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4 text-corporate-teal">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Start This Program</h3>
              <p className="text-xs text-slate-500 mb-4">Add to your development plan to begin tracking progress.</p>
              <Button variant="primary" className="w-full">
                Add to Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Workouts List */}
        <div>
          <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
            <span className="bg-corporate-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {workouts.length}
            </span>
            Program Modules
          </h3>
          
          <div className="space-y-4">
            {workouts.map((workout, index) => (
              <div 
                key={workout.id}
                onClick={() => navigate('workout-detail', { id: workout.id, title: workout.title })}
                className="group bg-white border border-slate-200 rounded-lg p-5 hover:border-corporate-teal hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center group-hover:bg-corporate-teal group-hover:text-white transition-colors">
                  {index + 1}
                </div>
                
                <div className="flex-grow">
                  <h4 className="font-bold text-slate-800 group-hover:text-corporate-teal transition-colors">
                    {workout.title}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-1">
                    {workout.description}
                  </p>
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    {workout.metadata?.durationMin || 45} min
                  </span>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal" />
                </div>
              </div>
            ))}
            
            {workouts.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                No workouts have been added to this program yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default ProgramDetail;
