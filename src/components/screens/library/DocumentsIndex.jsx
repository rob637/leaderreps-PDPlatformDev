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
      color="text-slate-600"
      bgColor="bg-slate-100"
    />
  );
};

export default DocumentsIndex;
