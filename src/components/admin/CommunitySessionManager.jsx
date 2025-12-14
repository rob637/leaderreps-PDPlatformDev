// src/components/admin/CommunitySessionManager.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Calendar,
  Clock,
  Users,
  Mail,
  Bell,
  Send,
  Video,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Copy,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  RefreshCw,
  Download,
  MessageSquare,
  UserCheck,
  UserX,
  Repeat
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, 
  query, 
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import {
  COMMUNITY_SESSIONS_COLLECTION,
  COMMUNITY_SESSION_TYPES_COLLECTION,
  COMMUNITY_REGISTRATIONS_COLLECTION,
  COMMUNITY_SESSION_TYPES,
  COMMUNITY_RECURRENCE,
  SESSION_STATUS
} from '../../data/Constants';
import { COMMUNITY_SESSION_TYPE_CONFIG } from '../../services/communityService';

// Format date for display - handles YYYY-MM-DD as local date (not UTC)
const formatDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Format time for input
const formatTimeForInput = (timeStr) => {
  if (!timeStr) return '12:00';
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '12:00';
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  if (period?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Format time for display
const formatTimeForDisplay = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHours}:${minutes} ${period}`;
};

/**
 * CommunitySessionManager - Admin interface for managing community sessions
 * 
 * Features:
 * - Create/Edit/Delete community sessions (Leader Circles, Events, etc.)
 * - Manage recurring sessions
 * - View enrolled attendees
 * - Send notes and notifications
 * - Manage session status
 */
const CommunitySessionManager = () => {
  const { db } = useAppServices();
  
  // Data state
  const [sessions, setSessions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, _setSortBy] = useState('date'); // 'date', 'title', 'attendees'
  const [sortOrder, _setSortOrder] = useState('asc');
  
  // Edit state
  const [editingSession, setEditingSession] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Attendee management state
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSubject, setNotificationSubject] = useState('');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load sessions with real-time updates
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    
    // Listen to sessions
    const sessionsRef = collection(db, COMMUNITY_SESSIONS_COLLECTION);
    const sessionsQuery = query(sessionsRef, orderBy('date', 'desc'));
    
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(items);
    });
    
    // Listen to registrations
    const regsRef = collection(db, COMMUNITY_REGISTRATIONS_COLLECTION);
    const unsubRegs = onSnapshot(regsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrations(items);
      setLoading(false);
    });
    
    return () => {
      unsubSessions();
      unsubRegs();
    };
  }, [db]);

  // Get registrations for a session
  const getSessionRegistrations = useCallback((sessionId) => {
    return registrations.filter(r => 
      r.sessionId === sessionId && r.status !== 'cancelled'
    );
  }, [registrations]);

  // Filtered and sorted sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.sessionType === filterType);
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.title?.toLowerCase().includes(term) ||
        s.host?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date || 0) - new Date(b.date || 0);
      } else if (sortBy === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'attendees') {
        const aCount = getSessionRegistrations(a.id).length;
        const bCount = getSessionRegistrations(b.id).length;
        comparison = aCount - bCount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [sessions, filterStatus, filterType, searchTerm, sortBy, sortOrder, getSessionRegistrations]);

  // Calendar Data Generation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null });
    }
    
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.date === dateStr);
      days.push({
        day: i,
        dateStr,
        sessions: daySessions
      });
    }
    
    return days;
  }, [currentMonth, sessions]);

  // Session CRUD Operations
  const handleCreateSession = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setEditingSession({
      title: '',
      description: '',
      sessionType: COMMUNITY_SESSION_TYPES.LEADER_CIRCLE,
      host: 'Community Lead',
      date: nextWeek.toISOString().split('T')[0],
      time: '12:00',
      durationMinutes: 60,
      maxAttendees: 20,
      status: SESSION_STATUS.SCHEDULED,
      zoomLink: '',
      recurrence: COMMUNITY_RECURRENCE.NONE,
      topic: ''
    });
    setIsCreatingNew(true);
  };

  const handleEditSession = (session) => {
    setEditingSession({
      ...session,
      time: formatTimeForInput(session.time)
    });
    setIsCreatingNew(false);
  };

  const handleSaveSession = async () => {
    if (!editingSession.title || !editingSession.date) {
      alert('Please fill in required fields (Title, Date)');
      return;
    }

    try {
      const sessionId = isCreatingNew 
        ? `community-${editingSession.sessionType}-${editingSession.date}-${Date.now()}`
        : editingSession.id;
      
      const sessionData = {
        ...editingSession,
        id: sessionId,
        time: formatTimeForDisplay(editingSession.time),
        updatedAt: serverTimestamp(),
        ...(isCreatingNew && { createdAt: serverTimestamp() })
      };
      
      const docRef = doc(db, COMMUNITY_SESSIONS_COLLECTION, sessionId);
      await setDoc(docRef, sessionData, { merge: true });
      
      setEditingSession(null);
      setIsCreatingNew(false);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Error saving session: ' + error.message);
    }
  };

  const handleDeleteSession = async (session) => {
    if (!confirm(`Delete "${session.title}" on ${formatDate(session.date)}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, COMMUNITY_SESSIONS_COLLECTION, session.id));
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session: ' + error.message);
    }
  };

  const handleDuplicateSession = (session) => {
    // Parse date as local to avoid timezone shift
    const parts = session.date.split('-');
    const nextWeek = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Format back to YYYY-MM-DD for the input
    const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
    
    setEditingSession({
      ...session,
      id: null,
      date: nextWeekStr,
      time: formatTimeForInput(session.time),
      status: SESSION_STATUS.SCHEDULED,
      zoomLink: session.zoomLink || '',
      recurrence: COMMUNITY_RECURRENCE.NONE
    });
    setIsCreatingNew(true);
  };

  const handleUpdateStatus = async (session, newStatus) => {
    try {
      await updateDoc(doc(db, COMMUNITY_SESSIONS_COLLECTION, session.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === SESSION_STATUS.COMPLETED && { completedAt: serverTimestamp() }),
        ...(newStatus === SESSION_STATUS.CANCELLED && { cancelledAt: serverTimestamp() })
      });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status: ' + error.message);
    }
  };

  // Attendee Management
  const handleViewAttendees = (session) => {
    setSelectedSession(session);
    setShowAttendeesModal(true);
  };

  const handleMarkAttendance = async (registration, attended) => {
    try {
      await updateDoc(doc(db, COMMUNITY_REGISTRATIONS_COLLECTION, registration.id), {
        status: attended ? 'attended' : 'no_show',
        ...(attended && { attendedAt: serverTimestamp() })
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleRemoveAttendee = async (registration) => {
    if (!confirm('Remove this attendee from the session?')) return;
    
    try {
      await updateDoc(doc(db, COMMUNITY_REGISTRATIONS_COLLECTION, registration.id), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing attendee:', error);
    }
  };

  const handleSendNotification = async () => {
    // In a real app, this would trigger a cloud function to send emails
    alert(`Notification sent to ${getSessionRegistrations(selectedSession.id).length} attendees:\nSubject: ${notificationSubject}\nMessage: ${notificationMessage}`);
    setShowNotificationModal(false);
    setNotificationSubject('');
    setNotificationMessage('');
  };

  const handleExportAttendees = (session) => {
    const attendees = getSessionRegistrations(session.id);
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Status,Registered At\n"
      + attendees.map(r => `${r.userName},${r.userEmail},${r.status},${r.registeredAt?.toDate?.().toLocaleDateString() || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees-${session.date}-${session.title.replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-corporate-navy">Community Sessions</h2>
          <p className="text-slate-500">Manage Leader Circles, Events, and Masterminds</p>
        </div>
        <button
          onClick={handleCreateSession}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Session
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 w-full md:w-64"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
            >
              <option value="all">All Types</option>
              {Object.entries(COMMUNITY_SESSION_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
            >
              <option value="all">All Statuses</option>
              <option value={SESSION_STATUS.SCHEDULED}>Scheduled</option>
              <option value={SESSION_STATUS.COMPLETED}>Completed</option>
              <option value={SESSION_STATUS.CANCELLED}>Cancelled</option>
            </select>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editingSession && (
        <SessionEditForm
          session={editingSession}
          setSession={setEditingSession}
          isNew={isCreatingNew}
          onSave={handleSaveSession}
          onCancel={() => { setEditingSession(null); setIsCreatingNew(false); }}
        />
      )}

      {/* Session List View */}
      {viewMode === 'list' && !editingSession && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Session</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Date & Time</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Attendees</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No sessions found. Create your first session to get started.
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    registrations={getSessionRegistrations(session.id)}
                    onEdit={() => handleEditSession(session)}
                    onDelete={() => handleDeleteSession(session)}
                    onDuplicate={() => handleDuplicateSession(session)}
                    onViewAttendees={() => handleViewAttendees(session)}
                    onUpdateStatus={(status) => handleUpdateStatus(session, status)}
                    onExport={() => handleExportAttendees(session)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && !editingSession && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h3 className="text-lg font-bold text-corporate-navy">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayData, i) => (
              <div
                key={i}
                className={`min-h-[100px] border rounded-lg p-1 ${
                  dayData.day 
                    ? 'border-slate-200 bg-white' 
                    : 'border-transparent bg-slate-50'
                }`}
              >
                {dayData.day && (
                  <>
                    <div className={`text-sm font-bold mb-1 ${
                      dayData.dateStr === new Date().toISOString().split('T')[0]
                        ? 'text-corporate-teal'
                        : 'text-slate-600'
                    }`}>
                      {dayData.day}
                    </div>
                    <div className="space-y-1">
                      {dayData.sessions.slice(0, 3).map(session => {
                        const typeConfig = COMMUNITY_SESSION_TYPE_CONFIG[session.sessionType] || COMMUNITY_SESSION_TYPE_CONFIG.community_event;
                        return (
                          <button
                            key={session.id}
                            onClick={() => handleEditSession(session)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-xs truncate ${typeConfig.color} hover:opacity-80`}
                          >
                            {session.time?.split(' ')[0]} {session.title?.substring(0, 15)}
                          </button>
                        );
                      })}
                      {dayData.sessions.length > 3 && (
                        <div className="text-xs text-slate-400 px-1">
                          +{dayData.sessions.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendees Modal */}
      {showAttendeesModal && selectedSession && (
        <AttendeesModal
          session={selectedSession}
          registrations={getSessionRegistrations(selectedSession.id)}
          onClose={() => { setShowAttendeesModal(false); setSelectedSession(null); }}
          onMarkAttendance={handleMarkAttendance}
          onRemove={handleRemoveAttendee}
          onSendNotification={() => {
            setShowAttendeesModal(false);
            setShowNotificationModal(true);
          }}
          onExport={() => handleExportAttendees(selectedSession)}
        />
      )}

      {/* Notification Modal */}
      {showNotificationModal && selectedSession && (
        <NotificationModal
          session={selectedSession}
          attendeeCount={getSessionRegistrations(selectedSession.id).length}
          subject={notificationSubject}
          setSubject={setNotificationSubject}
          message={notificationMessage}
          setMessage={setNotificationMessage}
          onSend={handleSendNotification}
          onClose={() => { setShowNotificationModal(false); setSelectedSession(null); }}
        />
      )}
    </div>
  );
};

// Session Edit Form Component
const SessionEditForm = ({ session, setSession, isNew, onSave, onCancel }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-corporate-teal p-6">
      <h3 className="text-lg font-bold text-corporate-navy mb-4">
        {isNew ? 'Create New Session' : 'Edit Session'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Session Title *
          </label>
          <input
            type="text"
            value={session.title}
            onChange={(e) => setSession({...session, title: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
            placeholder="e.g. Weekly Leader Circle"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Session Type
          </label>
          <select
            value={session.sessionType}
            onChange={(e) => setSession({...session, sessionType: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          >
            {Object.entries(COMMUNITY_SESSION_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>

        {/* Host */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Host
          </label>
          <input
            type="text"
            value={session.host}
            onChange={(e) => setSession({...session, host: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
            placeholder="e.g. Community Lead"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={session.date}
            onChange={(e) => setSession({...session, date: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Time *
          </label>
          <input
            type="time"
            value={session.time}
            onChange={(e) => setSession({...session, time: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={session.durationMinutes}
            onChange={(e) => setSession({...session, durationMinutes: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          />
        </div>

        {/* Max Attendees */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Max Attendees
          </label>
          <input
            type="number"
            value={session.maxAttendees}
            onChange={(e) => setSession({...session, maxAttendees: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          />
        </div>

        {/* Recurrence */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Recurrence
          </label>
          <select
            value={session.recurrence || 'none'}
            onChange={(e) => setSession({...session, recurrence: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          >
            <option value="none">None (One-time)</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            value={session.status}
            onChange={(e) => setSession({...session, status: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
          >
            <option value={SESSION_STATUS.SCHEDULED}>Scheduled</option>
            <option value={SESSION_STATUS.COMPLETED}>Completed</option>
            <option value={SESSION_STATUS.CANCELLED}>Cancelled</option>
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={session.description}
            onChange={(e) => setSession({...session, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
            placeholder="Session details..."
          />
        </div>

        {/* Topic/Theme */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Topic / Theme (Optional)
          </label>
          <input
            type="text"
            value={session.topic || ''}
            onChange={(e) => setSession({...session, topic: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
            placeholder="Specific topic for this session"
          />
        </div>

        {/* Zoom Link */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Meeting Link
          </label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={session.zoomLink}
              onChange={(e) => setSession({...session, zoomLink: e.target.value})}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
              placeholder="https://zoom.us/j/..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Session
        </button>
      </div>
    </div>
  );
};

// Session Row Component
const SessionRow = ({ session, registrations, onEdit, onDelete, onDuplicate, onViewAttendees, onUpdateStatus, onExport }) => {
  const typeConfig = COMMUNITY_SESSION_TYPE_CONFIG[session.sessionType] || COMMUNITY_SESSION_TYPE_CONFIG.community_event;
  const isPast = new Date(session.date) < new Date();
  
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${typeConfig.color}`}>
            {typeConfig.icon}
          </div>
          <div>
            <div className="font-medium text-slate-800">{session.title}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {session.host}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-700">{formatDate(session.date)}</div>
        <div className="text-xs text-slate-500">{session.time} ({session.durationMinutes}m)</div>
        {session.recurrence && session.recurrence !== 'none' && (
          <div className="text-xs text-corporate-teal flex items-center gap-1 mt-0.5">
            <Repeat className="w-3 h-3" />
            {session.recurrence}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
          {typeConfig.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-slate-700">
            {registrations.length} / {session.maxAttendees}
          </div>
          <button 
            onClick={onViewAttendees}
            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
            title="View Attendees"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
          <div 
            className="h-full bg-corporate-teal" 
            style={{ width: `${Math.min(100, (registrations.length / session.maxAttendees) * 100)}%` }}
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={session.status}
          onChange={(e) => onUpdateStatus(e.target.value)}
          className={`text-xs font-medium px-2 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
            session.status === SESSION_STATUS.SCHEDULED ? 'bg-blue-100 text-blue-700' :
            session.status === SESSION_STATUS.COMPLETED ? 'bg-slate-100 text-slate-600' :
            'bg-red-100 text-red-700'
          }`}
        >
          <option value={SESSION_STATUS.SCHEDULED}>Scheduled</option>
          <option value={SESSION_STATUS.COMPLETED}>Completed</option>
          <option value={SESSION_STATUS.CANCELLED}>Cancelled</option>
        </select>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="p-1.5 text-slate-500 hover:text-corporate-teal hover:bg-teal-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={onDuplicate}
            className="p-1.5 text-slate-500 hover:text-corporate-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={onExport}
            className="p-1.5 text-slate-500 hover:text-corporate-navy hover:bg-slate-100 rounded-lg transition-colors"
            title="Export Attendees"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Attendees Modal Component
const AttendeesModal = ({ session, registrations, onClose, onMarkAttendance, onRemove, onSendNotification, onExport }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-corporate-navy">Session Attendees</h3>
            <p className="text-sm text-slate-500">{session.title} • {formatDate(session.date)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-3">
          <button 
            onClick={onSendNotification}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Mail className="w-4 h-4" />
            Email Attendees
          </button>
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No attendees registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map(reg => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-corporate-teal/10 flex items-center justify-center text-corporate-teal font-bold text-xs">
                      {reg.userName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{reg.userName}</div>
                      <div className="text-xs text-slate-500">{reg.userEmail}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {reg.status === 'attended' ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Attended
                      </span>
                    ) : reg.status === 'no_show' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> No Show
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => onMarkAttendance(reg, true)}
                          className="p-1.5 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded transition-colors"
                          title="Mark Attended"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onMarkAttendance(reg, false)}
                          className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Mark No Show"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    
                    <button 
                      onClick={() => onRemove(reg)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove Attendee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Notification Modal Component
const NotificationModal = ({ session, attendeeCount, subject, setSubject, message, setMessage, onSend, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-corporate-navy">Email Attendees</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Sending to {attendeeCount} registered attendees
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
              placeholder={`Update regarding ${session.title}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
              placeholder="Type your message here..."
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={!subject || !message}
            className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunitySessionManager;
