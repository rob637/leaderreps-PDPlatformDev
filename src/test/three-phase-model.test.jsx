// src/test/three-phase-model.test.jsx
//
// Tests for the May 2026 three-phase refactor:
//   - phaseKey() resolution (object/string/legacy id)
//   - isAscentApproved() rule (foundationCompleted + ascentApproved, plus legacy graduated)
//   - useThreePhaseContent() hook: phase routing, isLoading, EMPTY_PHASE_DOC fallback

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import {
  PHASES,
  PHASE_KEYS,
  phaseKey,
  isAscentApproved,
} from '../hooks/useDailyPlan';

// We mock the dependencies of useThreePhaseContent so the test does not need
// Firebase, the DataProvider, or a real services container.
vi.mock('../services/useAppServices', () => ({
  useAppServices: vi.fn(),
}));
vi.mock('../hooks/useDailyPlan', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDailyPlan: vi.fn(),
  };
});

import { useAppServices } from '../services/useAppServices';
import { useDailyPlan } from '../hooks/useDailyPlan';
import {
  useThreePhaseContent,
  EMPTY_PHASE_DOC,
} from '../hooks/useThreePhaseContent';

describe('phaseKey()', () => {
  it('returns null for null/undefined', () => {
    expect(phaseKey(null)).toBe(null);
    expect(phaseKey(undefined)).toBe(null);
  });

  it('passes through canonical phase key strings', () => {
    expect(phaseKey('onboarding')).toBe('onboarding');
    expect(phaseKey('foundation')).toBe('foundation');
    expect(phaseKey('ascent')).toBe('ascent');
  });

  it('maps legacy phase id strings', () => {
    expect(phaseKey('pre-start')).toBe('onboarding');
    expect(phaseKey('start')).toBe('foundation');
    expect(phaseKey('post-start')).toBe('ascent');
  });

  it('reads phaseKey from a PHASES.* object', () => {
    expect(phaseKey(PHASES.PRE_START)).toBe(PHASE_KEYS.ONBOARDING);
    expect(phaseKey(PHASES.START)).toBe(PHASE_KEYS.FOUNDATION);
    expect(phaseKey(PHASES.POST_START)).toBe(PHASE_KEYS.ASCENT);
  });

  it('falls back to legacy id mapping when phaseKey is missing on the object', () => {
    expect(phaseKey({ id: 'pre-start' })).toBe('onboarding');
    expect(phaseKey({ id: 'start' })).toBe('foundation');
    expect(phaseKey({ id: 'post-start' })).toBe('ascent');
  });

  it('returns null for unknown strings/objects', () => {
    expect(phaseKey('garbage')).toBe(null);
    expect(phaseKey({ id: 'who-knows' })).toBe(null);
    expect(phaseKey({})).toBe(null);
  });
});

describe('isAscentApproved()', () => {
  it('returns false for null/undefined', () => {
    expect(isAscentApproved(null)).toBe(false);
    expect(isAscentApproved(undefined)).toBe(false);
  });

  it('returns true when both foundationCompleted and ascentApproved are true', () => {
    expect(
      isAscentApproved({ foundationCompleted: true, ascentApproved: true })
    ).toBe(true);
  });

  it('returns false when foundationCompleted is true but ascentApproved is missing/false', () => {
    expect(isAscentApproved({ foundationCompleted: true })).toBe(false);
    expect(
      isAscentApproved({ foundationCompleted: true, ascentApproved: false })
    ).toBe(false);
  });

  it('returns false when only ascentApproved is true (no foundationCompleted)', () => {
    expect(isAscentApproved({ ascentApproved: true })).toBe(false);
  });

  it('honors legacy graduated=true as full Ascent grant', () => {
    expect(isAscentApproved({ graduated: true })).toBe(true);
  });

  it('does not treat graduated=false as a grant', () => {
    expect(isAscentApproved({ graduated: false })).toBe(false);
  });
});

describe('useThreePhaseContent()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setMocks = ({ phase, services }) => {
    useAppServices.mockReturnValue(services);
    useDailyPlan.mockReturnValue({ currentPhase: phase });
  };

  it('returns EMPTY_PHASE_DOC for onboarding phase, isLoading false', () => {
    setMocks({
      phase: PHASES.PRE_START,
      services: { threePhaseContent: { foundation: null, ascent: null } },
    });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.phaseKey).toBe('onboarding');
    expect(result.current.phaseContent).toEqual(EMPTY_PHASE_DOC);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns the foundation document when in foundation phase', () => {
    const foundation = {
      ...EMPTY_PHASE_DOC,
      actions: [{ id: 'a1', title: 'Lead a 1:1' }],
      contentItems: [{ id: 'c1', title: 'Watch leadership video' }],
    };
    setMocks({
      phase: PHASES.START,
      services: { threePhaseContent: { foundation, ascent: null } },
    });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.phaseKey).toBe('foundation');
    expect(result.current.phaseContent).toBe(foundation);
    expect(result.current.foundationContent).toBe(foundation);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns the ascent document when in ascent phase', () => {
    const ascent = {
      ...EMPTY_PHASE_DOC,
      actions: [{ id: 'a2', title: 'Run team retro' }],
    };
    setMocks({
      phase: PHASES.POST_START,
      services: { threePhaseContent: { foundation: null, ascent } },
    });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.phaseKey).toBe('ascent');
    expect(result.current.phaseContent).toBe(ascent);
    expect(result.current.ascentContent).toBe(ascent);
    expect(result.current.isLoading).toBe(false);
  });

  it('reports isLoading=true when foundation phase but doc is null', () => {
    setMocks({
      phase: PHASES.START,
      services: { threePhaseContent: { foundation: null, ascent: null } },
    });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.phaseKey).toBe('foundation');
    expect(result.current.phaseContent).toEqual(EMPTY_PHASE_DOC);
    expect(result.current.isLoading).toBe(true);
  });

  it('reports isLoading=true when ascent phase but doc is null', () => {
    setMocks({
      phase: PHASES.POST_START,
      services: { threePhaseContent: { foundation: null, ascent: null } },
    });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.phaseKey).toBe('ascent');
    expect(result.current.isLoading).toBe(true);
  });

  it('exposes services.updatePhaseContent when present', () => {
    const updateFn = vi.fn();
    setMocks({
      phase: PHASES.START,
      services: {
        threePhaseContent: { foundation: { ...EMPTY_PHASE_DOC }, ascent: null },
        updatePhaseContent: updateFn,
      },
    });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.updatePhaseContent).toBe(updateFn);
  });

  it('survives empty services (no DataProvider yet)', () => {
    setMocks({ phase: null, services: null });
    const { result } = renderHook(() => useThreePhaseContent());
    expect(result.current.phaseKey).toBe(null);
    expect(result.current.phaseContent).toEqual(EMPTY_PHASE_DOC);
    expect(result.current.isLoading).toBe(false);
  });
});
