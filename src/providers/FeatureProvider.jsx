import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteField, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const FeatureContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

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
    
    // Handle object structure vs legacy boolean
    const current = features[featureId];
    let newValue;
    
    // Calculate new enabled state if not provided
    const currentEnabled = (typeof current === 'object' && current !== null) ? current.enabled : !!current;
    const nextEnabled = enabled !== undefined ? enabled : !currentEnabled;
    
    if (typeof current === 'object' && current !== null) {
      newValue = { ...current, enabled: nextEnabled };
    } else {
      // If it was a boolean or undefined, convert to object to support future fields
      newValue = { enabled: nextEnabled, order: 999 }; 
    }
    
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

    // 1. Save current version to history (if it exists and has code)
    const current = features[featureId];
    if (current && current.code) {
        try {
            const historyRef = collection(db, 'config', 'features', 'widget_history');
            await addDoc(historyRef, {
                widgetId: featureId,
                code: current.code,
                name: current.name,
                timestamp: serverTimestamp(),
                savedBy: 'admin' // We could pass user email here if we had it in context
            });
        } catch (e) {
            console.warn("Failed to save widget history:", e);
            // Don't block the main save
        }
    }

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
    return !!feature;
  };

  const getFeatureOrder = (featureId) => {
    const feature = features[featureId];
    if (typeof feature === 'object' && feature !== null) {
      return feature.order ?? 999;
    }
    return 999;
  };

  return (
    <FeatureContext.Provider value={{ features, toggleFeature, updateFeatureOrder, isFeatureEnabled, getFeatureOrder, saveFeature, deleteFeature, loading }}>
      {children}
    </FeatureContext.Provider>
  );
};
