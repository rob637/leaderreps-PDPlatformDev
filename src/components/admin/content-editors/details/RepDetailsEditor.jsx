import React, { useState } from 'react';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';
import { MEDIA_TYPES } from '../../../../services/mediaService';
import MediaPicker from '../pickers/MediaPicker';
import { Database } from 'lucide-react';

const RepDetailsEditor = ({ details, onChange, type }) => {
  const [showMediaPicker, setShowMediaPicker] = useState(null); // 'VIDEO' | 'DOCUMENT' | null

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const handleMediaSelect = (asset) => {
    if (showMediaPicker === 'VIDEO') {
      onChange('videoUrl', asset.url);
    } else if (showMediaPicker === 'DOCUMENT') {
      onChange('pdfUrl', asset.url);
    }
    setShowMediaPicker(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Rep Details</h3>
      
      {type === CONTENT_TYPES.REP && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="videoUrl"
                  value={details.videoUrl || ''}
                  onChange={handleChange}
                  placeholder="https://vimeo.com/..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker('VIDEO')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200"
                  title="Select from Vault"
                >
                  <Database size={18} />
                  Select from Media Vault
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (seconds)
            </label>
            <input
              type="number"
              name="duration"
              value={details.duration || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </>
      )}

      {type === CONTENT_TYPES.READ_REP && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content / Text
            </label>
            <textarea
              name="content"
              value={details.content || ''}
              onChange={handleChange}
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF URL (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  name="pdfUrl"
                  value={details.pdfUrl || ''}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker('DOCUMENT')}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200"
                  title="Select from Vault"
                >
                  <Database size={18} />
                  Select from Media Vault
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instructions / Notes
        </label>
        <textarea
          name="instructions"
          value={details.instructions || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {showMediaPicker && (
        <MediaPicker
          typeFilter={showMediaPicker}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(null)}
        />
      )}
    </div>
  );
};

export default RepDetailsEditor;
