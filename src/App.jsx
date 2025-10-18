import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore'; 
import { allBooks, SECRET_SIGNUP_CODE, IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT } from './data/Constants'; 
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';

// FIX: Importing API helpers instead of re-declaring them.
import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers'; 

// Import Screen Components
import DashboardScreen, { QuickStartScreen, AppSettingsScreen } from './components/screens/Dashboard';
import ProfDevPlanScreen from './components/screens/DevPlan';
import Labs from './components/screens/Labs';
import NavSidebar from './components/shared/UI';

// Alias Labs to the old name if you used it elsewhere
const CoachingLabScreen = Labs;

// --- CONTEXT AND API CONFIG ---
const AppServiceContext = createContext(null);
export const useAppServices = () => useContext(AppServiceContext);

// Global App ID (Used for Firestore pathing)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- DEBUG MODE FLAG ---
// Set this to TRUE to bypass login and use a mock user for faster debugging.
const DEBUG_MODE = true; 
// -------------------------
// --- END CONTEXT AND API CONFIG ---


/**
 * Data Provider Component (Wraps all data hooks and provides context)
 */
const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
    const { db } = firebaseServices;

    // 1. Data Hooks
    const pdp = usePDPData(db, userId, isAuthReady);
    const commitment = useCommitmentData(db, userId, isAuthReady);
    const planning = usePlanningData(db, userId, isAuthReady);

    // 2. Aggregate Loading State
    const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
    const error = pdp.error || commitment.error || planning.error;

    // 3. Memoized Service Context Value
    const appServices = useMemo(() => ({
        // Core Navigation & User State
        navigate,
        user,
        // Database State and Functions
        ...firebaseServices,
        userId,
        isAuthReady,
        // Data Update Functions (exposed for all components)
        updatePdpData: pdp.updatePdpData,
        saveNewPlan: pdp.saveNewPlan,
        updateCommitmentData: commitment.updateCommitmentData,
        updatePlanningData: planning.updatePlanningData,
        // Data Objects (exposed for consumption)
        pdpData: pdp.pdpData,
        commitmentData: commitment.commitmentData,
        planningData: planning.planningData,
        // Loading/Error State
        isLoading,
        error,
        appId,
        IconMap, // Provide icon map for lookups
        // Add API helpers to context for use in screens (needed for Gemini calls)
        callSecureGeminiAPI, 
        hasGeminiKey,
        GEMINI_MODEL, // Added for completeness, although API is called via helper
        API_KEY,      // Added for completeness, although API is called via helper
    }), [
        navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, 
        pdp, commitment, planning
    ]);

    if (!isAuthReady) return <></>; 
    
    return (
        <AppServiceContext.Provider value={appServices}>
            {children}
        </AppServiceContext.Provider>
    );
};


/**
 * Main Application Component (Handles Auth and Routing)
 */
const App = ({initialState}) => {
    // FIX: Removed duplicate function declarations from this scope
    const [user, setUser] = useState(DEBUG_MODE ? { name: 'Debugger', userId: 'mock-debugger-123', email: 'debug@leaderreps.com' } : null);
    const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
    const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
    const [userId, setUserId] = useState(DEBUG_MODE ? 'mock-debugger-123' : null);
    const [isAuthReady, setIsAuthReady] = useState(DEBUG_MODE);
    const [navParams, setNavParams] = useState(initialState?.params || {});
    const [authRequired, setAuthRequired] = useState(!DEBUG_MODE);


    const navigate = useCallback((screen, params = {}) => {
        setNavParams(params);
        setCurrentScreen(screen);
    }, []);


    // 1. Firebase Initialization and Auth Logic
    useEffect(() => {
        let app, firestore, authentication;
        if (DEBUG_MODE) {
            try {
                // Mock Firebase config for DEBUG_MODE
                const firebaseConfig = { apiKey: 'mock', authDomain: 'mock', projectId: 'mock' };
                app = initializeApp(firebaseConfig);
                firestore = getFirestore(app);
                authentication = getAuth(app);
                setFirebaseServices({ db: firestore, auth: authentication });
                return;
            } catch(e) {
                if (e.name !== 'FirebaseError' || !e.message.includes('already been initialized')) {
                   console.warn("Firebase already initialized in DEBUG mode:", e);
                }
                const existingApp = getApp();
                firestore = getFirestore(existingApp);
                authentication = getAuth(existingApp);
                setFirebaseServices({ db: firestore, auth: authentication });
                return;
            }
        }


        try {
            let firebaseConfig = {};
            if (typeof __firebase_config !== 'undefined') {
                let configString = String(__firebase_config).trim();
                
                // FIX: Robustly clean config string before JSON.parse
                if (configString.startsWith("'") && configString.endsWith("'")) {
                    configString = configString.substring(1, configString.length - 1);
                }
                configString = configString.replace(/'/g, '"');
                firebaseConfig = JSON.parse(configString);
            }
            
            app = initializeApp(firebaseConfig);
            firestore = getFirestore(app);
            authentication = getAuth(app);
            
            setLogLevel('debug');

            setFirebaseServices({ db: firestore, auth: authentication });

            const unsubscribe = onAuthStateChanged(authentication, (currentUser) => {
                if (currentUser) {
                    const currentUid = currentUser.uid;
                    setUserId(currentUid);
                    setUser({ name: currentUser.email || 'Canvas User', userId: currentUid }); 
                    setAuthRequired(false); 
                } else {
                    setUser(null);
                    setUserId(null);
                    setAuthRequired(true);
                }
                setIsAuthReady(true);
            });
            
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                 signInWithCustomToken(authentication, __initial_auth_token)
                    .catch(error => console.error("Canvas Token Auth failed, waiting for user login:", error));
            }

            return () => unsubscribe();

        } catch (e) {
            if (e.name !== 'FirebaseError' || !e.message.includes('already been initialized')) {
                console.error("Firebase setup failed:", e);
            }
            setIsAuthReady(true);
        }
    }, [DEBUG_MODE]); 

    
    // --- Authentication Router Placeholder ---
    
    if (authRequired || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p>Authentication Required (DEBUG_MODE is OFF)</p>
            </div>
        );
    }
    // ---------------------------------------------------------------------------------------------

    
    // Check if auth is ready before rendering DataProvider
    if (!isAuthReady) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Initializing Application...</p>
                </div>
            </div>
        );
    }

    // 4. Render Data Provider and Application (The mock definitions of the hooks are removed, relying on the import)
    // NOTE: If your other modules are not yet complete, you will need to complete them, as this file relies on all imports being valid functions/components.
    
    return (
        <DataProvider firebaseServices={firebaseServices} userId={userId} isAuthReady={isAuthReady} navigate={navigate} user={user}>
            <AppContent 
                currentScreen={currentScreen} 
                setCurrentScreen={navigate} 
                user={user} 
                navParams={navParams}
            />
        </DataProvider>
    );
}

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams }) => {
    // FIX: The constants file has the allBooks data, so we must import and use it.
    // The previous error was due to placeholder functions not being removed.
    // Assuming required imports from './data/Constants' were correctly placed above.

    return (
        <div className="min-h-screen flex bg-gray-100 font-sans antialiased">
            <NavSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} user={user} />
            <main className='flex-1 overflow-y-auto p-0'>
                <ScreenRouter currentScreen={currentScreen} navParams={navParams} />
            </main>
        </div>
    );
};

const ScreenRouter = ({ currentScreen, navParams }) => {
    // NOTE: All screens must be imported successfully for this switch to work.
    switch (currentScreen) {
        case 'prof-dev-plan':
            return <ProfDevPlanScreen />;
        case 'daily-practice':
            return <DailyPracticeScreen initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />;
        case 'coaching-lab':
            return <CoachingLabScreen />;
        case 'planning-hub':
            return <PlanningHubScreen />;
        case 'business-readings':
            return <BusinessReadingsScreen />;
        case 'quick-start-accelerator':
            return <QuickStartScreen />;
        case 'app-settings':
            return <AppSettingsScreen />;
        case 'dashboard':
        default:
            return <DashboardScreen />;
    }
};

export default App;
