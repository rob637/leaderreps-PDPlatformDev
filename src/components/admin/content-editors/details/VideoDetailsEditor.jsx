// src/components/admin/content-editors/details/VideoDetailsEditor.jsx
import React from 'react';
import { ExternalLink, User, Film, Tag, Clock } from 'lucide-react';

const VideoDetailsEditor = ({ details = {}, onChange }) => {
  const handleChange = (key, value) => {
    onChange(key, value);
  };

  return (
    <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
      <h3 className="font-semibold text-orange-800 flex items-center gap-2">
        <Film size={18} />
        Video Details
      </h3>
      
      {/* External URL (YouTube, Vimeo, etc.) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <ExternalLink size={14} />
          Video URL (YouTube, Vimeo, or direct link)
        </label>
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
