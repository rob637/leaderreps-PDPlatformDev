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

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Star, Check, FileText, PlayCircle, BookOpen, FileSpreadsheet, Loader,
  ChevronDown, ChevronUp,
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
  ARTIFACT_KINDS,
  isInteractiveItem,
  getInteractiveKind,
  INTERACTIVE_KINDS,
} from '../../hooks/useArtifactCompletion';
import NotificationPreferencesWidget from './NotificationPreferencesWidget';
import FoundationCommitmentWidget from './FoundationCommitmentWidget';
import ConditioningTutorialWidget from './ConditioningTutorialWidget';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import BaselineAssessmentSimple from '../screens/developmentplan/BaselineAssessmentSimple';
import IdentityStatement from '../screens/IdentityStatement';
import { syncCompletionToCarryover } from '../../services/carryoverService';

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
  const { user, navigate, db, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { phaseKey, phaseContent, isLoading } = useThreePhaseContent();
  const { isItemCompleted, completeItem } = useActionProgress();
  const { isComplete: isArtifactComplete } = useArtifactCompletion();
  const { openResource, ResourceViewer, loadingResource } = useResourceOpener({
    completeItem,
    idResolver: (item) => item?.actionItemId || item?.id || item?.resourceId,
    phaseKey,
  });

  // Local modal state for items that should open as popouts
  // (artifacts + interactive content) instead of navigating away.
  const [interactiveOpen, setInteractiveOpen] = useState(null);
  const [artifactOpen, setArtifactOpen] = useState(null);
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const isInteractiveComplete = (kind) => {
    const ps = user?.prepStatus || {};
    if (kind === INTERACTIVE_KINDS.NOTIFICATION_SETUP) return ps.notifications === true;
    if (kind === INTERACTIVE_KINDS.FOUNDATION_COMMITMENT) {
      return ps.foundationCommitment === true || !!user?.foundationCommitment?.acknowledged;
    }
    if (kind === INTERACTIVE_KINDS.CONDITIONING_TUTORIAL) {
      return ps.conditioningTutorial === true || !!user?.conditioningTutorial?.completed;
    }
    return false;
  };

  const handleBaselineComplete = async (assessment) => {
    setSavingBaseline(true);
    try {
      const newHistory = [...(developmentPlanData?.assessmentHistory || []), assessment];
      if (updateDevelopmentPlanData) {
        await updateDevelopmentPlanData({
          assessmentHistory: newHistory,
          'currentPlan.focusAreas': assessment.focusAreas || [],
        });
      }
      if (db && user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 'prepStatus.baselineAssessment': true })
          .catch((e) => console.warn('Could not set prepStatus:', e));
        await syncCompletionToCarryover(db, user.uid, 'baseline-assessment', {
          label: 'Complete Leadership Skills Baseline',
          category: 'Preparation',
          prepSection: 'onboarding',
          handlerType: 'baseline-assessment',
        }).catch((e) => console.warn('Could not sync carryover:', e));
      }
      setArtifactOpen(null);
    } catch (error) {
      console.error('Error saving baseline assessment:', error);
    } finally {
      setSavingBaseline(false);
    }
  };

  const requiredItems = useMemo(() => {
    const items = Array.isArray(phaseContent?.contentItems) ? phaseContent.contentItems : [];
    // Hide unlinked items from the leader-facing kickoff list. Artifact
    // items (Leader Profile, Skills Baseline, Identity Statement) are
    // always navigable. Everything else needs a real resourceId/contentItemId
    // pointing at content_library, otherwise the click would just produce
    // a "not linked" alert. Admins still see these in Phase Content.
    const cleanId = (v) => (typeof v === 'string' ? v.trim() : v) || '';
    const linked = (it) => {
      if (isArtifactItem(it)) return true;
      return Boolean(cleanId(it?.resourceId) || cleanId(it?.contentItemId));
    };
    // The kickoff list is strictly per-phase. When the leader is in Ascent,
    // useThreePhaseContent merges Foundation items into phaseContent for
    // discovery, but those items must NOT re-appear as Ascent kickoff
    // requirements — they were already required during Foundation.
    const isInherited = (it) =>
      it?.inheritedFrom && it.inheritedFrom !== phaseKey;
    return items
      .filter((it) => !isInherited(it))
      .filter((it) => (it?.required || it?.isRequiredContent) && linked(it))
      .map((item, idx) => ({
        item,
        idx,
        order: typeof item?.order === 'number' ? item.order : idx,
      }))
      .sort((a, b) => a.order - b.order);
  }, [phaseContent, phaseKey]);

  const ascentLocked = phaseKey === 'ascent' && !isAscentApproved(user || {});
  if (phaseKey === 'onboarding' || ascentLocked) return null;
  if (isLoading) return null;
  if (requiredItems.length === 0) return null;

  const itemDone = (item, idx) => {
    if (isArtifactItem(item)) return isArtifactComplete(getArtifactKind(item));
    if (isInteractiveItem(item)) return isInteractiveComplete(getInteractiveKind(item));
    return isItemCompleted(resolveId(item, idx));
  };

  const completedCount = requiredItems.reduce(
    (acc, { item, idx }) => acc + (itemDone(item, idx) ? 1 : 0),
    0,
  );

  const allComplete = completedCount >= requiredItems.length;
  const showList = !allComplete || !collapsed;

  const phaseLabel = phaseKey === 'ascent' ? 'Ascent' : 'Foundation';

  const onClick = (item, idx) => {
    if (isArtifactItem(item)) {
      setArtifactOpen(getArtifactKind(item));
      return;
    }
    if (isInteractiveItem(item)) {
      setInteractiveOpen(getInteractiveKind(item));
      return;
    }
    openResource({
      ...item,
      id: resolveId(item, idx),
      label: resolveLabel(item),
    });
  };

  const renderInteractiveModal = () => {
    if (!interactiveOpen) return null;
    if (typeof document === 'undefined') return null;
    const close = () => setInteractiveOpen(null);
    let content = null;
    if (interactiveOpen === INTERACTIVE_KINDS.NOTIFICATION_SETUP) {
      content = <NotificationPreferencesWidget onComplete={close} onClose={close} />;
    } else if (interactiveOpen === INTERACTIVE_KINDS.FOUNDATION_COMMITMENT) {
      content = <FoundationCommitmentWidget onComplete={close} onClose={close} />;
    } else if (interactiveOpen === INTERACTIVE_KINDS.CONDITIONING_TUTORIAL) {
      content = <ConditioningTutorialWidget onComplete={close} onClose={close} />;
    }
    if (!content) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-xl">{content}</div>
      </div>,
      document.body,
    );
  };

  const renderArtifactModal = () => {
    if (!artifactOpen) return null;
    if (typeof document === 'undefined') return null;
    const close = () => setArtifactOpen(null);
    let content = null;
    if (artifactOpen === ARTIFACT_KINDS.LEADER_PROFILE) {
      content = <LeaderProfileFormSimple onComplete={close} onClose={close} />;
    } else if (artifactOpen === ARTIFACT_KINDS.SKILLS_BASELINE) {
      const initialData = developmentPlanData?.assessmentHistory?.[
        (developmentPlanData?.assessmentHistory?.length || 0) - 1
      ];
      content = (
        <BaselineAssessmentSimple
          onComplete={handleBaselineComplete}
          onClose={close}
          isLoading={savingBaseline}
          initialData={initialData}
        />
      );
    } else if (artifactOpen === ARTIFACT_KINDS.IDENTITY_STATEMENT) {
      content = <IdentityStatement embedded onClose={close} />;
    }
    if (!content) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-24 sm:pb-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-xl">{content}</div>
      </div>,
      document.body,
    );
  };

  return (
    <>
      {ResourceViewer}
      {renderInteractiveModal()}
      {renderArtifactModal()}
      <Card
        className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-orange relative overflow-hidden p-4 sm:p-5"
        aria-labelledby="kickoff-todo-heading"
      >
        <header className="flex items-center gap-2 mb-3">
          <Star className="w-5 h-5 text-corporate-orange flex-shrink-0" aria-hidden="true" />
          <h2
            id="kickoff-todo-heading"
            className="text-base font-semibold text-corporate-navy dark:text-white"
          >
            {phaseLabel} Kickoff
          </h2>
        </header>
        {allComplete ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors text-left"
            aria-expanded={!collapsed}
          >
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5 text-corporate-teal flex-shrink-0" />
              <span className="text-sm font-medium text-corporate-navy dark:text-white">
                {phaseLabel} kickoff complete
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {completedCount}/{requiredItems.length}
              </span>
            </span>
            {collapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </button>
        ) : (
          <>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 px-2">
              Complete these items to get the most out of {phaseLabel}.
            </p>
            <div className="flex items-center justify-end mb-3 px-2">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {completedCount} of {requiredItems.length} complete
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mb-4">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${(completedCount / requiredItems.length) * 100}%` }}
              />
            </div>
          </>
        )}
        {showList && (
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
        )}
      </Card>
    </>
  );
};

export default React.memo(KickoffToDoWidget);
