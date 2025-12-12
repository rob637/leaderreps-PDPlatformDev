import React from 'react';
import ContentManager from '../ContentManager';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';

const VideoWrapper = () => {
  return (
    <ContentManager 
      contentType={CONTENT_COLLECTIONS.VIDEOS} 
      title="Video Wrapper"
      description="Wrap YouTube, Vimeo, or MP4 links with metadata."
    />
  );
};

export default VideoWrapper;
