// src/components/common/SocialProofBadge.jsx
//
// Subtle social-proof badge for a content piece. Two variants:
//   - variant="opens"       → "Read by 143 leaders"  (default)
//   - variant="completions" → "Completed by 89 leaders"
//
// Renders NOTHING (returns null) unless ALL of these are true:
//   - global config.displayEnabled is true
//   - aggregate doc exists for contentId
//   - aggregate.displayPublicly is true (per-item admin toggle)
//   - the relevant counter (uniqueOpens or uniqueCompletions) >=
//     config.displayThreshold
//
// Subscribes to the aggregate via contentMetricsService. Safe to drop into any
// content surface — failure paths are silent.

import React, { useEffect, useState, useMemo } from 'react';
import { BookOpen, Eye, CheckCircle2 } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { createContentMetricsService } from '../../services/contentMetricsService';

const OPEN_VERB_BY_TYPE = {
  reading: 'Read by',
  'read-rep': 'Read by',
  video: 'Watched by',
  document: 'Opened by',
  course: 'Started by',
  tool: 'Used by',
  default: 'Opened by',
};

const noun = (n) => (n === 1 ? 'leader' : 'leaders');

const SocialProofBadge = ({
  contentId,
  contentType = 'default',
  variant = 'opens', // 'opens' | 'completions'
  className = '',
  compact = false,
}) => {
  const { db } = useAppServices();
  const service = useMemo(() => createContentMetricsService(db), [db]);

  const [aggregate, setAggregate] = useState(null);
  const [config, setConfig] = useState(service.DEFAULT_CONFIG);

  useEffect(() => {
    if (!contentId) return undefined;
    const unsub = service.subscribeAggregate(contentId, setAggregate);
    return () => {
      try { unsub && unsub(); } catch (_) { /* noop */ }
    };
  }, [contentId, service]);

  useEffect(() => {
    const unsub = service.subscribeConfig(setConfig);
    return () => {
      try { unsub && unsub(); } catch (_) { /* noop */ }
    };
  }, [service]);

  if (!contentId) return null;
  if (!config.displayEnabled) return null;
  if (!aggregate) return null;
  if (!aggregate.displayPublicly) return null;

  const isCompletions = variant === 'completions';
  const count = isCompletions
    ? aggregate.uniqueCompletions || aggregate.completions || 0
    : aggregate.uniqueOpens || aggregate.opens || 0;
  if (count < (config.displayThreshold || 0)) return null;

  const verb = isCompletions
    ? 'Completed by'
    : OPEN_VERB_BY_TYPE[contentType] || OPEN_VERB_BY_TYPE.default;
  const Icon = isCompletions
    ? CheckCircle2
    : contentType === 'video'
    ? Eye
    : BookOpen;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ${className}`}
        aria-label={`${verb} ${count} ${noun(count)}`}
        title={`${verb} ${count} ${noun(count)}`}
      >
        <Icon className="w-3 h-3" aria-hidden="true" />
        {count}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}
      aria-label={`${verb} ${count} ${noun(count)}`}
    >
      <Icon className="w-3.5 h-3.5 text-corporate-teal" aria-hidden="true" />
      {verb} {count.toLocaleString()} {noun(count)}
    </span>
  );
};

export default SocialProofBadge;
