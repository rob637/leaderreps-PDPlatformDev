// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
// ... (rest of imports)

// ---- Helper: Resolve/normalize global metadata shape ----
function resolveGlobalMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const knownKeys = new Set([
    'LEADERSHIP_DOMAINS','RESOURCE_LIBRARY','READING_CATALOG_SERVICE',
    'COMMITMENT_BANK','SCENARIO_CATALOG','TARGET_REP_CATALOG','LEADERSHIP_TIERS', 'GLOBAL_SETTINGS', 'VIDEO_CATALOG'
  ]);
  const hasKnown = Object.keys(meta).some(k => knownKeys.has(k));
  let payload = hasKnown ? meta : (meta.config || meta.global || meta.data || meta.payload || {});
  if (payload && !payload.SCENARIO_CATALOG && Array.isArray(meta.QUICK_CHALLENGE_CATALOG)) {
    payload = { ...payload, SCENARIO_CATALOG: meta.QUICK_CHALLENGE_CATALOG };
  }
  if (payload && !payload.TARGET_REP_CATALOG && Array.isArray(meta.TARGET_REPS)) {
    payload = { ...payload, TARGET_REP_CATALOG: meta.TARGET_REPS };
  }
  if (payload && !payload.RESOURCE_LIBRARY && meta.RESOURCE_CONTENT_LIBRARY) {
    payload = { ...payload, RESOURCE_LIBRARY: meta.RESOURCE_CONTENT_LIBRARY };
  }
  if (payload && !payload.READING_CATALOG_SERVICE && meta.READING_CATALOG) {
    payload = { ...payload, READING_CATALOG_SERVICE: meta.READING_CATALOG };
  }
  if (payload && !payload.READING_CATALOG_SERVICE && meta.READING_LIBRARY) {
    payload = { ...payload, RESOURCE_LIBRARY: meta.RESOURCE_CONTENT_LIBRARY };
  }
  return payload || {};
}

/* =========================================================
   PALETTE
========================================================= */
const COLORS = {
  NAVY: '#002E47',
  TEAL: '#47A88D',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  LIGHT_GRAY: '#FCFCFA',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
};

const PASSWORD = '7777';
const ADMIN_SESSION_KEY = 'admin_maintenance_logged_in';

// ... (Card, Button, generateId, useArrayDataCRUD, GenericRowEditor remain the same) ...

// --- CSV Upload ---
const CSVUploadComponent = ({ onDataParsed, expectedFields, isSaving, buttonText = 'Mass Upload (.csv)' }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'pending'

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('pending');
    const reader = new FileReader();

    reader.onload = (e) => {
      const csvText = e.target.result;
      try {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length <= 1) throw new Error('CSV must contain a header row and at least one data row.');

        const headers = lines[0].split(',').map(h => h.trim().replace(/\"/g, ''));
        const requiredHeaders = expectedFields.map(f => f.key);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`);
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/\"/g, ''));
          const item = {};
          headers.forEach((header, index) => {
            const fieldType = expectedFields.find(f => f.key === header)?.type;
            if (fieldType === 'number') item[header] = parseInt(values[index]) || 0;
            else item[header] = values[index];
          });
          if (!item.id) item.id = generateId();
          data.push(item);
        }

        onDataParsed(data);
        setStatus('success');
      } catch (error) {
        setStatus('error');
        console.error('CSV Parsing Error:', error);
        alert(`Error parsing CSV: ${error.message}`);
      } finally {
        event.target.value = null;
      }
    };

    reader.readAsText(file);
  };

  const StatusIcon = status === 'success' ? CheckCircle : status === 'error' ? AlertTriangle : FileText;
  const StatusColor = status === 'success' ? COLORS.GREEN : status === 'error' ? COLORS.ORANGE : COLORS.TEAL;

  return (
    <div className='inline-block'>
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} disabled={isSaving} />
      <Button
        onClick={() => fileInputRef.current.click()}
        disabled={isSaving}
        variant={status === 'success' ? 'primary' : 'outline'}
        style={{ borderColor: StatusColor, color: StatusColor }}
        className='flex items-center justify-center'
      >
        <UploadCloud className='w-5 h-5 mr-2' />
        {status === 'success' ? 'Data Staged (Review Now)' : status === 'error' ? 'Parsing Failed (Re-upload)' : buttonText}
      </Button>
      {fileName && (
        <span className={`ml-3 text-sm font-medium flex items-center ${status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
          <StatusIcon className='w-4 h-4 mr-1' style={{ color: StatusColor }} />
          {fileName}
        </span>
      )}
    </div>
  );
};

/* =====================
   READING HUB EDITOR
===================== */
// --- READING HUB EDITOR (Fixed prop + hardening) ---
const BookRowEditor = ({
  initialBook,          // <-- match how it's passed from the list
  categoryKey,
  onUpdate,
  onDelete,
  isSaving
}) => {
  // Safely derive a usable book object even if undefined
  const safeInitial = useMemo(
    () => initialBook ?? { id: generateId(), title: '', author: '', pages: 0, isNew: true },
    [initialBook]
  );

  const [book, setBook] = useState(safeInitial);
  const [isEditing, setIsEditing] = useState(Boolean(safeInitial.isNew));
  const [isStaged, setIsStaged] = useState(Boolean(safeInitial.isNew));

  useEffect(() => {
    setBook(safeInitial);
    setIsEditing(Boolean(safeInitial.isNew));
    setIsStaged(Boolean(safeInitial.isNew));
  }, [safeInitial]);

  const handleChange = (field, value, type) => {
    const parsedValue = type === 'number' ? (parseInt(value, 10) || 0) : value;
    setBook(prev => ({ ...prev, [field]: parsedValue }));
    setIsStaged(true);
  };

  const handleSave = () => {
    // Require an id for new items
    if (book.isNew && (!book.id || !book.id.trim())) {
      alert('The id field is required for new books.');
      return;
    }
    // Pass the category key up along with the book object
    onUpdate(categoryKey, { ...book, isNew: false });
    setIsEditing(false);
    setIsStaged(false);
  };

  const handleCancel = () => {
    if (safeInitial.isNew) {
      onDelete(categoryKey, safeInitial.id);
    } else {
      setBook(safeInitial);
      setIsEditing(false);
      setIsStaged(false);
    }
  };

  const inputClass = "w-full p-1.5 border rounded-lg focus:ring-1 focus:ring-[#E04E1B] text-sm bg-white";
  
  // FIX 1: EXPAND FIELDS ARRAY
  const fields = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'pages', label: 'Pages', type: 'number' },
    { key: 'theme', label: 'Theme (Short)', type: 'text' },
    { key: 'complexity', label: 'Complexity (Low/Med/High)', type: 'text' },
    { key: 'duration', label: 'Duration (min)', type: 'number' },
    { key: 'focus', label: 'Focus (Comma List)', type: 'text' },
  ];

  return (
    // FIX 2: UPDATE GRID LAYOUT TO 10 COLUMNS (1 ID field, 7 data fields, 1 action column group)
    <div className={`grid grid-cols-10 gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
      {/* ID FIELD ADDED TO ROW EDITOR FOR VISIBILITY */}
      <div className="truncate">
          <p className='w-full p-1.5 text-xs font-mono text-gray-500 truncate'>{String(initialBook?.id ?? '')}</p>
      </div>

      {fields.map(field => (
        <div key={field.key} className="truncate">
          {isEditing ? (
            <input
              type={field.type || 'text'}
              value={book[field.key] ?? (field.type === 'number' ? 0 : '')}
              onChange={(e) => handleChange(field.key, e.target.value, field.type)}
              className={inputClass}
              disabled={isSaving}
            />
          ) : (
            <p className="w-full p-1.5 text-sm text-gray-700 truncate">
              {book[field.key] ?? (field.type === 'number' ? 0 : '-')}
            </p>
          )}
        </div>
      ))}

      <div className='flex space-x-2 justify-end'>
        {isEditing ? (
          <>
            <Button onClick={handleSave} isSmall disabled={isSaving || !isStaged} className="bg-green-600 hover:bg-green-700">
              <Save className='w-4 h-4' />
            </Button>
            <Button onClick={handleCancel} isSmall variant='secondary' disabled={isSaving} className="bg-gray-400 hover:bg-gray-500">
              <X className='w-4 h-4' />
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setIsEditing(true)} isSmall disabled={isSaving} variant='outline'>
              <Settings className='w-4 h-4' />
            </Button>
            {/* Call onDelete with both category and book ID */}
            <Button onClick={() => onDelete(categoryKey, book.id)} isSmall variant='secondary' disabled={isSaving}>
              <Trash2 className='w-4 h-4' />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const ReadingHubTableEditor = ({ catalog, isSaving, setGlobalData }) => {
  const safeCatalog = catalog || {};
  const categoryKeys = useMemo(() => Object.keys(safeCatalog).sort(), [safeCatalog]);
  const [currentCategory, setCurrentCategory] = useState(categoryKeys[0] || 'Uncategorized');

  // FIX 3: Category Initialization for Reading Hub Table
  useEffect(() => {
    // Only update if there are keys and the current category is invalid or 'Uncategorized'
    if (categoryKeys.length > 0 && (!categoryKeys.includes(currentCategory) || currentCategory === 'Uncategorized')) {
      setCurrentCategory(categoryKeys[0]);
    } else if (categoryKeys.length === 0) {
      setCurrentCategory('Uncategorized');
    }
  }, [categoryKeys, currentCategory]);

  const books = useMemo(
    // CRITICAL FIX: Ensure books are retrieved by key from the catalog
    () => {
      const data = safeCatalog[currentCategory];
      // Final check: if data exists but isn't an array, force it to an empty array
      if (Array.isArray(data)) {
        return data;
      }
      // If it's a map/object structure, try to convert it (this is a common Firebase issue)
      if (data && typeof data === 'object') {
        return Object.values(data);
      }
      return [];
    },
    [safeCatalog, currentCategory]
  );
  const booksList = useMemo(() => (Array.isArray(books) ? books : []).filter(Boolean), [books]);

  // FIX 4: Robust onUpdateBook handler
  const handleUpdateBook = useCallback((category, updatedBook) => {
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      const targetArray = newCatalog[category] || [];
      const index = targetArray.findIndex(b => b.id === updatedBook.id);
      
      if (index !== -1) {
        // Update existing book in its current category
        targetArray[index] = updatedBook;
      } else {
        // Add new book (should only happen for isNew)
        targetArray.push(updatedBook);
      }
      
      newCatalog[category] = targetArray;
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  }, [setGlobalData]);

  // FIX 5: Robust onDeleteBook handler
  const handleDeleteBook = useCallback((category, bookId) => {
    if (!window.confirm(`Delete book ID ${bookId} from '${category}'?`)) return;
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      // Filter out the book using its ID from the correct category array
      if (newCatalog[category]) {
        newCatalog[category] = (newCatalog[category] || []).filter(b => b.id !== bookId);
        // Clean up empty category
        if (newCatalog[category].length === 0) delete newCatalog[category];
      }
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  }, [setGlobalData]);

  const handleAddNewBook = () => {
    const newBook = { 
        id: generateId(), 
        title: 'NEW BOOK', 
        author: 'New Author', 
        pages: 100, 
        theme: 'Brief summary of book theme.',
        complexity: 'Medium',
        duration: 180,
        focus: 'Focus 1, Focus 2',
        isNew: true 
    };
    // Ensure 'Uncategorized' is treated as a valid category for adding
    const cat = currentCategory === 'Uncategorized' && categoryKeys.length > 0 ? categoryKeys[0] : currentCategory;
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      newCatalog[cat] = newCatalog[cat] || [];
      newCatalog[cat].push(newBook);
      // Ensure the active category is set to the one where the book was added
      setCurrentCategory(cat);
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  };

  const handleCreateCategory = () => {
    const newCatName = prompt("Enter the name for the new category:");
    if (newCatName && newCatName.trim()) {
      setGlobalData(prevGlobal => {
        const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
        if (!newCatalog[newCatName.trim()]) newCatalog[newCatName.trim()] = [];
        return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
      });
      setCurrentCategory(newCatName.trim());
    }
  };

  const handleBookDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      const existingBookIds = new Set(newCatalog[currentCategory]?.map(b => b.id) || []);
      const newBooks = parsedData.filter(b => !existingBookIds.has(b.id));
      newCatalog[currentCategory] = [...(newCatalog[currentCategory] || []), ...newBooks];
      alert(`Mass upload: ${newBooks.length} new books staged in '${currentCategory}'.`);
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  }, [setGlobalData, currentCategory]);

  return (
    <div className='mt-4 flex'>
      <div className='w-64 pr-4 border-r border-gray-200'>
        <p className='text-sm font-bold text-[#002E47] mb-2'>1. Select Category</p>
        <div className='space-y-1'>
          {categoryKeys.map(key => (
            <button
              key={key}
              // CRITICAL: Ensure button click updates the category state correctly
              onClick={() => setCurrentCategory(key)}
              className={`w-full text-left p-2 rounded-lg text-sm font-medium transition-colors ${currentCategory === key ? 'bg-[#47A88D] text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              {key} ({safeCatalog[key]?.length || 0})
            </button>
          ))}
          <Button isSmall variant='outline' className='w-full mt-2' onClick={handleCreateCategory}>
            <Plus className='w-4 h-4 mr-1' /> New Category
          </Button>
        </div>
      </div>

      <div className='flex-1 pl-6'>
        <p className='text-lg font-extrabold mb-2' style={{color: COLORS.NAVY}}>
          {currentCategory} ({booksList.length} Books)
        </p>
        <p className='text-sm text-gray-700 mb-4'>
          Use the table below for CRUD operations. Edits are staged until the <strong>Finalize & Write</strong> button is clicked.
        </p>

        {/* FIX 6: Updated Grid Header to match 10 columns */}
        <div className="grid grid-cols-10 gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]">
          <span className="truncate">ID</span>
          <span className="truncate">Title</span>
          <span className="truncate">Author</span>
          <span className="truncate">Pages</span>
          <span className="truncate">Theme</span>
          <span className="truncate">Complexity</span>
          <span className="truncate">Duration</span>
          <span className="truncate">Focus</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner mt-2">
          {booksList.length > 0 ? (
            booksList.map(book => (
              <BookRowEditor
                key={book.id}
                initialBook={book}
                categoryKey={currentCategory}
                onUpdate={handleUpdateBook}
                onDelete={handleDeleteBook}
                isSaving={isSaving}
              />
            ))
          ) : (
            <div className='p-4 text-center text-gray-500'>No books in this category. Click 'Add New Book' below to start.</div>
          )}
        </div>

        <div className='mt-4 flex space-x-3'>
          <Button onClick={handleAddNewBook} disabled={isSaving} className={`bg-[${COLORS.TEAL}] hover:bg-[#349881]`}>
            <Plus className='w-5 h-5 mr-2'/> Add New Book to {currentCategory}
          </Button>
          <CSVUploadComponent
            onDataParsed={handleBookDataParsed}
            // ➡️ FINAL FIX: Use the complete list of expected fields for Mass Load
            expectedFields={[
              { key: 'id', type: 'text' }, 
              { key: 'title', type: 'text' }, 
              { key: 'author', type: 'text' }, 
              { key: 'pages', type: 'number' },
              { key: 'theme', type: 'text' }, 
              { key: 'complexity', type: 'text' }, 
              { key: 'duration', type: 'number' }, 
              { key: 'focus', type: 'text' }
            ]}
            isSaving={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

/* =====================
   TIERS & GOALS EDITOR
===================== */
// ... (TiersGoalsTableEditor remains the same) ...

/* =====================
   SCENARIOS EDITOR
===================== */
// ... (ScenariosTableEditor remains the same) ...

/* =====================
   TARGET REP CATALOG
===================== */
// ... (TargetRepTableEditor remains the same) ...

/* =====================
   COMMITMENT BANK
===================== */
// ... (CommitmentBankTableEditor remains the same) ...

/* =====================
   LEADERSHIP DOMAINS
===================== */
// ... (LeadershipDomainsTableEditor remains the same) ...

/* =====================
   RESOURCE LIBRARY
===================== */
// ... (ResourceLibraryTableEditor remains the same) ...

/* =====================
   RAW CONFIG EDITOR
===================== */
const RawConfigEditor = ({ catalog, isSaving, setGlobalData, currentEditorKey }) => {
  const initialJson = useMemo(() => {
    try { return JSON.stringify(catalog || {}, null, 2); } catch { return JSON.stringify({}); }
  }, [catalog]);

  const [jsonText, setJsonText] = useState(initialJson);
  const [status, setStatus] = useState(null);

  useEffect(() => { setJsonText(initialJson); }, [initialJson]);

  const isJsonValid = useMemo(() => { try { JSON.parse(jsonText); return true; } catch { return false; } }, [jsonText]);

  const handleSave = () => {
    if (!isJsonValid) { setStatus({ type: 'error', message: 'Invalid JSON format. Cannot stage changes.' }); return; }
    try {
      const parsedData = JSON.parse(jsonText);
      if (currentEditorKey === 'RAW_CONFIG') {
        setGlobalData(() => parsedData);
        setStatus({ type: 'success', message: 'Raw Config staged locally. (Ready to write).' });
      } else {
        setStatus({ type: 'error', message: 'Unknown editor key. Stage operation failed.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: `Internal error staging data: ${e.message}` });
    }
  };

  const editorTitle = 'Advanced: Raw Global Configuration';

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>{editorTitle}</p>
      <p className='text-sm text-gray-700 mb-4'><strong>WARNING</strong>: This replaces the ENTIRE global metadata object. Use for mass upload or full configuration replacement.</p>
      <textarea
        value={jsonText}
        onChange={(e) => {setJsonText(e.target.value); setStatus(null);}}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] h-[400px] font-mono text-sm resize-y"
        disabled={isSaving}
        placeholder={`Paste your FULL global JSON object here.`}
      />
      {status && (
        <div className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle className='w-5 h-5'/> : <AlertTriangle className='w-5 h-5'/>}
          {status.message}
        </div>
      )}
      <Button onClick={handleSave} disabled={isSaving || !isJsonValid} className={`mt-4 w-full bg-[${COLORS.TEAL}] hover:bg-[#349881]`}>
        <Code className='w-5 h-5 mr-2'/> Stage FULL Config Replacement
      </Button>
      {!isJsonValid && <p className='text-xs text-red-500 mt-2'>* Fix JSON syntax before staging changes.</p>}
    </div>
  );
};

/* =====================
   Helper banner
===================== */
const DataSyncBanner = ({ globalMetadata, localGlobalData }) => {
  const upstreamHasData = globalMetadata && Object.keys(globalMetadata || {}).length > 0;
  const localIsEmpty = !localGlobalData || Object.keys(localGlobalData || {}).length === 0;
  if (upstreamHasData && localIsEmpty) {
    return (
      <div className="mb-4 p-3 rounded border border-yellow-300 bg-yellow-50 text-sm text-yellow-900">
        Global data is loaded, but the editor hasn’t synced yet. This will update in a moment.
      </div>
    );
  }
  return null;
};

/* =====================
   MAIN ROUTER
===================== */
const GlobalDataEditor = ({ globalMetadata, updateGlobalMetadata, db, navigate }) => {
  const [localGlobalData, setLocalGlobalData] = useState(globalMetadata || {});

  // FIX 5: Reliably rehydrate local state whenever globalMetadata changes
  useEffect(() => {
    try {
      // Only update if globalMetadata is an object and has keys (i.e., it's loaded)
      if (globalMetadata && Object.keys(globalMetadata || {}).length > 0) {
        setLocalGlobalData(globalMetadata);
      }
    } catch {}
  }, [globalMetadata]);

  const computeFirstTab = (data) => {
    if (!data) return 'reading';
    const countItems = (obj) => Object.values(obj || {}).flat().length;
    if ((data.LEADERSHIP_DOMAINS || []).length) return 'domains';
    if (countItems(data.RESOURCE_LIBRARY || data.RESOURCE_CONTENT_LIBRARY || {}) > 0) return 'resources';
    if ((data.TARGET_REP_CATALOG || []).length) return 'target-reps';
    if ((data.QUICK_CHALLENGE_CATALOG || []).length) return 'quick-challenges';
    if ((data.COMMITMENT_BANK || []).length) return 'commitment';
    if ((data.SCENARIO_CATALOG || []).length) return 'scenarios';
    if (data.READING_CATALOG_SERVICE && Object.keys(data.READING_CATALOG_SERVICE).length) return 'reading';
    return 'reading';
  };
  const [tabAutoSelected, setTabAutoSelected] = useState(false);

  useEffect(() => {
    try {
      const lib = (localGlobalData && (localGlobalData.RESOURCE_LIBRARY || localGlobalData.RESOURCE_CONTENT_LIBRARY)) || {};
      const domains = Object.keys(lib);
      const total = Object.values(lib).flat().length;
      console.groupCollapsed('[MaintenanceHub] incoming localGlobalData');
      console.log('top-level keys:', Object.keys(localGlobalData || {}));
      console.log('RESOURCE_LIBRARY present?', !!(localGlobalData && localGlobalData.RESOURCE_LIBRARY));
      console.log('RESOURCE_CONTENT_LIBRARY present?', !!(localGlobalData && localGlobalData.RESOURCE_CONTENT_LIBRARY));
      console.log('library domain keys:', domains);
      console.log('library total items:', total);
      console.groupEnd();
    } catch (e) { console.warn('[MaintenanceHub] debug failed', e); }
  }, [localGlobalData]);

  const [currentTab, setCurrentTab] = useState('reading');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const readingCatalogKeys = useMemo(() => {
    return globalMetadata?.READING_CATALOG_SERVICE ? Object.keys(globalMetadata.READING_CATALOG_SERVICE).sort().join(',') : '';
  }, [globalMetadata]);

  useEffect(() => {
    setLocalGlobalData(globalMetadata || {});
    setStatus(null);
  }, [globalMetadata, readingCatalogKeys]);

  useEffect(() => {
    if (!tabAutoSelected && localGlobalData && Object.keys(localGlobalData || {}).length) {
      const next = computeFirstTab(localGlobalData);
      setCurrentTab(next);
      setTabAutoSelected(true);
    }
  }, [localGlobalData, tabAutoSelected]);

  const countItems = (obj) => Object.values(obj || {}).flat().length;
  const countTiers = (obj) => Object.keys(obj || {}).length;

  const navItems = useMemo(() => {
    const domainsCount = (localGlobalData.LEADERSHIP_DOMAINS || []).length;
    const libForCount = (localGlobalData.RESOURCE_LIBRARY || localGlobalData.RESOURCE_CONTENT_LIBRARY || {});
    const resourcesCount = countItems(libForCount);
    const totalReadingItems = countItems(localGlobalData.READING_CATALOG_SERVICE);
    const totalCommitmentItems = countItems(localGlobalData.COMMITMENT_BANK);
    const totalScenarioItems = (localGlobalData.SCENARIO_CATALOG || []).length;
    const totalRepItems = (localGlobalData.TARGET_REP_CATALOG || []).length;

    return [
      { group: 'Content: Learn & Prep', key: 'reading', label: 'Reading Hub (Books/Articles)', icon: BookOpen, accent: 'TEAL', count: totalReadingItems },
      { group: 'Content: Learn & Prep', key: 'domains', label: `Applied Leadership Domains`, icon: Link, accent: 'NAVY', count: domainsCount },
      { group: 'Content: Learn & Prep', key: 'resources', label: 'Resource Content Library', icon: Briefcase, accent: 'ORANGE', count: resourcesCount },

      { group: 'Habits & Practice', key: 'bank', label: 'Commitment Bank (Master Reps)', icon: List, accent: 'TEAL', count: totalCommitmentItems },
      { group: 'Habits & Practice', key: 'target-reps', label: 'Target Reps Catalog', icon: Dumbbell, accent: 'GREEN', count: totalRepItems },

      { group: 'Coaching: Practice & Feedback', key: 'scenarios', label: 'Coaching Scenarios', icon: Users, accent: 'TEAL', count: totalScenarioItems },
      { group: 'System & Core', key: 'tiers', label: 'Tiers & Goals', icon: Target, accent: 'ORANGE', count: countTiers(localGlobalData.LEADERSHIP_TIERS) },
      { group: 'System & Core', key: 'summary', label: 'Summary Dashboard', icon: BarChart3, accent: 'NAVY', count: undefined },
      { group: 'System & Core', key: 'raw', label: 'Raw Config Editor', icon: Code, accent: 'ORANGE', count: undefined },
    ];
  }, [localGlobalData]);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'reading':
        return <ReadingHubTableEditor
          catalog={localGlobalData.READING_CATALOG_SERVICE || {}}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
        />;
      case 'domains':
        return <LeadershipDomainsTableEditor
          data={localGlobalData}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
          idKey='id'
        />;
      case 'resources':
        return <ResourceLibraryTableEditor
          data={localGlobalData}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
          idKey='id'
        />;
      case 'bank':
        return <CommitmentBankTableEditor
          data={localGlobalData}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
          idKey='id'
        />;
      case 'tiers':
        return <TiersGoalsTableEditor
          data={localGlobalData}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
          idKey='id'
        />;
      case 'scenarios':
        return <ScenariosTableEditor
          data={localGlobalData}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
          idKey='id'
        />;
      case 'target-reps':
        return <TargetRepTableEditor
          data={localGlobalData}
          isSaving={isSaving}
          setGlobalData={setLocalGlobalData}
          idKey='id'
        />;
      case 'raw':
        return (
          <>
            <RawConfigEditor
              catalog={localGlobalData}
              isSaving={isSaving}
              setGlobalData={setLocalGlobalData}
              currentEditorKey={'RAW_CONFIG'}
            />
            <DataSyncBanner globalMetadata={globalMetadata} localGlobalData={localGlobalData} />
            <div className="mb-3 p-2 rounded border text-xs">
              <strong>Write target:</strong>{' '}
              {db?.app?.options?.projectId ? db.app.options.projectId : 'mock (NO PERSIST)'}
            </div>
          </>
        );
      case 'summary':
      default:
        return (
          <Card title="Database Summary Snapshot" accent='TEAL' isSmall={true}>
            <p className='text-sm text-gray-700 mb-4'>Review the current counts before committing changes. <em>Use the table editors before saving globally.</em></p>
            <div className='space-y-2'>
              {navItems.filter(i => i.key !== 'raw' && i.count !== undefined).map(item => (
                <div key={item.key} className='flex justify-between items-center text-sm border-b pb-1'>
                  <span className='font-semibold'>{item.label}:</span>
                  <span className='font-extrabold text-[#E04E1B]'>{item.count} Items</span>
                </div>
              ))}
            </div>
          </Card>
        );
    }
  };

  const groupedItems = useMemo(() => {
    return navItems.reduce((acc, item) => {
      acc[item.group] = acc[item.group] || [];
      acc[item.group].push(item);
      return acc;
    }, {});
  }, [navItems]);

  const handleFinalSave = async () => {
    if (!db) {
      setStatus({ type: 'error', message: 'No Firestore connection yet. Refresh/sign in and try again.' });
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const ok = await updateGlobalMetadata(localGlobalData, { merge: true, source: 'AdminFinalize' });
      if (ok) setStatus({ type: 'success', message: 'ALL global configurations successfully saved to Firestore.' });
      else setStatus({ type: 'error', message: 'Database write failed. Check console logs.' });
    } catch (e) {
      setStatus({ type: 'error', message: `Critical error during final save: ${e.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className='flex flex-col space-y-4'>
        {Object.entries(groupedItems).map(([group, items]) => (
          <div key={group} className="flex flex-col flex-shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2 mt-4">{group}</h3>
            <div className='flex flex-wrap gap-2'>
              {items.map(item => (
                <button
                  key={item.key}
                  onClick={() => setCurrentTab(item.key)}
                  className={`flex items-center px-4 py-2 text-sm font-semibold transition-all rounded-lg whitespace-nowrap border-2 ${currentTab === item.key ? 'bg-[#002E47] text-white border-[#002E47] shadow-md' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'}`}
                >
                  <item.icon className='w-4 h-4 mr-1' />
                  {item.label} {item.count !== undefined && <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${currentTab === item.key ? 'bg-white text-[#002E47]' : 'bg-gray-200 text-gray-700'}`}>{item.count}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-6 p-6 rounded-xl border-2 shadow-lg bg-white'>
        {renderTabContent()}
      </div>

      {status && (
        <div className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle className='w-5 h-5'/> : <AlertTriangle className='w-5 h-5'/>}
          {status.message}
        </div>
      )}

      <Button onClick={handleFinalSave} disabled={isSaving} className={`mt-8 w-full bg-[#E04E1B] hover:bg-red-700`}>
        {isSaving ? (
          <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> COMMITTING ALL STAGED CHANGES...</span>
        ) : <><ShieldCheck className='w-5 h-5 mr-2'/> Finalize & Write All Staged Changes to Database</>}
      </Button>
    </>
  );
};

export default function AdminDataMaintenanceScreen({ navigate }) {
  const { metadata, isLoading: isMetadataLoading, db, updateGlobalMetadata } = useAppServices();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setLoginError(null);
    } else {
      setLoginError('Invalid Administrator Password.');
      setPassword('');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card title="Administrator Access Required" icon={Lock} accent='ORANGE' className='w-full max-w-md text-center'>
          <p className='text-gray-700 mb-4'>Enter the maintenance password to access global configuration data.</p>
          <form onSubmit={handleLogin} className='space-y-4'>
            <input
              type="password"
              value={password}
              onChange={(e) => {setPassword(e.target.value); setLoginError(null);}}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] text-gray-800"
              placeholder="Maintenance Password"
            />
            {loginError && <p className='text-sm text-red-500 font-semibold flex items-center justify-center'><AlertTriangle className='w-4 h-4 mr-1'/> {loginError}</p>}
            <Button type="submit" className='w-full bg-[#E04E1B] hover:bg-red-700'>
              <CornerRightUp className='w-5 h-5 mr-2'/> Unlock Maintenance Tools
            </Button>
            <Button onClick={() => navigate('app-settings')} variant='outline' className='w-full mt-2'>
              <ArrowLeft className='w-5 h-5 mr-2'/> Return to App Settings
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (isMetadataLoading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center" style={{ background: COLORS.LIGHT_GRAY }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
          <p className="text-[#47A88D] font-medium">Loading Global Metadata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.LIGHT_GRAY }}>
      <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
        <Cpu className='w-10 h-10' style={{color: COLORS.NAVY}}/>
        <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Global Data Maintenance Hub</h1>
      </div>
      <p className="text-lg text-gray-600 mb-8 max-w-3xl">Admin Tools: Directly manage all non-user application data (tiers, catalogs) stored in the Firebase collection <strong>metadata</strong>.</p>

      <GlobalDataEditor
        globalMetadata={resolveGlobalMetadata(metadata)}
        updateGlobalMetadata={updateGlobalMetadata}
        db={db}
      />
    </div>
  );
}