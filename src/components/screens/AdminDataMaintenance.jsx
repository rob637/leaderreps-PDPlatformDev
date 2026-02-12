// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  getFirestore, doc, collection, getDoc, getDocs, setDoc, deleteDoc, 
  serverTimestamp, query, orderBy
} from "../../services/firebaseUtils";
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  Download, Upload, Trash2, Save, Search, Edit, Plus, X,
  LayoutDashboard, Target, Calendar, Lightbulb, Settings, Database,
  AlertTriangle, CheckCircle, FileText, Copy, RefreshCw, Eye, EyeOff,
  MessageSquare, Users, BookOpen, Film, Zap, ChevronDown, ChevronUp, GripVertical, ArrowLeft
} from 'lucide-react';
import { Button, Card, Badge, LoadingState } from '../ui';

/* =========================================================
   DATA STRUCTURE CONFIGURATION (ALL LOWERCASE KEYS)
========================================================= */
const MODULE_GROUPS = {
  user_data: {
    name: "User Profile",
    icon: Database,
    color: "text-corporate-navy",
    accentColor: "bg-corporate-navy",
    description: "Basic user information and account settings",
    tables: {
      profile: {
        name: "User Profile",
        path: (uid) => `users/${uid}`,
        fields: [
          { key: 'userid', label: 'User ID', type: 'text', readonly: true },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'displayname', label: 'Display Name', type: 'text' },
          { key: 'photourl', label: 'Photo URL', type: 'text' },
          { key: 'isadmin', label: 'Is Admin', type: 'boolean' },
          { key: 'createdat', label: 'Created At', type: 'timestamp', readonly: true },
          { key: '_createdat', label: 'Created At (Alt)', type: 'timestamp', readonly: true },
          { key: '_updatedat', label: 'Updated At', type: 'timestamp', readonly: true }
        ]
      }
    }
  },

  development_plan: {
    name: "Development Plan",
    icon: Target,
    color: "text-corporate-teal",
    accentColor: "bg-corporate-teal",
    description: "12-week leadership development plans and assessments",
    tables: {
      current_plan: {
        name: "Current Plan",
        path: (uid) => `modules/${uid}/development_plan/current`,
        fields: [
          { key: 'cycle', label: 'Cycle Number', type: 'number' },
          { key: 'currentweek', label: 'Current Week', type: 'number' },
          { key: 'currentplan', label: 'Plan Data', type: 'json' },
          { key: 'focusareas', label: 'Focus Areas', type: 'json' },
          { key: 'assessmenthistory', label: 'Assessment History', type: 'json' },
          { key: 'previousplans', label: 'Previous Plans', type: 'json' },
          { key: '_updatedat', label: 'Updated At', type: 'timestamp', readonly: true }
        ]
      }
    }
  },

  daily_practice: {
    name: "Daily Practice",
    icon: Calendar,
    color: "text-corporate-orange",
    accentColor: "bg-corporate-orange",
    description: "Daily reps, streaks, commitments, reflections, and bookends",
    tables: {
      current_practice: {
        name: "Current Practice",
        path: (uid) => `modules/${uid}/daily_practice/current`,
        fields: [
          { key: 'dailytargetrepid', label: 'Daily Target Rep ID', type: 'text' },
          { key: 'dailytargetrepstatus', label: 'Daily Target Status', type: 'text' },
          { key: 'dailytargetrepdate', label: 'Daily Target Date', type: 'date' },
          { key: 'activecommitments', label: 'Active Commitments', type: 'json' },
          { key: 'identityanchor', label: 'Identity Anchor', type: 'text' },
          { key: 'habitanchor', label: 'Habit Anchor', type: 'text' },
          { key: 'streakcount', label: 'Streak Count', type: 'number' },
          { key: 'streakcoins', label: 'Streak Coins', type: 'number' },
          { key: 'completedrepstoday', label: 'Completed Reps Today', type: 'json' },
          { key: 'weeklyfocus', label: 'Weekly Focus', type: 'text' },
          { key: 'morningbookend', label: 'Morning Bookend Data', type: 'json' },
          { key: 'eveningbookend', label: 'Evening Bookend Data', type: 'json' },
          { key: 'arenamode', label: 'Arena Mode', type: 'boolean' },
          { key: 'lastupdated', label: 'Last Updated', type: 'timestamp', readonly: true }
        ]
      },
      reflection_history: {
        name: "Reflection History",
        path: (uid) => `modules/${uid}/daily_practice/reflection_history`,
        isSubcollection: true,
        fields: [
          { key: 'did', label: 'What I Did', type: 'textarea' },
          { key: 'noticed', label: 'What I Noticed', type: 'textarea' },
          { key: 'trydiff', label: 'What I\'ll Try', type: 'textarea' },
          { key: 'identity', label: 'Identity Statement', type: 'text' },
          { key: 'date', label: 'Date (YYYY-MM-DD)', type: 'date' },
          { key: 'timestamp', label: 'Timestamp', type: 'timestamp', readonly: true }
        ]
      }
    }
  },

  strategic_content: {
    name: "Strategic Content",
    icon: Lightbulb,
    color: "text-purple-600",
    accentColor: "bg-purple-600",
    description: "Vision, mission, values, goals, and strategic planning",
    tables: {
      vision_mission: {
        name: "Vision & Mission",
        path: (uid) => `modules/${uid}/strategic_content/vision_mission`,
        fields: [
          { key: 'vision', label: 'Vision', type: 'textarea' },
          { key: 'mission', label: 'Mission', type: 'textarea' },
          { key: 'values', label: 'Values', type: 'json' },
          { key: 'goals', label: 'Goals', type: 'json' },
          { key: 'purpose', label: 'Purpose', type: 'textarea' },
          { key: 'overallwhy', label: 'Overall Why', type: 'textarea' },
          { key: 'okrs', label: 'OKRs', type: 'json' },
          { key: 'risks', label: 'Risks', type: 'json' },
          { key: 'misalignmentnotes', label: 'Misalignment Notes', type: 'textarea' },
          { key: 'lastpremortemdecision', label: 'Last Pre-Mortem Decision', type: 'text' },
          { key: '_updatedat', label: 'Updated At', type: 'timestamp', readonly: true }
        ]
      }
    }
  },

  community_content: {
    name: "Community & Content",
    icon: Users,
    color: "text-pink-600",
    accentColor: "bg-pink-600",
    description: "Community feed, readings, videos, and shared content",
    tables: {
      community_feed: {
        name: "Community Feed",
        path: () => `community/feed/posts`,
        isGlobal: true,
        isSubcollection: true,
        fields: [
          { key: 'userid', label: 'User ID', type: 'text' },
          { key: 'username', label: 'User Name', type: 'text' },
          { key: 'text', label: 'Post Text', type: 'textarea' },
          { key: 'ispod', label: 'Is Pod Post', type: 'boolean' },
          { key: 'createdat', label: 'Created At', type: 'timestamp', readonly: true }
        ]
      },
      readings: {
        name: "Business Readings",
        path: () => `content/readings`,
        isGlobal: true,
        fields: [
          { key: 'items', label: 'Reading Items (Array)', type: 'json' }
        ]
      },
      videos: {
        name: "Leadership Videos",
        path: () => `content/videos`,
        isGlobal: true,
        fields: [
          { key: 'items', label: 'Video Items (Array)', type: 'json' }
        ]
      }
    }
  },

  global_metadata: {
    name: "Global Metadata",
    icon: Settings,
    color: "text-corporate-navy",
    accentColor: "bg-corporate-navy",
    description: "App-wide configuration and catalogs (affects all users)",
    isGlobal: true,
    tables: {
      config: {
        name: "App Configuration",
        path: () => `metadata/config`,
        fields: [
          { key: 'app_id', label: 'App ID', type: 'text' },
          { key: 'gemini_model', label: 'Gemini Model', type: 'text' },
          { key: 'featureflags', label: 'Feature Flags', type: 'json' },
          { key: 'adminemails', label: 'Admin Emails', type: 'json' },
          { key: 'leadership_tiers', label: 'Leadership Tiers', type: 'json' },
          { key: 'iconmap', label: 'Icon Map', type: 'json' },
          { key: '_updatedat', label: 'Updated At', type: 'timestamp', readonly: true },
          { key: '_updatedby', label: 'Updated By', type: 'text', readonly: true }
        ]
      },
      rep_library: {
        name: "Rep Library",
        path: () => `metadata/config/catalog/rep_library`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Reps (Array)', type: 'json' }
        ]
      },
      exercise_library: {
        name: "Exercise Library",
        path: () => `metadata/config/catalog/exercise_library`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Exercises (Array)', type: 'json' }
        ]
      },
      workout_library: {
        name: "Workout Library",
        path: () => `metadata/config/catalog/workout_library`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Workouts (Array)', type: 'json' }
        ]
      },
      course_library: {
        name: "Course Library",
        path: () => `metadata/config/catalog/course_library`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Courses (Array)', type: 'json' }
        ]
      },
      skill_catalog: {
        name: "Skill Catalog",
        path: () => `metadata/config/catalog/skill_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Skills (Array)', type: 'json' }
        ]
      },
      identity_anchor_catalog: {
        name: "Identity Anchor Catalog",
        path: () => `metadata/config/catalog/identity_anchor_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Identity Anchors (Array)', type: 'json' }
        ]
      },
      habit_anchor_catalog: {
        name: "Habit Anchor Catalog",
        path: () => `metadata/config/catalog/habit_anchor_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Habit Anchors (Array)', type: 'json' }
        ]
      },
      why_catalog: {
        name: "Why Catalog",
        path: () => `metadata/config/catalog/why_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Why Statements (Array)', type: 'json' }
        ]
      },
      reading_catalog: {
        name: "Reading Catalog",
        path: () => `metadata/config/catalog/reading_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Reading Materials (Array)', type: 'json' }
        ]
      },
      video_catalog: {
        name: "Video Catalog",
        path: () => `metadata/config/catalog/video_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Videos (Array)', type: 'json' }
        ]
      },
      scenario_catalog: {
        name: "Scenario Catalog",
        path: () => `metadata/config/catalog/scenario_catalog`,
        isCatalog: true,
        fields: [
          { key: 'items', label: 'Scenarios (Array)', type: 'json' }
        ]
      }
    }
  }
};

/* =========================================================
   UTILITIES
========================================================= */
const pretty = (v) => JSON.stringify(v ?? {}, null, 2);

const formatTimestamp = (value) => {
  if (!value) return 'N/A';
  if (value.seconds) {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  return String(value);
};

const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* =========================================================
   SUBCOLLECTION VIEWER COMPONENT
========================================================= */
const SubcollectionViewer = ({ tableConfig, userId }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const db = getFirestore();

  const loadDocs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const path = tableConfig.path(userId);
      const collectionRef = collection(db, ...path.split('/'));
      const q = query(collectionRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      const docsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDocs(docsData);
    } catch (err) {
      console.error('Load subcollection error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this entry?')) return;
    
    try {
      const path = tableConfig.path(userId);
      const docRef = doc(db, ...path.split('/'), docId);
      await deleteDoc(docRef);
      setDocs(docs.filter(d => d.id !== docId));
      setSelectedDoc(null);
      alert('Deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (loading) {
    return <LoadingState message="Loading entries..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <AlertTriangle size={20} className="text-red-600 mb-2" />
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-300">No entries found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="primary">{docs.length} entries</Badge>
        <Button onClick={loadDocs} variant="ghost" size="sm">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3">
        {docs.map(docData => (
          <div key={docData.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-corporate-teal transition-all shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {formatTimestamp(docData.timestamp || docData.date)}
                </p>
                <div className="text-sm space-y-1">
                  {tableConfig.fields.filter(f => f.key !== 'timestamp').map(field => {
                    const value = docData[field.key];
                    if (!value) return null;
                    
                    return (
                      <p key={field.key} className="text-slate-700 dark:text-slate-200">
                        <strong>{field.label}:</strong> {
                          field.type === 'json' 
                            ? JSON.stringify(value).substring(0, 100) + '...'
                            : String(value).substring(0, 150)
                        }
                      </p>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button 
                  onClick={() => setSelectedDoc(selectedDoc?.id === docData.id ? null : docData)}
                  variant="ghost"
                  size="sm"
                >
                  {selectedDoc?.id === docData.id ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button 
                  onClick={() => handleDelete(docData.id)}
                  variant="danger"
                  size="sm"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            
            {selectedDoc?.id === docData.id && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded overflow-auto max-h-64">
                  {pretty(docData)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   NEW: CATALOG ITEM EDITOR COMPONENT (FOR TABLE ROWS)
========================================================= */
const CatalogItemEditor = ({ item, index, onUpdate, onDelete, onAddNewField }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleChange = (key, value) => {
    setEditedItem(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onUpdate(index, editedItem);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedItem(item);
    setIsEditing(false);
  };

  // Guess input type based on value
  const getInput = (key, value) => {
    if (typeof value === 'boolean') {
      return (
        <select
          value={String(value)}
          onChange={(e) => handleChange(key, e.target.value === 'true')}
          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }
    
    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(key, Number(e.target.value))}
          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
        />
      );
    }

    if (typeof value === 'string' && value.length > 100) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
          rows={4}
        />
      );
    }
    
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(key, e.target.value)}
        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
      />
    );
  };

  return (
    <div 
      className={`rounded-xl border transition-colors ${isEditing ? 'border-corporate-teal bg-corporate-teal/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
          <p className="font-semibold text-corporate-navy">
            {item.name || item.id || `Item ${index + 1}`}
          </p>
          <Badge variant="default" size="sm">{item.id || 'NO ID'}</Badge>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleCancel} variant="outline" size="sm">Cancel</Button>
              <Button onClick={handleSave} variant="primary" size="sm">Save</Button>
            </>
          ) : (
            <>
              <Button onClick={() => onDelete(index)} variant="danger" size="sm">
                <Trash2 size={14} />
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit size={14} />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Editor Body */}
      {isEditing && (
        <div className="p-4 space-y-3">
          {Object.entries(editedItem).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                {key}
              </label>
              {getInput(key, value)}
            </div>
          ))}
          <Button 
            onClick={() => onAddNewField(index)} 
            variant="ghost" 
            size="sm" 
            className="mt-2"
          >
            <Plus size={14} />
            Add New Field
          </Button>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   NEW: CATALOG TABLE EDITOR COMPONENT
========================================================= */
const CatalogTableEditor = ({ items, onChange }) => {
  const handleUpdate = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    onChange(newItems);
  };

  const handleDelete = (index) => {
    if (!confirm(`Are you sure you want to delete this item?\n\n${JSON.stringify(items[index], null, 2)}`)) {
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleAddItem = () => {
    const newItem = {
      id: `new_item_${Date.now()}`,
      name: "New Catalog Item",
      description: "A description for the new item."
    };
    onChange([...items, newItem]);
  };

  const handleAddNewField = (index) => {
    const fieldName = prompt("Enter new field name (e.g., 'category'):");
    if (!fieldName || fieldName.trim() === '') return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [fieldName]: "new value"
    };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          CATALOG ITEMS
        </p>
        <Button onClick={handleAddItem} variant="primary" size="sm">
          <Plus size={16} />
          Add New Item
        </Button>
      </div>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <CatalogItemEditor
              key={item.id || index}
              item={item}
              index={index}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddNewField={handleAddNewField}
            />
          ))
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p>No items in this catalog.</p>
          </div>
        )}
      </div>
    </div>
  );
};


/* =========================================================
   TABLE DATA EDITOR COMPONENT (MODIFIED)
========================================================= */
const TableDataEditor = ({ tableConfig, data, onSave, onDelete }) => {
  const [editedData, setEditedData] = useState(data || {});
  const [isSaving, setIsSaving] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedData(data || {});
    setJsonText(pretty(data || {}));
    setHasChanges(false);
  }, [data]);
  
  // Get catalog items from the edited data
  const catalogItems = useMemo(() => {
    if (!editedData || !Array.isArray(editedData.items)) {
      return [];
    }
    return editedData.items;
  }, [editedData]);

  // Handler for changes from the new CatalogTableEditor
  const handleCatalogChange = (newItems) => {
    const newData = { ...editedData, items: newItems };
    setEditedData(newData);
    setJsonText(pretty(newData)); // Keep JSON view in sync
    setHasChanges(true);
  };

  const handleFieldChange = (key, value, type) => {
    let processedValue = value;
    
    if (type === 'number') {
      processedValue = value === '' ? null : Number(value);
    } else if (type === 'boolean') {
      processedValue = value === 'true' || value === true;
    } else if (type === 'json') {
      try {
        processedValue = JSON.parse(value);
      } catch (e) {
        processedValue = value; // Keep as string if invalid JSON
      }
    }

    const newData = { ...editedData, [key]: processedValue };
    setEditedData(newData);
    setJsonText(pretty(newData)); // Keep JSON view in sync
    setHasChanges(true);
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setEditedData(parsed); // Update main data from JSON
      setHasChanges(true);
    } catch (e) {
      // Invalid JSON - don't update editedData, but still mark changes
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let dataToSave = editedData;
    
    // If in JSON mode, re-parse to ensure it's valid before saving
    if (showJson) {
      try {
        dataToSave = JSON.parse(jsonText);
      } catch (e) {
        alert('Save failed: Invalid JSON format. Please correct it before saving.');
        setIsSaving(false);
        return;
      }
    }
    
    try {
      await onSave(dataToSave);
      setEditedData(dataToSave); // Ensure state reflects saved data
      setHasChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          setEditedData(imported);
          setJsonText(pretty(imported));
          setHasChanges(true);
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!data) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
        <Database className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-600 dark:text-slate-300 mb-4">No data found for this table</p>
        <Button onClick={handleSave} variant="primary">
          <Plus size={16} />
          Create New Document
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowJson(!showJson)} 
            variant="outline"
            size="sm"
          >
            {showJson ? <EyeOff size={16} /> : <Eye size={16} />}
            {showJson ? (tableConfig.isCatalog ? 'Show Table View' : 'Show Form') : 'Show JSON'}
          </Button>
          <Button 
            onClick={() => downloadJSON(data, `${tableConfig.name.replace(/\s+/g, '_')}.json`)}
            variant="ghost"
            size="sm"
          >
            <Download size={16} />
            Export
          </Button>
          <Button 
            onClick={handleImport}
            variant="ghost"
            size="sm"
          >
            <Upload size={16} />
            Import
          </Button>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(pretty(data));
              alert('Copied to clipboard!');
            }}
            variant="ghost"
            size="sm"
          >
            <Copy size={16} />
            Copy
          </Button>
        </div>
        
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="warning">Unsaved changes</Badge>
          )}
          {onDelete && (
            <Button 
              onClick={onDelete}
              variant="danger"
              size="sm"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          )}
          <Button 
            onClick={handleSave}
            variant="primary"
            size="sm"
            disabled={isSaving || !hasChanges}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* JSON Editor View */}
      {showJson ? (
        <div className="relative">
          <textarea
            className="w-full h-96 p-4 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            spellCheck={false}
          />
          {hasChanges && (
            <div className="absolute top-2 right-2">
              <Badge variant="warning">Modified</Badge>
            </div>
          )}
        </div>
      ) : tableConfig.isCatalog ? (
        // NEW: Catalog Table Editor View
        <CatalogTableEditor
          items={catalogItems}
          onChange={handleCatalogChange}
        />
      ) : (
        /* Form Editor View (for non-catalog tables) */
        <div className="grid gap-4">
          {tableConfig.fields.map(field => {
            const value = editedData[field.key];
            const displayValue = field.type === 'json' 
              ? pretty(value)
              : field.type === 'timestamp'
              ? formatTimestamp(value)
              : value ?? '';

            return (
              <div key={field.key} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      {field.label}
                    </label>
                    {field.readonly && (
                      <Badge variant="default" size="sm">Read-only</Badge>
                    )}
                  </div>
                </div>

                {field.readonly ? (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    {field.type === 'json' ? (
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-32">
                        {displayValue}
                      </pre>
                    ) : (
                      <span className="text-sm text-slate-600 dark:text-slate-300">{displayValue || 'N/A'}</span>
                    )}
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    rows={4}
                    value={displayValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                  />
                ) : field.type === 'json' ? (
                  <textarea
                    className="w-full p-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    rows={6}
                    value={displayValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                    spellCheck={false}
                  />
                ) : field.type === 'boolean' ? (
                  <select
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    value={String(value)}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    value={displayValue}
                    onChange={(e) => handleFieldChange(field.key, e.target.value, field.type)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Catalog Item Count */}
      {tableConfig.isCatalog && editedData.items && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mt-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {Array.isArray(editedData.items) ? editedData.items.length : 0} items in catalog
            </span>
          </div>
        </div>
      )}
    </div>
  );
};


/* =========================================================
   TABLE VIEWER COMPONENT
========================================================= */
const TableViewer = ({ config, userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Handle subcollections differently
      if (config.isSubcollection) {
        // Subcollections are handled by SubcollectionViewer
        setLoading(false);
        return;
      }
      
      const path = config.path(userId);
      const docRef = doc(db, ...path.split('/'));
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [config, userId, db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (updatedData) => {
    try {
      const path = config.path(userId);
      const docRef = doc(db, ...path.split('/'));
      
      const dataToSave = {
        ...updatedData,
        _updatedat: serverTimestamp()
      };
      
      await setDoc(docRef, dataToSave, { merge: true });
      // Don't set data here, let Firestore's serverTimestamp resolve
      // and then rely on a refresh or just trust the save.
      // Setting it locally creates a mismatch with the { _updatedat: "pending" } object
      setData(updatedData); // Compromise: set the user's data
      alert('Saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${config.name} document?`)) {
      return;
    }
    
    try {
      const path = config.path(userId);
      const docRef = doc(db, ...path.split('/'));
      await deleteDoc(docRef);
      setData(null);
      alert('Deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  if (config.isSubcollection) {
    return <SubcollectionViewer tableConfig={config} userId={userId} />;
  }

  if (loading) {
    return <LoadingState message={`Loading ${config.name}...`} />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <div className="flex items-center gap-3 text-red-800">
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <Button onClick={loadData} variant="danger" size="sm" className="mt-4">
          <RefreshCw size={16} />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TableDataEditor 
      tableConfig={config}
      data={data}
      onSave={handleSave}
      onDelete={!config.isCatalog ? handleDelete : null}
      userId={userId}
    />
  );
};

/* =========================================================
   MAIN ADMIN COMPONENT
========================================================= */
export default function AdminDataMaintenance() {
  const services = useAppServices();
  const { userId, isAdmin, navigate } = services || {};
  
  const [activeGroup, setActiveGroup] = useState('user_data');
  const [activeTable, setActiveTable] = useState(null);
  const [targetUserId, setTargetUserId] = useState(userId || '');

  // Set initial table when group changes
  useEffect(() => {
    if (activeGroup) {
      const group = MODULE_GROUPS[activeGroup];
      const firstTable = Object.keys(group.tables)[0];
      setActiveTable(firstTable);
    }
  }, [activeGroup]);

  useEffect(() => {
    if (userId && !targetUserId) {
      setTargetUserId(userId);
    }
  }, [userId, targetUserId]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-6">
        <Card accentColor="bg-red-600">
          <div className="text-center p-8">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold mb-2 text-corporate-navy">
              Access Denied
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              You need admin privileges to access this page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const currentGroup = MODULE_GROUPS[activeGroup];
  const currentTable = activeTable ? currentGroup.tables[activeTable] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-corporate-navy">
                Admin Data Maintenance
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Comprehensive database management with full CRUD operations
              </p>
            </div>
            
            {!currentGroup?.isGlobal && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-corporate-navy">
                  User ID:
                </label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter user ID..."
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono w-64 focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                />
              </div>
            )}
          </div>
          <div className="mt-4">
             <Button onClick={() => navigate('admin-functions')} variant="nav-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin Functions
             </Button>
          </div>
        </div>
      </div>

      {/* Module Group Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {Object.entries(MODULE_GROUPS).map(([key, group]) => {
            const Icon = group.icon;
            const isActive = activeGroup === key;
            
            return (
              <button
                key={key}
                onClick={() => setActiveGroup(key)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-4 whitespace-nowrap ${
                  isActive 
                    ? 'border-current' 
                    : 'border-transparent hover:bg-slate-50'
                }`}
                style={{ 
                  color: isActive ? (group.color.includes('text-') ? '' : group.color) : '#64748b',
                  borderColor: isActive ? (group.color.includes('text-') ? '' : group.color) : 'transparent'
                }}
              >
                <div className={isActive ? group.color : ''}>
                    <Icon size={20} />
                </div>
                <span className={isActive ? group.color : ''}>{group.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Table List */}
          <div className="col-span-12 lg:col-span-3">
            <Card accentColor={currentGroup.accentColor}>
              <h3 className="text-lg font-bold mb-4 text-corporate-navy">
                {currentGroup.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {currentGroup.description}
              </p>
              
              <div className="space-y-1">
                {Object.entries(currentGroup.tables).map(([key, table]) => {
                  const isActive = activeTable === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTable(key)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive 
                          ? 'bg-white dark:bg-slate-800 shadow-md border-l-4' 
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                      style={{
                        borderColor: isActive ? (currentGroup.accentColor.replace('bg-', '')) : 'transparent',
                        color: isActive ? '#002E47' : '#64748b'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{table.name}</span>
                        {table.isCatalog && (
                          <Badge variant="purple" size="sm">Catalog</Badge>
                        )}
                        {table.isSubcollection && (
                          <Badge variant="primary" size="sm">Collection</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main Content - Table Editor */}
          <div className="col-span-12 lg:col-span-9">
            {currentTable && (currentGroup.isGlobal || targetUserId) ? (
              <Card 
                title={currentTable.name}
                icon={Database}
                accentColor={currentGroup.accentColor}
              >
                <TableViewer
                  groupKey={activeGroup}
                  tableKey={activeTable}
                  config={currentTable}
                  userId={targetUserId}
                />
              </Card>
            ) : (
              <Card accentColor={currentGroup.accentColor}>
                <div className="p-12 text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-bold mb-2 text-corporate-navy">
                    Enter a User ID
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Please enter a user ID above to view and edit their data
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card accentColor="bg-blue-600">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-2">Database Paths (lowercase keys)</p>
                <ul className="text-blue-800 space-y-1.5 leading-relaxed">
                  <li>• User Profile: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">users/{'{userId}'}</code></li>
                  <li>• Development Plan: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">modules/{'{userId}'}/development_plan/current</code></li>
                  <li>• Daily Practice: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">modules/{'{userId}'}/daily_practice/current</code></li>
                  <li>• Reflection History: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">modules/{'{userId}'}/daily_practice/reflection_history</code></li>
                  <li>• Strategic Content: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">modules/{'{userId}'}/strategic_content/vision_mission</code></li>
                  <li>• Global Metadata: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">metadata/config</code></li>
                  <li>• Catalogs: <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs">metadata/config/catalog/{'{catalog_name}'}</code></li>
                </ul>
              </div>
            </div>
          </Card>
          
          <Card accentColor="bg-purple-600">
            <div className="flex items-start gap-3">
              <Settings className="text-purple-600 flex-shrink-0 mt-1" size={20} />
              <div className="text-sm">
                <p className="font-semibold text-purple-900 mb-2">Important Notes</p>
                <div className="text-purple-800 space-y-2">
                  <div>
                    <p className="font-medium">All field keys are lowercase:</p>
                    <code className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-xs block mt-1">
                      {'userid, displayname, createdat, etc.'}
                    </code>
                  </div>
                  <div>
                    <p className="font-medium mt-2">Catalog structure:</p>
                    <code className="bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-xs block mt-1">
                      {'{ items: [...] }'}
                    </code>
                  </div>
                  <div>
                    <p className="font-medium mt-2">Subcollections:</p>
                    <p className="text-xs mt-1">Reflection history stores multiple entries as separate documents in a subcollection</p>
                  </div>
                  <p className="text-xs text-purple-700 mt-2 flex items-start gap-1">
                    <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                    Empty catalogs will cause dashboard errors. Ensure all catalogs are populated.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
