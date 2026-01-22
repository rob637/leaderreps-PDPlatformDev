import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Settings, Users, Link as LinkIcon, 
  CheckCircle, Plus, Copy, ChevronRight, X, User,
  Download, ExternalLink, HelpCircle, RefreshCw, CalendarPlus,
  Globe, Bell, ChevronDown, ChevronUp
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../firebase';

/**
 * UnifiedScheduler - Calendar & Booking Management
 * 
 * HOW TO USE:
 * 1. Set your weekly availability hours
 * 2. Create event types (meeting templates)
 * 3. Share your booking link with prospects
 * 4. Sync with external calendars via iCal feed
 * 
 * CALENDAR INTEGRATION:
 * - Google Calendar: Copy iCal URL and paste into "Add calendar by URL"
 * - Outlook: Use "Subscribe to calendar" with iCal URL
 * - Apple Calendar: File > New Calendar Subscription
 */

const UnifiedScheduler = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('availability'); // 'availability' | 'events' | 'bookings' | 'calendar'
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [bookings, setBookings] = useState([]);
  const [showCalendarHelp, setShowCalendarHelp] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState('');

  // Availability State
  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '16:00' },
    saturday: { enabled: false, start: '10:00', end: '14:00' },
    sunday: { enabled: false, start: '10:00', end: '14:00' },
  });

  // Calendar Settings
  const [calendarSettings, setCalendarSettings] = useState({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bufferBefore: 5, // minutes
    bufferAfter: 5,
    minimumNotice: 60, // minutes before booking
    showAvailableSlots: true,
  });

  // Event Types State
  const [eventTypes, setEventTypes] = useState([
    { id: '1', title: 'Intro Chat', duration: 15, type: '1-on-1', color: 'blue' },
    { id: '2', title: 'Platform Demo', duration: 45, type: '1-on-1', color: 'purple' },
    { id: '3', title: 'Onboarding Session', duration: 60, type: 'Group', color: 'emerald' },
  ]);

  // Generate iCal URL
  useEffect(() => {
    if (user) {
      // In production, this would be a Firebase Functions endpoint that generates iCal
      const baseUrl = window.location.origin;
      setCalendarUrl(`${baseUrl}/api/calendar/${user.uid}/feed.ics`);
    }
  }, [user]);

  // Load User Config & Bookings
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Load settings
        const docRef = doc(db, 'users', user.uid, 'settings', 'scheduler');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.availability) setAvailability(data.availability);
          if (data.calendarSettings) setCalendarSettings(data.calendarSettings);
        }
        
        // Load bookings
        const bookingsRef = collection(db, 'users', user.uid, 'bookings');
        const q = query(bookingsRef, orderBy('scheduledAt', 'desc'));
        const snap = await getDocs(q);
        const bookingList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBookings(bookingList);
      } catch (err) {
        console.error("Error loading scheduler settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const saveAvailability = async () => {
    setLoading(true);
    setSaveStatus('');
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'scheduler'), {
        availability,
        calendarSettings,
        updatedAt: new Date()
      }, { merge: true });
      setSaveStatus('create-success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error("Error saving:", err);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Generate downloadable ICS file
  const generateICSFile = (booking) => {
    const start = new Date(booking.scheduledAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(new Date(booking.scheduledAt).getTime() + booking.duration * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LeaderReps//Command Center//EN
BEGIN:VEVENT
UID:${booking.id}@leaderreps.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${start}
DTEND:${end}
SUMMARY:${booking.eventTitle} with ${booking.guestName}
DESCRIPTION:${booking.notes || 'Scheduled via LeaderReps'}
ORGANIZER:mailto:${user?.email}
ATTENDEE:mailto:${booking.guestEmail}
END:VEVENT
END:VCALENDAR`;
    
    return ics;
  };
  
  const downloadICS = (booking) => {
    const ics = generateICSFile(booking);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${booking.eventTitle.replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const DayRow = ({ day, label }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4">
        <input 
          type="checkbox" 
          checked={availability[day].enabled}
          onChange={(e) => setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: e.target.checked }
          }))}
          className="w-5 h-5 text-corporate-teal rounded border-slate-300 focus:ring-corporate-teal"
        />
        <span className="font-medium text-slate-700 w-24 capitalize">{label}</span>
      </div>
      
      {availability[day].enabled ? (
        <div className="flex items-center gap-2">
          <input 
            type="time" 
            value={availability[day].start}
            onChange={(e) => setAvailability(prev => ({
              ...prev,
              [day]: { ...prev[day], start: e.target.value }
            }))}
            className="border border-slate-300 rounded px-2 py-1 text-sm bg-slate-50"
          />
          <span className="text-slate-400">-</span>
          <input 
            type="time" 
            value={availability[day].end}
            onChange={(e) => setAvailability(prev => ({
              ...prev,
              [day]: { ...prev[day], end: e.target.value }
            }))}
            className="border border-slate-300 rounded px-2 py-1 text-sm bg-slate-50"
          />
        </div>
      ) : (
        <span className="text-slate-400 text-sm italic pr-8">Unavailable</span>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">Unified Scheduler</h1>
          <p className="text-slate-500 mt-1">Manage your availability and booking types.</p>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => {
                  if (user) {
                     const url = `${window.location.origin}/book/${user.uid}`;
                     navigator.clipboard.writeText(url);
                     alert("Copied Public Booking Link: " + url);
                  }
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium"
             >
                <LinkIcon className="w-4 h-4" />
                Copy Booking Link
             </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <nav className="flex flex-col">
              <button 
                onClick={() => setActiveTab('availability')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                  activeTab === 'availability' 
                    ? 'border-corporate-teal bg-teal-50 text-corporate-teal' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Availability
              </button>
              <button 
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                  activeTab === 'events' 
                    ? 'border-corporate-teal bg-teal-50 text-corporate-teal' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                Event Types
              </button>
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                  activeTab === 'bookings' 
                    ? 'border-corporate-teal bg-teal-50 text-corporate-teal' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Upcoming
              </button>
              <button 
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                  activeTab === 'calendar' 
                    ? 'border-corporate-teal bg-teal-50 text-corporate-teal' 
                    : 'border-transparent text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CalendarPlus className="w-4 h-4" />
                Calendar Sync
              </button>
            </nav>
          </div>
        </div>

        {/* content Area */}
        <div className="col-span-9">
          
          {/* Availability Editor */}
          {activeTab === 'availability' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <h2 className="text-lg font-bold text-slate-800">Weekly Hours</h2>
                 <button 
                    onClick={saveAvailability}
                    disabled={loading}
                    className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center gap-2"
                 >
                    {loading ? 'Saving...' : 'Save Changes'}
                    {saveStatus === 'create-success' && <CheckCircle className="w-4 h-4" />}
                 </button>
              </div>

              <div className="space-y-1">
                <DayRow day="monday" label="Monday" />
                <DayRow day="tuesday" label="Tuesday" />
                <DayRow day="wednesday" label="Wednesday" />
                <DayRow day="thursday" label="Thursday" />
                <DayRow day="friday" label="Friday" />
                <DayRow day="saturday" label="Saturday" />
                <DayRow day="sunday" label="Sunday" />
              </div>
            </div>
          )}

          {/* Event Types */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventTypes.map(event => (
                <div key={event.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:border-corporate-teal transition-colors">
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl bg-${event.color}-500`}></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                        <h3 className="font-bold text-slate-800">{event.title}</h3>
                        <div className="flex items-center gap-1">
                             <Settings className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                        </div>
                    </div>
                    <div className="pl-2 flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {event.duration}m
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {event.type}
                        </span>
                    </div>
                    <div className="pl-2 border-t border-slate-100 pt-3 flex justify-between items-center">
                        <button className="text-corporate-teal text-sm font-medium hover:underline">Edit Details</button>
                        <button className="text-slate-400 text-sm hover:text-corporate-teal flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy Link
                        </button>
                    </div>
                </div>
              ))}
              
              <button className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:border-corporate-teal hover:text-corporate-teal hover:bg-slate-50 transition-all">
                <Plus className="w-8 h-8 mb-2 opacity-50" />
                <span className="font-medium">New Event Type</span>
              </button>
            </div>
          )}

           {/* Bookings List */}
           {activeTab === 'bookings' && (
             <div className="space-y-4">
               {/* Instructions */}
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                 <HelpCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                 <div>
                   <h4 className="font-medium text-blue-800 text-sm">How Bookings Work</h4>
                   <p className="text-xs text-blue-700 mt-1">
                     When someone schedules time via your booking link, it appears here.
                     Click the download icon to add to your personal calendar.
                   </p>
                 </div>
               </div>

               {bookings.length === 0 ? (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No bookings yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-4">
                        Once people schedule time with you using your link, they will appear here.
                    </p>
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}/book/${user?.uid}`;
                        navigator.clipboard.writeText(url);
                        alert("Copied! Share this link:\n" + url);
                      }}
                      className="text-corporate-teal text-sm font-medium hover:underline"
                    >
                      Copy your booking link to share
                    </button>
                 </div>
               ) : (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <div className="p-4 border-b border-slate-200 bg-slate-50">
                     <h3 className="font-bold text-corporate-navy">Your Bookings</h3>
                   </div>
                   <div className="divide-y divide-slate-100">
                     {bookings.map(booking => {
                       const isPast = new Date(booking.scheduledAt) < new Date();
                       return (
                         <div key={booking.id} className={`p-4 ${isPast ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPast ? 'bg-slate-200' : 'bg-corporate-teal/10'}`}>
                                 <Calendar className={`w-5 h-5 ${isPast ? 'text-slate-400' : 'text-corporate-teal'}`} />
                               </div>
                               <div>
                                 <h4 className="font-bold text-corporate-navy">{booking.eventTitle}</h4>
                                 <p className="text-sm text-slate-500">
                                   with <span className="font-medium">{booking.guestName}</span> ({booking.guestEmail})
                                 </p>
                                 <p className="text-xs text-slate-400 mt-1">
                                   {new Date(booking.scheduledAt).toLocaleDateString()} at {new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {booking.duration}min
                                 </p>
                               </div>
                             </div>
                             <div className="flex items-center gap-2">
                               {isPast ? (
                                 <span className="px-2 py-1 rounded text-xs font-medium bg-slate-200 text-slate-500">Past</span>
                               ) : (
                                 <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Upcoming</span>
                               )}
                               <button 
                                 onClick={() => downloadICS(booking)}
                                 className="p-2 text-slate-400 hover:text-corporate-teal hover:bg-slate-100 rounded-lg"
                                 title="Download .ics file"
                               >
                                 <Download size={16} />
                               </button>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Calendar Sync Tab */}
           {activeTab === 'calendar' && (
             <div className="space-y-6">
               {/* Sync Overview */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h2 className="text-lg font-bold text-corporate-navy mb-2 flex items-center gap-2">
                   <CalendarPlus size={20} />
                   Connect Your Calendar
                 </h2>
                 <p className="text-slate-500 text-sm mb-6">
                   Sync your LeaderReps bookings with external calendars using iCal feeds.
                 </p>

                 {/* iCal Feed URL */}
                 <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-6">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                     Your Calendar Feed URL (iCal)
                   </label>
                   <div className="flex items-center gap-2">
                     <input 
                       type="text" 
                       readOnly 
                       value={calendarUrl || 'Loading...'}
                       className="flex-1 bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono text-slate-600"
                     />
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(calendarUrl);
                         alert('Calendar URL copied!');
                       }}
                       className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 flex items-center gap-1"
                     >
                       <Copy size={14} /> Copy
                     </button>
                   </div>
                   <p className="text-xs text-slate-400 mt-2">
                     ⚠️ Keep this URL private - anyone with this link can see your bookings
                   </p>
                 </div>

                 {/* Integration Instructions */}
                 <div className="space-y-4">
                   <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">
                     Setup Instructions
                   </h3>
                   
                   {/* Google Calendar */}
                   <div className="border border-slate-200 rounded-lg overflow-hidden">
                     <button 
                       onClick={() => setShowCalendarHelp(showCalendarHelp === 'google' ? false : 'google')}
                       className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                           <span className="text-xl">📅</span>
                         </div>
                         <div className="text-left">
                           <h4 className="font-bold text-corporate-navy">Google Calendar</h4>
                           <p className="text-xs text-slate-500">Subscribe to calendar feed</p>
                         </div>
                       </div>
                       {showCalendarHelp === 'google' ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                     </button>
                     {showCalendarHelp === 'google' && (
                       <div className="border-t border-slate-200 bg-slate-50 p-4">
                         <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                           <li>Open <a href="https://calendar.google.com" target="_blank" rel="noopener" className="text-corporate-teal hover:underline">Google Calendar</a></li>
                           <li>Click the <strong>+</strong> next to "Other calendars" in the left sidebar</li>
                           <li>Select <strong>"From URL"</strong></li>
                           <li>Paste your calendar feed URL above</li>
                           <li>Click <strong>"Add calendar"</strong></li>
                         </ol>
                         <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                           💡 Sync may take up to 24 hours. Google refreshes subscribed calendars periodically.
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Outlook */}
                   <div className="border border-slate-200 rounded-lg overflow-hidden">
                     <button 
                       onClick={() => setShowCalendarHelp(showCalendarHelp === 'outlook' ? false : 'outlook')}
                       className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                           <span className="text-xl">📧</span>
                         </div>
                         <div className="text-left">
                           <h4 className="font-bold text-corporate-navy">Outlook / Microsoft 365</h4>
                           <p className="text-xs text-slate-500">Subscribe to web calendar</p>
                         </div>
                       </div>
                       {showCalendarHelp === 'outlook' ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                     </button>
                     {showCalendarHelp === 'outlook' && (
                       <div className="border-t border-slate-200 bg-slate-50 p-4">
                         <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                           <li>Open <a href="https://outlook.live.com/calendar" target="_blank" rel="noopener" className="text-corporate-teal hover:underline">Outlook Calendar</a></li>
                           <li>Click <strong>"Add calendar"</strong> → <strong>"Subscribe from web"</strong></li>
                           <li>Paste your calendar feed URL</li>
                           <li>Name it "LeaderReps Bookings"</li>
                           <li>Click <strong>"Import"</strong></li>
                         </ol>
                       </div>
                     )}
                   </div>

                   {/* Apple Calendar */}
                   <div className="border border-slate-200 rounded-lg overflow-hidden">
                     <button 
                       onClick={() => setShowCalendarHelp(showCalendarHelp === 'apple' ? false : 'apple')}
                       className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                           <span className="text-xl">🍎</span>
                         </div>
                         <div className="text-left">
                           <h4 className="font-bold text-corporate-navy">Apple Calendar (Mac/iOS)</h4>
                           <p className="text-xs text-slate-500">New calendar subscription</p>
                         </div>
                       </div>
                       {showCalendarHelp === 'apple' ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                     </button>
                     {showCalendarHelp === 'apple' && (
                       <div className="border-t border-slate-200 bg-slate-50 p-4">
                         <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                           <li>Open <strong>Calendar</strong> app on Mac</li>
                           <li>Go to <strong>File</strong> → <strong>New Calendar Subscription...</strong></li>
                           <li>Paste your calendar feed URL</li>
                           <li>Set refresh to "Every hour" for faster updates</li>
                           <li>Click <strong>"OK"</strong></li>
                         </ol>
                         <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                           📱 On iPhone: Settings → Calendar → Accounts → Add Subscribed Calendar
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* Advanced Settings */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <h3 className="font-bold text-corporate-navy mb-4 flex items-center gap-2">
                   <Settings size={18} />
                   Booking Settings
                 </h3>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
                     <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                       <Globe size={16} className="text-slate-400" />
                       {calendarSettings.timezone}
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Minimum Notice (hours)</label>
                     <select 
                       value={calendarSettings.minimumNotice}
                       onChange={(e) => setCalendarSettings(prev => ({ ...prev, minimumNotice: parseInt(e.target.value) }))}
                       className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                     >
                       <option value={30}>30 minutes</option>
                       <option value={60}>1 hour</option>
                       <option value={120}>2 hours</option>
                       <option value={240}>4 hours</option>
                       <option value={1440}>24 hours</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Buffer Before (minutes)</label>
                     <select 
                       value={calendarSettings.bufferBefore}
                       onChange={(e) => setCalendarSettings(prev => ({ ...prev, bufferBefore: parseInt(e.target.value) }))}
                       className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                     >
                       <option value={0}>No buffer</option>
                       <option value={5}>5 minutes</option>
                       <option value={10}>10 minutes</option>
                       <option value={15}>15 minutes</option>
                     </select>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Buffer After (minutes)</label>
                     <select 
                       value={calendarSettings.bufferAfter}
                       onChange={(e) => setCalendarSettings(prev => ({ ...prev, bufferAfter: parseInt(e.target.value) }))}
                       className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                     >
                       <option value={0}>No buffer</option>
                       <option value={5}>5 minutes</option>
                       <option value={10}>10 minutes</option>
                       <option value={15}>15 minutes</option>
                     </select>
                   </div>
                 </div>

                 <button 
                   onClick={saveAvailability}
                   disabled={loading}
                   className="mt-6 bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 flex items-center gap-2"
                 >
                   {loading ? 'Saving...' : 'Save Settings'}
                   {saveStatus === 'create-success' && <CheckCircle className="w-4 h-4" />}
                 </button>
               </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default UnifiedScheduler;
