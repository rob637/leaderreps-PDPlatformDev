import React from 'react';
import { Shield } from 'lucide-react';
import PageLayout from '../../ui/PageLayout';
import { Card } from '../../ui';

const PrivacyPolicy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      icon={Shield}
      description="How we collect, use, and protect your data."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="prose prose-slate max-w-none p-6">
            <h3>1. Introduction</h3>
            <p>
              Welcome to the LeaderReps PD Platform. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our application 
              and tell you about your privacy rights and how the law protects you.
            </p>

            <h3>2. Data We Collect</h3>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            </p>
            <ul>
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
            </ul>

            <h3>3. How We Use Your Data</h3>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul>
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>

            <h3>4. Data Security</h3>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>

            <h3>5. Your Legal Rights</h3>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
            </p>

            <h3>6. Contact Details</h3>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us via the Contact Us page.
            </p>
            
            <p className="text-sm text-slate-500 mt-8">Last Updated: December 2025</p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;
