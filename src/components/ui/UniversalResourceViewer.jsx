import React from 'react';
import { X, ExternalLink, Download, FileText, Film, Link as LinkIcon, Layers } from 'lucide-react';

const UniversalResourceViewer = ({ resource, onClose }) => {
  if (!resource) return null;

  const { url, resourceType, type: legacyType, title, description } = resource;

  // Helper to determine content type if not explicitly provided
  const getContentType = () => {
    if (resourceType) return resourceType.toLowerCase();
    if (legacyType) return legacyType.toLowerCase();
    
    const lowerUrl = (url || '').toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com') || lowerUrl.endsWith('.mp4')) return 'video';
    if (lowerUrl.includes('.pdf')) return 'pdf';
    if (lowerUrl.match(/\.(docx|doc|pptx|ppt|xlsx|xls)/)) return 'document';
    
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
        if (!url) {
          return (
            <div className="aspect-video w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
              <p className="text-slate-500">No video URL available.</p>
            </div>
          );
        }

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

      case 'read_rep':
        // Special handler for Read & Reps (Unified Content)
        // Shows Synopsis + PDF Link
        return (
          <div className="flex flex-col h-[70vh] w-full">
            {/* Synopsis Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-4 flex-shrink-0 overflow-y-auto max-h-[40vh]">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-corporate-teal" />
                <h3 className="font-bold text-slate-700">Synopsis</h3>
              </div>
              {resource.synopsis ? (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {resource.synopsis}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">No synopsis available.</p>
              )}
              
              {resource.author && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">Author: {resource.author}</p>
                </div>
              )}
            </div>

            {/* PDF Viewer (if URL exists) */}
            {url ? (
              <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden relative min-h-[300px]">
                 <iframe 
                   src={url} 
                   className="w-full h-full" 
                   title={title}
                 />
                 <div className="absolute bottom-4 right-4">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white/90 hover:bg-white text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Open Full PDF
                    </a>
                 </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400">No PDF attached to this resource.</p>
              </div>
            )}
          </div>
        );

      case 'pdf':
      case 'reading': 
      case 'document':
      case 'tool': {
        // Check for Google Docs/Sheets/Slides (Native Google Drive Links)
        if (url && (url.includes('docs.google.com') || url.includes('drive.google.com'))) {
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

        // For PDFs from Firebase Storage or other sources - try native browser PDF viewer first
        // Modern browsers can render PDFs directly in iframes
        const isPDF = url && (url.toLowerCase().includes('.pdf') || url.includes('alt=media'));
        
        if (isPDF) {
          return (
            <div className="h-[70vh] w-full bg-slate-100 rounded-lg overflow-hidden relative">
               <iframe 
                 src={url} 
                 className="w-full h-full" 
                 title={title}
               />
               {/* Fallback Link Overlay */}
               <div className="absolute bottom-4 right-4">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/90 hover:bg-white text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    Download / Open Directly
                  </a>
               </div>
            </div>
          );
        }

        // For Office Docs (docx, pptx, xlsx) -> Use Google Docs Viewer
        // Google Docs Viewer is required for Office docs but unreliable for some PDFs
        const encodedUrl = url ? encodeURIComponent(url) : '';
        const viewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
        
        return (
          <div className="h-[70vh] w-full bg-slate-100 rounded-lg overflow-hidden relative">
             <iframe 
               src={viewerUrl} 
               className="w-full h-full" 
               title={title} 
             />
             {/* Fallback Link Overlay (in case viewer fails) */}
             <div className="absolute bottom-4 right-4">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/90 hover:bg-white text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Download / Open Directly
                </a>
             </div>
          </div>
        );
      }

      default: // Link / Course / Other
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
