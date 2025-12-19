import React from 'react';
import { Layers } from 'lucide-react';
import ContentListView from './ContentListView.jsx';

const ProgramsIndex = () => {
  return (
    <ContentListView
      type="PROGRAM"
      title="Programs"
      subtitle="Structured learning paths to master specific leadership capabilities."
      icon={Layers}
      detailRoute="program-detail"
      color="text-corporate-navy"
      bgColor="bg-corporate-navy/10"
    />
  );
};

export default ProgramsIndex;
