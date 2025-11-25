import React from 'react';
import { Mic } from 'lucide-react';
import { Card, Text, Badge, Button, PageLayout, PageGrid } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const AIRoleplay = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="AI Roleplay Scenarios"
      icon={Mic}
      subtitle="Practice difficult conversations in a safe space."
      navigate={navigate}
      backTo="dashboard"
      backLabel="Back to Dashboard"
      accentColor="teal"
    >
      <PageGrid cols={2}>
        {['Firing an Employee', 'Salary Negotiation', 'Conflict Resolution', 'Delivering Bad News'].map((scenario, i) => (
          <Card key={i} variant="interactive" className="hover:border-corporate-teal/50 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-corporate-teal/10 text-corporate-teal rounded-lg">
                  <Mic className="w-6 h-6" />
                </div>
                <Badge variant="default">Intermediate</Badge>
              </div>
              <h3 className="font-bold text-lg text-corporate-navy mb-2">{scenario}</h3>
              <Text variant="small" className="mb-4">
                Simulate a real-time conversation with an AI persona. Receive instant feedback on your tone and empathy.
              </Text>
              <Button variant="primary" className="w-full">
                Start Scenario
              </Button>
            </div>
          </Card>
        ))}
      </PageGrid>
    </PageLayout>
  );
};

export default AIRoleplay;
