import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { repTypeService } from '../services/repTypeService';

/**
 * useMilestoneReps Hook
 * 
 * Provides enriched rep data for a specific milestone.
 * Combines milestone definition with full rep type data.
 * 
 * Usage:
 *   const { milestone, reps, loading, error, getRepById } = useMilestoneReps(milestoneNumber);
 * 
 * Returns reps with full rep type data merged in, ready for display.
 */
export const useMilestoneReps = (milestoneNumber) => {
  const { db } = useAppServices();
  
  // State
  const [milestone, setMilestone] = useState(null);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when milestone number changes
  useEffect(() => {
    if (!db || milestoneNumber === undefined || milestoneNumber === null) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch milestone definition
        const fetchedMilestone = await repTypeService.getMilestoneByNumber(db, milestoneNumber);
        
        if (!fetchedMilestone) {
          console.warn(`[useMilestoneReps] Milestone ${milestoneNumber} not found`);
          setMilestone(null);
          setReps([]);
          setLoading(false);
          return;
        }
        
        setMilestone(fetchedMilestone);
        
        // Get enriched reps with full type data
        const enrichedReps = await repTypeService.getEnrichedMilestoneReps(db, milestoneNumber);
        setReps(enrichedReps);
      } catch (err) {
        console.error('[useMilestoneReps] Error fetching milestone reps:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db, milestoneNumber]);

  // Helper: Get rep by ID from current milestone
  const getRepById = useCallback((repTypeId) => {
    return reps.find(r => r.repTypeId === repTypeId || r.id === repTypeId) || null;
  }, [reps]);

  // Rep type IDs for this milestone
  const repTypeIds = useMemo(() => {
    return reps.map(r => r.repTypeId);
  }, [reps]);

  return {
    milestone,
    reps,
    repTypeIds,
    loading,
    error,
    getRepById
  };
};

/**
 * useAllMilestones Hook
 * 
 * Provides all milestone definitions.
 * Useful for navigation, progress tracking, or admin views.
 * 
 * Usage:
 *   const { milestones, loading, error, getMilestone } = useAllMilestones();
 */
export const useAllMilestones = () => {
  const { db } = useAppServices();
  
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) return;

    const fetchMilestones = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedMilestones = await repTypeService.getMilestones(db);
        setMilestones(fetchedMilestones);
      } catch (err) {
        console.error('[useAllMilestones] Error fetching milestones:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [db]);

  // Helper: Get milestone by number
  const getMilestone = useCallback((number) => {
    return milestones.find(m => m.number === number) || null;
  }, [milestones]);

  // Helper: Get milestone by ID
  const getMilestoneById = useCallback((id) => {
    return milestones.find(m => m.id === id) || null;
  }, [milestones]);

  return {
    milestones,
    loading,
    error,
    getMilestone,
    getMilestoneById
  };
};

/**
 * useCurrentMilestoneReps Hook
 * 
 * Convenience hook that combines user's current milestone with rep data.
 * Uses useDailyPlan to determine current milestone.
 * 
 * Usage:
 *   const { milestone, reps, loading, error } = useCurrentMilestoneReps();
 */
export const useCurrentMilestoneReps = () => {
  const { db, user } = useAppServices();
  
  const [currentMilestoneNumber, setCurrentMilestoneNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, _setError] = useState(null);
  
  // First, determine the user's current milestone from their progress
  // This would integrate with useDailyPlan once available
  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }
    
    // For now, default to milestone 1
    // TODO: Integrate with daily plan to get actual current milestone
    setCurrentMilestoneNumber(1);
    setLoading(false);
  }, [db, user]);
  
  // Use the milestone reps hook with the determined milestone
  const milestoneRepsData = useMilestoneReps(currentMilestoneNumber);
  
  return {
    ...milestoneRepsData,
    currentMilestoneNumber,
    loading: loading || milestoneRepsData.loading,
    error: error || milestoneRepsData.error
  };
};

export default useMilestoneReps;
