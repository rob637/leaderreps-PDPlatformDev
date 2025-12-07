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
  X,
  Loader,
  Wand2,
  GitBranch,
  Upload
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';

// Import raw content for AI analysis
import adminGuideRaw from '../../../ADMIN-GUIDE.md?raw';
import userGuideRaw from '../../../USER-GUIDE.md?raw';
import testPlansRaw from '../../../TEST-PLANS.md?raw';
import packageJsonRaw from '../../../package.json?raw';
import widgetTemplatesRaw from '../../config/widgetTemplates.js?raw';
import adminPortalRaw from './AdminPortal.jsx?raw';

/**
 * DocumentationCenter - Admin documentation hub
 * Provides access to guides, test plans, and system documentation
 */
const DocumentationCenter = () => {
  const { callSecureGeminiAPI } = useAppServices();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshPrompt, setRefreshPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('all');
  const [updatedDocContent, setUpdatedDocContent] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [kaizenMode, setKaizenMode] = useState('update'); // 'update' or 'suggest'
  const [commitStatus, setCommitStatus] = useState(''); // '', 'committing', 'success', 'error'
  const [commitMessage, setCommitMessage] = useState('');

  // GitHub config
  const GITHUB_OWNER = 'rob637';
  const GITHUB_REPO = 'leaderreps-PDPlatformDev';
  const GITHUB_BRANCH = 'New-Stuff';

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
    setSelectedDocId(docId);
    setRefreshPrompt(generateRefreshPrompt(docId));
    setShowRefreshModal(true);
    setCopied(false);
    setAiSuggestions('');
    setUpdatedDocContent('');
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

  // Copy AI suggestions to clipboard
  const copySuggestions = async () => {
    try {
      await navigator.clipboard.writeText(aiSuggestions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Copy updated document to clipboard
  const copyUpdatedDoc = async () => {
    try {
      await navigator.clipboard.writeText(updatedDocContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download updated document as file
  const downloadUpdatedDoc = () => {
    const docNames = {
      'admin-guide': 'ADMIN-GUIDE.md',
      'user-guide': 'USER-GUIDE.md',
      'test-plans': 'TEST-PLANS.md'
    };
    const filename = docNames[selectedDocId] || 'UPDATED-DOC.md';
    const blob = new Blob([updatedDocContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Commit updated document directly to GitHub
  const commitToGitHub = async () => {
    const docPaths = {
      'admin-guide': 'ADMIN-GUIDE.md',
      'user-guide': 'USER-GUIDE.md',
      'test-plans': 'TEST-PLANS.md'
    };
    const filePath = docPaths[selectedDocId];
    if (!filePath || !updatedDocContent) return;

    setCommitStatus('committing');
    
    try {
      // Get the GitHub token from localStorage (set via admin settings)
      const token = localStorage.getItem('github_pat');
      if (!token) {
        setCommitStatus('error');
        setCommitMessage('GitHub token not configured. Go to Admin > System > Settings to add your GitHub Personal Access Token.');
        return;
      }

      // Step 1: Get the current file's SHA
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (!getFileResponse.ok) {
        throw new Error('Failed to get current file from GitHub');
      }
      
      const fileData = await getFileResponse.json();
      const currentSha = fileData.sha;

      // Step 2: Update the file
      const updateResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `docs: Kaizen update to ${filePath}`,
            content: btoa(unescape(encodeURIComponent(updatedDocContent))), // Base64 encode
            sha: currentSha,
            branch: GITHUB_BRANCH
          })
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Failed to commit to GitHub');
      }

      setCommitStatus('success');
      setCommitMessage(`✅ Successfully committed to ${GITHUB_BRANCH}! The documentation has been updated.`);
      
    } catch (error) {
      console.error('GitHub commit error:', error);
      setCommitStatus('error');
      setCommitMessage(`❌ ${error.message}`);
    }
  };

  // Generate UPDATED documentation (not just suggestions)
  const generateUpdatedDoc = async () => {
    setIsGenerating(true);
    setAiSuggestions('');
    setUpdatedDocContent('');

    try {
      const docMap = {
        'admin-guide': adminGuideRaw,
        'user-guide': userGuideRaw, 
        'test-plans': testPlansRaw
      };
      const currentDoc = docMap[selectedDocId] || adminGuideRaw;
      const packageJson = packageJsonRaw;
      const widgetTemplates = widgetTemplatesRaw;
      const adminPortal = adminPortalRaw;

      const prompt = `
You are the Lead Documentation Engineer for LeaderReps. Your task is to UPDATE the documentation to be accurate and complete.

---
### ACTUAL CODE CONTEXT (Source of Truth)
1. **Project Dependencies (package.json)**:
${packageJson.substring(0, 1500)}

2. **Active Features (widgetTemplates.js)**:
${widgetTemplates.substring(0, 3000)}

3. **Admin Capabilities (AdminPortal.jsx)**:
${adminPortal.substring(0, 3000)}
---

### CURRENT DOCUMENTATION TO UPDATE
${currentDoc}
---

### YOUR TASK
1. Review the current documentation against the code context
2. Make ALL necessary updates to ensure accuracy
3. Add any missing features or capabilities you see in the code
4. Remove or update any outdated information
5. Improve clarity where possible
6. Keep the same general structure and formatting style

**CRITICAL**: Output the COMPLETE UPDATED DOCUMENTATION file. Do not summarize or truncate.
Start your response with the markdown content directly (no preamble like "Here is the updated...").
The output should be ready to save directly as the .md file.
`;

      const result = await callSecureGeminiAPI({
        prompt,
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are an expert technical writer. Output ONLY the complete updated markdown documentation. No explanations, no preamble - just the full updated .md file content.'
      });

      if (result?.text) {
        // Clean up any potential preamble
        let content = result.text;
        // Remove common AI preambles if present
        if (content.startsWith('```markdown')) {
          content = content.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
        } else if (content.startsWith('```')) {
          content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        setUpdatedDocContent(content);
        setAiSuggestions('✅ Documentation updated! Review the changes below, then download or copy to replace the file.');
      } else {
        setAiSuggestions('Unable to generate updated documentation. Please try again.');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setAiSuggestions(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate AI suggestions using Gemini (original suggest-only mode)
  const generateAISuggestions = async () => {
    if (kaizenMode === 'update') {
      return generateUpdatedDoc();
    }
    
    setIsGenerating(true);
    setAiSuggestions('');

    try {
      // 1. Get the current documentation from bundled raw imports
      const docMap = {
        'admin-guide': adminGuideRaw,
        'user-guide': userGuideRaw, 
        'test-plans': testPlansRaw
      };
      const currentDoc = docMap[selectedDocId] || adminGuideRaw;

      // 2. Get Key Code Context (from bundled raw imports)
      const packageJson = packageJsonRaw;
      const widgetTemplates = widgetTemplatesRaw;
      const adminPortal = adminPortalRaw;

      // 3. Construct Context-Aware Prompt
      const prompt = `
You are the Lead Documentation Engineer for LeaderReps. Your goal is to make the documentation "1% better" with every pass.
Review the CURRENT DOCUMENTATION against the ACTUAL CODE CONTEXT provided below.

---
### ACTUAL CODE CONTEXT (Truth)
1. **Project Dependencies (package.json)**:
${packageJson.substring(0, 1000)}...

2. **Active Features (widgetTemplates.js)**:
${widgetTemplates.substring(0, 2000)}...

3. **Admin Capabilities (AdminPortal.jsx)**:
${adminPortal.substring(0, 2000)}...
---

### CURRENT DOCUMENTATION (To Improve)
${currentDoc.substring(0, 15000)}
---

### INSTRUCTIONS
Identify discrepancies between the Code (Truth) and the Documentation.
Provide 3-5 specific, actionable improvements to make the docs more accurate and helpful.
Focus on:
1. **Accuracy**: Does the doc mention features that don't exist, or miss new ones (like Unified Content Library)?
2. **Completeness**: Are the tech stack details correct based on package.json?
3. **Clarity**: Can sections be simplified?

Format your response as:
## 🚀 Kaizen Improvements (1% Better)

### 1. [Title of Improvement]
- **Observation**: [What you found in the code vs docs]
- **Suggested Change**: [Specific text to add/change]
- **Why**: [Benefit]

...
`;

      const result = await callSecureGeminiAPI({
        prompt,
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are a technical documentation expert focused on accuracy and continuous improvement (Kaizen). Always ground your suggestions in the provided code context.'
      });

      if (result?.text) {
        setAiSuggestions(result.text);
      } else {
        setAiSuggestions('Unable to generate suggestions. Please try again or use the manual copy option.');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setAiSuggestions(`Error: ${error.message}\n\nPlease use the manual copy option and paste into your preferred AI assistant.`);
    } finally {
      setIsGenerating(false);
    }
  };  return (
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
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy">Refresh Documentation with AI</h3>
                  <p className="text-sm text-slate-500">Generate suggestions or copy the prompt for manual use</p>
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
              {/* Mode Toggle */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-slate-100 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Mode:</span>
                <button
                  onClick={() => setKaizenMode('update')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    kaizenMode === 'update'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  🔄 Update Document
                </button>
                <button
                  onClick={() => setKaizenMode('suggest')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    kaizenMode === 'suggest'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  💡 Suggest Only
                </button>
                <span className="text-xs text-slate-500 ml-2">
                  {kaizenMode === 'update' ? 'AI will generate the complete updated file' : 'AI will provide suggestions only'}
                </span>
              </div>

              {/* AI Generation Section */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">
                      {kaizenMode === 'update' ? 'Auto-Update Documentation' : 'Analyze Code & Improve Docs'}
                    </span>
                  </div>
                  <button
                    onClick={generateAISuggestions}
                    disabled={isGenerating || selectedDocId === 'all'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isGenerating || selectedDocId === 'all'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analyzing Code...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Run Kaizen Analysis
                      </>
                    )}
                  </button>
                </div>
                {selectedDocId === 'all' && (
                  <p className="text-sm text-purple-700">Select a specific document below to generate AI suggestions.</p>
                )}
                {aiSuggestions && !updatedDocContent && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-purple-600 uppercase">AI Status</span>
                      <button
                        onClick={copySuggestions}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {aiSuggestions}
                    </div>
                  </div>
                )}
                
                {/* Updated Document Output */}
                {updatedDocContent && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-sm font-medium text-green-700 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Updated documentation ready!
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={copyUpdatedDoc}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                        <button
                          onClick={downloadUpdatedDoc}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={commitToGitHub}
                          disabled={commitStatus === 'committing'}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
                        >
                          {commitStatus === 'committing' ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Committing...
                            </>
                          ) : (
                            <>
                              <GitBranch className="w-4 h-4" />
                              Commit to GitHub
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Commit Status Message */}
                    {commitMessage && (
                      <div className={`p-3 rounded-lg text-sm ${
                        commitStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                        commitStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}>
                        {commitMessage}
                        {commitStatus === 'error' && !localStorage.getItem('github_pat') && (
                          <div className="mt-2">
                            <p className="text-xs mb-2">To enable direct commits, add your GitHub PAT:</p>
                            <input
                              type="password"
                              placeholder="ghp_xxxxxxxxxxxx"
                              className="w-full px-2 py-1 text-xs border rounded"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  localStorage.setItem('github_pat', e.target.value);
                                  setCommitMessage('Token saved! Try committing again.');
                                  setCommitStatus('');
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                        {updatedDocContent.substring(0, 3000)}
                        {updatedDocContent.length > 3000 && '\n\n... (truncated for preview - download for full content)'}
                      </pre>
                    </div>
                    <p className="text-xs text-slate-500">
                      💡 Click "Commit to GitHub" to update the file directly, or download to replace manually.
                    </p>
                  </div>
                )}
              </div>

              {/* Manual Option - only show in suggest mode */}
              {kaizenMode === 'suggest' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Manual option - copy prompt for external AI:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Copy the prompt below</li>
                      <li>Paste into ChatGPT, Claude, or GitHub Copilot</li>
                      <li>Include the current documentation file</li>
                      <li>Review and apply the suggested changes</li>
                    </ol>
                  </div>
                </div>
              </div>
              )}

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
                  className="w-full h-48 p-4 pr-32 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
                <span className="text-sm text-slate-500 mr-2">Select doc:</span>
                {['admin-guide', 'user-guide', 'test-plans'].map(docId => (
                  <button
                    key={docId}
                    onClick={() => {
                      setSelectedDocId(docId);
                      setRefreshPrompt(generateRefreshPrompt(docId));
                      setCopied(false);
                      setAiSuggestions('');
                      setUpdatedDocContent('');
                    }}
                    className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                      selectedDocId === docId
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-200 hover:bg-slate-50'
                    }`}
                  >
                    {docId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
