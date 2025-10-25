// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, Cpu, Lock, CheckCircle, AlertTriangle, CornerRightUp, Settings, BarChart3, TrendingUp, Download, Code, List, BookOpen, Target, Users, ShieldCheck, Plus, Trash2, Save, X, FileText, UploadCloud, Dumbbell, Link, Briefcase, Mic, Edit, Layers, ChevronRight, Home, Zap, HeartPulse } from 'lucide-react';

// ---- Helper: Resolve/normalize global metadata shape ----
function resolveGlobalMetadata(meta) {
  if (!meta || typeof meta !== 'object') return {};
  const knownKeys = new Set([
    'LEADERSHIP_DOMAINS','RESOURCE_LIBRARY','READING_CATALOG_SERVICE',
    'COMMITMENT_BANK','SCENARIO_CATALOG','TARGET_REP_CATALOG','LEADERSHIP_TIERS'
  ]);
  // If the object already has any known top-level keys, return as-is.
  const hasKnown = Object.keys(meta).some(k => knownKeys.has(k));
  let payload = hasKnown ? meta
              : (meta.config || meta.global || meta.data || meta.payload || {});

  // Fallback aliasing (support older/newer schema variants)
  if (payload && !payload.SCENARIO_CATALOG && Array.isArray(meta.QUICK_CHALLENGE_CATALOG)) {
    payload = { ...payload, SCENARIO_CATALOG: meta.QUICK_CHALLENGE_CATALOG };
  }
  if (payload && !payload.TARGET_REP_CATALOG && Array.isArray(meta.TARGET_REPS)) {
    payload = { ...payload, TARGET_REP_CATALOG: meta.TARGET_REPS };
  }
  if (payload && !payload.RESOURCE_LIBRARY && meta.RESOURCE_CONTENT_LIBRARY) {
    payload = { ...payload, RESOURCE_LIBRARY: meta.RESOURCE_CONTENT_LIBRARY };
  }
  return payload || {};
}


/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47', 
  TEAL: '#47A88D', 
  ORANGE: '#E04E1B', 
  GREEN: '#10B981',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
};

// CRITICAL FIX: Password changed to 7777
const PASSWORD = "7777"; 
const ADMIN_SESSION_KEY = "admin_maintenance_logged_in"; // Session key for persistence

const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY', isSmall = false }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    const Tag = isSmall ? 'div' : 'div';
    return (
        <Tag
            className={`relative p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 text-left ${className}`}
            style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
        >
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
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

// =========================================================
// NEW: UTILITIES AND REUSABLE COMPONENTS
// =========================================================

// Helper to generate a unique ID for new items (basic example)
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// --- GENERIC ARRAY CRUD HOOK ---
const useArrayDataCRUD = (dataKey, setGlobalData, idKey = 'id') => {

    const handleUpdateItem = useCallback((updatedItem) => {
        setGlobalData(prevGlobal => {
            // Deep clone the object for safe modification
            const newState = JSON.parse(JSON.stringify(prevGlobal));
            const target = newState[dataKey];
            
            // Check if the target is an Array or Object (for Tiers)
            if (Array.isArray(target)) {
                const existingIndex = target.findIndex(item => item[idKey] === updatedItem[idKey]);
                if (existingIndex !== -1) {
                    target[existingIndex] = { ...updatedItem, isNew: false };
                } else {
                    target.push({ ...updatedItem, isNew: false });
                }
            } else if (typeof target === 'object' && target !== null) {
                // Special handling for the Tiers object structure: key is the ID
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
                // Special handling for the Tiers object structure: delete the key
                delete newState[dataKey][itemId];
            }
            return newState;
        });
    }, [dataKey, setGlobalData, idKey]);

    return { handleUpdateItem, handleDeleteItem };
};


// --- GENERIC ROW EDITOR COMPONENT ---
const GenericRowEditor = ({ item: initialItem, onUpdate, onDelete, isSaving, fields, idKey = 'id', extraDisplay = {} }) => {
    const [item, setItem] = useState(initialItem);
    const [isEditing, setIsEditing] = useState(initialItem.isNew || false); 
    const [isStaged, setIsStaged] = useState(initialItem.isNew || false);
    
    useEffect(() => {
        setItem(initialItem);
        setIsEditing(initialItem.isNew || false);
        setIsStaged(initialItem.isNew || false);
    }, [initialItem]);
    
    const handleChange = (field, value, type) => {
        const parsedValue = type === 'number' ? parseInt(value) || 0 : value;
        setItem(prev => ({ ...prev, [field]: parsedValue }));
        setIsStaged(true);
    };
    
    const handleSave = () => {
        // Validation check for ID field when creating a new item
        if (item.isNew && (!item[idKey] || item[idKey].trim() === '')) {
            alert(`The ${idKey} field is required for new items.`);
            return;
        }
        onUpdate(item); 
        setIsEditing(false);
        setIsStaged(false);
    };

    const handleCancel = () => {
        if (initialItem.isNew) {
            onDelete(initialItem[idKey]); 
        } else {
            setItem(initialItem); 
            setIsEditing(false);
            setIsStaged(false);
        }
    };

    const inputClass = "w-full p-1.5 border rounded-lg focus:ring-1 focus:ring-[#E04E1B] text-sm bg-white";
    const displayClass = "w-full p-1.5 text-sm text-gray-700 truncate";
    
    // Calculate grid columns: number of fields + 1 for the ID + 1 for actions
    const gridColumns = `grid-cols-${fields.length + 2 + (extraDisplay.key ? 1 : 0)}`;

    return (
        <div className={`grid ${gridColumns} gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
            {/* ID Column */}
            <div className="truncate">
                {isEditing && initialItem.isNew ? (
                    <input
                        type="text"
                        value={item[idKey] || ''}
                        onChange={(e) => handleChange(idKey, e.target.value, 'text')}
                        className={inputClass + ' font-mono text-xs'}
                        placeholder={`Unique ${idKey}`}
                        disabled={isSaving}
                    />
                ) : (
                    <p className='w-full p-1.5 text-xs font-mono text-gray-500 truncate'>{initialItem[idKey]}</p>
                )}
            </div>

            {/* Extra Display Column (e.g., Parent Key Name) */}
            {extraDisplay.key && (
                <div className='truncate'>
                    <p className='w-full p-1.5 text-xs font-mono text-gray-700 truncate bg-gray-100 rounded-sm'>{initialItem[extraDisplay.key]}</p>
                </div>
            )}


            {/* Editable Fields */}
            {fields.map(field => (
                <div key={field.key} className="truncate">
                    {isEditing ? (
                        <input
                            type={field.type || 'text'}
                            value={item[field.key] || (field.type === 'number' ? 0 : '')}
                            onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                            className={inputClass}
                            disabled={isSaving}
                        />
                    ) : (
                        <p className={displayClass}>{item[field.key] || (field.type === 'number' ? 0 : '-')}</p>
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
                        <Button onClick={() => onDelete(initialItem[idKey])} isSmall variant='secondary' disabled={isSaving}>
                            <Trash2 className='w-4 h-4' />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};


// --- NEW: CSV Upload Component (Handles client-side parsing) ---
const CSVUploadComponent = ({ onDataParsed, expectedFields, isSaving, buttonText = "Mass Upload (.csv)" }) => {
    // ... (CSVUploadComponent remains the same)
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState(null);
    const [status, setStatus] = useState(null); // 'success', 'error', 'pending'

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setStatus('pending');
        const reader = new FileReader();

        reader.onload = (e) => {
            const csvText = e.target.result;
            try {
                // Simple CSV parsing using splitting (robust enough for simple key-value sets)
                const lines = csvText.split('\n').filter(line => line.trim() !== '');
                if (lines.length <= 1) throw new Error("CSV must contain a header row and at least one data row.");
                
                // 1. Extract and sanitize headers
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                const requiredHeaders = expectedFields.map(f => f.key);
                const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`);
                }

                // 2. Parse data rows
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    const item = {};
                    headers.forEach((header, index) => {
                        // Attempt to cast numbers if expected
                        const fieldType = expectedFields.find(f => f.key === header)?.type;
                        if (fieldType === 'number') {
                            item[header] = parseInt(values[index]) || 0;
                        } else {
                            item[header] = values[index];
                        }
                    });
                    // Ensure a unique ID is present for merging/updating
                    if (!item.id) item.id = generateId(); 
                    data.push(item);
                }

                onDataParsed(data); // Pass parsed data up to the parent editor
                setStatus('success');
            } catch (error) {
                setStatus('error');
                console.error("CSV Parsing Error:", error);
                alert(`Error parsing CSV: ${error.message}`);
            } finally {
                event.target.value = null; // Clear file input
            }
        };

        reader.readAsText(file);
    };

    const StatusIcon = status === 'success' ? CheckCircle : status === 'error' ? AlertTriangle : FileText;
    const StatusColor = status === 'success' ? COLORS.GREEN : status === 'error' ? COLORS.RED : COLORS.TEAL;

    return (
        <div className='inline-block'>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isSaving}
            />
            <Button 
                onClick={() => fileInputRef.current.click()} 
                disabled={isSaving} 
                variant={status === 'success' ? 'primary' : 'outline'}
                style={{ borderColor: StatusColor, color: StatusColor }}
                className='flex items-center justify-center'
            >
                <UploadCloud className='w-5 h-5 mr-2'/> 
                {status === 'success' ? 'Data Staged (Review Now)' : status === 'error' ? 'Parsing Failed (Re-upload)' : buttonText}
            </Button>
            {fileName && (
                <span className={`ml-3 text-sm font-medium flex items-center ${status === 'error' ? 'text-red-500' : 'text-gray-600'}`}>
                    <StatusIcon className='w-4 h-4 mr-1' style={{ color: StatusColor }}/> 
                    {fileName}
                </span>
            )}
        </div>
    );
};


// --- READING HUB EDITOR (No changes to logic, just structure) ---
const BookRowEditor = ({ book: initialBook, categoryKey, onUpdate, onDelete, isSaving }) => {
    // ... (BookRowEditor implementation is as before) ...
    const [book, setBook] = useState(initialBook);
    const [isEditing, setIsEditing] = useState(initialBook.isNew || false); 
    const [isStaged, setIsStaged] = useState(initialBook.isNew || false);
    
    useEffect(() => {
        setBook(initialBook);
        setIsEditing(initialBook.isNew || false);
        setIsStaged(initialBook.isNew || false);
    }, [initialBook]);
    
    const handleChange = (field, value, type) => {
        const parsedValue = type === 'number' ? parseInt(value) || 0 : value;
        setBook(prev => ({ ...prev, [field]: parsedValue }));
        setIsStaged(true);
    };
    
    const handleSave = () => {
        onUpdate(categoryKey, { ...book, isNew: false }); 
        setIsEditing(false);
        setIsStaged(false);
    };

    const handleCancel = () => {
        if (initialBook.isNew) {
            onDelete(categoryKey, book.id);
        } else {
            setBook(initialBook);
            setIsEditing(false);
            setIsStaged(false);
        }
    };

    const inputClass = "w-full p-1.5 border rounded-lg focus:ring-1 focus:ring-[#E04E1B] text-sm bg-white";
    
    const fields = [
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'pages', label: 'Pages', type: 'number' },
    ];

    return (
        <div className={`grid grid-cols-4 gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
            {fields.map(field => (
                <div key={field.key} className="truncate">
                    {isEditing ? (
                        <input
                            type={field.type || 'text'}
                            value={book[field.key] || (field.type === 'number' ? 0 : '')}
                            onChange={(e) => handleChange(field.key, e.target.value, field.type)}
                            className={inputClass}
                            disabled={isSaving}
                        />
                    ) : (
                        <p className="w-full p-1.5 text-sm text-gray-700 truncate">{book[field.key] || (field.type === 'number' ? 0 : '-')}</p>
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

const ReadingHubTableEditor = ({ catalog, isSaving, setGlobalData, navigate }) => { 
    
    const safeCatalog = catalog || {};
    const categoryKeys = useMemo(() => Object.keys(safeCatalog).sort(), [safeCatalog]);
    const [currentCategory, setCurrentCategory] = useState(categoryKeys[0] || 'Uncategorized');

    useEffect(() => {
        if (!categoryKeys.includes(currentCategory) && categoryKeys.length > 0) {
            setCurrentCategory(categoryKeys[0]);
        } else if (categoryKeys.length === 0) {
            setCurrentCategory('Uncategorized');
        }
    }, [categoryKeys]);

    const books = useMemo(() => safeCatalog[currentCategory] || [], [safeCatalog, currentCategory]);

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
        if (!window.confirm(`Are you sure you want to delete book ID ${bookId} from category ${category}? This is staged for a database write.`)) { return; }
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
        const newCatName = prompt("Enter the name for the new category (e.g., 'Team Health'):");
        if (newCatName && newCatName.trim()) {
            setGlobalData(prevGlobal => {
                const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
                if (!newCatalog[newCatName.trim()]) {
                    newCatalog[newCatName.trim()] = [];
                }
                return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
            });
            setCurrentCategory(newCatName.trim());
        }
    };
    
    // CSV Upload Handler for Nested Structure
    const handleBookDataParsed = useCallback((parsedData) => {
        // Merge parsed data into the current category
        setGlobalData(prevGlobal => {
            const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
            const existingBookIds = new Set(newCatalog[currentCategory]?.map(b => b.id) || []);
            
            // Filter out duplicates and merge
            const newBooks = parsedData.filter(b => !existingBookIds.has(b.id));
            newCatalog[currentCategory] = [...(newCatalog[currentCategory] || []), ...newBooks];
            
            alert(`Mass upload: ${newBooks.length} new books staged in category '${currentCategory}'.`);
            return { ...prevGlobal, READING_CATALOG_SERVICE: newCatalog };
        });
    }, [setGlobalData, currentCategory]);


    return (
        <div className='mt-4 flex'>
            {/* Category Selector (Sidebar) */}
            <div className='w-64 pr-4 border-r border-gray-200'>
                <p className='text-sm font-bold text-[#002E47] mb-2'>1. Select Category</p>
                <div className='space-y-1'>
                    {categoryKeys.map(key => (
                        <button
                            key={key}
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

            {/* Book Table Editor (Main Content) */}
            <div className='flex-1 pl-6'>
                <p className='text-lg font-extrabold mb-2' style={{color: COLORS.NAVY}}>{currentCategory} ({books.length} Books)</p>
                <p className='text-sm text-gray-700 mb-4'>
                    Use the table below for CRUD operations. Edits are staged until the **Finalize & Write** button is clicked.
                </p>

                {/* Table Header */}
                <div className="grid grid-cols-4 gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]">
                    <span className="truncate">Title</span>
                    <span className="truncate">Author</span>
                    <span className="truncate">Pages</span>
                    <span className="text-right">Actions</span>
                </div>
                
                {/* Book Rows Container */}
                <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner mt-2">
                    {books.length > 0 ? (
                        books.map(book => (
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


// --- TIERS & GOALS EDITOR (LEADERSHIP_TIERS) ---
const TiersGoalsTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
    // CRITICAL: We must transform the object structure {T1: {name:.., hex:..}, T2: {...}} into an array of objects
    const tiersArray = useMemo(() => Object.values(data.LEADERSHIP_TIERS || {}).map(t => ({ 
        ...t, 
        [idKey]: t[idKey] || t.id 
    })), [data.LEADERSHIP_TIERS, idKey]);

    const { handleDeleteItem } = useArrayDataCRUD('LEADERSHIP_TIERS', setGlobalData, idKey);

    // CRITICAL: Overwrite the handleUpdateItem to also update the object keys when saving.
    const handleSaveTier = useCallback((updatedTier) => {
        setGlobalData(prevGlobal => {
            const newTiers = JSON.parse(JSON.stringify(prevGlobal.LEADERSHIP_TIERS || {}));
            
            // 1. Delete the old key if the ID has changed (not fully supported by this simple editor, but for safety)
            const existingId = updatedTier[idKey];
            if (newTiers[existingId] && existingId !== updatedTier.id) {
                 delete newTiers[existingId];
            }
            
            // 2. Add the new/updated tier using its ID as the key
            newTiers[updatedTier.id] = { ...updatedTier, isNew: false };
            
            return { ...prevGlobal, LEADERSHIP_TIERS: newTiers };
        });
    }, [setGlobalData, idKey]);


    const handleAddNewTier = () => {
        const newTier = { 
            [idKey]: `T${tiersArray.length + 1}`, 
            name: `New Tier ${tiersArray.length + 1}`, 
            icon: 'Briefcase', 
            hex: '#CCCCCC', 
            isNew: true 
        };
        handleSaveTier(newTier);
    };
    
    const handleTierDataParsed = useCallback((parsedData) => {
        setGlobalData(prevGlobal => {
            const newTiers = JSON.parse(JSON.stringify(prevGlobal.LEADERSHIP_TIERS || {}));
            parsedData.forEach(tier => {
                newTiers[tier.id] = tier; // Overwrite or create using ID as key
            });
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
            <p className='text-sm text-gray-700 mb-4'>
                Edit core tier metadata. **The ID field must be unique (e.g., T1, T2).** Changes are staged locally.
            </p>

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


// --- COACHING SCENARIOS EDITOR (SCENARIO_CATALOG) ---
const ScenariosTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
    // SCENARIO_CATALOG is a flat array, perfect for useArrayDataCRUD
    const scenariosArray = data.SCENARIO_CATALOG || [];

    const { handleUpdateItem, handleDeleteItem } = useArrayDataCRUD('SCENARIO_CATALOG', setGlobalData, idKey);

    const handleAddNewScenario = () => {
        const newScenario = { 
            [idKey]: generateId(), 
            title: 'New Scenario Title', 
            short_desc: 'Brief description...', 
            persona: 'The Deflector',
            difficultyLevel: 50,
            choices: [], // Ensure array of choices exists
            isNew: true 
        };
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
            <p className='text-sm text-gray-700 mb-4'>
                Edit the pre-seeded coaching scenarios. **Title and Description must be set.** Changes are staged locally.
            </p>

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


// --- TARGET REP CATALOG EDITOR (NEW) ---
const TargetRepTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
    // TARGET_REP_CATALOG is the new array structure
    const targetRepsArray = data.TARGET_REP_CATALOG || [];

    const { handleUpdateItem, handleDeleteItem } = useArrayDataCRUD('TARGET_REP_CATALOG', setGlobalData, idKey);

    const handleAddNewTargetRep = () => {
        const newRep = { 
            [idKey]: generateId(), 
            text: 'New Target Rep - Click Edit to define behavior.', 
            linkedTier: 'T3',
            linkedGoal: 'Strategic Focus',
            isNew: true 
        };
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
            <p className='text-sm text-gray-700 mb-4'>
                These reps are randomly selected to feature as "Today's Strategic Focus" on the Dashboard.
            </p>

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


// --- NEW COMPONENT: CommitmentBankTableEditor (Nested Categories) ---

// Flattens the nested Commitment Bank structure for table display, including the category key
const flattenCommitmentBank = (bank) => {
    let flatList = [];
    for (const category in bank) {
        flatList = flatList.concat(bank[category].map(item => ({ 
            ...item, 
            category: category, 
            id: item.id || generateId() 
        })));
    }
    return flatList;
};

// CRITICAL: This is a complex update handler for the object of arrays structure
const handleUpdateCommitmentBank = (setGlobalData) => useCallback((updatedItem) => {
    setGlobalData(prevGlobal => {
        const newBank = JSON.parse(JSON.stringify(prevGlobal.COMMITMENT_BANK || {}));
        const newCategory = updatedItem.category;
        
        // Ensure new category array exists
        newBank[newCategory] = newBank[newCategory] || [];

        // 1. Clean up the item from its *old* category (if category or text changed)
        const allCategories = Object.keys(newBank);
        allCategories.forEach(cat => {
            if (cat !== newCategory) {
                newBank[cat] = newBank[cat].filter(item => item.id !== updatedItem.id);
            }
        });

        // 2. Insert or update the item in the target category
        const targetArray = newBank[newCategory];
        const existingIndex = targetArray.findIndex(item => item.id === updatedItem.id);

        if (existingIndex !== -1) {
            targetArray[existingIndex] = { ...updatedItem, isNew: false };
        } else {
            targetArray.push({ ...updatedItem, isNew: false });
        }
        
        // Clean up empty categories (optional, but good practice)
        allCategories.forEach(cat => {
            if (newBank[cat].length === 0) delete newBank[cat];
        });

        return { ...prevGlobal, COMMITMENT_BANK: newBank };
    });
}, [setGlobalData]);


const handleDeleteCommitmentBankItem = (setGlobalData) => useCallback((itemId) => {
    if (!window.confirm(`Are you sure you want to delete item ${itemId}? This is staged for a database write.`)) {
        return;
    }

    setGlobalData(prevGlobal => {
        const newBank = JSON.parse(JSON.stringify(prevGlobal.COMMITMENT_BANK || {}));
        const allCategories = Object.keys(newBank);

        allCategories.forEach(cat => {
            newBank[cat] = newBank[cat].filter(item => item.id !== itemId);
            // Clean up empty categories
            if (newBank[cat].length === 0) delete newBank[cat];
        });
        
        return { ...prevGlobal, COMMITMENT_BANK: newBank };
    });
}, [setGlobalData]);


const CommitmentBankTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
    const bank = data.COMMITMENT_BANK || {};
    const tiers = data.LEADERSHIP_TIERS || {};
    const flatBank = useMemo(() => flattenCommitmentBank(bank), [bank]);

    const handleUpdate = useMemo(() => handleUpdateCommitmentBank(setGlobalData), [setGlobalData]);
    const handleDelete = useMemo(() => handleDeleteCommitmentBankItem(setGlobalData), [setGlobalData]);

    const handleAddNewRep = () => {
        const newRep = { 
            [idKey]: generateId(), 
            text: 'New Commitment Text', 
            linkedTier: 'T3',
            linkedGoal: 'Strategic Execution',
            category: 'T3: Strategic Alignment',
            isNew: true 
        };
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
                
                // Remove item from any existing category to prevent duplication
                Object.keys(newBank).forEach(cat => {
                    newBank[cat] = newBank[cat].filter(i => i.id !== item.id);
                });
                
                // Add or update in the designated category
                newBank[category].push(item);
            });
            
            alert(`${parsedData.length} commitments staged for update/creation across categories.`);
            return { ...prevGlobal, COMMITMENT_BANK: newBank };
        });
    }, [setGlobalData]);


    const gridColumns = `grid-cols-${fields.length + 3}`; // +1 for Category

    return (
        <div className='mt-4'>
            <p className='text-sm font-bold text-[#002E47] mb-2'>Commitment Bank Maintenance ({flatBank.length} Reps in {Object.keys(bank).length} Categories)</p>
            <p className='text-sm text-gray-700 mb-4'>
                Edit the master list of suggested micro-habits. **To change the category, you must edit the 'category' field in the editor.**
            </p>

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
                        fields={fields.concat({ key: 'category', label: 'Category', type: 'text' })} // Temporarily adds category to fields for editing
                        idKey={idKey}
                        extraDisplay={{ key: 'category', label: 'Category' }} // Uses category as extra display
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


// --- NEW COMPONENT: LeadershipDomainsTableEditor (Flat Array) ---
const LeadershipDomainsTableEditor = ({ data, isSaving, setGlobalData, idKey = 'id' }) => {
    const domainsArray = data.LEADERSHIP_DOMAINS || [];
    
    // We can use the generic array CRUD hook directly
    const { handleUpdateItem, handleDeleteItem } = useArrayDataCRUD('LEADERSHIP_DOMAINS', setGlobalData, idKey);

    const handleAddNewDomain = () => {
        const newDomain = { 
            [idKey]: generateId(), 
            title: 'New Domain Track', 
            subtitle: 'Brief description...', 
            coreTension: 'The core tension.',
            color: 'TEAL',
            focus: ["Focus 1", "Focus 2"], // Ensure arrays for complex fields
            isNew: true 
        };
        handleUpdateItem(newDomain);
    };
    
    const handleDomainDataParsed = useCallback((parsedData) => {
        // Simple append for domains
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
            <p className='text-sm text-gray-700 mb-4'>
                Edit the specialized leadership tracks. Note: Complex fields like 'focus' must be edited in the Raw Config Editor, or update the editor code.
            </p>

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


// --- NEW COMPONENT: ResourceLibraryTableEditor (Nested by Domain ID) ---
// Flattens the nested Resource Library structure for table display
const flattenResourceLibrary = (library) => {
    let flatList = [];
    for (const domainId in library) {
        flatList = flatList.concat(library[domainId].map(item => ({ 
            ...item, 
            domainId: domainId, 
            id: item.id || generateId() 
        })));
    }
    return flatList;
};

// CRITICAL: This update handler works exactly like the Commitment Bank handler
const handleUpdateResourceLibrary = (setGlobalData) => useCallback((updatedItem) => {
    setGlobalData(prevGlobal => {
        const newLibrary = JSON.parse(JSON.stringify(prevGlobal.RESOURCE_LIBRARY || {}));
        const newDomainId = updatedItem.domainId;
        
        newLibrary[newDomainId] = newLibrary[newDomainId] || [];

        // 1. Clean up the item from its *old* domain (if domainId or text changed)
        const allDomains = Object.keys(newLibrary);
        allDomains.forEach(domain => {
            if (domain !== newDomainId) {
                newLibrary[domain] = newLibrary[domain].filter(item => item.id !== updatedItem.id);
            }
        });

        // 2. Insert or update the item in the target domain
        const targetArray = newLibrary[newDomainId];
        const existingIndex = targetArray.findIndex(item => item.id === updatedItem.id);

        if (existingIndex !== -1) {
            targetArray[existingIndex] = { ...updatedItem, isNew: false };
        } else {
            targetArray.push({ ...updatedItem, isNew: false });
        }
        
        // Clean up empty domain arrays (optional)
        allDomains.forEach(domain => {
            if (newLibrary[domain].length === 0) delete newLibrary[domain];
        });

        return { ...prevGlobal, RESOURCE_LIBRARY: newLibrary };
    });
}, [setGlobalData]);


const handleDeleteResourceLibraryItem = (setGlobalData) => useCallback((itemId) => {
    if (!window.confirm(`Are you sure you want to delete item ${itemId}? This is staged for a database write.`)) {
        return;
    }

    setGlobalData(prevGlobal => {
        const newLibrary = JSON.parse(JSON.stringify(prevGlobal.RESOURCE_LIBRARY || {}));
        const allDomains = Object.keys(newLibrary);

        allDomains.forEach(domain => {
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
        const newResource = { 
            [idKey]: generateId(), 
            title: 'New Resource Title', 
            type: 'Report', 
            description: 'Short summary.',
            domainId: domains[0]?.id || 'women-exec', // Default to the first domain
            content: '## Resource Content\n\n- Write the content here in **Markdown**.',
            isNew: true 
        };
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
                
                Object.keys(newLibrary).forEach(dom => {
                    newLibrary[dom] = newLibrary[dom].filter(i => i.id !== item.id);
                });
                
                newLibrary[domainId].push(item);
            });
            
            alert(`${parsedData.length} resources staged for update/creation.`);
            return { ...prevGlobal, RESOURCE_LIBRARY: newLibrary };
        });
    }, [setGlobalData, domains]);


    const gridColumns = `grid-cols-${fields.length + 3}`; // +1 for Domain ID

    return (
        <div className='mt-4'>
            <p className='text-sm font-bold text-[#002E47] mb-2'>Resource Library Maintenance ({flatLibrary.length} Resources in {Object.keys(library).length} Domains)</p>
            <p className='text-sm text-gray-700 mb-4'>
                **Warning:** The 'content' field must contain **Markdown** and must be edited directly in the row editor.
            </p>

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


// --- ORIGINAL COMPONENTS (Raw Config Editor) ---

const RawConfigEditor = ({ catalog, isSaving, setGlobalData, currentEditorKey }) => { 
    
    const initialJson = useMemo(() => {
        try {
            return JSON.stringify(catalog || {}, null, 2);
        } catch {
            return JSON.stringify({});
        }
    }, [catalog]);

    const [jsonText, setJsonText] = useState(initialJson);
    const [status, setStatus] = useState(null); 
    
    useEffect(() => {
        setJsonText(initialJson);
    }, [initialJson]);

    const isJsonValid = useMemo(() => {
        try {
            JSON.parse(jsonText);
            return true;
        } catch (e) {
            return false;
        }
    }, [jsonText]);

    const handleSave = () => {
        if (!isJsonValid) {
            setStatus({ type: 'error', message: 'Invalid JSON format. Cannot stage changes.' });
            return;
        }
        
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
            <p className='text-sm text-gray-700 mb-4'>
                **WARNING**: This replaces the ENTIRE global metadata object. Only use this for mass upload or full configuration replacement.
            </p>
            <textarea
                value={jsonText}
                onChange={(e) => {setJsonText(e.target.value); setStatus(null);}}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-[#E04E1B] focus:border-[#E04E1B] h-[400px] font-mono text-sm resize-y"
                disabled={isSaving}
                placeholder={`Paste your FULL global JSON object here.`}
            />
            {status && (
                <div className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
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


// --- MAIN ROUTER (GlobalDataEditor) ---

\1
  // Diagnostics: log what the editor actually received
  React.useEffect(() => {
    try {
      const lib = (localGlobalData && (localGlobalData.RESOURCE_LIBRARY || localGlobalData.RESOURCE_CONTENT_LIBRARY)) || {};
      const domains = Object.keys(lib);
      const total = Object.values(lib).flat().length;
      console.groupCollapsed('[MaintenanceHub] incoming globalMetadata');
      console.log('top-level keys:', Object.keys(localGlobalData || {}));
      console.log('RESOURCE_LIBRARY present?', !!(localGlobalData && localGlobalData.RESOURCE_LIBRARY));
      console.log('RESOURCE_CONTENT_LIBRARY present?', !!(localGlobalData && localGlobalData.RESOURCE_CONTENT_LIBRARY));
      console.log('library domain keys:', domains);
      console.log('library total items:', total);
      console.groupEnd();
    } catch (e) { console.warn('[MaintenanceHub] debug failed', e); }
  }, [localGlobalData]);

    
    const [localGlobalData, setLocalGlobalData] = useState(globalMetadata || {});
    // CRITICAL: Set initial tab to a valid, easily populated tab (like Reading Hub)
    const [currentTab, setCurrentTab] = useState('reading'); 
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(null);

    // CRITICAL FIX: To force state synchronization on deep object changes,
    // we use a computed value derived from the deep prop data as a dependency.
    // This value will change if categories/keys inside the Reading Catalog change,
    // which is the screen showing the problem.
    const readingCatalogKeys = useMemo(() => {
        // Safely access keys and join them into a string. If the keys change, this string changes.
        return globalMetadata?.READING_CATALOG_SERVICE ? Object.keys(globalMetadata.READING_CATALOG_SERVICE).sort().join(',') : '';
    }, [globalMetadata]);
    
    useEffect(() => {
        setLocalGlobalData(globalMetadata || {});
        setStatus(null);
    // Include the deep, computed dependency to force synchronization when data changes.
    // The component will re-run the effect if either the shallow reference (globalMetadata) 
    // or the deep key structure (readingCatalogKeys) changes.
    }, [globalMetadata, readingCatalogKeys]); 


    // --- FINAL DATABASE WRITE HANDLER ---
    const handleFinalSave = async () => {
        setIsSaving(true);
        setStatus(null);
        
        try {
            // CRITICAL FIX: The updateGlobalMetadata hook exposed by useAppServices
            // expects the data object as the only argument in the component flow.
            const success = await updateGlobalMetadata(localGlobalData, { merge: true, source: 'AdminFinalize' });

            if (success) {
                setStatus({ type: 'success', message: 'ALL global configurations successfully saved to Firestore.' });
            } else {
                setStatus({ type: 'error', message: 'Database write failed. Check console logs.' });
            }
        } catch (e) {
            setStatus({ type: 'error', message: `Critical error during final save: ${e.message}` });
        } finally {
            setIsSaving(false);
        }
    };
    
    // Add safe guarding for accessing nested catalog data
    const countItems = (obj) => Object.values(obj || {}).flat().length;
    const countTiers = (obj) => Object.keys(obj || {}).length;

    // CRITICAL: Grouped navItems array by application pillar structure
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
            
            { group: 'Habits & Practice', key: 'bank', label: 'Commitment Bank (Master Reps)', icon: List, accent: 'BLUE', count: totalCommitmentItems },
            { group: 'Habits & Practice', key: 'target-reps', label: 'Target Reps Catalog', icon: Dumbbell, accent: 'GREEN', count: totalRepItems }, 
            
            { group: 'Coaching: Practice & Feedback', key: 'scenarios', label: 'Coaching Scenarios', icon: Users, accent: 'BLUE', count: totalScenarioItems },
            { group: 'System & Core', key: 'tiers', label: 'Tiers & Goals', icon: Target, accent: 'ORANGE', count: countTiers(localGlobalData.LEADERSHIP_TIERS) },
            { group: 'System & Core', key: 'summary', label: 'Summary Dashboard', icon: BarChart3, accent: 'NAVY', count: undefined },
            { group: 'System & Core', key: 'raw', label: 'Raw Config Editor', icon: Code, accent: 'RED', count: undefined },
        ];
    }, [localGlobalData]);

    const renderTabContent = () => {
        switch (currentTab) {
            case 'reading':
                return <ReadingHubTableEditor 
                    catalog={localGlobalData.READING_CATALOG_SERVICE || {}}
                    isSaving={isSaving}
                    setGlobalData={setLocalGlobalData}
                    navigate={navigate}
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
                    <RawConfigEditor
                        catalog={localGlobalData}
                        isSaving={isSaving}
                        setGlobalData={setLocalGlobalData}
                        navigate={navigate}
                        currentEditorKey={'RAW_CONFIG'}
                    />
                );
            case 'summary':
            default:
                return (
                    <Card title="Database Summary Snapshot" accent='TEAL' isSmall={true}>
                        <p className='text-sm text-gray-700 mb-4'>Review the current counts before committing changes. *Use the table editors before saving globally.*</p>
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

    // Group items for display
    const groupedItems = useMemo(() => {
        return navItems.reduce((acc, item) => {
            acc[item.group] = acc[item.group] || [];
            acc[item.group].push(item);
            return acc;
        }, {});
    }, [navItems]);


    return (
        <>
            <div className='flex flex-col space-y-4'>
                {/* Dynamically create a navigation group for each section */}
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
                <div className={`mt-4 p-3 rounded-lg font-semibold flex items-center gap-2 ${
                    status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
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


// --- Safe finalize write wrapper (prevents empty payload writes) ---
function safeFinalizeWrite(updateGlobalMetadata, localGlobalData) {
  const isEmpty = (o) => !o || (typeof o === 'object' && Object.keys(o).length === 0);
  try {
    console.groupCollapsed('[Admin] Finalize & Write payload summary');
    console.log('keys:', Object.keys(localGlobalData||{}));
    console.log('approxBytes:', JSON.stringify(localGlobalData||{}).length);
    console.groupEnd();
  } catch {}
  if (isEmpty(localGlobalData)) {
    alert('Cannot save: payload is empty.');
    console.warn('[Admin] Save blocked: empty payload');
    return Promise.resolve(false);
  }
  return updateGlobalMetadata(localGlobalData, { merge: true, source: 'AdminFinalize' });
}


// --- Optional: destructive replace (merge:false) with double confirm ---
async function replaceAllGlobal(updateGlobalMetadata, localGlobalData) {
  const isEmpty = (o) => !o || (typeof o === 'object' && Object.keys(o).length === 0);
  if (isEmpty(localGlobalData)) { alert('Cannot REPLACE ALL with an empty payload.'); return false; }
  if (!window.confirm('This will REPLACE the entire metadata/config document. Continue?')) return false;
  if (!window.confirm('Are you absolutely sure? This is destructive.')) return false;
  try {
    console.warn('[Admin] REPLACE ALL write initiated');
    return await updateGlobalMetadata(localGlobalData, { merge: false, source: 'AdminReplaceAll' });
  } catch (e) {
    console.error('[Admin] REPLACE ALL failed', e);
    return false;
  }
}

export default function AdminDataMaintenanceScreen({ navigate }) {
    const { metadata, isLoading: isMetadataLoading, db, updateGlobalMetadata } = useAppServices();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === PASSWORD) {
            setIsLoggedIn(true);
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true'); // Persist login state
            setLoginError(null);
        } else {
            setLoginError('Invalid Administrator Password.');
            setPassword('');
        }
    };
    
    // CRITICAL FIX: Check sessionStorage on mount
    useEffect(() => {
        if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    // --- PROTECTION SCREEN ---
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
    
    // --- LOADING/MAIN SCREEN ---
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

    // MAIN EDITOR RENDER
    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <Cpu className='w-10 h-10' style={{color: COLORS.NAVY}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Global Data Maintenance Hub</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Admin Tools: Directly manage all non-user application data (tiers, catalogs) stored in the Firebase collection **`metadata`**.</p>
            
            <GlobalDataEditor 
                // CRITICAL FIX: The key is REMOVED from the parent to avoid aggressive unneeded re-mounts.
                // Synchronization is now handled internally in GlobalDataEditor.
                globalMetadata={resolveGlobalMetadata(metadata)} 
                updateGlobalMetadata={updateGlobalMetadata} 
                db={db}
                navigate={navigate}
            />
        </div>
    );
}