// src/components/widgets/KickoffProgressCard.jsx
//
// KickoffProgressCard — compact, collapsible "Get Started" checklist for
// Foundation / Ascent kickoff items. Replaces the burnt-orange row-per-item
// rendering inside NotificationsWidget.
//
// UX behavior (May 2026):
//   • Single-row collapsed header by default once 1+ items are complete,
//     showing a progress bar + "X of Y complete". First-time users (0
//     complete) see it auto-expanded so the checklist is immediately
//     actionable.
//   • Expand/collapse via the header chevron. State persists across page
//     loads in localStorage (per-user).
//   • Completed items remain visible in a "Completed" subsection
//     (greyed/struck-through) so the user gets confirmation and can
//     revisit. Active items appear first, in brand teal.
//   • 100% state: a celebratory pill ("✓ Foundation Kickoff Complete")
//     persists for 48 hours after the final item is checked, then the
//     card auto-hides. User can also dismiss at any time via the × in
//     the header.
//   • Returns null when there is nothing to show (no items, wrong phase,
//     dismissed, or celebration window expired).
//
// Reuses all data-fetch and click handlers from KickoffNotifications.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Sparkles, Check, FileText, PlayCircle, BookOpen, FileSpreadsheet, Loader,
  ChevronDown, ChevronUp, X, CheckCircle2,
} from 'lucide-react';
import { Card } from '../ui';
import useThreePhaseContent from '../../hooks/useThreePhaseContent';
import { useActionProgress } from '../../hooks/useActionProgress';
import useResourceOpener from '../../hooks/useResourceOpener';
import { useAppServices } from '../../services/useAppServices';
import { isAscentApproved } from '../../hooks/useDailyPlan'; // eslint-disable-line no-unused-vars -- retained for future per-phase gating
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

const CELEBRATION_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

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

const lsKey = (uid, suffix) => `kickoff::${uid || 'anon'}::${suffix}`;

const safeGet = (key) => {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; }
  catch (_) { return null; }
};

const safeSet = (key, value) => {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); }
  catch (_) { /* ignore */ }
};

const KickoffProgressCard = () => {
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

  // UI state — persisted in localStorage so collapsed/dismissed sticks.
  const uid = user?.uid;
  const [expanded, setExpanded] = useState(() => {
    const stored = safeGet(lsKey(uid, 'expanded'));
    return stored === null ? null : stored === 'true';
  });
  const [dismissed, setDismissed] = useState(() => safeGet(lsKey(uid, 'dismissed')) === 'true');
  const [completedAt, setCompletedAt] = useState(() => {
    const v = safeGet(lsKey(uid, 'completedAt'));
    return v ? Number(v) : null;
  });

  // Reset local UI state when the active user changes (e.g. account switch).
  useEffect(() => {
    const exp = safeGet(lsKey(uid, 'expanded'));
    setExpanded(exp === null ? null : exp === 'true');
    setDismissed(safeGet(lsKey(uid, 'dismissed')) === 'true');
    const c = safeGet(lsKey(uid, 'completedAt'));
    setCompletedAt(c ? Number(c) : null);
  }, [uid]);

  const setExpandedPersisted = useCallback((value) => {
    setExpanded(value);
    safeSet(lsKey(uid, 'expanded'), String(value));
  }, [uid]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    safeSet(lsKey(uid, 'dismissed'), 'true');
  }, [uid]);

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

  // Ascent has no formal kickoff (per May 2026 product decision — Foundation
  // requires the onboarding ritual; Ascent does not). Hide the card entirely
  // in Ascent so we don't need the ascentApproved gate at all.
  const hidden = phaseKey === 'onboarding' || phaseKey === 'ascent' || isLoading;

  const itemDone = useCallback((item, idx) => {
    if (isArtifactItem(item)) return isArtifactComplete(getArtifactKind(item));
    if (isInteractiveItem(item)) return isInteractiveComplete(getInteractiveKind(item));
    return isItemCompleted(resolveId(item, idx));
  }, [isArtifactComplete, isItemCompleted, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const { todo, done, total, completedCount } = useMemo(() => {
    const t = [];
    const d = [];
    requiredItems.forEach((entry) => {
      if (itemDone(entry.item, entry.idx)) d.push(entry);
      else t.push(entry);
    });
    return { todo: t, done: d, total: requiredItems.length, completedCount: d.length };
  }, [requiredItems, itemDone]);

  const allComplete = total > 0 && completedCount === total;

  // When the user just hit 100%, stamp the celebration timestamp so we can
  // auto-hide after 48h. If we already have a stamp, leave it alone.
  useEffect(() => {
    if (allComplete && !completedAt) {
      const now = Date.now();
      setCompletedAt(now);
      safeSet(lsKey(uid, 'completedAt'), String(now));
    }
    if (!allComplete && completedAt) {
      // User regressed (e.g. re-opened an item that auto-uncompleted) — clear
      // the celebration stamp so the next 100% gets a fresh window.
      setCompletedAt(null);
      safeSet(lsKey(uid, 'completedAt'), '');
    }
  }, [allComplete, completedAt, uid]);

  const celebrationExpired =
    allComplete && completedAt && (Date.now() - completedAt) > CELEBRATION_WINDOW_MS;

  // Decide whether to render at all.
  if (hidden || total === 0 || dismissed || celebrationExpired) return null;

  // First render: if expanded preference not yet set, default based on progress.
  const effectiveExpanded = expanded === null ? completedCount === 0 : expanded;

  const phaseLabel = phaseKey === 'ascent' ? 'Ascent' : 'Foundation';
  const progressPct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const onClickItem = (item, idx) => {
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
      <Card className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-teal relative overflow-hidden p-4 sm:p-5">
        {/* Header — clickable to expand/collapse */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpandedPersisted(!effectiveExpanded)}
            className="flex-1 flex items-center gap-3 text-left"
            aria-expanded={effectiveExpanded}
            aria-controls="kickoff-progress-body"
          >
            <div className="flex-shrink-0 text-corporate-teal">
              {allComplete ? (
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-corporate-navy dark:text-white truncate">
                  {allComplete
                    ? `${phaseLabel} Kickoff Complete`
                    : `${phaseLabel} Kickoff`}
                </h2>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
                  {completedCount} of {total}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-corporate-teal transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
            <div className="flex-shrink-0 text-slate-400" aria-hidden="true">
              {effectiveExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>
          {/* Dismiss is only offered once the user is fully done — before that,
              hiding the card would just bury required setup. */}
          {allComplete && (
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Dismiss kickoff card"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        {effectiveExpanded && (
          <div id="kickoff-progress-body" className="mt-4 space-y-2">
            {allComplete && (
              <p className="text-sm text-corporate-teal-ink dark:text-corporate-teal mb-2">
                You&apos;re all set — welcome to {phaseLabel}.
              </p>
            )}

            {todo.length > 0 && (
              <ul className="space-y-1.5">
                {todo.map(({ item, idx }) => {
                  const id = resolveId(item, idx);
                  const label = resolveLabel(item);
                  const Icon = itemIcon(item);
                  const loading = loadingResource && loadingResource === id;
                  const artifact = isArtifactItem(item);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => onClickItem(item, idx)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-corporate-teal/5 dark:hover:bg-corporate-teal/10 border border-transparent hover:border-corporate-teal/20 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-corporate-teal/40 group-hover:border-corporate-teal transition-colors" aria-hidden="true" />
                        <div className="flex-shrink-0 text-corporate-teal">
                          {loading ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <Icon size={14} />
                          )}
                        </div>
                        <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
                          {label}
                        </span>
                        {artifact && (
                          <span className="flex-shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                            Locker
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {done.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-3 mb-1">
                  Completed
                </p>
                <ul className="space-y-1">
                  {done.map(({ item, idx }) => {
                    const id = resolveId(item, idx);
                    const label = resolveLabel(item);
                    const artifact = isArtifactItem(item);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onClickItem(item, idx)}
                          className="w-full text-left flex items-center gap-3 px-3 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors group"
                          aria-label={`Review ${label}`}
                          title="Click to review or update"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-corporate-teal/15 text-corporate-teal flex items-center justify-center" aria-hidden="true">
                            <Check size={12} />
                          </div>
                          <span className="flex-1 text-sm text-slate-500 dark:text-slate-400 line-through group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                            {label}
                          </span>
                          {artifact && (
                            <span className="flex-shrink-0 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              Locker
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
};

export default React.memo(KickoffProgressCard);
