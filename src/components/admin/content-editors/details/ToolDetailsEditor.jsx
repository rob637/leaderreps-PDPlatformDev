import React, { useState } from 'react';
import { Wrench, ExternalLink, Link as LinkIcon, Database, Video, FileText } from 'lucide-react';
import MediaSelector from '../../MediaSelector';

const ToolDetailsEditor = ({ details = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(
    details.url?.includes('firebasestorage') ? 'VAULT' : 'LINK'
  );
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleVaultSelect = (url, asset) => {
    handleChange('url', url);
    // Auto-detect type
    if (asset?.contentType) {
      if (asset.contentType.includes('video')) handleChange('toolType', 'VIDEO_RESOURCE');
      else if (asset.contentType.includes('pdf') || asset.contentType.includes('document')) handleChange('toolType', 'ARTICLE');
    }
  };

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <Wrench size={18} />
        Tool Details
      </h3>
      
      {/* Source Type Selector */}
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setSourceType('LINK')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'LINK' 
              ? 'bg-gray-200 text-gray-800' 
              : 'text-gray-600 hover:bg-gray-100'
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
              ? 'bg-gray-200 text-gray-800' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Database size={14} />
          From Media Vault
        </button>
      </div>

      {/* Tool Source Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          {sourceType === 'LINK' ? <ExternalLink size={14} /> : <Database size={14} />}
          {sourceType === 'LINK' ? 'Tool URL' : 'Select Resource from Vault'}
        </label>

        {sourceType === 'LINK' ? (
          <input
            type="url"
            value={details.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            placeholder="https://example.com/tool"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="space-y-2">
            {details.url ? (
              <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-600">
                  <Wrench size={16} />
                </div>
                <span className="text-sm text-gray-700 truncate flex-1">{details.url}</span>
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
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center gap-2 text-gray-800"
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
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
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

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          onSelect={(url, asset) => {
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