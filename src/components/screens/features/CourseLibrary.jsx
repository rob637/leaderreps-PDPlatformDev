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
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-center">
              <div className="w-full lg:w-48 h-32 bg-corporate-navy rounded-lg flex items-center justify-center flex-shrink-0">
                <PlayCircle className="w-12 h-12 text-white opacity-80" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary">Module {i}</Badge>
                  <Text variant="small" className="flex items-center gap-1"><Clock className="w-3 h-3" /> 45 mins</Text>
                </div>
                <h3 className="font-bold text-xl text-corporate-navy mb-2">Advanced Team Dynamics</h3>
                <Text variant="muted">Master the art of building high-performing teams through psychological safety and clear accountability.</Text>
              </div>
              <Button variant="primary" className="w-full lg:w-auto">
                Start Module
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
};

export default CourseLibrary;
