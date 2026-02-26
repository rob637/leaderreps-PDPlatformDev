import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, Download, FileText, Film, Link as LinkIcon, Layers, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Iframe wrapper that detects load failures (blank/gray iframes from gview)
 * and shows a prominent fallback UI after a timeout.
 */
const IframeWithFallback = ({ src, directUrl, title }) => {
  const [showFallback, setShowFallback] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // If the iframe doesn't trigger onLoad within 8 seconds, show fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!iframeLoaded) setShowFallback(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [iframeLoaded]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  if (showFallback && !iframeLoaded) {
    return (
      <div className="h-[70vh] w-full bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-slate-400" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Document preview unavailable</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            This document can&apos;t be previewed in the browser. You can download it or open it directly.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white text-sm font-bold rounded-lg hover:bg-corporate-teal/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
          <a
            href={directUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[70vh] w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
      <iframe
        src={src}
        className="w-full h-full"
        title={title}
        onLoad={handleIframeLoad}
      />
      {/* Always show fallback link */}
      <div className="absolute bottom-4 right-4">
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
        >
          <Download className="w-3 h-3" />
          Download / Open Directly
        </a>
      </div>
    </div>
  );
};

const UniversalResourceViewer = ({ resource, onClose, onVideoComplete, inline = false }) => {
  const [markedComplete, setMarkedComplete] = useState(false);
  
  if (!resource) return null;

  // Extract URL from either legacy top-level field or new details object
  const url = resource.url || resource.details?.url;
  const { resourceType, type: legacyType, title, description } = resource;

  // Handler for marking video as watched
  const handleMarkWatched = () => {
    setMarkedComplete(true);
    if (onVideoComplete) {
      onVideoComplete(resource);
    }
  };

  // Handler for video ended event (native video player)
  const handleVideoEnded = () => {
    if (!markedComplete) {
      handleMarkWatched();
    }
  };

  // Handler for closing the viewer - does NOT auto-mark videos complete
  // Videos are only marked complete when they finish playing (handleVideoEnded)
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Helper to determine content type if not explicitly provided
  const getContentType = () => {
    const lowerUrl = (url || '').toLowerCase();
    
    // Priority 1: Force 'document' for Office files (must use viewer to avoid download)
    if (lowerUrl.match(/\.(docx|doc|pptx|ppt|xlsx|xls)/)) return 'document';
    
    // Priority 2: Force 'pdf' for PDF files
    if (lowerUrl.includes('.pdf')) return 'pdf';

    // Priority 3: Use explicit type if available
    if (resourceType) return resourceType.toLowerCase();
    if (legacyType) return legacyType.toLowerCase();
    
    // Priority 4: Infer video
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com') || lowerUrl.endsWith('.mp4')) return 'video';
    
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
            <div className="aspect-video w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400">No video URL available.</p>
            </div>
          );
        }

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          return (
            <div className="flex flex-col gap-3 w-full">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={title}
                />
              </div>
              {onVideoComplete && markedComplete && (
                <div className="flex justify-center">
                  <span className="flex items-center gap-2 text-sm text-corporate-teal font-medium px-4 py-2">
                    <CheckCircle className="w-4 h-4" />
                    Marked as Watched
                  </span>
                </div>
              )}
            </div>
          );
        } else if (url.includes('vimeo.com')) {
          const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
          const embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=1` : url;
          return (
            <div className="flex flex-col gap-3 w-full">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={title}
                />
              </div>
              {onVideoComplete && markedComplete && (
                <div className="flex justify-center">
                  <span className="flex items-center gap-2 text-sm text-corporate-teal font-medium px-4 py-2">
                    <CheckCircle className="w-4 h-4" />
                    Marked as Watched
                  </span>
                </div>
              )}
            </div>
          );
        } else if (url.includes('loom.com')) {
          const loomId = url.match(/loom\.com\/share\/([a-f0-9]+)/)?.[1];
          const embedUrl = loomId ? `https://www.loom.com/embed/${loomId}?autoplay=1` : url;
          return (
            <div className="flex flex-col gap-3 w-full">
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={title}
                />
              </div>
              {onVideoComplete && markedComplete && (
                <div className="flex justify-center">
                  <span className="flex items-center gap-2 text-sm text-corporate-teal font-medium px-4 py-2">
                    <CheckCircle className="w-4 h-4" />
                    Marked as Watched
                  </span>
                </div>
              )}
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
                  onEnded={handleVideoEnded}
                >
                  <p className="text-white p-4 text-center">
                    Video format not supported for inline playback.<br/>
                    Please use the link below.
                  </p>
                </video>
              </div>
              
              <div className="flex flex-col items-center gap-3">
                {onVideoComplete && markedComplete && (
                  <span className="flex items-center gap-2 text-sm text-corporate-teal font-medium px-4 py-2">
                    <CheckCircle className="w-4 h-4" />
                    Marked as Watched
                  </span>
                )}
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
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
            <div className={`bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-100 mb-4 overflow-y-auto ${url ? 'max-h-[40vh] flex-shrink-0' : 'flex-1 h-full'}`}>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-corporate-teal" />
                <h3 className="font-bold text-slate-700 dark:text-slate-200">Synopsis</h3>
              </div>
              {resource.synopsis || resource.details?.synopsis ? (
                <div 
                  className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed prose-sm prose-blue max-w-none [&>h3]:text-corporate-navy [&>h3]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>h4]:text-corporate-teal [&>h4]:font-bold [&>h4]:mt-3 [&>h4]:mb-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>p]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-corporate-teal [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4"
                  dangerouslySetInnerHTML={{ __html: resource.synopsis || resource.details?.synopsis }}
                />
              ) : (
                <p className="text-sm text-slate-400 italic">No synopsis available.</p>
              )}
              
              {(resource.author || resource.details?.author) && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Author: {resource.author || resource.details?.author}</p>
                </div>
              )}
            </div>

            {/* PDF Viewer (if URL exists) */}
            {url && (
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative min-h-[300px]">
                 <iframe 
                   src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`}
                   className="w-full h-full" 
                   title={title}
                 />
                 <div className="absolute bottom-4 right-4">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Open Full PDF
                    </a>
                 </div>
              </div>
            )}
          </div>
        );

      case 'pdf':
      case 'reading': 
      case 'document':
      case 'tool': {
        // Check for Google Docs/Sheets/Slides (Native Google Drive Links)
        // Expanded to catch more variations and prevent them from falling through to gview
        const isGoogleDrive = url && (
          url.includes('docs.google.com') || 
          url.includes('drive.google.com') || 
          url.includes('sheets.google.com') || 
          url.includes('slides.google.com') ||
          url.includes('google.com/document') ||
          url.includes('google.com/spreadsheets') ||
          url.includes('google.com/presentation')
        );

        if (isGoogleDrive) {
          let embedUrl = url;
          if (url.includes('/edit')) {
            embedUrl = url.replace('/edit', '/preview');
          } else if (url.includes('/view')) {
            embedUrl = url.replace('/view', '/preview');
          }
          return (
            <div className="h-[70vh] w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
              <iframe src={embedUrl} className="w-full h-full" title={title} allow="autoplay" />
            </div>
          );
        }

        // Check for Images
        const isImage = url && url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)/);
        if (isImage) {
            return (
                <div className="h-[70vh] w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center bg-black/5">
                    <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
                    <div className="absolute bottom-4 right-4">
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Original
                        </a>
                    </div>
                </div>
            );
        }

        // Check for PDF - Prefer Native Viewer for Firebase/Direct URLs
        // Google Viewer (gview) often fails with "No preview available" for signed URLs or large files
        const isPdf = url && url.toLowerCase().includes('.pdf');
        if (isPdf) {
           // For signed URLs (GoogleAccessId or Signature in URL), use browser's native PDF viewer
           // Google Docs Viewer cannot access authenticated/signed URLs
           const isSignedUrl = url.includes('GoogleAccessId') || url.includes('Signature=');
           
           if (isSignedUrl) {
             // Use browser's native PDF viewer - most modern browsers handle this well
             return (
               <div className="h-[70vh] w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                 <iframe
                   src={url}
                   className="w-full h-full"
                   title={title}
                 />
                 {/* Always show download link as fallback */}
                 <div className="absolute bottom-4 right-4">
                   <a
                     href={url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                   >
                     <Download className="w-3 h-3" />
                     Download / Open Directly
                   </a>
                 </div>
               </div>
             );
           }
           
           // For non-signed URLs, try Google Docs Viewer
           let pdfUrl = url;
           if (url.includes('firebasestorage.googleapis.com') && (url.includes('/vault%2F') || url.includes('/vault/'))) {
              try {
                const urlObj = new URL(url);
                urlObj.searchParams.delete('token');
                pdfUrl = urlObj.toString();
              } catch (e) {
                console.warn('Failed to process PDF URL:', e);
              }
           }

           return (
             <IframeWithFallback
               src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
               directUrl={url}
               title={title}
             />
           );
        }

        // For Office Docs and generic files -> Use Google Docs Viewer
        // This ensures "in-app" viewing and avoids direct downloads or new tabs
        const encodedUrl = url ? encodeURIComponent(url) : '';
        const viewerUrl = `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`;
        
        return (
          <IframeWithFallback
            src={viewerUrl}
            directUrl={url}
            title={title}
          />
        );
      }

      default: // Link / Course / Other
        // Fallback: Try to iframe it (some sites allow it), otherwise show the link
        return (
          <div className="h-[70vh] w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex flex-col">
             <iframe 
                src={url} 
                className="w-full h-full flex-1" 
                title={title}
                onError={() => {
                    // If iframe fails (X-Frame-Options), we can't easily detect it in JS, 
                    // but we provide the "Open in New Window" button below as a backup.
                }}
             />
             <div className="p-2 bg-slate-50 dark:bg-slate-800 border-t flex justify-center">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
                >
                  If content doesn't load, click here to open in new window <ExternalLink className="w-3 h-3" />
                </a>
             </div>
          </div>
        );
    }
  };

  if (inline) {
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
        {renderContent()}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pb-24 sm:pb-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[70dvh] sm:max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Absolute Close Button for reliability */}
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-3 right-3 z-[60] p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-red-100 text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-full transition-colors shadow-sm border border-slate-100"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800 z-10 relative pr-16">
          <div>
            <h2 className="text-lg font-bold text-corporate-navy line-clamp-1">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mr-8">
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100 dark:bg-slate-700">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default UniversalResourceViewer;
