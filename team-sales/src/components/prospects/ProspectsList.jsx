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
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600 uppercase tracking-wider">
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
              className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition ${
                isSelected ? 'bg-brand-teal/5 border-l-2 border-l-brand-teal' : ''
              }`}
            >
              {/* Contact */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                  style={{ backgroundColor: ownerMember?.color || '#64748B' }}
                >
                  {prospect.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{prospect.name || 'Unnamed'}</p>
                  <p className="text-sm text-slate-500 truncate">{prospect.title || 'No title'}</p>
                </div>
              </div>

              {/* Company */}
              <div className="col-span-2 flex items-center min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{prospect.company || '—'}</span>
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
                    <span className="text-sm text-slate-700">{ownerMember.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">Unassigned</span>
                )}
              </div>

              {/* Last Activity */}
              <div className="col-span-2 flex items-center text-sm text-slate-500">
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
