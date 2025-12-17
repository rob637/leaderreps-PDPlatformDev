import React from 'react';
import UnifiedContentManager from '../UnifiedContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';

const VideoWrapper = () => {
  return (
    <UnifiedContentManager 
      initialTab={CONTENT_TYPES.VIDEO}
      title="Video Wrapper"
      description="Wrap YouTube, Vimeo, or uploaded videos with metadata."
    />
  );
};

export default VideoWrapper;
