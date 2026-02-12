// src/components/admin/content-editors/details/VideoDetailsEditor.jsx
import React, { useState } from 'react';
import { ExternalLink, User, Film, Tag, Clock, Upload, Link as LinkIcon, Database } from 'lucide-react';
import MediaSelector from '../../MediaSelector';

const VideoDetailsEditor = ({ details = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(
    details.externalUrl?.includes('firebasestorage') ? 'VAULT' : 'LINK'
  );
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleVaultSelect = (url, asset) => {
    handleChange('externalUrl', url);
    // Optionally store other metadata from asset if needed
    if (asset.duration) handleChange('durationMin', Math.round(asset.duration / 60));
  };

  return (
    <div className="space-y-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
      <h3 className="font-semibold text-orange-800 flex items-center gap-2">
        <Film size={18} />
        Video Details
      </h3>
      
      {/* Source Type Selector */}
      <div className="flex gap-4 border-b border-orange-200 dark:border-orange-800 pb-2">
        <button
          type="button"
          onClick={() => setSourceType('LINK')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'LINK' 
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50'
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
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800' 
              : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50'
          }`}
        >
          <Database size={14} />
          From Media Vault
        </button>
      </div>
      
      {/* Video Source Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          {sourceType === 'LINK' ? <ExternalLink size={14} /> : <Database size={14} />}
          {sourceType === 'LINK' ? 'Video URL' : 'Select Video from Vault'}
        </label>

        {sourceType === 'LINK' ? (
          <>
            <input
              type="url"
              value={details.externalUrl || ''}
              onChange={(e) => handleChange('externalUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Paste the full URL. YouTube thumbnails will be auto-extracted.
            </p>
          </>
        ) : (
          <div className="space-y-2">
            {details.externalUrl ? (
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 border rounded-md">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded flex items-center justify-center text-orange-600">
                  <Film size={16} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{details.externalUrl}</span>
                <button
                  type="button"
                  onClick={() => handleChange('externalUrl', '')}
                  className="text-xs text-red-500 hover:text-red-700 px-2"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMediaSelector(true)}
                className="w-full p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 transition-colors flex flex-col items-center justify-center gap-2 text-orange-800"
              >
                <Database size={24} />
                <span className="font-medium">Select Video from Vault</span>
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select a video file previously uploaded to the Media Vault.
            </p>
          </div>
        )}
      </div>

      {showMediaSelector && (
        <MediaSelector
          mediaType="video"
          value={details.externalUrl}
          onChange={handleVaultSelect}
          onClose={() => setShowMediaSelector(false)}
        />
      )}

      {/* Speaker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          <User size={14} />
          Speaker / Presenter
        </label>
        <input
          type="text"
          value={details.speaker || ''}
          onChange={(e) => handleChange('speaker', e.target.value)}
          placeholder="e.g. Simon Sinek"
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          <Tag size={14} />
          Source
        </label>
        <input
          type="text"
          value={details.source || ''}
          onChange={(e) => handleChange('source', e.target.value)}
          placeholder="e.g. TED Talk, Harvard Business Review"
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Category
        </label>
        <select
          value={details.category || ''}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Select category...</option>
          <option value="Leadership">Leadership</option>
          <option value="Communication">Communication</option>
          <option value="Strategy">Strategy</option>
          <option value="Team Building">Team Building</option>
          <option value="Personal Development">Personal Development</option>
          <option value="Motivation">Motivation</option>
          <option value="Management">Management</option>
          <option value="Culture">Culture</option>
          <option value="Innovation">Innovation</option>
        </select>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1">
          <Clock size={14} />
          Duration (minutes)
        </label>
        <input
          type="number"
          value={details.durationMin || ''}
          onChange={(e) => handleChange('durationMin', parseInt(e.target.value) || '')}
          placeholder="e.g. 18"
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Custom Thumbnail URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Custom Thumbnail URL (optional)
        </label>
        <input
          type="url"
          value={details.thumbnail || ''}
          onChange={(e) => handleChange('thumbnail', e.target.value)}
          placeholder="https://..."
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Leave blank to auto-extract from YouTube. Use for Vimeo or custom thumbnails.
        </p>
      </div>

      {/* Key Takeaways */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Key Takeaways (one per line)
        </label>
        <textarea
          value={details.keyTakeaways || ''}
          onChange={(e) => handleChange('keyTakeaways', e.target.value)}
          placeholder="Leaders eat last&#10;Start with why&#10;Trust builds over time"
          rows={4}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
      </div>
    </div>
  );
};

export default VideoDetailsEditor;
