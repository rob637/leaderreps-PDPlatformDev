import React from 'react';
import { Mic } from 'lucide-react';
import { Card, PageHeader, Text, Badge, Button } from '../../ui';

const AIRoleplay = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="AI Roleplay Scenarios" 
      description="Practice difficult conversations in a safe space." 
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['Firing an Employee', 'Salary Negotiation', 'Conflict Resolution', 'Delivering Bad News'].map((scenario, i) => (
        <Card key={i} variant="interactive" className="hover:border-purple-300 transition-colors cursor-pointer">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Mic className="w-6 h-6" />
              </div>
              <Badge variant="default" className="text-slate-400">Intermediate</Badge>
            </div>
            <h3 className="font-bold text-lg text-corporate-navy mb-2">{scenario}</h3>
            <Text variant="small" className="mb-4">
              Simulate a real-time conversation with an AI persona. Receive instant feedback on your tone and empathy.
            </Text>
            <Button variant="primary" className="w-full bg-purple-600 hover:bg-purple-700">
              Start Scenario
            </Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
export default AIRoleplay;
