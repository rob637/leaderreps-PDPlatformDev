// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  ArrowLeft, Cpu, Lock, CheckCircle, AlertTriangle, CornerRightUp, Settings,
  BarChart3, Code, List, BookOpen, Target, Users,
  ShieldCheck, Plus, Trash2, Save, X, FileText, UploadCloud, Dumbbell, Link,
  Briefcase
} from 'lucide-react';

// ---- Helper: Resolve/normalize global metadata shape ----
function resolveGlobalMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const knownKeys = new Set([
    'LEADERSHIP_DOMAINS','RESOURCE_LIBRARY','READING_CATALOG_SERVICE',
    'COMMITMENT_BANK','SCENARIO_CATALOG','TARGET_REP_CATALOG','LEADERSHIP_TIERS'
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
  
  // ➡️ FIX 1: EXPAND FIELDS ARRAY
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
    // ➡️ FIX 2: UPDATE GRID LAYOUT TO 9 COLUMNS (7 fields + 2 action columns)
    <div className={`grid grid-cols-9 gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
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

  // ➡️ FIX 3: Category Initialization for Reading Hub Table
  useEffect(() => {
    if (categoryKeys.length > 0 && !categoryKeys.includes(currentCategory)) {
      setCurrentCategory(categoryKeys[0]);
    } else if (categoryKeys.length === 0) {
      setCurrentCategory('Uncategorized');
    }
  }, [categoryKeys, currentCategory]);

const books = useMemo(
  () => (Array.isArray(safeCatalog[currentCategory]) ? safeCatalog[currentCategory] : []),
  [safeCatalog, currentCategory]
);
  const booksList = useMemo(() => (Array.isArray(books) ? books : []).filter(Boolean), [books]);

  const handleUpdateBook = useCallback((category, updatedBook) => {
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      const targetArray = newCatalog[category] || [];
      const index = targetArray.findIndex(b => b.id === updatedBook.id);
      if (index !== -1) {
        targetArray[index] = updatedBook;
      } else {
        targetArray.push(updatedBook);
      }
      newCatalog[category] = targetArray;
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  }, [setGlobalData]);

  const handleDeleteBook = useCallback((category, bookId) => {
    if (!window.confirm(`Delete book ID ${bookId} from '${category}'?`)) return;
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      newCatalog[category] = (newCatalog[category] || []).filter(b => b.id !== bookId);
      return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
    });
  }, [setGlobalData]);

  const handleAddNewBook = () => {
    const newBook = { id: generateId(), title: 'NEW BOOK', author: 'New Author', pages: 100, isNew: true };
    setGlobalData(prevGlobal => {
      const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
      newCatalog[currentCategory] = newCatalog[currentCategory] || [];
      newCatalog[currentCategory].push(newBook);
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
              onClick={() => setCurrentTab(key)}
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

        {/* ➡️ FIX 4: UPDATE GRID LAYOUT TO 9 COLUMNS in Header */}
        <div className="grid grid-cols-9 gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]">
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
            expectedFields={[{ key: 'id', type: 'text' }, { key: 'title', type: 'text' }, { key: 'author', type: 'text' }, { key: 'pages', type: 'number' }]}
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
  const tiersArray = useMemo(() => Object.values(data.LEADERSHIP_TIERS || {}).map(t => ({ ...t, [idKey]: t[idKey] || t.id })), [data.LEADERSHIP_TIERS, idKey]);
  const { handleDeleteItem } = useArrayDataCRUD('LEADERSHIP_TIERS', setGlobalData, idKey);

  const handleSaveTier = useCallback((updatedTier) => {
    setGlobalData(prevGlobal => {
      const newTiers = JSON.parse(JSON.stringify(prevGlobal.LEADERSHIP_TIERS || {}));
      const existingId = updatedTier[idKey];
      if (newTiers[existingId] && existingId !== updatedTier.id) {
        delete newTiers[existingId];
      }
      newTiers[updatedTier.id] = { ...updatedTier, isNew: false };
      return { ...prevGlobal, LEADERSHIP_TIERS: newTiers };
    });
  }, [setGlobalData, idKey]);

  const handleAddNewTier = () => {
    const nextIndex = tiersArray.length + 1;
    const newTier = { [idKey]: `T${nextIndex}`, id: `T${nextIndex}`, name: `New Tier ${nextIndex}`, icon: 'Briefcase', hex: '#CCCCCC', isNew: true };
    handleSaveTier(newTier);
  };

  const handleTierDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const newTiers = JSON.parse(JSON.stringify(prevGlobal.LEADERSHIP_TIERS || {}));
      parsedData.forEach(tier => { newTiers[tier.id] = tier; });
      alert(`${parsedData.length} tiers staged for update/creation.`);
      return { ...prevGlobal, LEADERSHIP_TIERS: newTiers };
    });
  }, [setGlobalData]);

  const fields = [
    { key: 'name', label: 'Tier Name', type: 'text' },
    { key: 'icon', label: 'Icon (Lucide Key)', type: 'text' },
    { key: 'hex', label: 'Color (Hex)', type: 'text' },
  ];
  const gridColumns = `grid-cols-${fields.length + 2}`;

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>Tier & Goal Maintenance ({tiersArray.length} Tiers)</p>
      <p className='text-sm text-gray-700 mb-4'>Edit core tier metadata. <strong>The ID field must be unique (e.g., T1, T2).</strong> Changes are staged locally.</p>

      <div className={`grid ${gridColumns} gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]`}>
        <span className="truncate">Tier ID (Key)</span>
        {fields.map(f => <span key={f.key} className="truncate">{f.label}</span>)}
        <span className="text-right">Actions</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
        {tiersArray.map((tier) => (
          <GenericRowEditor
            key={tier[idKey]}
            item={tier}
            onUpdate={handleSaveTier}
            onDelete={handleDeleteItem}
            isSaving={isSaving}
            fields={fields}
            idKey={idKey}
          />
        ))}
      </div>

      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewTier} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Tier
        </Button>
        <CSVUploadComponent
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
  const scenariosArray = data.SCENARIO_CATALOG || [];
  const { handleUpdateItem, handleDeleteItem } = useArrayDataCRUD('SCENARIO_CATALOG', setGlobalData, idKey);

  const handleAddNewScenario = () => {
    const newScenario = { [idKey]: generateId(), title: 'New Scenario Title', short_desc: 'Brief description...', persona: 'The Deflector', difficultyLevel: 50, choices: [], isNew: true };
    handleUpdateItem(newScenario);
  };

  const handleScenarioDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const existingIds = new Set(prevGlobal.SCENARIO_CATALOG?.map(s => s.id) || []);
      const newScenarios = parsedData.filter(s => !existingIds.has(s.id));
      alert(`Mass upload: ${newScenarios.length} new scenarios staged.`);
      return { ...prevGlobal, SCENARIO_CATALOG: [...(prevGlobal.SCENARIO_CATALOG || []), ...newScenarios] };
    });
  }, [setGlobalData]);

  const fields = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'short_desc', label: 'Short Description', type: 'text' },
    { key: 'persona', label: 'Persona', type: 'text' },
    { key: 'difficultyLevel', label: 'Difficulty (0-100)', type: 'number' },
  ];
  const gridColumns = `grid-cols-${fields.length + 2}`;

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>Coaching Scenario Maintenance ({scenariosArray.length} Scenarios)</p>
      <p className='text-sm text-gray-700 mb-4'>Edit the pre-seeded coaching scenarios. <strong>Title and Description must be set.</strong> Changes are staged locally.</p>

      <div className={`grid ${gridColumns} gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]`}>
        <span className="truncate">ID</span>
        {fields.map(f => <span key={f.key} className="truncate">{f.label}</span>)}
        <span className="text-right">Actions</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
        {scenariosArray.map((scenario) => (
          <GenericRowEditor
            key={scenario[idKey]}
            item={scenario}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            isSaving={isSaving}
            fields={fields}
            idKey={idKey}
          />
        ))}
      </div>

      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewScenario} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Scenario
        </Button>
        <CSVUploadComponent
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
  const targetRepsArray = data.TARGET_REP_CATALOG || [];
  const { handleUpdateItem, handleDeleteItem } = useArrayDataCRUD('TARGET_REP_CATALOG', setGlobalData, idKey);

  const handleAddNewTargetRep = () => {
    const newRep = { [idKey]: generateId(), text: 'New Target Rep - Click Edit to define behavior.', linkedTier: 'T3', linkedGoal: 'Strategic Focus', isNew: true };
    handleUpdateItem(newRep);
  };

  const handleTargetRepDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const existingIds = new Set(prevGlobal.TARGET_REP_CATALOG?.map(r => r.id) || []);
      const newReps = parsedData.filter(r => !existingIds.has(r.id));
      alert(`Mass upload: ${newReps.length} new Target Reps staged.`);
      return { ...prevGlobal, TARGET_REP_CATALOG: [...(prevGlobal.TARGET_REP_CATALOG || []), ...newReps] };
    });
  }, [setGlobalData]);

  const fields = [
    { key: 'text', label: 'Rep Text', type: 'text' },
    { key: 'linkedTier', label: 'Linked Tier', type: 'text' },
    { key: 'linkedGoal', label: 'Goal', type: 'text' },
  ];
  const gridColumns = `grid-cols-${fields.length + 2}`;

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>Target Rep Catalog Maintenance ({targetRepsArray.length} Reps)</p>
      <p className='text-sm text-gray-700 mb-4'>These reps are randomly selected to feature as "Today's Strategic Focus" on the Dashboard.</p>

      <div className={`grid ${gridColumns} gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]`}>
        <span className="truncate">ID</span>
        {fields.map(f => <span key={f.key} className="truncate">{f.label}</span>)}
        <span className="text-right">Actions</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
        {targetRepsArray.map((rep) => (
          <GenericRowEditor
            key={rep[idKey]}
            item={rep}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            isSaving={isSaving}
            fields={fields}
            idKey={idKey}
          />
        ))}
      </div>

      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewTargetRep} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Target Rep
        </Button>
        <CSVUploadComponent
          onDataParsed={handleTargetRepDataParsed}
          expectedFields={fields.concat({ key: 'id', type: 'text' })}
          isSaving={isSaving}
          buttonText="Mass Upload Target Reps (.csv)"
        />
      </div>
    </div>
  );
};

/* =====================
   COMMITMENT BANK
===================== */
const flattenCommitmentBank = (bank) => {
  let flatList = [];
  for (const category in bank) {
    flatList = flatList.concat(bank[category].map(item => ({ ...item, category: category, id: item.id || generateId() })));
  }
  return flatList;
};

const handleUpdateCommitmentBank = (setGlobalData) => useCallback((updatedItem) => {
  setGlobalData(prevGlobal => {
    const newBank = JSON.parse(JSON.stringify(prevGlobal.COMMITMENT_BANK || {}));
    const newCategory = updatedItem.category;
    newBank[newCategory] = newBank[newCategory] || [];

    Object.keys(newBank).forEach(cat => {
      if (cat !== newCategory) {
        newBank[cat] = newBank[cat].filter(item => item.id !== updatedItem.id);
      }
    });

    const targetArray = newBank[newCategory];
    const existingIndex = targetArray.findIndex(item => item.id === updatedItem.id);
    if (existingIndex !== -1) {
      targetArray[existingIndex] = { ...updatedItem, isNew: false };
    } else {
      targetArray.push({ ...updatedItem, isNew: false });
    }

    Object.keys(newBank).forEach(cat => { if (newBank[cat].length === 0) delete newBank[cat]; });

    return { ...prevGlobal, COMMITMENT_BANK: newBank };
  });
}, [setGlobalData]);

const handleDeleteCommitmentBankItem = (setGlobalData) => useCallback((itemId) => {
  if (!window.confirm(`Are you sure you want to delete item ${itemId}? This is staged for a database write.`)) {
    return;
  }
  setGlobalData(prevGlobal => {
    const newBank = JSON.parse(JSON.stringify(prevGlobal.COMMITMENT_BANK || {}));
    Object.keys(newBank).forEach(cat => {
      newBank[cat] = newBank[cat].filter(item => item.id !== itemId);
      if (newBank[cat].length === 0) delete newBank[cat];
    });
    return { ...prevGlobal, COMMITMENT_BANK: newBank };
  });
}, [setGlobalData]);

const CommitmentBankTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  const bank = data.COMMITMENT_BANK || {};
  const flatBank = useMemo(() => flattenCommitmentBank(bank), [bank]);

  const handleUpdate = useMemo(() => handleUpdateCommitmentBank(setGlobalData), [setGlobalData]);
  const handleDelete = useMemo(() => handleDeleteCommitmentBankItem(setGlobalData), [setGlobalData]);

  const handleAddNewRep = () => {
    const newRep = { [idKey]: generateId(), text: 'New Commitment Text', linkedTier: 'T3', linkedGoal: 'Strategic Execution', category: 'T3: Strategic Alignment', isNew: true };
    handleUpdate(newRep);
  };

  const fields = [
    { key: 'text', label: 'Commitment Text', type: 'text' },
    { key: 'linkedTier', label: 'Tier', type: 'text' },
    { key: 'linkedGoal', label: 'Goal', type: 'text' },
  ];

  const handleDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const newBank = JSON.parse(JSON.stringify(prevGlobal.COMMITMENT_BANK || {}));
      parsedData.forEach(item => {
        const category = item.category || `${item.linkedTier}: General`;
        newBank[category] = newBank[category] || [];
        Object.keys(newBank).forEach(cat => { newBank[cat] = newBank[cat].filter(i => i.id !== item.id); });
        newBank[category].push(item);
      });
      alert(`${parsedData.length} commitments staged for update/creation across categories.`);
      return { ...prevGlobal, COMMITMENT_BANK: newBank };
    });
  }, [setGlobalData]);

  const gridColumns = `grid-cols-${fields.length + 3}`;

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>Commitment Bank Maintenance ({flatBank.length} Reps in {Object.keys(bank).length} Categories)</p>
      <p className='text-sm text-gray-700 mb-4'>Edit the master list of suggested micro-habits. <strong>To change the category, edit the "category" field in the row.</strong></p>

      <div className={`grid ${gridColumns} gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]`}>
        <span className="truncate">ID</span>
        <span className="truncate">Category</span>
        {fields.map(f => <span key={f.key} className="truncate">{f.label}</span>)}
        <span className="text-right">Actions</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
        {flatBank.map((item) => (
          <GenericRowEditor
            key={item[idKey]}
            item={item}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isSaving={isSaving}
            fields={fields.concat({ key: 'category', label: 'Category', type: 'text' })}
            idKey={idKey}
            extraDisplay={{ key: 'category', label: 'Category' }}
          />
        ))}
      </div>

      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewRep} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Rep
        </Button>
        <CSVUploadComponent
          onDataParsed={handleDataParsed}
          expectedFields={fields.concat([{ key: 'id', type: 'text' }, { key: 'category', type: 'text' }])}
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
  const domainsArray = data.LEADERSHIP_DOMAINS || [];
  const { handleUpdateItem, handleDeleteItem } = useArrayDataCRUD('LEADERSHIP_DOMAINS', setGlobalData, idKey);

  const handleAddNewDomain = () => {
    const newDomain = { [idKey]: generateId(), title: 'New Domain Track', subtitle: 'Brief description...', coreTension: 'The core tension.', color: 'TEAL', focus: ['Focus 1', 'Focus 2'], isNew: true };
    handleUpdateItem(newDomain);
  };

  const handleDomainDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const existingIds = new Set(prevGlobal.LEADERSHIP_DOMAINS?.map(d => d.id) || []);
      const newDomains = parsedData.filter(d => !existingIds.has(d.id));
      alert(`Mass upload: ${newDomains.length} new domains staged.`);
      return { ...prevGlobal, LEADERSHIP_DOMAINS: [...(prevGlobal.LEADERSHIP_DOMAINS || []), ...newDomains] };
    });
  }, [setGlobalData]);

  const fields = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'coreTension', label: 'Core Tension', type: 'text' },
    { key: 'color', label: 'Color (Key)', type: 'text' },
  ];

  const gridColumns = `grid-cols-${fields.length + 2}`;

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>Leadership Domain Maintenance ({domainsArray.length} Domains)</p>
      <p className='text-sm text-gray-700 mb-4'>Edit the specialized leadership tracks. Note: Complex fields like "focus" should be edited in the Raw Config Editor, unless you expand this editor.</p>

      <div className={`grid ${gridColumns} gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]`}>
        <span className="truncate">ID</span>
        {fields.map(f => <span key={f.key} className="truncate">{f.label}</span>)}
        <span className="text-right">Actions</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
        {domainsArray.map((domain) => (
          <GenericRowEditor
            key={domain[idKey]}
            item={domain}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            isSaving={isSaving}
            fields={fields}
            idKey={idKey}
          />
        ))}
      </div>

      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewDomain} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Domain
        </Button>
        <CSVUploadComponent
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
const flattenResourceLibrary = (library) => {
  let flatList = [];
  for (const domainId in library) {
    flatList = flatList.concat(library[domainId].map(item => ({ ...item, domainId: domainId, id: item.id || generateId() })));
  }
  return flatList;
};

const handleUpdateResourceLibrary = (setGlobalData) => useCallback((updatedItem) => {
  setGlobalData(prevGlobal => {
    const newLibrary = JSON.parse(JSON.stringify(prevGlobal.RESOURCE_LIBRARY || {}));
    const newDomainId = updatedItem.domainId;
    newLibrary[newDomainId] = newLibrary[newDomainId] || [];

    Object.keys(newLibrary).forEach(domain => {
      if (domain !== newDomainId) {
        newLibrary[domain] = newLibrary[domain].filter(item => item.id !== updatedItem.id);
      }
    });

    const targetArray = newLibrary[newDomainId];
    const existingIndex = targetArray.findIndex(item => item.id === updatedItem.id);
    if (existingIndex !== -1) {
      targetArray[existingIndex] = { ...updatedItem, isNew: false };
    } else {
      targetArray.push({ ...updatedItem, isNew: false });
    }

    Object.keys(newLibrary).forEach(domain => { if (newLibrary[domain].length === 0) delete newLibrary[domain]; });

    return { ...prevGlobal, RESOURCE_LIBRARY: newLibrary };
  });
}, [setGlobalData]);

const handleDeleteResourceLibraryItem = (setGlobalData) => useCallback((itemId) => {
  if (!window.confirm(`Are you sure you want to delete item ${itemId}? This is staged for a database write.`)) {
    return;
  }
  setGlobalData(prevGlobal => {
    const newLibrary = JSON.parse(JSON.stringify(prevGlobal.RESOURCE_LIBRARY || {}));
    Object.keys(newLibrary).forEach(domain => {
      newLibrary[domain] = newLibrary[domain].filter(item => item.id !== itemId);
      if (newLibrary[domain].length === 0) delete newLibrary[domain];
    });
    return { ...prevGlobal, RESOURCE_LIBRARY: newLibrary };
  });
}, [setGlobalData]);

const ResourceLibraryTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
  const library = data.RESOURCE_LIBRARY || data.RESOURCE_CONTENT_LIBRARY || {};
  const domains = data.LEADERSHIP_DOMAINS || [];
  const flatLibrary = useMemo(() => flattenResourceLibrary(library), [library]);

  const handleUpdate = useMemo(() => handleUpdateResourceLibrary(setGlobalData), [setGlobalData]);
  const handleDelete = useMemo(() => handleDeleteResourceLibraryItem(setGlobalData), [setGlobalData]);

  const handleAddNewResource = () => {
    const newResource = { [idKey]: generateId(), title: 'New Resource Title', type: 'Report', description: 'Short summary.', domainId: domains[0]?.id || 'uncategorized', content: '## Resource Content\n\n- Write the content here in **Markdown**.', isNew: true };
    handleUpdate(newResource);
  };

  const fields = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ];

  const handleDataParsed = useCallback((parsedData) => {
    setGlobalData(prevGlobal => {
      const newLibrary = JSON.parse(JSON.stringify(prevGlobal.RESOURCE_LIBRARY || {}));
      parsedData.forEach(item => {
        const domainId = item.domainId || domains[0]?.id || 'uncategorized';
        newLibrary[domainId] = newLibrary[domainId] || [];
        Object.keys(newLibrary).forEach(dom => { newLibrary[dom] = newLibrary[dom].filter(i => i.id !== item.id); });
        newLibrary[domainId].push(item);
      });
      alert(`${parsedData.length} resources staged for update/creation.`);
      return { ...prevGlobal, RESOURCE_LIBRARY: newLibrary };
    });
  }, [setGlobalData, domains]);

  const gridColumns = `grid-cols-${fields.length + 3}`;

  return (
    <div className='mt-4'>
      <p className='text-sm font-bold text-[#002E47] mb-2'>Resource Library Maintenance ({flatLibrary.length} Resources in {Object.keys(library).length} Domains)</p>
      <p className='text-sm text-gray-700 mb-4'><strong>Warning:</strong> The 'content' field uses Markdown.</p>

      <div className={`grid ${gridColumns} gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]`}>
        <span className="truncate">ID</span>
        <span className="truncate">Domain ID</span>
        {fields.map(f => <span key={f.key} className="truncate">{f.label}</span>)}
        <span className="text-right">Actions</span>
      </div>

      <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
        {flatLibrary.map((item) => (
          <GenericRowEditor
            key={item[idKey]}
            item={item}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isSaving={isSaving}
            fields={fields.concat([{ key: 'domainId', label: 'Domain ID', type: 'text' }, { key: 'content', label: 'Content (Markdown)', type: 'text' }])}
            idKey={idKey}
            extraDisplay={{ key: 'domainId', label: 'Domain ID' }}
          />
        ))}
      </div>

      <div className='mt-4 flex space-x-3'>
        <Button onClick={handleAddNewResource} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
          <Plus className='w-5 h-5 mr-2'/> Add New Resource
        </Button>
        <CSVUploadComponent
          onDataParsed={handleDataParsed}
          expectedFields={fields.concat([{ key: 'id', type: 'text' }, { key: 'domainId', type: 'text' }, { key: 'content', type: 'text' }])}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};

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

  // ➡️ FIX 5: Reliably rehydrate local state whenever globalMetadata changes
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