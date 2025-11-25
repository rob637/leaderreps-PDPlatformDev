import React from 'react';
import { Video } from 'lucide-react';
import { Card, PageHeader, Heading, Text, Button } from '../../ui';

const LiveEvents = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Live Events" 
      description="Town halls, workshops, and expert Q&A." 
    />
    <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center mb-8">
      <div className="text-center">
        <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <Text className="text-slate-400">No live event currently broadcasting.</Text>
      </div>
    </div>
    <Heading level="h2" variant="section" className="mb-4">Upcoming Events</Heading>
    <div className="space-y-4">
      <Card>
        <div className="p-4 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg text-center min-w-[60px]">
            <span className="block text-xs font-bold uppercase">Nov</span>
            <span className="block text-xl font-bold">25</span>
          </div>
          <div>
            <h3 className="font-bold text-corporate-navy">Leadership in Crisis</h3>
            <Text variant="small">2:00 PM EST • with Ryan Young</Text>
          </div>
          <Button variant="secondary" size="sm" className="ml-auto">
            Register
          </Button>
        </div>
      </Card>
    </div>
  </div>
);
export default LiveEvents;
