// src/components/widgets/KickoffToDoWidget.jsx
//
// KickoffToDoWidget — Phase Kickoff To-Do
// =======================================
// Surfaces only the REQUIRED items from the leader's current phase content
// (Foundation or Ascent). Auto-hides when 100% of required items are complete.
//
// Behavior (May 2026 — restored legacy click-to-open + auto-complete):
//   • Clicking a content item opens it in UniversalResourceViewer.
//   • Documents/tools/read-reps auto-mark complete when opened.
//   • Videos auto-mark complete when playback reaches the end.
//   • Artifact items (Leader Profile, Skills Baseline, Identity Statement)
//     navigate to their dedicated screen and complete via their own flow.
//   • No manual radio-button toggling — completion is derived.

import React, { useMemo } from 'react';
import {
  Star, Check, FileText, PlayCircle, BookOpen, FileSpreadsheet, Loader,
} from 'lucide-react';
import { Card } from '../ui';
import useThreePhaseContent from '../../hooks/useThreePhaseContent';
import { useActionProgress } from '../../hooks/useActionProgress';
import useResourceOpener from '../../hooks/useResourceOpener';
import { useAppServices } from '../../services/useAppServices';
import { isAscentApproved } from '../../hooks/useDailyPlan';
import useArtifactCompletion, {
  isArtifactItem,
  getArtifactKind,
  getArtifactNavigation,
} from '../../hooks/useArtifactCompletion';

const resolveId = (item, idx) =>
  item?.id ||
  item?.resourceId ||
  item?.contentItemId ||
  `contentItems::${item?.contentItemLabel || item?.label || 'item'}::${idx}`;

const resolveLabel = (item) =>
  item?.contentItemLabel ||
  item?.label ||
  item?.title ||
  item?.toolName ||
  'Untitled';

const itemIcon = (item) => {
  if (isArtifactItem(item)) return FileText;
  const t = (item?.contentItemType || item?.resourceType || item?.type || '').toLowerCase();
  if (t.includes('video')) return PlayCircle;
  if (t.includes('read') || t.includes('article')) return BookOpen;
  if (t.includes('tool') || t.includes('document') || t.includes('pdf')) return FileSpreadsheet;
  return FileText;
};

const KickoffToDoWidget = () => {
  const { user, navigate } = useAppServices();
  const { phaseKey, phaseContent, isLoading } = useThreePhaseContent();
  const { isItemCompleted, completeItem } = useActionProgress();
  const { isComplete: isArtifactComplete } = useArtifactCompletion();
  const { openResource, ResourceViewer, loadingResource } = useResourceOpener({
    completeItem,
    idResolver: (item) => item?.actionItemId || item?.id || item?.resourceId,
    phaseKey,
  });

  const requiredItems = useMemo(() => {
    const items = Array.isArray(phaseContent?.contentItems) ? phaseContent.contentItems : [];
    return items
      .filter((it) => it?.required || it?.isRequiredContent)
      .map((item, idx) => ({
        item,
        idx,
        order: typeof item?.order === 'number' ? item.order : idx,
      }))
      .sort((a, b) => a.order - b.order);
  }, [phaseContent]);

  const ascentLocked = phaseKey === 'ascent' && !isAscentApproved(user || {});
  if (phaseKey === 'onboarding' || ascentLocked) return null;
  if (isLoading) return null;
  if (requiredItems.length === 0) return null;

  const itemDone = (item, idx) => {
    if (isArtifactItem(item)) return isArtifactComplete(getArtifactKind(item));
    return isItemCompleted(resolveId(item, idx));
  };

  const completedCount = requiredItems.reduce(
    (acc, { item, idx }) => acc + (itemDone(item, idx) ? 1 : 0),
    0,
  );

  if (completedCount >= requiredItems.length) return null;

  const phaseLabel = phaseKey === 'ascent' ? 'Ascent' : 'Foundation';

  const onClick = (item, idx) => {
    if (isArtifactItem(item)) {
      const kind = getArtifactKind(item);
      const { screen, params } = getArtifactNavigation(kind);
      if (typeof navigate === 'function') navigate(screen, params);
      return;
    }
    openResource({
      ...item,
      id: resolveId(item, idx),
      label: resolveLabel(item),
    });
  };

  return (
    <>
      {ResourceViewer}
      <Card title={`${phaseLabel} Kickoff`} icon={Star} accent="ORANGE">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 px-2">
          Complete these required items to get the most out of {phaseLabel}.
        </p>
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Required
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {completedCount} of {requiredItems.length} complete
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-4">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${(completedCount / requiredItems.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-1">
          {requiredItems.map(({ item, idx }) => {
            const id = resolveId(item, idx);
            const label = resolveLabel(item);
            const artifact = isArtifactItem(item);
            const done = itemDone(item, idx);
            const Icon = itemIcon(item);
            const loading = loadingResource && loadingResource === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onClick(item, idx)}
                  className="w-full flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left"
                >
                  {done ? (
                    <Check className="w-5 h-5 text-corporate-teal flex-shrink-0 mt-0.5" />
                  ) : loading ? (
                    <Loader className="w-5 h-5 text-slate-400 animate-spin flex-shrink-0 mt-0.5" />
                  ) : (
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${artifact ? 'text-amber-500' : 'text-corporate-teal'}`} />
                  )}
                  <span
                    className={`text-sm font-medium flex items-center gap-2 flex-wrap ${
                      done
                        ? 'text-slate-400 line-through'
                        : 'text-corporate-navy dark:text-white hover:text-corporate-teal'
                    }`}
                  >
                    <span>{label}</span>
                    {artifact && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        Locker
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
};

export default KickoffToDoWidget;
