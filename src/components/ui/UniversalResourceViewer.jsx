import React from 'react';
import { X, ExternalLink, Download, FileText, Film, Link as LinkIcon, Layers } from 'lucide-react';

const UniversalResourceViewer = ({ resource, onClose }) => {
  if (!resource) return null;

  const { url, resourceType, type: legacyType, title, description } = resource;

  // Helper to determine content type if not explicitly provided
  const getContentType = () => {
    if (resourceType) return resourceType;
    if (legacyType) return legacyType;
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
        } else if (url.includes('vimeo.com')) {
          const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
          const embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1` : url;
          return (
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
          );
        } else if (url.includes('loom.com')) {
          const loomId = url.match(/loom\.com\/share\/([a-f0-9]+)/)?.[1];
          const embedUrl = loomId ? `https://www.loom.com/embed/${loomId}?autoplay=1` : url;
          return (
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={title}
              />
            </div>
          );
        } else {
          // Generic Video Handler (MP4, WebM, or explicit 'video' type)
          // Try to render as video tag, but provide fallback link
          return (
            <div className="flex flex-col gap-4 w-full">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                <video 
                  src={url} 
                  controls 
                  playsInline
                  crossOrigin="anonymous"
                  className="w-full h-full max-h-[70vh]"
                >
                  <p className="text-white p-4 text-center">
                    Video format not supported for inline playback.<br/>
                    Please use the link below.
                  </p>
                </video>
              </div>
              
              <div className="flex justify-center">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"
                >
                  Having trouble? Watch on external site <ExternalLink className="w-3 h-3" />
                </a>
              </div>
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

      default: // Link / Document / Course
        // Check for Google Docs/Sheets/Slides
        if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
          // Ensure we use the embed/preview mode if possible
          let embedUrl = url;
          if (url.includes('/edit')) {
            embedUrl = url.replace('/edit', '/preview');
          } else if (url.includes('/view')) {
            embedUrl = url.replace('/view', '/preview');
          }
          
          return (
            <div className="h-[70vh] w-full bg-slate-100 rounded-lg overflow-hidden">
              <iframe src={embedUrl} className="w-full h-full" title={title} allow="autoplay" />
            </div>
          );
        }

        // Check for Office Documents (Word, Excel, PowerPoint) or generic files
        // Use Google Docs Viewer to embed them
        if (url.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i)) {
           const encodedUrl = encodeURIComponent(url);
           const viewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
           return (
            <div className="h-[70vh] w-full bg-slate-100 rounded-lg overflow-hidden">
              <iframe src={viewerUrl} className="w-full h-full" title={title} />
            </div>
           );
        }

        // Fallback: Try to iframe it (some sites allow it), otherwise show the link
        return (
          <div className="h-[70vh] w-full bg-slate-100 rounded-lg overflow-hidden flex flex-col">
             <iframe 
                src={url} 
                className="w-full h-full flex-1" 
                title={title}
                onError={(e) => {
                    // If iframe fails (X-Frame-Options), we can't easily detect it in JS, 
                    // but we provide the "Open in New Window" button below as a backup.
                }}
             />
             <div className="p-2 bg-slate-50 border-t flex justify-center">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                >
                  If content doesn't load, click here to open in new window <ExternalLink className="w-3 h-3" />
                </a>
             </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Absolute Close Button for reliability */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 z-[60] p-2 bg-white/90 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors shadow-sm border border-slate-100"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50 z-10 relative pr-16">
          <div>
            <h2 className="text-lg font-bold text-corporate-navy line-clamp-1">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 line-clamp-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mr-8">
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
