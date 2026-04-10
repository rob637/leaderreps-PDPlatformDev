import React, { useState } from 'react';
import { Wrench, ExternalLink, Link as LinkIcon, Database, Video, FileText, Sparkles, Loader2, AlertCircle, Check } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../../lib/firebase';
import MediaSelector from '../../MediaSelector';

const ToolDetailsEditor = ({ details = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(
    details.url?.includes('firebasestorage') ? 'VAULT' : 'LINK'
  );
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleUrlChange = (newUrl) => {
    // Clear fullText if URL is changing (file replaced)
    if (newUrl !== details.url && details.fullText) {
      handleChange('fullText', '');
    }
    handleChange('url', newUrl);
  };

  const handleVaultSelect = (url, asset) => {
    // Clear fullText if URL is changing (file replaced)
    if (url !== details.url && details.fullText) {
      handleChange('fullText', '');
    }
    handleChange('url', url);
    // Auto-detect type
    if (asset?.contentType) {
      if (asset.contentType.includes('video')) handleChange('toolType', 'VIDEO_RESOURCE');
      else if (asset.contentType.includes('pdf') || asset.contentType.includes('document')) handleChange('toolType', 'ARTICLE');
    }
  };

  const handleExtractText = async () => {
    if (!details.url) {
      setExtractError('Please add a tool URL first');
      return;
    }
    
    // Check if it's a video - can't extract text from videos here
    if (details.toolType === 'VIDEO_RESOURCE') {
      setExtractError('For video resources, use the Video Wrapper to transcribe');
      return;
    }
    
    setExtracting(true);
    setExtractError(null);
    
    try {
      const extractDocumentText = httpsCallable(functions, 'extractDocumentText');
      const result = await extractDocumentText({ 
        documentUrl: details.url,
        fileType: 'PDF' // Most tools are PDFs
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
    <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <Wrench size={18} />
        Tool Details
      </h3>
      
      {/* Source Type Selector */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          type="button"
          onClick={() => setSourceType('LINK')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'LINK' 
              ? 'bg-gray-200 text-gray-800 dark:text-gray-200' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100'
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
              ? 'bg-gray-200 text-gray-800 dark:text-gray-200' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100'
          }`}
        >
          <Database size={14} />
          From Media Vault
        </button>
      </div>

      {/* Tool Source Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          {sourceType === 'LINK' ? <ExternalLink size={14} /> : <Database size={14} />}
          {sourceType === 'LINK' ? 'Tool URL' : 'Select Resource from Vault'}
        </label>

        {sourceType === 'LINK' ? (
          <input
            type="url"
            value={details.url || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/tool"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="space-y-2">
            {details.url ? (
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border rounded-md">
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-600 dark:text-gray-300">
                  <Wrench size={16} />
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
                className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2 text-gray-800 dark:text-gray-200"
              >
                <Database size={24} />
                <span className="font-medium">Select Resource from Vault</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tool Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          <Wrench size={14} />
          Tool Type
        </label>
        <select
          value={details.toolType || 'ARTICLE'}
          onChange={(e) => handleChange('toolType', e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="ARTICLE">Article / Document</option>
          <option value="VIDEO_RESOURCE">Video Resource</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Full Text / Extracted Content (for documents only) */}
      {details.toolType !== 'VIDEO_RESOURCE' && (
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
            Extract text from PDF tools for book generation. Click the button or paste manually.
          </p>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          onChange={(url, asset) => {
            handleVaultSelect(url, asset);
            setShowMediaSelector(false);
          }}
          onClose={() => setShowMediaSelector(false)}
          mediaType="ALL"
        />
      )}
    </div>
  );
};

export default ToolDetailsEditor;