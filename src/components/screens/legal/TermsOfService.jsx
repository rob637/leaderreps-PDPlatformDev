import React from 'react';
import { FileText } from 'lucide-react';
import PageLayout from '../../ui/PageLayout';
import { Card } from '../../ui';

const TermsOfService = () => {
  return (
    <PageLayout
      title="Terms of Service"
      icon={FileText}
      description="The rules and regulations for the use of LeaderReps PD Platform."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <div className="prose prose-slate max-w-none p-6">
            <h3>1. Agreement to Terms</h3>
            <p>
              By accessing or using the LeaderReps PD Platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>

            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on LeaderReps' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on LeaderReps' website;</li>
              <li>remove any copyright or other proprietary notations from the materials; or</li>
              <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>

            <h3>3. Disclaimer</h3>
            <p>
              The materials on LeaderReps' website are provided on an 'as is' basis. LeaderReps makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h3>4. Limitations</h3>
            <p>
              In no event shall LeaderReps or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LeaderReps' website, even if LeaderReps or a LeaderReps authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>

            <h3>5. Accuracy of Materials</h3>
            <p>
              The materials appearing on LeaderReps' website could include technical, typographical, or photographic errors. LeaderReps does not warrant that any of the materials on its website are accurate, complete or current. LeaderReps may make changes to the materials contained on its website at any time without notice.
            </p>

            <h3>6. Governing Law</h3>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>

            <p className="text-sm text-slate-500 mt-8">Last Updated: December 2025</p>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
};

export default TermsOfService;
