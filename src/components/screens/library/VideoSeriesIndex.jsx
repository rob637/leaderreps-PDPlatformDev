// src/components/screens/library/VideoSeriesIndex.jsx
// Screen that displays all active video series

import React, { useState, useEffect, useMemo } from 'react';
import { ListVideo, Loader2 } from 'lucide-react';
import { useAppServices } from '../../../services/useAppServices';
import { getAllSeries } from '../../../services/videoSeriesService';
import { VideoSeriesCard, VideoSeriesPlayer } from '../../video';
import { PageLayout } from '../../ui/PageLayout';

const VideoSeriesIndex = () => {
  const { db } = useAppServices();
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Fetch all active video series
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const loadSeries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllSeries(db);
        // Filter to only active series and sort by order
        const activeSeries = data
          .filter((s) => s.isActive)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setSeriesList(activeSeries);
      } catch (err) {
        console.error('Error loading video series:', err);
        setError('Failed to load video series');
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [db]);

  // Group series by category
  const seriesByCategory = useMemo(() => {
    const categories = {
      prep: { title: 'Foundation Prep', items: [] },
      foundation: { title: 'Foundation (Weeks 1-8)', items: [] },
      ascent: { title: 'Ascent', items: [] },
      general: { title: 'General', items: [] },
    };

    seriesList.forEach((series) => {
      const cat = series.category || 'general';
      if (categories[cat]) {
        categories[cat].items.push(series);
      } else {
        categories.general.items.push(series);
      }
    });

    // Return only categories that have items
    return Object.entries(categories)
      .filter(([, { items }]) => items.length > 0)
      .map(([key, { title, items }]) => ({ key, title, items }));
  }, [seriesList]);

  const handleSeriesSelect = (series) => {
    setSelectedSeries(series);
  };

  const handleClosePlayer = () => {
    setSelectedSeries(null);
  };

  const handleSeriesComplete = (seriesId) => {
    console.log('[VideoSeriesIndex] Series completed:', seriesId);
  };

  return (
    <PageLayout
      title="Video Series"
      subtitle="Curated playlists of videos to watch in sequence"
      icon={ListVideo}
      accentColor="teal"
      backTo="library"
      backLabel="Back to Library"
    >
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-corporate-teal animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-20">
          <ListVideo className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && seriesList.length === 0 && (
        <div className="text-center py-20">
          <ListVideo className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Video Series Available
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Check back soon for curated video playlists.
          </p>
        </div>
      )}

      {/* Series list by category */}
      {!loading && !error && seriesList.length > 0 && (
        <div className="space-y-8">
          {seriesByCategory.map((category) => (
            <section key={category.key}>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                {category.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((series) => (
                  <VideoSeriesCard
                    key={series.id}
                    series={series}
                    variant="default"
                    showProgress={true}
                    onOpen={handleSeriesSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Player Modal */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl h-[85vh]">
            <VideoSeriesPlayer
              series={selectedSeries}
              onClose={handleClosePlayer}
              onComplete={handleSeriesComplete}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default VideoSeriesIndex;
