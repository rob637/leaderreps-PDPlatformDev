// src/components/admin/SingleTypeContentManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search,
  Edit,
  Trash2,
  Loader,
  ArrowLeft
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getUnifiedContent, 
  deleteUnifiedContent
} from '../../services/unifiedContentService';
import GenericContentEditor from './content-editors/GenericContentEditor';
import { BreadcrumbNav } from '../ui/BreadcrumbNav';

const SingleTypeContentManager = ({ type, title, description, icon: Icon }) => {
  const { db, navigate } = useAppServices();
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('LIST'); // LIST | EDIT
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      // skipVisibilityMerge: true ensures we only see items with exact type match
      const data = await getUnifiedContent(db, type, { skipVisibilityMerge: true });
      setContentList(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }, [db, type]);

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
        type={type}
        onSave={handleSaveComplete}
        onCancel={() => setViewMode('LIST')}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <BreadcrumbNav 
        items={[
          { label: 'Admin Command Center', path: 'admin-portal' },
          { label: 'Content Library', path: 'admin-portal', params: { tab: 'content' } },
          { label: title, path: null }
        ]}
        navigate={navigate}
      />
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {Icon && <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg"><Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" /></div>}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder={`Search ${title}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">No items found.</p>
              <button onClick={handleAddNew} className="text-corporate-teal font-bold mt-2 hover:underline">
                Create your first one
              </button>
            </div>
          ) : (
            filteredList.map(item => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 rounded-xl hover:border-slate-300 transition-all group"
              >
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{item.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.difficulty} • {item.estimatedTime} min
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default SingleTypeContentManager;
