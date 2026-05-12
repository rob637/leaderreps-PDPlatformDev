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
  Repeat, Lock, Circle, Check, ArrowRight,
} from 'lucide-react';
import { Card } from '../ui';
import useThreePhaseContent from '../../hooks/useThreePhaseContent';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useAppServices } from '../../services/useAppServices';
import { isAscentApproved } from '../../hooks/useDailyPlan';

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

const ItemRow = ({ item, sectionKey, idx, isComplete, onToggle }) => {
  const { id, label, subtitle } = resolveItem(item, sectionKey, idx);
  return (
    <div className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
      <button
        type="button"
        onClick={() => onToggle(id, item)}
        aria-label={isComplete ? `Mark ${label} incomplete` : `Mark ${label} complete`}
        className="flex-shrink-0 mt-0.5"
      >
        {isComplete ? (
          <Check className="w-5 h-5 text-corporate-teal" />
        ) : (
          <Circle className="w-5 h-5 text-slate-400 hover:text-corporate-teal" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium ${isComplete ? 'text-slate-400 line-through' : 'text-corporate-navy dark:text-white'}`}>
          {label}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ sectionKey, items, isItemCompleted, onToggle }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const Icon = SECTION_ICON[sectionKey] || CheckCircle;
  const label = SECTION_LABEL[sectionKey] || sectionKey;
  const completedCount = items.reduce((acc, item, idx) => {
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
          {completedCount} / {items.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {items.map((item, idx) => {
          const { id } = resolveItem(item, sectionKey, idx);
          return (
            <ItemRow
              key={id}
              item={item}
              sectionKey={sectionKey}
              idx={idx}
              isComplete={isItemCompleted(id)}
              onToggle={onToggle}
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
  const { user } = useAppServices();
  const { phaseKey, phaseContent, isLoading } = useThreePhaseContent();
  const { isItemCompleted, completeItem, uncompleteItem } = useActionProgress();

  // For ascent users who haven't been approved yet, show locked notice.
  const ascentLocked = phaseKey === 'ascent' && !isAscentApproved(user || {});

  const onToggle = (id, item) => {
    if (isItemCompleted(id)) {
      uncompleteItem(id);
    } else {
      completeItem(id, { source: 'my-actions', phase: phaseKey, ...item });
    }
  };

  // Section order — actions first, then content, then everything else.
  const sectionOrder = useMemo(
    () => ['actions', 'contentItems', 'coachingItems', 'communityItems', 'tools', 'workouts', 'dailyReps'],
    []
  );

  const widgetTitle = phaseKey === 'ascent' ? 'My Ascent' : 'My Actions';

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
            onToggle={onToggle}
          />
        ))
      )}
    </Card>
  );
};

export default MyActionsWidget;
