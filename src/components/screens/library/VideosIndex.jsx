import React from 'react';
import { Film } from 'lucide-react';
import ContentListView from './ContentListView.jsx';

const VideosIndex = () => {
  return (
    <ContentListView
      type="VIDEO"
      title="Videos"
      subtitle="Leadership videos and talks to inspire and educate."
      icon={Film}
      detailRoute="video-detail" // Assuming this route exists or will be handled
      color="text-corporate-orange"
      bgColor="bg-corporate-orange/10"
    />
  );
};

export default VideosIndex;
