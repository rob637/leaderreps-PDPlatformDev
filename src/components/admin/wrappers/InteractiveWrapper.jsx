import React from 'react';
import SingleTypeContentManager from '../SingleTypeContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';
import { ClipboardEdit } from 'lucide-react';

const InteractiveWrapper = () => {
  return (
    <SingleTypeContentManager 
      type={CONTENT_TYPES.INTERACTIVE}
      title="Interactive Content"
      description="Manage interactive forms like Leader Profile and Baseline Assessment."
      icon={ClipboardEdit}
    />
  );
};

export default InteractiveWrapper;
