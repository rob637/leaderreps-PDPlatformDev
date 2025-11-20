import React from 'react';
import { Video, Calendar } from 'lucide-react';

const LiveEvents = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Live Events</h1>
      <p className="text-slate-500">Town halls, workshops, and expert Q&A.</p>
    </header>
    <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center mb-8">
      <div className="text-center">
        <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No live event currently broadcasting.</p>
      </div>
    </div>
    <h2 className="text-xl font-bold text-corporate-navy mb-4">Upcoming Events</h2>
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-lg text-center min-w-[60px]">
          <span className="block text-xs font-bold uppercase">Nov</span>
          <span className="block text-xl font-bold">25</span>
        </div>
        <div>
          <h3 className="font-bold text-corporate-navy">Leadership in Crisis</h3>
          <p className="text-sm text-slate-500">2:00 PM EST • with Ryan Young</p>
        </div>
        <button className="ml-auto px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold">
          Register
        </button>
      </div>
    </div>
  </div>
);
export default LiveEvents;
