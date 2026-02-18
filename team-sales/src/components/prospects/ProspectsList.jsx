import React, { useState, useMemo } from 'react';
import { useProspectsStore } from '../../stores/prospectsStore';
import { getStageInfo, TEAM_MEMBERS, PIPELINE_STAGES } from '../../config/team';
import { formatDistanceToNow } from 'date-fns';
import {
  Building2,
  Mail,
  Phone,
  Linkedin,
  MoreHorizontal,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';

const ProspectsList = ({ prospects }) => {
  const { setSelectedProspect, selectedProspect } = useProspectsStore();
  const [sortBy, setSortBy] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Sort prospects
  const sortedProspects = useMemo(() => {
    return [...prospects].sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'lastName':
          aVal = (a.lastName || a.name?.split(' ').pop() || '').toLowerCase();
          bVal = (b.lastName || b.name?.split(' ').pop() || '').toLowerCase();
          break;
        case 'company':
          aVal = (a.company || '').toLowerCase();
          bVal = (b.company || '').toLowerCase();
          break;
        case 'stage':
          // Sort by stage order in pipeline
          const stageOrder = PIPELINE_STAGES.reduce((acc, s, i) => ({ ...acc, [s.id]: i }), {});
          aVal = stageOrder[a.stage] ?? 999;
          bVal = stageOrder[b.stage] ?? 999;
          break;
        case 'lastActivity':
          aVal = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          bVal = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [prospects, sortBy, sortDirection]);

  // Sort indicator component
  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <ChevronsUpDown className="w-3 h-3 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-brand-teal" />
      : <ChevronDown className="w-3 h-3 text-brand-teal" />;
  };

  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p className="text-lg font-medium mb-1">No prospects found</p>
        <p className="text-sm">Try adjusting your filters or add a new prospect</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        <button 
          onClick={() => handleSort('lastName')}
          className="col-span-4 flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition text-left"
        >
          Contact <SortIcon column="lastName" />
        </button>
        <button 
          onClick={() => handleSort('company')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition text-left"
        >
          Company <SortIcon column="company" />
        </button>
        <button 
          onClick={() => handleSort('stage')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition text-left"
        >
          Stage <SortIcon column="stage" />
        </button>
        <div className="col-span-2">Owner</div>
        <button 
          onClick={() => handleSort('lastActivity')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition text-left"
        >
          Last Activity <SortIcon column="lastActivity" />
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-y-auto h-[calc(100%-2.75rem)]">
        {sortedProspects.map((prospect) => {
          const stageInfo = getStageInfo(prospect.stage);
          const ownerEmail = prospect.owner || prospect.ownerEmail;
          const ownerMember = TEAM_MEMBERS.find(m => m.email.toLowerCase() === ownerEmail?.toLowerCase());
          const isSelected = selectedProspect?.id === prospect.id;
          
          return (
            <div
              key={prospect.id}
              onClick={() => setSelectedProspect(prospect)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                isSelected ? 'bg-brand-teal/5 dark:bg-brand-teal/10 border-l-2 border-l-brand-teal' : ''
              }`}
            >
              {/* Contact */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                  style={{ backgroundColor: ownerMember?.color || '#64748B' }}
                >
                  {(prospect.lastName || prospect.firstName || prospect.name)?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {prospect.lastName 
                      ? `${prospect.lastName}, ${prospect.firstName || ''}`.trim().replace(/,$/, '')
                      : prospect.name 
                        ? prospect.name.includes(' ') 
                          ? `${prospect.name.split(' ').slice(-1)[0]}, ${prospect.name.split(' ').slice(0, -1).join(' ')}`
                          : prospect.name
                        : 'Unnamed'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{prospect.title || 'No title'}</p>
                </div>
                {/* Quick Actions: LinkedIn */}
                {prospect.linkedin && (
                  <a
                    href={prospect.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg hover:bg-[#0077b5]/10 text-[#0077b5] transition flex-shrink-0"
                    title="View LinkedIn Profile"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Company */}
              <div className="col-span-2 flex items-center min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{prospect.company || '—'}</span>
                </div>
              </div>

              {/* Stage */}
              <div className="col-span-2 flex items-center">
                <span 
                  className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: stageInfo.color }}
                >
                  {stageInfo.label}
                </span>
              </div>

              {/* Owner */}
              <div className="col-span-2 flex items-center">
                {ownerMember ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: ownerMember.color }}
                    >
                      {ownerMember.initials}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{ownerMember.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">Unassigned</span>
                )}
              </div>

              {/* Last Activity */}
              <div className="col-span-2 flex items-center text-sm text-slate-500 dark:text-slate-400">
                {prospect.updatedAt ? (
                  formatDistanceToNow(new Date(prospect.updatedAt), { addSuffix: true })
                ) : prospect.createdAt ? (
                  formatDistanceToNow(new Date(prospect.createdAt), { addSuffix: true })
                ) : (
                  '—'
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProspectsList;
