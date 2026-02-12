import React from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Card, Heading, Text, Input, Button, PageLayout } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const Feedback360 = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="360° Feedback Tool"
      icon={MessageSquare}
      subtitle="Gather anonymous insights from your team."
      navigate={navigate}
      backTo="dashboard"
      backLabel="Back to Dashboard"
      accentColor="teal"
    >
      <Card>
        <div className="p-6 sm:p-8">
          <Heading level="h2" variant="section" className="mb-4">Request Feedback</Heading>
          <Text className="mb-6">
            Send a standardized survey to your direct reports, peers, and manager. We'll aggregate the results into a confidential report.
          </Text>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Input 
              type="email" 
              placeholder="Enter colleague's email" 
              className="flex-1"
            />
            <Button variant="primary" className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> Send Request
            </Button>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <Heading level="h3" variant="card" className="mb-4 text-slate-700 dark:text-slate-200">Active Requests</Heading>
            <Text variant="small" className="italic text-slate-500 dark:text-slate-400">No active feedback requests.</Text>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
};

export default Feedback360;
