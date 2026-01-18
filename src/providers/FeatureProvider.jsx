import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { FEATURE_METADATA } from '../config/widgetTemplates';

const FeatureContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

/**
 * FeatureProvider - Manages feature flags (enabled/disabled, order) for widgets
 * 
 * NOTE: Widget code is now managed ONLY in widgetTemplates.js (developer-controlled).
 * This provider only handles:
 * - Feature enabled/disabled state
 * - Feature display order
 */
export const FeatureProvider = ({ children, db }) => {
  const [features, setFeatures] = useState(() => {
    // Load from cache initially (Stale-While-Revalidate)
    try {
      const cached = localStorage.getItem('cached_features');
      return cached ? JSON.parse(cached) : {};
    } catch (e) {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const featureDocRef = doc(db, 'config', 'features');
    
    const unsubscribe = onSnapshot(featureDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setFeatures(data);
        // Update cache
        localStorage.setItem('cached_features', JSON.stringify(data));
      } else {
        setFeatures({});
        localStorage.removeItem('cached_features');
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching features:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const toggleFeature = async (featureId, enabled) => {
    if (!db) return;
    const featureDocRef = doc(db, 'config', 'features');
    
    const current = features[featureId];
    const currentEnabled = (typeof current === 'object' && current !== null) ? current.enabled : !!current;
    const nextEnabled = enabled !== undefined ? enabled : !currentEnabled;
    
    const newValue = (typeof current === 'object' && current !== null)
      ? { ...current, enabled: nextEnabled }
      : { enabled: nextEnabled, order: 999 };
    
    await setDoc(featureDocRef, { [featureId]: newValue }, { merge: true });
  };

  const updateFeatureOrder = async (orderedIds) => {
    if (!db) return;
    const featureDocRef = doc(db, 'config', 'features');
    
    const updates = {};
    orderedIds.forEach((id, index) => {
      const current = features[id];
      const isEnabled = (typeof current === 'object' && current !== null) ? current.enabled : !!current;
      updates[id] = { enabled: isEnabled, order: index };
    });

    await setDoc(featureDocRef, updates, { merge: true });
  };

  const saveFeature = async (featureId, data) => {
    if (!db) return;
    const featureDocRef = doc(db, 'config', 'features');
    await setDoc(featureDocRef, { [featureId]: data }, { merge: true });
  };

  const deleteFeature = async (featureId) => {
    if (!db) return;
    const featureDocRef = doc(db, 'config', 'features');
    await updateDoc(featureDocRef, { [featureId]: deleteField() });
  };

  const isFeatureEnabled = (featureId) => {
    const feature = features[featureId];
    if (typeof feature === 'object' && feature !== null) {
      return feature.enabled;
    }
    if (feature !== undefined) {
      return !!feature;
    }
    // Fallback: If not in DB, check metadata. Default to TRUE if it exists in metadata.
    return !!FEATURE_METADATA[featureId];
  };

  const getFeatureOrder = (featureId) => {
    const feature = features[featureId];
    if (typeof feature === 'object' && feature !== null) {
      return feature.order ?? 999;
    }
    return 999;
  };

  // Get widget help text (user-facing description)
  const getWidgetHelpText = (featureId) => {
    const feature = features[featureId];
    if (typeof feature === 'object' && feature !== null) {
      return feature.helpText || null;
    }
    return null;
  };

  return (
    <FeatureContext.Provider value={{ 
      features, 
      toggleFeature, 
      updateFeatureOrder, 
      saveFeature,
      deleteFeature,
      isFeatureEnabled, 
      getFeatureOrder,
      getWidgetHelpText,
      loading 
    }}>
      {children}
    </FeatureContext.Provider>
  );
};
