import React, { useState, useMemo } from 'react';
import { useProspectsStore } from '../../stores/prospectsStore';
import { useLinkedHelperStore } from '../../stores/linkedHelperStore';
import { useSequenceStore } from '../../stores/sequenceStore';
import { getStageInfo, TEAM_MEMBERS, PIPELINE_STAGES } from '../../config/team';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Building2,
  Mail,
  Phone,
  Linkedin,
  MoreHorizontal,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Trash2,
  UserPlus,
  PlayCircle,
  Download,
  ArrowRight,
  MoreVertical
} from 'lucide-react';

const ProspectsList = ({ prospects }) => {
  const { setSelectedProspect, selectedProspect, updateProspect, deleteProspect } = useProspectsStore();
  const { openPushModal, hasLinkedInUrl } = useLinkedHelperStore();
  const { sequences, initialize: initSequences } = useSequenceStore();
  const [sortBy, setSortBy] = useState('lastName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(null); // 'stage' | 'owner' | 'sequence' | null
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Initialize sequences for enrollment
  React.useEffect(() => {
    initSequences();
  }, [initSequences]);

  // Handle column header click for sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Toggle single selection
  const toggleSelect = (prospectId, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prospectId)) {
        newSet.delete(prospectId);
      } else {
        newSet.add(prospectId);
      }
      return newSet;
    });
  };

  // Sort prospects - define this first so it can be used by other functions
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

  // Toggle all selection
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedProspects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProspects.map(p => p.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Get selected prospects
  const selectedProspects = useMemo(() => {
    return sortedProspects?.filter(p => selectedIds.has(p.id)) || [];
  }, [selectedIds, sortedProspects]);

  // Handle push to LinkedHelper
  const handlePushToLinkedHelper = () => {
    if (selectedProspects.length > 0) {
      openPushModal(selectedProspects);
    }
  };

  // Count prospects with LinkedIn URLs
  const prospectsWithLinkedIn = selectedProspects.filter(p => hasLinkedInUrl(p)).length;

  // Bulk change stage
  const handleBulkChangeStage = async (stageId) => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedProspects.map(p => updateProspect(p.id, { stage: stageId }))
      );
      toast.success(`Updated ${selectedProspects.length} prospects to ${PIPELINE_STAGES.find(s => s.id === stageId)?.label}`);
      setSelectedIds(new Set());
      setShowBulkMenu(null);
    } catch (error) {
      toast.error('Failed to update prospects');
      console.error(error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk assign owner
  const handleBulkAssignOwner = async (ownerEmail) => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedProspects.map(p => updateProspect(p.id, { owner: ownerEmail, ownerEmail }))
      );
      const ownerName = TEAM_MEMBERS.find(m => m.email === ownerEmail)?.name || ownerEmail;
      toast.success(`Assigned ${selectedProspects.length} prospects to ${ownerName}`);
      setSelectedIds(new Set());
      setShowBulkMenu(null);
    } catch (error) {
      toast.error('Failed to assign prospects');
      console.error(error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk export to CSV
  const handleBulkExport = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Title', 'Stage', 'LinkedIn', 'Phone'];
    const rows = selectedProspects.map(p => [
      p.firstName || '',
      p.lastName || '',
      p.email || '',
      p.company || '',
      p.title || '',
      PIPELINE_STAGES.find(s => s.id === p.stage)?.label || p.stage || '',
      p.linkedin || '',
      p.phone || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospects-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedProspects.length} prospects`);
    setShowBulkMenu(null);
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedProspects.length} prospects? This cannot be undone.`)) {
      return;
    }
    
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedProspects.map(p => deleteProspect(p.id))
      );
      toast.success(`Deleted ${selectedProspects.length} prospects`);
      setSelectedIds(new Set());
      setShowBulkMenu(null);
    } catch (error) {
      toast.error('Failed to delete prospects');
      console.error(error);
    } finally {
      setBulkActionLoading(false);
    }
  };

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
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden h-full relative">
      {/* Batch Selection Action Bar */}
      {selectedIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedIds.size} selected</span>
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-white/10 rounded transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-600" />
          
          {/* Change Stage Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBulkMenu(showBulkMenu === 'stage' ? null : 'stage')}
              disabled={bulkActionLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              Change Stage
            </button>
            {showBulkMenu === 'stage' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(null)} />
                <div className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                  {PIPELINE_STAGES.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => handleBulkChangeStage(stage.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Assign Owner Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBulkMenu(showBulkMenu === 'owner' ? null : 'owner')}
              disabled={bulkActionLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Assign Owner
            </button>
            {showBulkMenu === 'owner' && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(null)} />
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                  {TEAM_MEMBERS.map(member => (
                    <button
                      key={member.email}
                      onClick={() => handleBulkAssignOwner(member.email)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </div>
                      {member.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Push to LinkedHelper */}
          <button
            onClick={handlePushToLinkedHelper}
            disabled={prospectsWithLinkedIn === 0 || bulkActionLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0077b5] hover:bg-[#005885] rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={prospectsWithLinkedIn === 0 ? 'No prospects have LinkedIn URLs' : `Push ${prospectsWithLinkedIn} to LinkedHelper`}
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
            {prospectsWithLinkedIn > 0 && prospectsWithLinkedIn !== selectedIds.size && (
              <span className="text-xs opacity-75">({prospectsWithLinkedIn})</span>
            )}
          </button>
          
          {/* Export */}
          <button
            onClick={handleBulkExport}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        {/* Checkbox */}
        <div className="col-span-1 flex items-center justify-center">
          <button
            onClick={toggleSelectAll}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
            title={selectedIds.size === sortedProspects.length ? 'Deselect all' : 'Select all'}
          >
            {selectedIds.size === 0 ? (
              <Square className="w-4 h-4" />
            ) : selectedIds.size === sortedProspects.length ? (
              <CheckSquare className="w-4 h-4 text-brand-teal" />
            ) : (
              <MinusSquare className="w-4 h-4 text-brand-teal" />
            )}
          </button>
        </div>
        <button 
          onClick={() => handleSort('lastName')}
          className="col-span-3 flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition text-left"
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
          const isChecked = selectedIds.has(prospect.id);
          
          return (
            <div
              key={prospect.id}
              onClick={() => setSelectedProspect(prospect)}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                isSelected ? 'bg-brand-teal/5 dark:bg-brand-teal/10 border-l-2 border-l-brand-teal' : ''
              } ${isChecked ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              {/* Checkbox */}
              <div className="col-span-1 flex items-center justify-center">
                <button
                  onClick={(e) => toggleSelect(prospect.id, e)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition"
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-brand-teal" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Contact */}
              <div className="col-span-3 flex items-center gap-3 min-w-0">
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
