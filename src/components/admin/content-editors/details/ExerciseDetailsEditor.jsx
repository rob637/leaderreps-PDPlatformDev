import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import ContentPicker from '../pickers/ContentPicker';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';

const ExerciseDetailsEditor = ({ details, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const reps = details.reps || [];

  const handleAddReps = (selectedReps) => {
    const newReps = [...reps];
    selectedReps.forEach(r => {
      if (!newReps.find(existing => existing.id === r.id)) {
        newReps.push({
          id: r.id,
          title: r.title,
          type: r.type // Important to know if it's REP or READ_REP
        });
      }
    });
    onChange('reps', newReps);
    setShowPicker(false);
  };

  const removeRep = (index) => {
    const newReps = [...reps];
    newReps.splice(index, 1);
    onChange('reps', newReps);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Exercise Reps</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPicker('REP')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
          >
            <Plus size={16} />
            Add Video Rep
          </button>
          <button
            type="button"
            onClick={() => setShowPicker('READ_REP')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
          >
            <Plus size={16} />
            Add Reading Rep
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {reps.map((rep, index) => (
          <div key={rep.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <GripVertical className="text-gray-400 cursor-move" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded ${
                  rep.type === CONTENT_TYPES.READ_REP ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {rep.type === CONTENT_TYPES.READ_REP ? 'READ' : 'VIDEO'}
                </span>
                <span className="font-medium">{rep.title}</span>
              </div>
            </div>
            <button
              onClick={() => removeRep(index)}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {reps.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            No reps added yet
          </div>
        )}
      </div>

      {showPicker && (
        <ContentPicker
          type={showPicker === 'REP' ? CONTENT_TYPES.REP : CONTENT_TYPES.READ_REP}
          multiSelect={true}
          selectedIds={reps.map(r => r.id)}
          onSelect={handleAddReps}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

export default ExerciseDetailsEditor;
