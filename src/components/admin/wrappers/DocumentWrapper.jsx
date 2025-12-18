import React from 'react';
import SingleTypeContentManager from '../SingleTypeContentManager';
import { CONTENT_TYPES } from '../../../services/unifiedContentService';
import { FileText } from 'lucide-react';

const DocumentWrapper = () => {
  return (
    <SingleTypeContentManager 
      type={CONTENT_TYPES.DOCUMENT}
      title="Document Wrapper"
      description="Wrap PDFs, Word docs, and articles with metadata."
      icon={FileText}
    />
  );
};

export default DocumentWrapper;
