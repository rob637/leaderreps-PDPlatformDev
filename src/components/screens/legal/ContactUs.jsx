import React from 'react';
import { Mail, HelpCircle } from 'lucide-react';
import PageLayout from '../../ui/PageLayout';
import { Card } from '../../ui';
import { useAppServices } from '../../../services/useAppServices';

const ContactUs = () => {
  const { navigate } = useAppServices();
  
  return (
    <PageLayout
      title="Contact Us"
      icon={Mail}
      description="We're here to help. Get in touch with us."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card title="Get in Touch">
          <div className="p-6 space-y-6">
            <p className="text-slate-600">
              Have questions about the LeaderReps PD Platform? We're here to help! 
              Reach out to us using the contact information below.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Mail className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Email</h4>
                  <a href="mailto:team@leaderreps.com" className="text-teal-600 hover:underline">
                    team@leaderreps.com
                  </a>
                  <p className="text-sm text-slate-500 mt-1">
                    We aim to respond to all inquiries within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900 mb-2">Need quick answers?</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Check out our Help Center for frequently asked questions and guides on how to use the platform.
                </p>
                <button
                  onClick={() => navigate('help-center')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg font-medium hover:bg-corporate-teal/90 transition-colors text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  Visit Help Center
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ContactUs;
