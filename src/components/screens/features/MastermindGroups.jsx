import React from 'react';
import { Users } from 'lucide-react';
import { Card, Heading, Text, Button, PageLayout } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const MastermindGroups = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Peer Mastermind Groups"
      icon={Users}
      subtitle="Connect with your accountability squad."
      navigate={navigate}
      backTo="community"
      backLabel="Back to Community"
      accentColor="teal"
    >
      <Card className="bg-corporate-teal/5 border-corporate-teal/20">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-corporate-teal/10 text-corporate-teal rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <Heading level="h2" variant="section" className="mb-2">Find Your Squad</Heading>
          <Text className="max-w-lg mx-auto mb-6">
            We match you with 4-5 other leaders at your level for monthly accountability calls and private chat.
          </Text>
          <Button variant="primary">
            Join Waitlist
          </Button>
        </div>
      </Card>
    </PageLayout>
  );
};

export default MastermindGroups;
