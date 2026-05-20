// src/components/admin/crm/pages/WorkflowsPage.jsx
//
// Admin UI for managing automation rules. Each rule has a trigger (when) and
// an action (do). Server-side dispatcher runs rules on Firestore writes.

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Power,
  PowerOff,
  Workflow as WorkflowIcon,
  Save,
  X,
} from 'lucide-react';
import {
  useWorkflowsStore,
  TRIGGER_TYPES,
  ACTION_TYPES,
} from '../stores/workflowsStore';
import { DEAL_STAGES } from '../config/dealMeta';

const EMPTY_RULE = {
  name: '',
  enabled: true,
  trigger: { type: 'on_stage_change', params: {} },
  action: { type: 'create_task', params: { title: '', dueInDays: 1, assignToOwner: true } },
};

export default function WorkflowsPage() {
  const {
    workflows,
    loading,
    subscribeToWorkflows,
    addWorkflow,
    toggleWorkflow,
    deleteWorkflow,
  } = useWorkflowsStore();
  const [editing, setEditing] = useState(null); // null | EMPTY_RULE shape

  useEffect(() => subscribeToWorkflows(), [subscribeToWorkflows]);

  const handleSave = async () => {
    if (!editing.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await addWorkflow(editing);
      toast.success('Workflow created');
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <WorkflowIcon className="w-5 h-5 text-brand-teal" />
            Workflow Automation
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Trigger tasks and notifications automatically when CRM events happen.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing({ ...EMPTY_RULE })}
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        )}
      </div>

      {editing && (
        <RuleEditor
          rule={editing}
          onChange={setEditing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {loading && (
          <div className="p-8 text-center text-sm text-slate-500">Loading workflows...</div>
        )}
        {!loading && workflows.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No workflows yet. Click <span className="font-medium">New Workflow</span> to create your first rule.
          </div>
        )}
        {workflows.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${w.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`}
                />
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {w.name}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>
                  When: {TRIGGER_TYPES.find((t) => t.id === w.trigger?.type)?.label || w.trigger?.type}
                </span>
                <span className="mx-2">→</span>
                <span>
                  Do: {ACTION_TYPES.find((a) => a.id === w.action?.type)?.label || w.action?.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggleWorkflow(w.id, !w.enabled)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                title={w.enabled ? 'Disable' : 'Enable'}
              >
                {w.enabled ? (
                  <Power className="w-4 h-4 text-emerald-500" />
                ) : (
                  <PowerOff className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${w.name}"?`)) deleteWorkflow(w.id);
                }}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RuleEditor({ rule, onChange, onSave, onCancel }) {
  const setTrigger = (patch) =>
    onChange({ ...rule, trigger: { ...rule.trigger, ...patch } });
  const setTriggerParam = (k, v) =>
    setTrigger({ params: { ...rule.trigger.params, [k]: v } });
  const setAction = (patch) =>
    onChange({ ...rule, action: { ...rule.action, ...patch } });
  const setActionParam = (k, v) =>
    setAction({ params: { ...rule.action.params, [k]: v } });

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-brand-teal/40 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">New Workflow</h3>
        <button onClick={onCancel} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <Field label="Name">
        <input
          value={rule.name}
          onChange={(e) => onChange({ ...rule, name: e.target.value })}
          placeholder="e.g. Follow up after deal moves to Negotiation"
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            When (Trigger)
          </div>
          <Field label="Event">
            <select
              value={rule.trigger.type}
              onChange={(e) => setTrigger({ type: e.target.value, params: {} })}
              className="input"
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Field>
          {rule.trigger.type === 'on_stage_change' && (
            <>
              <Field label="From stage (optional)">
                <select
                  value={rule.trigger.params.fromStage || ''}
                  onChange={(e) => setTriggerParam('fromStage', e.target.value || null)}
                  className="input"
                >
                  <option value="">Any</option>
                  {DEAL_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="To stage">
                <select
                  value={rule.trigger.params.toStage || ''}
                  onChange={(e) => setTriggerParam('toStage', e.target.value || null)}
                  className="input"
                >
                  <option value="">Any</option>
                  {DEAL_STAGES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
          {rule.trigger.type === 'on_no_activity' && (
            <Field label="Days since last activity">
              <input
                type="number"
                min={1}
                value={rule.trigger.params.daysSinceActivity || 7}
                onChange={(e) =>
                  setTriggerParam('daysSinceActivity', Number(e.target.value) || 7)
                }
                className="input"
              />
            </Field>
          )}
        </div>

        <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Then (Action)
          </div>
          <Field label="Action">
            <select
              value={rule.action.type}
              onChange={(e) => setAction({ type: e.target.value, params: {} })}
              className="input"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </Field>
          {rule.action.type === 'create_task' && (
            <>
              <Field label="Task title">
                <input
                  value={rule.action.params.title || ''}
                  onChange={(e) => setActionParam('title', e.target.value)}
                  placeholder="e.g. Send proposal follow-up"
                  className="input"
                />
              </Field>
              <Field label="Due in (days)">
                <input
                  type="number"
                  min={0}
                  value={rule.action.params.dueInDays ?? 1}
                  onChange={(e) => setActionParam('dueInDays', Number(e.target.value) || 0)}
                  className="input"
                />
              </Field>
            </>
          )}
          {rule.action.type === 'notify' && (
            <Field label="Message">
              <input
                value={rule.action.params.message || ''}
                onChange={(e) => setActionParam('message', e.target.value)}
                placeholder="e.g. Deal moved to Negotiation — review next steps"
                className="input"
              />
            </Field>
          )}
          {rule.action.type === 'set_field' && (
            <>
              <Field label="Field name">
                <input
                  value={rule.action.params.field || ''}
                  onChange={(e) => setActionParam('field', e.target.value)}
                  placeholder="e.g. priority"
                  className="input"
                />
              </Field>
              <Field label="Value">
                <input
                  value={rule.action.params.value || ''}
                  onChange={(e) => setActionParam('value', e.target.value)}
                  placeholder="e.g. high"
                  className="input"
                />
              </Field>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
        >
          <Save className="w-4 h-4" />
          Save Workflow
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          background: white;
          color: rgb(15 23 42);
        }
        .dark .input {
          border-color: rgb(71 85 105);
          background: rgb(15 23 42);
          color: rgb(241 245 249);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
