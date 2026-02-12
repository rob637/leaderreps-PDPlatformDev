import React from 'react';
import { Video } from 'lucide-react';
import { Card, Heading, Text, Button, PageLayout, PageSection } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const LiveEvents = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Live Events"
      icon={Video}
      subtitle="Town halls, workshops, and expert Q&A."
      navigate={navigate}
      backTo="dashboard"
      backLabel="Back to Dashboard"
      accentColor="orange"
    >
      {/* Video Player Area */}
      <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center mb-8">
        <div className="text-center">
          <Video className="w-16 h-16 text-slate-600 dark:text-slate-300 mx-auto mb-4" />
          <Text className="text-slate-400">No live event currently broadcasting.</Text>
        </div>
      </div>
      
      {/* Upcoming Events */}
      <PageSection title="Upcoming Events" icon={Video}>
        <div className="space-y-4">
          <Card>
            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-corporate-orange/10 text-corporate-orange rounded-lg text-center min-w-[60px]">
                <span className="block text-xs font-bold uppercase">Nov</span>
                <span className="block text-xl font-bold">25</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-corporate-navy">Leadership in Crisis</h3>
                <Text variant="small">2:00 PM EST • with Ryan Young</Text>
              </div>
              <Button variant="secondary" size="sm">
                Register
              </Button>
            </div>
          </Card>
        </div>
      </PageSection>
    </PageLayout>
  );
};

export default LiveEvents;
