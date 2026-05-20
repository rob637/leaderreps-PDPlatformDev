// src/components/admin/crm/components/prospects/AIComposeDialog.jsx
//
// Modal that drafts an outreach message via the Gemini proxy and lets the
// rep tweak inputs, regenerate, copy, or "Use Draft" (passes back to caller).

import React, { useState } from 'react';
import { X, Sparkles, Copy, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { composeOutreach } from '../../services/aiService';

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'linkedin', label: 'LinkedIn DM' },
];

const TONES = [
  { id: 'warm-professional', label: 'Warm & Professional' },
  { id: 'direct', label: 'Direct & Concise' },
  { id: 'consultative', label: 'Consultative' },
  { id: 'casual', label: 'Casual' },
];

const INTENTS = [
  { id: 'introduce', label: 'First introduction' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'book_meeting', label: 'Book a meeting' },
  { id: 'reengage', label: 'Re-engage cold contact' },
  { id: 'proposal', label: 'Send proposal' },
];

export default function AIComposeDialog({
  open,
  onClose,
  prospect,
  senderName,
  onUseDraft, // optional: ({ subject, body }) => void
}) {
  const [channel, setChannel] = useState('email');
  const [tone, setTone] = useState('warm-professional');
  const [intent, setIntent] = useState('introduce');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState(null); // { subject, body, rationale }
  const [error, setError] = useState('');

  if (!open) return null;

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await composeOutreach({
        prospect,
        channel,
        tone,
        intent,
        context,
        senderName,
      });
      setDraft(result);
    } catch (err) {
      console.error('AI compose error:', err);
      setError(err.message || 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const copyDraft = () => {
    if (!draft) return;
    const text =
      channel === 'email' && draft.subject
        ? `Subject: ${draft.subject}\n\n${draft.body}`
        : draft.body;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const useDraft = () => {
    if (!draft || !onUseDraft) return;
    onUseDraft(draft);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              AI Outreach Draft
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <Select label="Channel" value={channel} onChange={setChannel} options={CHANNELS} />
            <Select label="Intent" value={intent} onChange={setIntent} options={INTENTS} />
            <Select label="Tone" value={tone} onChange={setTone} options={TONES} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Optional context
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. We met at SHRM, they downloaded the leadership ROI report, etc."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Output */}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {draft && (
            <div className="space-y-2">
              {channel === 'email' && draft.subject && (
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Subject
                  </div>
                  <div className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                    {draft.subject}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Body
                </div>
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 text-sm font-mono leading-relaxed border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              {draft.rationale && (
                <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Why: {draft.rationale}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? 'Generating...' : draft ? 'Regenerate' : 'Generate Draft'}
          </button>
          <div className="flex items-center gap-2">
            {draft && (
              <button
                onClick={copyDraft}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            )}
            {draft && onUseDraft && (
              <button
                onClick={useDraft}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-brand-teal rounded-lg hover:bg-brand-teal/90"
              >
                <Send className="w-4 h-4" />
                Use Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
