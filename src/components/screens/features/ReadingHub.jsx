import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Card, PageHeader, Text, Button } from '../../ui';

const ReadingHub = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Professional Reading Hub" 
      description="Curated summaries and insights for leaders." 
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} variant="interactive" className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-slate-400">
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
    </div>
  </div>
);
export default ReadingHub;
