// src/components/admin/LeaderRepsLab.jsx
// LeaderReps Lab — independent experiments. Some graduate to production, some don't.
// Each tool below is intentionally standalone — no shared state or workflow coupling.

import React from 'react';
import {
  FlaskConical,
  ShieldAlert,
  ExternalLink,
  Users,
  Mountain,
  Compass,
  ArrowRight,
  Brain,
  Zap,
  Presentation,
  Briefcase,
  Share2,
  UserPlus,
  Users2,
  Grid3x3,
  BookMarked,
  FileBarChart,
  Heart,
  ThumbsUp,
  BarChart3,
  MessageSquareWarning,
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

const SectionHeader = ({ title, description }) => (
  <div className="col-span-full mt-2 mb-1">
    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {title}
    </h2>
    {description && (
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
        {description}
      </p>
    )}
  </div>
);

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
          {/* ───────────────────────────────────────────── */}
          <SectionHeader
            title="Lead Magnets"
            description="Public-facing experiments designed to capture leads. Promote winners; sunset the rest."
          />

          {/* Anonymous Team Pulse */}
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
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?pulse-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </ToolCard>

          {/* Leadership Identity Statement Builder */}
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
              <button
                onClick={() => navigate('lab-identity-builder')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?identity-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </ToolCard>

          {/* Bad Boss Bingo */}
          <ToolCard icon={Grid3x3} title="Bad Boss Bingo" status="MVP">
            <p>
              Shareable bingo card of bad-management patterns. Tongue-in-cheek
              viral lead magnet — employees mark squares, share scores on
              LinkedIn, and discover LeaderReps via a gentle CTA.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-bad-boss-bingo')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?bingo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </ToolCard>

          {/* Leadership Phrasebook */}
          <ToolCard icon={BookMarked} title="Leadership Phrasebook" status="MVP">
            <p>
              Public, growing library of <em>exact scripts</em> for hard
              leadership moments. SEO-driven lead magnet. Each phrase deep-links
              to a LeaderReps practice rep.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-phrasebook')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?phrasebook"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </ToolCard>

          {/* State of Leadership Report */}
          <ToolCard
            icon={FileBarChart}
            title="State of Leadership Report"
            status="MVP"
          >
            <p>
              Annual HBR-style report aggregating anonymized platform data
              (“What 10,000 leaders struggled with most this year”). Free PDF,
              email-gated — becomes a recurring industry reference.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-state-of-leadership')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?state-of-leadership"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </ToolCard>

          {/* ───────────────────────────────────────────── */}
          <SectionHeader
            title="Lead Generation"
            description="Public lead magnets and the admin tools that send, view, or analyze the leads they produce."
          />

          {/* Kudos — moved here from Sales & Marketing */}
          <ToolCard icon={Heart} title="Kudos" status="MVP">
            <p>
              AI-moderated warm-touch lead magnet. Send a “kudos from the team
              at LeaderReps” to a prospect; every send is logged as a warm
              lead. Includes safety + voice filter and analytics dashboard.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-kudos')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://leaderreps-kudos.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Admin-only — send composer + analytics dashboard.
            </p>
          </ToolCard>

          {/* Reinforcing Feedback Kudos — leader-facing practice, lives in leadership-lab sub-app */}
          <ToolCard icon={ThumbsUp} title="Reinforcing Feedback Kudos" status="MVP">
            <p>
              Leader-facing practice rep. A logged-in leader drafts a piece of
              reinforcing feedback (a “kudos”) and an AI coach evaluates the
              draft for specificity, behavior-anchoring, and impact — then
              suggests stronger versions. Lives in the separate Leadership Lab
              sub-app.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://leaderreps-lab.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open external app
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              External experiment · leader-facing AI-coached practice (not an admin send tool).
            </p>
          </ToolCard>

          {/* Constructive Nudges — Kudos's twin, but for upward feedback */}
          <ToolCard
            icon={MessageSquareWarning}
            title="Constructive Nudges"
            status="MVP"
          >
            <p>
              Anonymous, AI-moderated upward feedback. A logged-in user picks
              issues from a curated catalog, gets auto-suggested improvements
              and Reps, and sends a constructive nudge to their boss — without
              ever revealing who sent it. Attacks, accusations, and identifying
              details are blocked before send.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-nudges')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/?nudge-start"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview public landing
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Public marketing landing routes visitors to free sign-up → in-platform composer. Send is auth-gated by design.
            </p>
          </ToolCard>

          {/* Test Lead Magnets — moved here from Sales & Marketing */}
          <ToolCard
            icon={BarChart3}
            title="Test Lead Magnets (DNA · ROI · Readiness)"
            status="MVP"
          >
            <p>
              Lead viewers for three assessments still in test: Leadership DNA,
              ROI Calculator, and Leadership Readiness. Live assessments (e.g.
              Accountability) stay in Sales &amp; Marketing.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-test-lead-magnets')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Manage
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://leaderreps-assessment.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-xs font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview · DNA
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://leaderreps-roi.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-xs font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview · ROI
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://leaderreps-readiness.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-xs font-semibold hover:bg-corporate-teal/5 transition-colors w-fit"
              >
                Preview · Readiness
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Admin-only — lead viewers for DNA, ROI, and Readiness.
            </p>
          </ToolCard>

          {/* ───────────────────────────────────────────── */}
          <SectionHeader
            title="Viral Growth Demos"
            description="Member-side funnel concepts. Demo-only, no Firestore impact."
          />

          {/* Win Card Generator */}
          <ToolCard icon={Share2} title="Win Card Generator" status="MVP">
            <p>
              "Strava for leaders" demo. Generates a brand-styled,
              LinkedIn-shareable card from a leader's win. Validates whether
              members will actually post growth artifacts to LinkedIn.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-win-card')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Admin-only — demo state, no Firestore writes.
            </p>
          </ToolCard>

          {/* Manager Multiplier */}
          <ToolCard icon={UserPlus} title="Manager Multiplier" status="MVP">
            <p>
              Dropbox-style B2B referral demo. Manager invites direct reports →
              both sides unlock value → Team Plan upsell. Visualizes the full
              invite → accept → convert funnel with rewards.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-manager-multiplier')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Admin-only — demo state, no Firestore writes.
            </p>
          </ToolCard>

          {/* Pod Match */}
          <ToolCard icon={Users2} title="Pod Match Simulator" status="MVP">
            <p>
              CrossFit-style "pods of 5" demo. Runs the matching algorithm on a
              mock cohort, scores each pod for diversity, and previews the Pod
              Home experience members would see.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('lab-pod-match')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Admin-only — demo state, no Firestore writes.
            </p>
          </ToolCard>

          {/* ───────────────────────────────────────────── */}
          <SectionHeader
            title="Experimental Platform Experiences"
            description="Alternative product surfaces and learning-engine prototypes."
          />

          {/* Ascent 1 */}
          <ToolCard icon={Mountain} title="Ascent 1" status="MVP">
            <p>
              Original Ascent Arena experience. Moved here from the main
              navigator while we evaluate the next iteration.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('ascent-arena')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Open to logged-in users — under evaluation.
            </p>
          </ToolCard>

          {/* Ascent 2 */}
          <ToolCard icon={Mountain} title="Ascent 2" status="MVP">
            <p>
              Ascent 2 prototype — admin preview of the next-generation
              development arc.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('ascent-2')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Admin-only — next-generation development arc preview.
            </p>
          </ToolCard>

          {/* Leadership Lab — cohort SMS + spaced-repetition experiment (consolidated from SMS Tool + SRS Engine) */}
          <ToolCard icon={FlaskConical} title="Leadership Lab (SMS + SRS Experiment)" status="MVP">
            <p>
              Separate cohort-engagement app. Delivers leadership reps over SMS
              with spaced-repetition cadence — validates both the SMS channel
              and the SRS schedule before promoting features into the main
              platform.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://leaderreps-lab.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 transition-colors w-fit"
              >
                Open external app
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              External experiment: <code className="text-slate-600">leaderreps-lab.web.app</code>
            </p>
          </ToolCard>

          {/* ───────────────────────────────────────────── */}
          <SectionHeader
            title="Sales / GTM Concepts"
            description="Design experiments for the revenue motion. Not yet built."
          />

          {/* Account Intelligence Engine */}
          <ToolCard icon={Brain} title="Account Intelligence Engine" status="Experimental">
            <p>
              Persistent dossiers on every target account, refreshed weekly.
              Tracks leadership turnover, layoffs, earnings call mentions of
              culture/talent, Glassdoor sentiment, and new VP hires. Delivers a
              Monday digest: “These 3 accounts had leadership changes — strike
              now.”
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 text-sm font-semibold w-fit cursor-not-allowed">
              Design Experiment
            </span>
          </ToolCard>

          {/* Trigger → Talk Track Generator */}
          <ToolCard icon={Zap} title="Trigger → Talk Track Generator" status="Experimental">
            <p>
              Auto-generates a personalized 3-touch outreach the moment a
              buying signal fires (new VP, layoff, earnings miss, “leadership
              development” in a job posting). Reps just click Send or Edit.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 text-sm font-semibold w-fit cursor-not-allowed">
              Design Experiment
            </span>
          </ToolCard>

          {/* Demo Auto-Pilot */}
          <ToolCard icon={Presentation} title="Demo Auto-Pilot" status="Experimental">
            <p>
              Live ROI calculator + guided discovery during the sales call.
              Asks 5 questions → generates a custom Leadership ROI Projection
              with the prospect’s specific numbers → emailed before the call
              ends. Wires into the existing roi-calculator.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 text-sm font-semibold w-fit cursor-not-allowed">
              Design Experiment
            </span>
          </ToolCard>

          {/* Champion Enablement Kits */}
          <ToolCard icon={Briefcase} title="Champion Enablement Kits" status="Experimental">
            <p>
              The “internal sale” tool. Generates a personalized board deck PDF
              for each prospect (logo, named pain points, peer benchmarks,
              custom pricing). The champion forwards it to their CFO. Solves the
              #1 reason enterprise deals stall.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 text-sm font-semibold w-fit cursor-not-allowed">
              Design Experiment
            </span>
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
