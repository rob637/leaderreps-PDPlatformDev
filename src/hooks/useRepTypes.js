import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { repTypeService } from '../services/repTypeService';

/**
 * useRepTypes Hook
 * 
 * Provides access to conditioning rep type data from Firestore.
 * Data is cached in the service layer (5 min TTL) for performance.
 * 
 * Usage:
 *   const { repTypes, categories, loading, error, getRepType, getRepTypesByCategory } = useRepTypes();
 * 
 * This hook replaces direct imports from repTaxonomy.js with Firestore-driven data.
 */
export const useRepTypes = (options = {}) => {
  const { db } = useAppServices();
  const { 
    includeCategories = true,
    includeQualityDimensions = false 
  } = options;

  // State
  const [repTypes, setRepTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [qualityDimensions, setQualityDimensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    if (!db) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch rep types (always needed)
        const fetchedRepTypes = await repTypeService.getAllRepTypes(db);
        setRepTypes(fetchedRepTypes);

        // Fetch categories if requested
        if (includeCategories) {
          const fetchedCategories = await repTypeService.getCategories(db);
          setCategories(fetchedCategories);
        }

        // Fetch quality dimensions if requested
        if (includeQualityDimensions) {
          const fetchedDimensions = await repTypeService.getQualityDimensions(db);
          setQualityDimensions(fetchedDimensions);
        }
      } catch (err) {
        console.error('[useRepTypes] Error fetching rep type data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db, includeCategories, includeQualityDimensions]);

  // Helper: Get single rep type by ID
  const getRepType = useCallback((repTypeId) => {
    return repTypes.find(rt => rt.id === repTypeId) || null;
  }, [repTypes]);

  // Helper: Get rep types for a category
  const getRepTypesByCategory = useCallback((categoryId) => {
    return repTypes.filter(rt => rt.categoryId === categoryId);
  }, [repTypes]);

  // Helper: Get category by ID
  const getCategory = useCallback((categoryId) => {
    return categories.find(c => c.id === categoryId) || null;
  }, [categories]);

  // Helper: Get quality dimensions for a rep type
  const getDimensionsForRepType = useCallback((repTypeId) => {
    return qualityDimensions.filter(qd => qd.repTypeId === repTypeId);
  }, [qualityDimensions]);

  // Grouped rep types by category (memoized)
  const repTypesByCategory = useMemo(() => {
    const grouped = {};
    categories.forEach(category => {
      grouped[category.id] = {
        category,
        repTypes: repTypes.filter(rt => rt.categoryId === category.id)
      };
    });
    return grouped;
  }, [repTypes, categories]);

  // Map for quick lookup (memoized)
  const repTypeMap = useMemo(() => {
    const map = new Map();
    repTypes.forEach(rt => map.set(rt.id, rt));
    return map;
  }, [repTypes]);

  return {
    // Data
    repTypes,
    categories,
    qualityDimensions,
    repTypesByCategory,
    repTypeMap,
    
    // State
    loading,
    error,
    
    // Helpers
    getRepType,
    getRepTypesByCategory,
    getCategory,
    getDimensionsForRepType
  };
};

/**
 * useCoachPrompt Hook
 * 
 * Fetches coach prompt for a specific rep type with fallback cascade.
 * Cascade: repTypeId-specific → categoryId-specific → default
 * 
 * Usage:
 *   const { prompt, loading, error, renderPrompt } = useCoachPrompt(repTypeId, categoryId);
 */
export const useCoachPrompt = (repTypeId, categoryId) => {
  const { db } = useAppServices();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) return;

    const fetchPrompt = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fetchedPrompt = await repTypeService.getCoachPrompt(db, repTypeId, categoryId);
        setPrompt(fetchedPrompt);
      } catch (err) {
        console.error('[useCoachPrompt] Error fetching prompt:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [db, repTypeId, categoryId]);

  // Helper to render prompt with context
  const renderPrompt = useCallback((context) => {
    if (!prompt?.template) return '';
    return repTypeService.renderPromptTemplate(prompt.template, context);
  }, [prompt]);

  return {
    prompt,
    loading,
    error,
    renderPrompt
  };
};

export default useRepTypes;
