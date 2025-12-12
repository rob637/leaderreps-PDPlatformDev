import React from 'react';
import ContentManager from '../ContentManager';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';

const CourseWrapper = () => {
  return (
    <ContentManager 
      contentType={CONTENT_COLLECTIONS.COURSES} 
      title="Course Wrapper"
      description="Wrap structured courses and learning paths."
    />
  );
};

export default CourseWrapper;
