// src/components/screens/Dashboard.jsx
// MODIFIED: Refactored to use Atomic Design Components

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from './dashboard/DashboardHooks';
import { 
  UnifiedAnchorEditorModal, CalendarSyncModal, 
  ModeSwitch, StreakTracker, TabButton, SaveIndicator, SuggestionModal 
} from './dashboard/DashboardComponents';
import { 
  Target, Clock, User, Save, Loader, CheckCircle, TrendingUp, Star, 
  ChevronDown, ChevronUp, Plus, X, Sunrise, Moon, Flame, Anchor,
  ToggleLeft, ToggleRight, Zap, AlertTriangle, MessageSquare, Trophy,
  Send, Users, Activity, Edit3, Calendar, ChevronRight
} from 'lucide-react';

// --- ATOMIC COMPONENTS ---
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';

// --- WIDGET RENDERER ---
// This component decides which widget to show based on the active tab
const WidgetRenderer = ({ 
  activeTab, 
  dashboardData, 
  updateDashboardData, 
  user, 
  loading,
  openAnchorModal,
  openCalendarModal
}) => {
  
  // 1. MORNING MINDSET WIDGET
  if (activeTab === 'morning') {
    const { morningMindset } = dashboardData;
    
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle icon={Sunrise} iconColor="text-corporate-orange">
              Morning Mindset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-6">
              Start your day with intention. Align your actions with your leadership identity.
            </p>
            
            <div className="space-y-6">
              {/* Identity Anchor Display */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-corporate-navy flex items-center gap-2">
                    <User className="w-4 h-4 text-corporate-teal" />
                    Identity Anchor
                  </h3>
                  <Button variant="ghost" size="sm" onClick={openAnchorModal}>
                    <Edit3 className="w-3 h-3 mr-1" /> Edit
                  </Button>
                </div>
                <p className="text-slate-700 italic">
                  "{dashboardData.anchors?.identity || "I am a leader who..."}"
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-corporate-navy mb-1">
                    Today's Primary Focus
                  </label>
                  <Input 
                    placeholder="What is the one thing you must achieve today?"
                    value={morningMindset?.focus || ''}
                    onChange={(e) => updateDashboardData('morningMindset', { ...morningMindset, focus: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-corporate-navy mb-1">
                    Gratitude
                  </label>
                  <Textarea 
                    placeholder="I am grateful for..."
                    value={morningMindset?.gratitude || ''}
                    onChange={(e) => updateDashboardData('morningMindset', { ...morningMindset, gratitude: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => updateDashboardData('save', 'morning')} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Morning Routine
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 2. DAILY REPS WIDGET
  if (activeTab === 'reps') {
    const { dailyReps } = dashboardData;
    const repsList = dailyReps?.reps || [];

    const toggleRep = (id) => {
      const updatedReps = repsList.map(rep => 
        rep.id === id ? { ...rep, completed: !rep.completed } : rep
      );
      updateDashboardData('dailyReps', { ...dailyReps, reps: updatedReps });
    };

    const addRep = () => {
      const text = prompt("Enter new rep:");
      if (!text) return;
      const newRep = { id: Date.now(), text, completed: false };
      updateDashboardData('dailyReps', { ...dailyReps, reps: [...repsList, newRep] });
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle icon={Activity} iconColor="text-corporate-teal">
              Daily Reps
            </CardTitle>
            <Button variant="outline" size="sm" onClick={openCalendarModal}>
              <Calendar className="w-4 h-4 mr-2" /> Sync
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repsList.map((rep) => (
                <div 
                  key={rep.id}
                  className={`flex items-center p-3 rounded-lg border transition-all ${
                    rep.completed 
                      ? 'bg-teal-50 border-teal-200' 
                      : 'bg-white border-slate-200 hover:border-corporate-teal'
                  }`}
                >
                  <Checkbox 
                    checked={rep.completed}
                    onCheckedChange={() => toggleRep(rep.id)}
                    id={`rep-${rep.id}`}
                  />
                  <label 
                    htmlFor={`rep-${rep.id}`}
                    className={`ml-3 flex-1 cursor-pointer font-medium ${
                      rep.completed ? 'text-slate-500 line-through' : 'text-corporate-navy'
                    }`}
                  >
                    {rep.text}
                  </label>
                </div>
              ))}
              
              {repsList.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No reps defined yet. Add one to get started!
                </div>
              )}

              <Button variant="ghost" onClick={addRep} className="w-full border-dashed border-2 border-slate-300 text-slate-500 hover:text-corporate-teal hover:border-corporate-teal">
                <Plus className="w-4 h-4 mr-2" /> Add Custom Rep
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. EVENING REFLECTION WIDGET
  if (activeTab === 'evening') {
    const { eveningReflection } = dashboardData;
    
    return (
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle icon={Moon} iconColor="text-corporate-purple">
              Evening Reflection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-6">
              Review your day. What went well? What can be improved?
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-corporate-navy mb-1">
                  Wins of the Day
                </label>
                <Textarea 
                  placeholder="List 3 things that went well..."
                  value={eveningReflection?.wins || ''}
                  onChange={(e) => updateDashboardData('eveningReflection', { ...eveningReflection, wins: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-corporate-navy mb-1">
                  Lessons Learned
                </label>
                <Textarea 
                  placeholder="What would you do differently?"
                  value={eveningReflection?.lessons || ''}
                  onChange={(e) => updateDashboardData('eveningReflection', { ...eveningReflection, lessons: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="plan-tomorrow"
                  checked={eveningReflection?.plannedTomorrow || false}
                  onCheckedChange={(checked) => updateDashboardData('eveningReflection', { ...eveningReflection, plannedTomorrow: checked })}
                />
                <label htmlFor="plan-tomorrow" className="text-sm font-medium text-corporate-navy">
                  I have planned my top priorities for tomorrow
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => updateDashboardData('save', 'evening')} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Reflection
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const { user } = useAuth();
  const { 
    loading, 
    dashboardData, 
    updateDashboardData, 
    refreshData 
  } = useDashboardData(user);

  const [activeTab, setActiveTab] = useState('morning');
  const [isArenaMode, setIsArenaMode] = useState(true);
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // Show save indicator when loading finishes after a save
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading) {
      // Just finished loading (saving)
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 3000);
    }
    prevLoading.current = loading;
  }, [loading]);

  if (!user) return <div className="p-8 text-center">Please log in.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy">
                Welcome back, {user.displayName?.split(' ')[0] || 'Leader'}
              </h1>
              <p className="text-slate-500 text-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <StreakTracker 
                streakCount={dashboardData.streak?.count || 0} 
                streakCoins={dashboardData.streak?.coins || 0}
                userEmail={user.email}
              />
              <ModeSwitch 
                isArenaMode={isArenaMode} 
                onToggle={() => setIsArenaMode(!isArenaMode)} 
                isLoading={loading}
              />
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            <TabButton 
              label="Morning Mindset" 
              active={activeTab === 'morning'} 
              onClick={() => setActiveTab('morning')}
              minimized={!dashboardData.morningMindset?.completed}
            />
            <TabButton 
              label="Daily Reps" 
              active={activeTab === 'reps'} 
              onClick={() => setActiveTab('reps')}
              minimized={!dashboardData.dailyReps?.completed}
            />
            <TabButton 
              label="Evening Reflection" 
              active={activeTab === 'evening'} 
              onClick={() => setActiveTab('evening')}
              minimized={!dashboardData.eveningReflection?.completed}
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <WidgetRenderer 
          activeTab={activeTab}
          dashboardData={dashboardData}
          updateDashboardData={updateDashboardData}
          user={user}
          loading={loading}
          openAnchorModal={() => setShowAnchorModal(true)}
          openCalendarModal={() => setShowCalendarModal(true)}
        />
      </main>

      {/* MODALS */}
      <UnifiedAnchorEditorModal 
        isOpen={showAnchorModal}
        onClose={() => setShowAnchorModal(false)}
        initialIdentity={dashboardData.anchors?.identity}
        initialHabit={dashboardData.anchors?.habit}
        initialWhy={dashboardData.anchors?.why}
        onSave={(anchors) => {
          updateDashboardData('anchors', anchors);
          setShowAnchorModal(false);
        }}
      />

      <CalendarSyncModal 
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />

      <SaveIndicator show={showSaveIndicator} />
    </div>
  );
};

export default Dashboard;
