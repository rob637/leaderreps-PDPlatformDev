// src/components/admin/SessionManager.jsx
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
  UserX
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
  COACHING_SESSIONS_COLLECTION,
  COACHING_SESSION_TYPES_COLLECTION,
  COACHING_REGISTRATIONS_COLLECTION,
  SESSION_TYPES,
  SESSION_STATUS
} from '../../data/Constants';

// Session Type Configurations for display
const SESSION_TYPE_CONFIG = {
  open_gym: {
    label: 'Open Gym',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '🏋️'
  },
  leader_circle: {
    label: 'Leader Circle',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '🔮'
  },
  live_workout: {
    label: 'Live Workout',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    icon: '⚡'
  },
  workshop: {
    label: 'Workshop',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '📚'
  },
  one_on_one: {
    label: '1:1 Coaching',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '👤'
  }
};

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  live: { label: 'Live Now', color: 'bg-green-100 text-green-700', icon: Play },
  completed: { label: 'Completed', color: 'bg-slate-100 text-slate-600', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle }
};

// Format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return 'TBD';
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
  // Convert "2:00 PM" to "14:00"
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
 * SessionManager - Admin interface for managing coaching sessions
 * 
 * Features:
 * - Create/Edit/Delete sessions
 * - View enrolled attendees
 * - Send notes and notifications
 * - Manage session status
 */
const SessionManager = () => {
  const { db } = useAppServices();
  
  // Data state
  const [sessions, setSessions] = useState([]);
  const [_sessionTypes, setSessionTypes] = useState([]);
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
  const [_editingType, _setEditingType] = useState(null);
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
    const sessionsRef = collection(db, COACHING_SESSIONS_COLLECTION);
    const sessionsQuery = query(sessionsRef, orderBy('date', 'desc'));
    
    const unsubSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessions(items);
    });
    
    // Listen to session types
    const typesRef = collection(db, COACHING_SESSION_TYPES_COLLECTION);
    const unsubTypes = onSnapshot(typesRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSessionTypes(items);
    });
    
    // Listen to registrations
    const regsRef = collection(db, COACHING_REGISTRATIONS_COLLECTION);
    const unsubRegs = onSnapshot(regsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistrations(items);
      setLoading(false);
    });
    
    return () => {
      unsubSessions();
      unsubTypes();
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
        s.coach?.toLowerCase().includes(term) ||
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

  // Session CRUD Operations
  const handleCreateSession = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setEditingSession({
      title: '',
      description: '',
      sessionType: 'open_gym',
      coach: 'Ryan',
      date: nextWeek.toISOString().split('T')[0],
      time: '12:00',
      durationMinutes: 60,
      maxAttendees: 20,
      status: SESSION_STATUS.SCHEDULED,
      zoomLink: '',
      replayUrl: '',
      notesUrl: '',
      skillFocus: [],
      targetAudience: '',
      prerequisites: ''
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
        ? `${editingSession.sessionType}-${editingSession.date}-${Date.now()}`
        : editingSession.id;
      
      const sessionData = {
        ...editingSession,
        id: sessionId,
        time: formatTimeForDisplay(editingSession.time),
        updatedAt: serverTimestamp(),
        ...(isCreatingNew && { createdAt: serverTimestamp() })
      };
      
      const docRef = doc(db, COACHING_SESSIONS_COLLECTION, sessionId);
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
      await deleteDoc(doc(db, COACHING_SESSIONS_COLLECTION, session.id));
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session: ' + error.message);
    }
  };

  const handleDuplicateSession = (session) => {
    const nextWeek = new Date(session.date);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    setEditingSession({
      ...session,
      id: null,
      date: nextWeek.toISOString().split('T')[0],
      time: formatTimeForInput(session.time),
      status: SESSION_STATUS.SCHEDULED,
      zoomLink: '',
      replayUrl: '',
      notesUrl: ''
    });
    setIsCreatingNew(true);
  };

  const handleUpdateStatus = async (session, newStatus) => {
    try {
      await updateDoc(doc(db, COACHING_SESSIONS_COLLECTION, session.id), {
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
      await updateDoc(doc(db, COACHING_REGISTRATIONS_COLLECTION, registration.id), {
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
      await updateDoc(doc(db, COACHING_REGISTRATIONS_COLLECTION, registration.id), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'admin'
      });
    } catch (error) {
      console.error('Error removing attendee:', error);
    }
  };

  // Notification (placeholder - would integrate with email/push service)
  const handleSendNotification = async () => {
    if (!notificationSubject || !notificationMessage) {
      alert('Please enter a subject and message');
      return;
    }

    const attendees = getSessionRegistrations(selectedSession.id);
    
    // In a real implementation, this would call a Cloud Function
    console.log('[SessionManager] Sending notification to attendees:', {
      sessionId: selectedSession.id,
      subject: notificationSubject,
      message: notificationMessage,
      recipientCount: attendees.length,
      recipients: attendees.map(a => ({ email: a.userEmail, name: a.userName }))
    });
    
    alert(`Notification would be sent to ${attendees.length} attendee(s).\n\nNote: Email integration requires backend setup.`);
    
    setShowNotificationModal(false);
    setNotificationSubject('');
    setNotificationMessage('');
  };

  // Export attendees to CSV
  const handleExportAttendees = (session) => {
    const attendees = getSessionRegistrations(session.id);
    const csvContent = [
      ['Name', 'Email', 'Status', 'Registered At'].join(','),
      ...attendees.map(a => [
        a.userName || 'Unknown',
        a.userEmail || '',
        a.status || 'registered',
        a.registeredAt?.toDate?.()?.toLocaleDateString() || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calendar View Helpers
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, sessions: [] });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = filteredSessions.filter(s => s.date === dateStr);
      days.push({ day, dateStr, sessions: daySessions });
    }
    
    return days;
  }, [currentMonth, filteredSessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-corporate-navy">Session Manager</h2>
          <p className="text-slate-500">Create, edit, and manage coaching sessions</p>
        </div>
        <button
          onClick={handleCreateSession}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Session
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-corporate-navy">
                {sessions.filter(s => s.status === 'scheduled').length}
              </p>
              <p className="text-xs text-slate-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-corporate-navy">
                {registrations.filter(r => r.status === 'registered').length}
              </p>
              <p className="text-xs text-slate-500">Registrations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-corporate-navy">
                {sessions.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-xs text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-corporate-navy">
                {registrations.filter(r => r.status === 'attended').length}
              </p>
              <p className="text-xs text-slate-500">Attended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            >
              <option value="all">All Types</option>
              {Object.entries(SESSION_TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
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
                        const typeConfig = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.workshop;
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
            value={session.title || ''}
            onChange={(e) => setSession({ ...session, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            placeholder="e.g., Open Gym: Feedback Skills"
          />
        </div>
        
        {/* Session Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Session Type *
          </label>
          <select
            value={session.sessionType || 'open_gym'}
            onChange={(e) => setSession({ ...session, sessionType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
          >
            {Object.entries(SESSION_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.label}</option>
            ))}
          </select>
        </div>
        
        {/* Coach */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Coach / Facilitator
          </label>
          <input
            type="text"
            value={session.coach || ''}
            onChange={(e) => setSession({ ...session, coach: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            placeholder="e.g., Ryan"
          />
        </div>
        
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={session.date || ''}
            onChange={(e) => setSession({ ...session, date: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
          />
        </div>
        
        {/* Time */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Time
          </label>
          <input
            type="time"
            value={session.time || '12:00'}
            onChange={(e) => setSession({ ...session, time: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
          />
        </div>
        
        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={session.durationMinutes || 60}
            onChange={(e) => setSession({ ...session, durationMinutes: parseInt(e.target.value) || 60 })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            min="15"
            max="180"
          />
        </div>
        
        {/* Max Attendees */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Max Attendees
          </label>
          <input
            type="number"
            value={session.maxAttendees || 20}
            onChange={(e) => setSession({ ...session, maxAttendees: parseInt(e.target.value) || 20 })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            min="1"
            max="500"
          />
        </div>
        
        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={session.description || ''}
            onChange={(e) => setSession({ ...session, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            rows={3}
            placeholder="What will attendees learn or practice?"
          />
        </div>
        
        {/* Zoom Link */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Video className="w-4 h-4 inline mr-1" />
            Zoom/Meeting Link
          </label>
          <input
            type="url"
            value={session.zoomLink || ''}
            onChange={(e) => setSession({ ...session, zoomLink: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            placeholder="https://zoom.us/j/..."
          />
        </div>
        
        {/* Replay URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Play className="w-4 h-4 inline mr-1" />
            Replay URL
          </label>
          <input
            type="url"
            value={session.replayUrl || ''}
            onChange={(e) => setSession({ ...session, replayUrl: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            placeholder="https://..."
          />
        </div>
        
        {/* Notes URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <LinkIcon className="w-4 h-4 inline mr-1" />
            Session Notes URL
          </label>
          <input
            type="url"
            value={session.notesUrl || ''}
            onChange={(e) => setSession({ ...session, notesUrl: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            placeholder="https://..."
          />
        </div>
        
        {/* Status (for editing only) */}
        {!isNew && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={session.status || 'scheduled'}
              onChange={(e) => setSession({ ...session, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isNew ? 'Create Session' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// Session Row Component
const SessionRow = ({ 
  session, 
  registrations, 
  onEdit, 
  onDelete, 
  onDuplicate,
  onViewAttendees, 
  onUpdateStatus,
  onExport 
}) => {
  const [showActions, setShowActions] = useState(false);
  const typeConfig = SESSION_TYPE_CONFIG[session.sessionType] || SESSION_TYPE_CONFIG.workshop;
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const StatusIcon = statusConfig.icon;
  
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-slate-800">{session.title}</p>
          <p className="text-sm text-slate-500">{session.coach && `with ${session.coach}`}</p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{formatDate(session.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{session.time || 'TBD'}</span>
          {session.durationMinutes && <span>({session.durationMinutes} min)</span>}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
          {typeConfig.icon} {typeConfig.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onViewAttendees}
          className="flex items-center gap-2 text-sm text-corporate-teal hover:underline"
        >
          <Users className="w-4 h-4" />
          {registrations.length}/{session.maxAttendees || 20}
        </button>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1">
                <button
                  onClick={() => { onEdit(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit className="w-4 h-4" /> Edit Session
                </button>
                <button
                  onClick={() => { onDuplicate(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                <button
                  onClick={() => { onViewAttendees(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Users className="w-4 h-4" /> View Attendees
                </button>
                <button
                  onClick={() => { onExport(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Download className="w-4 h-4" /> Export Attendees
                </button>
                <div className="border-t border-slate-100 my-1" />
                {session.status === 'scheduled' && (
                  <button
                    onClick={() => { onUpdateStatus('live'); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                  >
                    <Play className="w-4 h-4" /> Start Session
                  </button>
                )}
                {session.status === 'live' && (
                  <button
                    onClick={() => { onUpdateStatus('completed'); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete Session
                  </button>
                )}
                {session.status !== 'cancelled' && session.status !== 'completed' && (
                  <button
                    onClick={() => { onUpdateStatus('cancelled'); setShowActions(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <XCircle className="w-4 h-4" /> Cancel Session
                  </button>
                )}
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => { onDelete(); setShowActions(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

// Attendees Modal Component
const AttendeesModal = ({ 
  session, 
  registrations, 
  onClose, 
  onMarkAttendance,
  onRemove,
  onSendNotification,
  onExport
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-corporate-navy">Session Attendees</h3>
            <p className="text-sm text-slate-500">{session.title} - {formatDate(session.date)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-100 flex gap-2">
          <button
            onClick={onSendNotification}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-corporate-teal text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" /> Send Notification
          </button>
          <button
            onClick={onExport}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[400px]">
          {registrations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No attendees registered yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Email</th>
                  <th className="text-left px-4 py-2 text-xs font-bold text-slate-500">Status</th>
                  <th className="text-right px-4 py-2 text-xs font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">
                      {reg.userName || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {reg.userEmail || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        reg.status === 'attended' 
                          ? 'bg-green-100 text-green-700'
                          : reg.status === 'no_show'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {reg.status === 'attended' ? '✓ Attended' : 
                         reg.status === 'no_show' ? '✗ No Show' : 'Registered'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {reg.status === 'registered' && (
                          <>
                            <button
                              onClick={() => onMarkAttendance(reg, true)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Mark Attended"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onMarkAttendance(reg, false)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title="Mark No Show"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onRemove(reg)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
          Total: {registrations.length} attendee(s)
        </div>
      </div>
    </div>
  );
};

// Notification Modal Component
const NotificationModal = ({ 
  session, 
  attendeeCount,
  subject,
  setSubject,
  message,
  setMessage,
  onSend,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-corporate-navy">Send Notification</h3>
            <p className="text-sm text-slate-500">To {attendeeCount} attendee(s) of {session.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
              placeholder="e.g., Session Reminder"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal"
              rows={5}
              placeholder="Enter your message to attendees..."
            />
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Email delivery requires backend integration with SendGrid, Mailgun, or similar service.
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700"
          >
            <Send className="w-4 h-4" /> Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
