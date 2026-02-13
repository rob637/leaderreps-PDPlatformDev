import React, { useEffect, useState } from 'react';
import { useProspectsStore, PIPELINE_STAGES } from '../stores/prospectsStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useTasksStore } from '../stores/tasksStore';
import { TEAM_MEMBERS } from '../config/team';
import ProspectsList from '../components/prospects/ProspectsList';
import ProspectsKanban from '../components/prospects/ProspectsKanban';
import ProspectDetailPanel from '../components/prospects/ProspectDetailPanel';
import AddProspectModal from '../components/prospects/AddProspectModal';
import CSVImportModal from '../components/CSVImportModal';
import {
  Search,
  Plus,
  List,
  LayoutGrid,
  Filter,
  Users,
  User,
  ChevronDown,
  Upload
} from 'lucide-react';

const ProspectsPage = () => {
  const { user } = useAuthStore();
  const {
    loading,
    error,
    filters,
    viewMode,
    setFilter,
    setViewMode,
    setCurrentUser,
    subscribeToProspects,
    getFilteredProspects,
    selectedProspect,
    isCurrentUserAdmin
  } = useProspectsStore();
  
  const { openModal, activeModal, closeModal } = useUIStore();
  const { subscribeToTasks } = useTasksStore();
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  // Initialize store with current user and subscribe to data
  useEffect(() => {
    if (user?.email) {
      setCurrentUser(user.email);
    }
    const unsubProspects = subscribeToProspects();
    const unsubTasks = user?.email ? subscribeToTasks(user.email) : () => {};
    return () => {
      unsubProspects();
      unsubTasks();
    };
  }, [user?.email, setCurrentUser, subscribeToProspects, subscribeToTasks]);

  const filteredProspects = getFilteredProspects();
  const userIsAdmin = isCurrentUserAdmin();

  // Get owner filter display text
  const getOwnerFilterLabel = () => {
    if (filters.owner === 'me') return 'My Prospects';
    if (filters.owner === 'all') return 'All Team';
    const member = TEAM_MEMBERS.find(m => m.email === filters.owner);
    return member ? `${member.name}'s` : filters.owner;
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search prospects..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="pl-9 pr-4 py-2 w-64 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
            />
          </div>

          {/* Owner Filter */}
          <div className="relative">
            <button
              onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              {filters.owner === 'me' ? (
                <User className="w-4 h-4 text-slate-500" />
              ) : (
                <Users className="w-4 h-4 text-slate-500" />
              )}
              <span>{getOwnerFilterLabel()}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            
            {showOwnerDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowOwnerDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-elevated z-20 py-1">
                  <button
                    onClick={() => { setFilter('owner', 'me'); setShowOwnerDropdown(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${filters.owner === 'me' ? 'bg-slate-100' : ''}`}
                  >
                    <User className="w-4 h-4" />
                    <span>My Prospects</span>
                  </button>
                  
                  {userIsAdmin && (
                    <>
                      <div className="border-t border-slate-200 my-1" />
                      <button
                        onClick={() => { setFilter('owner', 'all'); setShowOwnerDropdown(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${filters.owner === 'all' ? 'bg-slate-100' : ''}`}
                      >
                        <Users className="w-4 h-4" />
                        <span>All Team</span>
                      </button>
                      <div className="border-t border-slate-200 my-1" />
                      {TEAM_MEMBERS.map(member => (
                        <button
                          key={member.email}
                          onClick={() => { setFilter('owner', member.email); setShowOwnerDropdown(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${filters.owner === member.email ? 'bg-slate-100' : ''}`}
                        >
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.initials}
                          </div>
                          <span>{member.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Stage Filter */}
          <select
            value={filters.stage}
            onChange={(e) => setFilter('stage', e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
          >
            <option value="all">All Stages</option>
            {PIPELINE_STAGES.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
              title="Pipeline view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Prospect */}
          <button
            onClick={() => setShowCSVImport(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => openModal('addProspect')}
            className="flex items-center gap-2 px-3 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-500 mb-3">
        {loading ? 'Loading...' : `${filteredProspects.length} prospect${filteredProspects.length !== 1 ? 's' : ''}`}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100%-5rem)] gap-4">
        {/* List or Kanban View */}
        <div className={`flex-1 overflow-hidden ${selectedProspect ? 'w-2/3' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-teal border-t-transparent"></div>
            </div>
          ) : viewMode === 'list' ? (
            <ProspectsList prospects={filteredProspects} />
          ) : (
            <ProspectsKanban prospects={filteredProspects} />
          )}
        </div>

        {/* Detail Panel */}
        {selectedProspect && (
          <div className="w-1/3 min-w-80">
            <ProspectDetailPanel />
          </div>
        )}
      </div>

      {/* Add Prospect Modal */}
      {activeModal === 'addProspect' && (
        <AddProspectModal onClose={closeModal} />
      )}

      {/* CSV Import Modal */}
      <CSVImportModal 
        isOpen={showCSVImport} 
        onClose={() => setShowCSVImport(false)} 
      />
    </div>
  );
};

export default ProspectsPage;
