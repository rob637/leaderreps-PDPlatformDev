import React from 'react';
import { Dumbbell } from 'lucide-react';
import ContentListView from './ContentListView.jsx';

const WorkoutsIndex = () => {
  return (
    <ContentListView
      type="WORKOUT"
      title="Workouts"
      subtitle="Practical training sessions to build skills through practice."
      icon={Dumbbell}
      detailRoute="workout-detail"
      color="text-corporate-teal"
      bgColor="bg-corporate-teal/10"
    />
  );
};

export default WorkoutsIndex;
