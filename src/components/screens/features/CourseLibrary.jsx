import React from 'react';
import { PlayCircle, Clock, GraduationCap } from 'lucide-react';
import { Card, Text, Badge, Button, PageLayout } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const CourseLibrary = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Course Library"
      icon={GraduationCap}
      subtitle="Deep-dive video modules for applied leadership."
      navigate={navigate}
      backTo="library"
      backLabel="Back to Library"
      accentColor="navy"
    >
      <div className="space-y-4">
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No courses available yet.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default CourseLibrary;
