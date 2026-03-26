import { create } from 'zustand';
import { 
  collection, 
  doc,
  getDoc,
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Firestore collection paths
const BOOK_COLLECTION = 'book';
const METADATA_DOC = 'metadata';
const SOURCES_COLLECTION = 'book_sources';
const CHAPTERS_COLLECTION = 'book_chapters';

// Source types
export const SOURCE_TYPES = [
  { id: 'field_guide', label: 'Field Guide', color: 'blue' },
  { id: 'session_guide', label: 'Session Guide', color: 'purple' },
  { id: 'website', label: 'Website Copy', color: 'green' },
  { id: 'transcript', label: 'Transcript', color: 'orange' },
  { id: 'notes', label: 'Notes/Ideas', color: 'yellow' },
  { id: 'research', label: 'Research', color: 'pink' },
  { id: 'case_study', label: 'Case Study', color: 'teal' },
  { id: 'other', label: 'Other', color: 'gray' },
];

// Chapter statuses
export const CHAPTER_STATUSES = [
  { id: 'outline', label: 'Outline', color: 'gray' },
  { id: 'drafting', label: 'Drafting', color: 'yellow' },
  { id: 'review', label: 'In Review', color: 'blue' },
  { id: 'editing', label: 'Editing', color: 'purple' },
  { id: 'complete', label: 'Complete', color: 'green' },
];

// Book statuses
export const BOOK_STATUSES = [
  { id: 'planning', label: 'Planning' },
  { id: 'outlining', label: 'Outlining' },
  { id: 'drafting', label: 'Drafting' },
  { id: 'editing', label: 'Editing' },
  { id: 'complete', label: 'Complete' },
];

export const useBookStore = create((set, get) => ({
  // ==================== STATE ====================
  
  // Book metadata
  metadata: null,
  metadataLoading: true,
  
  // Sources
  sources: [],
  sourcesLoading: true,
  selectedSource: null,
  
  // Chapters
  chapters: [],
  chaptersLoading: true,
  selectedChapter: null,
  
  // UI state
  activeTab: 'dashboard', // 'dashboard' | 'sources' | 'outline' | 'chapters'
  sourceFilters: {
    search: '',
    type: 'all',
  },
  
  // Unsubscribe functions for real-time listeners
  _unsubscribers: [],

  // ==================== METADATA ====================
  
  loadMetadata: async () => {
    set({ metadataLoading: true });
    try {
      const docRef = doc(db, BOOK_COLLECTION, METADATA_DOC);
      const snap = await getDoc(docRef);
      
      if (snap.exists()) {
        set({ metadata: { id: snap.id, ...snap.data() }, metadataLoading: false });
      } else {
        // Create default metadata
        const defaultMetadata = {
          title: 'Untitled Book',
          subtitle: '',
          authors: [],
          targetAudience: '',
          tone: '',
          styleGuide: '',
          status: 'planning',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await updateDoc(docRef, defaultMetadata).catch(() => {
          // Doc doesn't exist, create it
          return addDoc(collection(db, BOOK_COLLECTION), { ...defaultMetadata, _isMetadata: true });
        });
        set({ metadata: defaultMetadata, metadataLoading: false });
      }
    } catch (err) {
      console.error('Error loading book metadata:', err);
      set({ metadataLoading: false });
    }
  },
  
  updateMetadata: async (updates) => {
    try {
      const docRef = doc(db, BOOK_COLLECTION, METADATA_DOC);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        // If doc doesn't exist, set it
        await setDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      });
      set(state => ({
        metadata: { ...state.metadata, ...updates }
      }));
      toast.success('Book details saved');
    } catch (err) {
      console.error('Error updating metadata:', err);
      toast.error('Failed to save book details');
    }
  },

  // ==================== SOURCES ====================
  
  subscribeToSources: () => {
    const q = query(collection(db, SOURCES_COLLECTION), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sources = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ sources, sourcesLoading: false });
    }, (err) => {
      console.error('Error subscribing to sources:', err);
      set({ sourcesLoading: false });
    });
    
    // Store unsubscribe function
    set(state => ({
      _unsubscribers: [...state._unsubscribers, unsubscribe]
    }));
    
    return unsubscribe;
  },
  
  addSource: async (sourceData, userEmail) => {
    try {
      const newSource = {
        title: sourceData.title || 'Untitled Source',
        type: sourceData.type || 'other',
        content: sourceData.content || '',
        tags: sourceData.tags || [],
        notes: sourceData.notes || '',
        uploadedBy: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, SOURCES_COLLECTION), newSource);
      toast.success('Source added');
      return docRef.id;
    } catch (err) {
      console.error('Error adding source:', err);
      toast.error('Failed to add source');
      return null;
    }
  },
  
  updateSource: async (sourceId, updates) => {
    try {
      const docRef = doc(db, SOURCES_COLLECTION, sourceId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      toast.success('Source updated');
    } catch (err) {
      console.error('Error updating source:', err);
      toast.error('Failed to update source');
    }
  },
  
  deleteSource: async (sourceId) => {
    try {
      await deleteDoc(doc(db, SOURCES_COLLECTION, sourceId));
      set(state => ({
        selectedSource: state.selectedSource?.id === sourceId ? null : state.selectedSource
      }));
      toast.success('Source deleted');
    } catch (err) {
      console.error('Error deleting source:', err);
      toast.error('Failed to delete source');
    }
  },
  
  setSelectedSource: (source) => set({ selectedSource: source }),
  
  getFilteredSources: () => {
    const { sources, sourceFilters } = get();
    
    return sources.filter(s => {
      // Search filter
      if (sourceFilters.search) {
        const search = sourceFilters.search.toLowerCase();
        const matchesSearch = 
          s.title?.toLowerCase().includes(search) ||
          s.content?.toLowerCase().includes(search) ||
          s.tags?.some(t => t.toLowerCase().includes(search));
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (sourceFilters.type !== 'all' && s.type !== sourceFilters.type) {
        return false;
      }
      
      return true;
    });
  },
  
  setSourceFilters: (filters) => set(state => ({
    sourceFilters: { ...state.sourceFilters, ...filters }
  })),

  // ==================== CHAPTERS ====================
  
  subscribeToChapters: () => {
    const q = query(collection(db, CHAPTERS_COLLECTION), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chapters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ chapters, chaptersLoading: false });
    }, (err) => {
      console.error('Error subscribing to chapters:', err);
      set({ chaptersLoading: false });
    });
    
    // Store unsubscribe function
    set(state => ({
      _unsubscribers: [...state._unsubscribers, unsubscribe]
    }));
    
    return unsubscribe;
  },
  
  addChapter: async (chapterData, userEmail) => {
    try {
      const { chapters } = get();
      const maxOrder = chapters.reduce((max, c) => Math.max(max, c.order || 0), 0);
      
      const newChapter = {
        order: maxOrder + 1,
        title: chapterData.title || 'Untitled Chapter',
        summary: chapterData.summary || '',
        status: 'outline',
        sourceRefs: chapterData.sourceRefs || [],
        content: chapterData.content || '',
        notes: chapterData.notes || '',
        createdBy: userEmail,
        lastEditedBy: userEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, CHAPTERS_COLLECTION), newChapter);
      toast.success('Chapter added');
      return docRef.id;
    } catch (err) {
      console.error('Error adding chapter:', err);
      toast.error('Failed to add chapter');
      return null;
    }
  },
  
  updateChapter: async (chapterId, updates, userEmail) => {
    try {
      const docRef = doc(db, CHAPTERS_COLLECTION, chapterId);
      await updateDoc(docRef, {
        ...updates,
        lastEditedBy: userEmail,
        updatedAt: serverTimestamp(),
      });
      // Don't show toast for content updates (too noisy)
      if (!updates.content) {
        toast.success('Chapter updated');
      }
    } catch (err) {
      console.error('Error updating chapter:', err);
      toast.error('Failed to update chapter');
    }
  },
  
  deleteChapter: async (chapterId) => {
    try {
      await deleteDoc(doc(db, CHAPTERS_COLLECTION, chapterId));
      set(state => ({
        selectedChapter: state.selectedChapter?.id === chapterId ? null : state.selectedChapter
      }));
      toast.success('Chapter deleted');
    } catch (err) {
      console.error('Error deleting chapter:', err);
      toast.error('Failed to delete chapter');
    }
  },
  
  reorderChapters: async (reorderedChapters) => {
    try {
      const batch = writeBatch(db);
      
      reorderedChapters.forEach((chapter, index) => {
        const docRef = doc(db, CHAPTERS_COLLECTION, chapter.id);
        batch.update(docRef, { order: index + 1 });
      });
      
      await batch.commit();
      toast.success('Chapter order saved');
    } catch (err) {
      console.error('Error reordering chapters:', err);
      toast.error('Failed to save chapter order');
    }
  },
  
  setSelectedChapter: (chapter) => set({ selectedChapter: chapter }),

  // ==================== UI ====================
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // ==================== COMPUTED ====================
  
  getProgress: () => {
    const { chapters } = get();
    if (chapters.length === 0) return { total: 0, complete: 0, percent: 0 };
    
    const complete = chapters.filter(c => c.status === 'complete').length;
    return {
      total: chapters.length,
      complete,
      percent: Math.round((complete / chapters.length) * 100)
    };
  },
  
  getSourcesByChapter: (chapterId) => {
    const { sources, chapters } = get();
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter?.sourceRefs?.length) return [];
    
    return sources.filter(s => chapter.sourceRefs.includes(s.id));
  },

  // ==================== CLEANUP ====================
  
  cleanup: () => {
    const { _unsubscribers } = get();
    _unsubscribers.forEach(unsub => unsub());
    set({ _unsubscribers: [] });
  },
}));
