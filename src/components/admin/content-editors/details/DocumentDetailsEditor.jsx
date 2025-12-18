import React from 'react';
import { FileText, ExternalLink, FileType } from 'lucide-react';

const DocumentDetailsEditor = ({ details = {}, onChange }) => {
  const handleChange = (key, value) => {
    onChange(key, value);
  };

  return (
    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-800 flex items-center gap-2">
        <FileText size={18} />
        Document Details
      </h3>
      
      {/* Document URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <ExternalLink size={14} />
          Document URL (PDF, Doc, etc.)
        </label>
        <input
          type="url"
          value={details.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          placeholder="https://example.com/document.pdf"
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* File Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <FileType size={14} />
          File Type
        </label>
        <select
          value={details.fileType || 'PDF'}
          onChange={(e) => handleChange('fileType', e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="PDF">PDF</option>
          <option value="DOCX">Word (DOCX)</option>
          <option value="PPTX">PowerPoint (PPTX)</option>
          <option value="XLSX">Excel (XLSX)</option>
          <option value="LINK">External Link</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
    </div>
  );
};

export default DocumentDetailsEditor;
