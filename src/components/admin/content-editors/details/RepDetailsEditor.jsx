import React, { useState } from 'react';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';
import { MEDIA_TYPES } from '../../../../services/mediaService';
import MediaPicker from '../pickers/MediaPicker';
import { Database, Bot, Copy, Check } from 'lucide-react';

const RepDetailsEditor = ({ details, onChange, type }) => {
  const [showMediaPicker, setShowMediaPicker] = useState(null); // 'VIDEO' | 'DOCUMENT' | null
  const [copied, setCopied] = useState(false);

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

  const AI_PROMPT = `Please provide a synopsis for the book '[Book Title]' by [Author]. Include:
1. A brief summary of the book.
2. Key points or takeaways.
3. How it is relevant to leadership.
4. Actionable insights for leaders.`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {/* AI Prompt Helper */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                <Bot size={18} />
                <span>AI Synopsis Generator</span>
              </div>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1 text-xs font-medium bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>
            <p className="text-xs text-indigo-600 mb-2">
              Use this prompt with ChatGPT/Claude to generate a consistent synopsis:
            </p>
            <div className="bg-white p-2 rounded border border-indigo-100 text-xs text-gray-600 font-mono whitespace-pre-wrap">
              {AI_PROMPT}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Synopsis
            </label>
            <textarea
              name="synopsis"
              value={details.synopsis || ''}
              onChange={handleChange}
              rows={6}
              placeholder="Paste the AI-generated synopsis here..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content / Text (Full Text or Additional Notes)
            </label>
            <textarea
              name="content"
              value={details.content || ''}
              onChange={handleChange}
              rows={4}
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
