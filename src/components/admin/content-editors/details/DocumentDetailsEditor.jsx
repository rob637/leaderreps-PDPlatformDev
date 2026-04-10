import React, { useState } from 'react';
import { FileText, ExternalLink, FileType, Link as LinkIcon, Database, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import MediaSelector from '../../MediaSelector';

const DocumentDetailsEditor = ({ details = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(
    details.url?.includes('firebasestorage') ? 'VAULT' : 'LINK'
  );
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleVaultSelect = (url, asset) => {
    // Clear fullText if URL is changing (file replaced)
    if (url !== details.url && details.fullText) {
      handleChange('fullText', '');
    }
    handleChange('url', url);
    // Auto-detect file type from metadata if possible
    if (asset?.contentType) {
      if (asset.contentType.includes('pdf')) handleChange('fileType', 'PDF');
      else if (asset.contentType.includes('word') || asset.contentType.includes('document')) handleChange('fileType', 'DOCX');
      else if (asset.contentType.includes('sheet') || asset.contentType.includes('excel')) handleChange('fileType', 'XLSX');
      else if (asset.contentType.includes('presentation') || asset.contentType.includes('powerpoint')) handleChange('fileType', 'PPTX');
    }
  };

  const handleUrlChange = (newUrl) => {
    // Clear fullText if URL is changing (file replaced)
    if (newUrl !== details.url && details.fullText) {
      handleChange('fullText', '');
    }
    handleChange('url', newUrl);
  };

  const handleExtractText = async () => {
    if (!details.url) {
      setExtractError('Please add a document URL first');
      return;
    }
    
    setExtracting(true);
    setExtractError(null);
    
    try {
      const extractDocumentText = httpsCallable(functions, 'extractDocumentText');
      const result = await extractDocumentText({ 
        documentUrl: details.url,
        fileType: details.fileType || 'PDF'
      });
      
      if (result.data?.text) {
        handleChange('fullText', result.data.text);
      } else {
        throw new Error(result.data?.error || 'Failed to extract text');
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      setExtractError(error.message || 'Failed to extract document text');
    } finally {
      setExtracting(false);
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
            onChange={(e) => handleUrlChange(e.target.value)}
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
                  onClick={() => handleUrlChange('')}
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

      {/* Full Text / Extracted Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
          <FileText size={14} />
          Full Text
          {details.fullText && (
            <span className="text-xs text-gray-500">
              ({details.fullText.split(/\s+/).length.toLocaleString()} words)
            </span>
          )}
          <button
            type="button"
            onClick={handleExtractText}
            disabled={extracting || !details.url}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {extracting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                Extract Text with AI
              </>
            )}
          </button>
        </label>
        <textarea
          value={details.fullText || ''}
          onChange={(e) => handleChange('fullText', e.target.value)}
          placeholder="Extracted document text will appear here, or paste it manually..."
          rows={6}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-mono"
        />
        {extractError && (
          <div className="flex items-center gap-2 mt-1 text-sm text-red-600">
            <AlertCircle size={14} />
            {extractError}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          The full text content of the document. Click "Extract Text with AI" to automatically extract from PDFs, or paste manually.
        </p>
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
