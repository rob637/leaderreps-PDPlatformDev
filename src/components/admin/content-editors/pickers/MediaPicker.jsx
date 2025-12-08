import React, { useState, useEffect } from 'react';
import { X, Search, Check, Film, Image as ImageIcon, FileText } from 'lucide-react';
import { useAppServices } from '../../../../services/useAppServices';
import { getMediaAssets, MEDIA_TYPES } from '../../../../services/mediaService';

const MediaPicker = ({ typeFilter, onSelect, onClose }) => {
  const { db } = useAppServices();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadAssets = async () => {
      try {
        // If typeFilter is provided (e.g. 'VIDEO'), use it. Otherwise 'ALL'.
        const data = await getMediaAssets(db, typeFilter || 'ALL');
        setAssets(data);
      } catch (error) {
        console.error('Error loading media assets:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, [db, typeFilter]);

  const filteredAssets = assets.filter(asset => 
    asset.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconForType = (type) => {
    switch (type) {
      case MEDIA_TYPES.VIDEO: return <Film size={20} className="text-purple-500" />;
      case MEDIA_TYPES.IMAGE: return <ImageIcon size={20} className="text-blue-500" />;
      default: return <FileText size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select from Vault</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredAssets.map(asset => (
                <div
                  key={asset.id}
                  onClick={() => onSelect(asset)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border hover:bg-gray-50 border-gray-200 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                     {asset.type === MEDIA_TYPES.IMAGE ? (
                        <img src={asset.url} alt="" className="w-full h-full object-cover rounded" />
                     ) : getIconForType(asset.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{asset.title}</div>
                    <div className="text-xs text-gray-500 flex gap-2">
                      <span>{new Date(asset.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{asset.type}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100">
                    Select
                  </button>
                </div>
              ))}
              {filteredAssets.length === 0 && (
                <div className="text-center py-8 text-gray-500">No matching assets found in Vault</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
