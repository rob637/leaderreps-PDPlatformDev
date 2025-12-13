import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import PageLayout from '../../ui/PageLayout';
import { Card } from '../../ui';

const ContactUs = () => {
  return (
    <PageLayout
      title="Contact Us"
      icon={Mail}
      description="We're here to help. Get in touch with us."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <a href="mailto:ryan@leaderreps.com" className="text-teal-600 hover:underline">
                      ryan@leaderreps.com
                    </a>
                    <p className="text-sm text-slate-500 mt-1">
                      We aim to respond to all inquiries within 24 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <MapPin className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Office</h4>
                    <p className="text-slate-600">
                      LeaderReps Inc.<br />
                      5114 Harlem Road<br />
                      New Albany, Ohio 43054
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Support Hours">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Monday - Friday</span>
                  <span className="font-medium text-slate-900">9:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-medium text-slate-900">10:00 AM - 2:00 PM EST</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-slate-600">Sunday</span>
                  <span className="font-medium text-slate-900">Closed</span>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-900 mb-2">Need immediate assistance?</h4>
                <p className="text-sm text-blue-800">
                  Check out our Help Center for frequently asked questions and guides on how to use the platform.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default ContactUs;
