// src/components/admin/LeaderRepsLab.jsx
// LeaderReps Lab — independent experiments. Some graduate to production, some don't.
// Each tool below is intentionally standalone — no shared state or workflow coupling.

import React from 'react';
import {
  FlaskConical,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  Users,
  Mountain,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import { useAppServices } from '../../services/useAppServices';

const StatusBadge = ({ status }) => {
  const styles =
    status === 'Live'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : status === 'MVP'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : 'bg-amber-100 text-amber-700 border-amber-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}
    >
      {status}
    </span>
  );
};

const ToolCard = ({ icon, title, status, children }) => {
  const Icon = icon;
  return (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-6 flex flex-col gap-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-corporate-teal/10 rounded-lg">
          <Icon className="w-5 h-5 text-corporate-teal" />
        </div>
        <h3 className="text-base font-bold text-corporate-navy dark:text-white">
          {title}
        </h3>
      </div>
      <StatusBadge status={status} />
    </div>
    <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
      {children}
    </div>
  </div>
  );
};

const LeaderRepsLab = () => {
  const { user, isAdmin, navigate } = useAppServices();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          You do not have permission to view this area.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('leaderreps-lab')}
          navigate={navigate}
        />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
            <FlaskConical className="w-6 h-6 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              LeaderReps Lab
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Independent experiments. Validate fast. Promote winners.
            </p>
          </div>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl">
          {/* Tool 1 — SMS Tool (Live) */}
          <ToolCard icon={MessageSquare} title="SMS Tool" status="Live">
            <p>
              Standalone SMS experiment. Hosted independently from the main
              platform.
            </p>
            <a
              href="https://leaderreps-lab.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
            >
              Open SMS Tool
              <ExternalLink className="w-4 h-4" />
            </a>
          </ToolCard>

          {/* Tool 2 — Anonymous Team Pulse (MVP) */}
          <ToolCard
            icon={Users}
            title={'Anonymous Team Pulse — “What Is It Like to Be Led By Me?”'}
            status="MVP"
          >
            <p>
              Free lead-magnet. Leaders self-serve from a public landing page,
              their team answers one anonymous question a week, and an AI
              coaching insight unlocks once enough responses arrive.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('team-pulse')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage campaigns + leads
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?pulse-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                View public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Public link to share: <code className="text-slate-600">/?pulse-start</code>
            </p>
          </ToolCard>

          {/* Tool 3 — Leadership Identity Statement Builder (MVP) */}
          <ToolCard
            icon={Compass}
            title="Leadership Identity Statement Builder"
            status="MVP"
          >
            <p>
              Free 90-second public tool. Four short prompts → an AI-crafted
              identity statement in three voices (Bold / Grounded /
              Aspirational). Optional email capture for the printable card.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/?identity-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Public link to share: <code className="text-slate-600">/?identity-start</code>
            </p>
          </ToolCard>

          {/* Tool 4 — Ascent 1 (Experimental) */}
          <ToolCard icon={Mountain} title="Ascent 1" status="MVP">
            <p>
              Original Ascent Arena experience. Moved here from the main
              navigator while we evaluate the next iteration.
            </p>
            <button
              onClick={() => navigate('ascent-arena')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
            >
              Open Ascent 1
              <ArrowRight className="w-4 h-4" />
            </button>
          </ToolCard>

          {/* Tool 4 — Ascent 2 (Experimental) */}
          <ToolCard icon={Mountain} title="Ascent 2" status="Experimental">
            <p>
              Ascent 2 prototype — admin preview of the next-generation
              development arc.
            </p>
            <button
              onClick={() => navigate('ascent-2')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
            >
              Open Ascent 2
              <ArrowRight className="w-4 h-4" />
            </button>
          </ToolCard>
        </div>

        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
};

export default LeaderRepsLab;
