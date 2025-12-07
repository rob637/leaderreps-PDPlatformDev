import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import ContentPicker from '../pickers/ContentPicker';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';

const ProgramDetailsEditor = ({ details, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const workouts = details.workouts || [];

  const handleAddWorkouts = (selectedWorkouts) => {
    const newWorkouts = [...workouts];
    selectedWorkouts.forEach(w => {
      if (!newWorkouts.find(existing => existing.id === w.id)) {
        newWorkouts.push({
          id: w.id,
          title: w.title,
          description: w.description
        });
      }
    });
    onChange('workouts', newWorkouts);
    setShowPicker(false);
  };

  const removeWorkout = (index) => {
    const newWorkouts = [...workouts];
    newWorkouts.splice(index, 1);
    onChange('workouts', newWorkouts);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Program Workouts</h3>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <Plus size={16} />
          Add Workout
        </button>
      </div>

      <div className="space-y-2">
        {workouts.map((workout, index) => (
          <div key={workout.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <GripVertical className="text-gray-400 cursor-move" size={20} />
            <div className="flex-1">
              <div className="font-medium">{workout.title}</div>
              <div className="text-xs text-gray-500">{workout.description}</div>
            </div>
            <button
              onClick={() => removeWorkout(index)}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {workouts.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            No workouts added yet
          </div>
        )}
      </div>

      {showPicker && (
        <ContentPicker
          type={CONTENT_TYPES.WORKOUT}
          multiSelect={true}
          selectedIds={workouts.map(w => w.id)}
          onSelect={handleAddWorkouts}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

export default ProgramDetailsEditor;
