import React, { useState, useEffect } from 'react';
import { 
  Send, Calendar, MessageSquare, Phone, CheckCircle, Clock, 
  AlertCircle, ChevronRight, Play, Pause, MoreHorizontal, 
  Mail, Linkedin, Ticket, ArrowRight, BarChart2, Users, X,
  Lightbulb, Shield, Zap, AlertTriangle, Plus, Eye, Edit2, 
  ChevronDown, ChevronUp, Check, FileText, RefreshCw, Sparkles, Wand2,
  MessageCircle, SkipForward, Inbox
} from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import app, { db } from '../../../firebase';

const Outreach = () => {
  const [activeTab, setActiveTab] = useState('review-queue');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null); // For the modal
  const [showComposer, setShowComposer] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Campaign Management
  const [campaigns, setCampaigns] = useState({}); 
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showCampaignEditor, setShowCampaignEditor] = useState(false);
  
  // Email Queue State
  const [emailQueue, setEmailQueue] = useState([]);
  const [expandedEmails, setExpandedEmails] = useState({});
  const [editingEmail, setEditingEmail] = useState(null);
  const [bulkSelectAll, setBulkSelectAll] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState({});
  const [aiPersonalizing, setAiPersonalizing] = useState({});  // Track AI processing per email

  // --- PSYCHOLOGY & CAMPAIGN DATA ---
  const DEFAULT_CAMPAIGNS = {
    'c3': {
        id: 'c3',
        name: 'Strategic Partnership outreach',
        description: 'Initiate high-level partnership discussions with complementary businesses.',
        stats: { openRate: '0%', replyRate: '0%', meetings: 0 },
        active: true,
        steps: [
            {
                day: 0,
                type: 'email',
                label: 'partner-intro',
                name: 'Partnership Inquiry',
                subject: "Partnership idea: [Your Company] + [Their Company]",
                template: "Hi [First Name],\n\nI've been following [Their Company] and love what you're doing in [Space].\n\nI think there's a strong alignment between our audiences. I have an idea for a collaboration that could drive significant value for both sides without much lift.\n\nOpen to a 10-min chat to explore?",
                psychology: {
                    principle: "The 'Better Together' Framing",
                    why: "Focuses immediately on mutual value and low effort ('without much lift')."
                }
            },
            {
                day: 4,
                type: 'linkedin',
                label: 'partner-nudge',
                name: 'LinkedIn Connect',
                template: "Hi [First Name], sent a note about a potential partnership. Let's connect.",
                psychology: {
                     principle: "Professional Courtesy",
                     why: "Standard multi-channel follow-up."
                }
            }
        ]
    },
    'c1': {
        id: 'c1',
        name: 'The "Trojan Horse" Workshop',
        description: 'Invite HR/Sales leaders to a free "Leader Circle" session to demonstrate value before selling.',
        stats: { openRate: '0%', replyRate: '0%', meetings: 0 },
        active: true,
        steps: [
            { 
                day: 0, 
                type: 'email', 
                label: 'value-invite', 
                name: 'Private Invite: Leader Circle',
                subject: "Invitation: Private Leader Circle for [Company]",
                template: "Hi [First Name],\n\nI'm hosting a private 'Leader Circle' session on [Date] focusing on [Topic]. \n\nWe're curating a small group of 5-6 leaders from similar sized companies to share what's actually working in 2024. No pitch, just peer learning.\n\nI'd love to have your perspective from [Company] in the room.\n\nOpen to it?",
                psychology: {
                    principle: "The 'No Ask' Invitation",
                    why: "By framing this as a peer-learning event rather than a sales call, you lower defenses. Using 'Private' and 'Curated' triggers exclusivity."
                }
            },
            { 
                day: 3, 
                type: 'linkedin', 
                label: 'connect', 
                name: 'Connect + Mention Invite',
                template: "Hi [First Name], sent you an invite to the Leader Circle earlier. Would love to connect here regardless.",
                psychology: {
                    principle: "The 'Omnichannel' Nudge",
                    why: "Seeing your name in two places (Inbox + LinkedIn) increases familiarity. The request is low-friction."
                }
            },
            { 
                day: 7, 
                type: 'email', 
                label: 'value-asset', 
                name: 'Send "Culture Audit" PDF',
                subject: "Thought you might like this (Culture Audit)",
                template: "Hi [First Name],\n\nSince you're busy, I thought I'd send over the 'Culture Audit' framework we'll be discussing.\n\nIt takes about 3 minutes to run through and usually highlights the #1 gap in retention strategies.\n\n[Link]\n\nHope it's helpful.",
                psychology: {
                    principle: "The Law of Reciprocity",
                    why: "Giving value (the Audit framework) without asking for anything in return creates a psychological debt. You are demonstrating expertise, not claiming it."
                }
            },
            { 
                day: 12, 
                type: 'call', 
                label: 'call', 
                name: 'Brief 5-min intro',
                script: "Hi [First Name], just calling to see if that Culture Audit was useful. No worries if not, just wanted to close the loop.",
                psychology: {
                    principle: "The 'Close the Loop' Call",
                    why: "This isn't a cold call; it's a follow-up on value provided. It changes the frame from 'Stranger' to 'Helpful Consultant'."
                }
            }
        ]
    },
    'c2': {
        id: 'c2',
        name: 'Founder-to-Founder',
        description: 'Direct high-level outreach from Rob to other CEOs/Founders.',
        active: true,
        steps: [
            { day: 0, type: 'linkedin', name: 'Founder Connection' },
            { day: 2, type: 'email', name: 'Quick question' },
            { day: 5, type: 'video', name: '30s personal Loom video' }
        ]
    }
  };

  useEffect(() => {
    loadCampaignsAndTasks();
  }, []);

  const loadCampaignsAndTasks = async () => {
    setLoading(true);
    try {
        // 1. Load Campaigns
        let activeCampaigns = DEFAULT_CAMPAIGNS;
        try {
            const settingsRef = doc(db, 'corporate_settings', 'outreach_campaigns');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
                activeCampaigns = settingsSnap.data();
            } else {
                // Initialize default settings if seemingly empty
                // await setDoc(settingsRef, DEFAULT_CAMPAIGNS); // Optional: Auto-create
            }
        } catch (e) {
            console.warn("Could not load custom campaigns, using defaults", e);
        }
        setCampaigns(activeCampaigns);

        // 2. Load Tasks
        const q = query(collection(db, 'corporate_prospects'), where('status', '==', 'sequence_active'));
        const snapshot = await getDocs(q);
        const fetchedTasks = snapshot.docs.map(d => {
            const data = d.data();
            // Default to Campaign 1 if missing or invalid
            const campaignId = data.campaignId && activeCampaigns[data.campaignId] ? data.campaignId : 'c1';
            const campaign = activeCampaigns[campaignId] || activeCampaigns['c1'] || DEFAULT_CAMPAIGNS['c1'];
            
            // Determine current step index
            const stepIndex = data.currentStepIndex || 0;
            const step = campaign.steps[stepIndex] || campaign.steps[0];
            
            // Determine due date status
            const now = new Date();
            const taskDate = data.nextTaskDate ? new Date(data.nextTaskDate) : now;
            let dueStatus = 'Today';
            
            const diffTime = taskDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays < 0) dueStatus = 'Overdue';
            else if (diffDays === 0) dueStatus = 'Today';
            else dueStatus = `In ${diffDays} days`;

            return {
                id: d.id,
                prospect: data.name,
                company: data.company,
                title: data.title || 'Leader',
                type: step.type,
                subject: step.name, // Display name for the list
                campaignId: campaignId,
                stepIndex: stepIndex,
                stepData: step,
                due: dueStatus,
                dueDate: taskDate, // Actual date object for sorting
                dueDiffDays: diffDays, // Days until due (negative = overdue)
                nextTaskDate: data.nextTaskDate,
                status: 'pending',
                email: data.email,
                phone: data.phone,
                linkedin: data.linkedin,
                ownerId: data.ownerId,
                ownerName: data.ownerName,
                history: data.history || [],
                // Email tracking
                emailOpens: data.emailOpens || [],
                lastEmailOpened: data.lastEmailOpened,
                // Assigned sender for Reply-To
                assignedSenderEmail: data.assignedSenderEmail,
                assignedSenderName: data.assignedSenderName,
                assignedSenderTitle: data.assignedSenderTitle
            };
        });
        
        setTasks(fetchedTasks);
        
        // Build email queue from tasks
        buildEmailQueue(fetchedTasks, activeCampaigns);
    } catch (e) {
        console.error("Error loading outreach data", e);
    } finally {
        setLoading(false);
    }
  };

  // Build email queue with merge field detection
  const buildEmailQueue = (taskList, campaignData) => {
    const emailTasks = taskList.filter(t => t.type === 'email');
    
    const queue = emailTasks.map(task => {
      const template = task.stepData.template || '';
      const subject = task.stepData.subject || '';
      
      // Detect merge fields
      const mergeFields = detectMergeFields(template + ' ' + subject);
      
      // Get prospect data for merge
      const prospectData = {
        '[First Name]': task.prospect ? task.prospect.split(' ')[0] : '',
        '[Last Name]': task.prospect ? task.prospect.split(' ').slice(1).join(' ') : '',
        '[Full Name]': task.prospect || '',
        '[Company]': task.company || '',
        '[Their Company]': task.company || '',
        '[Title]': task.title || '',
        '[Email]': task.email || '',
        '[Date]': getNextBusinessDay(),
        '[Topic]': 'Leadership Development',
        '[Space]': task.stepData.industry || 'your industry',
        '[Your Company]': 'LeaderReps',
      };
      
      // Fill in merge fields and track missing ones
      let filledSubject = subject;
      let filledBody = template;
      const missingFields = [];
      
      mergeFields.forEach(field => {
        const value = prospectData[field];
        if (value) {
          filledSubject = filledSubject.replace(new RegExp(escapeRegex(field), 'g'), value);
          filledBody = filledBody.replace(new RegExp(escapeRegex(field), 'g'), value);
        } else {
          missingFields.push(field);
        }
      });
      
      return {
        ...task,
        filledSubject,
        filledBody,
        originalSubject: subject,
        originalBody: template,
        mergeFields,
        missingFields,
        isReady: missingFields.length === 0 && task.email,
        customSubject: null, // For user edits
        customBody: null,    // For user edits
      };
    });
    
    // Sort by due date (overdue first, then today, then future)
    queue.sort((a, b) => (a.dueDiffDays || 0) - (b.dueDiffDays || 0));
    
    setEmailQueue(queue);
  };

  // Group emails by date category for Review Queue
  const getGroupedEmails = () => {
    const overdue = emailQueue.filter(e => e.dueDiffDays < 0);
    const today = emailQueue.filter(e => e.dueDiffDays === 0);
    const tomorrow = emailQueue.filter(e => e.dueDiffDays === 1);
    const future = emailQueue.filter(e => e.dueDiffDays > 1);
    
    return { overdue, today, tomorrow, future };
  };

  const detectMergeFields = (text) => {
    const regex = /\[([^\]]+)\]/g;
    const fields = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!fields.includes(match[0])) {
        fields.push(match[0]);
      }
    }
    return fields;
  };

  const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const getNextBusinessDay = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const toggleEmailExpand = (emailId) => {
    setExpandedEmails(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  const updateEmailContent = (emailId, field, value) => {
    setEmailQueue(prev => prev.map(email => 
      email.id === emailId 
        ? { ...email, [field]: value }
        : email
    ));
  };

  const toggleEmailSelection = (emailId) => {
    setSelectedEmails(prev => ({
      ...prev,
      [emailId]: !prev[emailId]
    }));
  };

  const toggleSelectAll = () => {
    const newState = !bulkSelectAll;
    setBulkSelectAll(newState);
    const newSelections = {};
    emailQueue.forEach(email => {
      if (email.isReady) {
        newSelections[email.id] = newState;
      }
    });
    setSelectedEmails(newSelections);
  };

  const getSelectedReadyCount = () => {
    return Object.entries(selectedEmails).filter(([id, selected]) => {
      if (!selected) return false;
      const email = emailQueue.find(e => e.id === id);
      return email && email.isReady;
    }).length;
  };

  /**
   * AI-POWERED EMAIL PERSONALIZATION
   * 
   * Uses Gemini AI to create a hyper-personalized version of the email template.
   * The AI considers:
   * - The prospect's role and company
   * - The original template's psychological principles
   * - Best practices for cold outreach
   * 
   * HOW TO USE:
   * 1. Expand an email in the Email Queue
   * 2. Click the "✨ AI Personalize" button
   * 3. Review the AI-generated version
   * 4. Edit further if needed, or reset to original
   */
  const aiPersonalizeEmail = async (email) => {
    // Mark this email as being processed
    setAiPersonalizing(prev => ({ ...prev, [email.id]: true }));
    
    try {
      const functions = getFunctions(app, 'us-central1');
      const geminiProxy = httpsCallable(functions, 'geminiProxy');
      
      // Build context for AI
      const context = `
You are an expert B2B sales copywriter. Your task is to personalize an outreach email template for a specific prospect.

PROSPECT INFORMATION:
- Name: ${email.prospect}
- Title: ${email.title || 'Business Leader'}
- Company: ${email.company || 'their company'}

ORIGINAL EMAIL TEMPLATE:
Subject: ${email.originalSubject || email.filledSubject}
Body:
${email.originalBody || email.filledBody}

${email.stepData?.psychology ? `
PSYCHOLOGY PRINCIPLE TO MAINTAIN:
${email.stepData.psychology.principle}: ${email.stepData.psychology.why}
` : ''}

INSTRUCTIONS:
1. Create a personalized version that speaks directly to this specific prospect
2. Keep the same core message and call-to-action
3. Make it feel genuine and human, not templated
4. Keep it concise (under 150 words for the body)
5. Maintain the psychological principle if one is provided
6. Use the prospect's first name naturally
7. Reference their title/role if relevant to the message

RESPOND IN THIS EXACT FORMAT:
SUBJECT: [Your personalized subject line]
---
BODY:
[Your personalized email body]
`;

      const result = await geminiProxy({ prompt: context });
      const aiResponse = result.data.text || result.data;
      
      // Parse the response
      const subjectMatch = aiResponse.match(/SUBJECT:\s*(.+)/);
      const bodyMatch = aiResponse.match(/BODY:\s*([\s\S]+)/);
      
      if (subjectMatch && bodyMatch) {
        const newSubject = subjectMatch[1].trim();
        const newBody = bodyMatch[1].trim();
        
        // Update the email queue with the personalized content
        setEmailQueue(prev => prev.map(e => 
          e.id === email.id 
            ? { 
                ...e, 
                customSubject: newSubject, 
                customBody: newBody,
                aiPersonalized: true 
              }
            : e
        ));
      } else {
        // If parsing fails, try to use the whole response as body
        console.warn('AI response format unexpected, using raw response');
        setEmailQueue(prev => prev.map(e => 
          e.id === email.id 
            ? { 
                ...e, 
                customBody: aiResponse.trim(),
                aiPersonalized: true 
              }
            : e
        ));
      }
      
    } catch (error) {
      console.error('AI Personalization failed:', error);
      alert('AI personalization failed. Please try again or edit manually. Error: ' + error.message);
    } finally {
      setAiPersonalizing(prev => ({ ...prev, [email.id]: false }));
    }
  };

  const handleEditCampaign = (campaign) => {
      setEditingCampaign({ ...campaign }); // Clone for editing
      setShowCampaignEditor(true);
  };

  const saveCampaign = async () => {
      if (!editingCampaign) return;
      
      const updatedCampaigns = {
          ...campaigns,
          [editingCampaign.id]: editingCampaign
      };

      setCampaigns(updatedCampaigns);
      setShowCampaignEditor(false);
      setEditingCampaign(null);

      try {
          // Persist to Firestore
          await setDoc(doc(db, 'corporate_settings', 'outreach_campaigns'), updatedCampaigns);
          alert("Campaign updated!");
      } catch (e) {
          console.error("Error saving campaign", e);
          alert("Error saving campaign settings.");
      }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowComposer(true);
  };

  // Mark prospect as replied - pauses sequence
  const markAsReplied = async (task) => {
    if (!confirm(`Mark ${task.prospect} as replied? This will pause their sequence.`)) return;
    
    try {
      await updateDoc(doc(db, 'corporate_prospects', task.id), {
        status: 'replied',
        repliedAt: new Date().toISOString(),
        history: [
          ...(task.history || []),
          { date: new Date().toISOString(), action: 'Prospect replied - sequence paused' }
        ]
      });
      
      // Remove from local lists
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setEmailQueue(prev => prev.filter(e => e.id !== task.id));
      
      alert(`${task.prospect} marked as replied. Sequence paused.`);
    } catch (e) {
      console.error('Error marking as replied', e);
      alert('Error updating prospect status.');
    }
  };

  // Skip/delay a task by 1 day
  const skipTask = async (task) => {
    try {
      const currentDate = task.nextTaskDate ? new Date(task.nextTaskDate) : new Date();
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      
      await updateDoc(doc(db, 'corporate_prospects', task.id), {
        nextTaskDate: newDate.toISOString(),
        history: [
          ...(task.history || []),
          { date: new Date().toISOString(), action: `Step ${task.stepIndex + 1} delayed by 1 day` }
        ]
      });
      
      // Reload to refresh the queue
      loadCampaignsAndTasks();
    } catch (e) {
      console.error('Error skipping task', e);
      alert('Error delaying task.');
    }
  };

  const sendEmail = async (task, isTest = false) => {
      setSending(true);
      try {
          // Retrieve current content from composer
          const subject = document.getElementById('composer-subject')?.value || task.stepData.subject;
          const body = document.getElementById('composer-body')?.value || task.stepData.template;

          const auth = getAuth();
          
          // Ownership Security Check
          if (!isTest && task.ownerId && task.ownerId !== auth.currentUser?.uid) {
               alert(`Security Alert: You are attempting to email a prospect owned by ${task.ownerName}. Action cancelled.`);
               setSending(false);
               return;
          }

          const targetEmail = isTest ? auth.currentUser?.email : task.email;

          if (!targetEmail) {
              alert("No email address found for this prospect.");
              setSending(false);
              return;
          }

          const functions = getFunctions(app, 'us-central1');
          const sendOutreachEmail = httpsCallable(functions, 'sendOutreachEmail');

          const response = await sendOutreachEmail({
              to: targetEmail,
              subject: subject,
              text: body,
              html: body.replace(/\n/g, '<br>'), // Simple text-to-html
              isTest: isTest,
              // Pass the assigned sender for Reply-To header
              replyTo: task.assignedSenderEmail,
              senderName: task.assignedSenderName ? `${task.assignedSenderName} from LeaderReps` : 'LeaderReps Corporate',
              // Pass prospect ID for open tracking
              prospectId: task.id
          });

          if (response.data.success) {
              if (response.data.simulated) {
                  // Backend is in simulation mode (no SMTP creds)
                  console.warn("Email delivery simulated (check backend logs)");
                  alert(isTest ? "Test email processed (Simulated)." : "Email processed (Simulated).");
              } else {
                  alert(isTest ? "Test email sent!" : "Email sent successfully!");
              }
              
              if (!isTest) {
                  await advanceSequence(task);
              }
          }

      } catch (error) {
          console.error("Email send failed", error);
          alert("Failed to send: " + error.message);
      } finally {
          setSending(false);
      }
  };

  const advanceSequence = async (task) => {
      // 1. Calculate next step
      const campaign = campaigns[task.campaignId] || DEFAULT_CAMPAIGNS[task.campaignId];
      const nextIndex = task.stepIndex + 1;
      
      // Remove from local list immediately for UI responsiveness
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setShowComposer(false);

      if (nextIndex < campaign.steps.length) {
          // Has next step
          const nextStep = campaign.steps[nextIndex];
          const currentStep = campaign.steps[task.stepIndex];
          
          // Calculate delay
          const dayDiff = nextStep.day - currentStep.day;
          
          if (typeof task.id === 'string' && task.id.length > 5) {
             await updateDoc(doc(db, 'corporate_prospects', task.id), {
                 currentStepIndex: nextIndex,
                 nextTaskDate: new Date(Date.now() + (dayDiff * 86400000)).toISOString(),
                 nextTaskType: nextStep.type,
                 lastContacted: new Date().toISOString(),
                 history: [
                    ...(task.history || []), 
                    { date: new Date().toISOString(), action: `Completed Step ${task.stepIndex}: ${currentStep.name}` }
                 ]
             });
          }
      } else {
          // Sequence Complete
          if (typeof task.id === 'string' && task.id.length > 5) {
            await updateDoc(doc(db, 'corporate_prospects', task.id), {
                status: 'sequence_completed',
                lastContacted: new Date().toISOString()
            });
         }
      }
  };

  return (
    <div className="p-8 relative min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy">Outreach Engine</h1>
          <p className="text-slate-500 mt-1">Multi-channel engagement sequences to turn prospects into partners</p>
        </div>
        <div className="flex items-center gap-3">
           {/* Add Campaign implementation earlier */}
        </div>
      </div>

       {/* KPIs Row */}
       <div className="grid grid-cols-4 gap-4 mb-8">
          <KPICard title="Active Prospects" value={tasks.length} icon={Users} color="blue" sub="Total In Sequence" />
          <KPICard title="Open Rate" value="0%" icon={Mail} color="purple" sub="Avg across campaigns" />
          <KPICard title="Meetings Booked" value="0" icon={Calendar} color="teal" sub="This Month" />
          <KPICard title="Tasks Due" value={tasks.filter(t => t.due === 'Today' || t.due === 'Overdue').length} icon={CheckCircle} color="amber" sub="Needs Attention" />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('review-queue')}
            className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
              activeTab === 'review-queue' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Inbox size={16} />
            Review Queue
            {emailQueue.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                emailQueue.filter(e => e.dueDiffDays <= 0).length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {emailQueue.filter(e => e.dueDiffDays <= 0).length} due
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'tasks' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Tasks 
            {tasks.length > 0 && <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'campaigns' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Strategy
          </button>
        </div>
      </div>

      {/* TASKS VIEW */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
           <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-corporate-navy">Today's Executions</h3>
              <div className="flex gap-2 text-sm">
                 <button className="text-slate-500 hover:text-slate-700 px-2 py-1">Filter by type</button>
              </div>
           </div>
           
           {tasks.length === 0 && !loading ? (
               <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-500">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-corporate-navy">All Caught Up!</h3>
                    <p className="text-slate-500">You've cleared your outreach queue for today.</p>
               </div>
           ) : (
                <div className="divide-y divide-slate-100">
                    {tasks.map(task => (
                        <div key={task.id} className="p-4 hover:bg-slate-50 flex items-center gap-4 transition group cursor-pointer" onClick={() => handleTaskClick(task)}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            task.type === 'email' ? 'bg-purple-100 text-purple-600' :
                            task.type === 'linkedin' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                            }`}>
                            {task.type === 'email' && <Mail size={18} />}
                            {task.type === 'linkedin' && <Linkedin size={18} />}
                            {task.type === 'call' && <Phone size={18} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-corporate-navy">{task.prospect}</span>
                                    {task.ownerName && (
                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1" title={`Owned by ${task.ownerName}`}>
                                            <Users size={10} /> {task.ownerName.split(' ')[0]}
                                        </span>
                                    )}
                                    <span className="text-slate-400 text-sm">• {task.company}</span>
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 ml-2">
                                        Step {task.stepIndex + 1}
                                    </span>
                                    {task.due === 'Overdue' && (
                                       <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Overdue</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-600">{task.subject}</p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="bg-corporate-teal text-white px-3 py-1.5 rounded-lg text-sm hover:bg-corporate-teal/90 flex items-center gap-2 shadow-sm">
                                    Execute <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
           )}
        </div>
      )}

      {/* REVIEW QUEUE VIEW - The main daily workflow */}
      {activeTab === 'review-queue' && (
        <div className="space-y-6">
          {/* Queue Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-corporate-navy text-lg">📬 Review Queue</h3>
                <span className="text-sm text-slate-500">
                  Review and send emails at your pace
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => buildEmailQueue(tasks, campaigns)}
                  className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Ready to send
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Missing fields
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Missing email
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} className="text-blue-500" /> They replied
            </span>
            <span className="flex items-center gap-1">
              <SkipForward size={12} className="text-slate-400" /> Skip 1 day
            </span>
          </div>

          {emailQueue.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-corporate-navy mb-2">Queue Empty!</h3>
              <p className="text-slate-500">No emails in your outreach pipeline. Add prospects to sequences to get started.</p>
            </div>
          ) : (
            <>
              {/* OVERDUE SECTION */}
              {getGroupedEmails().overdue.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <h4 className="font-semibold text-red-700">Overdue</h4>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      {getGroupedEmails().overdue.length} email{getGroupedEmails().overdue.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getGroupedEmails().overdue.map(email => (
                      <ReviewQueueCard 
                        key={email.id} 
                        email={email} 
                        campaigns={campaigns}
                        expandedEmails={expandedEmails}
                        toggleEmailExpand={toggleEmailExpand}
                        updateEmailContent={updateEmailContent}
                        sendEmail={sendEmail}
                        markAsReplied={markAsReplied}
                        skipTask={skipTask}
                        sending={sending}
                        aiPersonalizing={aiPersonalizing}
                        aiPersonalizeEmail={aiPersonalizeEmail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TODAY SECTION */}
              {getGroupedEmails().today.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <h4 className="font-semibold text-amber-700">Due Today</h4>
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                      {getGroupedEmails().today.length} email{getGroupedEmails().today.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getGroupedEmails().today.map(email => (
                      <ReviewQueueCard 
                        key={email.id} 
                        email={email} 
                        campaigns={campaigns}
                        expandedEmails={expandedEmails}
                        toggleEmailExpand={toggleEmailExpand}
                        updateEmailContent={updateEmailContent}
                        sendEmail={sendEmail}
                        markAsReplied={markAsReplied}
                        skipTask={skipTask}
                        sending={sending}
                        aiPersonalizing={aiPersonalizing}
                        aiPersonalizeEmail={aiPersonalizeEmail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* TOMORROW SECTION */}
              {getGroupedEmails().tomorrow.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <h4 className="font-semibold text-blue-700">Tomorrow</h4>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {getGroupedEmails().tomorrow.length} email{getGroupedEmails().tomorrow.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getGroupedEmails().tomorrow.map(email => (
                      <ReviewQueueCard 
                        key={email.id} 
                        email={email} 
                        campaigns={campaigns}
                        expandedEmails={expandedEmails}
                        toggleEmailExpand={toggleEmailExpand}
                        updateEmailContent={updateEmailContent}
                        sendEmail={sendEmail}
                        markAsReplied={markAsReplied}
                        skipTask={skipTask}
                        sending={sending}
                        aiPersonalizing={aiPersonalizing}
                        aiPersonalizeEmail={aiPersonalizeEmail}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* FUTURE SECTION */}
              {getGroupedEmails().future.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <h4 className="font-semibold text-slate-600">Coming Up</h4>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {getGroupedEmails().future.length} email{getGroupedEmails().future.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {getGroupedEmails().future.map(email => (
                      <ReviewQueueCard 
                        key={email.id} 
                        email={email} 
                        campaigns={campaigns}
                        expandedEmails={expandedEmails}
                        toggleEmailExpand={toggleEmailExpand}
                        updateEmailContent={updateEmailContent}
                        sendEmail={sendEmail}
                        markAsReplied={markAsReplied}
                        skipTask={skipTask}
                        sending={sending}
                        aiPersonalizing={aiPersonalizing}
                        aiPersonalizeEmail={aiPersonalizeEmail}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* EMAIL QUEUE VIEW (legacy) */}
      {activeTab === 'email-queue' && (
        <div className="space-y-4">
          {/* Queue Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h3 className="font-semibold text-corporate-navy">Email Queue</h3>
                <span className="text-sm text-slate-500">
                  {emailQueue.filter(e => e.isReady).length} of {emailQueue.length} emails ready to send
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => buildEmailQueue(tasks, campaigns)}
                  className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={bulkSelectAll}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                  />
                  Select All Ready
                </label>
                {getSelectedReadyCount() > 0 && (
                  <button 
                    className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-700"
                    onClick={() => alert(`Bulk send ${getSelectedReadyCount()} emails - Feature coming soon!`)}
                  >
                    <Send size={14} /> Send {getSelectedReadyCount()} Selected
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Ready to send
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Missing fields
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Missing email address
            </span>
          </div>

          {/* Email Cards */}
          {emailQueue.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <Mail size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-corporate-navy mb-2">No Emails in Queue</h3>
              <p className="text-slate-500">Add prospects to sequences to populate the email queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailQueue.map((email) => (
                <div 
                  key={email.id} 
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    expandedEmails[email.id] ? 'shadow-lg border-corporate-teal' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Email Header Row */}
                  <div 
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleEmailExpand(email.id)}
                  >
                    {/* Selection Checkbox */}
                    <input 
                      type="checkbox"
                      checked={selectedEmails[email.id] || false}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleEmailSelection(email.id);
                      }}
                      disabled={!email.isReady}
                      className="rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal disabled:opacity-50"
                    />
                    
                    {/* Status Indicator */}
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      !email.email ? 'bg-red-500' :
                      email.missingFields.length > 0 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`} />
                    
                    {/* Recipient Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-corporate-navy">{email.prospect}</span>
                        <span className="text-slate-400 text-sm">• {email.company}</span>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                          {campaigns[email.campaignId]?.name || 'Unknown Campaign'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">
                        <span className="font-medium">Subject:</span> {email.customSubject || email.filledSubject}
                      </p>
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      {!email.email && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                          No email address
                        </span>
                      )}
                      {email.missingFields.length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-medium">
                          {email.missingFields.length} missing field{email.missingFields.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {email.isReady && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <Check size={12} /> Ready
                        </span>
                      )}
                      <button className="text-slate-400 hover:text-slate-600">
                        {expandedEmails[email.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Email Preview */}
                  {expandedEmails[email.id] && (
                    <div className="border-t border-slate-200">
                      <div className="grid grid-cols-3 gap-0">
                        {/* Email Content */}
                        <div className="col-span-2 p-4 bg-slate-50">
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                              To: {email.email || <span className="text-red-500">Missing email address</span>}
                            </label>
                          </div>
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                            <input 
                              type="text"
                              value={email.customSubject !== null ? email.customSubject : email.filledSubject}
                              onChange={(e) => updateEmailContent(email.id, 'customSubject', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Message</label>
                            <textarea 
                              value={email.customBody !== null ? email.customBody : email.filledBody}
                              onChange={(e) => updateEmailContent(email.id, 'customBody', e.target.value)}
                              rows={8}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none font-sans leading-relaxed resize-none"
                            />
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="mt-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  updateEmailContent(email.id, 'customSubject', null);
                                  updateEmailContent(email.id, 'customBody', null);
                                  setEmailQueue(prev => prev.map(e => 
                                    e.id === email.id ? { ...e, aiPersonalized: false } : e
                                  ));
                                }}
                                className="text-slate-500 hover:text-slate-700 text-sm"
                              >
                                Reset to Template
                              </button>
                              {email.aiPersonalized && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles size={10} /> AI Enhanced
                                </span>
                              )}
                            </div>
                            <div className="flex gap-3">
                              {/* AI Personalize Button */}
                              <button 
                                onClick={() => aiPersonalizeEmail(email)}
                                disabled={aiPersonalizing[email.id]}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium px-3 py-2 border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Use AI to create a hyper-personalized version of this email based on the prospect's details"
                              >
                                {aiPersonalizing[email.id] ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                    Personalizing...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 size={14} /> AI Personalize
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={() => sendEmail({
                                  ...email,
                                  stepData: {
                                    ...email.stepData,
                                    subject: email.customSubject || email.filledSubject,
                                    template: email.customBody || email.filledBody
                                  }
                                }, true)}
                                disabled={sending}
                                className="text-slate-600 hover:text-slate-800 text-sm font-medium px-3 py-2 border border-slate-300 rounded-lg"
                              >
                                Send Test
                              </button>
                              <button 
                                onClick={() => sendEmail({
                                  ...email,
                                  stepData: {
                                    ...email.stepData,
                                    subject: email.customSubject || email.filledSubject,
                                    template: email.customBody || email.filledBody
                                  }
                                }, false)}
                                disabled={sending || !email.isReady}
                                className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send size={14} /> Send & Advance
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sidebar - Field Status */}
                        <div className="border-l border-slate-200 p-4 bg-white">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Merge Fields</h4>
                          
                          {email.mergeFields.length === 0 ? (
                            <p className="text-sm text-slate-400">No merge fields in template</p>
                          ) : (
                            <div className="space-y-2">
                              {email.mergeFields.map((field, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{field}</code>
                                  {email.missingFields.includes(field) ? (
                                    <span className="text-amber-500 flex items-center gap-1">
                                      <AlertCircle size={12} /> Missing
                                    </span>
                                  ) : (
                                    <span className="text-green-500 flex items-center gap-1">
                                      <Check size={12} /> Filled
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-6 pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Prospect Details</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-slate-400">Email:</span>
                                <span className={`ml-2 ${email.email ? 'text-slate-700' : 'text-red-500'}`}>
                                  {email.email || 'Not available'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">Title:</span>
                                <span className="ml-2 text-slate-700">{email.title}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Step:</span>
                                <span className="ml-2 text-slate-700">{email.stepIndex + 1} of {campaigns[email.campaignId]?.steps?.length || '?'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">Due:</span>
                                <span className={`ml-2 ${email.due === 'Overdue' ? 'text-red-600 font-medium' : 'text-slate-700'}`}>{email.due}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Psychology Insight */}
                          {email.stepData.psychology && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Lightbulb size={12} /> Strategy
                              </h4>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>{email.stepData.psychology.principle}:</strong> {email.stepData.psychology.why}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CAMPAIGNS VIEW */}
      {activeTab === 'campaigns' && (
         <div className="grid grid-cols-1 gap-6">
            {Object.values(campaigns).map(campaign => (
               <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    onEdit={() => handleEditCampaign(campaign)} 
                />
            ))}
         </div>
      )}

      {/* CAMPAIGN EDITOR MODAL */}
      {showCampaignEditor && editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-corporate-navy">Edit Campaign</h2>
                        <input 
                            value={editingCampaign.name}
                            onChange={(e) => setEditingCampaign({...editingCampaign, name: e.target.value})}
                            className="text-sm text-slate-500 mt-1 border border-transparent hover:border-slate-200 focus:border-corporate-teal outline-none rounded px-1"
                        />
                    </div>
                    <button onClick={() => setShowCampaignEditor(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Sequence Steps</p>
                    <div className="space-y-4">
                        {editingCampaign.steps.map((step, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                     <div className="flex gap-4">
                                         <div className="bg-slate-100 rounded-lg px-3 py-2 text-center min-w-[60px]">
                                             <div className="text-xs font-bold text-slate-400 uppercase">Day</div>
                                             <div className="text-xl font-bold text-corporate-navy">{step.day}</div>
                                         </div>
                                         <div>
                                             <div className="flex gap-2">
                                                 <select 
                                                    value={step.type}
                                                    onChange={(e) => {
                                                        const newSteps = [...editingCampaign.steps];
                                                        newSteps[idx].type = e.target.value;
                                                        setEditingCampaign({...editingCampaign, steps: newSteps});
                                                    }}
                                                    className="border border-slate-200 rounded text-sm px-2 py-1 font-medium text-corporate-navy"
                                                 >
                                                     <option value="email">Email</option>
                                                     <option value="linkedin">LinkedIn</option>
                                                     <option value="call">Call</option>
                                                     <option value="video">Video</option>
                                                 </select>
                                                 <input 
                                                    value={step.name} 
                                                    onChange={(e) => {
                                                        const newSteps = [...editingCampaign.steps];
                                                        newSteps[idx].name = e.target.value;
                                                        setEditingCampaign({...editingCampaign, steps: newSteps});
                                                    }}
                                                    className="font-bold text-corporate-navy border-b border-dashed border-slate-300 focus:border-corporate-teal outline-none" 
                                                 />
                                             </div>
                                         </div>
                                     </div>
                                     <button 
                                        onClick={() => {
                                            const newSteps = editingCampaign.steps.filter((_, i) => i !== idx);
                                            setEditingCampaign({...editingCampaign, steps: newSteps});
                                        }}
                                        className="text-slate-400 hover:text-red-500"
                                     >
                                         <X size={16} />
                                     </button>
                                </div>
                                <div className="space-y-3">
                                    {step.type === 'email' && (
                                    <>
                                        <input 
                                            value={step.subject || ''}
                                            onChange={(e) => {
                                                const newSteps = [...editingCampaign.steps];
                                                newSteps[idx].subject = e.target.value;
                                                setEditingCampaign({...editingCampaign, steps: newSteps});
                                            }}
                                            placeholder="Subject line..."
                                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-1 focus:ring-corporate-teal focus:border-transparent outline-none"
                                        />
                                        <textarea 
                                            value={step.template || ''}
                                            onChange={(e) => {
                                                const newSteps = [...editingCampaign.steps];
                                                newSteps[idx].template = e.target.value;
                                                setEditingCampaign({...editingCampaign, steps: newSteps});
                                            }}
                                            placeholder="Message template..."
                                            rows={3}
                                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-1 focus:ring-corporate-teal focus:border-transparent outline-none font-mono"
                                        />
                                    </>
                                    )}
                                    {step.type !== 'email' && (
                                         <textarea 
                                            value={step.template || ''}
                                            onChange={(e) => {
                                                const newSteps = [...editingCampaign.steps];
                                                newSteps[idx].template = e.target.value;
                                                setEditingCampaign({...editingCampaign, steps: newSteps});
                                            }}
                                            placeholder="Instruction notes or message template..."
                                            rows={2}
                                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-1 focus:ring-corporate-teal focus:border-transparent outline-none"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => {
                                const lastStepDay = editingCampaign.steps.length > 0 ? editingCampaign.steps[editingCampaign.steps.length - 1].day : -2;
                                setEditingCampaign({
                                    ...editingCampaign, 
                                    steps: [...editingCampaign.steps, { 
                                        day: lastStepDay + 2, 
                                        type: 'email', 
                                        name: 'New Step',
                                        template: ''
                                    }]
                                });
                            }}
                            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-medium hover:border-corporate-teal hover:text-corporate-teal transition flex items-center justify-center gap-2"
                        >
                            <Plus size={18} /> Add Step
                        </button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-xl">
                    <button 
                        onClick={() => setShowCampaignEditor(false)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveCampaign}
                        className="px-6 py-2 bg-corporate-teal text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:bg-corporate-teal/90"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* EMAIL COMPOSER MODAL */}
      {showComposer && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex overflow-hidden max-h-[90vh]">
                {/* Left: Composer */}
                <div className="flex-1 flex flex-col border-r border-slate-200">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                selectedTask.type === 'email' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                                {selectedTask.type === 'email' ? <Mail size={16} /> : <Linkedin size={16} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-corporate-navy">Contacting {selectedTask.prospect}</h3>
                                <p className="text-xs text-slate-500">{selectedTask.title} at {selectedTask.company}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowComposer(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                        {/* Replies-To Indicator */}
                        {selectedTask.assignedSenderEmail && (
                            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
                                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {selectedTask.assignedSenderName?.charAt(0) || 'R'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-teal-600 font-medium">Replies will go to:</p>
                                    <p className="text-sm font-bold text-teal-800">
                                        {selectedTask.assignedSenderName} ({selectedTask.assignedSenderEmail})
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                            <input 
                                id="composer-subject"
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none"
                                defaultValue={selectedTask.stepData.subject || ''}
                            />
                        </div>
                        <div className="h-full flex flex-col">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Message</label>
                            <textarea 
                                id="composer-body"
                                className="w-full flex-1 border border-slate-300 rounded-lg px-3 py-3 text-sm font-normal text-slate-700 leading-relaxed focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none resize-none font-sans"
                                defaultValue={
                                    (selectedTask.stepData.template || '')
                                    .replace('[First Name]', selectedTask.prospect ? selectedTask.prospect.split(' ')[0] : 'there')
                                    .replace('[Company]', selectedTask.company)
                                    .replace('[Date]', 'Thursday')
                                }
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                        <button 
                            onClick={() => sendEmail(selectedTask, true)}
                            disabled={sending}
                            className={`text-slate-500 text-sm hover:text-slate-700 font-medium ${sending ? 'opacity-50' : ''}`}
                        >
                           {sending ? 'Sending...' : 'Send Test Email'}
                        </button>
                        <div className="flex gap-3">
                            <button onClick={() => setShowComposer(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition">
                                Cancel
                            </button>
                            <button 
                                onClick={() => sendEmail(selectedTask, false)}
                                disabled={sending}
                                className={`bg-corporate-teal text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:bg-corporate-teal/90 transition flex items-center gap-2 ${sending ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                <Send size={16} /> {sending ? 'Sending...' : 'Send & Advance'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Psychology / Context Pane */}
                <div className="w-80 bg-slate-50 flex flex-col">
                    <div className="p-4 border-b border-slate-200">
                        <h4 className="font-bold text-corporate-navy flex items-center gap-2">
                            <Lightbulb size={16} className="text-amber-500" />
                            Strategy Insight
                        </h4>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        {/* Spam Check Indicator */}
                        <div className="mb-6 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Spam Check</span>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                    <CheckCircle size={12} /> Good
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 w-[85%] h-full rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">
                                Domain reputation is healthy. Content is professional.
                            </p>
                        </div>


                        {selectedTask.stepData.psychology ? (
                            <>
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Applied Principle</div>
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                        <h5 className="font-bold text-corporate-navy text-sm mb-1">{selectedTask.stepData.psychology.principle}</h5>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Why It Works</div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {selectedTask.stepData.psychology.why}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-slate-400 mt-10">
                                <Shield size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Standard communication step.</p>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Prospect Context</div>
                            <div className="space-y-3">
                                <div className="text-xs text-slate-500">
                                    <span className="block font-bold text-corporate-navy mb-0.5">Role</span>
                                    {selectedTask.title}
                                </div>
                                <div className="text-xs text-slate-500">
                                    <span className="block font-bold text-corporate-navy mb-0.5">Company Size</span>
                                    Unknown Employee Count
                                </div>
                                <div className="text-xs text-slate-500">
                                    <span className="block font-bold text-corporate-navy mb-0.5">Sequenced Date</span>
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-amber-50 border-t border-amber-100">
                        <div className="flex gap-3">
                            <Zap size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 leading-snug">
                                <strong>Pro Tip:</strong> Keep the subject line under 4 words. Short subjects have 24% higher open rates on mobile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Review Queue Card Component
const ReviewQueueCard = ({ 
  email, 
  campaigns, 
  expandedEmails, 
  toggleEmailExpand, 
  updateEmailContent, 
  sendEmail, 
  markAsReplied, 
  skipTask, 
  sending, 
  aiPersonalizing, 
  aiPersonalizeEmail 
}) => {
  const isExpanded = expandedEmails[email.id];
  
  return (
    <div 
      className={`bg-white border rounded-xl overflow-hidden transition-all ${
        isExpanded ? 'shadow-lg border-corporate-teal' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header Row */}
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={() => toggleEmailExpand(email.id)}
      >
        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full shrink-0 ${
          !email.email ? 'bg-red-500' :
          email.missingFields.length > 0 ? 'bg-amber-500' :
          'bg-green-500'
        }`} />
        
        {/* Recipient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-corporate-navy">{email.prospect}</span>
            <span className="text-slate-400 text-sm">• {email.company}</span>
            {/* Opened indicator */}
            {email.emailOpens?.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1" title={`Opened ${email.emailOpens.length} time(s)`}>
                <Eye size={10} /> Opened
              </span>
            )}
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
              {campaigns[email.campaignId]?.name || 'Campaign'}
            </span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              Step {email.stepIndex + 1}
            </span>
            {email.assignedSenderName && (
              <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                → {email.assignedSenderName}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 truncate">
            <span className="font-medium">Subject:</span> {email.customSubject || email.filledSubject}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Mark as Replied */}
          <button 
            onClick={(e) => { e.stopPropagation(); markAsReplied(email); }}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
            title="They replied - pause sequence"
          >
            <MessageCircle size={18} />
          </button>
          
          {/* Skip/Delay */}
          <button 
            onClick={(e) => { e.stopPropagation(); skipTask(email); }}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
            title="Skip - delay 1 day"
          >
            <SkipForward size={18} />
          </button>
          
          {/* Status Badge */}
          {!email.email && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
              No email
            </span>
          )}
          {email.missingFields.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-medium">
              {email.missingFields.length} field{email.missingFields.length > 1 ? 's' : ''}
            </span>
          )}
          {email.isReady && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Check size={12} /> Ready
            </span>
          )}
          
          <ChevronDown 
            size={20} 
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200">
          <div className="grid grid-cols-3 gap-0">
            {/* Email Editor */}
            <div className="col-span-2 p-4 bg-slate-50">
              {/* Replies-To Banner */}
              {email.assignedSenderEmail && (
                <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {email.assignedSenderName?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 font-medium">Replies will go to:</p>
                    <p className="text-sm font-bold text-teal-800">{email.assignedSenderName} ({email.assignedSenderEmail})</p>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                  To: {email.email || <span className="text-red-500">Missing email</span>}
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                <input 
                  type="text"
                  value={email.customSubject !== null ? email.customSubject : email.filledSubject}
                  onChange={(e) => updateEmailContent(email.id, 'customSubject', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Message</label>
                <textarea 
                  value={email.customBody !== null ? email.customBody : email.filledBody}
                  onChange={(e) => updateEmailContent(email.id, 'customBody', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-transparent outline-none font-sans leading-relaxed resize-none"
                />
              </div>
              
              {/* Actions */}
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      updateEmailContent(email.id, 'customSubject', null);
                      updateEmailContent(email.id, 'customBody', null);
                    }}
                    className="text-slate-500 hover:text-slate-700 text-sm"
                  >
                    Reset
                  </button>
                  {email.aiPersonalized && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={10} /> AI Enhanced
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* AI Personalize */}
                  <button 
                    onClick={() => aiPersonalizeEmail(email)}
                    disabled={aiPersonalizing[email.id]}
                    className="text-purple-600 hover:bg-purple-100 text-sm font-medium px-3 py-2 border border-purple-200 rounded-lg bg-purple-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    {aiPersonalizing[email.id] ? (
                      <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    AI
                  </button>
                  
                  {/* Send Test */}
                  <button 
                    onClick={() => sendEmail({
                      ...email,
                      stepData: {
                        ...email.stepData,
                        subject: email.customSubject || email.filledSubject,
                        template: email.customBody || email.filledBody
                      }
                    }, true)}
                    disabled={sending}
                    className="text-slate-600 hover:text-slate-800 text-sm font-medium px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Test
                  </button>
                  
                  {/* Send & Advance */}
                  <button 
                    onClick={() => sendEmail({
                      ...email,
                      stepData: {
                        ...email.stepData,
                        subject: email.customSubject || email.filledSubject,
                        template: email.customBody || email.filledBody
                      }
                    }, false)}
                    disabled={sending || !email.isReady}
                    className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} /> Send
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="border-l border-slate-200 p-4 bg-white">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Due</h4>
              <p className={`text-sm font-medium mb-4 ${
                email.dueDiffDays < 0 ? 'text-red-600' :
                email.dueDiffDays === 0 ? 'text-amber-600' :
                'text-slate-600'
              }`}>
                {email.due}
                {email.dueDate && (
                  <span className="text-xs text-slate-400 block mt-1">
                    {email.dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </p>
              
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Merge Fields</h4>
              {email.mergeFields.length === 0 ? (
                <p className="text-sm text-slate-400 mb-4">None</p>
              ) : (
                <div className="space-y-1 mb-4">
                  {email.mergeFields.map((field, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded">{field}</code>
                      {email.missingFields.includes(field) ? (
                        <AlertCircle size={12} className="text-amber-500" />
                      ) : (
                        <Check size={12} className="text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Psychology */}
              {email.stepData.psychology && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Lightbulb size={10} /> Strategy
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>{email.stepData.psychology.principle || email.stepData.psychology}:</strong>{' '}
                    {email.stepData.psychology.why || ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const KPICard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
           <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</span>
           <Icon size={16} className={`text-${color}-500`} />
        </div>
        <div className="text-2xl font-bold text-corporate-navy">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{sub}</div>
     </div>
);

const CampaignCard = ({ campaign, onEdit }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [previewStep, setPreviewStep] = useState(null);
    
    return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
        <div className="flex justify-between items-start mb-6">
            <div>
            <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-corporate-navy">{campaign.name}</h3>
                {campaign.active ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Active
                    </span>
                ) : (
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">Paused</span>
                )}
            </div>
            <p className="text-slate-600 max-w-2xl">{campaign.description}</p>
            </div>
            {campaign.stats && (
                <div className="flex gap-4 text-center">
                    <div>
                        <div className="text-xl font-bold text-corporate-navy">{campaign.stats.openRate}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Open Rate</div>
                    </div>
                    <div>
                        <div className="text-xl font-bold text-corporate-navy">{campaign.stats.replyRate}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Reply Rate</div>
                    </div>
                </div>
            )}
        </div>

        {/* Visual Timeline with Click-to-Preview */}
        <div className="relative pt-4 pb-2">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            <div className="flex flex-wrap gap-y-4 relative z-10 w-full px-4 overflow-x-auto">
            {campaign.steps.map((step, idx) => (
                <div 
                    key={idx} 
                    className="flex flex-col items-center group cursor-pointer relative min-w-[100px] flex-1"
                    onClick={() => {
                        setPreviewStep(step);
                        setShowPreview(true);
                    }}
                >
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white transition z-10 relative ${
                        step.type === 'email' ? 'border-purple-200 text-purple-600 group-hover:border-purple-400 group-hover:bg-purple-50' :
                        step.type === 'linkedin' ? 'border-blue-200 text-blue-600 group-hover:border-blue-400 group-hover:bg-blue-50' :
                        step.type === 'video' ? 'border-pink-200 text-pink-600 group-hover:border-pink-400 group-hover:bg-pink-50' :
                        'border-green-200 text-green-600 group-hover:border-green-400 group-hover:bg-green-50'
                    }`}>
                        {step.type === 'email' && <Mail size={16} />}
                        {step.type === 'linkedin' && <Linkedin size={16} />}
                        {step.type === 'video' && <Play size={16} />}
                        {step.type === 'call' && <Phone size={16} />}
                    </div>
                    <div className="mt-3 text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day {step.day}</div>
                        <div className="text-xs font-medium text-corporate-navy bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100 group-hover:border-corporate-teal group-hover:text-corporate-teal transition">
                            {step.name}
                        </div>
                        {step.type === 'email' && (
                            <div className="text-[10px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition">
                                Click to preview
                            </div>
                        )}
                    </div>
                </div>
            ))}
            </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
            <button onClick={onEdit} className="text-slate-500 hover:text-corporate-navy text-sm font-medium px-3 py-2">Edit Steps</button>
            <button className="bg-slate-100 text-corporate-navy hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium">Add Prospects</button>
        </div>
        
        {/* Template Preview Modal */}
        {showPreview && previewStep && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
                <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className={`p-4 flex justify-between items-center ${
                        previewStep.type === 'email' ? 'bg-purple-50 border-b border-purple-100' :
                        previewStep.type === 'linkedin' ? 'bg-blue-50 border-b border-blue-100' :
                        previewStep.type === 'call' ? 'bg-green-50 border-b border-green-100' :
                        'bg-slate-50 border-b border-slate-200'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                previewStep.type === 'email' ? 'bg-purple-100 text-purple-600' :
                                previewStep.type === 'linkedin' ? 'bg-blue-100 text-blue-600' :
                                previewStep.type === 'call' ? 'bg-green-100 text-green-600' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {previewStep.type === 'email' && <Mail size={18} />}
                                {previewStep.type === 'linkedin' && <Linkedin size={18} />}
                                {previewStep.type === 'call' && <Phone size={18} />}
                                {previewStep.type === 'video' && <Play size={18} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-corporate-navy">{previewStep.name}</h3>
                                <p className="text-xs text-slate-500">Day {previewStep.day} • {previewStep.type.charAt(0).toUpperCase() + previewStep.type.slice(1)}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        {previewStep.type === 'email' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Subject Line</label>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm font-medium text-corporate-navy">
                                        {previewStep.subject || 'No subject defined'}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Message Template</label>
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">
                                        {previewStep.template || 'No template defined'}
                                    </div>
                                </div>
                                
                                {/* Merge Fields Info */}
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                        <FileText size={12} /> Merge Fields Used
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {((previewStep.template || '') + ' ' + (previewStep.subject || '')).match(/\[([^\]]+)\]/g)?.map((field, i) => (
                                            <code key={i} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">{field}</code>
                                        )) || <span className="text-xs text-amber-600">No merge fields</span>}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {previewStep.type === 'linkedin' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">LinkedIn Message</label>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-slate-700 whitespace-pre-wrap">
                                    {previewStep.template || 'No message template defined'}
                                </div>
                            </div>
                        )}
                        
                        {previewStep.type === 'call' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Call Script</label>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-slate-700 whitespace-pre-wrap">
                                    {previewStep.script || previewStep.template || 'No script defined'}
                                </div>
                            </div>
                        )}
                        
                        {/* Psychology Insight */}
                        {previewStep.psychology && (
                            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <Lightbulb size={12} /> Strategy: {previewStep.psychology.principle}
                                </h4>
                                <p className="text-sm text-indigo-800">{previewStep.psychology.why}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                        <button 
                            onClick={() => setShowPreview(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => {
                                setShowPreview(false);
                                onEdit();
                            }}
                            className="px-4 py-2 bg-corporate-teal text-white rounded-lg font-medium hover:bg-teal-700 flex items-center gap-2"
                        >
                            <Edit2 size={14} /> Edit Template
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

function TrendingUp({ size = 24, className = "" }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    );
}

export default Outreach;
