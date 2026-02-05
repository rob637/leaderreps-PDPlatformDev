import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GitMerge, Play, Users, Linkedin, Mail, Clock, 
  ArrowRight, Sparkles, CheckCircle, Copy, Heart,
  MessageSquare, Presentation, Target, Zap
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * WorkflowTemplates - Dripify-inspired template gallery
 * 
 * One-click campaign templates users can deploy instantly.
 * Similar to Dripify's pre-built drip campaigns.
 */

const TEMPLATES = [
  {
    id: 'trojan-horse',
    name: 'The "Trojan Horse" Workshop',
    description: 'Invite leaders to a free session to demonstrate value before selling. High conversion, zero pressure.',
    icon: Users,
    color: 'emerald',
    metrics: { openRate: '42%', replyRate: '18%', meetings: 12 },
    steps: [
      { day: 0, type: 'email', action: 'Private Invite: Leader Circle' },
      { day: 3, type: 'linkedin', action: 'Connection + Mention Invite' },
      { day: 7, type: 'email', action: 'Send Value Asset (Culture Audit PDF)' },
      { day: 12, type: 'call', action: 'Brief "Close the Loop" Call' }
    ],
    psychology: 'Uses the "No Ask" Invitation and Law of Reciprocity to lower defenses.',
    tags: ['B2B', 'Enterprise', 'HR Leaders']
  },
  {
    id: 'founder-to-founder',
    name: 'Founder-to-Founder',
    description: 'Direct high-level outreach from one executive to another. Personal, authentic, and effective.',
    icon: Target,
    color: 'blue',
    metrics: { openRate: '55%', replyRate: '24%', meetings: 8 },
    steps: [
      { day: 0, type: 'linkedin', action: 'Warm Connection Request' },
      { day: 2, type: 'email', action: 'Quick Personal Question' },
      { day: 5, type: 'video', action: '30s Personal Loom Video' }
    ],
    psychology: 'Peer-to-peer framing eliminates hierarchy barriers and creates authentic connection.',
    tags: ['C-Suite', 'Founders', 'Personal']
  },
  {
    id: 'strategic-partnership',
    name: 'Strategic Partnership Discovery',
    description: 'Initiate high-level partnership discussions with complementary businesses.',
    icon: Zap,
    color: 'purple',
    metrics: { openRate: '38%', replyRate: '15%', meetings: 6 },
    steps: [
      { day: 0, type: 'email', action: 'Partnership Inquiry' },
      { day: 4, type: 'linkedin', action: 'LinkedIn Nudge + Connect' },
      { day: 8, type: 'email', action: 'Case Study / Success Story' }
    ],
    psychology: 'The "Better Together" framing focuses immediately on mutual value.',
    tags: ['Partnerships', 'Alliances', 'BD']
  },
  {
    id: 'demo-followup',
    name: 'Demo Follow-up Sequence',
    description: 'Nurture prospects who viewed your demo with perfectly timed touchpoints.',
    icon: Presentation,
    color: 'amber',
    metrics: { openRate: '61%', replyRate: '28%', meetings: 15 },
    steps: [
      { day: 0, type: 'email', action: 'Thanks for Watching!' },
      { day: 2, type: 'email', action: 'Key Insight / Takeaway' },
      { day: 5, type: 'linkedin', action: 'Casual Check-in' },
      { day: 8, type: 'email', action: 'Proposal / Next Steps Offer' }
    ],
    psychology: 'Strike while the iron is hot - capitalize on demonstrated interest.',
    tags: ['Post-Demo', 'Warm Leads', 'Sales']
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach Sprint',
    description: 'High-volume prospecting with optimized messaging and timing.',
    icon: Mail,
    color: 'rose',
    metrics: { openRate: '32%', replyRate: '8%', meetings: 10 },
    steps: [
      { day: 0, type: 'email', action: 'Initial Value Proposition' },
      { day: 3, type: 'email', action: 'Social Proof Follow-up' },
      { day: 6, type: 'linkedin', action: 'Connect + Personal Note' },
      { day: 10, type: 'email', action: 'Break-up Email' }
    ],
    psychology: 'The "Break-up Email" creates urgency through implied last chance.',
    tags: ['Cold Outreach', 'Volume', 'SDR']
  }
];

const colorMap = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', badge: 'bg-rose-100' }
};

const typeIcons = {
  email: Mail,
  linkedin: Linkedin,
  call: MessageSquare,
  video: Presentation
};

const WorkflowTemplates = ({ showAll = false }) => {
  const navigate = useNavigate();
  const [deploying, setDeploying] = useState(null);
  const [deployed, setDeployed] = useState([]);

  const handleDeploy = async (template) => {
    setDeploying(template.id);
    
    try {
      // Create the sequence in Firestore
      const newSequence = {
        name: template.name,
        description: template.description,
        status: 'draft',
        source: 'template',
        templateId: template.id,
        steps: template.steps.map((step, idx) => ({
          id: `step-${idx + 1}`,
          type: step.type,
          title: step.action,
          day: step.day,
          config: {}
        })),
        stats: { active: 0, completed: 0, replied: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'sales_sequences'), newSequence);
      
      setDeployed([...deployed, template.id]);
      
      // Navigate to sequences after short delay
      setTimeout(() => {
        navigate('/sales/sequences');
      }, 1000);
      
    } catch (error) {
      console.error('Error deploying template:', error);
    } finally {
      setDeploying(null);
    }
  };

  const templatesToShow = showAll ? TEMPLATES : TEMPLATES.slice(0, 3);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-fuchsia-600" />
            Workflow Templates
          </h2>
          <p className="text-slate-500 text-sm">Launch proven campaigns with one click</p>
        </div>
        {!showAll && (
          <Link 
            to="/sales/sequences"
            className="text-sm font-semibold text-corporate-teal flex items-center gap-1 hover:underline"
          >
            View All Templates <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templatesToShow.map(template => {
          const colors = colorMap[template.color];
          const Icon = template.icon;
          const isDeploying = deploying === template.id;
          const isDeployed = deployed.includes(template.id);

          return (
            <div 
              key={template.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {/* Header Bar */}
              <div className={`h-1 ${colors.bg.replace('50', '500')}`} />
              
              <div className="p-5 flex-1 flex flex-col">
                {/* Icon and Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${colors.bg}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{template.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Open:</span>
                    <span className="font-bold text-slate-700">{template.metrics.openRate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Reply:</span>
                    <span className="font-bold text-slate-700">{template.metrics.replyRate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Meetings:</span>
                    <span className="font-bold text-slate-700">{template.metrics.meetings}</span>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4 flex-1">
                  <div className="space-y-2">
                    {template.steps.slice(0, 3).map((step, idx) => {
                      const StepIcon = typeIcons[step.type] || Mail;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-white border border-slate-200">
                            <StepIcon className="w-3 h-3 text-slate-500" />
                          </div>
                          <span className="text-slate-400">Day {step.day}:</span>
                          <span className="text-slate-600 truncate">{step.action}</span>
                        </div>
                      );
                    })}
                    {template.steps.length > 3 && (
                      <div className="text-xs text-slate-400 pl-7">
                        +{template.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleDeploy(template)}
                  disabled={isDeploying || isDeployed}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    isDeployed 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : `${colors.bg} ${colors.text} hover:opacity-80`
                  }`}
                >
                  {isDeploying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </>
                  ) : isDeployed ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Deployed!
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Use This Template
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Psychology Tip */}
      <div className="mt-6 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-4 border border-violet-100">
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-violet-800 text-sm">Psychology-Backed Templates</h4>
            <p className="text-violet-600 text-xs mt-1">
              Each template uses proven psychology principles like reciprocity, social proof, and scarcity 
              to maximize engagement and response rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplates;
