import React from 'react';
import { Card, PageHeader, Text, Badge, Button } from '../../ui';

const MentorMatch = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Mentor Match" 
      description="Connect with senior executives for guidance." 
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="text-center">
          <div className="p-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4"></div>
            <h3 className="font-bold text-lg text-corporate-navy">Executive Mentor {i}</h3>
            <Text variant="small" className="mb-4">CTO at Tech Corp • 15 Yrs Exp</Text>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Badge variant="default">Strategy</Badge>
              <Badge variant="default">Scaling</Badge>
            </div>
            <Button variant="outline" className="w-full">
              Request Session
            </Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
export default MentorMatch;
