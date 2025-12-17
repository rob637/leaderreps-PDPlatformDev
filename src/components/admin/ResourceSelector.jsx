import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Film, 
  Link as LinkIcon, 
  Check,
  Loader,
  BookOpen,
  Users,
  MessageSquare,
  PlusCircle,
  Layers
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getAllContentAdmin, CONTENT_COLLECTIONS } from '../../services/contentService';
import { UNIFIED_COLLECTION, CONTENT_TYPES as UNIFIED_TYPES } from '../../services/unifiedContentService';
import { COMMUNITY_SESSION_TYPES_COLLECTION, COACHING_SESSION_TYPES_COLLECTION } from '../../data/Constants';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const ResourceSelector = ({ value, onChange, resourceType = 'content' }) => {
  const { db } = useAppServices();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(resourceType);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  // Normalize value - can be either a string ID or an object with id property
  const valueId = typeof value === 'string' ? value : value?.id || null;

  // Update active category if prop changes, but only if modal is closed (to avoid jumping while user is interacting)
  useEffect(() => {
    if (!isOpen) {
      setActiveCategory(resourceType);
    }
  }, [resourceType, isOpen]);

  // Effect 1: Load all resources when modal opens or category changes
  useEffect(() => {
    if (!isOpen) return;
    if (!db) {
      console.warn('[ResourceSelector] db not available yet');
      return;
    }

    const loadResources = async () => {
      setLoading(true);
      console.log('[ResourceSelector] Loading resources for category:', activeCategory);
      try {
        // Determine which collections to fetch based on active category
        let collections = [];
        let unifiedTypes = [];

        switch (activeCategory) {
          case 'content':
            // Fetch from Wrappers (Videos, Docs, Courses) and Unified (Read & Reps)
            collections = [
              CONTENT_COLLECTIONS.VIDEOS, 
              CONTENT_COLLECTIONS.DOCUMENTS,
              CONTENT_COLLECTIONS.COURSES
            ];
            // Fetch Read & Reps from Unified Collection
            // Use explicit string 'READ_REP' as fallback if constant is missing
            unifiedTypes = [UNIFIED_TYPES?.READ_REP || 'READ_REP'];
            console.log('[ResourceSelector] Fetching Unified Types:', unifiedTypes);
            break;
          case 'community':
            collections = [COMMUNITY_SESSION_TYPES_COLLECTION];
            break;
          case 'coaching':
            collections = [COACHING_SESSION_TYPES_COLLECTION];
            break;
          default:
            collections = [CONTENT_COLLECTIONS.READINGS];
        }

        let allResources = [];
        
        // 1. Fetch Standard Collections
        for (const col of collections) {
          const data = await getAllContentAdmin(db, col);
          // Add type info
          const type = col === CONTENT_COLLECTIONS.VIDEOS ? 'video' : 
                       col === CONTENT_COLLECTIONS.DOCUMENTS ? 'document' :
                       col === CONTENT_COLLECTIONS.READINGS ? 'reading' : // Legacy
                       col === CONTENT_COLLECTIONS.COURSES ? 'course' :
                       col === COMMUNITY_SESSION_TYPES_COLLECTION ? 'community' : 
                       col === COACHING_SESSION_TYPES_COLLECTION ? 'coaching' : 'unknown';
          
          allResources = [...allResources, ...data.map(item => ({ ...item, resourceType: type }))];
        }

        // 2. Fetch Unified Content (if needed)
        if (unifiedTypes.length > 0) {
          try {
            console.log('[ResourceSelector] Querying Unified Collection:', UNIFIED_COLLECTION, 'for types:', unifiedTypes);
            const unifiedRef = collection(db, UNIFIED_COLLECTION);
            const q = query(unifiedRef, where('type', 'in', unifiedTypes));
            const snapshot = await getDocs(q);
            console.log('[ResourceSelector] Unified Snapshot size:', snapshot.size);
            
            const unifiedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            allResources = [...allResources, ...unifiedData.map(item => {
              let type = 'unified';
              const itemType = item.type || '';
              if (itemType === (UNIFIED_TYPES?.READ_REP || 'READ_REP')) type = 'read_rep';
              else if (itemType === (UNIFIED_TYPES?.VIDEO || 'VIDEO') || itemType === (UNIFIED_TYPES?.REP || 'REP')) type = 'video';
              
              return { 
                ...item, 
                resourceType: type,
                url: item.url || item.videoUrl || item.link || ''
              };
            })];
          } catch (err) {
            console.error("Error fetching unified content:", err);
          }
        }
        
        console.log('[ResourceSelector] Loaded', allResources.length, 'resources');
        setResources(allResources);
      } catch (error) {
        console.error("[ResourceSelector] Error loading resources:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [isOpen, activeCategory, db]);

  // Effect 2: Sync selectedResource with value
  useEffect(() => {
    if (!valueId) {
      if (selectedResource) setSelectedResource(null);
      return;
    }

    // If we already have the correct resource selected, do nothing
    if (selectedResource && selectedResource.id === valueId) return;

    // Try to find in currently loaded list
    const found = resources.find(r => r.id === valueId);
    if (found) {
      setSelectedResource(found);
      return;
    }

    // If not found in list, fetch individual
    const loadSingle = async () => {
      try {
        // Check ALL possible collections to ensure we find it regardless of current category
        const allCollections = [
          CONTENT_COLLECTIONS.VIDEOS, 
          CONTENT_COLLECTIONS.READINGS,
          CONTENT_COLLECTIONS.DOCUMENTS,
          CONTENT_COLLECTIONS.COURSES,
          COMMUNITY_SESSION_TYPES_COLLECTION,
          COACHING_SESSION_TYPES_COLLECTION
        ];

        for (const col of allCollections) {
          const docRef = doc(db, col, valueId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            let type = 'video';
            if (col === CONTENT_COLLECTIONS.READINGS) type = 'reading';
            else if (col === CONTENT_COLLECTIONS.DOCUMENTS) type = 'document';
            else if (col === CONTENT_COLLECTIONS.COURSES) type = 'course';
            else if (col === COMMUNITY_SESSION_TYPES_COLLECTION) type = 'community';
            else if (col === COACHING_SESSION_TYPES_COLLECTION) type = 'coaching';

            setSelectedResource({ id: snap.id, ...snap.data(), resourceType: type });
            return;
          }
        }

        // Check Unified Collection (for Read & Reps)
        const unifiedRef = doc(db, UNIFIED_COLLECTION, valueId);
        const unifiedSnap = await getDoc(unifiedRef);
        if (unifiedSnap.exists()) {
          const data = unifiedSnap.data();
          setSelectedResource({ 
            id: unifiedSnap.id, 
            ...data, 
            resourceType: data.type === UNIFIED_TYPES.READ_REP ? 'read_rep' : 'unified' 
          });
          return;
        }
      } catch (e) {
        console.error("Error loading single resource:", e);
      }
    };

    loadSingle();
  }, [valueId, resources, selectedResource, db]);

  // Effect 3: Set active category based on selected resource when modal opens
  useEffect(() => {
    if (isOpen && selectedResource) {
      const type = selectedResource.resourceType;
      if (type === 'community') setActiveCategory('community');
      else if (type === 'coaching') setActiveCategory('coaching');
      else setActiveCategory('content');
    }
  }, [isOpen, selectedResource]);

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (resource) => {
    setSelectedResource(resource);
    onChange(resource.id, resource);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedResource(null);
    onChange(null, null);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video': return Film;
      case 'reading': return BookOpen;
      case 'document': return FileText;
      case 'course': return Layers;
      case 'community': return Users;
      case 'coaching': return MessageSquare;
      default: return LinkIcon;
    }
  };

  return (
    <div className="relative">
      {/* Selected Value Display */}
      <div 
        onClick={() => {
          console.log('[ResourceSelector] Click - opening modal');
          setIsOpen(true);
        }}
        className="flex items-center gap-2 p-2 border rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors min-h-[38px]"
      >
        {selectedResource ? (
          <>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              selectedResource.resourceType === 'video' ? 'bg-red-100 text-red-600' :
              selectedResource.resourceType === 'reading' ? 'bg-blue-100 text-blue-600' :
              selectedResource.resourceType === 'document' ? 'bg-orange-100 text-orange-600' :
              selectedResource.resourceType === 'course' ? 'bg-purple-100 text-purple-600' :
              selectedResource.resourceType === 'community' ? 'bg-green-100 text-green-600' :
              selectedResource.resourceType === 'coaching' ? 'bg-indigo-100 text-indigo-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {React.createElement(getIcon(selectedResource.resourceType), { size: 12 })}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{selectedResource.title}</p>
            </div>
            <button 
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            Select Resource...
          </span>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Select Resource</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b bg-white">
              {['content', 'community', 'coaching'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeCategory === cat 
                      ? 'border-corporate-teal text-corporate-teal bg-teal-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-4 border-b bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No resources found.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredResources.map(resource => {
                    const Icon = getIcon(resource.resourceType);
                    const isSelected = valueId === resource.id;
                    
                    return (
                      <div
                        key={resource.id}
                        onClick={() => handleSelect(resource)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          resource.resourceType === 'video' ? 'bg-red-100 text-red-600' :
                          resource.resourceType === 'reading' ? 'bg-blue-100 text-blue-600' :
                          resource.resourceType === 'document' ? 'bg-orange-100 text-orange-600' :
                          resource.resourceType === 'course' ? 'bg-purple-100 text-purple-600' :
                          resource.resourceType === 'community' ? 'bg-green-100 text-green-600' :
                          resource.resourceType === 'coaching' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon size={16} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? 'text-teal-900' : 'text-slate-800'}`}>
                            {resource.title}
                          </p>
                          {resource.description && (
                            <p className="text-xs text-slate-500 truncate">
                              {resource.description}
                            </p>
                          )}
                        </div>

                        {isSelected && <Check className="w-5 h-5 text-teal-600" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - Create New */}
            <div className="p-3 border-t bg-slate-50 flex justify-between items-center">
              <span className="text-xs text-slate-500">Can't find what you're looking for?</span>
              <a 
                href="/admin/content" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-corporate-teal hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                Manage Resources
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceSelector;
