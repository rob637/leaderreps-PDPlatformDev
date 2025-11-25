import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Card, Text, PageLayout, PageGrid } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const StrategicTemplates = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Strategic Templates"
      icon={FileText}
      subtitle="Downloadable worksheets and tools for your team."
      navigate={navigate}
      backTo="library"
      backLabel="Back to Library"
      accentColor="teal"
    >
      <PageGrid cols={2}>
        {['Quarterly Planning', '1-on-1 Meeting Guide', 'Performance Review', 'Team Charter'].map((title, i) => (
          <Card key={i}>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-corporate-teal/10 text-corporate-teal rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy">{title}</h3>
                  <Text variant="small">PDF & Excel Formats</Text>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-corporate-teal transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </Card>
        ))}
      </PageGrid>
    </PageLayout>
  );
};

export default StrategicTemplates;
