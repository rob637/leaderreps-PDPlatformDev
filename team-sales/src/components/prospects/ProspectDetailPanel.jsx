import React, { useState, useEffect } from 'react';
import { useProspectsStore, PIPELINE_STAGES } from '../../stores/prospectsStore';
import { useTasksStore, TASK_TYPES, TASK_PRIORITIES } from '../../stores/tasksStore';
import { useActivitiesStore } from '../../stores/prospectActivitiesStore';
import { useLinkedHelperStore } from '../../stores/linkedHelperStore';
import { useSequenceStore } from '../../stores/sequenceStore';
import { useApolloStore } from '../../stores/apolloStore';
import { EnrollInSequenceModal } from '../sequences';
import { TEAM_MEMBERS, getStageInfo } from '../../config/team';
import { 
  LINKEDIN_STATUSES, 
  DEFAULT_TAGS, 
  APOLLO_SEQUENCE_STATUSES,
  ACTIVITY_TYPES,
  getLinkedInStatus,
  getApolloSequenceStatus,
  getActivityType,
  getCallOutcome,
  getMeetingOutcome,
  getUserActivityTypes
} from '../../config/prospectMeta';
import { useAuthStore } from '../../stores/authStore';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import QuickLogModal from './QuickLogModal';
import {
  X,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Edit2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Plus,
  Tag,
  Clock,
  CheckCircle,
  Circle,
  UserCheck,
  UserX,
  Sparkles,
  FileText,
  Bell,
  MoreHorizontal,
  Inbox,
  Zap,
  PlayCircle
} from 'lucide-react';

// Format phone number as (XXX) XXX-XXXX
const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const ProspectDetailPanel = () => {
  const { user } = useAuthStore();
  const { 
    selectedProspect, 
    clearSelectedProspect, 
    updateProspect, 
    deleteProspect 
  } = useProspectsStore();
  const { tasks, addTask, toggleTaskComplete, deleteTask } = useTasksStore();
  const { 
    activitiesByProspect, 
    subscribeToProspectActivities, 
    addActivity 
  } = useActivitiesStore();
  const { 
    openPushModal: openLinkedHelperModal, 
    isProspectSynced: isLinkedHelperSynced, 
    hasLinkedInUrl 
  } = useLinkedHelperStore();
  const { getProspectEnrollments } = useSequenceStore();
  const { enrichProspect, enriching, apiKey: apolloApiKey, loadApiKey: loadApolloKey } = useApolloStore();
  
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showLinkedInDropdown, setShowLinkedInDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showSequenceDropdown, setShowSequenceDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogType, setQuickLogType] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    tracking: true,
    contact: true,
    tasks: false,
    activity: false
  });
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'follow_up',
    priority: 'medium',
    dueDate: ''
  });
  
  // New note
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('note');
  
  // Activity timeline filter
  const [activityFilter, setActivityFilter] = useState('all'); // all, email, linkedin, call, other

  // Subscribe to activities when prospect changes
  useEffect(() => {
    if (selectedProspect?.id) {
      const unsubscribe = subscribeToProspectActivities(selectedProspect.id);
      return () => unsubscribe();
    }
  }, [selectedProspect?.id, subscribeToProspectActivities]);

  // Load Apollo API key if not already loaded
  useEffect(() => {
    if (user?.uid && !apolloApiKey) {
      loadApolloKey(user.uid);
    }
  }, [user?.uid, apolloApiKey, loadApolloKey]);

  if (!selectedProspect) return null;

  const stageInfo = getStageInfo(selectedProspect.stage);
  const ownerEmail = selectedProspect.owner || selectedProspect.ownerEmail;
  const ownerMember = TEAM_MEMBERS.find(
    m => m.email.toLowerCase() === ownerEmail?.toLowerCase()
  );
  const linkedInStatus = getLinkedInStatus(selectedProspect.linkedinStatus);
  const sequenceStatus = getApolloSequenceStatus(selectedProspect.apolloSequenceStatus);
  const prospectTags = selectedProspect.tags || [];
  const prospectTasks = tasks.filter(t => t.prospectId === selectedProspect.id);
  const allActivities = activitiesByProspect[selectedProspect.id] || [];
  
  // Filter activities by channel
  const activities = allActivities.filter(a => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'email') return a.type === 'email_sent' || a.type === 'email_received';
    if (activityFilter === 'linkedin') return a.type?.includes('linkedin');
    if (activityFilter === 'call') return a.type === 'call';
    // 'other' = meeting, sms, note, stage_change, task
    return !['email_sent', 'email_received', 'call'].includes(a.type) && !a.type?.includes('linkedin');
  });
  
  // Calculate days since last touch (excluding system activities)
  const userActivities = allActivities.filter(a => !['stage_change', 'task_completed'].includes(a.type));
  const lastTouchDate = userActivities.length > 0
    ? new Date(Math.max(...userActivities.map(a => new Date(a.createdAt).getTime())))
    : null;
  const daysSinceTouch = lastTouchDate
    ? Math.floor((Date.now() - lastTouchDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleStageChange = async (newStage) => {
    try {
      await updateProspect(selectedProspect.id, { stage: newStage });
      // Log activity
      await addActivity({
        prospectId: selectedProspect.id,
        prospectName: selectedProspect.name,
        type: 'stage_change',
        content: `Stage changed from ${getStageInfo(selectedProspect.stage).label} to ${getStageInfo(newStage).label}`
      }, user.email, user.displayName || user.email.split('@')[0]);
      toast.success(`Stage updated to ${getStageInfo(newStage).label}`);
    } catch (error) {
      toast.error('Failed to update stage');
    }
    setShowStageDropdown(false);
  };

  const handleOwnerChange = async (newOwnerEmail) => {
    try {
      await updateProspect(selectedProspect.id, { 
        owner: newOwnerEmail,
        ownerEmail: newOwnerEmail 
      });
      const member = TEAM_MEMBERS.find(m => m.email === newOwnerEmail);
      toast.success(`Assigned to ${member?.name || newOwnerEmail}`);
    } catch (error) {
      toast.error('Failed to update owner');
    }
    setShowOwnerDropdown(false);
  };

  const handleLinkedInStatusChange = async (newStatus) => {
    try {
      await updateProspect(selectedProspect.id, { linkedinStatus: newStatus });
      const status = getLinkedInStatus(newStatus);
      // Log activity if connecting
      if (newStatus === 'pending' || newStatus === 'connected') {
        await addActivity({
          prospectId: selectedProspect.id,
          prospectName: selectedProspect.name,
          type: 'linkedin_connect',
          content: `LinkedIn status: ${status.label}`
        }, user.email, user.displayName || user.email.split('@')[0]);
      }
      toast.success(`LinkedIn status: ${status.label}`);
    } catch (error) {
      toast.error('Failed to update LinkedIn status');
    }
    setShowLinkedInDropdown(false);
  };

  const handleSequenceStatusChange = async (newStatus) => {
    try {
      await updateProspect(selectedProspect.id, { apolloSequenceStatus: newStatus });
      const status = getApolloSequenceStatus(newStatus);
      toast.success(`Sequence status: ${status.label}`);
    } catch (error) {
      toast.error('Failed to update sequence status');
    }
    setShowSequenceDropdown(false);
  };

  const handleToggleTag = async (tagId) => {
    const currentTags = selectedProspect.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(t => t !== tagId)
      : [...currentTags, tagId];
    
    try {
      await updateProspect(selectedProspect.id, { tags: newTags });
    } catch (error) {
      toast.error('Failed to update tags');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProspect(selectedProspect.id);
      toast.success('Prospect deleted');
      clearSelectedProspect();
    } catch (error) {
      toast.error('Failed to delete prospect');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editData,
        // Also update combined name for backwards compatibility
        name: `${editData.firstName || ''} ${editData.lastName || ''}`.trim(),
      };
      await updateProspect(selectedProspect.id, updateData);
      toast.success('Prospect updated');
      setIsEditing(false);
      setEditData({});
    } catch (error) {
      toast.error('Failed to update prospect');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    try {
      await addTask({
        ...newTask,
        prospectId: selectedProspect.id,
        prospectName: selectedProspect.name
      }, user.email);
      toast.success('Task added');
      setNewTask({ title: '', type: 'follow_up', priority: 'medium', dueDate: '' });
      setShowAddTask(false);
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Note is required');
      return;
    }
    try {
      await addActivity({
        prospectId: selectedProspect.id,
        prospectName: selectedProspect.name,
        type: noteType,
        content: newNote
      }, user.email, user.displayName || user.email.split('@')[0]);
      toast.success('Activity logged');
      setNewNote('');
      setShowAddNote(false);
    } catch (error) {
      toast.error('Failed to log activity');
    }
  };

  const handleEnrichWithApollo = async () => {
    if (!apolloApiKey) {
      toast.error('Configure Apollo API key in Settings first');
      return;
    }
    if (!selectedProspect.email && !selectedProspect.linkedin) {
      toast.error('Prospect needs email or LinkedIn URL for enrichment');
      return;
    }
    
    const enrichedData = await enrichProspect(selectedProspect, user?.uid);
    
    if (enrichedData) {
      try {
        await updateProspect(selectedProspect.id, enrichedData);
        // Log the enrichment as an activity
        await addActivity({
          prospectId: selectedProspect.id,
          prospectName: selectedProspect.name,
          type: 'note',
          content: 'Prospect enriched with Apollo data'
        }, user.email, user.displayName || user.email.split('@')[0]);
      } catch (error) {
        console.error('Error saving enriched data:', error);
        toast.error('Failed to save enriched data');
      }
    }
  };

  const startEditing = () => {
    setEditData({
      firstName: selectedProspect.firstName || '',
      lastName: selectedProspect.lastName || '',
      email: selectedProspect.email || '',
      phone: selectedProspect.phone || '',
      company: selectedProspect.company || '',
      title: selectedProspect.title || '',
      linkedin: selectedProspect.linkedin || '',
      website: selectedProspect.website || '',
      location: selectedProspect.location || '',
      value: selectedProspect.value || '',
      apolloSequenceName: selectedProspect.apolloSequenceName || '',
    });
    setIsEditing(true);
  };

  // Section header component
  const SectionHeader = ({ title, section, icon: Icon, badge }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-2 group"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {badge && (
          <span className="px-1.5 py-0.5 bg-brand-teal/10 text-brand-teal text-xs rounded-full font-medium">
            {badge}
          </span>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
      )}
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Prospect Details</h3>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button
              onClick={startEditing}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-500" />
          </button>
          <button
            onClick={clearSelectedProspect}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name & Title */}
        <div>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                value={editData.firstName}
                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                className="text-lg font-semibold text-slate-900 dark:text-slate-100 bg-transparent w-full border-b border-slate-300 dark:border-slate-600 focus:border-brand-teal outline-none pb-1"
                placeholder="First Name"
              />
              <input
                value={editData.lastName}
                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                className="text-lg font-semibold text-slate-900 dark:text-slate-100 bg-transparent w-full border-b border-slate-300 dark:border-slate-600 focus:border-brand-teal outline-none pb-1"
                placeholder="Last Name"
              />
            </div>
          ) : (
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
              {selectedProspect.firstName || selectedProspect.name || 'Unnamed'} {selectedProspect.lastName || ''}
            </h2>
          )}
          
          {isEditing ? (
            <input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="text-sm text-slate-500 dark:text-slate-400 bg-transparent w-full border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none pb-1 mt-2"
              placeholder="Title"
            />
          ) : (
            selectedProspect.title && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedProspect.title}</p>
            )
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {prospectTags.map(tagId => {
            const tag = DEFAULT_TAGS.find(t => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                onClick={() => handleToggleTag(tagId)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.label}
                <X className="w-3 h-3" />
              </span>
            );
          })}
          <div className="relative">
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              <Plus className="w-3 h-3" />
              Tag
            </button>
            {showTagDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTagDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated z-20 py-1 w-40 max-h-48 overflow-y-auto">
                  {DEFAULT_TAGS.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleToggleTag(tag.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        prospectTags.includes(tag.id) ? 'bg-slate-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.label}</span>
                      {prospectTags.includes(tag.id) && (
                        <CheckCircle className="w-3 h-3 text-brand-teal ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stage & Owner Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Stage */}
          <div className="relative">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Stage</label>
            <button
              onClick={() => setShowStageDropdown(!showStageDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stageInfo.color }}
                />
                <span className="truncate">{stageInfo.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
            
            {showStageDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStageDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated z-20 py-1 max-h-48 overflow-y-auto">
                  {PIPELINE_STAGES.map(stage => (
                    <button
                      key={stage.id}
                      onClick={() => handleStageChange(stage.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        selectedProspect.stage === stage.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                      }`}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span>{stage.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Owner */}
          <div className="relative">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Owner</label>
            <button
              onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
            >
              <div className="flex items-center gap-2">
                {ownerMember ? (
                  <>
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: ownerMember.color }}
                    >
                      {ownerMember.initials}
                    </div>
                    <span className="truncate">{ownerMember.name.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Unassigned</span>
                  </>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>
            
            {showOwnerDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOwnerDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated z-20 py-1">
                  {TEAM_MEMBERS.map(member => (
                    <button
                      key={member.email}
                      onClick={() => handleOwnerChange(member.email)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                        ownerEmail?.toLowerCase() === member.email.toLowerCase() ? 'bg-slate-100 dark:bg-slate-700' : ''
                      }`}
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
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tracking Section - LinkedIn & Apollo */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <SectionHeader title="Tracking" section="tracking" icon={Sparkles} />
          
          {expandedSections.tracking && (
            <div className="space-y-3 mt-2">
              {/* LinkedIn Status */}
              <div className="relative">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">LinkedIn Status</label>
                <button
                  onClick={() => setShowLinkedInDropdown(!showLinkedInDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: linkedInStatus.color }}
                    />
                    <span>{linkedInStatus.label}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                
                {showLinkedInDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowLinkedInDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated z-20 py-1">
                      {LINKEDIN_STATUSES.map(status => (
                        <button
                          key={status.id}
                          onClick={() => handleLinkedInStatusChange(status.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            selectedProspect.linkedinStatus === status.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                          }`}
                        >
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* LinkedIn Profile Link */}
              {selectedProspect.linkedin && (
                <a 
                  href={selectedProspect.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[#0077b5] hover:underline"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>View LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {/* Apollo Sequence Status */}
              <div className="relative">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Apollo Sequence</label>
                <button
                  onClick={() => setShowSequenceDropdown(!showSequenceDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sequenceStatus.color }}
                    />
                    <span>{sequenceStatus.label}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                
                {showSequenceDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSequenceDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated z-20 py-1 max-h-48 overflow-y-auto">
                      {APOLLO_SEQUENCE_STATUSES.map(status => (
                        <button
                          key={status.id}
                          onClick={() => handleSequenceStatusChange(status.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            selectedProspect.apolloSequenceStatus === status.id ? 'bg-slate-100 dark:bg-slate-700' : ''
                          }`}
                        >
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sequence Name */}
              {isEditing ? (
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Sequence Name</label>
                  <input
                    value={editData.apolloSequenceName}
                    onChange={(e) => setEditData({ ...editData, apolloSequenceName: e.target.value })}
                    className="w-full text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="e.g., Cold Outreach Q1"
                  />
                </div>
              ) : selectedProspect.apolloSequenceName && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-slate-400 dark:text-slate-500">Sequence: </span>
                  {selectedProspect.apolloSequenceName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Info Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <SectionHeader title="Contact Info" section="contact" icon={User} />
          
          {expandedSections.contact && (
            <div className="space-y-2 mt-2">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                      placeholder="Email"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <input
                      value={editData.company}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                      placeholder="Company"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-slate-400" />
                    <input
                      value={editData.linkedin}
                      onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                      className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <input
                      value={editData.website}
                      onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                      placeholder="Website"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <input
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                      placeholder="Location"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProspect.email && (
                    <a 
                      href={`mailto:${selectedProspect.email}`}
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-brand-teal transition"
                    >
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedProspect.email}</span>
                    </a>
                  )}
                  {selectedProspect.phone && (
                    <a 
                      href={`tel:${selectedProspect.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-brand-teal transition"
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{selectedProspect.phone}</span>
                    </a>
                  )}
                  {selectedProspect.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{selectedProspect.company}</span>
                    </div>
                  )}
                  {selectedProspect.website && (
                    <a 
                      href={selectedProspect.website.startsWith('http') ? selectedProspect.website : `https://${selectedProspect.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-brand-teal transition"
                    >
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span>{selectedProspect.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProspect.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{selectedProspect.location}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Deal Value */}
              {(selectedProspect.value || isEditing) && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Deal Value</label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={editData.value}
                        onChange={(e) => setEditData({ ...editData, value: Number(e.target.value) })}
                        className="flex-1 text-sm bg-transparent text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 focus:border-brand-teal outline-none py-1"
                        placeholder="Deal value"
                      />
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-brand-teal">
                      ${selectedProspect.value?.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <SectionHeader 
            title="Follow-up Tasks" 
            section="tasks" 
            icon={Bell}
            badge={prospectTasks.filter(t => !t.completed).length || null}
          />
          
          {expandedSections.tasks && (
            <div className="space-y-2 mt-2">
              {prospectTasks.length === 0 && !showAddTask ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No tasks yet</p>
              ) : (
                <div className="space-y-1">
                  {prospectTasks.map(task => {
                    const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
                    const priority = TASK_PRIORITIES.find(p => p.id === task.priority);
                    return (
                      <div 
                        key={task.id}
                        className={`flex items-start gap-2 p-2 rounded-lg ${
                          task.completed ? 'bg-slate-50 dark:bg-slate-700/50 opacity-60' : isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-700'
                        }`}
                      >
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className="mt-0.5"
                        >
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4 text-brand-teal" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 dark:text-slate-500 hover:text-brand-teal" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.completed ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.dueDate && (
                              <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                            {priority && (
                              <span 
                                className="text-xs px-1.5 rounded"
                                style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
                              >
                                {priority.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded"
                        >
                          <X className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Task Form */}
              {showAddTask ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-2">
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="Task description..."
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                      className="text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-2 py-1.5 text-slate-900 dark:text-slate-100 outline-none"
                    >
                      {TASK_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-2 py-1.5 text-slate-900 dark:text-slate-100 outline-none"
                    >
                      {TASK_PRIORITIES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddTask(false)}
                      className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTask}
                      className="flex-1 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="flex items-center gap-2 text-sm text-brand-teal hover:text-brand-teal/80"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Activity/Notes Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <div className="flex items-center justify-between">
            <SectionHeader 
              title="Activity Log" 
              section="activity" 
              icon={MessageSquare}
              badge={allActivities.length || null}
            />
            {/* Days since last touch indicator */}
            {daysSinceTouch !== null && (
              <div className={`text-xs px-2 py-0.5 rounded-full ${
                daysSinceTouch === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                daysSinceTouch <= 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                daysSinceTouch <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {daysSinceTouch === 0 ? 'Today' : `${daysSinceTouch}d ago`}
              </div>
            )}
          </div>
          
          {expandedSections.activity && (
            <div className="space-y-2 mt-2">
              {/* Channel Filter Tabs */}
              <div className="flex gap-1 flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'email', label: 'Email' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'call', label: 'Calls' },
                  { id: 'other', label: 'Other' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActivityFilter(tab.id)}
                    className={`px-2 py-1 text-xs rounded-full transition ${
                      activityFilter === tab.id
                        ? 'bg-brand-teal text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {tab.label}
                    {tab.id !== 'all' && (
                      <span className="ml-1 opacity-70">
                        {allActivities.filter(a => {
                          if (tab.id === 'email') return a.type === 'email_sent' || a.type === 'email_received';
                          if (tab.id === 'linkedin') return a.type?.includes('linkedin');
                          if (tab.id === 'call') return a.type === 'call';
                          return !['email_sent', 'email_received', 'call'].includes(a.type) && !a.type?.includes('linkedin');
                        }).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Add Note Form */}
              {showAddNote ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-2">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-2 py-1.5 text-slate-900 dark:text-slate-100 outline-none"
                  >
                    {ACTIVITY_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none min-h-16 resize-none"
                    placeholder="Add a note..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowAddNote(false); setNewNote(''); }}
                      className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="flex-1 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
                    >
                      Log Activity
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="flex items-center gap-2 text-sm text-brand-teal hover:text-brand-teal/80"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Activity</span>
                </button>
              )}

              {/* Activity List */}
              {activities.length > 0 && (
                <div className="space-y-3 mt-3">
                  {activities.map(activity => {
                    const actType = getActivityType(activity.type);
                    const callOutcome = activity.outcome && activity.type === 'call' ? getCallOutcome(activity.outcome) : null;
                    const meetingOutcome = activity.outcome && activity.type === 'meeting' ? getMeetingOutcome(activity.outcome) : null;
                    
                    // Get the appropriate icon component
                    const IconComponent = 
                      activity.type === 'call' ? Phone :
                      activity.type === 'email_sent' ? Send :
                      activity.type === 'email_received' ? Inbox :
                      activity.type === 'meeting' ? Calendar :
                      activity.type === 'linkedin_connect' || activity.type === 'linkedin_message' || activity.type === 'linkedin_inmail' ? Linkedin :
                      activity.type === 'sms' ? MessageSquare :
                      FileText;
                    
                    return (
                      <div key={activity.id} className="flex gap-3 text-sm border-l-2 pl-3 py-1" style={{ borderColor: actType.color }}>
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${actType.color}15` }}
                        >
                          <IconComponent className="w-3.5 h-3.5" style={{ color: actType.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{actType.label}</span>
                            {/* Call outcome badge */}
                            {callOutcome && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                                style={{ backgroundColor: callOutcome.color }}
                              >
                                {callOutcome.label}
                              </span>
                            )}
                            {/* Meeting outcome badge */}
                            {meetingOutcome && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded font-medium text-white"
                                style={{ backgroundColor: meetingOutcome.color }}
                              >
                                {meetingOutcome.label}
                              </span>
                            )}
                            {/* Duration */}
                            {activity.duration && (
                              <span className="text-xs text-slate-400">
                                {activity.duration} min
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap mt-1">{activity.content}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                            <span>{activity.userName}</span>
                            <span>·</span>
                            <span>
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Created</span>
            <span>
              {selectedProspect.createdAt 
                ? format(new Date(selectedProspect.createdAt), 'MMM d, yyyy')
                : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Last updated</span>
            <span>
              {selectedProspect.updatedAt 
                ? formatDistanceToNow(new Date(selectedProspect.updatedAt), { addSuffix: true })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Actions */}
      {isEditing && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <button
            onClick={() => { setIsEditing(false); setEditData({}); }}
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="flex-1 px-3 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {!isEditing && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          {/* Primary quick action buttons */}
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => { setQuickLogType('call'); setShowQuickLog(true); }}
              className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-700 transition"
            >
              <Phone className="w-4 h-4 text-purple-500" />
              <span>Call</span>
            </button>
            <button 
              onClick={() => { setQuickLogType('email_sent'); setShowQuickLog(true); }}
              className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700 transition"
            >
              <Send className="w-4 h-4 text-blue-500" />
              <span>Email</span>
            </button>
            <button 
              onClick={() => { setQuickLogType('meeting'); setShowQuickLog(true); }}
              className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-200 dark:hover:border-amber-700 transition"
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Meeting</span>
            </button>
            <button 
              onClick={() => { setQuickLogType('note'); setShowQuickLog(true); }}
              className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Note</span>
            </button>
          </div>
          {/* Secondary actions */}
          <div className="grid grid-cols-5 gap-2">
            <button 
              onClick={() => { setQuickLogType(null); setShowQuickLog(true); }}
              className="flex flex-col items-center gap-1 px-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>Log</span>
            </button>
            <button 
              onClick={() => setShowEnrollModal(true)}
              disabled={!selectedProspect.email}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition ${
                !selectedProspect.email
                  ? 'border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  : getProspectEnrollments(selectedProspect.id).some(e => e.status === 'active')
                    ? 'border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-700'
              }`}
              title={!selectedProspect.email ? 'Add email first' : getProspectEnrollments(selectedProspect.id).some(e => e.status === 'active') ? 'In Sequence' : 'Add to Sequence'}
            >
              <PlayCircle className="w-4 h-4 text-emerald-500" />
              <span>Sequence</span>
            </button>
            <button 
              onClick={() => openLinkedHelperModal(selectedProspect)}
              disabled={!hasLinkedInUrl(selectedProspect)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition ${
                !hasLinkedInUrl(selectedProspect)
                  ? 'border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  : isLinkedHelperSynced(selectedProspect.id)
                    ? 'border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30'
                    : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700'
              }`}
              title={!hasLinkedInUrl(selectedProspect) ? 'Add LinkedIn URL first' : isLinkedHelperSynced(selectedProspect.id) ? 'Already in LinkedHelper' : 'Push to LinkedHelper'}
            >
              <Linkedin className="w-4 h-4 text-blue-600" />
              <span>LinkedIn</span>
            </button>
            <button 
              onClick={handleEnrichWithApollo}
              disabled={enriching || (!selectedProspect.email && !selectedProspect.linkedin)}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition ${
                !selectedProspect.email && !selectedProspect.linkedin
                  ? 'border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  : selectedProspect.apolloEnrichedAt
                    ? 'border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30'
                    : 'border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-200 dark:hover:border-amber-700'
              }`}
              title={
                !selectedProspect.email && !selectedProspect.linkedin 
                  ? 'Add email or LinkedIn first' 
                  : selectedProspect.apolloEnrichedAt 
                    ? `Enriched ${formatDistanceToNow(new Date(selectedProspect.apolloEnrichedAt))} ago` 
                    : 'Enrich with Apollo data'
              }
            >
              <Sparkles className={`w-4 h-4 text-amber-500 ${enriching ? 'animate-pulse' : ''}`} />
              <span>{enriching ? '...' : 'Enrich'}</span>
            </button>
            <button 
              onClick={() => { setExpandedSections(prev => ({ ...prev, tasks: true })); setShowAddTask(true); }}
              className="flex flex-col items-center gap-1 px-2 py-2.5 bg-brand-teal text-white rounded-lg text-xs font-medium hover:bg-brand-teal/90 transition"
            >
              <Bell className="w-4 h-4" />
              <span>Task</span>
            </button>
          </div>
        </div>
      )}

      {/* QuickLogModal */}
      {showQuickLog && (
        <QuickLogModal 
          prospect={selectedProspect}
          initialType={quickLogType}
          onClose={() => { setShowQuickLog(false); setQuickLogType(null); }}
        />
      )}

      {/* Enroll in Sequence Modal */}
      {showEnrollModal && (
        <EnrollInSequenceModal
          prospect={selectedProspect}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => {
            toast.success('Prospect enrolled in sequence!');
            setShowEnrollModal(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center z-30">
          <div className="text-center p-6">
            <p className="text-slate-900 dark:text-slate-100 font-medium mb-2">Delete this prospect?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectDetailPanel;
