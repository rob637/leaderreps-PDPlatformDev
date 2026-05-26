// src/components/admin/lab/PhrasebookAdmin.jsx
// LeaderReps Lab — Leadership Phrasebook admin
//
// Manages a public, growing library of exact scripts for hard leadership
// moments. SEO-driven lead magnet. Each phrase has an optional CTA back to
// a LeaderReps practice rep.
//
// Firestore:
//   - phrasebook/{phraseId} — phrase records (public read, admin write)

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookMarked, Plus, Trash2, Edit3, Save, ShieldAlert, Sparkles,
  Search, Eye, EyeOff, Loader2, Copy, Check,
} from 'lucide-react';
import {
  collection, addDoc, doc, deleteDoc, updateDoc, writeBatch,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../../config/breadcrumbConfig.js';
import { useAppServices } from '../../../services/useAppServices';

const CATEGORIES = [
  'Feedback',
  'Difficult Conversations',
  'Saying No',
  'Delegation',
  'Recognition',
  'Conflict',
];

const TONES = ['Direct', 'Empathetic', 'Assertive'];

// Hand-curated demo-quality starter library. Click the "Seed starter phrases"
// button in the admin to bulk-write these as published phrases. Idempotent
// guard: confirms if the collection is already populated.
const SEED_PHRASES = [
  // Feedback
  {
    situation: 'Telling a strong performer their work just slipped',
    context: 'When someone you rely on missed the bar and you need to call it without breaking trust.',
    script: "I want to flag something because I trust you to handle it directly. The deck you sent on Friday wasn't your usual standard \u2014 the analysis was thin in section two and the recommendation didn't land. What happened, and what do you need from me?",
    whyItWorks: "Leads with trust, names the specific gap, asks an open question instead of accusing.",
    tone: 'Direct',
    category: 'Feedback',
    tags: ['high performer', 'specific', 'open question'],
    status: 'published',
  },
  {
    situation: "Giving feedback to someone who reports to your peer",
    context: "You don't manage them, but you saw the behavior and it affects your team.",
    script: "Can I share an observation, not a complaint? In the standup today, when you cut Maria off twice, it landed as dismissive. I'm telling you because I'd want someone to tell me. What's your read?",
    whyItWorks: "Frames it as observation not complaint, names specific behavior + impact, invites their perspective.",
    tone: 'Empathetic',
    category: 'Feedback',
    tags: ['cross-team', 'observation', 'impact'],
    status: 'published',
  },
  {
    situation: "Following up when feedback hasn't changed behavior",
    context: "You've raised it before. It's still happening. Time to escalate the conversation, not the volume.",
    script: "We've talked twice now about you missing the Wednesday review. I haven't seen a change and I need to understand why \u2014 is this a priority issue, a calendar issue, or something else? I want to solve it with you before it becomes a performance conversation.",
    whyItWorks: "Names the pattern, lists possible causes (gives them a way in), states the stakes clearly without threat.",
    tone: 'Assertive',
    category: 'Feedback',
    tags: ['pattern', 'escalation', 'performance'],
    status: 'published',
  },
  {
    situation: "Praising someone in a way that actually lands",
    context: "Generic praise is forgettable. This kind sticks.",
    script: "I want to call out what you did in the client meeting today. When they pushed back on the timeline, you didn't get defensive \u2014 you asked what was driving the concern, and that completely shifted the conversation. That's the move. Do it again.",
    whyItWorks: "Specific moment + specific behavior + why it mattered + reinforce. Beats \u201Cgreat job\u201D every time.",
    tone: 'Direct',
    category: 'Recognition',
    tags: ['specific praise', 'reinforce'],
    status: 'published',
  },

  // Difficult Conversations
  {
    situation: "Opening a hard conversation you've been avoiding",
    context: "You've put it off for weeks. Use this to start it cleanly.",
    script: "I owe you a conversation I've been putting off, and I'm sorry it's taken me this long. I want to talk about how the project handoff went last month \u2014 there's something I need to say, and I want to hear your side. Is now okay, or should we find time tomorrow?",
    whyItWorks: "Owns the delay, names the topic, gives them a choice about timing. Disarms defensiveness up front.",
    tone: 'Empathetic',
    category: 'Difficult Conversations',
    tags: ['avoidance', 'opener', 'consent'],
    status: 'published',
  },
  {
    situation: "Telling someone they're not ready for the promotion they want",
    context: "Honesty now is kinder than vagueness for six more months.",
    script: "I want to be straight with you because you deserve it: you're not ready for the Director role yet. Here's what's missing \u2014 you haven't led a cross-functional initiative end-to-end, and your last two stretch projects you handed back. I think you can get there in 12 months. Want to build a plan together?",
    whyItWorks: "Direct verdict, specific gaps (not vibes), timeline, and an offer to invest in them.",
    tone: 'Direct',
    category: 'Difficult Conversations',
    tags: ['promotion', 'career', 'development plan'],
    status: 'published',
  },
  {
    situation: "Addressing a teammate who keeps undercutting you in meetings",
    context: "It's happened three times. Today you handle it.",
    script: "I want to name a pattern I've noticed and check if I'm reading it right. In the last three product reviews, you've called out gaps in my proposal in front of the room without raising them with me first. It's chipping away at how I can lead. What's going on for you when that happens?",
    whyItWorks: "Pattern + specific + impact + curious question. Doesn't accuse, doesn't avoid.",
    tone: 'Assertive',
    category: 'Conflict',
    tags: ['peer', 'undermining', 'meetings'],
    status: 'published',
  },
  {
    situation: "Repairing a relationship after you blew up in a meeting",
    context: "You lost your composure. Don't pretend it didn't happen.",
    script: "I owe you an apology for how I reacted in the meeting yesterday. I got sharp, I cut you off, and that wasn't fair to you. I was frustrated about something that had nothing to do with you. I'm sorry. What can I do to make it right?",
    whyItWorks: "Specific behavior, no \u201Cbut\u201D, takes responsibility for the cause, asks for repair.",
    tone: 'Empathetic',
    category: 'Difficult Conversations',
    tags: ['apology', 'repair', 'composure'],
    status: 'published',
  },

  // Saying No
  {
    situation: "Saying no to your boss without burning the bridge",
    context: "They asked for one more thing. You're already underwater.",
    script: "I want to help, and I have to be honest: if I take this on, something else is going to slip. Here's what's on my plate: [list]. Which two do you want me to prioritize, and what should drop?",
    whyItWorks: "Doesn't refuse, doesn't agree blindly \u2014 makes the tradeoff visible and hands the decision back.",
    tone: 'Assertive',
    category: 'Saying No',
    tags: ['workload', 'priorities', 'tradeoff'],
    status: 'published',
  },
  {
    situation: "Declining a meeting that has no agenda",
    context: "Protecting your time without being precious about it.",
    script: "I want to be useful here \u2014 can you send me the question you're trying to answer? If it needs me, I'll move things to be there. If it doesn't, I'll send my thoughts over Slack and free up the room.",
    whyItWorks: "Forces clarity on purpose without saying no outright. Often the meeting evaporates.",
    tone: 'Direct',
    category: 'Saying No',
    tags: ['meetings', 'agenda', 'time'],
    status: 'published',
  },
  {
    situation: "Telling a stakeholder their request isn't in scope",
    context: "Polite, firm, no apologizing for protecting the work.",
    script: "That's a great idea and it's outside what we committed to for this release. Two options: we can add it to the backlog for Q3, or we can swap it in now and push out [feature]. Which would you rather?",
    whyItWorks: "Validates the idea, holds the line, offers a real tradeoff. No defensiveness.",
    tone: 'Direct',
    category: 'Saying No',
    tags: ['scope', 'stakeholder', 'tradeoff'],
    status: 'published',
  },

  // Delegation
  {
    situation: "Delegating something important without hovering",
    context: "The job is theirs. You stay close without taking it back.",
    script: "I'm giving you full ownership of the partner launch. The outcome we need: [X]. The constraints you can't cross: [Y]. Inside those, you decide. I'll check in on Thursdays for 15 minutes. If you need me sooner, come find me \u2014 I'd rather you ask than guess.",
    whyItWorks: "Names outcome, names guardrails, defines cadence, opens the door for help. Real autonomy with a safety net.",
    tone: 'Direct',
    category: 'Delegation',
    tags: ['ownership', 'autonomy', 'guardrails'],
    status: 'published',
  },
  {
    situation: "Pushing back when work bounces back to you",
    context: "You delegated it. Now they're trying to hand it back.",
    script: "I hear that this is harder than expected. Before I jump in, walk me through what you've tried and where you're stuck. I'd rather coach you through it than take it back \u2014 that's how you grow into the next role.",
    whyItWorks: "Validates difficulty, redirects to coaching, frames it as development not punishment.",
    tone: 'Empathetic',
    category: 'Delegation',
    tags: ['boomerang', 'coaching', 'growth'],
    status: 'published',
  },
  {
    situation: "Letting a team member fail on purpose (and on time)",
    context: "Sometimes the lesson is the deadline.",
    script: "I noticed the deck isn't ready and the meeting is in an hour. I'm not going to rescue it this time \u2014 you'll need to either ask the room for an extension or present what you have. Whichever you choose, we'll debrief tomorrow on what got us here.",
    whyItWorks: "Clear that the rescue isn't coming, gives them agency on the recovery, sets up learning without shame.",
    tone: 'Assertive',
    category: 'Delegation',
    tags: ['failure', 'accountability', 'debrief'],
    status: 'published',
  },

  // Recognition
  {
    situation: "Recognizing quiet, behind-the-scenes work",
    context: "The person who never asks for credit usually needs it most.",
    script: "I want to make sure you know I see it. The way you've been mentoring the new analysts \u2014 the extra 1:1 time, the doc reviews, the late nights they don't mention \u2014 it's the reason that team is shipping. Thank you. I'm naming it in front of leadership tomorrow too.",
    whyItWorks: "Specific invisible work, names impact, commits to making it visible upward.",
    tone: 'Empathetic',
    category: 'Recognition',
    tags: ['quiet contributor', 'visibility', 'mentorship'],
    status: 'published',
  },
  {
    situation: "Recognizing someone in a 1:1 vs. publicly",
    context: "Public praise embarrasses some people. Don't assume.",
    script: "Before we get into the agenda \u2014 I want you to hear from me directly that the way you handled the customer escalation last week was outstanding. I won't make a thing of it in the team channel because I know that's not your style, but it mattered, and I wanted you to know I noticed.",
    whyItWorks: "Respects preference, gives concrete praise, makes the leader's noticing the gift.",
    tone: 'Empathetic',
    category: 'Recognition',
    tags: ['1:1', 'preference', 'private'],
    status: 'published',
  },

  // Conflict
  {
    situation: "De-escalating a heated debate in the room",
    context: "Two people are talking past each other. You're the manager. Step in.",
    script: "I want to pause us. We're both passionate about this and we're starting to argue positions instead of solving the problem. Let's reset \u2014 what's the decision we actually need to make today, and what does each of us need to feel good about it?",
    whyItWorks: "Names the dynamic without blame, refocuses on the decision, surfaces underlying needs.",
    tone: 'Empathetic',
    category: 'Conflict',
    tags: ['de-escalate', 'meeting', 'reset'],
    status: 'published',
  },
  {
    situation: "Mediating between two people on your team",
    context: "They keep complaining about each other to you. Time to stop being the middle.",
    script: "I've heard each of you raise concerns about the other, and I'm not the right person to solve it from the middle. Here's what we're going to do: the three of us, 30 minutes tomorrow, each of you brings one thing you need from the other. I'll facilitate, but the conversation is yours.",
    whyItWorks: "Stops triangulation, sets structure, holds them accountable for the relationship.",
    tone: 'Assertive',
    category: 'Conflict',
    tags: ['mediation', 'triangulation', 'team'],
    status: 'published',
  },
  {
    situation: "Disagreeing with your boss in front of others",
    context: "Diplomatic, direct \u2014 doesn't undermine, doesn't capitulate.",
    script: "I want to offer a different read on this before we lock it in. From where I sit, [perspective]. I might be missing context you have \u2014 but I'd rather raise it now than after the decision. Happy to take it offline if that's better.",
    whyItWorks: "Signals respect, names your position, leaves room for their authority, offers a graceful exit.",
    tone: 'Assertive',
    category: 'Conflict',
    tags: ['boss', 'public disagreement', 'respect'],
    status: 'published',
  },
];

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
// geminiProxy has a built-in Claude fallback — no standalone claudeProxy exists.
const AI_PROXY = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/geminiProxy`;

const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active
        ? 'bg-corporate-teal text-white'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
    }`}
  >
    {children}
    {typeof count === 'number' && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
        {count}
      </span>
    )}
  </button>
);

const PhraseForm = ({ initial, onSave, onCancel, busy }) => {
  const [situation, setSituation] = useState(initial?.situation || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [context, setContext] = useState(initial?.context || '');
  const [script, setScript] = useState(initial?.script || '');
  const [whyItWorks, setWhyItWorks] = useState(initial?.whyItWorks || '');
  const [tone, setTone] = useState(initial?.tone || 'Direct');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [relatedRepId, setRelatedRepId] = useState(initial?.relatedRepId || '');
  const [status, setStatus] = useState(initial?.status || 'draft');
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState([]);

  const canSave = situation.trim() && script.trim();

  const handleGenerate = async () => {
    if (!situation.trim()) return;
    setGenerating(true);
    try {
      const prompt = `You are a leadership coach. The leader is facing this situation: "${situation.trim()}". Context: ${context || 'none'}.

Write 3 short scripted responses they could say verbatim — one in each tone: Direct, Empathetic, Assertive. Each response should be 1-3 sentences, ready to use word-for-word. Return as JSON array: [{"tone":"Direct","script":"..."},{"tone":"Empathetic","script":"..."},{"tone":"Assertive","script":"..."}]`;

      const res = await fetch(AI_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction:
            'You are a leadership communication coach. Respond ONLY with the requested JSON array — no preamble, no markdown fences.',
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      const text = data.text || data.completion || data.response || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        setVariations(JSON.parse(match[0]));
      }
    } catch (err) {
      window.alert('AI generation failed: ' + (err?.message || 'unknown'));
    } finally {
      setGenerating(false);
    }
  };

  const applyVariation = (v) => {
    setScript(v.script);
    setTone(v.tone);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-corporate-teal rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Situation *</label>
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder='e.g. "Delivering critical feedback when the person reports to your peer"'
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            maxLength={200}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Context (when to use)</label>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional — short note about when this script is appropriate"
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            maxLength={300}
          />
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Script (verbatim words) *</label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!situation.trim() || generating}
              className="inline-flex items-center gap-1 text-xs font-semibold text-corporate-teal hover:text-corporate-teal/80 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {generating ? 'Generating…' : 'AI: 3 tone variations'}
            </button>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="The exact words the leader should say."
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            maxLength={1200}
          />
        </div>

        {variations.length > 0 && (
          <div className="md:col-span-2 space-y-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI suggestions — click to use:</p>
            {variations.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyVariation(v)}
                className="block w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-corporate-teal hover:bg-corporate-teal/5"
              >
                <span className="text-[10px] font-bold uppercase text-corporate-teal">{v.tone}</span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{v.script}</p>
              </button>
            ))}
          </div>
        )}

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Why it works (1-2 sentences)</label>
          <textarea
            value={whyItWorks}
            onChange={(e) => setWhyItWorks(e.target.value)}
            placeholder="Short rationale shown below the script."
            rows={2}
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            maxLength={400}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tags (comma separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="hard conversation, peer, urgent"
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Related Rep ID (optional)</label>
          <input
            value={relatedRepId}
            onChange={(e) => setRelatedRepId(e.target.value)}
            placeholder="content-id from LeaderReps library"
            className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          Cancel
        </button>
        <button
          onClick={() => onSave({
            situation: situation.trim(),
            category,
            tone,
            context: context.trim(),
            script: script.trim(),
            whyItWorks: whyItWorks.trim(),
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            relatedRepId: relatedRepId.trim() || null,
            status,
          })}
          disabled={!canSave || busy}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-corporate-teal hover:bg-corporate-teal/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );
};

const PhraseCard = ({ phrase, onEdit, onDelete, onTogglePublish }) => {
  const [copied, setCopied] = useState(false);
  const isPublished = phrase.status === 'published';
  const handleCopy = async () => {
    await navigator.clipboard.writeText(phrase.script || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {phrase.category}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-corporate-teal/10 text-corporate-teal">
              {phrase.tone || 'Direct'}
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-corporate-navy dark:text-white">{phrase.situation}</h3>
          {phrase.context && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{phrase.context}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onTogglePublish(phrase)} className="p-1.5 text-slate-400 hover:text-corporate-teal hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title={isPublished ? 'Unpublish' : 'Publish'}>
            {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={() => onEdit(phrase)} className="p-1.5 text-slate-400 hover:text-corporate-teal hover:bg-slate-100 dark:hover:bg-slate-700 rounded" title="Edit">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(phrase)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border-l-4 border-corporate-teal p-3 rounded-r relative group">
        <p className="text-sm text-slate-800 dark:text-slate-100 italic leading-relaxed pr-8">"{phrase.script}"</p>
        <button onClick={handleCopy} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-corporate-teal opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {phrase.whyItWorks && (
        <p className="text-xs text-slate-500 dark:text-slate-400"><strong className="text-slate-700 dark:text-slate-300">Why it works:</strong> {phrase.whyItWorks}</p>
      )}
      {(phrase.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {phrase.tags.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
};

const PhrasebookAdmin = () => {
  const { db, user, isAdmin, navigate } = useAppServices();
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db || !isAdmin) return;
    const q = query(collection(db, 'phrasebook'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPhrases(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [db, isAdmin]);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return phrases.filter((p) => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterStatus !== 'all' && (p.status || 'draft') !== filterStatus) return false;
      if (s && !(`${p.situation} ${p.script} ${(p.tags || []).join(' ')}`.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [phrases, search, filterCategory, filterStatus]);

  const stats = useMemo(() => ({
    total: phrases.length,
    published: phrases.filter((p) => p.status === 'published').length,
    draft: phrases.filter((p) => (p.status || 'draft') === 'draft').length,
  }), [phrases]);

  const handleCreate = async (data) => {
    setBusy(true);
    try {
      await addDoc(collection(db, 'phrasebook'), {
        ...data,
        views: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });
      setCreating(false);
    } finally { setBusy(false); }
  };

  const handleUpdate = async (id, data) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'phrasebook', id), { ...data, updatedAt: serverTimestamp() });
      setEditingId(null);
    } finally { setBusy(false); }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.situation}"?`)) return;
    await deleteDoc(doc(db, 'phrasebook', p.id));
  };

  const handleTogglePublish = async (p) => {
    await updateDoc(doc(db, 'phrasebook', p.id), {
      status: p.status === 'published' ? 'draft' : 'published',
      updatedAt: serverTimestamp(),
    });
  };

  const handleSeed = async () => {
    if (phrases.length > 0) {
      if (!window.confirm(`There are already ${phrases.length} phrases. Add ${SEED_PHRASES.length} starter phrases anyway?`)) return;
    }
    setBusy(true);
    try {
      const batch = writeBatch(db);
      SEED_PHRASES.forEach((p) => {
        const ref = doc(collection(db, 'phrasebook'));
        batch.set(ref, {
          ...p,
          relatedRepId: null,
          views: 0,
          shares: 0,
          createdAt: serverTimestamp(),
          createdBy: user?.email || null,
          seeded: true,
        });
      });
      await batch.commit();
    } finally { setBusy(false); }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav items={getBreadcrumbs('lab-phrasebook')} navigate={navigate} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
              <BookMarked className="w-6 h-6 text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">Leadership Phrasebook</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Exact scripts for hard leadership moments. SEO lead magnet.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
            <div><strong className="text-corporate-teal">{stats.published}</strong> published · <strong>{stats.draft}</strong> draft</div>
            <div>{stats.total} total phrases</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search situations, scripts, tags…"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1">
            {['all', 'published', 'draft'].map((s) => (
              <TabButton key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </TabButton>
            ))}
          </div>
          <button
            onClick={() => { setCreating(true); setEditingId(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90"
          >
            <Plus className="w-4 h-4" />
            New Phrase
          </button>
          <button
            onClick={handleSeed}
            disabled={busy}
            title={`Bulk-add ${SEED_PHRASES.length} hand-curated starter phrases (all published)`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-corporate-teal text-corporate-teal text-sm font-semibold hover:bg-corporate-teal/5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Seed {SEED_PHRASES.length} starter phrases
          </button>
        </div>

        {creating && <PhraseForm onSave={handleCreate} onCancel={() => setCreating(false)} busy={busy} />}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <BookMarked className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No phrases match. Click "New Phrase" to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visible.map((p) => (
              editingId === p.id ? (
                <PhraseForm
                  key={p.id}
                  initial={p}
                  onSave={(data) => handleUpdate(p.id, data)}
                  onCancel={() => setEditingId(null)}
                  busy={busy}
                />
              ) : (
                <PhraseCard
                  key={p.id}
                  phrase={p}
                  onEdit={(ph) => { setEditingId(ph.id); setCreating(false); }}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              )
            ))}
          </div>
        )}

        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong className="text-corporate-teal">Live:</strong> public phrasebook is deployed. Only <em>published</em> phrases are visible. Use <code>?phrasebook=feedback</code> to deep-link a category.
          </span>
          <a
            href="/?phrasebook"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90 transition-colors"
          >
            View public page →
          </a>
        </div>
      </div>
    </div>
  );
};

export default PhrasebookAdmin;
