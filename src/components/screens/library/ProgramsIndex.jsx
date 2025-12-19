import React from 'react';
import { Layers } from 'lucide-react';
import ContentGroupsListView from './ContentGroupsListView.jsx';
import { GROUP_TYPES } from '../../../services/contentGroupsService';

const ProgramsIndex = () => {
  return (
    <ContentGroupsListView
      groupType={GROUP_TYPES.PROGRAMS}
      title="Programs"
      subtitle="Structured learning paths to master specific leadership capabilities."
      icon={Layers}
      detailRoute="program-detail"
      color="text-indigo-600"
      bgColor="bg-indigo-100"
    />
  );
};

export default ProgramsIndex;
