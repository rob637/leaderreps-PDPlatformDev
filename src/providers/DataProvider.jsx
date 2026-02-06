// src/providers/DataProvider.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppServiceContext from '../services/AppServiceContext.js';
import { createAppServices } from '../services/createAppServices.js';
import { timeService } from '../services/timeService.js';

const resolveGlobalMetadata = (meta) => {
  return meta && typeof meta === 'object' ? meta : {};
};

// Constant fallback objects to prevent recreation on every render
const EMPTY_ARRAY_CATALOG = { items: [] };
const EMPTY_OBJECT_CATALOG = { items: {} };
const EMPTY_OBJECT = {};

const DataProvider = ({
  children,
  firebaseServices,
  userId,
  isAuthReady,
  navigate,
  user,
}) => {
  const { db, auth, storage } = firebaseServices;
  const [services, setServices] = useState(null);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  // Initialize with null values so === null checks work correctly
  const [serviceData, setServiceData] = useState({
    userProfile: null,
    developmentPlanData: null,
    dailyPracticeData: null,
    strategicContentData: null,
    membershipData: null,
    globalMetadata: null,
  });

  useEffect(() => {
    if (!userId || !db || !isAuthReady) {
      setServices(null);
      setIsLoadingServices(false);
      return;
    }

    setIsLoadingServices(true);
    let createdServices = null;
    try {
      createdServices = createAppServices(db, userId);
      createdServices.setOnChange((data) => {
        setServiceData(data);
        if (
          data.globalMetadata !== null ||
          data.dailyPracticeData !== null ||
          data.developmentPlanData !== null ||
          data.membershipData !== null
        ) {
          setIsLoadingServices(false);
        }
      });
      setServices(createdServices);
      // Don't reset serviceData here - let the onChange callback populate it
    } catch (error) {
      console.error('[DataProvider] Error creating services:', error);
      setServices(null);
      setIsLoadingServices(false);
    }

    return () => {
      if (createdServices) {
        createdServices.cleanup();
      }
    };
  }, [userId, db, isAuthReady]);

  const devPlanHook = useMemo(
    () =>
      services
        ? {
            developmentPlanData: serviceData.developmentPlanData,
            updateDevelopmentPlanData: services.updateDevelopmentPlanData,
            isLoading: false,
            error: null,
          }
        : {
            developmentPlanData: null,
            updateDevelopmentPlanData: null,
            isLoading: isLoadingServices,
            error: null,
          },
    [services, serviceData.developmentPlanData, isLoadingServices]
  );

  const dailyPracticeHook = useMemo(
    () =>
      services
        ? {
            dailyPracticeData: serviceData.dailyPracticeData,
            updateDailyPracticeData: services.updateDailyPracticeData,
            isLoading: false,
            error: null,
          }
        : {
            dailyPracticeData: null,
            updateDailyPracticeData: null,
            isLoading: isLoadingServices,
            error: null,
          },
    [services, serviceData.dailyPracticeData, isLoadingServices]
  );

  const strategicContentHook = useMemo(
    () =>
      services
        ? {
            strategicContentData: serviceData.strategicContentData,
            updateStrategicContentData: services.updateStrategicContentData,
            isLoading: false,
            error: null,
          }
        : {
            strategicContentData: null,
            updateStrategicContentData: null,
            isLoading: isLoadingServices,
            error: null,
          },
    [services, serviceData.strategicContentData, isLoadingServices]
  );

  const membershipHook = useMemo(
    () =>
      services
        ? {
            membershipData: serviceData.membershipData,
            updateMembershipData: services.updateMembershipData,
            isLoading: false,
            error: null,
          }
        : {
            membershipData: null,
            updateMembershipData: null,
            isLoading: isLoadingServices,
            error: null,
          },
    [services, serviceData.membershipData, isLoadingServices]
  );

  const globalHook = useMemo(
    () =>
      services
        ? {
            metadata: serviceData.globalMetadata,
            isLoading: false,
            error: null,
          }
        : { metadata: null, isLoading: isLoadingServices, error: null },
    [services, serviceData.globalMetadata, isLoadingServices]
  );

  const resolvedMetadata = useMemo(
    () => resolveGlobalMetadata(globalHook.metadata),
    [globalHook.metadata]
  );

  const isAdmin = useMemo(() => {
    const adminEmails = resolvedMetadata.adminemails || [];
    const userEmail = user?.email?.toLowerCase();
    // Case-insensitive check against dynamic adminemails from Firestore
    return (
      !!userEmail && 
      Array.isArray(adminEmails) && 
      adminEmails.some(email => email.toLowerCase() === userEmail)
    );
  }, [user, resolvedMetadata]);

  const hasPendingDailyPractice = useMemo(() => {
    const dailyData = dailyPracticeHook.dailyPracticeData;
    const todayStr = timeService.getTodayStr();
    const hasPendingTargetRep =
      dailyData?.dailyTargetRepStatus === 'Pending' &&
      dailyData?.dailyTargetRepDate === todayStr &&
      !!dailyData?.dailyTargetRepId;
    const hasPendingAdditionalReps = (dailyData?.activeCommitments || []).some(
      (c) => c.status === 'Pending'
    );
    return hasPendingTargetRep || hasPendingAdditionalReps;
  }, [dailyPracticeHook.dailyPracticeData]);

  const apiKey = useMemo(() => {
    return (
      resolvedMetadata.API_KEY ||
      (typeof window.__GEMINI_API_KEY !== 'undefined'
        ? window.__GEMINI_API_KEY
        : '')
    );
  }, [resolvedMetadata.API_KEY]);

  const hasGeminiKey = useCallback(() => !!apiKey, [apiKey]);

  const logout = useCallback(async () => {
    try {
      // Clear local storage navigation state
      localStorage.removeItem('lastScreen');
      localStorage.removeItem('lastNavParams');
      
      // Clear AI Coach session authentication
      sessionStorage.removeItem('ai-coach-authenticated');
      // Dispatch event so RepFloatingButton updates immediately
      window.dispatchEvent(new CustomEvent('ai-coach-logout'));
      
      // Cleanup services first
      if (services) {
        try {
          services.cleanup();
        } catch (cleanupErr) {
          console.warn('Service cleanup warning:', cleanupErr);
        }
        setServices(null);
      }
      
      // Sign out from Firebase
      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force page reload as fallback to clear state
      window.location.reload();
    }
  }, [auth, services]);

  const callSecureGeminiAPI = useCallback(
    async (payload) => {
      // Use the Cloud Function URL for the Gemini proxy
      // Dynamically determine based on environment
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const GEMINI_PROXY_URL = `https://us-central1-${projectId}.cloudfunctions.net/geminiProxy`;

      try {
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };

        const response = await fetch(GEMINI_PROXY_URL, requestOptions);

        if (!response.ok) {
          let errorBody = 'Could not retrieve error details.';
          try {
            errorBody = await response.text();
          } catch (_) {
            // ignore if reading response body fails
          }
          console.error(
            `[callSecureGeminiAPI] Backend call failed with status ${response.status}:`,
            errorBody
          );
          throw new Error(
            `The AI Rep Coach backend returned an error (Status ${response.status}).`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(
          '[callSecureGeminiAPI] Error during fetch to backend:',
          error
        );
        if (error.message === 'Failed to fetch') {
          throw new Error(
            'Failed to communicate with the AI Rep Coach. This is likely a network or security policy issue blocking the connection.'
          );
        }
        throw new Error(
          `Failed to communicate with the AI Rep Coach: ${error.message}`
        );
      }
    },
    []
  );

  const appServicesValue = useMemo(() => {
    const geminiModel = resolvedMetadata.GEMINI_MODEL || 'gemini-2.0-flash';
    const convertedFeatureFlags = Object.fromEntries(
      Object.entries(resolvedMetadata.featureFlags || {}).map(
        ([key, value]) => [
          key,
          value === true || value === 'true' || value === 1,
        ]
      )
    );

    return {
      // Core Services
      db,
      auth,
      storage,
      navigate,
      // Merge Auth user with Firestore user profile to provide cohortId and other profile data
      user: serviceData.userProfile ? { ...user, ...serviceData.userProfile } : user,
      userId,
      isAdmin,
      isAuthReady,
      isLoading: isLoadingServices,
      hasPendingDailyPractice,
      logout,

      // Feature Flags
      featureFlags: convertedFeatureFlags,

      // Data Hooks
      ...devPlanHook,
      ...dailyPracticeHook,
      ...strategicContentHook,
      ...membershipHook,
      ...globalHook,
      globalMetadata: resolvedMetadata, // Explicitly expose globalMetadata for components that expect it

      // Catalogs (from resolvedMetadata)
      SKILL_CATALOG: resolvedMetadata.SKILL_CATALOG || EMPTY_ARRAY_CATALOG,
      COURSE_LIBRARY: resolvedMetadata.COURSE_LIBRARY || EMPTY_ARRAY_CATALOG,
      READING_CATALOG: resolvedMetadata.READING_CATALOG || EMPTY_OBJECT_CATALOG,
      RESOURCE_LIBRARY: resolvedMetadata.RESOURCE_LIBRARY || EMPTY_OBJECT,
      VIDEO_CATALOG: resolvedMetadata.VIDEO_CATALOG || EMPTY_ARRAY_CATALOG,
      SCENARIO_CATALOG: resolvedMetadata.SCENARIO_CATALOG || EMPTY_ARRAY_CATALOG,
      LEADERSHIP_TIERS: resolvedMetadata.LEADERSHIP_TIERS || EMPTY_OBJECT,
      IconMap: resolvedMetadata.IconMap || EMPTY_OBJECT,

      // Gemini API
      apiKey,
      geminiModel,
      hasGeminiKey,
      callSecureGeminiAPI,
    };
  }, [
    db,
    auth,
    storage,
    navigate,
    user,
    userId,
    isAdmin,
    isAuthReady,
    isLoadingServices,
    hasPendingDailyPractice,
    serviceData.userProfile,
    logout,
    resolvedMetadata,
    devPlanHook,
    dailyPracticeHook,
    strategicContentHook,
    membershipHook,
    globalHook,
    apiKey,
    hasGeminiKey,
    callSecureGeminiAPI,
  ]);

  return (
    <AppServiceContext.Provider value={appServicesValue}>
      {children}
    </AppServiceContext.Provider>
  );
};

export default DataProvider;
