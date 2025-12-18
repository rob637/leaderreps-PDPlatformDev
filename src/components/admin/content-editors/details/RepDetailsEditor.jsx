import React, { useState } from 'react';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';
import { MEDIA_TYPES } from '../../../../services/mediaService';
import MediaPicker from '../pickers/MediaPicker';
import { Database, Bot, Copy, Check, Sparkles, Loader, Image as ImageIcon } from 'lucide-react';
import { useAppServices } from '../../../../services/useAppServices';

const RepDetailsEditor = ({ details, onChange, type }) => {
  const { callSecureGeminiAPI, GEMINI_MODEL } = useAppServices();
  const [showMediaPicker, setShowMediaPicker] = useState(null); // 'VIDEO' | 'DOCUMENT' | 'IMAGE' | null
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const handleMediaSelect = (asset) => {
    if (showMediaPicker === 'VIDEO') {
      onChange('videoUrl', asset.url);
    } else if (showMediaPicker === 'DOCUMENT') {
      onChange('pdfUrl', asset.url);
    } else if (showMediaPicker === 'IMAGE') {
      onChange('coverUrl', asset.url);
    }
    setShowMediaPicker(null);
  };

  const handleGenerateSynopsis = async () => {
    if (!details.title && !details.author) {
      alert('Please enter a Title or Author first.');
      return;
    }

    setGenerating(true);
    try {
      const prompt = `
        Write a comprehensive, deep-dive executive synopsis for the book "${details.title || 'Unknown Title'}" by ${details.author || 'Unknown Author'}.
        
        Target Audience: Executive Leaders and Managers who need deep insights without reading the full book.
        Length: Approximately 1500-2000 words (equivalent to 2-3 pages).
        Tone: Professional, insightful, authoritative, and actionable.
        
        Formatting Requirements:
        - Use HTML tags for formatting (no markdown).
        - Use <h3> for main section headings.
        - Use <h4> for sub-headings.
        - Use <strong> for bold text.
        - Use <ul> and <li> for lists.
        - Use <p> for paragraphs.
        - Use <blockquote> for key quotes.
        
        Structure:
        1. <h3>Executive Summary</h3>: A comprehensive overview of the book's core thesis and value proposition (3-4 paragraphs).
        
        2. <h3>The Core Philosophy</h3>: A deep dive into the central argument or philosophy of the book. Explain the "Why" and "What" in detail.
        
        3. <h3>Key Concepts & Frameworks</h3>: Break down the 3-5 most important concepts or frameworks presented in the book. For each concept:
           - Use a <h4> subheading.
           - Explain the concept thoroughly.
           - Provide examples or context given in the book.
        
        4. <h3>Critical Leadership Insights</h3>:
           - Discuss specific insights relevant to leadership, management, and organizational culture.
           - How does this challenge conventional wisdom?
        
        5. <h3>Actionable Application</h3>:
           - <h4>For the Individual Leader</h4>: Specific habits or actions to adopt.
           - <h4>For the Team/Organization</h4>: How to implement these ideas at scale.
        
        6. <h3>Notable Quotes</h3>: 3-5 powerful quotes from the book that capture its essence.
        
        7. <h3>Conclusion</h3>: A final wrap-up on why this book matters today.
        
        8. <hr/>
        9. <p style="font-size: 0.8em; color: #666; text-align: center;"><em>Comprehensive Executive Synopsis by LeaderReps AI</em></p>
        
        Ensure the content is rich, detailed, and provides high value. Do not be superficial.
      `;

      const payload = {
        prompt: prompt,
        model: GEMINI_MODEL || 'gemini-2.0-flash',
      };

      const result = await callSecureGeminiAPI(payload);
      
      // Handle both direct text response (if proxy simplifies it) or standard Gemini response
      let text = '';
      if (result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = result.candidates[0].content.parts[0].text;
      } else if (result?.text) {
        text = result.text;
      } else if (typeof result === 'string') {
        text = result;
      }

      if (text) {
        // Strip markdown code blocks if Gemini adds them
        const cleanText = text.replace(/```html/g, '').replace(/```/g, '').trim();
        onChange('synopsis', cleanText);
      } else {
        console.error('Unexpected API response:', result);
        alert('Failed to generate synopsis. Unexpected response format.');
      }

      // Try to fetch book cover from Google Books API
      try {
        const query = `intitle:${encodeURIComponent(details.title)}${details.author ? `+inauthor:${encodeURIComponent(details.author)}` : ''}`;
        const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`);
        const bookData = await bookRes.json();
        
        if (bookData.items && bookData.items.length > 0) {
          const volumeInfo = bookData.items[0].volumeInfo;
          if (volumeInfo.imageLinks) {
            const cover = volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail;
            if (cover) {
              // Google Books URLs are often http, replace with https to avoid mixed content
              const secureCover = cover.replace(/^http:\/\//i, 'https://');
              onChange('coverUrl', secureCover);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching book cover:", err);
        // Don't fail the whole process if cover fetch fails
      }

    } catch (error) {
      console.error('Error generating synopsis:', error);
      alert('Error generating synopsis: ' + error.message);
    } finally {
      setGenerating(false);
    }
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
          {/* Cover Image URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="coverUrl"
                value={details.coverUrl || ''}
                onChange={handleChange}
                placeholder="https://..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowMediaPicker('IMAGE')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
                title="Select from Vault"
              >
                <ImageIcon size={18} />
                Select
              </button>
            </div>
            {details.coverUrl && (
              <div className="mt-2">
                <img src={details.coverUrl} alt="Cover Preview" className="h-32 object-contain rounded border border-gray-200" />
              </div>
            )}
          </div>

          {/* Author field moved to GenericContentEditor for better visibility */}

          {/* AI Prompt Helper */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                <Bot size={18} />
                <span>AI Synopsis Generator</span>
              </div>
            </div>
            <p className="text-xs text-indigo-600 mb-3">
              Generate a professionally formatted synopsis with headings, bold text, and key takeaways.
            </p>
            
            <button
              type="button"
              onClick={handleGenerateSynopsis}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Generating Synopsis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Professional Synopsis
                </>
              )}
            </button>
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
