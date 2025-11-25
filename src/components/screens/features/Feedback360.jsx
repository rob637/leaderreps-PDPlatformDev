import React from 'react';
import { Send } from 'lucide-react';
import { Card, PageHeader, Heading, Text, Input, Button } from '../../ui';

const Feedback360 = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="360° Feedback Tool" 
      description="Gather anonymous insights from your team." 
    />
    <Card>
      <div className="p-8">
        <Heading level="h2" variant="section" className="mb-4">Request Feedback</Heading>
        <Text className="mb-6">
          Send a standardized survey to your direct reports, peers, and manager. We'll aggregate the results into a confidential report.
        </Text>
        <div className="flex gap-4 mb-8">
          <Input 
            type="email" 
            placeholder="Enter colleague's email" 
            className="flex-1"
          />
          <Button variant="primary" className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Send Request
          </Button>
        </div>
        <div className="border-t border-slate-100 pt-6">
          <Heading level="h3" variant="card" className="mb-4 text-slate-700">Active Requests</Heading>
          <Text variant="small" className="italic">No active feedback requests.</Text>
        </div>
      </div>
    </Card>
  </div>
);
export default Feedback360;
