import React from 'react';
import { Users } from 'lucide-react';
import { Card, PageHeader, Heading, Text, Button } from '../../ui';

const MastermindGroups = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Peer Mastermind Groups" 
      description="Connect with your accountability squad." 
    />
    <Card className="bg-indigo-50 border-indigo-100">
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <Heading level="h2" variant="section" className="mb-2">Find Your Squad</Heading>
        <Text className="max-w-lg mx-auto mb-6">
          We match you with 4-5 other leaders at your level for monthly accountability calls and private chat.
        </Text>
        <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
          Join Waitlist
        </Button>
      </div>
    </Card>
  </div>
);
export default MastermindGroups;
