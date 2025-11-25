import React from 'react';
import { Download } from 'lucide-react';
import { Card, PageHeader, Text, Button } from '../../ui';

const ROIReport = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="Executive ROI Report" 
      description="Track your leadership growth and impact." 
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      <Card>
        <div className="p-6">
          <Text variant="label" className="uppercase mb-4 text-slate-400">Engagement Score</Text>
          <div className="text-4xl font-bold text-corporate-navy mb-2">92%</div>
          <Text variant="success" className="font-semibold">↑ 5% vs last month</Text>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <Text variant="label" className="uppercase mb-4 text-slate-400">Competency Growth</Text>
          <div className="text-4xl font-bold text-corporate-navy mb-2">+12</div>
          <Text variant="success" className="font-semibold">Skills mastered</Text>
        </div>
      </Card>
    </div>
    <Card>
      <div className="p-8 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-corporate-navy">Monthly Progress Report (November)</h3>
          <Text variant="muted">Generated on Nov 20, 2025</Text>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>
    </Card>
  </div>
);
export default ROIReport;
