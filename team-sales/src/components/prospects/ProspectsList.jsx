import React from 'react';
import { useProspectsStore } from '../../stores/prospectsStore';
import { getStageInfo, TEAM_MEMBERS } from '../../config/team';
import { formatDistanceToNow } from 'date-fns';
import {
  Building2,
  Mail,
  Phone,
  Linkedin,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';

const ProspectsList = ({ prospects }) => {
  const { setSelectedProspect, selectedProspect } = useProspectsStore();

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
        <div className="col-span-4">Contact</div>
        <div className="col-span-2">Company</div>
        <div className="col-span-2">Stage</div>
        <div className="col-span-2">Owner</div>
        <div className="col-span-2">Last Activity</div>
      </div>

      {/* Table Body */}
      <div className="overflow-y-auto h-[calc(100%-2.75rem)]">
        {prospects.map((prospect) => {
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
                  {(prospect.firstName || prospect.name)?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {prospect.firstName ? `${prospect.firstName} ${prospect.lastName || ''}`.trim() : prospect.name || 'Unnamed'}
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
