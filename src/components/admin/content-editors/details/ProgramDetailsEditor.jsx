import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Film, Wrench, BookOpen, Dumbbell } from 'lucide-react';
import ContentPicker from '../pickers/ContentPicker';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';

const ProgramDetailsEditor = ({ details, onChange }) => {
  const [pickerType, setPickerType] = useState(null);
  
  // Support both legacy 'workouts' and new 'modules'
  const modules = details.modules || details.workouts || [];

  const handleAddContent = (selectedItems) => {
    const newModules = [...modules];
    selectedItems.forEach(item => {
      // Avoid duplicates
      if (!newModules.find(existing => existing.id === item.id)) {
        newModules.push({
          id: item.id,
          title: item.title,
          type: pickerType, // Store the type so we know how to render/link it
          description: item.description
        });
      }
    });
    onChange('modules', newModules);
    setPickerType(null);
  };

  const removeModule = (index) => {
    const newModules = [...modules];
    newModules.splice(index, 1);
    onChange('modules', newModules);
  };

  const getIconForType = (type) => {
    switch (type) {
      case CONTENT_TYPES.VIDEO: return <Film size={16} className="text-blue-500" />;
      case CONTENT_TYPES.TOOL: return <Wrench size={16} className="text-orange-500" />;
      case CONTENT_TYPES.READ_REP: return <BookOpen size={16} className="text-green-500" />;
      case CONTENT_TYPES.WORKOUT: return <Dumbbell size={16} className="text-purple-500" />;
      default: return <GripVertical size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">Program Content</h3>
        <p className="text-sm text-gray-500">
          Build your program by adding existing content from the library.
        </p>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={() => setPickerType(CONTENT_TYPES.VIDEO)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200"
          >
            <Plus size={14} /> Add Video
          </button>
          <button
            type="button"
            onClick={() => setPickerType(CONTENT_TYPES.TOOL)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 border border-orange-200"
          >
            <Plus size={14} /> Add Tool
          </button>
          <button
            type="button"
            onClick={() => setPickerType(CONTENT_TYPES.READ_REP)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200"
          >
            <Plus size={14} /> Add Reading
          </button>
          <button
            type="button"
            onClick={() => setPickerType(CONTENT_TYPES.WORKOUT)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-200"
          >
            <Plus size={14} /> Add Workout
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        {modules.map((module, index) => (
          <div key={`${module.id}-${index}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <GripVertical className="text-gray-300 cursor-move" size={20} />
            <div className="p-2 bg-gray-50 rounded-md">
              {getIconForType(module.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{module.title}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="uppercase tracking-wider font-bold text-[10px]">{module.type}</span>
                {module.description && <span className="truncate">- {module.description}</span>}
              </div>
            </div>
            <button
              onClick={() => removeModule(index)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        
        {modules.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <p>No content added yet.</p>
            <p className="text-sm mt-1">Use the buttons above to add modules to this program.</p>
          </div>
        )}
      </div>

      {pickerType && (
        <ContentPicker
          type={pickerType}
          multiSelect={true}
          selectedIds={modules.filter(m => m.type === pickerType).map(m => m.id)}
          onSelect={handleAddContent}
          onClose={() => setPickerType(null)}
        />
      )}
    </div>
  );
};

export default ProgramDetailsEditor;
