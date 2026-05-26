// src/components/admin/lab/LabTestLeadMagnets.jsx
// Lab housing for TEST-only lead magnet lead viewers (Leadership DNA, ROI
// Calculator, Leadership Readiness). The underlying AssessmentLeadsManager
// is reused with a filtered set of tabs.

import React from 'react';
import { ShieldAlert, FlaskConical } from 'lucide-react';
import AssessmentLeadsManager from '../AssessmentLeadsManager';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../../config/breadcrumbConfig.js';
import { useAppServices } from '../../../services/useAppServices';

const LabTestLeadMagnets = () => {
  const { isAdmin, navigate } = useAppServices();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('lab-test-lead-magnets')}
          navigate={navigate}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <FlaskConical className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              Test Lead Magnets
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Lead viewers for assessments still in test. Live assessments stay
              under Sales &amp; Marketing.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AssessmentLeadsManager
          availableTabs={['leadership', 'roi', 'readiness']}
        />
      </div>
    </div>
  );
};

export default LabTestLeadMagnets;
