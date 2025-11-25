import React from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { Card, Text, Button, PageLayout, PageGrid } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const ROIReport = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Executive ROI Report"
      icon={TrendingUp}
      subtitle="Track your leadership growth and impact."
      navigate={navigate}
      backTo="dashboard"
      backLabel="Back to Dashboard"
      accentColor="navy"
    >
      {/* Stats Grid */}
      <PageGrid cols={2}>
        <Card>
          <div className="p-6">
            <Text variant="label" className="uppercase mb-4 text-slate-400">Engagement Score</Text>
            <div className="text-4xl font-bold text-corporate-navy mb-2">92%</div>
            <Text className="font-semibold text-corporate-teal">↑ 5% vs last month</Text>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <Text variant="label" className="uppercase mb-4 text-slate-400">Competency Growth</Text>
            <div className="text-4xl font-bold text-corporate-navy mb-2">+12</div>
            <Text className="font-semibold text-corporate-teal">Skills mastered</Text>
          </div>
        </Card>
      </PageGrid>
      
      {/* Download Section */}
      <Card className="mt-6">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-corporate-navy">Monthly Progress Report (November)</h3>
            <Text variant="muted">Generated on Nov 20, 2025</Text>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </Card>
    </PageLayout>
  );
};

export default ROIReport;
