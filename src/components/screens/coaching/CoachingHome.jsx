import React from 'react';
import PageLayout from '../../ui/PageLayout.jsx';

const CoachingHome = () => {
  return (
    <PageLayout title="Coaching Hub" breadcrumbs={[{ label: 'Coaching', path: 'coaching' }]}>
      <div className="p-6 space-y-6">
        
        {/* Hero / Upcoming */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Live Coaching</h2>
          <p className="opacity-90 mb-6">Join live sessions to practice with peers and expert coaches.</p>
          <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider bg-green-400 text-green-900 px-2 py-1 rounded">Upcoming</span>
                <h3 className="text-lg font-bold mt-2">Open Gym: Feedback Scenarios</h3>
                <p className="text-sm opacity-80">Tuesday, 12:00 PM • Coach Ryan</p>
              </div>
              <button className="bg-white dark:bg-slate-800 text-blue-700 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors">
                Register Now
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* On-Demand */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">On-Demand Coaching</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center">🤖</div>
                <div>
                  <div className="font-bold text-gray-700 dark:text-gray-200">AI Feedback Coach</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Practice anytime</div>
                </div>
              </div>
              <div className="p-3 border rounded hover:bg-gray-50 cursor-pointer flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center">👤</div>
                <div>
                  <div className="font-bold text-gray-700 dark:text-gray-200">Request 1:1 Coaching</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Get personal guidance</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Coaching */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">My Coaching</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No past sessions yet.</p>
              <button className="mt-4 text-blue-600 text-sm font-medium hover:underline">View History</button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CoachingHome;
