import React from 'react';
import { Users } from 'lucide-react';
import { Card, Text, Badge, Button, PageLayout, PageGrid } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const MentorMatch = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Mentor Match"
      icon={Users}
      subtitle="Connect with senior executives for guidance."
      navigate={navigate}
      backTo="dashboard"
      backLabel="Back to Dashboard"
      accentColor="teal"
    >
      <PageGrid cols={3}>
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
      </PageGrid>
    </PageLayout>
  );
};

export default MentorMatch;
