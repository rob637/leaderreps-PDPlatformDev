// src/components/screens/AdminDataMaintenance.jsx
// UPDATED: Restructured for new modular architecture (post-migration)
// Organized by functional module: Dashboard, Development Plan, Daily Practice, Strategic Content, Global Metadata

import React, { useState, useEffect, useMemo } from "react";
import {
  getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc, 
  serverTimestamp, query, limit as qLimit, writeBatch
} from "firebase/firestore";
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  Loader, Download, Upload, Trash2, Save, Search, Edit, 
  LayoutDashboard, Target, Calendar, Lightbulb, Settings,
  AlertTriangle, CheckCircle, Database, FileText
} from 'lucide-react';

/* =========================================================
   COLORS & UI COMPONENTS
========================================================= */
const COLORS = { 
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', 
  GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', 
  OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', 
  PURPLE: '#7C3AED', BG: '#F9FAFB' 
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm`;
  
  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-md hover:bg-[#349881]`;
  else if (variant === 'secondary') baseStyle += ` bg-gray-200 text-gray-800 hover:bg-gray-300`;
  else if (variant === 'danger') baseStyle += ` bg-red-600 text-white hover:bg-red-700`;
  else if (variant === 'success') baseStyle += ` bg-green-600 text-white hover:bg-green-700`;
  
  return <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>;
};

const Card = ({ title, icon: Icon, children, className = '', accent = COLORS.TEAL }) => (
  <div className={`bg-white rounded-xl border-2 border-gray-200 shadow-lg ${className}`}>
    <div className="h-1" style={{ background: accent }} />
    {title && (
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        {Icon && <Icon size={20} style={{ color: accent }} />}
        <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>{title}</h3>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const Tab = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
      active 
        ? 'border-b-2 border-teal-500 text-teal-600' 
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <Loader className="w-6 h-6 animate-spin mr-2" style={{ color: COLORS.TEAL }} />
    <span className="text-gray-600">{message}</span>
  </div>
);

/* =========================================================
   UTILITIES
========================================================= */
const pretty = (v) => JSON.stringify(v ?? {}, null, 2);
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };

const flatten = (obj, prefix = "", out = {}) => {
  if (obj == null || typeof obj !== 'object') return out;
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && v.seconds !== undefined) {
      try { out[key] = new Date(v.seconds * 1000).toISOString(); } 
      catch { out[key] = "[Invalid Timestamp]"; }
    }
    else if (Array.isArray(v) || (v && typeof v === "object" && !(v instanceof Date))) {
      out[key] = JSON.stringify(v, null, 2);
    }
    else if (v instanceof Date) { out[key] = v.toISOString(); }
    else { out[key] = v; }
  });
  return out;
};

/* =========================================================
   MODULE CONFIGURATIONS
========================================================= */
const MODULE_CONFIGS = {
  user_profile: {
    name: "User Profile",
    icon: Database,
    path: (uid) => `users/${uid}`,
    description: "Basic user information and account metadata",
    fields: ["userId", "email", "displayName", "createdAt", "_createdAt", "_updatedAt"],
    color: COLORS.BLUE
  },
  
  development_plan: {
    name: "Development Plan",
    icon: Target,
    path: (uid) => `modules/${uid}/development_plan/current`,
    description: "12-week leadership development plans and assessment history",
    subcollections: [
      { name: "plan_history", path: "plan_history" },
      { name: "assessment_history", path: "assessment_history" }
    ],
    fields: [
      "currentPlan", "cycle", "currentWeek", "responses", "openEndedResponse",
      "assessmentHistory", "previousPlans", "createdAt", "_updatedAt"
    ],
    color: COLORS.TEAL
  },
  
  daily_practice: {
    name: "Daily Practice",
    icon: Calendar,
    path: (uid) => `modules/${uid}/daily_practice/current`,
    description: "Daily reps, streaks, commitments, and practice tracking",
    subcollections: [
      { name: "reflection_history", path: "reflection_history" },
      { name: "practice_history", path: "practice_history" }
    ],
    fields: [
      "dailyTargetRepId", "dailyTargetRepStatus", "dailyTargetRepDate",
      "activeCommitments", "identityAnchor", "habitAnchor",
      "streakCount", "streakCoins", "completedRepsToday", "lastUpdated",
      "weeklyFocus", "morningBookend", "eveningBookend", "arenaMode"
    ],
    color: COLORS.ORANGE
  },
  
  strategic_content: {
    name: "Strategic Content",
    icon: Lightbulb,
    path: (uid) => `modules/${uid}/strategic_content/vision_mission`,
    description: "Vision, mission, values, goals, and strategic planning",
    fields: [
      "vision", "mission", "values", "goals", "purpose", "overallWhy",
      "okrs", "risks", "misalignmentNotes", "lastPreMortemDecision", "_updatedAt"
    ],
    color: COLORS.PURPLE
  },
  
  global_metadata: {
    name: "Global Metadata",
    icon: Settings,
    path: () => `metadata/config`,
    description: "App-wide configuration, feature flags, and catalogs",
    catalogs: [
      { name: "REP_LIBRARY", path: "metadata/config/catalog/rep_library" },
      { name: "SKILL_CATALOG", path: "metadata/config/catalog/skill_catalog" },
      { name: "COURSE_LIBRARY", path: "metadata/config/catalog/course_library" },
      { name: "EXERCISE_LIBRARY", path: "metadata/config/catalog/exercise_library" },
      { name: "READING_CATALOG", path: "metadata/config/catalog/reading_catalog" },
      { name: "VIDEO_CATALOG", path: "metadata/config/catalog/video_catalog" }
    ],
    fields: [
      "featureFlags", "LEADERSHIP_TIERS", "APP_ID", "GEMINI_MODEL",
      "IconMap", "_updatedAt", "_updatedBy", "_source"
    ],
    color: COLORS.NAVY,
    isGlobal: true
  }
};

/* =========================================================
   MODULE DATA VIEWER COMPONENT
========================================================= */
const ModuleDataViewer = ({ moduleKey, config, userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [subcollectionData, setSubcollectionData] = useState({});
  
  const db = getFirestore();
  const path = config.isGlobal ? config.path() : config.path(userId);

  // Load main document
  useEffect(() => {
    if (!path || (!(config.isGlobal) && !userId)) return;
    
    setLoading(true);
    setError(null);
    
    const docRef = doc(db, ...path.split('/'));
    
    getDoc(docRef)
      .then(snap => {
        if (snap.exists()) {
          const docData = snap.data();
          setData(docData);
          setEditedData(flatten(docData));
        } else {
          setData(null);
          setEditedData({});
        }
      })
      .catch(err => {
        console.error(`[ModuleDataViewer] Error loading ${moduleKey}:`, err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [path, userId, moduleKey]);

  // Load subcollections
  useEffect(() => {
    if (!config.subcollections || !userId || !path) return;
    
    const loadSubcollections = async () => {
      const subData = {};
      
      for (const sub of config.subcollections) {
        try {
          const subRef = collection(db, ...path.split('/'), sub.path);
          const subSnap = await getDocs(query(subRef, qLimit(10)));
          subData[sub.name] = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
          console.error(`Error loading ${sub.name}:`, err);
          subData[sub.name] = [];
        }
      }
      
      setSubcollectionData(subData);
    };
    
    loadSubcollections();
  }, [path, userId, config.subcollections]);

  // Load catalogs for global metadata
  useEffect(() => {
    if (!config.catalogs) return;
    
    const loadCatalogs = async () => {
      const catalogData = {};
      
      for (const catalog of config.catalogs) {
        try {
          const catalogRef = doc(db, ...catalog.path.split('/'));
          const catalogSnap = await getDoc(catalogRef);
          if (catalogSnap.exists()) {
            catalogData[catalog.name] = catalogSnap.data();
          }
        } catch (err) {
          console.error(`Error loading ${catalog.name}:`, err);
        }
      }
      
      setSubcollectionData(catalogData);
    };
    
    loadCatalogs();
  }, [config.catalogs]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Convert flat edited data back to nested structure
      const unflattenedData = {};
      Object.entries(editedData).forEach(([key, value]) => {
        const parts = key.split('.');
        let current = unflattenedData;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {};
          current = current[parts[i]];
        }
        
        // Try to parse JSON strings
        try {
          current[parts[parts.length - 1]] = JSON.parse(value);
        } catch {
          current[parts[parts.length - 1]] = value;
        }
      });
      
      // Add update timestamp
      unflattenedData._updatedAt = serverTimestamp();
      unflattenedData._updatedBy = userId || 'admin';
      unflattenedData._source = 'AdminDataMaintenance';
      
      const docRef = doc(db, ...path.split('/'));
      await setDoc(docRef, unflattenedData, { merge: true });
      
      alert('Data saved successfully!');
      setEditMode(false);
      
      // Reload data
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setData(snap.data());
        setEditedData(flatten(snap.data()));
      }
    } catch (err) {
      console.error('Save error:', err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      module: config.name,
      path: path,
      timestamp: new Date().toISOString(),
      data: data,
      subcollections: subcollectionData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${moduleKey}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner message={`Loading ${config.name}...`} />;
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
        <AlertTriangle className="text-red-600" size={20} />
        <span className="text-red-800">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-600">Firestore Path:</h4>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{path}</code>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="secondary" disabled={!data}>
            <Download size={16} />
            Export JSON
          </Button>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} variant="primary" disabled={!data}>
              <Edit size={16} />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={() => setEditMode(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleSave} variant="success">
                <Save size={16} />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Data */}
      {data ? (
        <Card title="Document Data" icon={FileText} accent={config.color}>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(editedData).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-start">
                <label className="w-1/3 text-sm font-medium text-gray-700 pt-2">
                  {key}
                </label>
                {editMode ? (
                  <textarea
                    className="w-2/3 p-2 border border-gray-300 rounded text-sm font-mono"
                    rows={Math.min(6, value.split('\n').length)}
                    value={value}
                    onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                  />
                ) : (
                  <div className="w-2/3 p-2 bg-gray-50 rounded text-sm font-mono whitespace-pre-wrap">
                    {value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">No data found at this path</p>
          <Button onClick={() => setEditMode(true)} variant="primary">
            <FileText size={16} />
            Create Document
          </Button>
        </div>
      )}

      {/* Subcollections */}
      {config.subcollections && Object.keys(subcollectionData).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>Subcollections</h4>
          {Object.entries(subcollectionData).map(([subName, subDocs]) => (
            <Card key={subName} title={subName} accent={config.color}>
              <div className="text-sm text-gray-600 mb-2">
                {subDocs.length} document{subDocs.length !== 1 ? 's' : ''}
              </div>
              {subDocs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {subDocs.map((subDoc, idx) => (
                    <div key={subDoc.id || idx} className="p-3 bg-gray-50 rounded text-xs font-mono">
                      <div className="font-bold mb-1">ID: {subDoc.id}</div>
                      <pre className="whitespace-pre-wrap">{pretty(subDoc)}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Empty subcollection</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Catalogs for Global Metadata */}
      {config.catalogs && Object.keys(subcollectionData).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>Catalogs</h4>
          {Object.entries(subcollectionData).map(([catalogName, catalogData]) => (
            <Card key={catalogName} title={catalogName} accent={config.color}>
              <div className="text-sm text-gray-600 mb-2">
                {catalogData?.items?.length || 0} items
              </div>
              <div className="max-h-64 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {pretty(catalogData)}
                </pre>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function AdminDataMaintenance() {
  const services = useAppServices();
  const { userId, isAdmin } = services || {};
  
  const [activeModule, setActiveModule] = useState('user_profile');
  const [targetUserId, setTargetUserId] = useState(userId || '');

  useEffect(() => {
    if (userId && !targetUserId) {
      setTargetUserId(userId);
    }
  }, [userId]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card accent={COLORS.RED}>
          <div className="text-center p-8">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Access Denied
            </h2>
            <p className="text-gray-600">
              You need admin privileges to access this page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const config = MODULE_CONFIGS[activeModule];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                Admin Data Maintenance
              </h1>
              <p className="text-sm text-gray-600">
                View and edit Firestore data by functional module
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">User ID:</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Enter user ID..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono w-64"
                disabled={config?.isGlobal}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-2">
          {Object.entries(MODULE_CONFIGS).map(([key, cfg]) => (
            <Tab
              key={key}
              active={activeModule === key}
              onClick={() => setActiveModule(key)}
              icon={cfg.icon}
              label={cfg.name}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card accent={config.color}>
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              {config.name}
            </h2>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>

          {config.isGlobal || targetUserId ? (
            <ModuleDataViewer
              moduleKey={activeModule}
              config={config}
              userId={targetUserId}
            />
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Please enter a User ID to view this module's data</p>
            </div>
          )}
        </Card>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Database className="text-blue-600 flex-shrink-0" size={20} />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Database Structure</p>
              <ul className="text-blue-800 space-y-1">
                <li>• User Profile: <code className="bg-blue-100 px-1 rounded">users/{'{userId}'}</code></li>
                <li>• Development Plan: <code className="bg-blue-100 px-1 rounded">modules/{'{userId}'}/development_plan/current</code></li>
                <li>• Daily Practice: <code className="bg-blue-100 px-1 rounded">modules/{'{userId}'}/daily_practice/current</code></li>
                <li>• Strategic Content: <code className="bg-blue-100 px-1 rounded">modules/{'{userId}'}/strategic_content/vision_mission</code></li>
                <li>• Global Metadata: <code className="bg-blue-100 px-1 rounded">metadata/config</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
