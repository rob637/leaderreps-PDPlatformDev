/**
 * VideoSeriesPlayer - User-facing component for watching video series
 *
 * Features:
 * - Embedded YouTube player
 * - Video list sidebar with progress indicators
 * - Auto-play next video option
 * - Progress tracking (marks videos as watched)
 * - Mobile-first responsive layout
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  List,
  X,
  SkipForward,
  PlayCircle,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import {
  getSeriesById,
  getSeriesProgress,
  markVideoWatched,
  getEmbedUrl,
} from '../../services/videoSeriesService';

/**
 * Clean up a video title that may be a raw filename.
 * Strips file extension, replaces underscores/hyphens with spaces,
 * removes resolution tags like "(540p)", leading numbers, and capitalizes words.
 */
function formatVideoTitle(title) {
  if (!title) return '';
  // If it doesn't look like a filename, return as-is
  if (!/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(title)) return title;
  let cleaned = title
    .replace(/\.(mp4|webm|ogg|mov|avi|mkv)$/i, '') // strip extension
    .replace(/\s*\(\d+p\)\s*/g, '')                 // remove (540p) etc.
    .replace(/_v\d+$/i, '')                          // remove version suffixes like _v2
    .replace(/^\d+[._\s]+/, '')                      // remove leading number prefix (1_, 2., etc.)
    .replace(/[_-]+/g, ' ')                          // underscores/hyphens to spaces
    .trim();
  // Title-case each word
  cleaned = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  return cleaned || title;
}

/**
 * Get the display title for a video.
 * Uses the description field if it exists (admin-entered friendly name),
 * otherwise falls back to formatting the title/filename.
 */
function getVideoDisplayTitle(video) {
  if (!video) return '';
  // If description exists and is not empty, use it as the display title
  // The admin enters friendly names like "1. Preparation Introduction" in the description field
  if (video.description && video.description.trim()) {
    // Strip any leading number prefix if present (e.g., "1. " or "1 ") since we add it ourselves
    return video.description.trim().replace(/^\d+[.\s]+/, '');
  }
  // Otherwise, format the title (which is usually the filename)
  return formatVideoTitle(video.title);
}

export default function VideoSeriesPlayer({
  seriesId,
  series: initialSeries = null,
  onClose,
  onComplete,
  initialVideoIndex = 0,
  showHeader = true,
  autoPlay = true,
}) {
  const { db, user } = useAppServices();

  const [series, setSeries] = useState(initialSeries);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [loading, setLoading] = useState(!initialSeries);
  const [autoPlayNext, setAutoPlayNext] = useState(autoPlay ?? true);
  const [showVideoList, setShowVideoList] = useState(false); // Collapsed by default on mobile
  const [isPlaying, setIsPlaying] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const videoRef = useRef(null);
  // Ref to track current index - avoids stale closure issues in event handlers
  const currentVideoIndexRef = useRef(initialVideoIndex);
  const iframeRef = useRef(null);
  const shouldAutoPlayRef = useRef(false); // Track if we should autoplay on next render

  // Load series data if not provided
  useEffect(() => {
    if (initialSeries) {
      setSeries(initialSeries);
      return;
    }

    if (!seriesId || !db) return;

    const loadSeries = async () => {
      try {
        setLoading(true);
        const data = await getSeriesById(db, seriesId);
        setSeries(data);
      } catch (error) {
        console.error('Error loading video series:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [seriesId, initialSeries, db]);

  // Load user's progress for this series
  useEffect(() => {
    if (!series?.id || !user?.uid || !db) return;

    const loadProgress = async () => {
      try {
        const progress = await getSeriesProgress(db, user.uid, series.id);
        // Service stores watched videos in 'videosWatched' array
        setWatchedVideos(new Set(progress?.videosWatched || []));
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    loadProgress();
  }, [series?.id, user?.uid, db]);

  const currentVideo = useMemo(() => {
    if (!series?.videos?.length) return null;
    const video = series.videos[currentVideoIndex] || series.videos[0];
    console.log('[VideoSeriesPlayer] currentVideo memo - index:', currentVideoIndex, 'video:', video?.id, 'url:', video?.videoUrl || video?.url);
    return video;
  }, [series?.videos, currentVideoIndex]);

  // Get video URL (support both 'url' and 'videoUrl' field names)
  // IMPORTANT: Use currentVideoIndex directly to ensure we get the right URL
  const videoUrl = useMemo(() => {
    if (!series?.videos?.length) return null;
    const video = series.videos[currentVideoIndex];
    const url = video?.videoUrl || video?.url || null;
    console.log('[VideoSeriesPlayer] videoUrl memo - index:', currentVideoIndex, 'url:', url);
    return url;
  }, [series?.videos, currentVideoIndex]);

  // Determine if this is a direct video file (mp4, webm) vs embedded (YouTube, Vimeo)
  const isDirectVideo = useMemo(() => {
    if (!videoUrl) return false;
    const lowerUrl = videoUrl.toLowerCase();
    // Check for video file extensions (may have query params after them)
    const hasVideoExtension = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(videoUrl);
    return (
      hasVideoExtension ||
      lowerUrl.includes('firebasestorage.googleapis.com') ||
      lowerUrl.includes('firebasestorage.app') ||
      lowerUrl.includes('storage.googleapis.com')
    );
  }, [videoUrl]);

  // Debug logging for video player type detection
  useEffect(() => {
    if (videoUrl) {
      console.log('[VideoSeriesPlayer] Video URL:', videoUrl);
      console.log('[VideoSeriesPlayer] isDirectVideo:', isDirectVideo);
      console.log('[VideoSeriesPlayer] Using:', isDirectVideo ? 'NATIVE video player' : 'EMBED iframe');
    }
  }, [videoUrl, isDirectVideo]);

  const embedUrl = useMemo(() => {
    if (!videoUrl || isDirectVideo) return null;
    // Add autoplay parameter if autoplay is enabled
    const baseUrl = getEmbedUrl(videoUrl);
    if (autoPlayNext && isPlaying) {
      return `${baseUrl}&autoplay=1`;
    }
    return baseUrl;
  }, [videoUrl, isDirectVideo, autoPlayNext, isPlaying]);

  const progress = useMemo(() => {
    if (!series?.videos?.length) return { watched: 0, total: 0, percent: 0 };
    const total = series.videos.length;
    const watched = watchedVideos.size;
    return {
      watched,
      total,
      percent: Math.round((watched / total) * 100),
    };
  }, [series?.videos?.length, watchedVideos]);

  const isSeriesComplete = useMemo(() => {
    return progress.watched === progress.total && progress.total > 0;
  }, [progress]);

  // Track if we've already called onComplete to prevent duplicate calls
  const [hasCalledComplete, setHasCalledComplete] = useState(false);

  // Call onComplete when series becomes complete
  useEffect(() => {
    if (isSeriesComplete && !hasCalledComplete && series?.id) {
      setHasCalledComplete(true);
      
      // Determine which prepStatus flag to set based on series title/id
      // "Watch Onboarding Videos" → prepStatus.videoSeries
      // "Watch Session 1 Video" → prepStatus.session1Video
      if (db && user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        const seriesTitle = (series?.title || series?.id || '').toLowerCase();
        
        // Determine the correct prepStatus field
        let prepStatusField = 'prepStatus.videoSeries'; // default
        if (seriesTitle.includes('session') && seriesTitle.includes('1')) {
          prepStatusField = 'prepStatus.session1Video';
        }
        
        updateDoc(userRef, { [prepStatusField]: true })
          .then(() => console.log(`[VideoSeriesPlayer] Set ${prepStatusField} = true`))
          .catch(err => console.warn('[VideoSeriesPlayer] Could not update prepStatus:', err));
      }
      
      // Notify parent component
      if (onComplete) {
        onComplete(series.id);
      }
    }
  }, [isSeriesComplete, hasCalledComplete, onComplete, series?.id, series?.title, db, user?.uid]);

  const markCurrentWatched = useCallback(async () => {
    console.log('[VideoSeriesPlayer] markCurrentWatched called', { 
      videoId: currentVideo?.id, 
      userId: user?.uid,
      seriesId: series?.id 
    });
    
    if (!currentVideo?.id || !user?.uid || !db) {
      console.log('[VideoSeriesPlayer] Missing required data:', { 
        hasVideoId: !!currentVideo?.id, 
        hasUserId: !!user?.uid, 
        hasDb: !!db 
      });
      return;
    }
    if (watchedVideos.has(currentVideo.id)) {
      console.log('[VideoSeriesPlayer] Video already watched');
      return;
    }

    try {
      setMarkingComplete(true);
      console.log('[VideoSeriesPlayer] Calling markVideoWatched...');
      await markVideoWatched(db, user.uid, series.id, currentVideo.id, series);
      console.log('[VideoSeriesPlayer] markVideoWatched succeeded');
      setWatchedVideos((prev) => new Set([...prev, currentVideo.id]));
      // Series completion is now handled by useEffect watching isSeriesComplete
    } catch (error) {
      console.error('Error marking video watched:', error);
    } finally {
      setMarkingComplete(false);
    }
  }, [
    currentVideo?.id,
    user?.uid,
    db,
    watchedVideos,
    series,
  ]);

  const goToVideo = useCallback(
    (index) => {
      if (index >= 0 && index < (series?.videos?.length || 0)) {
        console.log('[VideoSeriesPlayer] goToVideo called with index:', index, 'current:', currentVideoIndexRef.current);
        shouldAutoPlayRef.current = true; // Flag to autoplay on next render
        currentVideoIndexRef.current = index; // Update ref immediately
        setCurrentVideoIndex(index);
        setIsPlaying(true);
      }
    },
    [series?.videos?.length]
  );

  // Effect to autoplay video when changing to a new video
  useEffect(() => {
    if (shouldAutoPlayRef.current && videoRef.current && autoPlayNext) {
      shouldAutoPlayRef.current = false;
      console.log('[VideoSeriesPlayer] Autoplay effect triggered for index:', currentVideoIndex);
      // Force load new source and play
      const timer = setTimeout(() => {
        if (videoRef.current) {
          // Force reload the video source
          videoRef.current.load();
          videoRef.current.play().catch(err => {
            console.log('[VideoSeriesPlayer] Autoplay prevented by browser:', err.message);
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentVideoIndex, autoPlayNext]);

  const goToNext = useCallback(() => {
    const nextIndex = currentVideoIndexRef.current + 1;
    console.log('[VideoSeriesPlayer] goToNext called, currentRef:', currentVideoIndexRef.current, 'nextIndex:', nextIndex, 'total:', series?.videos?.length);
    if (nextIndex < (series?.videos?.length || 0)) {
      goToVideo(nextIndex);
    } else {
      console.log('[VideoSeriesPlayer] Already at last video, not advancing');
    }
  }, [series?.videos?.length, goToVideo]);

  const goToPrevious = useCallback(() => {
    if (currentVideoIndex > 0) {
      goToVideo(currentVideoIndex - 1);
    }
  }, [currentVideoIndex, goToVideo]);

  // Format duration for display
  const formatDuration = (seconds) => {
    const num = parseFloat(seconds);
    if (!num || num <= 0) return '';
    const mins = Math.floor(num / 60);
    const secs = Math.round(num % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <Loader2 className="w-8 h-8 text-corporate-teal animate-spin" />
      </div>
    );
  }

  if (!series || !series.videos?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <PlayCircle className="w-12 h-12 text-slate-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400">No videos in this series</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[100dvh] bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setShowVideoList(!showVideoList)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              aria-label={showVideoList ? 'Hide video list' : 'Show video list'}
            >
              <List className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-800 dark:text-white text-sm sm:text-base truncate">
                {series.title}
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                <span>
                  {progress.watched} of {progress.total} watched
                </span>
                <span>•</span>
                <span>{progress.percent}% complete</span>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              aria-label="Close player"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>
      )}

      {/* Main content - stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar (hidden on mobile) */}
        <div className="hidden lg:flex flex-shrink-0 w-72 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-col">
          {/* Progress bar */}
          <div className="px-3 py-3 flex-shrink-0">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-corporate-teal transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
          
          {/* Video list */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {series.videos.map((video, index) => {
                const isWatched = watchedVideos.has(video.id);
                const isCurrent = index === currentVideoIndex;

                return (
                  <button
                    key={video.id}
                    onClick={() => goToVideo(index)}
                    className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                      isCurrent
                        ? 'bg-corporate-teal/10 border border-corporate-teal/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isWatched ? (
                        <CheckCircle2 className="w-5 h-5 text-corporate-teal" />
                      ) : isCurrent ? (
                        <PlayCircle className="w-5 h-5 text-corporate-teal" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-corporate-teal' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {index + 1}. {getVideoDisplayTitle(video)}
                      </p>
                      {formatDuration(video.duration) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.duration)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main video area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Video player - responsive aspect ratio */}
          <div className="relative w-full bg-black flex-shrink-0" style={{ paddingTop: '56.25%' }}>
            <div className="absolute inset-0">
              {/* Debug: log what we're rendering */}
              {console.log('[VideoSeriesPlayer] RENDER - index:', currentVideoIndex, 'videoUrl:', videoUrl, 'videos count:', series?.videos?.length, 'videos:', series?.videos?.map(v => ({ id: v.id, url: v.videoUrl || v.url })))}
              {isDirectVideo && videoUrl ? (
                <video
                  ref={videoRef}
                  key={`video-${currentVideoIndex}-${currentVideo?.id || ''}-${videoUrl?.slice(-20) || 'no-url'}`}
                  src={videoUrl}
                  controls
                  autoPlay={autoPlayNext && isPlaying}
                  playsInline
                  className="w-full h-full object-contain"
                  onLoadStart={() => {
                    console.log('[VideoSeriesPlayer] Video loading:', videoUrl, 'index:', currentVideoIndex);
                  }}
                  onError={(e) => {
                    const video = e.target;
                    const error = video.error;
                    console.error('[VideoSeriesPlayer] Video ERROR:', {
                      code: error?.code,
                      message: error?.message,
                      videoUrl: videoUrl?.substring(0, 100),
                      networkState: video.networkState,
                      readyState: video.readyState
                    });
                  }}
                  onLoadedData={() => {
                    console.log('[VideoSeriesPlayer] Video loaded successfully, readyState:', videoRef.current?.readyState);
                  }}
                  onCanPlay={() => {
                    console.log('[VideoSeriesPlayer] Video can play');
                  }}
                  onTimeUpdate={(e) => {
                    // Auto-mark as watched when within last 5 seconds
                    const video = e.target;
                    const timeRemaining = video.duration - video.currentTime;
                    if (timeRemaining <= 5 && video.duration > 0 && !watchedVideos.has(currentVideo?.id)) {
                      markCurrentWatched();
                    }
                  }}
                  onEnded={() => {
                    console.log('[VideoSeriesPlayer] onEnded fired for video index:', currentVideoIndexRef.current, 'id:', currentVideo?.id);
                    // Mark as watched in background - don't await to avoid blocking goToNext
                    markCurrentWatched();
                    // Advance to next video immediately if autoplay is enabled
                    if (autoPlayNext) {
                      goToNext();
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : embedUrl ? (
                <iframe
                  key={`iframe-${currentVideoIndex}-${currentVideo?.id || ''}`}
                  src={embedUrl}
                  title={currentVideo?.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white">No video selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Video controls */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Video info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 dark:text-white text-sm sm:text-base truncate">
                  {getVideoDisplayTitle(currentVideo)}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Video {currentVideoIndex + 1} of {series.videos.length}
                  {currentVideo?.duration && ` • ${formatDuration(currentVideo.duration)}`}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Completion indicator */}
                {watchedVideos.has(currentVideo?.id) && (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-corporate-teal font-medium px-2 py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Completed</span>
                  </span>
                )}

                {/* Previous / Next */}
                <div className="flex items-center gap-0.5 sm:gap-1 border-l border-slate-300 dark:border-slate-600 pl-2 ml-1 sm:ml-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentVideoIndex === 0}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={currentVideoIndex === series.videos.length - 1}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next video"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-play toggle - hide on very small screens to save space */}
            <div className="hidden sm:flex items-center gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlayNext}
                  onChange={(e) => setAutoPlayNext(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-corporate-teal focus:ring-corporate-teal"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Auto-play next video
                </span>
              </label>
            </div>
          </div>

          {/* Mobile video list (collapsible) */}
          <div className="lg:hidden flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            {/* Toggle button */}
            <button
              onClick={() => setShowVideoList(!showVideoList)}
              className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  All Videos ({series.videos.length})
                </span>
                {/* Mini progress */}
                <div className="flex items-center gap-1 ml-2">
                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-corporate-teal transition-all"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{progress.percent}%</span>
                </div>
              </div>
              {showVideoList ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Video list */}
            {showVideoList && (
              <div className="flex-1 overflow-y-auto px-2 pb-2">
                <div className="space-y-1">
                  {series.videos.map((video, index) => {
                    const isWatched = watchedVideos.has(video.id);
                    const isCurrent = index === currentVideoIndex;

                    return (
                      <button
                        key={video.id}
                        onClick={() => {
                          goToVideo(index);
                          setShowVideoList(false); // Collapse after selection
                        }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          isCurrent
                            ? 'bg-corporate-teal/10 border border-corporate-teal/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {isWatched ? (
                            <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
                          ) : isCurrent ? (
                            <PlayCircle className="w-4 h-4 text-corporate-teal" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <span className={`text-sm font-medium flex-1 truncate ${
                          isCurrent ? 'text-corporate-teal' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {index + 1}. {getVideoDisplayTitle(video)}
                        </span>
                        {formatDuration(video.duration) && (
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {formatDuration(video.duration)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Series completion banner */}
      {isSeriesComplete && (
        <div className="px-4 py-2 sm:py-3 bg-gradient-to-r from-corporate-teal to-emerald-500 text-white flex-shrink-0">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium">
              Congratulations! You&apos;ve completed this series!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
