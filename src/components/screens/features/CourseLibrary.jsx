import React from 'react';
import { PlayCircle, Clock } from 'lucide-react';
import { Card, PageHeader, Text, Badge, Button } from '../../ui';

const CourseLibrary = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Course Library" 
      description="Deep-dive video modules for applied leadership." 
    />
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <div className="p-6 flex gap-6 items-center">
            <div className="w-48 h-32 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-12 h-12 text-white opacity-80" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" className="bg-blue-100 text-blue-700">Module {i}</Badge>
                <Text variant="small" className="flex items-center gap-1"><Clock className="w-3 h-3" /> 45 mins</Text>
              </div>
              <h3 className="font-bold text-xl text-corporate-navy mb-2">Advanced Team Dynamics</h3>
              <Text variant="muted">Master the art of building high-performing teams through psychological safety and clear accountability.</Text>
            </div>
            <Button variant="primary">
              Start Module
            </Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
export default CourseLibrary;
