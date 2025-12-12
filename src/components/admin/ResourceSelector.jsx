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
  PlusCircle
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getAllContentAdmin, CONTENT_COLLECTIONS } from '../../services/contentService';
import { UNIFIED_COLLECTION, CONTENT_TYPES as UNIFIED_TYPES } from '../../services/unifiedContentService';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const ResourceSelector = ({ value, onChange, resourceType = 'content' }) => {
  const { db } = useAppServices();
  const [isOpen, setIsOpen] = useState(false);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);



  // Effect 1: Load all resources when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadResources = async () => {
      setLoading(true);
      try {
        // Determine which collections to fetch based on type
        let collections = [];
        let unifiedTypes = [];

        switch (resourceType) {
          case 'content':
            // Fetch from Wrappers (Videos, Docs, Courses) AND Unified Library (Read & Reps)
            collections = [
              CONTENT_COLLECTIONS.VIDEOS, 
              CONTENT_COLLECTIONS.DOCUMENTS, 
              CONTENT_COLLECTIONS.COURSES,
              CONTENT_COLLECTIONS.READINGS // Keep for legacy support
            ];
            unifiedTypes = [UNIFIED_TYPES.READ_REP];
            break;
          case 'community':
            collections = [CONTENT_COLLECTIONS.COMMUNITY];
            break;
          case 'coaching':
            collections = [CONTENT_COLLECTIONS.COACHING];
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
                       col === CONTENT_COLLECTIONS.COMMUNITY ? 'community' : 'coaching';
          
          allResources = [...allResources, ...data.map(item => ({ ...item, resourceType: type }))];
        }

        // 2. Fetch Unified Content (if needed)
        if (unifiedTypes.length > 0) {
          try {
            const unifiedRef = collection(db, UNIFIED_COLLECTION);
            // Fetch all and filter in memory for simplicity, or use 'in' query
            const q = query(unifiedRef, where('type', 'in', unifiedTypes));
            const snapshot = await getDocs(q);
            const unifiedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            allResources = [...allResources, ...unifiedData.map(item => ({ 
              ...item, 
              resourceType: item.type === UNIFIED_TYPES.READ_REP ? 'read_rep' : 'unified' 
            }))];
          } catch (err) {
            console.error("Error fetching unified content:", err);
          }
        }
        
        setResources(allResources);
      } catch (error) {
        console.error("Error loading resources:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [isOpen, resourceType, db]);

  // Effect 2: Sync selectedResource with value
  useEffect(() => {
    if (!value) {
      if (selectedResource) setSelectedResource(null);
      return;
    }

    // If we already have the correct resource selected, do nothing
    if (selectedResource && selectedResource.id === value) return;

    // Try to find in currently loaded list
    const found = resources.find(r => r.id === value);
    if (found) {
      setSelectedResource(found);
      return;
    }

    // If not found in list, fetch individual
    const loadSingle = async () => {
      try {
        // We check both collections if type is content, or specific if known
        const collections = resourceType === 'content' 
          ? [CONTENT_COLLECTIONS.VIDEOS, CONTENT_COLLECTIONS.READINGS]
          : resourceType === 'community' ? [CONTENT_COLLECTIONS.COMMUNITY]
          : [CONTENT_COLLECTIONS.COACHING];

        for (const col of collections) {
          const docRef = doc(db, col, value);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const type = col === CONTENT_COLLECTIONS.VIDEOS ? 'video' : 
                         col === CONTENT_COLLECTIONS.READINGS ? 'reading' :
                         col === CONTENT_COLLECTIONS.COMMUNITY ? 'community' : 'coaching';
            setSelectedResource({ id: snap.id, ...snap.data(), resourceType: type });
            return;
          }
        }
      } catch (e) {
        console.error("Error loading single resource:", e);
      }
    };

    loadSingle();
  }, [value, resources, selectedResource, db, resourceType]);

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (resource) => {
    setSelectedResource(resource);
    onChange(resource.id, resource);
    setIsOpen(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video': return Film;
      case 'reading': return FileText;
      case 'community': return Users;
      case 'coaching': return MessageSquare;
      default: return LinkIcon;
    }
  };

  return (
    <div className="relative">
      {/* Selected Value Display */}
      <div 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 p-2 border rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors min-h-[42px]"
      >
        {selectedResource ? (
          <>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              selectedResource.resourceType === 'video' ? 'bg-red-100 text-red-600' :
              selectedResource.resourceType === 'reading' ? 'bg-blue-100 text-blue-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {React.createElement(getIcon(selectedResource.resourceType), { size: 14 })}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedResource.title}</p>
            </div>
            <div className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded">
              {selectedResource.resourceType}
            </div>
          </>
        ) : (
          <span className="text-sm text-slate-400 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Select Resource...
          </span>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Select Resource</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
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
                    const isSelected = value === resource.id;
                    
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
