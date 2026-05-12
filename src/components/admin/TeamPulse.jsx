// src/components/admin/TeamPulse.jsx
// LeaderReps Lab — Anonymous Team Pulse (MVP)
// Independent experiment. List + create campaigns, view weekly aggregate
// behind anonymity threshold, and generate AI coaching insights.

import React, { useEffect, useState, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import {
  collection,
  getDocs,
  orderBy,
  query as fsQuery,
  limit,
} from 'firebase/firestore';
import {
  Users,
  ShieldAlert,
  Plus,
  Lock,
  Sparkles,
  ArrowLeft,
  Trash2,
  TestTube2,
  RefreshCw,
  Send,
  Link as LinkIcon,
  Phone,
  Calendar,
  Mail,
  UserPlus,
} from 'lucide-react';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import { useAppServices } from '../../services/useAppServices';
import {
  PULSE_QUESTION_BANK,
  ANONYMITY_DEFAULTS,
  getWeekKey,
  getQuestionForWeek,
  thresholdStatus,
  createCampaign,
  deleteCampaign,
  listCampaigns,
  getCampaign,
  getResponsesForWeek,
  getAllResponses,
  submitResponse,
  aggregateWeek,
  generateWeeklyInsight,
  saveInsight,
  getInsight,
  listRecipients,
  addRecipients,
  removeRecipient,
  buildResponseUrl,
  buildTrend,
  generateMonthlySynthesis,
  saveMonthlySynthesis,
  getMonthlySynthesis,
  getMonthKey,
} from '../../services/teamPulseService';

// ---------- Sub-views ----------

const NewCampaignForm = ({ onCancel, onCreated }) => {
  const { db, user } = useAppServices();
  const [form, setForm] = useState({
    name: '',
    leaderName: '',
    teamSize: 8,
    minInvited: ANONYMITY_DEFAULTS.minInvited,
    minResponsesToUnlock: ANONYMITY_DEFAULTS.minResponsesToUnlock,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Campaign name is required');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await createCampaign(db, {
        ...form,
        createdBy: user?.email || null,
      });
      onCreated(id);
    } catch (err) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl"
    >
      <h2 className="text-lg font-bold text-corporate-navy dark:text-white mb-4">
        New Pulse Campaign
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Campaign name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Q2 — Engineering team"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Leader name (optional)
          </label>
          <input
            type="text"
            value={form.leaderName}
            onChange={(e) => setForm({ ...form, leaderName: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Team size
            </label>
            <input
              type="number"
              min={1}
              value={form.teamSize}
              onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Min invited
            </label>
            <input
              type="number"
              min={3}
              value={form.minInvited}
              onChange={(e) => setForm({ ...form, minInvited: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Min responses to unlock
            </label>
            <input
              type="number"
              min={3}
              value={form.minResponsesToUnlock}
              onChange={(e) =>
                setForm({ ...form, minResponsesToUnlock: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Anonymity is enforced: weekly insights stay locked until the
          minimum-response threshold is met.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create campaign'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

const CampaignList = ({ campaigns, onOpen, onNew, onDelete }) => (
  <div className="space-y-4 max-w-3xl">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-bold text-corporate-navy dark:text-white">
        Campaigns ({campaigns.length})
      </h2>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90"
      >
        <Plus className="w-4 h-4" />
        New campaign
      </button>
    </div>

    {campaigns.length === 0 ? (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-sm text-slate-500">
        No campaigns yet. Create one to start collecting anonymous weekly pulses.
      </div>
    ) : (
      <div className="space-y-2">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-3"
          >
            <button
              onClick={() => onOpen(c.id)}
              className="flex-1 text-left"
            >
              <div className="font-semibold text-corporate-navy dark:text-white">
                {c.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Team size {c.teamSize} · unlocks at {c.minResponsesToUnlock} responses
                {c.leaderName ? ` · ${c.leaderName}` : ''}
              </div>
            </button>
            <button
              onClick={() => onDelete(c.id)}
              className="p-2 text-slate-400 hover:text-red-500"
              title="Delete campaign"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CampaignDetail = ({ campaignId, onBack }) => {
  const services = useAppServices();
  const { db, callSecureGeminiAPI } = services;
  const [campaign, setCampaign] = useState(null);
  const [weekKey, setWeekKey] = useState(getWeekKey());
  const [responses, setResponses] = useState([]);
  const [allResponses, setAllResponses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copyState, setCopyState] = useState('idle');

  const monthKey = getMonthKey();
  const question = getQuestionForWeek(weekKey);

  const refresh = useCallback(async () => {
    if (!campaignId) return;
    const [c, rs, ins, all, recs, mon] = await Promise.all([
      getCampaign(db, campaignId),
      getResponsesForWeek(db, campaignId, weekKey),
      getInsight(db, campaignId, weekKey),
      getAllResponses(db, campaignId),
      listRecipients(db, campaignId),
      getMonthlySynthesis(db, campaignId, monthKey),
    ]);
    setCampaign(c);
    setResponses(rs);
    setInsight(ins);
    setAllResponses(all);
    setRecipients(recs);
    setMonthly(mon);
  }, [db, campaignId, weekKey, monthKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const status = thresholdStatus(campaign, responses.length);
  const agg = aggregateWeek(responses);
  const trend = buildTrend(allResponses, 4);
  const responseUrl = buildResponseUrl(campaignId);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(responseUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
    }
  };

  const addTestResponse = async () => {
    setBusy(true);
    setError(null);
    try {
      const fakeScore = 1 + Math.floor(Math.random() * 5);
      const fakeText = [
        'Lots of context switching this week.',
        'Felt aligned on the new rollout.',
        'Need clearer ownership on the migration.',
        'Manager checked in mid-week — helped.',
        'Priorities flipped on Wednesday.',
        '',
      ][Math.floor(Math.random() * 6)];
      await submitResponse(db, campaignId, {
        weekKey,
        score: fakeScore,
        text: fakeText,
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const generateInsight = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await generateWeeklyInsight({
        callSecureGeminiAPI,
        question,
        weekKey,
        agg,
      });
      await saveInsight(db, campaignId, weekKey, result);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to generate insight');
    } finally {
      setBusy(false);
    }
  };

  const generateMonthly = async () => {
    setBusy(true);
    setError(null);
    try {
      const recentTexts = allResponses
        .map((r) => (r.text || '').trim())
        .filter(Boolean)
        .slice(-30);
      const result = await generateMonthlySynthesis({
        callSecureGeminiAPI,
        campaign,
        trend,
        recentTexts,
      });
      await saveMonthlySynthesis(db, campaignId, monthKey, result);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to generate monthly synthesis');
    } finally {
      setBusy(false);
    }
  };

  if (!campaign) {
    return <div className="text-sm text-slate-500">Loading campaign…</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-corporate-teal-ink"
      >
        <ArrowLeft className="w-4 h-4" />
        All campaigns
      </button>

      <div>
        <h2 className="text-xl font-bold text-corporate-navy dark:text-white">
          {campaign.name}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Team size {campaign.teamSize} · unlocks at {campaign.minResponsesToUnlock} responses
          {campaign.leaderName ? ` · ${campaign.leaderName}` : ''}
        </p>
      </div>

      {/* Public response link */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="w-4 h-4 text-corporate-teal" />
          <div className="text-sm font-bold text-corporate-navy dark:text-white">
            Anonymous response link
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={responseUrl}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-mono"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-lg bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90"
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Share this link or distribute via SMS below. Responders sign in
          anonymously — no email or identity collected.
        </p>
      </div>

      {/* Recipients + SMS distribution */}
      <RecipientsPanel
        campaign={campaign}
        recipients={recipients}
        onChange={refresh}
      />

      {/* Week selector */}
      <div className="flex items-center gap-2 text-sm">
        <label className="font-semibold text-slate-600 dark:text-slate-300">
          Week:
        </label>
        <input
          type="text"
          value={weekKey}
          onChange={(e) => setWeekKey(e.target.value)}
          className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono text-xs"
        />
        <button
          onClick={refresh}
          className="p-1.5 text-slate-400 hover:text-corporate-teal-ink"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="text-xs uppercase tracking-wider font-bold text-corporate-teal-ink mb-1">
          {question.theme}
        </div>
        <div className="text-base font-semibold text-corporate-navy dark:text-white">
          {question.quant}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Scale {question.scale.min} ({question.scale.minLabel}) →{' '}
          {question.scale.max} ({question.scale.maxLabel})
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">
          Optional: {question.text}
        </div>
      </div>

      {/* Threshold + aggregate */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-corporate-navy dark:text-white">
            This week
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {responses.length} response{responses.length === 1 ? '' : 's'}
          </div>
        </div>

        {!status.unlocked ? (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-bold">Privacy Guard Active</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
              To protect your team's anonymity, data and AI insights are hidden until at least {status.threshold} people respond. 
              <strong> You need {status.needed} more response{status.needed === 1 ? '' : 's'}.</strong>
            </p>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 self-start text-[11px] font-bold text-amber-900 dark:text-amber-300 underline underline-offset-2 hover:text-corporate-orange"
            >
              <Send className="w-3 h-3" />
              Send a friendly nudge to the team
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Energy</div>
                <div className="text-2xl font-black text-corporate-navy dark:text-white mt-1">
                  {agg.avgEnergy != null ? agg.avgEnergy.toFixed(1) : (agg.avgScore != null ? agg.avgScore.toFixed(1) : '—')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Team battery level</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Trust</div>
                <div className="text-2xl font-black text-corporate-navy dark:text-white mt-1">
                  {agg.avgTrust != null ? agg.avgTrust.toFixed(1) : (agg.avgScore != null ? agg.avgScore.toFixed(1) : '—')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Safety floor</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{question.theme}</div>
                <div className="text-2xl font-black text-corporate-navy dark:text-white mt-1">
                  {agg.avgTheme != null ? agg.avgTheme.toFixed(1) : (agg.avgScore != null ? agg.avgScore.toFixed(1) : '—')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Weekly focus</div>
              </div>
            </div>

            {agg.texts.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anonymous Comments ({agg.texts.length})</div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {agg.texts.map((t, i) => (
                    <div
                      key={i}
                      className="text-sm text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 italic relative group"
                    >
                      <span className="text-corporate-teal/20 text-4xl absolute -top-1 -left-1 font-serif select-none">“</span>
                      <span className="relative z-10">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Weekly Insight */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-corporate-teal" />
            <div className="font-bold text-corporate-navy dark:text-white">
              AI coaching insight (week)
            </div>
          </div>
          <button
            onClick={generateInsight}
            disabled={!status.unlocked || busy || !callSecureGeminiAPI}
            className="px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              !status.unlocked
                ? 'Locked until anonymity threshold met'
                : 'Generate insight from this week’s responses'
            }
          >
            {busy ? 'Working…' : insight ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {!status.unlocked && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Insights are gated by the anonymity threshold.
          </p>
        )}

        {status.unlocked && !insight && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No insight yet for {weekKey}. Click Generate to synthesize one from
            this week’s aggregate.
          </p>
        )}

        {insight && (
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">
                Insight
              </div>
              <div className="text-slate-800 dark:text-slate-100">
                {insight.insight}
              </div>
            </div>
            {insight.behaviorShift && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">
                  Behavior shift
                </div>
                <div className="text-slate-800 dark:text-slate-100">
                  {insight.behaviorShift}
                </div>
              </div>
            )}
            {insight.nextAction && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">
                  Next action
                </div>
                <div className="text-slate-800 dark:text-slate-100">
                  {insight.nextAction}
                </div>
              </div>
            )}
            {insight.confidence && (
              <div className="text-xs text-slate-500">
                Confidence: <span className="font-semibold">{insight.confidence}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Monthly trend + synthesis */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-corporate-teal" />
            <div className="font-bold text-corporate-navy dark:text-white">
              Monthly trend
            </div>
          </div>
          <button
            onClick={generateMonthly}
            disabled={busy || !callSecureGeminiAPI || trend.length === 0}
            className="px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90 disabled:opacity-40"
          >
            {busy ? 'Working…' : monthly ? 'Regenerate synthesis' : 'Generate synthesis'}
          </button>
        </div>

        {trend.length === 0 ? (
          <p className="text-sm text-slate-500">No data yet across recent weeks.</p>
        ) : (
          <TrendBars trend={trend} />
        )}

        {monthly && (
          <div className="mt-4 space-y-3 text-sm">
            {monthly.summary && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">Summary</div>
                <div>{monthly.summary}</div>
              </div>
            )}
            {monthly.strengths && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">Strengths to keep</div>
                <div>{monthly.strengths}</div>
              </div>
            )}
            {monthly.risks && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">Risks to address</div>
                <div>{monthly.risks}</div>
              </div>
            )}
            {monthly.teamWord && (
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5">
                  Team word of the month
                </div>
                <div className="font-semibold text-corporate-navy dark:text-white">
                  {monthly.teamWord}{' '}
                  {monthly.wordConfidence && (
                    <span className="text-xs text-slate-400">({monthly.wordConfidence} confidence)</span>
                  )}
                </div>
              </div>
            )}
            {monthly.repairScript && (
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-corporate-orange/5 to-white border border-corporate-orange/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles className="w-16 h-16 text-corporate-orange" />
                </div>
                
                <div className="flex items-center gap-2 text-corporate-orange mb-1">
                  <Plus className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Team Repair Protocol
                  </span>
                </div>
                
                <p className="text-sm text-corporate-navy font-bold leading-tight mb-3">
                  15-Minute Re-Alignment Script
                </p>

                <div className="space-y-3 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white shadow-inner">
                  {String(monthly.repairScript)
                    .split('|')
                    .map((b) => b.trim())
                    .filter(Boolean)
                    .map((b, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-700 leading-relaxed italic">
                        <span className="text-corporate-orange shrink-0">Step {i+1}:</span>
                        <span>{b}</span>
                      </div>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      const steps = String(monthly.repairScript).split('|').map(s => s.trim()).filter(Boolean).join('\n');
                      navigator.clipboard.writeText(`TEAM REPAIR PROTOCOL\n\n${steps}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-corporate-orange text-white text-[10px] font-black uppercase tracking-wider hover:bg-corporate-orange-dark transition-colors shadow-sm"
                  >
                    Copy Facilitation Guide
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test tools */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TestTube2 className="w-4 h-4 text-slate-400" />
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Lab tools
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Generate test responses to validate the threshold + AI flow without
          sending real SMS.
        </p>
        <button
          onClick={addTestResponse}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          + Add test response
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

// ---------- Trend bars (lightweight, no chart lib) ----------

const TrendBars = ({ trend }) => {
  const max = 5; // scale is 1-5
  return (
    <div className="flex items-end gap-2 h-32">
      {trend.map((t) => {
        const pct = t.avgScore != null ? (t.avgScore / max) * 100 : 0;
        return (
          <div key={t.weekKey} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-t-md flex items-end h-24">
              <div
                className="w-full bg-corporate-teal rounded-t-md transition-all"
                style={{ height: `${pct}%` }}
                title={`avg ${t.avgScore != null ? t.avgScore.toFixed(2) : 'n/a'}`}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-1">{t.weekKey}</div>
            <div className="text-[10px] text-slate-400">
              n={t.count} {t.avgScore != null ? `· ${t.avgScore.toFixed(1)}` : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Recipients + SMS / Email distribution ----------

const RecipientsPanel = ({ campaign, recipients, onChange }) => {
  const services = useAppServices();
  const { db } = services;
  const [bulk, setBulk] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const smsCount = recipients.filter(
    (r) => (r.channel || (r.phone ? 'sms' : 'email')) === 'sms'
  ).length;
  const emailCount = recipients.length - smsCount;

  const addBulk = async () => {
    setBusy(true);
    setError(null);
    try {
      const tokens = bulk
        .split(/[\s,;\n]+/)
        .map((p) => p.trim())
        .filter(Boolean);
      const added = await addRecipients(db, campaign.id, tokens);
      const skipped = tokens.length - added.length;
      setBulk('');
      setResult({ added: added.length, skipped });
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await removeRecipient(db, campaign.id, id);
    await onChange();
  };

  const sendInvites = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // Lazily resolve callable from the default Firebase app.
      const { getApp } = await import('firebase/app');
      const { getFunctions } = await import('firebase/functions');
      const fns = getFunctions(getApp(), 'us-central1');
      const callable = httpsCallable(fns, 'sendTeamPulseInvites');
      const res = await callable({
        campaignId: campaign.id,
        customMessage: customMessage || undefined,
      });
      setResult(res.data);
      await onChange();
    } catch (err) {
      setError(err.message || 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Send className="w-4 h-4 text-corporate-teal" />
        <div className="font-bold text-corporate-navy dark:text-white">
          Distribution (SMS &amp; email)
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Add phone numbers and/or email addresses
            <span className="font-normal text-slate-400">
              {' '}
              (comma, space, or newline separated)
            </span>
          </label>
          <textarea
            rows={3}
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={'+15551234567, teammate@company.com\n+15557654321'}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-mono"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={addBulk}
              disabled={busy || !bulk.trim()}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold disabled:opacity-50"
            >
              Add to list
            </button>
            <p className="text-[11px] text-slate-400">
              Items with “@” are treated as email; everything else is parsed as a phone.
            </p>
          </div>
        </div>

        {recipients.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
              <span>Recipients ({recipients.length})</span>
              <span className="text-slate-400 font-normal">
                · {smsCount} SMS · {emailCount} email
              </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {recipients.map((r) => {
                const channel = r.channel || (r.phone ? 'sms' : 'email');
                const label = channel === 'sms' ? r.phone : r.email;
                const Icon = channel === 'sms' ? Phone : Mail;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-700/40 rounded px-2 py-1"
                  >
                    <span className="flex items-center gap-2 font-mono">
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          channel === 'sms'
                            ? 'text-corporate-teal-ink'
                            : 'text-corporate-navy'
                        }`}
                      />
                      {label}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-2">
                      {r.inviteCount
                        ? `${r.inviteCount} invite${r.inviteCount === 1 ? '' : 's'}`
                        : 'never invited'}
                      <button
                        onClick={() => remove(r.id)}
                        className="text-slate-400 hover:text-red-500"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Custom message <span className="font-normal text-slate-400">(optional · 140 char max for SMS)</span>
          </label>
          <input
            type="text"
            maxLength={140}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Anonymous 90-sec team check-in for {team name}."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            SMS via Telnyx, email via the LeaderReps mailer. Each recipient is
            sent through whichever channel they were added on.
          </p>
          <button
            onClick={sendInvites}
            disabled={busy || recipients.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            {busy ? 'Sending…' : `Send to ${recipients.length}`}
          </button>
        </div>

        {result && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            {result.added != null
              ? `Added ${result.added} recipient${result.added === 1 ? '' : 's'}${
                  result.skipped ? ` · ${result.skipped} skipped (invalid)` : ''
                }.`
              : (() => {
                  const sentSms = result.sentSms ?? 0;
                  const sentEmail = result.sentEmail ?? 0;
                  const total = result.total ?? recipients.length;
                  const failed = result.failed ?? 0;
                  const parts = [];
                  if (sentSms) parts.push(`${sentSms} SMS`);
                  if (sentEmail) parts.push(`${sentEmail} email`);
                  const sentLabel = parts.length
                    ? parts.join(' + ')
                    : `${result.sent ?? 0}`;
                  return `Sent ${sentLabel} of ${total}${
                    failed ? ` · ${failed} failed` : ''
                  }.`;
                })()}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Question Bank reference ----------

const QuestionBankPanel = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-w-3xl">
    <h3 className="font-bold text-corporate-navy dark:text-white mb-3">
      Rotating question bank
    </h3>
    <div className="space-y-3">
      {PULSE_QUESTION_BANK.map((q, idx) => (
        <div key={q.id} className="text-sm">
          <div className="text-xs uppercase tracking-wider text-corporate-teal-ink font-bold">
            Week {idx + 1} · {q.theme}
          </div>
          <div className="text-slate-700 dark:text-slate-200">{q.quant}</div>
          <div className="text-xs italic text-slate-500">{q.text}</div>
        </div>
      ))}
    </div>
  </div>
);

// ---------- Main screen ----------

// ---------- Pulse Leads (admin) ----------

const PulseLeadsPanel = ({ db, onBack }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        fsQuery(collection(db, 'pulse_leads'), orderBy('createdAt', 'desc'), limit(200))
      );
      setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError(e.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => { reload(); }, [reload]);

  const fmt = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString();
    } catch { return '—'; }
  };

  const withEmail = leads.filter((l) => l.email).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-corporate-navy dark:text-white">
              Pulse Leads
            </h2>
            <p className="text-xs text-slate-500">
              Leaders who started a self-serve pulse via the public landing page.
            </p>
          </div>
        </div>
        <button
          onClick={reload}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Total leads" value={leads.length} />
        <Stat label="With email" value={withEmail} />
        <Stat
          label="Email capture rate"
          value={leads.length ? `${Math.round((withEmail / leads.length) * 100)}%` : '0%'}
        />
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="py-2 pr-3">Leader</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Invites</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Started</th>
                <th className="py-2 pr-3">Last activity</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-sm text-slate-400">
                  No leads yet. Share your public landing link: <code>/?pulse-start</code>
                </td></tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-3 font-semibold text-corporate-navy">
                    {l.firstName || '—'}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">
                    {l.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3 text-corporate-teal" />
                        {l.email}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-600">{l.inviteCount || 0}</td>
                  <td className="py-2 pr-3 text-slate-500 text-xs">
                    {l.referredBy ? <span title={l.referredBy}>viral</span> : (l.source || 'self-serve')}
                  </td>
                  <td className="py-2 pr-3 text-slate-500 text-xs">{fmt(l.createdAt)}</td>
                  <td className="py-2 pr-3 text-slate-500 text-xs">{fmt(l.lastActivityAt)}</td>
                  <td className="py-2 pr-3">
                    <a
                      href={`/?leader=${encodeURIComponent(l.token || l.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-corporate-teal-ink hover:underline"
                    >
                      Open →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
    <div className="text-2xl font-extrabold text-corporate-navy mt-1">{value}</div>
  </div>
);

const TeamPulse = () => {
  const { db, isAdmin, navigate } = useAppServices();
  const [view, setView] = useState('list'); // 'list' | 'new' | 'detail' | 'leads'
  const [selectedId, setSelectedId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listCampaigns(db);
      setCampaigns(list);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">
          Access Denied
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('team-pulse')}
          navigate={navigate}
        />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
            <Users className="w-6 h-6 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-corporate-navy dark:text-white">
              Anonymous Team Pulse
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Weekly anonymous pulse with private AI coaching insight.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : view === 'leads' ? (
          <PulseLeadsPanel db={db} onBack={() => setView('list')} />
        ) : view === 'new' ? (
          <NewCampaignForm
            onCancel={() => setView('list')}
            onCreated={async (id) => {
              await reload();
              setSelectedId(id);
              setView('detail');
            }}
          />
        ) : view === 'detail' && selectedId ? (
          <CampaignDetail
            campaignId={selectedId}
            onBack={() => {
              setSelectedId(null);
              setView('list');
              reload();
            }}
          />
        ) : (
          <>
            <div className="flex justify-end">
              <button
                onClick={() => setView('leads')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Pulse Leads
              </button>
            </div>
            <CampaignList
              campaigns={campaigns}
              onNew={() => setView('new')}
              onOpen={(id) => {
                setSelectedId(id);
                setView('detail');
              }}
              onDelete={async (id) => {
                if (!window.confirm('Delete this campaign? Responses will remain in Firestore.')) return;
                await deleteCampaign(db, id);
                await reload();
              }}
            />
            <QuestionBankPanel />
          </>
        )}
      </div>
    </div>
  );
};

export default TeamPulse;
