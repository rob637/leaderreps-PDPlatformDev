import React from 'react';
import ContentManager from '../ContentManager';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';

const BookWrapper = () => {
  return (
    <ContentManager 
      contentType={CONTENT_COLLECTIONS.READINGS} 
      title="Book Wrapper"
      description="Wrap book syntheses with metadata."
    />
  );
};

export default BookWrapper;
