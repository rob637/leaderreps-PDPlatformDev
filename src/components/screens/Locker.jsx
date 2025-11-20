import React from 'react';
import { useAppServices } from '../../services/useAppServices';
import { Card } from '../shared/UI';
import { Archive, CheckCircle, Calendar, Trophy, BookOpen, ArrowLeft } from 'lucide-react';

const Locker = () => {
  const { dailyPracticeData, commitmentData, navigate } = useAppServices();

  // Arena Data
  // Assuming winsList is an array of { text, completed, date } objects
  // If it's not present, default to empty array
  const winsList = dailyPracticeData?.winsList || [];
  
  // Evening Bookend Data
  const eveningBookend = dailyPracticeData?.eveningBookend || {};
  
  // Scorecard Data
  const commitmentHistory = commitmentData?.history || [];

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Back Button */}
      <div className="flex justify-start mb-2">
          <div className="flex items-center gap-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors" onClick={() => navigate('dashboard')}>
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
          </div>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#002E47] flex items-center gap-3">
          <Archive className="w-8 h-8 text-corporate-teal" />
          The Locker
        </h1>
        <p className="text-slate-600 mt-2">
          Your repository of completed reps, wins, and reflections.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wins History */}
        <Card title="Win the Day History" icon={Trophy} className="border-t-4 border-corporate-orange">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {winsList.length > 0 ? (
              winsList.map((win, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[#002E47]">{win.text || "Untitled Win"}</span>
                    <span className="text-xs text-slate-400">{win.date || ''}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {win.completed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Won
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">No wins recorded yet.</p>
            )}
          </div>
        </Card>

        {/* Commitment History (Scorecard) */}
        <Card title="Scorecard History" icon={Calendar} className="border-t-4 border-corporate-teal">
           <div className="space-y-4 max-h-96 overflow-y-auto">
            {commitmentHistory.length > 0 ? (
              commitmentHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-mono font-bold text-slate-600">{entry.date}</span>
                  <span className={`font-bold ${entry.score && entry.score.includes('/') && entry.score.split('/')[0] === entry.score.split('/')[1] ? 'text-green-600' : 'text-orange-600'}`}>
                    {entry.score}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic">No scorecard history available.</p>
            )}
          </div>
        </Card>

        {/* Reflections (Current/Latest) */}
        <Card title="Latest Reflection" icon={BookOpen} className="lg:col-span-2 border-t-4 border-corporate-navy">
          {eveningBookend.reflection ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Evening Reflection</h3>
              <p className="text-slate-700 whitespace-pre-wrap">{eveningBookend.reflection}</p>
              {eveningBookend.timestamp && (
                 <p className="text-xs text-slate-400 mt-4 text-right">
                    Saved: {new Date(eveningBookend.timestamp).toLocaleString()}
                 </p>
              )}
            </div>
          ) : (
            <p className="text-slate-500 italic">No reflection recorded for today.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Locker;
