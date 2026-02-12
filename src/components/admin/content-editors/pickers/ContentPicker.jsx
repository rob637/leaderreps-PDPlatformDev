import React, { useState, useEffect } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useAppServices } from '../../../../services/useAppServices';
import { getUnifiedContent } from '../../../../services/unifiedContentService';
import { getAllContentAdmin, CONTENT_COLLECTIONS } from '../../../../services/contentService';

const ContentPicker = ({ type, onSelect, onClose, multiSelect = false, selectedIds = [] }) => {
  const { db } = useAppServices();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState(new Set(selectedIds));

  useEffect(() => {
    const loadItems = async () => {
      try {
        let data = [];
        // Check if type is a legacy collection
        const isCollection = Object.values(CONTENT_COLLECTIONS).includes(type);
        
        if (isCollection) {
             data = await getAllContentAdmin(db, type);
        } else {
             data = await getUnifiedContent(db, type);
        }
        setItems(data);
      } catch (error) {
        console.error('Error loading items for picker:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [db, type]);

  const toggleSelection = (id) => {
    const newSelected = new Set(localSelected);
    if (multiSelect) {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    } else {
      newSelected.clear();
      newSelected.add(id);
    }
    setLocalSelected(newSelected);
  };

  const handleConfirm = () => {
    // Return full objects for selected IDs
    const selectedItems = items.filter(item => localSelected.has(item.id));
    onSelect(multiSelect ? selectedItems : selectedItems[0]);
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Select {type}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${
                    localSelected.has(item.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      : 'hover:bg-gray-50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.description}</div>
                  </div>
                  {localSelected.has(item.id) && (
                    <Check className="text-blue-600" size={20} />
                  )}
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No items found</div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Confirm Selection ({localSelected.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentPicker;
