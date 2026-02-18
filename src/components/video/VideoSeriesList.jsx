/**
 * VideoSeriesList - List component for displaying video series
 *
 * Fetches and displays all active video series, optionally filtered by category
 * Can be used in Content Library or embedded in other screens
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader2, ListVideo, Film } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getActiveSeriesByCategory, getAllSeries } from '../../services/videoSeriesService';
import VideoSeriesCard from './VideoSeriesCard';

export default function VideoSeriesList({
  category = null, // null = all categories, or 'prep' | 'foundation' | 'ascent' | 'general'
  variant = 'grid', // 'grid' | 'list' | 'featured'
  cardVariant = 'default', // passed to VideoSeriesCard
  showProgress = true,
  maxItems = null, // limit number of items shown
  title = null, // optional section title
  emptyMessage = 'No video series available',
  onSeriesSelect = null, // callback when a series is selected
}) {
  const { db } = useAppServices();
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const loadSeries = async () => {
      try {
        setLoading(true);
        setError(null);

        let data;
        if (category) {
          data = await getActiveSeriesByCategory(db, category);
        } else {
          data = await getAllSeries(db);
          // Filter to only active series for non-admin views
          data = data.filter((s) => s.isActive);
        }

        // Sort by order field
        data.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Limit if maxItems specified
        if (maxItems && data.length > maxItems) {
          data = data.slice(0, maxItems);
        }

        setSeriesList(data);
      } catch (err) {
        console.error('Error loading video series:', err);
        setError('Failed to load video series');
      } finally {
        setLoading(false);
      }
    };

    loadSeries();
  }, [db, category, maxItems]);

  const gridClass = useMemo(() => {
    if (variant === 'featured') {
      return 'space-y-4';
    }
    if (variant === 'list') {
      return 'space-y-2';
    }
    // Grid variant
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
  }, [variant]);

  const resolvedCardVariant = useMemo(() => {
    if (cardVariant) return cardVariant;
    if (variant === 'featured') return 'featured';
    if (variant === 'list') return 'compact';
    return 'default';
  }, [variant, cardVariant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-corporate-teal animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Film className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (seriesList.length === 0) {
    return (
      <div className="text-center py-12">
        <ListVideo className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <ListVideo className="w-5 h-5 text-corporate-teal" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {title}
          </h2>
        </div>
      )}

      <div className={gridClass}>
        {seriesList.map((series) => (
          <VideoSeriesCard
            key={series.id}
            series={series}
            variant={resolvedCardVariant}
            showProgress={showProgress}
            onOpen={onSeriesSelect}
          />
        ))}
      </div>
    </div>
  );
}
