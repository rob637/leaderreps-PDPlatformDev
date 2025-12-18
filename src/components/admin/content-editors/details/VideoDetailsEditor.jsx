// src/components/admin/content-editors/details/VideoDetailsEditor.jsx
import React, { useState } from 'react';
import { ExternalLink, User, Film, Tag, Clock, Upload, Link as LinkIcon } from 'lucide-react';
import FileUploader from '../../FileUploader';

const VideoDetailsEditor = ({ details = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(
    details.externalUrl?.includes('firebasestorage') ? 'UPLOAD' : 'LINK'
  );

  const handleChange = (key, value) => {
    onChange(key, value);
  };

  const handleUploadComplete = (url, filename) => {
    handleChange('externalUrl', url);
  };

  return (
    <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
      <h3 className="font-semibold text-orange-800 flex items-center gap-2">
        <Film size={18} />
        Video Details
      </h3>
      
      {/* Source Type Selector */}
      <div className="flex gap-4 border-b border-orange-200 pb-2">
        <button
          type="button"
          onClick={() => setSourceType('LINK')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'LINK' 
              ? 'bg-orange-100 text-orange-800' 
              : 'text-gray-600 hover:bg-orange-50'
          }`}
        >
          <LinkIcon size={14} />
          External Link
        </button>
        <button
          type="button"
          onClick={() => setSourceType('UPLOAD')}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            sourceType === 'UPLOAD' 
              ? 'bg-orange-100 text-orange-800' 
              : 'text-gray-600 hover:bg-orange-50'
          }`}
        >
          <Upload size={14} />
          Upload Video
        </button>
      </div>
      
      {/* Video Source Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          {sourceType === 'LINK' ? <ExternalLink size={14} /> : <Upload size={14} />}
          {sourceType === 'LINK' ? 'Video URL' : 'Upload Video File'}
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
            <p className="text-xs text-gray-500 mt-1">
              Paste the full URL. YouTube thumbnails will be auto-extracted.
            </p>
          </>
        ) : (
          <div className="space-y-2">
            {details.externalUrl && (
              <div className="flex items-center gap-2 p-2 bg-white border rounded-md">
                <span className="text-xs text-gray-500 truncate flex-1">{details.externalUrl}</span>
                <button
                  type="button"
                  onClick={() => handleChange('externalUrl', '')}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            <FileUploader 
              folder="videos" 
              accept="video/*" 
              onUploadComplete={handleUploadComplete} 
            />
            <p className="text-xs text-gray-500">
              Supported formats: MP4, WebM, MOV. Max size depends on your plan.
            </p>
          </div>
        )}
      </div>

      {/* Speaker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Thumbnail URL (optional)
        </label>
        <input
          type="url"
          value={details.thumbnail || ''}
          onChange={(e) => handleChange('thumbnail', e.target.value)}
          placeholder="https://..."
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave blank to auto-extract from YouTube. Use for Vimeo or custom thumbnails.
        </p>
      </div>

      {/* Key Takeaways */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
