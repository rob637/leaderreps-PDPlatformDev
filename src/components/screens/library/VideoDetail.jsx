import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, Film } from 'lucide-react';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const VideoDetail = (props) => {
  const { db, navigate } = useAppServices();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const videoId = props.id || props.navParams?.id;
  const fromProgram = props.fromProgram || props.navParams?.fromProgram;

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      try {
        const docRef = doc(db, UNIFIED_COLLECTION, videoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVideo({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [db, videoId]);

  if (loading) return <div className="p-12 flex justify-center"><Loader className="animate-spin" /></div>;
  if (!video) return <div className="p-12 text-center">Video not found.</div>;

  // Extract URL from details for UniversalResourceViewer
  const videoWithUrl = {
    ...video,
    url: video.details?.externalUrl || video.url || video.metadata?.url
  };

  const breadcrumbs = [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    ...(fromProgram ? [{ label: fromProgram.title, path: 'program-detail', params: { id: fromProgram.id } }] : [{ label: 'Videos', path: 'videos-index' }]),
    { label: video.title, path: null }
  ];

  return (
    <PageLayout 
      title={video.title} 
      subtitle="Video Library"
      breadcrumbs={breadcrumbs}
      backTo={fromProgram ? 'program-detail' : 'videos-index'}
      backParams={fromProgram ? { id: fromProgram.id } : undefined}
      navigate={navigate}
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <UniversalResourceViewer resource={videoWithUrl} inline={true} />
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">{video.title}</h2>
              <p className="text-slate-600">{video.description}</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default VideoDetail;
