import React from 'react';
import { PlayCircle, Clock, CheckCircle } from 'lucide-react';

const CourseLibrary = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Course Library</h1>
      <p className="text-slate-500">Deep-dive video modules for applied leadership.</p>
    </header>
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex gap-6 items-center">
          <div className="w-48 h-32 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <PlayCircle className="w-12 h-12 text-white opacity-80" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">Module {i}</span>
              <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" /> 45 mins</span>
            </div>
            <h3 className="font-bold text-xl text-corporate-navy mb-2">Advanced Team Dynamics</h3>
            <p className="text-slate-500">Master the art of building high-performing teams through psychological safety and clear accountability.</p>
          </div>
          <button className="px-6 py-3 bg-corporate-navy text-white rounded-lg font-semibold hover:bg-slate-700">
            Start Module
          </button>
        </div>
      ))}
    </div>
  </div>
);
export default CourseLibrary;
