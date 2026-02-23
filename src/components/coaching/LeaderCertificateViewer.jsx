// src/components/coaching/LeaderCertificateViewer.jsx
// Modal component to display and print Leader Certification certificates
// Users must acknowledge (view/print) their certificate to complete a milestone

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Award, Download, Printer, CheckCircle, 
  Mountain, Star, Share2 
} from 'lucide-react';

// Milestone theme colors for certificates
const MILESTONE_THEMES = {
  1: { 
    name: 'Foundation Basics',
    color: '#47A88D', // corporate-teal
    gradient: 'from-corporate-teal to-emerald-600'
  },
  2: { 
    name: 'Communication Mastery',
    color: '#002E47', // corporate-navy
    gradient: 'from-corporate-navy to-slate-700'
  },
  3: { 
    name: 'Team Leadership',
    color: '#E04E1B', // corporate-orange
    gradient: 'from-corporate-orange to-orange-600'
  },
  4: { 
    name: 'Strategic Thinking',
    color: '#47A88D',
    gradient: 'from-corporate-teal to-teal-600'
  },
  5: { 
    name: 'Executive Presence',
    color: '#002E47',
    gradient: 'from-corporate-navy to-corporate-teal'
  }
};

const LeaderCertificateViewer = ({ 
  isOpen, 
  onClose, 
  onAcknowledge,
  milestone,
  userName,
  certificationDate,
  facilitatorName,
  isAcknowledged = false
}) => {
  const certificateRef = useRef(null);
  const [acknowledging, setAcknowledging] = useState(false);
  
  const theme = MILESTONE_THEMES[milestone] || MILESTONE_THEMES[1];
  const formattedDate = certificationDate 
    ? new Date(certificationDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Leader Certification - ${theme.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Nunito Sans', sans-serif;
            background: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          
          .certificate {
            width: 800px;
            aspect-ratio: 1.414;
            background: white;
            border: 8px solid ${theme.color};
            padding: 40px;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            inset: 8px;
            border: 2px solid ${theme.color};
            pointer-events: none;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          
          .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 15px;
          }
          
          .title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: #64748b;
            margin-bottom: 10px;
          }
          
          .main-title {
            font-size: 36px;
            font-weight: 800;
            color: ${theme.color};
            margin-bottom: 5px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #475569;
          }
          
          .recipient {
            text-align: center;
            margin: 40px 0;
          }
          
          .presented-to {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
          }
          
          .name {
            font-size: 42px;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 3px solid ${theme.color};
            display: inline-block;
            padding-bottom: 5px;
            min-width: 300px;
          }
          
          .achievement {
            text-align: center;
            margin: 30px 0;
          }
          
          .achievement-text {
            font-size: 16px;
            color: #475569;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto;
          }
          
          .milestone-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: ${theme.color};
            color: white;
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 700;
            margin-top: 20px;
          }
          
          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
          }
          
          .signature {
            text-align: center;
            flex: 1;
          }
          
          .signature-line {
            width: 200px;
            border-bottom: 2px solid #cbd5e1;
            margin: 0 auto 8px;
            padding-top: 30px;
          }
          
          .signature-label {
            font-size: 12px;
            color: #64748b;
          }
          
          .signature-name {
            font-size: 14px;
            color: #0f172a;
            font-weight: 600;
          }
          
          @media print {
            body { background: white; padding: 0; }
            .certificate { box-shadow: none; border-width: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <svg class="logo" viewBox="0 0 100 100" fill="${theme.color}">
              <path d="M50 10 L85 80 H15 Z" stroke="${theme.color}" stroke-width="4" fill="none"/>
              <path d="M50 25 L75 75 H25 Z" fill="${theme.color}" opacity="0.2"/>
              <path d="M50 35 L65 70 H35 Z" fill="${theme.color}"/>
            </svg>
            <div class="title">LeaderReps Leadership Program</div>
            <div class="main-title">Leader Certification</div>
            <div class="subtitle">${theme.name}</div>
          </div>
          
          <div class="recipient">
            <div class="presented-to">This is to certify that</div>
            <div class="name">${userName || 'Leader Name'}</div>
          </div>
          
          <div class="achievement">
            <div class="achievement-text">
              has successfully demonstrated mastery of the core competencies 
              and leadership skills required for <strong>${theme.name}</strong>, 
              completing all required activities and receiving facilitator certification.
            </div>
            <div class="milestone-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Milestone ${milestone} Complete
            </div>
          </div>
          
          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-name">${facilitatorName || 'Program Facilitator'}</div>
              <div class="signature-label">Certifying Facilitator</div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-name">${formattedDate}</div>
              <div class="signature-label">Date of Certification</div>
            </div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(certificateHTML);
    printWindow.document.close();
  };
  
  const handleAcknowledge = async () => {
    if (isAcknowledged || acknowledging) return;
    setAcknowledging(true);
    try {
      await onAcknowledge?.();
    } finally {
      setAcknowledging(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${theme.gradient} text-white p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Leader Certification</h2>
                  <p className="text-white/80 text-sm">{theme.name} - Milestone {milestone}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Certificate Preview */}
          <div className="p-6 overflow-y-auto max-h-[50vh]" ref={certificateRef}>
            <div 
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-8 border-4"
              style={{ borderColor: theme.color }}
            >
              {/* Mini Certificate Preview */}
              <div className="text-center">
                {/* Logo */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.color}20` }}>
                  <Mountain className="w-8 h-8" style={{ color: theme.color }} />
                </div>
                
                <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  LeaderReps Leadership Program
                </p>
                <h3 className="text-2xl font-bold mb-1" style={{ color: theme.color }}>
                  Leader Certification
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{theme.name}</p>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  This is to certify that
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white border-b-2 inline-block pb-1 px-4 mb-4"
                  style={{ borderColor: theme.color }}>
                  {userName || 'Leader'}
                </p>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
                  has successfully completed all required activities and received 
                  facilitator certification for <strong>{theme.name}</strong>.
                </p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: theme.color }}>
                  <Star className="w-4 h-4" />
                  Milestone {milestone} Complete
                </div>
                
                <div className="flex justify-between mt-8 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {facilitatorName || 'Program Facilitator'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Certifying Facilitator
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {formattedDate}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Date of Certification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            {isAcknowledged ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Certificate Acknowledged</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600 transition-colors font-medium"
                  >
                    Continue to Next Milestone
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Congratulations!</strong> Review your certificate, then acknowledge to unlock the next milestone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    className="flex items-center gap-2 px-6 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50"
                  >
                    {acknowledging ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Acknowledging...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Acknowledge & Continue
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LeaderCertificateViewer;
