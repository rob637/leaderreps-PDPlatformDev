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
  collection, addDoc, doc, deleteDoc, updateDoc,
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
