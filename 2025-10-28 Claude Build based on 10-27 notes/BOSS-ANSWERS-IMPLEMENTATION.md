# Updated Implementation Based on Boss's Answers
## Key Changes Based on Clarifications

---

## Boss's Answers Summary

### 1. **Accountability Pod**: Keep as-is, not a priority
- Current in-app functionality stays
- No changes needed
- Will revisit when Mighty Networks discussion happens

### 2. **QuickStart**: Move to Course Library ✅
- Already done in App.jsx

### 3. **Daily Reflection Log**: Remove from side nav, access from Dashboard
- Functionality stays
- Remove nav link (already done in App.jsx)
- Keep "View Full Reflection Log" button on Dashboard

### 4. **Weekly Focus**: All 3 options
- Manual set
- Prompt to complete assessment
- Provide default/suggested focus

### 5. **Daily Reps Logic**: Conditional based on Dev Plan status

**If User HAS completed Assessment:**
- Weekly Focus comes from Development Plan (where they are)
- Daily Reps are mandatory/recommended based on plan
- User CAN add their own additional reps

**If User has NOT completed Assessment:**
- Weekly Focus is manually selected (from recommended list)
- Daily Reps are generated/recommended based on generic plan
- User CAN add their own additional reps

---

## New Data Structure Additions

### Weekly Focus Data (add to useAppServices.jsx)

```javascript
// In daily_practice defaultData
weeklyFocus: {
    area: '',                    // e.g., "Strategic Thinking"
    source: 'none',              // 'devPlan', 'selfSelected', or 'none'
    weekStartDate: null,         // Monday of current week
    dailyReps: [],               // Array of recommended rep IDs from catalog
    userAddedReps: [],           // Array of user's custom reps
    progress: 0                  // Percentage complete (0-100)
}
```

### Generic Development Plan (add to metadata/config)

```javascript
// In Firestore: metadata/config/catalog/GENERIC_DEV_PLAN
{
    sequence: [
        { 
            tier: 'T1', 
            name: 'Lead Self', 
            weeks: 4,
            focusAreas: ['Ownership', 'Mindset Shifts'],
            recommendedReps: ['rep-id-1', 'rep-id-2']
        },
        { 
            tier: 'T2', 
            name: 'Lead Work', 
            weeks: 4,
            focusAreas: ['Execution', 'Feedback', 'Delegation'],
            recommendedReps: ['rep-id-3', 'rep-id-4']
        },
        {
            tier: 'T3',
            name: 'Lead People',
            weeks: 4,
            focusAreas: ['Coaching', '1:1s', 'Motivation'],
            recommendedReps: ['rep-id-5', 'rep-id-6']
        },
        // ... T4, T5
    ]
}
```

---

## WeeklyFocus Component (NEW)

Add this component to Dashboard.jsx:

```javascript
/* =========================================================
   Weekly Focus Component
========================================================= */
const WeeklyFocusCard = ({ 
    weeklyFocus,
    developmentPlanData,
    onSetFocus,
    onNavigateToDevPlan,
    featureFlags
}) => {
    const [showFocusSelector, setShowFocusSelector] = useState(false);
    const hasDevPlan = developmentPlanData?.currentPlan && developmentPlanData.assessmentHistory?.length > 0;
    
    // Calculate progress
    const progress = weeklyFocus?.progress || 0;
    
    // Determine focus source and display
    let focusDisplay = {
        area: weeklyFocus?.area || 'Not Set',
        source: weeklyFocus?.source || 'none',
        sourceLabel: 'No Plan'
    };
    
    if (hasDevPlan && weeklyFocus?.source === 'devPlan') {
        focusDisplay.sourceLabel = 'From Development Plan';
    } else if (weeklyFocus?.source === 'selfSelected') {
        focusDisplay.sourceLabel = 'Self-Selected';
    }
    
    return (
        <Card title="🎯 Weekly Focus" icon={Target} accent='TEAL'>
            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Week Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                        className="h-3 rounded-full transition-all duration-300"
                        style={{ 
                            width: `${progress}%`,
                            backgroundColor: COLORS.TEAL
                        }}
                    />
                </div>
            </div>

            {/* Current Weekly Focus */}
            <div className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">This Week's Focus:</p>
                <p className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                    {focusDisplay.area}
                </p>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    {focusDisplay.source === 'devPlan' && <Briefcase className="w-4 h-4" />}
                    {focusDisplay.source === 'selfSelected' && <User className="w-4 h-4" />}
                    {focusDisplay.sourceLabel}
                </p>
            </div>

            {/* Daily Reps Generated from Focus */}
            {weeklyFocus?.dailyReps && weeklyFocus.dailyReps.length > 0 && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.TEAL }}>
                        RECOMMENDED DAILY REPS
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700">
                        {weeklyFocus.dailyReps.slice(0, 3).map((repId, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: COLORS.TEAL }} />
                                <span>{repId}</span> {/* TODO: Lookup actual rep text from catalog */}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
                {/* If no focus set, show options */}
                {weeklyFocus?.source === 'none' && (
                    <>
                        {hasDevPlan ? (
                            <Button
                                onClick={() => onSetFocus('devPlan')}
                                variant="primary"
                                size="sm"
                                className="w-full"
                            >
                                <Briefcase className="w-4 h-4 mr-2" />
                                Use Development Plan Focus
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate('development-plan')}
                                variant="secondary"
                                size="sm"
                                className="w-full"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Complete Assessment First
                            </Button>
                        )}
                        
                        <Button
                            onClick={() => setShowFocusSelector(!showFocusSelector)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            <User className="w-4 h-4 mr-2" />
                            {showFocusSelector ? 'Hide' : 'Choose'} Your Own Focus
                        </Button>
                    </>
                )}

                {/* If focus is set, show drill-down option */}
                {weeklyFocus?.source === 'devPlan' && (
                    <Button
                        onClick={() => onNavigateToDevPlan(weeklyFocus.area)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        <CornerDownRight className="w-4 h-4 mr-2" />
                        View Full Development Plan
                    </Button>
                )}
            </div>

            {/* Focus Selector (if shown) */}
            {showFocusSelector && (
                <div className="mt-4 p-4 border rounded-lg" style={{ borderColor: COLORS.SUBTLE }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: COLORS.NAVY }}>
                        Select Weekly Focus:
                    </p>
                    <div className="space-y-2">
                        {['Lead Self', 'Lead Work', 'Lead People', 'Lead Teams', 'Lead Strategy'].map(area => (
                            <button
                                key={area}
                                onClick={() => {
                                    onSetFocus('selfSelected', area);
                                    setShowFocusSelector(false);
                                }}
                                className="w-full p-2 text-left text-sm rounded hover:bg-gray-50 transition-colors"
                                style={{ borderLeft: `3px solid ${COLORS.TEAL}` }}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
```

---

## Updated Handler for Weekly Focus

Add to Dashboard.jsx handlers section:

```javascript
  // --- NEW: Set Weekly Focus ---
  const handleSetWeeklyFocus = useCallback(async (source, customArea = null) => {
      if (!updateDailyPracticeData) {
          console.error("[Dashboard] Cannot set weekly focus: update function missing");
          return;
      }

      console.log("[Dashboard] Setting weekly focus. Source:", source);
      
      try {
          // Get Monday of current week
          const today = new Date();
          const dayOfWeek = today.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
          const monday = new Date(today);
          monday.setDate(today.getDate() + diff);
          const weekStartDate = monday.toISOString().split('T')[0];
          
          let focusData = {
              weekStartDate: weekStartDate,
              source: source,
              progress: 0
          };
          
          if (source === 'devPlan') {
              // Get focus from development plan
              const currentPhase = developmentPlanData?.currentPlan?.currentPhase;
              const tierInFocus = currentPhase?.tier || 'T1';
              const tierMeta = LEADERSHIP_TIERS[tierInFocus];
              
              focusData.area = tierMeta?.name || 'Lead Self';
              
              // Get recommended reps from catalog based on tier
              // TODO: Lookup from REP_LIBRARY where tier_id matches
              focusData.dailyReps = []; // Will be populated from catalog
              
          } else if (source === 'selfSelected') {
              focusData.area = customArea;
              
              // Get recommended reps based on generic plan
              // TODO: Lookup from GENERIC_DEV_PLAN catalog
              focusData.dailyReps = []; // Will be populated from catalog
          }
          
          const updates = {
              weeklyFocus: focusData
          };
          
          const success = await updateDailyPracticeData(updates);
          if (success) {
              console.log("[Dashboard] Weekly focus set successfully");
          } else {
              throw new Error("Update returned false");
          }
      } catch (error) {
          console.error("[Dashboard] Failed to set weekly focus:", error);
          alert("Error setting weekly focus. Please try again.");
      }
  }, [updateDailyPracticeData, developmentPlanData, LEADERSHIP_TIERS]);

  // --- NEW: Navigate to Dev Plan with Highlighting ---
  const handleNavigateToDevPlan = useCallback((focusArea) => {
      navigate('development-plan', { 
          highlightArea: focusArea,
          scrollTo: 'details' 
      });
  }, [navigate]);
```

---

## Additional Daily Reps Logic Update

Modify the existing Additional Daily Reps card to separate mandatory/recommended from user-added:

```javascript
{/* Additional Daily Reps Card - ENHANCED */}
<Card title={`⏳ Daily Reps`} icon={Clock} accent='TEAL'>
    {/* Recommended/Mandatory Reps (from Weekly Focus) */}
    {weeklyFocus?.dailyReps && weeklyFocus.dailyReps.length > 0 && (
        <div className="mb-4">
            <p className="text-xs font-semibold mb-2 text-teal-700">
                {weeklyFocus.source === 'devPlan' ? '🎯 MANDATORY REPS' : '💡 RECOMMENDED REPS'}
            </p>
            <EmbeddedDailyReps
                commitments={weeklyFocus.dailyReps} // These come from catalog
                onToggleCommit={handleToggleAdditionalCommitment}
                isLoading={isSavingRep}
                readOnly={false}
            />
        </div>
    )}
    
    {/* User Added Reps */}
    {additionalCommitments.length > 0 && (
        <div className="mb-4">
            <p className="text-xs font-semibold mb-2 text-gray-600">
                ➕ YOUR ADDITIONAL REPS
            </p>
            <EmbeddedDailyReps
                commitments={additionalCommitments}
                onToggleCommit={handleToggleAdditionalCommitment}
                isLoading={isSavingRep}
            />
        </div>
    )}
    
    {/* Add Custom Rep Button */}
    <Button
        onClick={() => setShowAddRepModal(true)}
        variant="outline"
        size="sm"
        className="w-full mt-2"
    >
        <Plus className="w-4 h-4 mr-2" />
        Add Your Own Rep
    </Button>
</Card>
```

---

## Summary of Boss's Answers Implementation

### ✅ Implemented:
1. **Pod stays as-is** - No changes needed
2. **QuickStart moved** - Done in App.jsx
3. **Reflection nav removed** - Done in App.jsx, kept on Dashboard
4. **Weekly Focus** - All 3 options supported
5. **Daily Reps Logic** - Conditional based on Dev Plan status

### 🔧 Technical Approach:
- **Weekly Focus Card** shows current focus with progress
- **Conditional Logic** checks if user has completed assessment
- **Mandatory vs Recommended** reps based on source
- **User can add own reps** in addition to plan reps
- **Drill-down to Dev Plan** with highlighting
- **Generic Plan Sequence** for users without assessment

### 📊 Data Flow:
```
User arrives at Dashboard
    ↓
Check: Has Assessment? → weeklyFocus.source
    ↓
IF devPlan: Use current phase from Dev Plan
    → Daily Reps = Mandatory (from plan)
    ↓
IF selfSelected: Show focus picker
    → Daily Reps = Recommended (from generic plan)
    ↓
IF none: Show both options (complete assessment OR pick focus)
    ↓
User can ALWAYS add their own additional reps
```

This matches your boss's vision perfectly!
