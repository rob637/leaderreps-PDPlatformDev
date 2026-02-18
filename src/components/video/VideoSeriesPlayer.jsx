/**
 * VideoSeriesPlayer - User-facing component for watching video series
 *
 * Features:
 * - Embedded YouTube player
 * - Video list sidebar with progress indicators
 * - Auto-play next video option
 * - Progress tracking (marks videos as watched)
 * - Responsive layout (sidebar collapses on mobile)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  List,
  X,
  SkipForward,
  PlayCircle,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  getSeriesById,
  getSeriesProgress,
  markVideoWatched,
  getEmbedUrl,
} from '../../services/videoSeriesService';

export default function VideoSeriesPlayer({
  seriesId,
  series: initialSeries = null,
  onClose,
  onComplete,
  initialVideoIndex = 0,
  showHeader = true,
  autoPlay = false,
}) {
  const { db, user } = useAppServices();

  const [series, setSeries] = useState(initialSeries);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [loading, setLoading] = useState(!initialSeries);
  const [autoPlayNext, setAutoPlayNext] = useState(autoPlay);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

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
        setWatchedVideos(new Set(progress?.watchedVideoIds || []));
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    loadProgress();
  }, [series?.id, user?.uid, db]);

  const currentVideo = useMemo(() => {
    if (!series?.videos?.length) return null;
    return series.videos[currentVideoIndex] || series.videos[0];
  }, [series?.videos, currentVideoIndex]);

  // Get video URL (support both 'url' and 'videoUrl' field names)
  const videoUrl = useMemo(() => {
    return currentVideo?.videoUrl || currentVideo?.url || null;
  }, [currentVideo]);

  // Determine if this is a direct video file (mp4, webm) vs embedded (YouTube, Vimeo)
  const isDirectVideo = useMemo(() => {
    if (!videoUrl) return false;
    const lowerUrl = videoUrl.toLowerCase();
    return (
      lowerUrl.endsWith('.mp4') ||
      lowerUrl.endsWith('.webm') ||
      lowerUrl.endsWith('.ogg') ||
      lowerUrl.includes('firebasestorage.googleapis.com') ||
      lowerUrl.includes('storage.googleapis.com')
    );
  }, [videoUrl]);

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

  const markCurrentWatched = useCallback(async () => {
    if (!currentVideo?.id || !user?.uid || !db) return;
    if (watchedVideos.has(currentVideo.id)) return;

    try {
      setMarkingComplete(true);
      await markVideoWatched(db, user.uid, series.id, currentVideo.id);
      setWatchedVideos((prev) => new Set([...prev, currentVideo.id]));

      // Check if series is now complete
      const newWatched = watchedVideos.size + 1;
      if (newWatched === series.videos.length && onComplete) {
        onComplete(series.id);
      }
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
    series?.id,
    series?.videos?.length,
    onComplete,
  ]);

  const goToVideo = useCallback(
    (index) => {
      if (index >= 0 && index < (series?.videos?.length || 0)) {
        setCurrentVideoIndex(index);
        setIsPlaying(true);
      }
    },
    [series?.videos?.length]
  );

  const goToNext = useCallback(() => {
    if (currentVideoIndex < (series?.videos?.length || 0) - 1) {
      goToVideo(currentVideoIndex + 1);
    }
  }, [currentVideoIndex, series?.videos?.length, goToVideo]);

  const goToPrevious = useCallback(() => {
    if (currentVideoIndex > 0) {
      goToVideo(currentVideoIndex - 1);
    }
  }, [currentVideoIndex, goToVideo]);

  // Format duration for display
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors lg:hidden"
              aria-label={showSidebar ? 'Hide video list' : 'Show video list'}
            >
              <List className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white truncate max-w-xs">
                {series.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
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
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close player"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Video Sidebar */}
        <div
          className={`${
            showSidebar ? 'w-72' : 'w-0'
          } flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden transition-all duration-300 lg:w-72`}
        >
          <div className="h-full overflow-y-auto p-2">
            {/* Progress bar */}
            <div className="px-2 py-3 mb-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-corporate-teal transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            {/* Video list */}
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
                    {/* Status icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isWatched ? (
                        <CheckCircle2 className="w-5 h-5 text-corporate-teal" />
                      ) : isCurrent ? (
                        <PlayCircle className="w-5 h-5 text-corporate-teal" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isCurrent
                            ? 'text-corporate-teal'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {index + 1}. {video.title}
                      </p>
                      {video.duration && (
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video player */}
          <div className="relative flex-1 bg-black">
            {isDirectVideo && videoUrl ? (
              /* Native video player for uploaded videos */
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                autoPlay={autoPlayNext && isPlaying}
                className="absolute inset-0 w-full h-full"
                onEnded={() => {
                  markCurrentWatched();
                  if (autoPlayNext) {
                    goToNext();
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : embedUrl ? (
              /* Iframe for YouTube/Vimeo */
              <iframe
                src={embedUrl}
                title={currentVideo?.title}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white">No video selected</p>
              </div>
            )}
          </div>

          {/* Video controls */}
          <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-4">
              {/* Video info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 dark:text-white truncate">
                  {currentVideo?.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Video {currentVideoIndex + 1} of {series.videos.length}
                  {currentVideo?.duration && ` • ${formatDuration(currentVideo.duration)}`}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Mark as watched */}
                {!watchedVideos.has(currentVideo?.id) && (
                  <button
                    onClick={markCurrentWatched}
                    disabled={markingComplete}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-corporate-teal hover:bg-corporate-teal/90 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {markingComplete ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Mark Complete</span>
                  </button>
                )}

                {watchedVideos.has(currentVideo?.id) && (
                  <span className="flex items-center gap-1 text-sm text-corporate-teal font-medium px-3 py-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Completed</span>
                  </span>
                )}

                {/* Previous / Next */}
                <div className="flex items-center gap-1 border-l border-slate-300 dark:border-slate-600 pl-2 ml-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentVideoIndex === 0}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={currentVideoIndex === series.videos.length - 1}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next video"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Auto-play toggle */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
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
        </div>
      </div>

      {/* Series completion banner */}
      {isSeriesComplete && (
        <div className="px-4 py-3 bg-gradient-to-r from-corporate-teal to-emerald-500 text-white">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">
              Congratulations! You&apos;ve completed this video series!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
