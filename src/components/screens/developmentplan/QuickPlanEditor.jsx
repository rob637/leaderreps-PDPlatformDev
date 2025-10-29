// src/components/developmentplan/QuickPlanEditor.jsx
// Quick inline editor for adjusting skill weeks in current plan
// FIXED: Updated to sync both coreReps and _originalFocusAreas structures

import React, { useState } from 'react';
import { Save, Plus, Minus, X } from 'lucide-react';
import { Button, Card } from './DevPlanComponents';
import { COLORS } from './devPlanUtils';

// Helper to generate consistent skill IDs
const generateSkillId = (areaName, index) => {
  const sanitized = areaName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${sanitized}_rep${index}`;
};

const QuickPlanEditor = ({ plan, onSave, onCancel }) => {
  const [editedPlan, setEditedPlan] = useState({ ...plan });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateRepWeeks = (repIndex, newWeeks) => {
    const updated = { ...editedPlan };
    const clampedWeeks = Math.max(0, Math.min(12, newWeeks));
    
    // Update coreReps
    updated.coreReps[repIndex].weeksCompleted = clampedWeeks;
    
    // FIXED: Also update original focusAreas structure
    if (updated._originalFocusAreas) {
      const rep = updated.coreReps[repIndex];
      const areaIndex = rep.areaIndex;
      const localRepIndex = rep.repIndex;
      
      if (updated._originalFocusAreas[areaIndex]?.reps?.[localRepIndex]) {
        // Convert weeks to phase
        const phase = 
          clampedWeeks <= 3 ? 'Week 1-3' :
          clampedWeeks <= 6 ? 'Week 4-6' :
          clampedWeeks <= 9 ? 'Week 7-9' : 'Week 10-12';
        
        updated._originalFocusAreas[areaIndex].reps[localRepIndex].week = phase;
      }
    }
    
    setEditedPlan(updated);
    setHasChanges(true);
  };

  const removeRep = (repIndex) => {
    if (!confirm('Remove this skill from your plan?')) return;
    
    const updated = { ...editedPlan };
    
    // FIXED: Sync both structures
    if (updated._originalFocusAreas) {
      const rep = updated.coreReps[repIndex];
      const areaIndex = rep.areaIndex;
      const localRepIndex = rep.repIndex;
      
      if (updated._originalFocusAreas[areaIndex]) {
        updated._originalFocusAreas[areaIndex].reps.splice(localRepIndex, 1);
      }
    }
    
    updated.coreReps.splice(repIndex, 1);
    setEditedPlan(updated);
    setHasChanges(true);
  };

  const addRep = () => {
    const skillName = prompt('Enter rep name to add (e.g., "Practice Feedback"):');
    if (!skillName) return;
    
    const areaName = prompt('Enter focus area name (e.g., "Clarity & Communication"):');
    if (!areaName) return;
    
    const updated = { ...editedPlan };
    
    // Add to coreReps
    const newRep = {
      skillId: generateSkillId(areaName, updated.coreReps.length),
      skillName: skillName,
      focusArea: areaName,
      weeksCompleted: 0,
      phase: 'Week 1-3',
      areaIndex: -1, // Will be set below
      repIndex: 0
    };
    
    updated.coreReps.push(newRep);
    
    // FIXED: Also update original structure
    if (updated._originalFocusAreas) {
      let area = updated._originalFocusAreas.find(a => a.name === areaName);
      
      if (!area) {
        // Create new focus area
        area = {
          name: areaName,
          courses: [],
          reps: [],
          score: 'N/A',
          whatGoodLooksLike: '',
          why: ''
        };
        updated._originalFocusAreas.push(area);
        newRep.areaIndex = updated._originalFocusAreas.length - 1;
      } else {
        newRep.areaIndex = updated._originalFocusAreas.indexOf(area);
      }
      
      area.reps.push({
        rep: skillName,
        week: 'Week 1-3'
      });
      
      newRep.repIndex = area.reps.length - 1;
    }
    
    setEditedPlan(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('[QuickPlanEditor] Saving plan with synced structures');
      await onSave(editedPlan);
      setHasChanges(false);
    } catch (error) {
      console.error('[QuickPlanEditor] Save failed:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!plan || !plan.coreReps) {
    return (
      <Card accent="ORANGE">
        <p className="text-gray-600">No plan available to edit.</p>
      </Card>
    );
  }

  // Group by focus area for display
  const repsByArea = {};
  editedPlan.coreReps.forEach((rep, index) => {
    const area = rep.focusArea || 'General';
    if (!repsByArea[area]) {
      repsByArea[area] = [];
    }
    repsByArea[area].push({ ...rep, originalIndex: index });
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card accent="ORANGE">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Quick Edit Plan
            </h2>
            <p className="text-gray-600">
              Adjust weeks completed for each skill or add/remove skills.
            </p>
          </div>
          {hasChanges && (
            <div className="text-sm font-medium" style={{ color: COLORS.ORANGE }}>
              Unsaved changes
            </div>
          )}
        </div>
      </Card>

      {/* Skills by Area */}
      {Object.entries(repsByArea).map(([area, reps]) => (
        <Card key={area} accent="ORANGE">
          <h3 className="font-bold mb-4" style={{ color: COLORS.NAVY }}>
            {area}
          </h3>
          
          <div className="space-y-3">
            {reps.map((rep) => (
              <div
                key={rep.originalIndex}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium" style={{ color: COLORS.NAVY }}>
                    {rep.skillName}
                  </div>
                  {rep.phase && (
                    <div className="text-sm text-gray-600">
                      {rep.phase}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRepWeeks(rep.originalIndex, (rep.weeksCompleted || 0) - 1)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isSaving || (rep.weeksCompleted || 0) <= 0}
                  >
                    <Minus size={16} />
                  </button>
                  
                  <div className="w-16 text-center">
                    <div className="font-bold" style={{ color: COLORS.ORANGE }}>
                      {rep.weeksCompleted || 0}
                    </div>
                    <div className="text-xs text-gray-600">weeks</div>
                  </div>
                  
                  <button
                    onClick={() => updateRepWeeks(rep.originalIndex, (rep.weeksCompleted || 0) + 1)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isSaving || (rep.weeksCompleted || 0) >= 12}
                  >
                    <Plus size={16} />
                  </button>
                  
                  <button
                    onClick={() => removeRep(rep.originalIndex)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors text-red-600"
                    disabled={isSaving}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Actions */}
      <Card accent="ORANGE">
        <div className="flex gap-3">
          <Button
            onClick={addRep}
            variant="secondary"
            className="flex items-center gap-2"
            disabled={isSaving}
          >
            <Plus size={16} />
            Add Skill
          </Button>
          
          <div className="flex-1" />
          
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={isSaving}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex items-center gap-2"
            disabled={!hasChanges || isSaving}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuickPlanEditor;
