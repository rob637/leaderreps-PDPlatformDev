import React, { useState, useMemo } from 'react';
import { Users, Mail, Info } from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import FacilitatorProfileModal from './FacilitatorProfileModal';
import FacilitatorAvatar from './FacilitatorAvatar';

/**
 * YourCohortWidget — Locker card showing the leader's cohort + trainer(s).
 *
 * Replaces the old MyJourneyWidget. Cohort/phase/day already surface in the
 * dashboard header, so this card focuses on the two things the Locker should
 * actually answer: "which cohort am I in?" and "how do I reach my trainer?".
 *
 * Layout: one card, three (or four) rows in the MySettings row pattern.
 *   - Cohort info row (informational): name + phase·day pill
 *   - Trainer row(s): avatar + name + title, with Email (mailto) and
 *     View profile (FacilitatorProfileModal) actions.
 */
const YourCohortWidget = () => {
  const { cohortData, currentPhase, phaseDayNumber } = useDailyPlan();
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const trainers = useMemo(() => {
    if (cohortData?.facilitators && Array.isArray(cohortData.facilitators) && cohortData.facilitators.length > 0) {
      return cohortData.facilitators;
    }
    if (cohortData?.facilitator) {
      return [cohortData.facilitator];
    }
    return [];
  }, [cohortData]);

  const phasePill = useMemo(() => {
    const id = currentPhase?.id;
    if (id === 'start') return { label: 'Foundation', tone: 'teal' };
    if (id === 'post-start') return { label: 'Ascent', tone: 'teal' };
    if (id === 'pre-start') return { label: 'Prep', tone: 'slate' };
    return { label: currentPhase?.displayName || '—', tone: 'slate' };
  }, [currentPhase]);

  const phaseSubtitle = phaseDayNumber
    ? `${phasePill.label} · Day ${phaseDayNumber}`
    : phasePill.label;

  return (
    <Card title="My Cohort" icon={Users} accent="TEAL">
      <div className="space-y-2">
        {/* Cohort info row — non-interactive */}
        {cohortData ? (
          <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-corporate-teal/10 dark:bg-corporate-teal/20">
                <Users className="w-4 h-4 text-corporate-teal-ink" />
              </div>
              <div className="text-left min-w-0">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm truncate">{cohortData.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{phaseSubtitle}</p>
              </div>
            </div>
            <span
              className={
                phasePill.tone === 'teal'
                  ? 'inline-flex items-center px-2.5 py-1 rounded-full bg-corporate-teal/15 text-[#1F6B59] dark:text-corporate-teal-ink text-[11px] font-semibold uppercase tracking-wider'
                  : 'inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold uppercase tracking-wider'
              }
            >
              {phasePill.label}
            </span>
          </div>
        ) : (
          <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-left">
              <h4 className="font-medium text-corporate-navy dark:text-white text-sm">No cohort assigned</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Contact your administrator</p>
            </div>
          </div>
        )}

        {/* Trainer row(s) — Email + View profile actions inline */}
        {trainers.map((trainer, idx) => (
          <div
            key={trainer.id || idx}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FacilitatorAvatar name={trainer.name} photoUrl={trainer.photoUrl} size="sm" />
              <div className="text-left min-w-0">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm truncate">{trainer.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{trainer.title || 'Your Trainer'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {trainer.email && (
                <a
                  href={`mailto:${trainer.email}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-corporate-teal/10 hover:bg-corporate-teal/20 text-corporate-teal-ink text-xs font-medium transition-colors"
                  aria-label={`Email ${trainer.name}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Email</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedTrainer(trainer)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
                aria-label={`View ${trainer.name}'s profile`}
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <FacilitatorProfileModal
        facilitator={selectedTrainer}
        cohortName={cohortData?.name}
        isOpen={!!selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
      />
    </Card>
  );
};

export default YourCohortWidget;
