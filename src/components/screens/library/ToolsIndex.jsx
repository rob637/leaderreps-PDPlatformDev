import React from 'react';
import { Wrench } from 'lucide-react';
import ContentListView from './ContentListView.jsx';

const ToolsIndex = () => {
  return (
    <ContentListView
      type="TOOL"
      title="Tools"
      subtitle="Checklists, templates, and job aids for quick application."
      icon={Wrench}
      detailRoute="tool-detail"
      color="text-corporate-teal"
      bgColor="bg-corporate-teal/10"
    />
  );
};

export default ToolsIndex;
