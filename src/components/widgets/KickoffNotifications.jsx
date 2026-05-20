// src/components/widgets/KickoffNotifications.jsx
//
// KickoffNotifications — Foundation / Ascent required items surfaced as
// notification rows. Replaces the standalone Kickoff dashboard box.
//
// Behavior (May 2026):
//   • Reads required items from the leader's current phase via
//     useThreePhaseContent (same source as the old KickoffToDoWidget).
//   • Renders ONLY incomplete required items. Each completed item auto-
//     disappears — there is no manual dismiss. "Clearing" a notification
//     means completing the underlying item.
//   • Click-to-open mirrors the legacy kickoff flow: documents / tools /
//     read-reps auto-complete on open, videos auto-complete at end,
//     artifacts (Leader Profile, Skills Baseline, Identity Statement) and
//     interactive items (Notification Setup, Foundation Commitment,
//     Conditioning Tutorial) open in their dedicated modal.
//   • Returns null when there's nothing pending so the parent can render
//     its own empty state.

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Sparkles, Check, FileText, PlayCircle, BookOpen, FileSpreadsheet, Loader,
  ArrowRight,
} from 'lucide-react';
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

const KickoffNotifications = ({ onCountChange }) => {
  const { user, db, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const { phaseKey, phaseContent, isLoading } = useThreePhaseContent();
  const { isItemCompleted, completeItem } = useActionProgress();
  const { isComplete: isArtifactComplete } = useArtifactCompletion();
  const { openResource, ResourceViewer, loadingResource } = useResourceOpener({
    completeItem,
    idResolver: (item) => item?.actionItemId || item?.id || item?.resourceId,
    phaseKey,
  });

  const [interactiveOpen, setInteractiveOpen] = useState(null);
  const [artifactOpen, setArtifactOpen] = useState(null);
  const [savingBaseline, setSavingBaseline] = useState(false);

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
    const cleanId = (v) => (typeof v === 'string' ? v.trim() : v) || '';
    const linked = (it) => {
      if (isArtifactItem(it)) return true;
      return Boolean(cleanId(it?.resourceId) || cleanId(it?.contentItemId));
    };
    const isInherited = (it) => it?.inheritedFrom && it.inheritedFrom !== phaseKey;
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
  const hidden = phaseKey === 'onboarding' || ascentLocked || isLoading;

  const itemDone = (item, idx) => {
    if (isArtifactItem(item)) return isArtifactComplete(getArtifactKind(item));
    if (isInteractiveItem(item)) return isInteractiveComplete(getInteractiveKind(item));
    return isItemCompleted(resolveId(item, idx));
  };

  // Only render incomplete required items — completing one "clears" it.
  const pending = hidden
    ? []
    : requiredItems.filter(({ item, idx }) => !itemDone(item, idx));

  useEffect(() => {
    if (typeof onCountChange === 'function') onCountChange(pending.length);
  }, [pending.length, onCountChange]);

  if (hidden || pending.length === 0) return null;

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
      {pending.map(({ item, idx }) => {
        const id = resolveId(item, idx);
        const label = resolveLabel(item);
        const artifact = isArtifactItem(item);
        const Icon = itemIcon(item);
        const loading = loadingResource && loadingResource === id;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onClick(item, idx)}
            className="w-full text-left relative p-3 rounded-lg border bg-corporate-orange/10 dark:bg-corporate-orange/20 border-corporate-orange/30 dark:border-corporate-orange/40 hover:bg-corporate-orange/15 dark:hover:bg-corporate-orange/25 transition-colors"
          >
            <div className="flex items-start gap-3 pr-6">
              <div className="mt-0.5 text-corporate-orange">
                {loading ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-corporate-orange/20 text-corporate-orange font-semibold">
                    <Sparkles size={10} />
                    {phaseLabel} kickoff
                  </span>
                  {artifact && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      Locker
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {label}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-corporate-teal-ink hover:underline mt-2">
                  Open <ArrowRight size={12} />
                </span>
              </div>
              <Check
                className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-1"
                aria-hidden="true"
                title="Completing this item clears the notification"
              />
            </div>
          </button>
        );
      })}
    </>
  );
};

export default React.memo(KickoffNotifications);
