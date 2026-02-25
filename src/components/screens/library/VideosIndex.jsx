import React, { useState, useEffect } from 'react';
import { Film, ListVideo, Loader2 } from 'lucide-react';
import ContentListView from './ContentListView.jsx';
import { useAppServices } from '../../../services/useAppServices';
import { getAllSeries } from '../../../services/videoSeriesService';
import { VideoSeriesCard, VideoSeriesPlayer } from '../../video';

const VideosIndex = () => {
  const { db } = useAppServices();
  const [seriesList, setSeriesList] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);

  // Fetch active video series
  useEffect(() => {
    if (!db) {
      setLoadingSeries(false);
      return;
    }

    const loadSeries = async () => {
      try {
        setLoadingSeries(true);
        const data = await getAllSeries(db);
        const activeSeries = data
          .filter((s) => s.isActive)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setSeriesList(activeSeries);
      } catch (err) {
        console.error('Error loading video series:', err);
      } finally {
        setLoadingSeries(false);
      }
    };

    loadSeries();
  }, [db]);

  const handleSeriesSelect = (series) => {
    setSelectedSeries(series);
  };

  const handleClosePlayer = () => {
    setSelectedSeries(null);
  };

  const handleSeriesComplete = (seriesId) => {
    console.log('[VideosIndex] Series completed:', seriesId);
  };

  // Custom header content to show video series above the standard video list
  const headerContent = seriesList.length > 0 ? (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <ListVideo className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Video Series</h2>
      </div>
      {loadingSeries ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-corporate-teal animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seriesList.map((series) => (
            <VideoSeriesCard
              key={series.id}
              series={series}
              variant="compact"
              showProgress={true}
              onOpen={handleSeriesSelect}
            />
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <ContentListView
        type="VIDEO"
        title="Videos"
        subtitle="Leadership videos, talks, and curated playlists."
        icon={Film}
        detailRoute="video-detail"
        indexRoute="videos-index"
        color="text-corporate-orange"
        bgColor="bg-corporate-orange/10"
        headerContent={headerContent}
      />

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
    </>
  );
};

export default VideosIndex;
