import React from 'react';
import { FileText } from 'lucide-react';
import ContentListView from './ContentListView.jsx';

const DocumentsIndex = () => {
  return (
    <ContentListView
      type="DOCUMENT"
      title="Documents"
      subtitle="Reference materials, guides, and whitepapers."
      icon={FileText}
      detailRoute="document-detail"
      indexRoute="documents-index"
      color="text-slate-600 dark:text-slate-300"
      bgColor="bg-slate-100 dark:bg-slate-700"
    />
  );
};

export default DocumentsIndex;
