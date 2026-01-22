import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Play, Pause, Trash2, Edit, Copy, ChevronRight,
  Clock, Users, Mail, MessageSquare, Calendar, Target,
  RefreshCw, Settings, MoreVertical, CheckCircle, Circle,
  ArrowRight, Workflow, GitBranch, ToggleLeft, ToggleRight,
  Bell, Filter, X, Save, AlertCircle
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Workflow Automation Engine
 * 
 * Features:
 * - Visual workflow builder
 * - Trigger conditions
 * - Action sequences
 * - Conditional logic
 * - Schedule automation
 * - Activity logging
 */

const TRIGGERS = [
  { id: 'prospect_created', label: 'New Prospect Added', icon: Users, category: 'prospect' },
  { id: 'stage_changed', label: 'Stage Changed', icon: GitBranch, category: 'prospect' },
  { id: 'demo_completed', label: 'Demo Completed', icon: Calendar, category: 'demo' },
  { id: 'proposal_sent', label: 'Proposal Sent', icon: Mail, category: 'proposal' },
  { id: 'deal_won', label: 'Deal Won', icon: CheckCircle, category: 'deal' },
  { id: 'deal_lost', label: 'Deal Lost', icon: AlertCircle, category: 'deal' },
  { id: 'no_activity', label: 'No Activity (days)', icon: Clock, category: 'activity' }
];

const ACTIONS = [
  { id: 'send_email', label: 'Send Email', icon: Mail, color: 'bg-blue-100 text-blue-600' },
  { id: 'create_task', label: 'Create Task', icon: Target, color: 'bg-purple-100 text-purple-600' },
  { id: 'notify_team', label: 'Notify Team', icon: Bell, color: 'bg-amber-100 text-amber-600' },
  { id: 'update_stage', label: 'Update Stage', icon: GitBranch, color: 'bg-green-100 text-green-600' },
  { id: 'add_note', label: 'Add Note', icon: MessageSquare, color: 'bg-slate-100 text-slate-600' },
  { id: 'wait', label: 'Wait (delay)', icon: Clock, color: 'bg-orange-100 text-orange-600' }
];

const DEFAULT_WORKFLOWS = [
  {
    id: 'default-1',
    name: 'New Prospect Welcome',
    description: 'Send welcome email when new prospect is added',
    trigger: 'prospect_created',
    actions: [
      { type: 'send_email', config: { template: 'Welcome Email' } },
      { type: 'create_task', config: { title: 'Initial outreach call', dueIn: 2 } }
    ],
    active: true,
    runsCount: 45,
    lastRun: new Date().toISOString()
  },
  {
    id: 'default-2',
    name: 'Follow-up After Demo',
    description: 'Automatically follow up 2 days after demo',
    trigger: 'demo_completed',
    actions: [
      { type: 'wait', config: { days: 2 } },
      { type: 'send_email', config: { template: 'Post-Demo Follow-up' } },
      { type: 'notify_team', config: { message: 'Demo follow-up sent' } }
    ],
    active: true,
    runsCount: 23,
    lastRun: new Date().toISOString()
  },
  {
    id: 'default-3',
    name: 'Stale Prospect Alert',
    description: 'Alert when no activity for 7 days',
    trigger: 'no_activity',
    triggerConfig: { days: 7 },
    actions: [
      { type: 'notify_team', config: { message: 'Prospect has no activity for 7 days' } },
      { type: 'create_task', config: { title: 'Re-engage prospect', dueIn: 1 } }
    ],
    active: false,
    runsCount: 12,
    lastRun: null
  }
];

const WorkflowAutomation = () => {
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: 'prospect_created',
    triggerConfig: {},
    actions: [],
    active: false
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const workflowsSnap = await getDocs(
        query(collection(db, 'corporate_workflows'), orderBy('createdAt', 'desc'))
      );
      let workflowsData = workflowsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (workflowsData.length === 0) {
        workflowsData = DEFAULT_WORKFLOWS;
      }
      
      setWorkflows(workflowsData);
    } catch (err) {
      console.error("Error fetching workflows:", err);
      setWorkflows(DEFAULT_WORKFLOWS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWorkflow && !editingWorkflow.startsWith('default-')) {
        await updateDoc(doc(db, 'corporate_workflows', editingWorkflow), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'corporate_workflows'), {
          ...formData,
          runsCount: 0,
          lastRun: null,
          createdAt: serverTimestamp()
        });
      }
      setShowEditor(false);
      setEditingWorkflow(null);
      resetForm();
      fetchWorkflows();
    } catch (err) {
      console.error("Error saving workflow:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow?')) return;
    if (id.startsWith('default-')) {
      setWorkflows(workflows.filter(w => w.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'corporate_workflows', id));
      fetchWorkflows();
    } catch (err) {
      console.error("Error deleting workflow:", err);
    }
  };

  const toggleActive = async (id, currentActive) => {
    if (id.startsWith('default-')) {
      setWorkflows(workflows.map(w => 
        w.id === id ? { ...w, active: !currentActive } : w
      ));
      return;
    }
    try {
      await updateDoc(doc(db, 'corporate_workflows', id), {
        active: !currentActive
      });
      setWorkflows(workflows.map(w => 
        w.id === id ? { ...w, active: !currentActive } : w
      ));
    } catch (err) {
      console.error("Error toggling workflow:", err);
    }
  };

  const handleEdit = (workflow) => {
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      trigger: workflow.trigger,
      triggerConfig: workflow.triggerConfig || {},
      actions: workflow.actions || [],
      active: workflow.active
    });
    setEditingWorkflow(workflow.id);
    setShowEditor(true);
  };

  const handleDuplicate = (workflow) => {
    setFormData({
      name: `${workflow.name} (Copy)`,
      description: workflow.description || '',
      trigger: workflow.trigger,
      triggerConfig: workflow.triggerConfig || {},
      actions: workflow.actions || [],
      active: false
    });
    setEditingWorkflow(null);
    setShowEditor(true);
  };

  const addAction = (actionType) => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: actionType, config: {} }]
    });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const updateActionConfig = (index, config) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], config };
    setFormData({ ...formData, actions: newActions });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger: 'prospect_created',
      triggerConfig: {},
      actions: [],
      active: false
    });
  };

  const activeWorkflows = workflows.filter(w => w.active);
  const totalRuns = workflows.reduce((acc, w) => acc + (w.runsCount || 0), 0);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">Workflow Automation</h1>
          <p className="text-slate-500 mt-1">Automate repetitive tasks and never miss a follow-up</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setEditingWorkflow(null);
            setShowEditor(true);
          }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={18} /> Create Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Workflow className="text-purple-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{workflows.length}</div>
              <div className="text-sm text-slate-500">Total Workflows</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Play className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{activeWorkflows.length}</div>
              <div className="text-sm text-slate-500">Active</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Zap className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{totalRuns}</div>
              <div className="text-sm text-slate-500">Total Runs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="text-amber-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {Math.round(totalRuns * 5)}
              </div>
              <div className="text-sm text-slate-500">Minutes Saved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Workflow className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-medium text-slate-600 mb-1">No workflows yet</h3>
          <p className="text-sm text-slate-400">Create your first automation to save time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map(workflow => {
            const trigger = TRIGGERS.find(t => t.id === workflow.trigger);
            const TriggerIcon = trigger?.icon || Zap;
            return (
              <div 
                key={workflow.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        workflow.active ? 'bg-corporate-teal/10' : 'bg-slate-100'
                      }`}>
                        <TriggerIcon className={workflow.active ? 'text-corporate-teal' : 'text-slate-400'} size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-800">{workflow.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            workflow.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {workflow.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{workflow.description}</p>
                        
                        {/* Workflow Steps Preview */}
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          <span className="text-xs px-2 py-1 bg-slate-100 rounded flex items-center gap-1">
                            <TriggerIcon size={12} />
                            {trigger?.label || 'Trigger'}
                          </span>
                          <ArrowRight size={14} className="text-slate-300" />
                          {workflow.actions?.slice(0, 3).map((action, idx) => {
                            const actionDef = ACTIONS.find(a => a.id === action.type);
                            const ActionIcon = actionDef?.icon || Zap;
                            return (
                              <React.Fragment key={idx}>
                                <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${actionDef?.color || 'bg-slate-100 text-slate-600'}`}>
                                  <ActionIcon size={12} />
                                  {actionDef?.label || action.type}
                                </span>
                                {idx < Math.min(workflow.actions.length - 1, 2) && (
                                  <ArrowRight size={14} className="text-slate-300" />
                                )}
                              </React.Fragment>
                            );
                          })}
                          {workflow.actions?.length > 3 && (
                            <span className="text-xs text-slate-400">+{workflow.actions.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleActive(workflow.id, workflow.active)}
                        className={`p-2 rounded-lg transition ${
                          workflow.active 
                            ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {workflow.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button 
                        onClick={() => handleEdit(workflow)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDuplicate(workflow)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(workflow.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-sm text-slate-500">
                  <span>{workflow.runsCount || 0} runs total</span>
                  <span>
                    {workflow.lastRun 
                      ? `Last run: ${new Date(workflow.lastRun).toLocaleDateString()}`
                      : 'Never run'
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-corporate-navy">
                  {editingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                </h3>
                <button 
                  onClick={() => {
                    setShowEditor(false);
                    setEditingWorkflow(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Workflow Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    placeholder="Follow-up After Demo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    placeholder="Automatically follow up after demo completion"
                  />
                </div>
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">When this happens...</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGERS.map(trigger => {
                    const Icon = trigger.icon;
                    return (
                      <button
                        key={trigger.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, trigger: trigger.id })}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition text-left ${
                          formData.trigger === trigger.id 
                            ? 'border-corporate-teal bg-corporate-teal/5' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={18} className={formData.trigger === trigger.id ? 'text-corporate-teal' : 'text-slate-400'} />
                        <span className="text-sm">{trigger.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Then do this...</label>
                <div className="space-y-3">
                  {formData.actions.map((action, index) => {
                    const actionDef = ACTIONS.find(a => a.id === action.type);
                    const Icon = actionDef?.icon || Zap;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded text-xs font-bold text-slate-500">
                          {index + 1}
                        </div>
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${actionDef?.color}`}>
                          <Icon size={16} />
                        </div>
                        <span className="flex-1 text-sm font-medium">{actionDef?.label}</span>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                  
                  {formData.actions.length === 0 && (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-sm text-slate-400">
                      Add actions below
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {ACTIONS.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => addAction(action.id)}
                          className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:bg-slate-50"
                        >
                          <Icon size={14} />
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-800">Activate Workflow</div>
                  <div className="text-xs text-slate-500">Start running this automation immediately</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`p-2 rounded-lg transition ${
                    formData.active 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {formData.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingWorkflow(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingWorkflow ? 'Update Workflow' : 'Create Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAutomation;
