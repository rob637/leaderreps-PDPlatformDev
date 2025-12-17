import React from 'react';
import SingleTypeContentManager from '../SingleTypeContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';
import { BookOpen } from 'lucide-react';

const ReadRepWrapper = () => {
  return (
    <SingleTypeContentManager 
      type={CONTENT_TYPES.READ_REP}
      title="Read & Rep Wrapper"
      description="Wrap reading materials with actionable reps."
      icon={BookOpen}
    />
  );
};

export default ReadRepWrapper;
