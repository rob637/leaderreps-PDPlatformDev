import React from 'react';
import { Dumbbell } from 'lucide-react';
import ContentGroupsListView from './ContentGroupsListView.jsx';
import { GROUP_TYPES } from '../../../services/contentGroupsService';

const WorkoutsIndex = () => {
  return (
    <ContentGroupsListView
      groupType={GROUP_TYPES.WORKOUTS}
      title="Workouts"
      subtitle="Practical training sessions to build skills through practice."
      icon={Dumbbell}
      detailRoute="workout-detail"
      color="text-orange-600"
      bgColor="bg-orange-100 dark:bg-orange-900/30"
    />
  );
};

export default WorkoutsIndex;
