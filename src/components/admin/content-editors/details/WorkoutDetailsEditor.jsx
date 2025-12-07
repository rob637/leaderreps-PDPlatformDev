import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import ContentPicker from '../pickers/ContentPicker';
import { CONTENT_TYPES } from '../../../../services/unifiedContentService';

const WorkoutDetailsEditor = ({ details, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const exercises = details.exercises || [];

  const handleAddExercises = (selectedExercises) => {
    const newExercises = [...exercises];
    selectedExercises.forEach(e => {
      if (!newExercises.find(existing => existing.id === e.id)) {
        newExercises.push({
          id: e.id,
          title: e.title,
          description: e.description
        });
      }
    });
    onChange('exercises', newExercises);
    setShowPicker(false);
  };

  const removeExercise = (index) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    onChange('exercises', newExercises);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Workout Exercises</h3>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <Plus size={16} />
          Add Exercise
        </button>
      </div>

      <div className="space-y-2">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <GripVertical className="text-gray-400 cursor-move" size={20} />
            <div className="flex-1">
              <div className="font-medium">{exercise.title}</div>
              <div className="text-xs text-gray-500">{exercise.description}</div>
            </div>
            <button
              onClick={() => removeExercise(index)}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {exercises.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            No exercises added yet
          </div>
        )}
      </div>

      {showPicker && (
        <ContentPicker
          type={CONTENT_TYPES.EXERCISE}
          multiSelect={true}
          selectedIds={exercises.map(e => e.id)}
          onSelect={handleAddExercises}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

export default WorkoutDetailsEditor;
