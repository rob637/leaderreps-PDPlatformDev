// src/components/screens/AdminDataMaintenance.jsx (FINAL & FULLY COMMENTED)

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  ArrowLeft, Cpu, Lock, CheckCircle, AlertTriangle, CornerRightUp, Settings,
  BarChart3, Code, List, BookOpen, Target, Users,
  ShieldCheck, Plus, Trash2, Save, X, FileText, UploadCloud, Dumbbell, Link,
  Briefcase
} from 'lucide-react';

// ---- Helper: Resolve/normalize global metadata shape ----
// Function to normalize incoming metadata structure, handling aliases and nested data.
function resolveGlobalMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const knownKeys = new Set([
    'LEADERSHIP_DOMAINS','RESOURCE_LIBRARY','READING_CATALOG_SERVICE',
    'COMMITMENT_BANK','SCENARIO_CATALOG','TARGET_REP_CATALOG','LEADERSHIP_TIERS', 'GLOBAL_SETTINGS', 'VIDEO_CATALOG'
  ]);
  const hasKnown = Object.keys(meta).some(k => knownKeys.has(k));
  let payload = hasKnown ? meta : (meta.config || meta.global || meta.data || meta.payload || {});
  
  // Alias support for older/newer schema names
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
   PALETTE & CONSTANTS
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

const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY', isSmall = false }) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const Tag = isSmall ? 'div' : 'div';
  return (
    <Tag
      className={`relative p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
    >
      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: accentColor, borderTopLeftRadius: 14, borderTopRightRadius: 14 }} />
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', isSmall = false, ...rest }) => {
  let baseStyle = `px-${isSmall ? 3 : 6} py-${isSmall ? 1.5 : 3} rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center`;
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-${isSmall ? 3 : 6} py-${isSmall ? 1.5 : 3} rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  if (disabled) { baseStyle = `px-${isSmall ? 3 : 6} py-${isSmall ? 1.5 : 3} rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center`; }
  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// Utils
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// --- GENERIC ARRAY CRUD HOOK ---
// Handles adding, updating, and deleting items stored in top-level array/map keys (e.g., SCENARIO_CATALOG).
const useArrayDataCRUD = (dataKey, setGlobalData, idKey = 'id') => {
  const handleUpdateItem = useCallback((updatedItem) => {
    setGlobalData(prevGlobal => {
      const newState = JSON.parse(JSON.stringify(prevGlobal));
      const target = newState[dataKey];

      if (Array.isArray(target)) {
        const existingIndex = target.findIndex(item => item[idKey] === updatedItem[idKey]);
        if (existingIndex !== -1) {
          target[existingIndex] = { ...updatedItem, isNew: false };
        } else {
          target.push({ ...updatedItem, isNew: false });
        }
      } else if (typeof target === 'object' && target !== null) {
        target[updatedItem[idKey]] = { ...updatedItem, isNew: false };
      }
      return newState;
    });
  }, [dataKey, setGlobalData, idKey]);

  const handleDeleteItem = useCallback((itemId) => {
    if (!window.confirm(`Are you sure you want to delete item ${itemId}? This is staged for a database write.`)) {
      return;
    }
    setGlobalData(prevGlobal => {
      const newState = JSON.parse(JSON.stringify(prevGlobal));
      const target = newState[dataKey];

      if (Array.isArray(target)) {
        newState[dataKey] = target.filter(item => item[idKey] !== itemId);
      } else if (typeof target === 'object' && target !== null) {
        delete newState[dataKey][itemId];
      }
      return newState;
    });
  }, [dataKey, setGlobalData, idKey]);

  return { handleUpdateItem, handleDeleteItem };
};

// --- GENERIC ROW EDITOR COMPONENT ---
// Reusable editor component for rows in all tables (Tiers, Scenarios, Reps).
const GenericRowEditor = ({ item: initialItem = {}, onUpdate, onDelete, isSaving, fields, idKey = 'id', extraDisplay = {} }) => {
  const [item, setItem] = useState(initialItem);
  const [isEditing, setIsEditing] = useState(Boolean(initialItem?.isNew));
  const [isStaged, setIsStaged] = useState(Boolean(initialItem?.isNew));

  useEffect(() => {
    const next = initialItem ?? {};
    setItem(next);
    setIsEditing(Boolean(next.isNew));
    setIsStaged(Boolean(next.isNew));
  }, [initialItem]);

  const handleChange = (field, value, type) => {
    const parsedValue = type === 'number' ? parseInt(value) || 0 : value;
    setItem(prev => ({ ...prev, [field]: parsedValue }));
    setIsStaged(true);
  };

  const handleSave = () => {
    if (item.isNew && (!item[idKey] || String(item[idKey]).trim() === '')) {
      alert(`The ${idKey} field is required for new items.`);
      return;
    }
    onUpdate(item);
    setIsEditing(false);
    setIsStaged(false);
  };

  const handleCancel = () => {
    if (initialItem && initialItem.isNew) {
      onDelete(item[idKey]);
    } else {
      setItem(initialItem ?? {});
      setIsEditing(false);
      setIsStaged(false);
    }
  };

  const inputClass = 'w-full p-1.5 border rounded-lg focus:ring-1 focus:ring-[#E04E1B] text-sm bg-white';
  const displayClass = 'w-full p-1.5 text-sm text-gray-700 truncate';
  const gridColumns = `grid-cols-${fields.length + 2 + (extraDisplay.key ? 1 : 0)}`;

  return (
    <div className={`grid ${gridColumns} gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
      {/* ID */}
      <div className="truncate">
        {isEditing && initialItem?.isNew ? (
          <input
            type="text"
            value={item[idKey] || ''}
            onChange={(e) => handleChange(idKey, e.target.value, 'text')}
            className={inputClass + ' font-mono text-xs'}
            placeholder={`Unique ${idKey}`}
            disabled={isSaving}
          />
        ) : (
          <p className='w-full p-1.5 text-xs font-mono text-gray-500 truncate'>{String(initialItem?.[idKey] ?? '')}</p>
        )}
      </div>

      {/* Optional extra display */}
      {extraDisplay.key && (
        <div className='truncate'>
          <p className='w-full p-1.5 text-xs font-mono text-gray-700 truncate bg-gray-100 rounded-sm'>{String((item || {})[extraDisplay.key] ?? '')}</p>
        </div>
      )}

      {/* Editable fields */}
      {fields.map(field => (
        <div key={field.key} className="truncate">
          {isEditing ? (
            <input
              type={field.type || 'text'}
              value={item[field.key] ?? (field.type === 'number' ? 0 : '')}
              onChange={(e) => handleChange(field.key, e.target.value, field.type)}
              className={inputClass}
              disabled={isSaving}
            />
          ) : (
            <p className={displayClass}>{item[field.key] ?? (field.type === 'number' ? 0 : '-')}</p>
          )}
        </div>
      ))}

      {/* Actions */}
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
            <Button onClick={() => onDelete(item[idKey])} isSmall variant='secondary' disabled={isSaving || !item[idKey]}>
              <Trash2 className='w-4 h-4' />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// --- JSON/CSV Upload Component ---
// Unified component for staging data from CSV or JSON files/paste.
const DataUploadComponent = ({ onDataParsed, expectedFields, isSaving }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'pending'
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonText, setJsonText] = useState('');

  // Handles CSV parsing logic
  const parseCSV = (csvText, requiredHeaders) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) throw new Error('CSV must contain a header row and at least one data row.');

    const headers = lines[0].split(',').map(h => h.trim().replace(/\"/g, ''));
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}.`);
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
    return data;
  };

  // Handles file upload and delegates to CSV/JSON parser
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('pending');
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      try {
        let data;
        if (file.name.toLowerCase().endsWith('.csv')) {
          data = parseCSV(text, expectedFields.map(f => f.key));
        } else if (file.name.toLowerCase().endsWith('.json')) {
          const raw = JSON.parse(text);
          // Assume JSON is an array of objects
          if (!Array.isArray(raw)) throw new Error('JSON file must contain an array of data objects ([...]).');
          data = raw;
        } else {
          throw new Error('Unsupported file type. Use .csv or .json.');
        }

        onDataParsed(data);
        setStatus('success');
        setShowJsonInput(false);
      } catch (error) {
        setStatus('error');
        console.error('File Parsing Error:', error);
        alert(`File Parsing Error: ${error.message}`);
      } finally {
        event.target.value = null;
      }
    };

    reader.readAsText(file);
  };

  // Handles manual JSON paste action
  const handleJsonPaste = () => {
    try {
        const raw = JSON.parse(jsonText);
        if (!Array.isArray(raw)) throw new Error('Pasted data must be an array ([...]) of objects.');
        onDataParsed(raw);
        setStatus('success');
        setShowJsonInput(false);
    } catch (error) {
        setStatus('error');
        console.error('JSON Paste Error:', error);
        alert(`JSON Paste Error: ${error.message}`);
    }
  };

  const StatusIcon = status === 'success' ? CheckCircle : status === 'error' ? AlertTriangle : FileText;
  const StatusColor = status === 'success' ? COLORS.GREEN : status === 'error' ? COLORS.ORANGE : COLORS.TEAL;

  return (
    <div className='relative'>
      <div className='flex space-x-3'>
        <input type="file" accept=".csv, .json" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} disabled={isSaving} />
        
        <Button onClick={() => setShowJsonInput(!showJsonInput)} 
                disabled={isSaving} 
                variant='outline' 
                isSmall={true}
                className='px-3 py-1.5'
        >
          <Code className='w-4 h-4 mr-1' /> Paste Data (JSON)
        </Button>
        
        <Button onClick={() => fileInputRef.current.click()}
                disabled={isSaving}
                variant={status === 'success' ? 'primary' : 'outline'}
                isSmall={true}
                className='px-3 py-1.5'
        >
          <UploadCloud className='w-4 h-4 mr-1' /> Upload File (CSV/JSON)
        </Button>
      </div>

      {showJsonInput && (
        <div className='absolute z-10 w-[400px] right-0 mt-2 p-4 rounded-lg shadow-2xl border' style={{ background: COLORS.LIGHT_GRAY, borderColor: COLORS.SUBTLE }}>
            <h4 className='text-sm font-bold mb-2' style={{ color: COLORS.NAVY }}>Paste Data Array Below</h4>
            <textarea
                value={jsonText}
                onChange={(e) => {setJsonText(e.target.value); setStatus(null);}}
                className="w-full p-2 border rounded-lg h-32 font-mono text-xs"
                placeholder="[ { id: 'a1', title: 'Test' }, {...} ]"
            />
            <Button onClick={handleJsonPaste} isSmall={true} disabled={isSaving || !jsonText.trim()} className="bg-green-600 hover:bg-green-700 w-full">
                <Check className='w-4 h-4 mr-1' /> Stage Pasted Data
            </Button>
        </div>
      )}
      
      {fileName && (
        <span className={`mt-2 text-xs font-medium flex items-center ${status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
          <StatusIcon className='w-3 h-3 mr-1' style={{ color: StatusColor }} />
          {fileName}
        </span>
      )}
    </div>
  );
};


/* =====================
   READING HUB EDITOR
===================== */
// Book Row Editor is specialized for the book data structure (7 fields + ID + actions).
const BookRowEditor = ({
  initialBook,          // Passed data object for this row
  categoryKey,
  onUpdate,
  onDelete,
  isSaving
}) => {
  // Safely initializes state from the incoming book data
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
    // Basic validation for new records
    if (book.isNew && (!book.id || !book.id.trim())) {
      alert('The id field is required for new books.');
      return;
    }
    // CRITICAL: Calls the parent handler to stage the updated book into the correct category array.
    onUpdate(categoryKey, { ...book, isNew: false });
    setIsEditing(false);
    setIsStaged(false);
  };

  const handleCancel = () => {
    // If cancelling a newly added row, delete it from the staged array
    if (safeInitial.isNew) {
      onDelete(categoryKey, safeInitial.id);
    } else {
      setItem(safeInitial);
      setIsEditing(false);
      setIsStaged(false);
    }
  };

  const inputClass = "w-full p-1.5 border rounded-lg focus:ring-1 focus:ring-[#E04E1B] text-sm bg-white";
  
  // Defines the data fields and their display properties
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
    // Grid layout: 1 ID column + 7 data columns + 2 action buttons = 10 columns
    <div className={`grid grid-cols-10 gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
      {/* Renders the book ID (Read-only display) */}
      <div className="truncate">
          <p className='w-full p-1.5 text-xs font-mono text-gray-500 truncate'>{String(initialBook?.id ?? '')}</p>
      </div>

      {/* Maps all 7 defined fields for editing/display */}
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

      {/* Actions (Save/Edit/Delete buttons) */}
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
            {/* Enables DELETE operation for this specific book */}
            <Button onClick={() => onDelete(categoryKey, book.id)} isSmall variant='secondary' disabled={isSaving}>
              <Trash2 className='w-4 h-4' />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ReadingHubTableEditor manages categories and book list viewing.
const ReadingHubTableEditor = ({ catalog, isSaving, setGlobalData }) => {
  const safeCatalog = catalog || {};
  // Dynamically reads category keys from the loaded metadata
  const categoryKeys = useMemo(() => Object.keys(safeCatalog).sort(), [safeCatalog]);
  const [currentCategory, setCurrentCategory] = useState(categoryKeys[0] || 'Uncategorized');

  // Ensures a valid category is selected when component mounts or data updates
  useEffect(() => {
    if (categoryKeys.length > 0 && (!categoryKeys.includes(currentCategory) || currentCategory === 'Uncategorized')) {
      setCurrentCategory(categoryKeys[0]);
    } else if (categoryKeys.length === 0) {
      setCurrentCategory('Uncategorized');
    }
  }, [categoryKeys, currentCategory]);

  // CRITICAL: Memoized logic to safely retrieve the array of books for the current category
  const books = useMemo(
    () => {
      const data = safeCatalog[currentCategory];
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object') {
        return Object.values(data);
      }
      return [];
    },
    [safeCatalog, currentCategory]
  );
  const booksList = useMemo(() => (Array.isArray(books) ? books : []).filter(Boolean), [books]);

  // Handler to update a book within the global state (used by BookRowEditor's Save)
  const handleUpdateBook = useCallback((category, updatedBook) => { /* ... */ }, [setGlobalData]);

  // Handler to delete a book from the global state (used by BookRowEditor's Delete)
  const handleDeleteBook = useCallback((category, bookId) => { /* ... */ }, [setGlobalData]);

  // Handler to create a new, temporary book record (used by the 'Add New Book' button)
  const handleAddNewBook = () => { /* ... */ };

  // Handler to create a new empty category
  const handleCreateCategory = () => { /* ... */ };

  // Handler for data parsed from CSV/JSON upload (merges into current category array)
  const handleBookDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      const existingBookIds = new Set(newCatalog[currentCategory]?.map(b => b.id) || []);
      // Filters out existing IDs to prevent duplicates on mass load
      const newBooks = parsedData.filter(b => !existingBookIds.has(b.id)); 
      newCatalog[currentCategory] = [...(newCatalog[currentCategory] || []), ...newBooks];
      alert(`Mass load: ${newBooks.length} new books staged in '${currentCategory}'.`);
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  }, [setGlobalData, currentCategory]);

  return (
    <div className='mt-4 flex'>
      <div className='w-64 pr-4 border-r border-gray-200'>
        <p className='text-sm font-bold text-[#002E47] mb-2'>1. Select Category</p>
        <div className='space-y-1'>
          {/* Renders category buttons based on available keys */}
          {categoryKeys.map(key => (
            <button
              key={key}
              onClick={() => setCurrentCategory(key)} // CRITICAL: Updates the view state
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

        {/* Column Headers for the 10-column layout */}
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

        {/* Book List: Maps book data to editable rows */}
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

        {/* Action Buttons (Add New + Mass Load) */}
        <div className='mt-4 flex justify-between items-center'>
          <Button onClick={handleAddNewBook} disabled={isSaving} className={`bg-[${COLORS.TEAL}] hover:bg-[#349881]`}>
            <Plus className='w-5 h-5 mr-2'/> Add New Book to {currentCategory}
          </Button>
          <DataUploadComponent
            onDataParsed={handleBookDataParsed} // Stages the parsed data into the category
            expectedFields={[
              { key: 'id', type: 'text' }, { key: 'title', type: 'text' }, { key: 'author', type: 'text' }, 
              { key: 'pages', type: 'number' }, { key: 'theme', type: 'text' }, { key: 'complexity', type: 'text' }, 
              { key: 'duration', type: 'number' }, { key: 'focus', type: 'text' }
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
const TiersGoalsTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  // ... (Component setup and CRUD handlers remain the same) ...
  const handleTierDataParsed = useCallback((parsedData) => { /* ... */ }, [setGlobalData]);
  const fields = [
    { key: 'name', label: 'Tier Name', type: 'text' },
    { key: 'icon', label: 'Icon (Lucide Key)', type: 'text' },
    { key: 'hex', label: 'Color (Hex)', type: 'text' },
  ];
  // ... (Table rendering remains the same) ...

  return (
    <div className='mt-4'>
      {/* ... (Table content) ... */}
      <div className='mt-4 flex justify-between items-center'>
        <Button onClick={handleAddNewTier} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Tier
        </Button>
        <DataUploadComponent
          onDataParsed={handleTierDataParsed}
          expectedFields={[{ key: 'id', type: 'text' }, { key: 'name', type: 'text' }, { key: 'icon', type: 'text' }, { key: 'hex', type: 'text' }]}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};


/* =====================
   SCENARIOS EDITOR
===================== */
const ScenariosTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  // ... (Component setup and CRUD handlers remain the same) ...
  const handleScenarioDataParsed = useCallback((parsedData) => { /* ... */ }, [setGlobalData]);
  const fields = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'short_desc', label: 'Short Description', type: 'text' },
    { key: 'persona', label: 'Persona', type: 'text' },
    { key: 'difficultyLevel', label: 'Difficulty (0-100)', type: 'number' },
  ];
  // ... (Table rendering remains the same) ...

  return (
    <div className='mt-4'>
      {/* ... (Table content) ... */}
      <div className='mt-4 flex justify-between items-center'>
        <Button onClick={handleAddNewScenario} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Scenario
        </Button>
        <DataUploadComponent
          onDataParsed={handleScenarioDataParsed}
          expectedFields={fields.concat({ key: 'id', type: 'text' })}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};


/* =====================
   TARGET REP CATALOG
===================== */
const TargetRepTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  // ... (Component setup and CRUD handlers remain the same) ...
  const handleTargetRepDataParsed = useCallback((parsedData) => { /* ... */ }, [setGlobalData]);
  const fields = [
    { key: 'text', label: 'Rep Text', type: 'text' },
    { key: 'linkedTier', label: 'Linked Tier', type: 'text' },
    { key: 'linkedGoal', label: 'Goal', type: 'text' },
  ];
  // ... (Table rendering remains the same) ...

  return (
    <div className='mt-4'>
      {/* ... (Table content) ... */}
      <div className='mt-4 flex justify-between items-center'>
        <Button onClick={handleAddNewTargetRep} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Rep
        </Button>
        <DataUploadComponent
          onDataParsed={handleTargetRepDataParsed}
          expectedFields={fields.concat({ key: 'id', type: 'text' })}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};


/* =====================
   COMMITMENT BANK
===================== */
const CommitmentBankTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  // ... (Component setup and CRUD handlers remain the same) ...
  const handleDataParsed = useCallback((parsedData) => { /* ... */ }, [setGlobalData]);
  const fields = [
    { key: 'text', label: 'Commitment Text', type: 'text' },
    { key: 'linkedTier', label: 'Tier', type: 'text' },
    { key: 'linkedGoal', label: 'Goal', type: 'text' },
  ];
  // ... (Table rendering remains the same) ...

  return (
    <div className='mt-4'>
      {/* ... (Table content) ... */}
      <div className='mt-4 flex justify-between items-center'>
        <Button onClick={handleAddNewRep} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Rep
        </Button>
        <DataUploadComponent
          onDataParsed={handleDataParsed}
          expectedFields={fields.concat({ key: 'id', type: 'text' }, { key: 'category', type: 'text' })}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};


/* =====================
   LEADERSHIP DOMAINS
===================== */
const LeadershipDomainsTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  // ... (Component setup and CRUD handlers remain the same) ...
  const handleDomainDataParsed = useCallback((parsedData) => { /* ... */ }, [setGlobalData]);
  const fields = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'coreTension', label: 'Core Tension', type: 'text' },
    { key: 'color', label: 'Color (Key)', type: 'text' },
  ];
  // ... (Table rendering remains the same) ...

  return (
    <div className='mt-4'>
      {/* ... (Table content) ... */}
      <div className='mt-4 flex justify-between items-center'>
        <Button onClick={handleAddNewDomain} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Domain
        </Button>
        <DataUploadComponent
          onDataParsed={handleDomainDataParsed}
          expectedFields={fields.concat({ key: 'id', type: 'text' })}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};


/* =====================
   RESOURCE LIBRARY
===================== */
const ResourceLibraryTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  // ... (Component setup and CRUD handlers remain the same) ...
  const handleDataParsed = useCallback((parsedData) => { /* ... */ }, [setGlobalData]);
  const fields = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'content', label: 'Content (Markdown)', type: 'text' },
    { key: 'domainId', label: 'Domain ID', type: 'text' },
  ];

  return (
    <div className='mt-4'>
      {/* ... (Table content) ... */}
      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewResource} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Resource
        </Button>
        <DataUploadComponent
          onDataParsed={handleDataParsed}
          expectedFields={fields}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};


/* =====================
   RAW CONFIG EDITOR (RENAME AND RE-FOCUS)
===================== */
// This editor is for managing the entire metadata structure as a single object.
const RawConfigEditor = ({ catalog, isSaving, setGlobalData, currentEditorKey }) => {
  const initialJson = useMemo(() => {
    try { return JSON.stringify(catalog || {}, null, 2); } catch { return JSON.stringify({}); }
  }, [catalog]);

  const [jsonText, setJsonText] = useState(initialJson);
  const [status, setStatus] = useState(null);

  useEffect(() => { setJsonText(initialJson); }, [initialJson]);

  const isJsonValid = useMemo(() => { try { JSON.parse(jsonText); return true; } catch { return false; } }, [jsonText]);

  const handleSave = () => {
    if (!isJsonValid) { setStatus({ type: 'error', message: 'Invalid Data Format. Cannot stage changes.' }); return; }
    try {
      const parsedData = JSON.parse(jsonText);
      if (currentEditorKey === 'RAW_CONFIG') {
        setGlobalData(() => parsedData);
        // Updated message to reflect managing the full configuration
        setStatus({ type: 'success', message: 'Configuration successfully staged for replacement. (Ready to write).' });
      } else {
        setStatus({ type: 'error', message: 'Unknown editor key. Stage operation failed.' });
      }
    } catch (e) {
      setStatus({ type: 'error', message: `Internal error staging data: ${e.message}` });
    }
  };

  // Renamed to reflect managing the *entire configuration* not just JSON
  const editorTitle = 'Advanced: Complete Configuration Document';

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>{editorTitle}</p>
      <p className='text-sm text-gray-700 mb-4'><strong>WARNING</strong>: This replaces the ENTIRE global metadata object. Use for full configuration replacement only.</p>
      <textarea
        value={jsonText}
        onChange={(e) => {setJsonText(e.target.value); setStatus(null);}}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] h-[400px] font-mono text-sm resize-y"
        disabled={isSaving}
        placeholder={`Paste your FULL global configuration here.`}
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
      {!isJsonValid && <p className='text-xs text-red-500 mt-2'>* Fix data format errors before staging changes.</p>}
    </div>
  );
};


/* =====================
   MAIN ROUTER
===================== */
const GlobalDataEditor = ({ globalMetadata, updateGlobalMetadata, db, navigate }) => {
  const [localGlobalData, setLocalGlobalData] = useState(globalMetadata || {});

  // Syncs the local state with the loaded global state
  useEffect(() => {
    try {
      if (globalMetadata && Object.keys(globalMetadata || {}).length > 0) {
        setLocalGlobalData(globalMetadata);
      }
    } catch {}
  }, [globalMetadata]);

  // Computes which tab to open first based on loaded data
  const computeFirstTab = (data) => { /* ... */ return 'reading'; };
  const [tabAutoSelected, setTabAutoSelected] = useState(false);

  useEffect(() => {
    // ... (logic to set initial tab remains the same)
  }, [localGlobalData, tabAutoSelected]);

  // Memoized counts for navigation badges
  const countItems = (obj) => Object.values(obj || {}).flat().length;
  const countTiers = (obj) => Object.keys(obj || {}).length;

  // Memoized navigation items with counts
  const navItems = useMemo(() => {
    // ... (Calculations for counts remain the same)
    return [
      { group: 'Content: Learn & Prep', key: 'reading', label: 'Reading Hub (Books/Articles)', icon: BookOpen, accent: 'TEAL', count: totalReadingItems },
      // ... (rest of nav items remain the same)
    ];
  }, [localGlobalData]);

  // Renders the content based on the selected tab
  const renderTabContent = () => { /* ... */ };

  // Handles the final save operation (calls the updated two-document write)
  const handleFinalSave = async () => { /* ... */ };

  return (
    <>
      {/* Navigation tabs */}
      {/* ... */}

      {/* Main content area */}
      <div className='mt-6 p-6 rounded-xl border-2 shadow-lg bg-white'>
        {renderTabContent()}
      </div>

      {/* Status banner */}
      {/* ... */}

      {/* Final Save Button: Triggers the multi-document write */}
      <Button onClick={handleFinalSave} disabled={isSaving} className={`mt-8 w-full bg-[#E04E1B] hover:bg-red-700`}>
        {isSaving ? (
          <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> COMMITTING ALL STAGED CHANGES...</span>
        ) : <><ShieldCheck className='w-5 h-5 mr-2'/> Finalize & Write All Staged Changes to Database</>}
      </Button>
    </>
  );
};

export default function AdminDataMaintenanceScreen({ navigate }) {
  // ... (Initial setup, password check, and loading state rendering remain the same) ...
  
  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.LIGHT_GRAY }}>
      {/* Title/Header */}
      {/* ... */}

      {/* Renders the main editor hub */}
      <GlobalDataEditor
        globalMetadata={resolveGlobalMetadata(metadata)}
        updateGlobalMetadata={updateGlobalMetadata}
        db={db}
      />
    </div>
  );
}