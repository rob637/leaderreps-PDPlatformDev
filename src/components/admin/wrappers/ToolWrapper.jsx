import React from 'react';
import SingleTypeContentManager from '../SingleTypeContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';
import { Wrench } from 'lucide-react';

const ToolWrapper = () => {
  return (
    <SingleTypeContentManager 
      type={CONTENT_TYPES.TOOL}
      title="Tool Wrapper"
      description="Wrap checklists, templates, and job aids with metadata."
      icon={Wrench}
    />
  );
};

export default ToolWrapper;
