import React, { useState, useEffect } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Film, 
  Image as ImageIcon,
  Check,
  Loader,
  Database
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getMediaAssets, MEDIA_TYPES } from '../../services/mediaService';

const MediaSelector = ({ value, onChange, mediaType = 'ALL', onClose }) => {
  const { db } = useAppServices();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      try {
        // Map 'video'/'document' to MEDIA_TYPES if needed, or pass 'ALL'
        const typeFilter = mediaType === 'video' ? MEDIA_TYPES.VIDEO : 
                           mediaType === 'document' ? MEDIA_TYPES.DOCUMENT : 
                           'ALL';
                           
        const data = await getMediaAssets(db, typeFilter);
        setAssets(data);
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
    setSelectedAsset(asset);
    onChange(asset.url, asset); // Return URL and full asset object
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
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
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by filename or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal"
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
                const Icon = asset.type === MEDIA_TYPES.VIDEO ? Film : 
                             asset.type === MEDIA_TYPES.IMAGE ? ImageIcon : FileText;
                
                return (
                  <button
                    key={asset.id}
                    onClick={() => handleSelect(asset)}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border text-left transition-all group
                      ${isSelected 
                        ? 'border-corporate-teal bg-corporate-teal/5 ring-1 ring-corporate-teal' 
                        : 'border-slate-200 hover:border-corporate-teal/50 hover:bg-slate-50'}
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg flex-shrink-0
                      ${isSelected ? 'bg-white text-corporate-teal' : 'bg-slate-100 text-slate-500 group-hover:text-corporate-teal'}
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