import React from 'react';
import SingleTypeContentManager from '../SingleTypeContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';
import { Film } from 'lucide-react';

const VideoWrapper = () => {
  return (
    <SingleTypeContentManager 
      type={CONTENT_TYPES.VIDEO}
      title="Video Wrapper"
      description="Wrap YouTube, Vimeo, or uploaded videos with metadata."
      icon={Film}
    />
  );
};

export default VideoWrapper;
