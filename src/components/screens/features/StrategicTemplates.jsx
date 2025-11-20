import React from 'react';
import { FileText, Download } from 'lucide-react';

const StrategicTemplates = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-corporate-navy">Strategic Templates</h1>
      <p className="text-slate-500">Downloadable worksheets and tools for your team.</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['Quarterly Planning', '1-on-1 Meeting Guide', 'Performance Review', 'Team Charter'].map((title, i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-corporate-navy">{title}</h3>
              <p className="text-xs text-slate-500">PDF & Excel Formats</p>
            </div>
          </div>
          <button className="p-2 text-slate-400 hover:text-corporate-teal">
            <Download className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  </div>
);
export default StrategicTemplates;
