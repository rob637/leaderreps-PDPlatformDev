// src/components/widgets/MyActionsWidget.jsx
//
// MyActionsWidget — Self-paced phase content list (May 2026 three-phase model)
// ===========================================================================
// Replaces ThisWeeksActionsWidget for users in Foundation or Ascent.
// Reads from `daily_plan_v2/{phase}-content` via useThreePhaseContent and
// uses the existing useActionProgress hook to track completion.
//
// Onboarding users see a small note pointing them at the prep flow — the
// onboarding pipeline is unchanged and still served by the legacy widgets.

import React, { useMemo } from 'react';
import {
  CheckCircle, BookOpen, PlayCircle, Users, Wrench, Activity,
  Repeat, Lock, Circle, Check, ArrowRight, FileText,
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

const SECTION_ICON = {
  actions: CheckCircle,
  contentItems: PlayCircle,
  coachingItems: Users,
  communityItems: Users,
  tools: Wrench,
  workouts: Activity,
  dailyReps: Repeat,
};

const SECTION_LABEL = {
  actions: 'Actions',
  contentItems: 'Content',
  coachingItems: 'Coaching',
  communityItems: 'Community',
  tools: 'Tools',
  workouts: 'Workouts',
  dailyReps: 'Daily Reps',
};

// Resolve a stable id + display label for any item shape we might encounter
// in the new daily_plan_v2 docs.
const resolveItem = (item, sectionKey, idx) => {
  const id =
    item?.id ||
    item?.resourceId ||
    item?.contentItemId ||
    `${sectionKey}::${item?.contentItemLabel || item?.coachingItemLabel || item?.communityItemLabel || item?.toolName || item?.workoutName || item?.repName || item?.label || 'item'}::${idx}`;
  const label =
    item?.label ||
    item?.contentItemLabel ||
    item?.coachingItemLabel ||
    item?.communityItemLabel ||
    item?.toolName ||
    item?.workoutName ||
    item?.repName ||
    item?.title ||
    'Untitled';
  const subtitle =
    item?.contentItemType ||
    item?.resourceType ||
    item?.type ||
    null;
  return { id, label, subtitle };
};

const ItemRow = ({ item, sectionKey, idx, isComplete, onOpenContent, onOpenArtifact }) => {
  const { id, label, subtitle } = resolveItem(item, sectionKey, idx);
  const isRequired = !!(item?.required || item?.isRequiredContent);
  const isArtifact = isArtifactItem(item);

  const handleClick = () => {
    if (isArtifact) onOpenArtifact(item);
    else onOpenContent(item, id, label);
  };

  return (
    <div className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Open ${label}`}
        className="flex-shrink-0 mt-0.5"
      >
        {isComplete ? (
          <Check className="w-5 h-5 text-corporate-teal" />
        ) : isArtifact ? (
          <FileText className="w-5 h-5 text-amber-500" />
        ) : (
          <FileText className="w-5 h-5 text-corporate-teal" />
        )}
      </button>
      <button
        type="button"
        onClick={handleClick}
        className="min-w-0 flex-1 text-left"
      >
        <div className={`text-sm font-medium flex items-center gap-2 flex-wrap ${isComplete ? 'text-slate-400 line-through' : 'text-corporate-navy dark:text-white'}`}>
          <span className="truncate">{label}</span>
          {isRequired && !isComplete && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Required
            </span>
          )}
          {isArtifact && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              Locker
            </span>
          )}
        </div>
        {subtitle && !isArtifact && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </div>
        )}
      </button>
    </div>
  );
};

const Section = ({ sectionKey, items, isItemCompleted, onOpenContent, onOpenArtifact, isArtifactComplete }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  // Sort by `order` (stable for equal values, falls back to original index).
  const ordered = items
    .map((item, idx) => ({ item, idx, order: typeof item?.order === 'number' ? item.order : idx }))
    .sort((a, b) => a.order - b.order);
  const Icon = SECTION_ICON[sectionKey] || CheckCircle;
  const label = SECTION_LABEL[sectionKey] || sectionKey;
  const completedCount = ordered.reduce((acc, { item, idx }) => {
    if (isArtifactItem(item)) {
      return acc + (isArtifactComplete(getArtifactKind(item)) ? 1 : 0);
    }
    const { id } = resolveItem(item, sectionKey, idx);
    return acc + (isItemCompleted(id) ? 1 : 0);
  }, 0);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-corporate-teal" />
          <h3 className="text-sm font-semibold text-corporate-navy dark:text-white">{label}</h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {completedCount} / {ordered.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {ordered.map(({ item, idx }) => {
          const { id } = resolveItem(item, sectionKey, idx);
          const complete = isArtifactItem(item)
            ? isArtifactComplete(getArtifactKind(item))
            : isItemCompleted(id);
          return (
            <ItemRow
              key={id}
              item={item}
              sectionKey={sectionKey}
              idx={idx}
              isComplete={complete}
              onOpenContent={onOpenContent}
              onOpenArtifact={onOpenArtifact}
            />
          );
        })}
      </div>
    </div>
  );
};

const AscentLockedNotice = () => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
    <div className="text-sm">
      <div className="font-semibold text-amber-800 dark:text-amber-200">Ascent not yet unlocked</div>
      <div className="text-amber-700 dark:text-amber-300 mt-1">
        You&apos;ve completed Foundation. A trainer will review and approve your move into Ascent.
      </div>
    </div>
  </div>
);

const OnboardingHandoff = () => (
  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
    <div className="text-sm">
      <div className="font-semibold text-blue-800 dark:text-blue-200">Finish onboarding first</div>
      <div className="text-blue-700 dark:text-blue-300 mt-1">
        Complete the prep checklist in the welcome banner above to unlock Foundation content.
      </div>
    </div>
  </div>
);

const MyActionsWidget = ({ helpText }) => {
  const { user, navigate } = useAppServices();
  const { phaseKey, phaseContent, isLoading } = useThreePhaseContent();
  const { isItemCompleted, completeItem } = useActionProgress();
  const { isComplete: isArtifactComplete } = useArtifactCompletion();
  const { openResource, ResourceViewer } = useResourceOpener({
    completeItem,
    idResolver: (item) => item?.actionItemId || item?.id || item?.resourceId,
    phaseKey,
  });

  // For ascent users who haven't been approved yet, show locked notice.
  const ascentLocked = phaseKey === 'ascent' && !isAscentApproved(user || {});

  const onOpenContent = (item, id, label) => {
    openResource({ ...item, id, label });
  };

  const onOpenArtifact = (item) => {
    const kind = getArtifactKind(item);
    if (!kind) return;
    const { screen, params } = getArtifactNavigation(kind);
    if (typeof navigate === 'function') navigate(screen, params);
  };

  // Single Content section (May 2026 — actions/events/tools/workouts retired).
  const sectionOrder = useMemo(() => ['contentItems'], []);

  const widgetTitle =
    phaseKey === 'ascent' ? 'My Ascent'
    : phaseKey === 'foundation' ? 'My Foundation'
    : 'My Actions';

  if (phaseKey === 'onboarding') {
    return (
      <Card title={widgetTitle} icon={CheckCircle} accent="TEAL">
        <OnboardingHandoff />
      </Card>
    );
  }

  if (ascentLocked) {
    return (
      <Card title={widgetTitle} icon={Lock} accent="ORANGE">
        <AscentLockedNotice />
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card title={widgetTitle} icon={CheckCircle} accent="TEAL">
        <div className="text-sm text-slate-500 dark:text-slate-400 p-2">Loading…</div>
      </Card>
    );
  }

  // Count total items across sections to detect empty state
  const totalItems = sectionOrder.reduce(
    (acc, key) => acc + (Array.isArray(phaseContent[key]) ? phaseContent[key].length : 0),
    0
  );

  return (
    <Card title={widgetTitle} icon={CheckCircle} accent="TEAL">
      {ResourceViewer}
      {helpText && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 px-2">{helpText}</p>
      )}
      {totalItems === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 p-2">
          No content has been published for this phase yet. Check back soon.
        </div>
      ) : (
        sectionOrder.map((key) => (
          <Section
            key={key}
            sectionKey={key}
            items={phaseContent[key]}
            isItemCompleted={isItemCompleted}
            onOpenContent={onOpenContent}
            onOpenArtifact={onOpenArtifact}
            isArtifactComplete={isArtifactComplete}
          />
        ))
      )}
    </Card>
  );
};

export default MyActionsWidget;
