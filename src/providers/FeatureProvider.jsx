import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const FeatureContext = createContext();

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
};

export const FeatureProvider = ({ children, db }) => {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const featureDocRef = doc(db, 'config', 'features');
    
    const unsubscribe = onSnapshot(featureDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setFeatures(docSnapshot.data());
      } else {
        setFeatures({});
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
    
    if (typeof current === 'object' && current !== null) {
      newValue = { ...current, enabled };
    } else {
      // If it was a boolean or undefined, convert to object to support future fields
      newValue = { enabled, order: 999 }; 
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
    <FeatureContext.Provider value={{ features, toggleFeature, updateFeatureOrder, isFeatureEnabled, getFeatureOrder, loading }}>
      {children}
    </FeatureContext.Provider>
  );
};
