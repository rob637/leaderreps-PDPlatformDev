// src/components/lab/PodMatchDemo.jsx
//
// LeaderReps Lab — Pod Match Simulator MVP demo
//
// Demo-only: admin-gated, fully client-side, no Firestore writes.
// Purpose: visualize the pods-of-5 matching algorithm using a seeded
// mock cohort so we can demo CrossFit-style community dynamics.

import React, { useMemo, useState } from 'react';
import {
  Users,
  Users2,
  RefreshCw,
  ShieldAlert,
  ArrowLeft,
  MapPin,
  Briefcase,
  Target,
  Flame,
  MessageCircle,
  Calendar,
  Award,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';

// --- Mock cohort -----------------------------------------------------------
const FIRST = ['Alex', 'Priya', 'Jordan', 'Mara', 'Theo', 'Sam', 'Nina', 'Diego', 'Kara', 'Ben', 'Lila', 'Owen', 'Zara', 'Marcus', 'Iris', 'Felix', 'Hana', 'Reid', 'Tess', 'Cole', 'Maya', 'Noah', 'Eve', 'Ravi', 'Sage'];
const LAST = ['Kim', 'Sundaram', 'Lee', 'Rodriguez', 'Brennan', 'Patel', 'Okafor', 'Vargas', 'Chen', 'Singh', 'Walsh', 'Bauer', 'Nguyen', 'Reyes', 'Hart'];
const TZ = ['PT', 'MT', 'CT', 'ET'];
const INDUSTRY = ['Tech', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Nonprofit'];
const LEVEL = ['New Manager', 'Mid Manager', 'Senior Leader', 'Director', 'VP'];
const GOAL = ['Coaching skill', 'Strategic thinking', 'Difficult conversations', 'Building trust', 'Executive presence', 'Delegation'];
const COMPANY = ['Acme', 'Globex', 'Initech', 'Hooli', 'Umbrella', 'Stark', 'Wayne', 'Wonka'];

function seedCohort(seed = 1, size = 20) {
  // Simple seeded PRNG so the demo is reproducible per seed
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const out = [];
  for (let i = 0; i < size; i++) {
    out.push({
      id: `L${i + 1}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      tz: pick(TZ),
      industry: pick(INDUSTRY),
      level: pick(LEVEL),
      company: pick(COMPANY),
      goal: pick(GOAL),
    });
  }
  return out;
}

// --- Matching algorithm ----------------------------------------------------
// Greedy: within each timezone bucket, build pods of 5 trying to maximize
// industry diversity, avoid same-company pairings, and span levels.
function formPods(leaders, podSize = 5) {
  const byTz = leaders.reduce((acc, l) => {
    (acc[l.tz] = acc[l.tz] || []).push(l);
    return acc;
  }, {});

  const pods = [];
  let podCounter = 1;

  Object.entries(byTz).forEach(([tz, group]) => {
    const pool = [...group];
    while (pool.length >= 3) {
      const pod = [pool.shift()];
      while (pod.length < podSize && pool.length > 0) {
        // Score remaining candidates against current pod
        let bestIdx = 0;
        let bestScore = -Infinity;
        for (let i = 0; i < pool.length; i++) {
          const c = pool[i];
          let score = 0;
          const companies = pod.map((p) => p.company);
          const industries = pod.map((p) => p.industry);
          const levels = pod.map((p) => p.level);
          if (companies.includes(c.company)) score -= 5; // avoid same company
          if (!industries.includes(c.industry)) score += 2; // diversity
          if (!levels.includes(c.level)) score += 1; // level spread
          if (score > bestScore) {
            bestScore = score;
            bestIdx = i;
          }
        }
        pod.push(pool.splice(bestIdx, 1)[0]);
      }
      pods.push({ id: `pod-${podCounter++}`, tz, members: pod });
    }
    // Stragglers: tack onto smallest pod in same TZ if any
    if (pool.length > 0 && pods.some((p) => p.tz === tz)) {
      const candidates = pods.filter((p) => p.tz === tz);
      candidates.sort((a, b) => a.members.length - b.members.length);
      pool.forEach((leader) => {
        candidates[0].members.push(leader);
        candidates.sort((a, b) => a.members.length - b.members.length);
      });
    }
  });

  return pods;
}

function podDiversityScore(pod) {
  const industries = new Set(pod.members.map((m) => m.industry));
  const levels = new Set(pod.members.map((m) => m.level));
  const companies = pod.members.map((m) => m.company);
  const dupeCompanies = companies.length - new Set(companies).size;
  return Math.max(
    0,
    Math.round(
      (industries.size / pod.members.length) * 50 +
        (levels.size / pod.members.length) * 50 -
        dupeCompanies * 10
    )
  );
}

// --- Components ------------------------------------------------------------
const MemberChip = ({ m }) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
    <div className="w-8 h-8 rounded-full bg-corporate-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
      {m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-semibold text-corporate-navy dark:text-white truncate">
        {m.name}
      </div>
      <div className="text-[10px] text-slate-500 truncate">
        {m.level} · {m.industry} · {m.company}
      </div>
    </div>
  </div>
);

const PodCard = ({ pod, onPreview }) => {
  const score = podDiversityScore(pod);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-corporate-teal" />
          <h3 className="text-sm font-bold text-corporate-navy dark:text-white">
            Pod {pod.id.replace('pod-', '#')}
          </h3>
          <span className="text-xs text-slate-400">· {pod.tz} timezone</span>
        </div>
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600">
            {score}/100 diversity
          </span>
        </div>
      </div>
      <div className="space-y-1.5">
        {pod.members.map((m) => (
          <MemberChip key={m.id} m={m} />
        ))}
      </div>
      <button
        onClick={() => onPreview(pod)}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-corporate-teal text-corporate-teal text-xs font-semibold hover:bg-corporate-teal hover:text-white transition-colors"
      >
        Preview Pod Home
      </button>
    </div>
  );
};

const PodHomePreview = ({ pod, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-corporate-teal font-semibold mb-1">
            Pod Home — Preview
          </div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">
            Pod {pod.id.replace('pod-', '#')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            What members would see when they open their pod.
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Your pod
          </div>
          <div className="space-y-1.5">
            {pod.members.map((m) => (
              <MemberChip key={m.id} m={m} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-corporate-teal/10 rounded-xl p-3 text-center">
            <Flame className="w-5 h-5 text-corporate-orange mx-auto mb-1" />
            <div className="text-xl font-extrabold text-corporate-navy">7</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Pod streak
            </div>
          </div>
          <div className="bg-corporate-navy/5 rounded-xl p-3 text-center">
            <MessageCircle className="w-5 h-5 text-corporate-navy mx-auto mb-1" />
            <div className="text-xl font-extrabold text-corporate-navy">14</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Wins shared
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <div className="text-xl font-extrabold text-corporate-navy">Thu</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Next sync
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            This week's pod prompt
          </div>
          <div className="text-sm text-corporate-navy dark:text-white italic">
            "Share one moment this week where you chose clarity over comfort."
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Recent pod wins
          </div>
          <div className="space-y-2">
            <div className="text-xs p-2 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
              <span className="font-semibold">{pod.members[0]?.name.split(' ')[0]}:</span>{' '}
              "Restructured my 1:1s — 30 min instead of 60, way more focus."
            </div>
            <div className="text-xs p-2 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
              <span className="font-semibold">{pod.members[1]?.name.split(' ')[0]}:</span>{' '}
              "Finally gave the feedback I'd been sitting on for 2 weeks."
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
          Mock data — illustrates the experience, not real pod activity.
        </div>
      </div>
    </div>
  </div>
);

const PodMatchDemo = () => {
  const { isAdmin, navigate } = useAppServices();
  const [seed, setSeed] = useState(1);
  const [size, setSize] = useState(20);
  const [previewPod, setPreviewPod] = useState(null);

  const leaders = useMemo(() => seedCohort(seed, size), [seed, size]);
  const pods = useMemo(() => formPods(leaders, 5), [leaders]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          The Lab is admin-only.
        </p>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-hub' },
    { label: 'LeaderReps Lab', path: 'leaderreps-lab' },
    { label: 'Pod Match Simulator', path: null },
  ];

  const avgDiversity = pods.length
    ? Math.round(
        pods.reduce((sum, p) => sum + podDiversityScore(p), 0) / pods.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav items={breadcrumbs} navigate={navigate} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('leaderreps-lab')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Back to Lab"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
            <Users2 className="w-6 h-6 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              Pod Match Simulator
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              MVP — CrossFit-style "pods of 5." Runs the matching
              algorithm on a mock cohort so we can evaluate groupings.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Cohort size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
              >
                {[10, 15, 20, 25, 30, 40].map((n) => (
                  <option key={n} value={n}>{n} leaders</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Random seed
              </label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value) || 1)}
                className="w-24 px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setSeed(Math.floor(Math.random() * 9999) + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate cohort
            </button>
            <div className="ml-auto flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Pods formed:</span>{' '}
                <span className="font-bold text-corporate-navy">{pods.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Avg diversity:</span>{' '}
                <span className="font-bold text-amber-600">{avgDiversity}/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pods grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pods.map((pod) => (
            <PodCard key={pod.id} pod={pod} onPreview={setPreviewPod} />
          ))}
        </div>

        {/* Algorithm explanation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-corporate-navy dark:text-white mb-2">
            Matching algorithm (this demo)
          </div>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Buckets leaders by <strong>timezone</strong> (rituals need synchronous overlap).</li>
            <li>Greedy selection inside each bucket: <strong>maximize industry diversity</strong>.</li>
            <li><strong>Avoid same-company pairings</strong> (heavy penalty in scoring).</li>
            <li><strong>Spread experience levels</strong> across the pod.</li>
            <li>Stragglers attach to the smallest pod in their timezone.</li>
          </ul>
          <div className="text-xs text-slate-400">
            Demo only — no Firestore writes. Promotion path: run on real
            cohorts, wire <code>formPods</code> Cloud Function at Day 3, add
            consent + manual override UI for trainers.
          </div>
        </div>
      </div>

      {previewPod && (
        <PodHomePreview pod={previewPod} onClose={() => setPreviewPod(null)} />
      )}
    </div>
  );
};

export default PodMatchDemo;
