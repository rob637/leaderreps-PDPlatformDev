import React, { useState, useEffect } from 'react';
import { useProspectsStore, PIPELINE_STAGES } from '../../stores/prospectsStore';
import { useTasksStore, TASK_TYPES, TASK_PRIORITIES } from '../../stores/tasksStore';
import { useActivitiesStore } from '../../stores/prospectActivitiesStore';
import { useLinkedHelperStore } from '../../stores/linkedHelperStore';
import { useSequenceStore } from '../../stores/sequenceStore';
import { useApolloStore } from '../../stores/apolloStore';
import useGmailStore from '../../stores/gmailStore';
import * as gmail from '../../lib/gmail';
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
import ProspectTasksSection from './ProspectTasksSection';
import ProspectActivityTimeline from './ProspectActivityTimeline';
import ProspectQuickActions from './ProspectQuickActions';
import ProspectAIInsights from './ProspectAIInsights';
import AIComposeDialog from './AIComposeDialog';
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
  PlayCircle,
  RefreshCw
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
  const [showAICompose, setShowAICompose] = useState(false);
  const [quickLogType, setQuickLogType] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    tracking: true,
    contact: true,
    tasks: false,
    activity: true
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
  
  // Expanded activity card (for showing full content)
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  
  // Gmail sync state
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [syncedEmails, setSyncedEmails] = useState({ sent: [], received: [] });
  const { connectedAccounts, loadConnectedAccounts, isConnected: isGmailConnected } = useGmailStore();

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

  // Helper to safely convert Firestore Timestamp or ISO string to Date
  const toDate = (val) => {
    if (!val) return new Date(0);
    if (val.toDate) return val.toDate(); // Firestore Timestamp
    if (val.seconds) return new Date(val.seconds * 1000); // Timestamp-like
    return new Date(val); // ISO string or number
  };
  
  // Filter activities by channel
  const isEmailType = (type) => ['email_sent', 'email_received', 'sequence_email'].includes(type);
  const activities = allActivities.filter(a => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'email') return isEmailType(a.type);
    if (activityFilter === 'linkedin') return a.type?.includes('linkedin');
    if (activityFilter === 'call') return a.type === 'call';
    // 'other' = meeting, sms, note, stage_change, task
    return !['email_sent', 'email_received', 'call'].includes(a.type) && !a.type?.includes('linkedin');
  });
  
  // Calculate days since last touch (excluding system activities)
  const userActivities = allActivities.filter(a => !['stage_change', 'task_completed'].includes(a.type));
  const lastTouchDate = userActivities.length > 0
    ? new Date(Math.max(...userActivities.map(a => toDate(a.createdAt).getTime())))
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

  // Sync Gmail emails for this prospect
  const handleSyncGmail = async () => {
    const prospectEmail = selectedProspect.email;
    if (!prospectEmail) {
      toast.error('Prospect has no email address');
      return;
    }
    
    // Load connected accounts if not already
    if (connectedAccounts.length === 0) {
      await loadConnectedAccounts();
    }
    
    const accounts = useGmailStore.getState().connectedAccounts;
    if (accounts.length === 0) {
      toast.error('No Gmail accounts connected. Connect in Settings.');
      return;
    }
    
    setSyncingGmail(true);
    try {
      // Use the first connected account's email for the "fromEmail" lookup
      const fromEmail = accounts[0].email;
      
      // Sync sent and received emails for this prospect
      const result = await gmail.syncEmailsForProspect(prospectEmail, fromEmail);
      
      // Parse and display the synced emails
      const sentEmails = (result.sent || []).map(msg => {
        const headers = gmail.parseHeaders(msg);
        return {
          id: msg.id,
          threadId: msg.threadId,
          type: 'email_sent',
          subject: headers.subject || '(No subject)',
          from: headers.from,
          to: headers.to,
          date: headers.date,
          snippet: msg.snippet,
          isGmail: true
        };
      });
      
      const receivedEmails = (result.received || []).map(msg => {
        const headers = gmail.parseHeaders(msg);
        return {
          id: msg.id,
          threadId: msg.threadId,
          type: 'email_received',
          subject: headers.subject || '(No subject)',
          from: headers.from,
          to: headers.to,
          date: headers.date,
          snippet: msg.snippet,
          isGmail: true
        };
      });
      
      setSyncedEmails({ sent: sentEmails, received: receivedEmails });
      const totalCount = sentEmails.length + receivedEmails.length;
      if (totalCount > 0) {
        toast.success(`Synced ${totalCount} email${totalCount !== 1 ? 's' : ''}`);
      } else {
        toast('No emails found for this contact', { icon: '📧' });
      }
    } catch (error) {
      console.error('Error syncing Gmail:', error);
      toast.error('Failed to sync Gmail');
    } finally {
      setSyncingGmail(false);
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
        // Filter out undefined values - Firestore doesn't accept them
        const cleanedData = Object.fromEntries(
          Object.entries(enrichedData).filter(([_, v]) => v !== undefined)
        );
        await updateProspect(selectedProspect.id, cleanedData);
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
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-1">
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
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-1">
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
                    <a 
                      href={selectedProspect.companyWebsite 
                        ? (selectedProspect.companyWebsite.startsWith('http') ? selectedProspect.companyWebsite : `https://${selectedProspect.companyWebsite}`)
                        : `https://www.google.com/search?q=${encodeURIComponent(selectedProspect.company)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-brand-teal transition group"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{selectedProspect.company}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </a>
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

        {/* Activity/Notes Section */}
        <ProspectActivityTimeline
          prospectEmail={selectedProspect.email}
          allActivities={allActivities}
          activities={activities}
          expanded={expandedSections.activity}
          activityFilter={activityFilter}
          showAddNote={showAddNote}
          newNote={newNote}
          noteType={noteType}
          syncingGmail={syncingGmail}
          syncedEmails={syncedEmails}
          daysSinceTouch={daysSinceTouch}
          expandedActivityId={expandedActivityId}
          onSetActivityFilter={setActivityFilter}
          onSetShowAddNote={setShowAddNote}
          onSetNewNote={setNewNote}
          onSetNoteType={setNoteType}
          onAddNote={handleAddNote}
          onSyncGmail={handleSyncGmail}
          onSetSyncedEmails={setSyncedEmails}
          onSetExpandedActivityId={setExpandedActivityId}
          SectionHeader={SectionHeader}
        />

        {/* AI Insights — score, summary, next-best-action */}
        <ProspectAIInsights
          prospect={selectedProspect}
          activities={userActivities}
        />

        {/* Tasks Section */}
        <ProspectTasksSection
          tasks={prospectTasks}
          expanded={expandedSections.tasks}
          showAddTask={showAddTask}
          newTask={newTask}
          onToggleSection={toggleSection}
          onSetShowAddTask={setShowAddTask}
          onSetNewTask={setNewTask}
          onAddTask={handleAddTask}
          onToggleTaskComplete={toggleTaskComplete}
          onDeleteTask={deleteTask}
          SectionHeader={SectionHeader}
          Bell={Bell}
        />

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
        <ProspectQuickActions
          prospect={selectedProspect}
          enriching={enriching}
          isLinkedHelperSynced={isLinkedHelperSynced(selectedProspect.id)}
          hasLinkedInUrl={hasLinkedInUrl(selectedProspect)}
          hasActiveSequence={getProspectEnrollments(selectedProspect.id).some(
            (e) => e.status === 'active'
          )}
          onQuickLog={(type) => {
            setQuickLogType(type);
            setShowQuickLog(true);
          }}
          onOpenLog={() => {
            setQuickLogType(null);
            setShowQuickLog(true);
          }}
          onOpenSequence={() => setShowEnrollModal(true)}
          onPushLinkedHelper={() => openLinkedHelperModal(selectedProspect)}
          onEnrichApollo={handleEnrichWithApollo}
          onAddTask={() => {
            setExpandedSections((prev) => ({ ...prev, tasks: true }));
            setShowAddTask(true);
          }}
          onAICompose={() => setShowAICompose(true)}
        />
      )}

      {/* QuickLogModal */}
      {showQuickLog && (
        <QuickLogModal 
          prospect={selectedProspect}
          initialType={quickLogType}
          onClose={() => { setShowQuickLog(false); setQuickLogType(null); }}
        />
      )}

      {/* AI Compose Dialog */}
      <AIComposeDialog
        open={showAICompose}
        onClose={() => setShowAICompose(false)}
        prospect={selectedProspect}
        senderName={user?.displayName || user?.email || ''}
      />

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
