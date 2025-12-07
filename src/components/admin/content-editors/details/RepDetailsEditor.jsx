import React from 'react';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';

const RepDetailsEditor = ({ details, onChange, type }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    // If onChange expects (key, value), we adapt. 
    // But GenericContentEditor passes handleDetailsChange which expects an event-like object or we can adapt it there.
    // Let's assume the parent passes a function that takes (key, value) or we adapt here.
    // Actually, the other editors use onChange('key', value).
    // Let's stick to that pattern.
    onChange(name, value);
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
            <input
              type="text"
              name="videoUrl"
              value={details.videoUrl || ''}
              onChange={handleChange}
              placeholder="https://vimeo.com/..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
            <input
              type="text"
              name="pdfUrl"
              value={details.pdfUrl || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
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
    </div>
  );
};

export default RepDetailsEditor;
