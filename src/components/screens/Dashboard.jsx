// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/30/25
// FIX: Anchor deletion logic implemented in handleDeletePlanAndReset (Issue 1).
// FIX: Added defensive checks for arrays after deletion to prevent React error #31.
// UX: Implemented floating/blinking Anchor FAB and Test Utilities.
// UX: REMOVED LeadershipAnchorsCard for prominence of FAB.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowRight, Edit3, Loader, X, Users, Send, Target, Clock, Zap, Shield, Trash2, Anchor } from 'lucide-react'; 
import { deleteField } from 'firebase/firestore'; // Used for reminder dismissals
import { MembershipGate } from '../ui/MembershipGate.jsx';
import { COLORS } from './dashboard/dashboardConstants.js';

// Import modular components from the file you provided
import {
  Button,
  Card,
  ModeSwitch,
  StreakTracker,
  DynamicBookendContainer,
  DevPlanProgressLink,
  AICoachNudge,
  ReminderBanner,
  SaveIndicator,
  BonusExerciseModal,
  SocialPodCard,
  // === UNIFIED IMPORTS ===
  UnifiedAnchorEditorModal,
  AdditionalRepsCard
  // LeadershipAnchorsCard REMOVED per user request
  // ===========================
} from './dashboard/DashboardComponents.jsx';
import TestUtilsModal from './dashboard/TestUtilsModal.jsx';// Arena v1.0 Scope: Import Daily Tasks component to replace Social Pod
import DailyTasksCard from './dashboard/DailyTasksCard.jsx';

// Import hooks from the file you provided
import { useDashboard } from './dashboard/DashboardHooks.jsx';

// --- Helper function to sanitize Firestore Timestamps ---
const sanitizeTimestamps = (obj) => {
  if (!obj) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeTimestamps(item));
  }
  
  // Handle Firestore Timestamp objects
  if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  
  // Handle plain objects
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeTimestamps(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};


// --- Helper Components (Membership-Aware Start Card per Arena v1.0 Scope) ---
const GetStartedCard = ({ onNavigate, membershipData, developmentPlanData }) => {
  const currentTier = membershipData?.currentTier || 'basic';
  const hasCompletedPlan = developmentPlanData?.currentPlan && 
    developmentPlanData.currentPlan.focusAreas && 
    developmentPlanData.currentPlan.focusAreas.length > 0;

  // Base members -> Show upgrade page
  if (currentTier === 'basic') {
    return (
      <Card accent="ORANGE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              Unlock Your Leadership Potential
            </h2>
            <p className="text-base mt-1" style={{ color: COLORS.MUTED }}>
              Upgrade to Arena Professional to access assessments, development plans, and accountability pods.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('membership-upgrade')}
            variant="primary"
            size="md"
            className="flex-shrink-0 w-full sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${COLORS.ORANGE}, ${COLORS.TEAL})` }}
          >
            View Plans <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Pro/Premium members without plan -> Assessment & Plan flow
  if ((currentTier === 'professional' || currentTier === 'elite') && !hasCompletedPlan) {
    return (
      <Card accent="BLUE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              Create Your Development Plan
            </h2>
            <p className="text-base mt-1" style={{ color: COLORS.MUTED }}>
              Take your leadership assessment and create your personalized development plan.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('development-plan')}
            variant="primary"
            size="md"
            className="flex-shrink-0 w-full sm:w-auto"
          >
            Take Assessment <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Pro/Premium members with plan -> This Week's Focus
  if ((currentTier === 'professional' || currentTier === 'elite') && hasCompletedPlan) {
    const currentWeekFocus = developmentPlanData?.currentPlan?.focusAreas?.[0]?.name || 'Leadership Development';
    
    return (
      <Card accent="TEAL">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              This Week's Focus
            </h2>
            <p className="text-lg font-semibold mt-1" style={{ color: COLORS.TEAL }}>
              {currentWeekFocus}
            </p>
            <p className="text-sm mt-1" style={{ color: COLORS.MUTED }}>
              Continue building your skills in this key area
            </p>
          </div>
          <Button
            onClick={() => onNavigate('development-plan')}
            variant="outline"
            size="md"
            className="flex-shrink-0 w-full sm:w-auto"
          >
            View Your Plan <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Fallback to original behavior
  return (
    <Card accent="TEAL">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
            Start Your Leadership Journey
          </h2>
          <p className="text-base mt-1" style={{ color: COLORS.MUTED }}>
            Create your personalized Development Plan to unlock your daily reps.
          </p>
        </div>
        <Button
          onClick={() => onNavigate('/development-plan')}
          variant="primary"
          size="md"
          className="flex-shrink-0 w-full sm:w-auto"
        >
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};

const Dashboard = (props) => {
  console.log('✅ Dashboard component is RENDERING (minimal version)');
  return <div>Dashboard Loaded Successfully (Minimal Test)</div>;
};

export default Dashboard;