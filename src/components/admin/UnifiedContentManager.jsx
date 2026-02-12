// src/components/admin/UnifiedContentManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, 
  Dumbbell, 
  BookOpen, 
  Wrench, 
  Zap, 
  Film,
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getUnifiedContent, 
  deleteUnifiedContent,
  CONTENT_TYPES 
} from '../../services/unifiedContentService';
import GenericContentEditor from './content-editors/GenericContentEditor';

const TABS = [
  { id: CONTENT_TYPES.PROGRAM, label: 'Programs', icon: Layout },
  { id: CONTENT_TYPES.WORKOUT, label: 'Workouts', icon: Dumbbell },
  { id: CONTENT_TYPES.SKILL, label: 'Skills', icon: Zap },
  // { id: CONTENT_TYPES.READ_REP, label: 'Read & Reps', icon: BookOpen },
  // { id: CONTENT_TYPES.VIDEO, label: 'Videos', icon: Film },
  // { id: CONTENT_TYPES.TOOL, label: 'Tools', icon: Wrench },
];

const UnifiedContentManager = () => {
  const { db } = useAppServices();
  const [activeTab, setActiveTab] = useState(CONTENT_TYPES.PROGRAM);
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('LIST'); // LIST | EDIT
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      // skipVisibilityMerge: true ensures we only see items with exact type match
      // ... rest of function
      const data = await getUnifiedContent(db, activeTab, { skipVisibilityMerge: true });
      setContentList(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }, [db, activeTab]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleAddNew = () => {
    setSelectedItem(null);
    setViewMode('EDIT');
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setViewMode('EDIT');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteUnifiedContent(db, id);
        loadContent();
      } catch (error) {
        alert('Failed to delete item');
      }
    }
  };

  const handleSaveComplete = () => {
    setViewMode('LIST');
    loadContent();
  };

  // Filter list
  const filteredList = contentList.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewMode === 'EDIT') {
    return (
      <GenericContentEditor 
        item={selectedItem} 
        type={activeTab}
        onSave={handleSaveComplete}
        onCancel={() => setViewMode('LIST')}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Unified Content Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage Programs, Workouts, and Resources</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add {TABS.find(t => t.id === activeTab)?.label.slice(0, -1) || 'Item'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white dark:bg-slate-800 border-r flex flex-col">
          <div className="p-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Library Sections
            </div>
            <nav className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b bg-white dark:bg-slate-800 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 text-gray-600 dark:text-gray-300">
              <Filter size={18} />
              Filters
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-dashed">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
                  {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Layout, { size: 48 })}
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No content found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Get started by creating a new {activeTab.toLowerCase()}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredList.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg border hover:shadow-md transition-shadow flex justify-between items-center group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        item.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Layout, { size: 24 })}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{item.description || 'No description'}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {item.difficulty || 'No Level'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.status === 'PUBLISHED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedContentManager;
