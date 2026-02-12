import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Card, Text, Button, PageLayout, PageGrid } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const ReadingHub = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Reading Hub"
      icon={BookOpen}
      subtitle="Curated summaries and insights for leaders."
      navigate={navigate}
      backTo="library"
      backLabel="Back to Library"
      accentColor="teal"
    >
      <PageGrid cols={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} variant="interactive" className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="h-40 bg-slate-100 dark:bg-slate-700 rounded-lg mb-4 flex items-center justify-center text-slate-400">
                <BookOpen className="w-12 h-12" />
              </div>
              <h3 className="font-bold text-lg text-corporate-navy mb-2">Leadership Book Title {i}</h3>
              <Text variant="small" className="mb-4">A brief summary of the key takeaways from this influential leadership text.</Text>
              <Button variant="link" size="sm" className="text-corporate-teal font-semibold text-sm flex items-center gap-1 p-0">
                Read Summary <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </PageGrid>
    </PageLayout>
  );
};

export default ReadingHub;
