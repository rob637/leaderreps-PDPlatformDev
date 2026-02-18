import { useState, useEffect } from 'react';
import { 
  Search, Users, Building2, Loader2, ChevronDown, ChevronUp, 
  Mail, Phone, Linkedin, Globe, Plus, Check, X, Settings,
  Sparkles, Filter, RotateCcw, Twitter, MapPin, Zap, Info,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { useApolloStore, SENIORITY_OPTIONS, DEPARTMENT_OPTIONS } from '../stores/apolloStore';
import { useProspectsStore } from '../stores/prospectsStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '501-1000', label: '501-1000' },
  { value: '1000+', label: '1000+' },
];

export default function ApolloSearchPage() {
  const { user } = useAuthStore();
  const {
    apiKey,
    apiKeyLoaded,
    creditsUsed,
    searchMode,
    searchResults,
    searching,
    searchCriteria,
    selectedResults,
    setSearchMode,
    setSearchCriteria,
    resetSearchCriteria,
    toggleResultSelection,
    selectAllResults,
    clearSelection,
    loadApiKey,
    saveApiKey,
    search,
    enrichPerson,
  } = useApolloStore();
  
  const { addProspect, prospects } = useProspectsStore();
  
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [importing, setImporting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  
  useEffect(() => {
    if (user?.uid) {
      loadApiKey(user.uid);
    }
  }, [user?.uid, loadApiKey]);
  
  // Check if a result is already in the CRM
  const isAlreadyImported = (result) => {
    return prospects.some(p => 
      (result.id && p.apolloId === result.id) ||
      (result.email && result.email !== '(available)' && p.email === result.email) ||
      (result.linkedin && p.linkedin === result.linkedin)
    );
  };
  
  const handleSearch = () => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    search(user?.uid);
  };
  
  const handleSaveApiKey = async () => {
    if (newApiKey.trim()) {
      await saveApiKey(user.uid, newApiKey.trim());
      setShowApiKeyModal(false);
      setNewApiKey('');
    }
  };
  
  const handleImportSelected = async () => {
    const selected = searchResults.filter(r => selectedResults.includes(r.id));
    if (selected.length === 0) {
      toast.error('Select at least one result to import');
      return;
    }
    
    setImporting(true);
    let imported = 0;
    let skipped = 0;
    
    for (const result of selected) {
      // Check for duplicates by apolloId, email, or linkedin
      const isDuplicate = prospects.some(p => 
        (result.id && p.apolloId === result.id) ||
        (result.email && result.email !== '(available)' && p.email === result.email) ||
        (result.linkedin && p.linkedin === result.linkedin)
      );
      
      if (isDuplicate) {
        skipped++;
        continue;
      }
      
      await addProspect({
        firstName: result.firstName || '',
        lastName: result.lastName || '',
        name: result.name,
        company: result.company || result.name,
        title: result.title || '',
        email: result.email?.includes('(available)') ? '' : result.email || '',
        phone: result.phone || '',
        linkedin: result.linkedin || '',
        twitter: result.twitter || '',
        website: result.website || '',
        companyLinkedin: result.companyLinkedin || '',
        industry: result.industry || '',
        location: result.location || '',
        city: result.city || '',
        state: result.state || '',
        country: result.country || '',
        companySize: result.companySize || '',
        seniority: result.seniority || '',
        departments: result.departments || [],
        status: 'new',
        stage: 'lead',
        source: 'apollo',
        apolloId: result.id,
        enriched: result.enriched || false,
        notes: result.type === 'company' ? result.description : '',
        owner: user.email,
        ownerEmail: user.email,
      });
      
      imported++;
    }
    
    setImporting(false);
    clearSelection();
    
    if (imported > 0) {
      toast.success(`Imported ${imported} prospect${imported > 1 ? 's' : ''}`);
    }
    if (skipped > 0) {
      toast(`Skipped ${skipped} duplicate${skipped > 1 ? 's' : ''}`, { icon: '⚠️' });
    }
  };
  
  const handleEnrich = async (personId) => {
    const enriched = await enrichPerson(personId, user?.uid);
    if (enriched) {
      // Could auto-update the result in the list
    }
  };
  
  const handleEnrichSelected = async () => {
    const selected = searchResults.filter(r => 
      selectedResults.includes(r.id) && r.type === 'person' && !r.enriched
    );
    
    if (selected.length === 0) {
      toast('No unenriched contacts selected');
      return;
    }
    
    setEnriching(true);
    let enriched = 0;
    
    for (const result of selected) {
      await enrichPerson(result.id, user?.uid);
      enriched++;
    }
    
    setEnriching(false);
    toast.success(`Enriched ${enriched} contact${enriched > 1 ? 's' : ''}`);
  };

  if (!apiKeyLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 dark:text-slate-100">Apollo Search</h1>
          <p className="text-slate-600 dark:text-slate-400 dark:text-slate-400">Find and import prospects from Apollo.io</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
            Credits used: {creditsUsed}
          </span>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="p-2 text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-700 rounded-lg"
            title="API Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Search Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setSearchMode('people')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            searchMode === 'people'
              ? 'bg-brand-navy text-white'
              : 'bg-slate-100 dark:bg-slate-700 dark:bg-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          People
        </button>
        <button
          onClick={() => setSearchMode('companies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            searchMode === 'companies'
              ? 'bg-brand-navy text-white'
              : 'bg-slate-100 dark:bg-slate-700 dark:bg-slate-700 text-slate-700 dark:text-slate-300 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Companies
        </button>
      </div>
      
      {/* Search Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchMode === 'people' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                  Job Titles
                </label>
                <input
                  type="text"
                  value={searchCriteria.titles}
                  onChange={(e) => setSearchCriteria({ titles: e.target.value })}
                  placeholder="CEO, VP Sales, Director..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                  Companies
                </label>
                <input
                  type="text"
                  value={searchCriteria.companies}
                  onChange={(e) => setSearchCriteria({ companies: e.target.value })}
                  placeholder="Acme Inc, TechCorp..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={searchCriteria.companies}
                onChange={(e) => setSearchCriteria({ companies: e.target.value })}
                placeholder="Search company names..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              type="text"
              value={searchCriteria.locations}
              onChange={(e) => setSearchCriteria({ locations: e.target.value })}
              placeholder="San Francisco, New York..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
              Industry
            </label>
            <input
              type="text"
              value={searchCriteria.industries}
              onChange={(e) => setSearchCriteria({ industries: e.target.value })}
              placeholder="Technology, Healthcare..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
              Company Size
            </label>
            <select
              value={searchCriteria.companySize}
              onChange={(e) => setSearchCriteria({ companySize: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            >
              <option value="">Any size</option>
              {COMPANY_SIZE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label} employees</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
              Keywords
            </label>
            <input
              type="text"
              value={searchCriteria.keywords}
              onChange={(e) => setSearchCriteria({ keywords: e.target.value })}
              placeholder="SaaS, AI, fintech..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Advanced Filters */}
        {searchMode === 'people' && (
          <>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 dark:hover:text-slate-200"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t dark:border-slate-600">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                    Seniority Level
                  </label>
                  <select
                    multiple
                    value={searchCriteria.seniorities}
                    onChange={(e) => setSearchCriteria({ 
                      seniorities: Array.from(e.target.selectedOptions, opt => opt.value)
                    })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-teal focus:border-transparent h-32"
                  >
                    {SENIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    multiple
                    value={searchCriteria.departments}
                    onChange={(e) => setSearchCriteria({ 
                      departments: Array.from(e.target.selectedOptions, opt => opt.value)
                    })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-teal focus:border-transparent h-32"
                  >
                    {DEPARTMENT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                    Email Status
                  </label>
                  <select
                    value={searchCriteria.emailStatus}
                    onChange={(e) => setSearchCriteria({ emailStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  >
                    <option value="">Any status</option>
                    <option value="verified">Verified only</option>
                    <option value="likely">Verified + Likely</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Credit Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">About Apollo Credits</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-300">
                <li><strong>Search</strong> = 1 credit (shows basic info)</li>
                <li><strong>Enrich</strong> = 1 credit per contact (reveals email & phone)</li>
                <li><strong>Import</strong> = FREE (no credits used)</li>
              </ul>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                💡 Tip: Only enrich contacts you plan to reach out to. Duplicates are automatically skipped on import.
              </p>
            </div>
          </div>
        </div>

        {/* Search Actions */}
        <div className="flex items-center gap-3 pt-4 border-t dark:border-slate-600">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
          
          <button
            onClick={resetSearchCriteria}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-700 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          
          {selectedResults.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleEnrichSelected}
                disabled={enriching}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                title="Reveal email/phone for selected contacts"
              >
                {enriching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Enrich Selected
              </button>
              <button
                onClick={handleImportSelected}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Import {selectedResults.length}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Results */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700">
          <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 dark:text-slate-100">
                {searchResults.length} Results
              </h2>
              <button
                onClick={selectedResults.length === searchResults.length ? clearSelection : selectAllResults}
                className="text-sm text-brand-teal hover:underline"
              >
                {selectedResults.length === searchResults.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          
          <div className="divide-y dark:divide-slate-700">
            {searchResults.map((result) => {
              const alreadyImported = isAlreadyImported(result);
              return (
              <div
                key={result.id}
                className={`p-4 flex items-start gap-4 transition-colors ${
                  alreadyImported 
                    ? 'bg-gray-50 dark:bg-slate-700/50 opacity-60' 
                    : selectedResults.includes(result.id) 
                      ? 'bg-brand-teal/5 dark:bg-brand-teal/10 hover:bg-brand-teal/10 dark:hover:bg-brand-teal/15' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {/* Selection checkbox */}
                {alreadyImported ? (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center" title="Already in CRM">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                <button
                  onClick={() => toggleResultSelection(result.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    selectedResults.includes(result.id)
                      ? 'bg-brand-teal border-brand-teal text-white'
                      : 'border-gray-300 dark:border-slate-600 hover:border-brand-teal'
                  }`}
                >
                  {selectedResults.includes(result.id) && <Check className="w-3 h-3" />}
                </button>
                )}
                
                {/* Avatar/Logo */}
                <div className="flex-shrink-0">
                  {result.photo || result.logo ? (
                    <img
                      src={result.photo || result.logo}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                      {result.type === 'company' ? (
                        <Building2 className="w-6 h-6 text-slate-500 dark:text-slate-400 dark:text-slate-400" />
                      ) : (
                        <span className="text-lg font-medium text-slate-600 dark:text-slate-400 dark:text-slate-300">
                          {result.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 dark:text-slate-100 truncate">{result.name}</h3>
                    {alreadyImported && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        In CRM
                      </span>
                    )}
                    {result.enriched && !alreadyImported && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Enriched
                      </span>
                    )}
                    {!result.enriched && result.hasEmail && !alreadyImported && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email Available
                      </span>
                    )}
                    {result.linkedin && (
                      <a
                        href={result.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {result.twitter && (
                      <a
                        href={result.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-500 hover:text-sky-700"
                        title="Twitter"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  
                  {result.type === 'person' && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-400 truncate">
                      {result.title} {result.company && `at ${result.company}`}
                    </p>
                  )}
                  
                  {result.type === 'company' && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-400 truncate">
                      {result.industry} • {result.companySize ? `${result.companySize} employees` : 'Size unknown'}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
                    {result.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.location}
                      </span>
                    )}
                    {result.seniority && (
                      <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 dark:bg-slate-600 text-slate-600 dark:text-slate-400 dark:text-slate-300 rounded capitalize">
                        {result.seniority.replace('_', ' ')}
                      </span>
                    )}
                    {result.email && !result.email.includes('(available)') && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-green-500" />
                        {result.email}
                      </span>
                    )}
                    {result.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-green-500" />
                        {result.phone}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {result.type === 'person' && !result.enriched && (
                    <button
                      onClick={() => handleEnrich(result.id)}
                      className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg"
                      title="Reveal email/phone"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                  {result.linkedin && (
                    <a
                      href={result.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {result.website && (
                    <a
                      href={result.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-500 dark:text-slate-400 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-700 rounded-lg"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* No API Key Message */}
      {!apiKey && apiKeyLoaded && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <Settings className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">Apollo API Key Required</h3>
          <p className="text-amber-700 dark:text-amber-300 mt-1 mb-4">
            Configure your Apollo.io API key to search for prospects
          </p>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Configure API Key
          </button>
        </div>
      )}
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Apollo API Settings</h2>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 dark:text-slate-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={apiKey ? '••••••••' : 'Enter your Apollo API key'}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-1">
                  Get your API key from{' '}
                  <a
                    href="https://app.apollo.io/#/settings/integrations/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-teal hover:underline"
                  >
                    Apollo Settings
                  </a>
                </p>
              </div>
              
              {apiKey && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ API key configured
                </p>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApiKey}
                  disabled={!newApiKey.trim()}
                  className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
