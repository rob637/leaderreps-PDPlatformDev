import React from 'react';
import { BookOpen, Star, ArrowRight } from 'lucide-react';

const ReadingHub = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Professional Reading Hub</h1>
      <p className="text-slate-500">Curated summaries and insights for leaders.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="h-40 bg-slate-100 rounded-lg mb-4 flex items-center justify-center text-slate-400">
            <BookOpen className="w-12 h-12" />
          </div>
          <h3 className="font-bold text-lg text-corporate-navy mb-2">Leadership Book Title {i}</h3>
          <p className="text-sm text-slate-500 mb-4">A brief summary of the key takeaways from this influential leadership text.</p>
          <button className="text-corporate-teal font-semibold text-sm flex items-center gap-1">
            Read Summary <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  </div>
);
export default ReadingHub;
