// src/components/screens/AdminDataMaintenance.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowLeft, Cpu, Lock, CheckCircle, AlertTriangle, CornerRightUp, Settings, BarChart3, TrendingUp, Download, Code, List, BookOpen, Target, Users, ShieldCheck, Plus, Trash2, Save, X } from 'lucide-react';

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

const PASSWORD = "7036238835"; // Required password

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
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

/*
 * Note: For a real app, the CRUD logic for Tiers/Scenarios would use a generic
 * TableComponent that accepts a `dataKey` (e.g., LEADERSHIP_TIERS) and an array of `fields`.
 * For this revision, we will create focused placeholders that utilize the same core
 * design principles as the ReadingHubTableEditor.
 */

// --- 1. The Core Book/Row Editor Component ---
const BookRowEditor = ({ book: initialBook, categoryKey, onUpdate, onDelete, isSaving }) => {
    const [book, setBook] = useState(initialBook);
    const [isEditing, setIsEditing] = useState(initialBook.isNew || false); // Start editing if it's new
    const [isStaged, setIsStaged] = useState(initialBook.isNew || false);
    
    // Auto-update local state when prop changes (e.g., category switch or save)
    useEffect(() => {
        setBook(initialBook);
        setIsEditing(initialBook.isNew || false);
        setIsStaged(initialBook.isNew || false);
    }, [initialBook]);
    
    // Field change handler
    const handleChange = (field, value) => {
        setBook(prev => ({ ...prev, [field]: value }));
        setIsStaged(true);
    };
    
    const handleSave = () => {
        onUpdate(categoryKey, { ...book, isNew: false }); // Commit changes to parent state
        setIsEditing(false);
        setIsStaged(false);
    };

    const handleCancel = () => {
        if (initialBook.isNew) {
            onDelete(categoryKey, book.id); // If new, cancelling means deleting the blank row
        } else {
            setBook(initialBook); // Revert to initial state
            setIsEditing(false);
            setIsStaged(false);
        }
    };

    const inputClass = "w-full p-1.5 border rounded-lg focus:ring-1 focus:ring-[#E04E1B] text-sm bg-white";
    const displayClass = "w-full p-1.5 text-sm text-gray-700 truncate";
    
    const fields = [
        { key: 'title', label: 'Title' },
        { key: 'author', label: 'Author' },
        { key: 'pages', label: 'Pages', type: 'number' },
        // Add more fields as needed: url, rating, etc.
    ];

    return (
        <div className={`grid grid-cols-4 gap-4 items-center p-2 border-b transition-colors ${isStaged ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
            {fields.map(field => (
                <div key={field.key} className="truncate">
                    {isEditing ? (
                        <input
                            type={field.type || 'text'}
                            value={book[field.key] || ''}
                            onChange={(e) => handleChange(field.key, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                            className={inputClass}
                            disabled={isSaving}
                        />
                    ) : (
                        <p className={displayClass}>{book[field.key] || '-'}</p>
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


// --- 2. Main Reading Hub Table Editor Component (Combines Category Selector and Book Table) ---
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

    // HANDLER: Update/Edit a Book
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

            return { 
                ...prevGlobal, 
                READING_CATALOG_SERVICE: newCatalog 
            };
        });
    }, [setGlobalData]);

    // HANDLER: Delete a Book
    const handleDeleteBook = useCallback((category, bookId) => {
        if (!window.confirm(`Are you sure you want to delete book ID ${bookId} from category ${category}? This is staged for a database write.`)) {
            return;
        }

        setGlobalData(prevGlobal => {
            const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
            
            newCatalog[category] = (newCatalog[category] || []).filter(b => b.id !== bookId);

            return { 
                ...prevGlobal, 
                READING_CATALOG_SERVICE: newCatalog 
            };
        });
    }, [setGlobalData]);

    // HANDLER: Add a New Book
    const handleAddNewBook = () => {
        // Simple structure for a new book
        const newBook = { id: generateId(), title: 'NEW BOOK', author: 'New Author', pages: 100, isNew: true };
        
        setGlobalData(prevGlobal => {
            const newCatalog = JSON.parse(JSON.stringify(prevGlobal.READING_CATALOG_SERVICE || {}));
            
            newCatalog[currentCategory] = newCatalog[currentCategory] || [];
            newCatalog[currentCategory].push(newBook);
            
            return { 
                ...prevGlobal, 
                READING_CATALOG_SERVICE: newCatalog 
            };
        });
    };
    
    const handleMassUpload = () => {
        alert('Mass upload logic (CSV parsing) is TBD. For now, use the "Advanced: Raw Config" tab for mass JSON.');
    };

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
                            {key} ({safeCatalog[key].length})
                        </button>
                    ))}
                    <Button isSmall variant='outline' className='w-full mt-2' onClick={() => alert("Logic to create a new category goes here.")}>
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
                                book={book} // Passed to force re-render on external update
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
                    <Button onClick={handleMassUpload} disabled={isSaving} variant='outline'>
                        <Download className='w-5 h-5 mr-2'/> Mass CSV Upload (TBD)
                    </Button>
                </div>
            </div>
        </div>
    );
};


// --- 3. Placeholder for Tiers & Goals Editor ---
const TiersGoalsTableEditor = ({ data, isSaving, setGlobalData }) => {
    // NOTE: This is a placeholder structure. Actual implementation would involve 
    // row components similar to BookRowEditor, but with different fields.
    const safeData = data || {};
    const tiers = Object.values(safeData.LEADERSHIP_TIERS || {}).flat(); // Flatten into an array for table view

    return (
        <div className='mt-4'>
            <p className='text-sm font-bold text-[#002E47] mb-2'>Tier & Goal Maintenance ({tiers.length} Tiers)</p>
            <p className='text-sm text-gray-700 mb-4'>
                This table will allow direct editing of **LEADERSHIP\_TIERS** properties (e.g., name, required points, bonuses).
            </p>

            <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
                {/* Header */}
                <div className="grid grid-cols-4 gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]">
                    <span className="truncate">Tier ID</span>
                    <span className="truncate">Name</span>
                    <span className="truncate">Points Required</span>
                    <span className="text-right">Actions</span>
                </div>
                {/* Rows */}
                {tiers.map((tier) => (
                    <div key={tier.id} className="grid grid-cols-4 gap-4 items-center p-2 border-b hover:bg-gray-50">
                        <p className="text-sm text-gray-600 truncate">{tier.id}</p>
                        <input defaultValue={tier.name || ''} className="w-full p-1.5 border rounded-lg text-sm" disabled={isSaving}/>
                        <input type="number" defaultValue={tier.pointsRequired || 0} className="w-full p-1.5 border rounded-lg text-sm" disabled={isSaving}/>
                        <div className='flex space-x-2 justify-end'>
                            <Button isSmall disabled={true}><Save className='w-4 h-4' /></Button>
                            <Button isSmall variant='secondary' disabled={true}><Trash2 className='w-4 h-4' /></Button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className='mt-4 flex space-x-3'>
                <Button onClick={() => alert("Add Tier/Goal logic needed.")} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
                    <Plus className='w-5 h-5 mr-2'/> Add New Tier
                </Button>
            </div>
        </div>
    );
};


// --- 4. Placeholder for Coaching Scenarios Editor ---
const ScenariosTableEditor = ({ data, isSaving, setGlobalData }) => {
    // Assuming SCENARIO_CATALOG is a simple array of objects
    const safeScenarios = data.SCENARIO_CATALOG || [];

    return (
        <div className='mt-4'>
            <p className='text-sm font-bold text-[#002E47] mb-2'>Coaching Scenario Maintenance ({safeScenarios.length} Scenarios)</p>
            <p className='text-sm text-gray-700 mb-4'>
                This table will allow direct editing of **SCENARIO\_CATALOG** properties (e.g., description, choices, correct answer).
            </p>

            <div className="max-h-[500px] overflow-y-auto border rounded-lg shadow-inner">
                {/* Header */}
                <div className="grid grid-cols-4 gap-4 items-center p-2 font-bold border-b-2 text-sm text-[#002E47]">
                    <span className="truncate">Scenario ID</span>
                    <span className="truncate">Short Description</span>
                    <span className="truncate"># of Choices</span>
                    <span className="text-right">Actions</span>
                </div>
                {/* Rows */}
                {safeScenarios.map((scenario) => (
                    <div key={scenario.id} className="grid grid-cols-4 gap-4 items-center p-2 border-b hover:bg-gray-50">
                        <p className="text-sm text-gray-600 truncate">{scenario.id}</p>
                        <input defaultValue={scenario.short_desc || ''} className="w-full p-1.5 border rounded-lg text-sm" disabled={isSaving}/>
                        <p className="text-sm text-gray-600 truncate">{scenario.choices?.length || 0}</p>
                        <div className='flex space-x-2 justify-end'>
                            <Button isSmall disabled={true}><Save className='w-4 h-4' /></Button>
                            <Button isSmall variant='secondary' disabled={true}><Trash2 className='w-4 h-4' /></Button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className='mt-4 flex space-x-3'>
                <Button onClick={() => alert("Add Scenario logic needed.")} disabled={isSaving} className={`bg-[${COLORS.ORANGE}] hover:bg-red-700`}>
                    <Plus className='w-5 h-5 mr-2'/> Add New Scenario
                </Button>
            </div>
        </div>
    );
};

// --- ORIGINAL COMPONENTS (Modified to integrate new editor) ---

// The Raw Config Editor is kept separate for the 'Advanced: Raw Config' tab
const RawConfigEditor = ({ catalog, isSaving, setGlobalData, navigate, currentEditorKey }) => { 
    
    // CRITICAL FIX 1: Ensure JSON.stringify uses an empty object if catalog is null/undefined
    const initialJson = useMemo(() => {
        try {
            return JSON.stringify(catalog || {}, null, 2);
        } catch {
            return JSON.stringify({});
        }
    }, [catalog]);

    const [jsonText, setJsonText] = useState(initialJson);
    const [status, setStatus] = useState(null); // null, 'success', 'error'
    
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
                 // For the raw tab, replace the entire object with the parsed data
                 setGlobalData(() => parsedData);
                 setStatus({ type: 'success', message: 'Raw Config staged locally. (Ready to write).' });
                 return;
            } else {
                 setStatus({ type: 'error', message: 'Unknown editor key. Stage operation failed.' });
                 return;
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
const GlobalDataEditor = ({ globalMetadata, updateGlobalMetadata, db, navigate }) => {
    
    const [localGlobalData, setLocalGlobalData] = useState(globalMetadata || {});
    const [currentTab, setCurrentTab] = useState('reading');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        setLocalGlobalData(globalMetadata || {});
        setStatus(null);
    }, [globalMetadata]);


    // --- FINAL DATABASE WRITE HANDLER ---
    const handleFinalSave = async () => {
        setIsSaving(true);
        setStatus(null);
        
        try {
            const success = await updateGlobalMetadata(db, localGlobalData);

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

    const navItems = useMemo(() => [
        { key: 'reading', label: 'Content Editor (Reading Hub)', icon: BookOpen, accent: 'TEAL', count: countItems(localGlobalData.READING_CATALOG_SERVICE) },
        { key: 'tiers', label: 'Tiers & Goals', icon: Target, accent: 'ORANGE', count: countTiers(localGlobalData.LEADERSHIP_TIERS) },
        { key: 'scenarios', label: 'Coaching Scenarios', icon: Users, accent: 'BLUE', count: countItems(localGlobalData.SCENARIO_CATALOG) },
        { key: 'summary', label: 'Summary', icon: BarChart3, accent: 'NAVY' },
        { key: 'raw', label: 'Advanced: Raw Config', icon: Code, accent: 'RED' },
    ], [localGlobalData]);

    const renderTabContent = () => {
        switch (currentTab) {
            case 'reading':
                return <ReadingHubTableEditor 
                    catalog={localGlobalData.READING_CATALOG_SERVICE || {}}
                    isSaving={isSaving}
                    setGlobalData={setLocalGlobalData}
                    navigate={navigate}
                />;
            case 'tiers':
                return <TiersGoalsTableEditor
                    data={localGlobalData}
                    isSaving={isSaving}
                    setGlobalData={setLocalGlobalData}
                />;
            case 'scenarios':
                return <ScenariosTableEditor
                    data={localGlobalData}
                    isSaving={isSaving}
                    setGlobalData={setLocalGlobalData}
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
                            {navItems.filter(i => i.count !== undefined).map(item => (
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


    return (
        <>
            <div className='flex space-x-2 border-b border-gray-300 overflow-x-auto'>
                {navItems.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setCurrentTab(item.key)}
                        className={`flex items-center px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${currentTab === item.key ? 'border-[#47A88D] border-b-4 text-[#002E47]' : 'border-transparent text-gray-500 hover:text-[#002E47]'}`}
                    >
                        <item.icon className='w-4 h-4 mr-1' />
                        {item.label} {item.count !== undefined && `(${item.count})`}
                    </button>
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

export default function AdminDataMaintenanceScreen({ navigate }) {
    const { metadata, isLoading: isMetadataLoading, db, updateGlobalMetadata } = useAppServices();
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === PASSWORD) {
            setIsLoggedIn(true);
            setLoginError(null);
        } else {
            setLoginError('Invalid Administrator Password.');
            setPassword('');
        }
    };
    
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
                globalMetadata={metadata} 
                updateGlobalMetadata={updateGlobalMetadata} 
                db={db}
                navigate={navigate}
            />
        </div>
    );
}