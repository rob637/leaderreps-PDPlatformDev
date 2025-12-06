import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  Shield,
  ExternalLink,
  FileText,
  Download,
  Search,
  ChevronRight,
  Bookmark,
  Clock,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

/**
 * DocumentationCenter - Admin documentation hub
 * Provides access to guides, test plans, and system documentation
 */
const DocumentationCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshPrompt, setRefreshPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Document definitions
  const documents = [
    {
      id: 'admin-guide',
      title: 'Administrator Guide',
      description: 'Comprehensive documentation for system administrators covering architecture, operations, and troubleshooting.',
      icon: Shield,
      color: 'bg-corporate-teal',
      category: 'Admin',
      lastUpdated: 'December 2025',
      sections: [
        'Platform Overview',
        'Architecture & Key Concepts',
        'User Journey & Experience',
        'Admin Portal Guide',
        'Development Plan Management',
        'Content Management (The Vault)',
        'Widget System',
        'Feature Flags & Configuration',
        'User Data & Daily Practice',
        'Scheduled Functions & Automation',
        'Deployment & Environments',
        'Troubleshooting Guide',
        'Technical Reference'
      ],
      githubPath: 'ADMIN-GUIDE.md',
      localPath: '/ADMIN-GUIDE.md'
    },
    {
      id: 'user-guide',
      title: 'User Guide & Procedures',
      description: 'Complete guide for platform users covering daily practice, development plans, and getting the most from LeaderReps.',
      icon: Users,
      color: 'bg-corporate-orange',
      category: 'User',
      lastUpdated: 'December 2025',
      sections: [
        'Getting Started',
        'Your Daily Practice',
        'Development Plan',
        'Content Library',
        'Community Features',
        'Coaching Resources',
        'Your Locker',
        'Settings & Notifications',
        'Tips for Success',
        'FAQ & Troubleshooting'
      ],
      githubPath: 'USER-GUIDE.md',
      localPath: '/USER-GUIDE.md'
    },
    {
      id: 'test-plans',
      title: 'Test Plans & QA',
      description: 'Comprehensive testing documentation including test cases, regression checklists, and quality assurance procedures.',
      icon: ClipboardCheck,
      color: 'bg-purple-600',
      category: 'QA',
      lastUpdated: 'December 2025',
      sections: [
        'Testing Environments',
        'Daily Practice Tests',
        'Development Plan Tests',
        'Content System Tests',
        'Authentication Tests',
        'Admin Portal Tests',
        'Time-Based Feature Tests',
        'Cross-Browser Tests',
        'Mobile/Responsive Tests',
        'Performance Tests',
        'Regression Test Checklist'
      ],
      githubPath: 'TEST-PLANS.md',
      localPath: '/TEST-PLANS.md'
    }
  ];

  // Quick Links for common admin tasks
  const quickLinks = [
    { 
      title: 'Firebase Console (DEV)', 
      url: 'https://console.firebase.google.com/project/leaderreps-pd-platform/overview',
      icon: ExternalLink 
    },
    { 
      title: 'Firebase Console (TEST)', 
      url: 'https://console.firebase.google.com/project/leaderreps-test/overview',
      icon: ExternalLink 
    },
    { 
      title: 'GitHub Repository', 
      url: 'https://github.com/rob637/leaderreps-PDPlatformDev',
      icon: ExternalLink 
    },
    { 
      title: 'DEV Site', 
      url: 'https://leaderreps-pd-platform.web.app',
      icon: ExternalLink 
    },
    { 
      title: 'TEST Site', 
      url: 'https://leaderreps-test.web.app',
      icon: ExternalLink 
    }
  ];

  // Filter documents based on search
  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.sections.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open document in new tab (GitHub rendered view)
  const openInGitHub = (doc) => {
    const url = `https://github.com/rob637/leaderreps-PDPlatformDev/blob/New-Stuff/${doc.githubPath}`;
    window.open(url, '_blank');
  };

  // Download raw markdown
  const downloadMarkdown = (doc) => {
    const url = `https://raw.githubusercontent.com/rob637/leaderreps-PDPlatformDev/New-Stuff/${doc.githubPath}`;
    window.open(url, '_blank');
  };

  // Generate refresh prompt for AI
  const generateRefreshPrompt = (docType = 'all') => {
    const basePrompt = `You are helping update the documentation for the LeaderReps PD Platform. 

The platform is a leadership development application built with:
- React 18 + Vite (frontend)
- Tailwind CSS (styling)
- Firebase (Firestore, Auth, Storage, Functions)
- Firebase Hosting
- PWA with Workbox

Key features include:
- Daily Practice Routines (AM/PM Bookends)
- 12-week Development Plans with content unlocking
- Content Library (videos, readings, tools, workouts)
- Streak tracking and scorecards
- Community and Coaching features
- Admin Portal with Widget Lab, Dev Plan Manager, Content Manager

Please review and improve the following documentation, making it 1% better by:
1. Fixing any outdated information
2. Adding clarity where needed
3. Improving formatting and readability
4. Adding any missing sections or details
5. Ensuring accuracy with current best practices

`;

    const docSpecific = {
      'admin-guide': `Focus on the ADMIN-GUIDE.md which covers:
- Platform architecture (Vault & Key content system)
- Admin Portal operations
- Development Plan management
- Content management
- Widget system
- Scheduled functions (11:59 PM rollover)
- Deployment procedures
- Troubleshooting`,
      'user-guide': `Focus on the USER-GUIDE.md which covers:
- Getting started for new users
- Daily practice workflows
- Development Plan navigation
- Content library usage
- Community features
- Coaching resources
- Settings and notifications
- Tips for success`,
      'test-plans': `Focus on the TEST-PLANS.md which covers:
- Testing environments (DEV, TEST)
- Daily practice test cases
- Development plan tests
- Content system tests
- Authentication tests
- Admin portal tests
- Cross-browser testing
- Regression checklists`,
      'all': `Review all three documentation files:
1. ADMIN-GUIDE.md - Administrator operations
2. USER-GUIDE.md - End user procedures
3. TEST-PLANS.md - QA and testing procedures`
    };

    return basePrompt + (docSpecific[docType] || docSpecific['all']);
  };

  // Open refresh modal
  const openRefreshModal = (docId = 'all') => {
    setRefreshPrompt(generateRefreshPrompt(docId));
    setShowRefreshModal(true);
    setCopied(false);
  };

  // Copy prompt to clipboard
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(refreshPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-corporate-teal" />
            Documentation Center
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Access guides, procedures, and test plans for the LeaderReps platform
          </p>
        </div>
        <button
          onClick={() => openRefreshModal('all')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Refresh Docs with AI
        </button>
      </div>

      {/* Refresh Modal */}
      {showRefreshModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy">Refresh Documentation with AI</h3>
                  <p className="text-sm text-slate-500">Copy this prompt to use with your AI assistant</p>
                </div>
              </div>
              <button
                onClick={() => setShowRefreshModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How to refresh documentation:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Copy the prompt below</li>
                      <li>Open your AI assistant (ChatGPT, Claude, or GitHub Copilot)</li>
                      <li>Paste the prompt along with the current documentation file</li>
                      <li>Review the suggested changes</li>
                      <li>Apply updates to the markdown files in the repository</li>
                      <li>Deploy using <code className="bg-blue-100 px-1 rounded">./deploy-dev.sh</code></li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Prompt Area */}
              <div className="relative">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={copyPrompt}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      copied 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Prompt
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={refreshPrompt}
                  className="w-full h-64 p-4 pr-32 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Quick Doc Links */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Quick links to current documentation:</p>
                <div className="flex flex-wrap gap-2">
                  {documents.map(doc => (
                    <a
                      key={doc.id}
                      href={`https://raw.githubusercontent.com/rob637/leaderreps-PDPlatformDev/New-Stuff/${doc.githubPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {doc.githubPath}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-slate-50">
              <div className="flex gap-2">
                {['admin-guide', 'user-guide', 'test-plans'].map(docId => (
                  <button
                    key={docId}
                    onClick={() => {
                      setRefreshPrompt(generateRefreshPrompt(docId));
                      setCopied(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {docId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowRefreshModal(false)}
                className="px-4 py-2 bg-corporate-navy text-white text-sm font-medium rounded-lg hover:bg-corporate-navy/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal text-sm"
        />
      </div>

      {/* Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div 
              key={doc.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 ${doc.color} rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-corporate-navy truncate">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">{doc.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {doc.lastUpdated}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {doc.description}
              </p>

              {/* Sections Preview */}
              <div className="mb-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  {doc.sections.length} Sections
                </p>
                <div className="flex flex-wrap gap-1">
                  {doc.sections.slice(0, 4).map((section, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-slate-50 text-slate-600 rounded"
                    >
                      {section}
                    </span>
                  ))}
                  {doc.sections.length > 4 && (
                    <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-400 rounded">
                      +{doc.sections.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openInGitHub(doc)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-corporate-teal text-white text-sm font-medium rounded-lg hover:bg-corporate-teal/90 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => openRefreshModal(doc.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors"
                  title="Refresh with AI"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadMarkdown(doc)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                  title="Download Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links Section */}
      <div className="bg-slate-50 rounded-xl p-5 mt-6">
        <h3 className="font-semibold text-corporate-navy mb-4 flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-corporate-teal" />
          Quick Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-slate-700 hover:border-corporate-teal hover:text-corporate-teal transition-colors"
            >
              <link.icon className="w-4 h-4" />
              <span className="truncate">{link.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/90 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Additional Resources</h3>
            <p className="text-white/70 text-sm mb-4">
              For additional documentation, architecture decisions, and development notes, check the repository files.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://github.com/rob637/leaderreps-PDPlatformDev/blob/New-Stuff/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                README.md
                <ChevronRight className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/rob637/leaderreps-PDPlatformDev/blob/New-Stuff/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                CONTRIBUTING.md
                <ChevronRight className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/rob637/leaderreps-PDPlatformDev/blob/New-Stuff/ENVIRONMENTS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                ENVIRONMENTS.md
                <ChevronRight className="w-3 h-3" />
              </a>
              <a
                href="https://github.com/rob637/leaderreps-PDPlatformDev/blob/New-Stuff/LAYOUT-STANDARDS.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                LAYOUT-STANDARDS.md
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-xs text-slate-400 pt-4">
        Documentation is version-controlled with the application. 
        Last synced with branch: <span className="font-mono">New-Stuff</span>
      </div>
    </div>
  );
};

export default DocumentationCenter;
