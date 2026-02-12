import React, { useState } from 'react';
import { FileText, ExternalLink, FileType, Link as LinkIcon, Database } from 'lucide-react';
import MediaSelector from '../../MediaSelector';

const DocumentDetailsEditor = ({ details = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(
    details.url?.includes('firebasestorage') ? 'VAULT' : 'LINK'
  );
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleVaultSelect = (url, asset) => {
    handleChange('url', url);
    // Auto-detect file type from metadata if possible
    if (asset?.contentType) {
      if (asset.contentType.includes('pdf')) handleChange('fileType', 'PDF');
      else if (asset.contentType.includes('word') || asset.contentType.includes('document')) handleChange('fileType', 'DOCX');
      else if (asset.contentType.includes('sheet') || asset.contentType.includes('excel')) handleChange('fileType', 'XLSX');
      else if (asset.contentType.includes('presentation') || asset.contentType.includes('powerpoint')) handleChange('fileType', 'PPTX');
    }
  };

  return (
    <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="font-semibold text-blue-800 flex items-center gap-2">
        <FileText size={18} />
        Document Details
      </h3>
      
      {/* Source Type Selector */}
      <div className="flex gap-4 border-b border-blue-200 dark:border-blue-800 pb-2">
        <button
          type="button"
          onClick={() => setSourceType('LINK')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'LINK' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50'
          }`}
        >
          <LinkIcon size={14} />
          External Link
        </button>
        <button
          type="button"
          onClick={() => setSourceType('VAULT')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'VAULT' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50'
          }`}
        >
          <Database size={14} />
          From Media Vault
        </button>
      </div>

      {/* Document Source Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          {sourceType === 'LINK' ? <ExternalLink size={14} /> : <Database size={14} />}
          {sourceType === 'LINK' ? 'Document URL' : 'Select Document from Vault'}
        </label>

        {sourceType === 'LINK' ? (
          <input
            type="url"
            value={details.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com/document.pdf"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="space-y-2">
            {details.url ? (
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border rounded-md">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-600">
                  <FileText size={16} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{details.url}</span>
                <button
                  type="button"
                  onClick={() => handleChange('url', '')}
                  className="text-xs text-red-500 hover:text-red-700 px-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMediaSelector(true)}
                className="w-full p-8 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-2 text-blue-800"
              >
                <Database size={24} />
                <span className="font-medium">Select Document from Vault</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* File Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
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

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          onChange={(url, asset) => {
            handleVaultSelect(url, asset);
            setShowMediaSelector(false);
          }}
          onClose={() => setShowMediaSelector(false)}
          mediaType="document"
        />
      )}
    </div>
  );
};

export default DocumentDetailsEditor;
