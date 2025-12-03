import React from 'react';
import { X, ExternalLink, Download, FileText, Film, Link as LinkIcon } from 'lucide-react';

const UniversalResourceViewer = ({ resource, onClose }) => {
  if (!resource) return null;

  const { url, resourceType, title, description } = resource;

  // Helper to determine content type if not explicitly provided
  const getContentType = () => {
    if (resourceType) return resourceType;
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.endsWith('.mp4')) return 'video';
    if (url.endsWith('.pdf')) return 'pdf';
    return 'link';
  };

  const type = getContentType();

  // Helper to get YouTube embed URL
  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const renderContent = () => {
    switch (type) {
      case 'video':
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          return (
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <iframe
                src={getYouTubeEmbedUrl(url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
          );
        } else if (url.endsWith('.mp4') || resource.metadata?.fileType?.startsWith('video/')) {
          return (
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
              <video 
                src={url} 
                controls 
                autoPlay 
                className="w-full h-full max-h-[70vh]"
              />
            </div>
          );
        } else {
          // Fallback for other video links (Vimeo, etc.)
          return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-100 rounded-lg">
              <Film className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-600 mb-4">This video cannot be embedded directly.</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-corporate-teal text-white rounded-lg font-bold hover:bg-corporate-teal-dark flex items-center gap-2"
              >
                Watch on External Site <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          );
        }

      case 'pdf':
      case 'reading': // Map 'reading' to PDF viewer if it's a file
        if (url.endsWith('.pdf') || resource.metadata?.fileType === 'application/pdf') {
          return (
            <div className="h-[70vh] w-full bg-slate-100 rounded-lg overflow-hidden">
              <iframe src={url} className="w-full h-full" title={title} />
            </div>
          );
        }
        // Fallthrough to link for non-PDF readings

      default: // Link / Document
        return (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {type === 'reading' ? <FileText className="w-8 h-8 text-blue-600" /> : <LinkIcon className="w-8 h-8 text-blue-600" />}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-500 mb-6 max-w-md text-center">
              This resource opens in a new window.
            </p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-corporate-navy text-white rounded-xl font-bold hover:bg-corporate-navy-light flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
            >
              Open Resource <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-corporate-navy pr-8 line-clamp-1">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 line-clamp-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default UniversalResourceViewer;
