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
  const { db, auth } = firebaseServices;
  const [services, setServices] = useState(null);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [serviceData, setServiceData] = useState({
  });

  useEffect(() => {
    if (!userId || !db || !isAuthReady) {
      setServices(null);
      setIsLoadingServices(false);
      return;
    }

    console.log('[DataProvider] Initializing services for userId:', userId);
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
      setServiceData({
  });
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
    const PRIMARY_ADMIN_EMAILS = ['rob@sagecg.com', 'admin@leaderreps.com'];
    const adminEmails = resolvedMetadata.adminemails || [];
    const userEmail = user?.email?.toLowerCase();
    const isPrimaryAdmin = !!userEmail && PRIMARY_ADMIN_EMAILS.includes(userEmail);
    return (
      isPrimaryAdmin ||
      (!!userEmail && Array.isArray(adminEmails) && adminEmails.includes(userEmail))
    );
  }, [user, resolvedMetadata]);

  const hasPendingDailyPractice = useMemo(() => {
    const dailyData = dailyPracticeHook.dailyPracticeData;
    const todayStr = timeService.getISOString().split('T')[0];
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
      if (services) {
        services.cleanup();
        setServices(null);
      }
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [auth, services]);

  const callSecureGeminiAPI = useCallback(
    async (payload) => {
      // Use the Cloud Function URL for the Gemini proxy
      // DEV: leaderreps-pd-platform, TEST: leaderreps-test
      const GEMINI_PROXY_URL = import.meta.env.VITE_FIREBASE_PROJECT_ID === 'leaderreps-test'
        ? 'https://geminiproxy-jxhqfhns5a-uc.a.run.app'
        : 'https://geminiproxy-jxhqfhns5a-uc.a.run.app';

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
        throw new Error(
          `Failed to communicate with the AI Rep Coach: ${error.message}`
        );
      }
    },
    [hasGeminiKey]
  );

  const appServicesValue = useMemo(() => {
    const geminiModel = resolvedMetadata.GEMINI_MODEL || 'gemini-1.5-flash';
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
      navigate,
      user,
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
      READING_CATALOG: (() => {
        const catalog = resolvedMetadata.READING_CATALOG || EMPTY_OBJECT_CATALOG;
        console.log('📚 [DataProvider] READING_CATALOG being provided to components:', {
          hasCatalog: !!resolvedMetadata.READING_CATALOG,
          hasItems: !!catalog.items,
          itemsType: typeof catalog.items,
          itemsKeys: catalog.items && typeof catalog.items === 'object' ? Object.keys(catalog.items) : [],
          itemsLength: catalog.items && typeof catalog.items === 'object' ? Object.keys(catalog.items).length : 0,
          fullCatalog: catalog
        });
        return catalog;
      })(),
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
    navigate,
    user,
    userId,
    isAdmin,
    isAuthReady,
    isLoadingServices,
    hasPendingDailyPractice,
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
