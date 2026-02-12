import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Film, 
  Image as ImageIcon,
  Check,
  Loader,
  Database,
  AlertCircle
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getMediaAssets, MEDIA_TYPES } from '../../services/mediaService';
import { getUnifiedContent, CONTENT_TYPES } from '../../services/unifiedContentService';

const MediaSelector = ({ value, onChange, mediaType = 'ALL', onClose }) => {
  const { db } = useAppServices();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [usedAssets, setUsedAssets] = useState({}); // Map of url -> contentTitle

  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      try {
        // 1. Load Media Assets
        const typeFilter = mediaType === 'video' ? MEDIA_TYPES.VIDEO : 
                           mediaType === 'document' ? MEDIA_TYPES.DOCUMENT : 
                           'ALL';
                           
        const [mediaData, contentData] = await Promise.all([
          getMediaAssets(db, typeFilter),
          getUnifiedContent(db, 'ALL') // Fetch all content to check usage
        ]);

        // 2. Check Usage
        const usageMap = {};
        contentData.forEach(item => {
          // Check Video Details
          if (item.details?.externalUrl) {
            usageMap[item.details.externalUrl] = item.title;
          }
          // Check Document Details
          if (item.details?.url) {
            usageMap[item.details.url] = item.title;
          }
          // Check Read & Rep PDF
          if (item.details?.pdfUrl) {
            usageMap[item.details.pdfUrl] = item.title;
          }
        });

        setAssets(mediaData);
        setUsedAssets(usageMap);
      } catch (error) {
        console.error("Error loading media assets:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [db, mediaType]);

  // Filter assets
  const filteredAssets = assets.filter(asset => 
    asset.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (asset) => {
    if (usedAssets[asset.url] && usedAssets[asset.url] !== value) return; // Prevent selection if used
    onChange(asset.url, asset); // Return URL and full asset object
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-corporate-navy flex items-center gap-2">
            <Database className="w-5 h-5 text-corporate-teal" />
            Select from Media Vault
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 dark:bg-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by filename or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No media found in the Vault.</p>
              <p className="text-xs mt-1">Upload files in the Media Vault first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = value === asset.url;
                const isUsed = usedAssets[asset.url];
                const isUsedByOther = isUsed && !isSelected; // Used by someone else
                
                const Icon = asset.type === MEDIA_TYPES.VIDEO ? Film : 
                             asset.type === MEDIA_TYPES.IMAGE ? ImageIcon : FileText;
                
                return (
                  <button
                    key={asset.id}
                    onClick={() => !isUsedByOther && handleSelect(asset)}
                    disabled={isUsedByOther}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border text-left transition-all group relative
                      ${isSelected 
                        ? 'border-corporate-teal bg-corporate-teal/5 ring-1 ring-corporate-teal' 
                        : isUsedByOther
                          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-75 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-700 hover:border-corporate-teal/50 hover:bg-slate-50'}
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg flex-shrink-0
                      ${isSelected ? 'bg-white dark:bg-slate-800 text-corporate-teal' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-corporate-navy truncate">
                        {asset.title || asset.fileName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{(asset.size / 1024 / 1024).toFixed(1)} MB</span>
                        <span>•</span>
                        <span className="uppercase">{asset.type}</span>
                      </div>
                      {isUsedByOther && (
                        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-1 rounded">
                          <AlertCircle size={12} />
                          <span className="truncate">Used in: {isUsed}</span>
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-corporate-teal" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaSelector;