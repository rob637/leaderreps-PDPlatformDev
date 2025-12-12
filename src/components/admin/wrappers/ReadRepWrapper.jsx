import React from 'react';
import UnifiedContentManager from '../UnifiedContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';

const ReadRepWrapper = () => {
  return (
    <UnifiedContentManager 
      initialTab={CONTENT_TYPES.READ_REP}
      title="Read & Rep Wrapper"
      description="Wrap reading materials with actionable reps."
    />
  );
};

export default ReadRepWrapper;
