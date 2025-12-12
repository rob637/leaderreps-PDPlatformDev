import React from 'react';
import ContentManager from '../ContentManager';
import { CONTENT_COLLECTIONS } from '../../../services/contentService';

const DocumentWrapper = () => {
  return (
    <ContentManager 
      contentType={CONTENT_COLLECTIONS.READINGS} 
      title="Document Wrapper"
      description="Wrap PDFs, Word docs, and articles with metadata."
    />
  );
};

export default DocumentWrapper;
