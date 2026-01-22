import React, { useState, useEffect } from 'react';
import { 
  GitMerge, Plus, Clock, Mail, MessageSquare, 
  Trash2, Save, Play, Pause, MoreVertical,
  CheckCircle, ArrowDown, Settings
} from 'lucide-react';
import { collection, addDoc, query, onSnapshot, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';

const SequenceManager = () => {
    const [sequences, setSequences] = useState([]);
    const [activeSequence, setActiveSequence] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load Sequences
    useEffect(() => {
        const q = query(collection(db, 'sales_sequences'), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const seqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSequences(seqs);
            if (seqs.length > 0 && !activeSequence) {
                // setActiveSequence(seqs[0]); // Optional: auto-select first
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCreateSequence = async () => {
        const newSeq = {
            name: "New Untitled Sequence",
            status: "draft",
            steps: [],
            stats: { active: 0, completed: 0, replied: 0 },
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'sales_sequences'), newSeq);
        setActiveSequence({ id: docRef.id, ...newSeq });
    };

    const handleSaveSequence = async () => {
        if (!activeSequence) return;
        try {
            const docRef = doc(db, 'sales_sequences', activeSequence.id);
            await updateDoc(docRef, {
                ...activeSequence,
                updatedAt: new Date().toISOString()
            });
            alert("Sequence saved!");
        } catch (e) {
            console.error("Error saving sequence:", e);
        }
    };

    const addStep = (type) => {
        if (!activeSequence) return;
        const newStep = {
            id: Date.now().toString(),
            type, // 'email', 'task', 'wait'
            title: type === 'wait' ? 'Wait 2 Days' : 'New Step',
            config: type === 'wait' ? { days: 2 } : { subject: '', body: '' }
        };
        setActiveSequence({
            ...activeSequence,
            steps: [...activeSequence.steps, newStep]
        });
    };

    const updateStep = (stepId, updates) => {
        const updatedSteps = activeSequence.steps.map(step => 
            step.id === stepId ? { ...step, ...updates } : step
        );
        setActiveSequence({ ...activeSequence, steps: updatedSteps });
    };

    const removeStep = (stepId) => {
        const updatedSteps = activeSequence.steps.filter(step => step.id !== stepId);
        setActiveSequence({ ...activeSequence, steps: updatedSteps });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                     <h1 className="text-3xl font-bold text-corporate-navy flex items-center gap-3">
                        <GitMerge className="w-8 h-8 text-fuchsia-600" />
                        Sequence Builder
                     </h1>
                     <p className="text-slate-500 mt-1">Automate your outreach with multi-step campaigns.</p>
                </div>
                <button 
                    onClick={handleCreateSequence}
                    className="bg-corporate-navy text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4" /> New Sequence
                </button>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                
                {/* Sidebar List */}
                <div className="col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50">
                        All Campaigns ({sequences.length})
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? (
                            <div className="p-4 text-center text-slate-400">Loading...</div>
                        ) : sequences.map(seq => (
                            <div 
                                key={seq.id}
                                onClick={() => setActiveSequence(seq)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    activeSequence?.id === seq.id 
                                        ? 'bg-fuchsia-50 border border-fuchsia-200 shadow-sm' 
                                        : 'hover:bg-slate-50 border border-transparent'
                                }`}
                            >
                                <div className="font-bold text-slate-800 text-sm truncate">{seq.name}</div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                        seq.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {seq.status}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{seq.steps?.length || 0} steps</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="col-span-9 flex flex-col gap-6">
                    {activeSequence ? (
                        <>
                            {/* Sequence Header Settings */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                                <div className="flex-1 mr-4">
                                    <input 
                                        type="text" 
                                        value={activeSequence.name}
                                        onChange={(e) => setActiveSequence({...activeSequence, name: e.target.value})}
                                        className="text-xl font-bold text-slate-800 w-full border-none focus:ring-0 px-0 placeholder-slate-400"
                                        placeholder="Enter Sequence Name..."
                                    />
                                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                         <span>Total Steps: {activeSequence.steps.length}</span>
                                         <span>•</span>
                                         <span>Last Updated: {new Date(activeSequence.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleSaveSequence()}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const newStatus = activeSequence.status === 'active' ? 'draft' : 'active';
                                            setActiveSequence({...activeSequence, status: newStatus});
                                            // Auto-save status change could happen here too
                                        }}
                                        className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-white ${
                                            activeSequence.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-400 hover:bg-slate-500'
                                        }`}
                                    >
                                        {activeSequence.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        {activeSequence.status === 'active' ? 'Active' : 'Draft'}
                                    </button>
                                </div>
                            </div>

                            {/* Timeline / Canvas */}
                            <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200 overflow-y-auto p-8 relative">
                                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-200 -z-10 transform -translate-x-1/2"></div>
                                
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    {/* Start Node */}
                                    <div className="flex justify-center">
                                        <div className="bg-slate-200 text-slate-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                            Start
                                        </div>
                                    </div>

                                    {/* Steps */}
                                    {activeSequence.steps.map((step, index) => (
                                        <div key={step.id} className="relative group">
                                            {/* Connector Dot */}
                                            <ArrowDown className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                                            
                                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${
                                                            step.type === 'email' ? 'bg-blue-50 text-blue-600' :
                                                            step.type === 'wait' ? 'bg-amber-50 text-amber-600' : 
                                                            'bg-purple-50 text-purple-600'
                                                        }`}>
                                                            {step.type === 'email' && <Mail className="w-5 h-5" />}
                                                            {step.type === 'wait' && <Clock className="w-5 h-5" />}
                                                            {step.type === 'task' && <CheckCircle className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm">Step {index + 1}</div>
                                                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">{step.type}</div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeStep(step.id)}
                                                        className="text-slate-300 hover:text-rose-500 p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Step Config */}
                                                <div>
                                                    {step.type === 'email' && (
                                                        <div className="space-y-3">
                                                            <input 
                                                                type="text" 
                                                                placeholder="Email Subject"
                                                                value={step.config.subject || ''}
                                                                onChange={(e) => updateStep(step.id, { config: { ...step.config, subject: e.target.value }})}
                                                                className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:bg-white transition-colors"
                                                            />
                                                            <textarea 
                                                                placeholder="Email Body..."
                                                                rows="3"
                                                                value={step.config.body || ''}
                                                                onChange={(e) => updateStep(step.id, { config: { ...step.config, body: e.target.value }})}
                                                                className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 focus:bg-white transition-colors"
                                                            ></textarea>
                                                        </div>
                                                    )}

                                                    {step.type === 'wait' && (
                                                        <div className="flex items-center gap-3 bg-amber-50 px-4 py-3 rounded-lg">
                                                            <Clock className="w-4 h-4 text-amber-600" />
                                                            <span className="text-sm text-slate-700">Wait for</span>
                                                            <input 
                                                                type="number" 
                                                                min="1"
                                                                className="w-16 border border-amber-200 rounded px-2 py-1 text-center font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                                value={step.config.days || 1}
                                                                onChange={(e) => updateStep(step.id, { config: { ...step.config, days: parseInt(e.target.value) }})}
                                                            />
                                                            <span className="text-sm text-slate-700">days</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Step Buttons */}
                                    <div className="flex justify-center gap-3 pt-6 pb-12">
                                        <button 
                                            onClick={() => addStep('email')}
                                            className="px-4 py-2 bg-white border border-dashed border-slate-300 rounded-full text-slate-500 text-sm font-medium hover:border-corporate-teal hover:text-corporate-teal transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <Mail className="w-4 h-4" /> Add Email
                                        </button>
                                        <button 
                                            onClick={() => addStep('wait')}
                                            className="px-4 py-2 bg-white border border-dashed border-slate-300 rounded-full text-slate-500 text-sm font-medium hover:border-amber-500 hover:text-amber-500 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <Clock className="w-4 h-4" /> Add Wait
                                        </button>
                                        <button 
                                            onClick={() => addStep('task')}
                                            className="px-4 py-2 bg-white border border-dashed border-slate-300 rounded-full text-slate-500 text-sm font-medium hover:border-purple-500 hover:text-purple-500 transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Add Task
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                            <GitMerge className="w-12 h-12 mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-slate-600">Select or Create a Sequence</h3>
                            <p className="max-w-xs text-center mt-2">Choose a sequence from the left to edit, or start a new automated campaign.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SequenceManager;
