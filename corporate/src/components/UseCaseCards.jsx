import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, TrendingUp, Users, Building2, 
  ArrowRight, CheckCircle, Zap
} from 'lucide-react';

/**
 * UseCaseCards - Dripify-inspired use case navigation
 * 
 * Presents workflows organized by role/use case:
 * - For Founders
 * - For Sales  
 * - For HR/L&D
 * 
 * Each card includes relevant quick-start actions.
 */

const USE_CASES = [
  {
    id: 'founders',
    title: 'For Founders',
    subtitle: 'Scale your network',
    description: 'Build strategic partnerships, investor relationships, and expand your market presence.',
    icon: Rocket,
    color: 'corporate-navy',
    gradient: 'from-slate-800 to-slate-900',
    features: [
      { label: 'Strategic Partnership Outreach', link: '/sales/sequences' },
      { label: 'Investor Relationship Builder', link: '/sales/prospects' },
      { label: 'Thought Leadership Amplifier', link: '/marketing/amplify' }
    ],
    cta: 'Start Founder Workflow',
    ctaLink: '/sales/sequences'
  },
  {
    id: 'sales',
    title: 'For Sales',
    subtitle: 'Close more deals',
    description: 'Automate prospecting, personalize outreach, and manage your entire pipeline in one place.',
    icon: TrendingUp,
    color: 'corporate-teal',
    gradient: 'from-teal-600 to-teal-700',
    features: [
      { label: 'Prospect Finder & Enrichment', link: '/sales/prospects' },
      { label: 'Multi-Channel Campaigns', link: '/sales/outreach' },
      { label: 'Demo & Proposal Builder', link: '/sales/demos' }
    ],
    cta: 'Start Sales Workflow',
    ctaLink: '/sales/prospects'
  },
  {
    id: 'hr',
    title: 'For HR & L&D',
    subtitle: 'Develop leaders',
    description: 'Manage cohorts, track development progress, and deliver personalized coaching at scale.',
    icon: Users,
    color: 'purple-600',
    gradient: 'from-purple-600 to-purple-700',
    features: [
      { label: 'Cohort Management', link: '/ops/team' },
      { label: 'Leader Analytics Dashboard', link: '/analytics/leaders' },
      { label: 'AI Coach Customization', link: '/coaching/ai' }
    ],
    cta: 'Start L&D Workflow',
    ctaLink: '/coaching/goals'
  }
];

const UseCaseCards = ({ showDetailed = true }) => {
  if (!showDetailed) {
    // Compact version for headers/dropdowns
    return (
      <div className="flex gap-4 p-2">
        {USE_CASES.map(useCase => {
          const Icon = useCase.icon;
          return (
            <Link
              key={useCase.id}
              to={useCase.ctaLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <Icon className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{useCase.title}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy">Quick Start by Role</h2>
          <p className="text-slate-500 text-sm">Pre-built workflows tailored to your goals</p>
        </div>
        <Zap className="w-6 h-6 text-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {USE_CASES.map(useCase => {
          const Icon = useCase.icon;
          
          return (
            <div 
              key={useCase.id}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-xl transition-all"
              style={{ 
                background: `linear-gradient(135deg, ${
                  useCase.id === 'founders' ? '#1e3a5f, #0f172a' :
                  useCase.id === 'sales' ? '#0d9488, #0f766e' :
                  '#7c3aed, #6d28d9'
                })`
              }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <pattern id={`grid-${useCase.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="5" cy="5" r="1" fill="white"/>
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill={`url(#grid-${useCase.id})`}/>
                </svg>
              </div>

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-5 h-5 text-white/80" />
                      <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                        {useCase.subtitle}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{useCase.title}</h3>
                  </div>
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-white/60" />
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  {useCase.description}
                </p>

                {/* Feature List */}
                <div className="space-y-2 mb-6">
                  {useCase.features.map((feature, idx) => (
                    <Link 
                      key={idx}
                      to={feature.link}
                      className="flex items-center gap-2 text-white/80 text-sm hover:text-white transition-colors group/item"
                    >
                      <CheckCircle className="w-4 h-4 text-white/40 group-hover/item:text-white/80" />
                      <span>{feature.label}</span>
                    </Link>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  to={useCase.ctaLink}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-4 py-2 rounded-lg transition-all w-full justify-center"
                >
                  {useCase.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UseCaseCards;
