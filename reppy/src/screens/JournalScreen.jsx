import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress, useTheme } from '../App';
import { FOCUSES } from '../data/focuses';
import { getThemeClasses } from '../theme';

export default function JournalScreen() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [filter, setFilter] = useState('all'); // all, starred, focus

  const completedSessions = progress?.completedSessions || [];
  
  // Group sessions by focus
  const sessionsByFocus = {};
  completedSessions.forEach(session => {
    const focusId = session.focusId || 'unknown';
    if (!sessionsByFocus[focusId]) {
      sessionsByFocus[focusId] = [];
    }
    sessionsByFocus[focusId].push(session);
  });

  // Get focus details
  const getFocusDetails = (focusId) => {
    return FOCUSES.find(f => f.id === focusId) || { title: 'Unknown', icon: '📚' };
  };

  // Format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Get all sessions sorted by date (newest first)
  const allSessions = [...completedSessions].reverse();

  // Theme colors (using centralized theme + custom overrides for glass cards)
  const bg = isDark ? 'gradient-focus' : 'theme-bg';
  const cardBg = isDark ? 'glass-card' : 'bg-white shadow-md rounded-xl border border-gray-100';

  return (
    <div className={`min-h-screen safe-area-top safe-area-bottom relative overflow-hidden page-enter ${bg}`}>
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 -right-20 w-60 h-60 rounded-full blur-3xl ${
          isDark ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/20' : 'bg-gradient-to-br from-indigo-400/20 to-purple-400/10'
        }`} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-4 pb-4">
        <div className="mb-4">
          <h1 className={`text-xl font-bold ${theme.textPrimary} text-center`}>Your Journal</h1>
        </div>

        {/* Stats summary */}
        <div className={`${cardBg} p-4 mb-4`}>
          <div className="flex items-center justify-around text-center">
            <div>
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>{completedSessions.length}</div>
              <div className={`text-xs ${theme.textMuted}`}>Sessions</div>
            </div>
            <div className={`w-px h-10 ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`} />
            <div>
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>{Object.keys(sessionsByFocus).length}</div>
              <div className={`text-xs ${theme.textMuted}`}>Focuses</div>
            </div>
            <div className={`w-px h-10 ${isDark ? 'bg-gray-700' : 'bg-slate-200'}`} />
            <div>
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>{progress?.totalMinutes || 0}</div>
              <div className={`text-xs ${theme.textMuted}`}>Minutes</div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'by-focus'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : isDark 
                    ? 'bg-gray-700 text-gray-400' 
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f === 'all' ? 'Timeline' : 'By Focus'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pb-24 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {completedSessions.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📝</span>
            <h3 className={`font-semibold mb-2 ${theme.textPrimary}`}>Your journal is empty</h3>
            <p className={`text-sm ${theme.textSecondary}`}>
              Complete sessions to start building your leadership journal.
            </p>
          </div>
        ) : filter === 'all' ? (
          /* Timeline View */
          <div className="space-y-4 mt-4">
            {allSessions.map((session, index) => {
              const focus = getFocusDetails(session.focusId);
              return (
                <div key={index} className={`${cardBg} p-4`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${focus.gradient || 'from-blue-500 to-indigo-600'} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg">{focus.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium text-sm ${theme.textPrimary}`}>{focus.title}</h4>
                        <span className={`text-xs ${theme.textMuted}`}>{formatDate(session.completedAt)}</span>
                      </div>
                      <p className={`text-xs ${theme.textSecondary} mb-2`}>
                        {session.theme?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {session.duration || 5} min
                      </p>
                      {session.reflection && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}>
                          <p className={`font-serif-reflection italic ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            "{session.reflection.substring(0, 200)}{session.reflection.length > 200 ? '...' : ''}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* By Focus View */
          <div className="space-y-6 mt-4">
            {Object.entries(sessionsByFocus).map(([focusId, sessions]) => {
              const focus = getFocusDetails(focusId);
              return (
                <div key={focusId}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{focus.icon}</span>
                    <h3 className={`font-semibold ${theme.textPrimary}`}>{focus.title}</h3>
                    <span className={`text-xs ${theme.textMuted}`}>({sessions.length} sessions)</span>
                  </div>
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div key={index} className={`${cardBg} p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${theme.textPrimary}`}>
                            {session.theme?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`text-xs ${theme.textMuted}`}>{formatDate(session.completedAt)}</span>
                        </div>
                        {session.reflection && (
                          <p className={`font-serif-reflection italic ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            "{session.reflection.substring(0, 150)}{session.reflection.length > 150 ? '...' : ''}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
