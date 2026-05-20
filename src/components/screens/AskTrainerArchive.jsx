// src/components/screens/AskTrainerArchive.jsx
//
// May-11 #1 — Searchable Ask-a-Trainer archive.
// Full corpus view (user's own questions + community-answered questions)
// with keyword search and basic filters. Linked from the dashboard widget
// so users can find old answers without scrolling the dashboard.

import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageCircleQuestion,
  Search,
  Loader2,
  AlertCircle,
  Tag,
  Video,
  CheckCircle2,
  Clock3,
  X,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { PageLayout } from '../ui/PageLayout';
import {
  subscribeUserQuestions,
  subscribeAnsweredQuestions,
} from '../../services/coachQuestionsService';

const RR_TAG_LABEL = {
  DRF: 'Reinforcing Feedback',
  RED: 'Redirecting Feedback',
  FUW: 'Follow-Up on Work',
  SCE: 'Set Clear Expectations',
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const StatusPill = ({ status }) => {
  if (status === 'answered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        Answered
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock3 className="w-3 h-3" aria-hidden="true" />
      Awaiting reply
    </span>
  );
};

// Lower-cased text from a question used for keyword matching.
const buildSearchHaystack = (q) =>
  [q.title, q.question, q.context, q.responseText, q.userName, q.respondedBy]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const QuestionCard = ({ item }) => {
  const hasResponse = !!(item.responseText || item.responseVideoUrl);
  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusPill status={item.status} />
          {item.rrTag && RR_TAG_LABEL[item.rrTag] && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-corporate-teal-ink bg-corporate-teal/10 border border-corporate-teal/30 rounded-full px-2 py-0.5">
              <Tag className="w-3 h-3" aria-hidden="true" />
              {RR_TAG_LABEL[item.rrTag]}
            </span>
          )}
          {item.userName && (
            <span className="text-[11px] text-slate-500">
              — {item.userName.split(' ')[0]}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {formatTimestamp(item.createdAt)}
        </span>
      </div>

      {item.title && (
        <h3 className="text-base font-semibold text-corporate-navy dark:text-white mb-1">
          {item.title}
        </h3>
      )}
      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
        {item.question}
      </p>
      {item.context && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
          {item.context}
        </p>
      )}

      {hasResponse && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-corporate-teal-ink mb-1.5">
            Trainer&rsquo;s reply
            {item.respondedAt && (
              <span className="ml-2 font-normal text-slate-500">
                · {formatTimestamp(item.respondedAt)}
              </span>
            )}
          </div>
          {item.responseText && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-1.5">
              {item.responseText}
            </p>
          )}
          {item.responseVideoUrl && (
            <a
              href={item.responseVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-corporate-teal-ink hover:underline"
            >
              <Video className="w-3.5 h-3.5" aria-hidden="true" />
              Watch video reply
            </a>
          )}
        </div>
      )}
    </article>
  );
};

const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'mine', label: 'My Questions' },
  { id: 'community', label: 'Community' },
];

const STATUSES = [
  { id: 'all', label: 'All statuses' },
  { id: 'answered', label: 'Answered' },
  { id: 'open', label: 'Awaiting reply' },
  { id: 'cancelled', label: 'Cancelled' },
];

const TAGS = [
  { id: 'all', label: 'All tags' },
  { id: 'DRF', label: 'Reinforcing' },
  { id: 'RED', label: 'Redirecting' },
  { id: 'FUW', label: 'Follow-Up' },
  { id: 'SCE', label: 'Set Expectations' },
];

const AskTrainerArchive = () => {
  const { db, user, navigate } = useAppServices();
  const userId = user?.uid;

  const [mine, setMine] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [errorMine, setErrorMine] = useState(null);
  const [errorCommunity, setErrorCommunity] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [scope, setScope] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  // User's own questions (all statuses)
  useEffect(() => {
    if (!db || !userId) return undefined;
    setLoadingMine(true);
    setErrorMine(null);
    const unsub = subscribeUserQuestions(
      db,
      userId,
      (items) => {
        setMine(items || []);
        setLoadingMine(false);
      },
      {
        onError: (err) => {
          setErrorMine(err?.message || 'Failed to load your questions.');
          setLoadingMine(false);
        },
      },
    );
    return unsub;
  }, [db, userId]);

  // Community-answered questions (all answered docs are readable per rules)
  useEffect(() => {
    if (!db) return undefined;
    setLoadingCommunity(true);
    setErrorCommunity(null);
    const unsub = subscribeAnsweredQuestions(
      db,
      (items) => {
        setCommunity((items || []).filter((q) => q.userId !== userId));
        setLoadingCommunity(false);
      },
      {
        // Pull a generous slice for archive search; trim further client-side.
        limit: 500,
        onError: (err) => {
          setErrorCommunity(
            err?.code === 'failed-precondition'
              ? 'Index still building — please retry in a moment.'
              : err?.message || 'Failed to load community questions.',
          );
          setLoadingCommunity(false);
        },
      },
    );
    return unsub;
  }, [db, userId]);

  // Combine + dedupe by id, sort newest first by respondedAt or createdAt.
  const combined = useMemo(() => {
    const map = new Map();
    [...mine, ...community].forEach((q) => {
      if (q?.id) map.set(q.id, q);
    });
    const arr = Array.from(map.values());
    const ts = (q) => {
      const t = q.respondedAt || q.createdAt;
      if (!t) return 0;
      return t.toDate ? t.toDate().getTime() : new Date(t).getTime();
    };
    return arr.sort((a, b) => ts(b) - ts(a));
  }, [mine, community]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return combined.filter((q) => {
      if (scope === 'mine' && q.userId !== userId) return false;
      if (scope === 'community' && q.userId === userId) return false;
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (tagFilter !== 'all' && q.rrTag !== tagFilter) return false;
      if (term && !buildSearchHaystack(q).includes(term)) return false;
      return true;
    });
  }, [combined, scope, statusFilter, tagFilter, searchTerm, userId]);

  const loading = loadingMine || loadingCommunity;
  // Surface a non-blocking warning if either query failed; the archive can
  // still render whatever loaded successfully.
  const errorMsg = errorMine || errorCommunity;

  return (
    <PageLayout
      title="Ask a Trainer — Archive"
      icon={MessageCircleQuestion}
      subtitle="Search every question you've asked plus answered questions from across the community."
      navigate={navigate}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Ask a Trainer', path: 'ask-coach' },
        { label: 'Archive', path: null },
      ]}
    >
      {/* Search + filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 mb-4">
        <label htmlFor="archive-search" className="sr-only">
          Search questions
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="archive-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword (e.g. 'giving feedback to a senior')"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <FilterGroup
            label="Scope"
            value={scope}
            onChange={setScope}
            options={SCOPES}
          />
          <FilterGroup
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUSES}
          />
          <FilterGroup
            label="Tag"
            value={tagFilter}
            onChange={setTagFilter}
            options={TAGS}
          />
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading && combined.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500 dark:text-slate-400">
          No questions match your search.
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Showing {filtered.length} of {combined.length} questions
          </p>
          <div className="space-y-3">
            {filtered.map((q) => (
              <QuestionCard key={q.id} item={q} />
            ))}
          </div>
        </>
      )}
    </PageLayout>
  );
};

const FilterGroup = ({ label, value, onChange, options }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
      {label}
    </span>
    <div className="inline-flex flex-wrap gap-1" role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? 'bg-corporate-teal text-white border-corporate-teal'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-corporate-teal/50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default AskTrainerArchive;
