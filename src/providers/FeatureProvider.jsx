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
    await setDoc(featureDocRef, { [featureId]: enabled }, { merge: true });
  };

  const isFeatureEnabled = (featureId) => {
    return !!features[featureId];
  };

  return (
    <FeatureContext.Provider value={{ features, toggleFeature, isFeatureEnabled, loading }}>
      {children}
    </FeatureContext.Provider>
  );
};
