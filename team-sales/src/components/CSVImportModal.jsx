import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useProspectsStore } from '../stores/prospectsStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Expected CSV columns and their mappings
const COLUMN_MAPPINGS = {
  name: ['name', 'full name', 'contact name', 'first name', 'firstname'],
  company: ['company', 'company name', 'organization', 'employer'],
  title: ['title', 'job title', 'position', 'role'],
  email: ['email', 'email address', 'work email', 'business email'],
  phone: ['phone', 'phone number', 'mobile', 'cell', 'direct phone'],
  linkedin: ['linkedin', 'linkedin url', 'linkedin profile'],
  website: ['website', 'company website', 'url'],
  industry: ['industry', 'sector'],
  location: ['location', 'city', 'region', 'address'],
  notes: ['notes', 'comments', 'description'],
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  
  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.some(v => v.trim())) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current.trim());
  return result;
}

function mapColumnsToFields(headers) {
  const mapping = {};
  
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    const match = headers.find(h => aliases.includes(h.toLowerCase()));
    if (match) {
      mapping[field] = match;
    }
  }
  
  return mapping;
}

export default function CSVImportModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const { addProspect, prospects } = useProspectsStore();
  
  const [step, setStep] = useState('upload'); // upload, preview, importing, done
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState({ headers: [], rows: [] });
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState({ success: 0, skipped: 0, errors: [] });
  
  const fileInputRef = useRef(null);
  
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    try {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      
      if (parsed.rows.length === 0) {
        toast.error('No data found in CSV file');
        return;
      }
      
      setParsedData(parsed);
      setColumnMapping(mapColumnsToFields(parsed.headers));
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Failed to parse CSV file');
    }
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileSelect(fakeEvent);
    }
  };
  
  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    
    const results = { success: 0, skipped: 0, errors: [] };
    
    for (const row of parsedData.rows) {
      try {
        // Map row data to prospect fields
        const prospectData = {};
        for (const [field, csvColumn] of Object.entries(columnMapping)) {
          if (csvColumn && row[csvColumn]) {
            prospectData[field] = row[csvColumn];
          }
        }
        
        // Skip if no name
        if (!prospectData.name && !prospectData.company) {
          results.skipped++;
          continue;
        }
        
        // Check for duplicates
        const isDuplicate = prospects.some(p => 
          (prospectData.email && p.email === prospectData.email) ||
          (prospectData.linkedin && p.linkedin === prospectData.linkedin)
        );
        
        if (isDuplicate) {
          results.skipped++;
          continue;
        }
        
        await addProspect({
          name: prospectData.name || '',
          company: prospectData.company || '',
          title: prospectData.title || '',
          email: prospectData.email || '',
          phone: prospectData.phone || '',
          linkedin: prospectData.linkedin || '',
          website: prospectData.website || '',
          industry: prospectData.industry || '',
          location: prospectData.location || '',
          notes: prospectData.notes || '',
          status: 'new',
          stage: 'lead',
          source: 'csv_import',
        }, user.uid, user.displayName || user.email);
        
        results.success++;
      } catch (error) {
        results.errors.push(error.message);
      }
    }
    
    setImportResults(results);
    setImporting(false);
    setStep('done');
  };
  
  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setParsedData({ headers: [], rows: [] });
    setColumnMapping({});
    setImportResults({ success: 0, skipped: 0, errors: [] });
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-brand-teal" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Import Prospects from CSV</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-brand-teal transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
              >
                Select File
              </button>
              
              <div className="mt-8 text-left max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Supported columns:</p>
                <p className="text-sm text-gray-600">
                  Name, Company, Title, Email, Phone, LinkedIn, Website, Industry, Location, Notes
                </p>
              </div>
            </div>
          )}
          
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-green-600">
                <Check className="w-5 h-5" />
                <span>{parsedData.rows.length} rows found in {file?.name}</span>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Column Mapping</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Verify the column mappings below. You can adjust them if needed.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(COLUMN_MAPPINGS).map((field) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {field}
                      </label>
                      <select
                        value={columnMapping[field] || ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [field]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                      >
                        <option value="">-- Not mapped --</option>
                        {parsedData.headers.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {parsedData.headers.slice(0, 5).map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-gray-700">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedData.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {parsedData.headers.slice(0, 5).map(h => (
                            <td key={h} className="px-3 py-2 text-gray-600 truncate max-w-[200px]">
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {step === 'importing' && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-brand-teal animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Importing prospects...</h3>
              <p className="text-gray-600 mt-2">Please don't close this window</p>
            </div>
          )}
          
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Import Complete!</h3>
              
              <div className="mt-6 space-y-2 text-sm">
                <p className="text-green-600">
                  ✓ {importResults.success} prospects imported successfully
                </p>
                {importResults.skipped > 0 && (
                  <p className="text-amber-600">
                    ⚠ {importResults.skipped} skipped (duplicates or missing data)
                  </p>
                )}
                {importResults.errors.length > 0 && (
                  <p className="text-red-600">
                    ✕ {importResults.errors.length} errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
              >
                Import {parsedData.rows.length} Prospects
              </button>
            </>
          )}
          
          {step === 'done' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
