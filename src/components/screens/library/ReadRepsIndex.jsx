import React from 'react';
import { BookOpen } from 'lucide-react';
import ContentListView from './ContentListView.jsx';

const ReadRepsIndex = () => {
  return (
    <ContentListView
      type="READ_REP"
      title="Read & Reps"
      subtitle="Curated books and articles with actionable exercises."
      icon={BookOpen}
      detailRoute="read-rep-detail"
      color="text-corporate-navy"
      bgColor="bg-corporate-navy/10"
    />
  );
};

export default ReadRepsIndex;
