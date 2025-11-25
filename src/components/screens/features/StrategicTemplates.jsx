import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Card, PageHeader, Text } from '../../ui';

const StrategicTemplates = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Strategic Templates" 
      description="Downloadable worksheets and tools for your team." 
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['Quarterly Planning', '1-on-1 Meeting Guide', 'Performance Review', 'Team Charter'].map((title, i) => (
        <Card key={i}>
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-corporate-navy">{title}</h3>
                <Text variant="small">PDF & Excel Formats</Text>
              </div>
            </div>
            <button className="p-2 text-slate-400 hover:text-corporate-teal">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);
export default StrategicTemplates;
