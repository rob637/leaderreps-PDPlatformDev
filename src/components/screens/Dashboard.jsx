// src/components/screens/Dashboard.jsx (MODIFIED SECTIONS)

// ... (Imports section remains the same)

// --- NEW TEST UTILS MODAL ---
const TestUtilsModal = ({ onDeletePlan, onClose }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
                    ⚙️ Test Utilities (Danger Zone)
                </h2>
                <p className="text-sm text-red-600 mb-4">
                    WARNING: These actions cannot be undone and are for testing only.
                </p>
                
                {confirmDelete ? (
                    <>
                        <p className="text-base font-semibold mb-3">
                            Are you sure? This will delete all plan and daily rep progress.
                        </p>
                        <Button onClick={onDeletePlan} variant="danger" size="md" className="w-full mb-2">
                            <Trash2 className="w-4 h-4 mr-2" /> Yes, Delete Plan & Reset
                        </Button>
                        <Button onClick={() => setConfirmDelete(false)} variant="outline" size="sm" className="w-full">
                            Cancel
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => setConfirmDelete(true)} variant="secondary" size="md" className="w-full">
                        Delete Plan and Start Over
                    </Button>
                )}
                
                <div className="pt-4 mt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                    <Button onClick={onClose} variant="ghost" size="sm" className="w-full">Close</Button>
                </div>
            </div>
        </div>
    );
};


const Dashboard = ({ navigate }) => {
  // ... (useAppServices and useDashboard hooks remain the same)
  const { updateDevelopmentPlanData, updateDailyPracticeData, userId } = useAppServices();

  // Local UI state
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  // ... (other state remains the same)
  const [showAnchorEditor, setShowAnchorEditor] = useState(false);
  const [showTestUtils, setShowTestUtils] = useState(false); // NEW STATE for Test Utils

  // ... (Data Lookups remain the same)

  // --- NEW HANDLER: Reset Plan ---
  const handleDeletePlanAndReset = useCallback(async () => {
    console.log('[Dashboard] Executing Delete Plan and Reset...');
    
    // 1. Delete Development Plan
    await updateDevelopmentPlanData({
        currentPlan: null,
        focusAreas: null,
        cycle: 0,
    }, { merge: true });

    // 2. Reset Daily Practice Essentials
    await updateDailyPracticeData({
        dailytargetrepid: deleteField(),
        dailytargetrepstatus: 'Pending',
        dailytargetrepdate: deleteField(),
        streakcount: 0,
        streakcoins: 0,
        // Reset Anchors to trigger the FAB/System Task
        identityanchor: '',
        habitanchor: '',
        whystatement: '',
    });

    setShowTestUtils(false);
    navigate('dashboard'); // Force re-render/re-fetch
    triggerCelebration('Plan and progress reset. Start fresh!');
  }, [updateDevelopmentPlanData, updateDailyPracticeData, navigate]);

  // --- UX ENHANCEMENT: Anchor FAB Logic ---
  const isFullyDefined = !!identityStatement && !!habitAnchor && !!whyStatement;
  
  const handleOpenAnchorEditor = () => setShowAnchorEditor(true);
  
  // ... (other handlers remain the same)

  // --- Augmented Task List (updated to remove separate anchor links) ---
  const augmentedOtherTasks = useMemo(() => {
    const newTasks = [];
    
    if (focusArea === 'Not Set') {
      newTasks.push({
        id: 'system-dev-plan',
        text: 'Start your Development Plan',
        completed: false,
        isSystem: true,
        onClick: () => navigate('development-plan') 
      });
    }
    
    // Only show a system task if the anchors FAB is NOT showing
    if (!isFullyDefined) {
      const definedCount = [identityStatement, habitAnchor, whyStatement].filter(Boolean).length;
      newTasks.push({
        id: 'system-anchors',
        text: `Define your Leadership Anchors (${definedCount}/3 Set) - Click to Edit`,
        completed: false,
        isSystem: true,
        onClick: handleOpenAnchorEditor // Links to the unified editor
      });
    }

    return [...newTasks, ...originalOtherTasks];
  }, [
    originalOtherTasks, 
    focusArea, 
    identityStatement, 
    habitAnchor, 
    whyStatement, 
    navigate,
    isFullyDefined
  ]);


  // ... (Loading Guard remains the same)

  // --- RENDER ---
  return (
    <div className="min-h-screen" style={{ background: COLORS.BG }}>
      {/* ... (Header and Reminders remain the same) ... */}

      {/* --- NEW: Floating Anchor Button (FAB) --- */}
      {!isFullyDefined && (
        <button 
          onClick={handleOpenAnchorEditor}
          className="fixed bottom-6 right-6 z-50 flex items-center px-6 py-3 rounded-full font-bold text-white shadow-xl animate-bounce transition-all duration-300 hover:scale-[1.02]"
          style={{ background: COLORS.PURPLE, boxShadow: `0 8px 15px ${COLORS.PURPLE}50` }}
        >
          <Anchor className="w-5 h-5 mr-3 animate-pulse" />
          Define Your Anchors!
        </button>
      )}

      {/* ... (60/40 Layout Grid) ... */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* === 60% "FOCUS" COLUMN (LEFT) === */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Dev Plan Progress / Get Started */}
            {focusArea === 'Not Set' ? (
              <GetStartedCard onNavigate={navigate} />
            ) : (
              <DevPlanProgressLink
                progress={devPlanProgress}
                focusArea={focusArea}
                onNavigate={() => navigate('development-plan')}
              />
            )}

            {/* 2. Today's Focus Rep (UNCHANGED) */}
            {focusArea !== 'Not Set' && (
              <Card title="🎯 Today's Focus Rep" accent='ORANGE'>
                {/* ... (Rep details JSX) ... */}
                {identityStatement && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
                      🎯 TODAY'S FOCUS:
                    </p>
                    <p className="text-sm italic font-medium" style={{ color: COLORS.TEXT }}>
                      "I am the kind of leader who {identityStatement}"
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* 3. Leadership Anchors Card (UNIFIED) */}
            <LeadershipAnchorsCard
                identityStatement={identityStatement}
                habitAnchor={habitAnchor}
                whyStatement={whyStatement}
                onDefine={handleOpenAnchorEditor} // Use the unified handler
                onEdit={handleOpenAnchorEditor}   // Use the unified handler
            />

            {/* 4. Accountability Pod */}
            <SocialPodCard
              podMembers={dailyPracticeData?.podMembers || []}
              activityFeed={dailyPracticeData?.podActivity || []}
              onSendMessage={(msg) => console.log('Send message:', msg)}
              onFindPod={handleFindPod}
            />

            {/* 5. AI Coach */}
            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />

          </div>

          {/* === 40% "ACTION" COLUMN (RIGHT) === */}
          <div className="space-y-6">

            {/* 1. AM/PM Bookends */}
            <DynamicBookendContainer
              morningProps={{
                // ... (morningProps remain the same, augmentedOtherTasks is passed)
              }}
              eveningProps={{
                // ... (eveningProps remain the same)
              }}
              dailyPracticeData={dailyPracticeData}
            />

            {/* 2. NEW: Test Utilities Button */}
            <div className="text-center">
                <Button onClick={() => setShowTestUtils(true)} variant="nav-back" size="sm" className="w-full">
                    <Shield className="w-4 h-4 mr-2 text-red-500" /> Test Utilities (Admin)
                </Button>
            </div>

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* UNIFIED Anchor Editor Modal */}
      {showAnchorEditor && (
        <UnifiedAnchorEditorModal
          // ... (props remain the same)
          onSave={handleSaveAllAnchors}
          onClose={() => setShowAnchorEditor(false)}
        />
      )}
      
      {/* NEW: Test Utilities Modal */}
      {showTestUtils && (
        <TestUtilsModal
            onDeletePlan={handleDeletePlanAndReset}
            onClose={() => setShowTestUtils(false)}
        />
      )}
      
      {/* ... (Pod Modal and Bonus Exercise Modal remain the same) ... */}
      
      <SaveIndicator show={showSaveConfirmation} message={saveMessage} />
    </div>
  );
};

export default Dashboard;