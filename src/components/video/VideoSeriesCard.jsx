/**
 * VideoSeriesCard - Card component for displaying video series in content areas
 *
 * Shows thumbnail, title, description, video count, and progress indicator
 * Clicking opens the VideoSeriesPlayer in a modal or full-screen view
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Play,
  PlayCircle,
  Clock,
  CheckCircle2,
  ListVideo,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  getSeriesProgress,
  formatDuration,
} from '../../services/videoSeriesService';
import VideoSeriesPlayer from './VideoSeriesPlayer';

// Default thumbnail fallback - LeaderReps logo
const DEFAULT_THUMBNAIL = '/leaderreps-logo.png';

export default function VideoSeriesCard({
  series,
  onOpen,
  variant = 'default', // 'default' | 'compact' | 'featured'
  showProgress = true,
}) {
  const { db, user } = useAppServices();
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(showProgress);
  const [showPlayer, setShowPlayer] = useState(false);

  // Load user's progress for this series
  useEffect(() => {
    if (!showProgress || !series?.id || !user?.uid || !db) {
      setLoadingProgress(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const data = await getSeriesProgress(db, user.uid, series.id);
        setProgress(data);
      } catch (error) {
        console.error('Error loading series progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [series?.id, user?.uid, db, showProgress]);

  const progressInfo = useMemo(() => {
    if (!series?.videos?.length) return { watched: 0, total: 0, percent: 0 };
    const total = series.videos.length;
    const watched = progress?.watchedVideoIds?.length || 0;
    return {
      watched,
      total,
      percent: Math.round((watched / total) * 100),
    };
  }, [series?.videos?.length, progress?.watchedVideoIds?.length]);

  const totalDuration = useMemo(() => {
    if (!series?.videos?.length) return 0;
    return series.videos.reduce((sum, v) => sum + (v.duration || 0), 0);
  }, [series?.videos]);

  const handleClick = () => {
    if (onOpen) {
      onOpen(series);
    } else {
      setShowPlayer(true);
    }
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const handleSeriesComplete = (seriesId) => {
    console.log('[VideoSeriesCard] Series completed:', seriesId);
    // Refresh progress - prepStatus.videoSeries is set by VideoSeriesPlayer
    if (db && user?.uid && series?.id) {
      getSeriesProgress(db, user.uid, series.id).then((data) => {
        setProgress(data);
      });
    }
  };

  // Find the next video to watch
  const nextVideoIndex = useMemo(() => {
    if (!series?.videos?.length || !progress?.watchedVideoIds?.length) return 0;
    const watchedSet = new Set(progress.watchedVideoIds);
    const nextIdx = series.videos.findIndex((v) => !watchedSet.has(v.id));
    return nextIdx >= 0 ? nextIdx : 0;
  }, [series?.videos, progress?.watchedVideoIds]);

  // Thumbnail - use series thumbnail, first video thumbnail, or default logo
  const thumbnail =
    series?.thumbnail ||
    (series?.videos?.length > 0 && series.videos[0].thumbnail) ||
    DEFAULT_THUMBNAIL;

  if (!series) return null;

  // Featured variant - larger card with more detail
  if (variant === 'featured') {
    return (
      <>
        <button
          onClick={handleClick}
          className="group w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all text-left"
        >
          <div className="flex flex-col md:flex-row">
            {/* Thumbnail */}
            <div className="relative md:w-80 h-48 md:h-auto bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
              <img
                  src={thumbnail}
                  alt={series.title}
                  className="w-full h-full object-contain bg-slate-800 p-4 group-hover:scale-105 transition-transform duration-300"
                />
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-8 h-8 text-corporate-teal" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white group-hover:text-corporate-teal transition-colors">
                  {series.title}
                </h3>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-corporate-teal group-hover:translate-x-1 transition-all" />
              </div>

              {series.description && (
                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {series.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <ListVideo className="w-4 h-4" />
                  {series.videos?.length || 0} videos
                </span>
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {showProgress && (
                <div className="mt-auto">
                  {loadingProgress ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading progress...
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">
                          {progressInfo.percent === 100 ? (
                            <span className="flex items-center gap-1 text-corporate-teal font-medium">
                              <CheckCircle2 className="w-4 h-4" />
                              Complete
                            </span>
                          ) : (
                            `${progressInfo.watched} of ${progressInfo.total} watched`
                          )}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {progressInfo.percent}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-corporate-teal transition-all duration-500"
                          style={{ width: `${progressInfo.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Player modal */}
        {showPlayer && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl h-[85vh]">
              <VideoSeriesPlayer
                series={series}
                onClose={handleClosePlayer}
                onComplete={handleSeriesComplete}
                initialVideoIndex={nextVideoIndex}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Compact variant - smaller card for lists
  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={handleClick}
          className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left w-full"
        >
          {/* Thumbnail */}
          <div className="relative w-20 h-12 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden flex-shrink-0">
              <img
                src={thumbnail}
                alt={series.title}
                className="w-full h-full object-contain bg-slate-800 p-1"
              />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-800 dark:text-white truncate group-hover:text-corporate-teal transition-colors">
              {series.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{series.videos?.length || 0} videos</span>
              {showProgress && !loadingProgress && (
                <span className="flex items-center gap-1">
                  {progressInfo.percent === 100 ? (
                    <CheckCircle2 className="w-3 h-3 text-corporate-teal" />
                  ) : (
                    `${progressInfo.percent}%`
                  )}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-corporate-teal" />
        </button>

        {/* Player modal */}
        {showPlayer && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl h-[85vh]">
              <VideoSeriesPlayer
                series={series}
                onClose={handleClosePlayer}
                onComplete={handleSeriesComplete}
                initialVideoIndex={nextVideoIndex}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Default variant
  return (
    <>
      <button
        onClick={handleClick}
        className="group w-full bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all text-left"
      >
        {/* Thumbnail */}
        <div className="relative h-40 bg-slate-800 overflow-hidden">
          <img
              src={thumbnail}
              alt={series.title}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-6 h-6 text-corporate-teal" />
            </div>
          </div>

          {/* Video count badge */}
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
            <ListVideo className="w-3 h-3" />
            {series.videos?.length || 0} videos
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-corporate-teal transition-colors truncate">
            {series.title}
          </h3>

          {series.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
              {series.description}
            </p>
          )}

          {/* Duration */}
          {totalDuration > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
              <Clock className="w-3 h-3" />
              {formatDuration(totalDuration)} total
            </div>
          )}

          {/* Progress bar */}
          {showProgress && (
            <div>
              {loadingProgress ? (
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">
                      {progressInfo.watched}/{progressInfo.total}
                    </span>
                    {progressInfo.percent === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-corporate-teal" />
                    )}
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-corporate-teal transition-all duration-500"
                      style={{ width: `${progressInfo.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Player modal */}
      {showPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[85vh]">
            <VideoSeriesPlayer
              series={series}
              onClose={handleClosePlayer}
              onComplete={handleSeriesComplete}
              initialVideoIndex={nextVideoIndex}
            />
          </div>
        </div>
      )}
    </>
  );
}
