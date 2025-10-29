// src/components/developmentplan/QuickPlanEditor.jsx
// Quick editor for updating development plan from dashboard

import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Edit3, CheckCircle } from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from './DevPlanComponents';
import { COLORS, calculateSkillProgress } from './devPlanUtils';

const QuickPlanEditor = ({ 
  plan, 
  globalMetadata, 
  onSave, 
  onCancel,
  isEmbedded = false, // Whether it's embedded in dashboard vs standalone
}) => {
  const [editedPlan, setEditedPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const skillCatalog = (globalMetadata?.SKILL_CATALOG?.items
  || globalMetadata?.SKILL_CATALOG
  || globalMetadata?.config?.catalog?.SKILL_CATALOG?.items
  || globalMetadata?.config?.catalog?.SKILL_CATALOG
  || []);

  useEffect(() => {
    if (plan) {
      setEditedPlan(JSON.parse(JSON.stringify(plan)));
    }
  }, [plan]);

  if (!editedPlan) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedPlan);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !confirm('Discard changes?')) return;
    onCancel();
  };

  const updateRepWeeks = (repIndex, newWeeks) => {
    const updated = { ...editedPlan };
    updated.coreReps[repIndex].weeksCompleted = Math.max(0, Math.min(12, newWeeks));
    setEditedPlan(updated);
    setHasChanges(true);
  };

  const removeRep = (repIndex) => {
    if (!confirm('Remove this skill from your plan?')) return;
    const updated = { ...editedPlan };
    updated.coreReps.splice(repIndex, 1);
    setEditedPlan(updated);
    setHasChanges(true);
  };

  const addRep = () => {
    // Show simple skill selector
    const skillId = prompt('Enter skill ID (or Skill Name) to add:');
    if (!skillId) return;
    
    let skill = skillCatalog.find(s => s.id === skillId);
    if (!skill) { skill = skillCatalog.find(s => (s.name || s.title) === skillId); }
    if (!skill) {
      alert('Skill not found');
      return;
    }

    const updated = { ...editedPlan };
    updated.coreReps.push({
      skillId: skill.id,
      weeksCompleted: 0,
    });
    setEditedPlan(updated);
    setHasChanges(true);
  };

  const totalProgress = editedPlan.coreReps.length > 0
    ? Math.round(
        editedPlan.coreReps.reduce((sum, rep) => sum + (rep.weeksCompleted || 0), 0) /
        (editedPlan.coreReps.length * 12) * 100
      )
    : 0;

  return (
    <Card
      title={isEmbedded ? "Quick Edit Plan" : "Edit Development Plan"}
      icon={Edit3}
      accent="TEAL"
      actions={
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="warning" size="sm">Unsaved</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X size={16} />
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      {/* Overall Progress */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: COLORS.LIGHT_GRAY }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">Overall Progress</span>
          <span className="text-2xl font-bold" style={{ color: COLORS.TEAL }}>
            {totalProgress}%
          </span>
        </div>
        <ProgressBar progress={totalProgress} color={COLORS.TEAL} height={8} />
      </div>

      {/* Skills List */}
      <div className="space-y-4 mb-6">
        {editedPlan.coreReps.map((rep, index) => {
          const skill = skillCatalog.find(s => s.id === rep.skillId);
          const progressPercent = Math.round(((rep.weeksCompleted || 0) / 12) * 100);
          
          return (
            <div
              key={index}
              className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ borderColor: COLORS.SUBTLE, background: 'white' }}
            >
              <div className="flex items-start gap-4">
                {/* Skill Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-bold text-sm" style={{ color: COLORS.NAVY }}>
                      {skill?.name || rep.skillId}
                    </h5>
                    {rep.weeksCompleted >= 12 && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <ProgressBar 
                    progress={progressPercent}
                    color={rep.weeksCompleted >= 12 ? COLORS.GREEN : COLORS.BLUE}
                    height={6}
                  />
                  
                  {/* Weeks Input */}
                  <div className="flex items-center gap-4 mt-3">
                    <label className="text-xs font-semibold text-gray-600">
                      Weeks Completed:
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRepWeeks(index, (rep.weeksCompleted || 0) - 1)}
                        disabled={isSaving || (rep.weeksCompleted || 0) <= 0}
                        className="!px-2 !py-1"
                      >
                        −
                      </Button>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={rep.weeksCompleted || 0}
                        onChange={(e) => updateRepWeeks(index, parseInt(e.target.value) || 0)}
                        disabled={isSaving}
                        className="w-16 px-2 py-1 text-center border-2 rounded-lg font-semibold"
                        style={{ borderColor: COLORS.SUBTLE }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRepWeeks(index, (rep.weeksCompleted || 0) + 1)}
                        disabled={isSaving || (rep.weeksCompleted || 0) >= 12}
                        className="!px-2 !py-1"
                      >
                        +
                      </Button>
                      <span className="text-xs text-gray-500">/ 12</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRep(index)}
                  disabled={isSaving}
                  className="!p-2 text-red-500 hover:!bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rep Button */}
      <Button
        variant="outline"
        onClick={addRep}
        disabled={isSaving}
        className="w-full"
      >
        <Plus size={16} />
        Add Skill
      </Button>

      {/* Info Message */}
      {!isEmbedded && (
        <div className="mt-6 p-3 rounded-lg" style={{ background: `${COLORS.BLUE}10` }}>
          <p className="text-xs text-gray-600">
            <strong>Tip:</strong> Adjust weeks completed for each skill to track your progress.
            Changes will sync with your Daily Practice tracker.
          </p>
        </div>
      )}
    </Card>
  );
};

export default QuickPlanEditor;
