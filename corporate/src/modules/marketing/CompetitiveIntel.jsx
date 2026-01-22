import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Search, Edit, Trash2, Eye, Target,
  Building2, Users, TrendingUp, TrendingDown, ExternalLink,
  Star, StarOff, RefreshCw, Filter, ChevronRight, X,
  DollarSign, Briefcase, Globe, Award, AlertTriangle,
  CheckCircle, XCircle, Minus, Save, BarChart2, Zap
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Competitive Intelligence Hub
 * 
 * Features:
 * - Competitor profiles
 * - Feature comparison matrix
 * - Win/loss tracking vs competitors
 * - Pricing intelligence
 * - Battlecard generation
 * - Strength/weakness analysis
 */

const THREAT_LEVELS = {
  high: { color: 'bg-red-100 text-red-700', label: 'High Threat' },
  medium: { color: 'bg-amber-100 text-amber-700', label: 'Medium' },
  low: { color: 'bg-green-100 text-green-700', label: 'Low Threat' }
};

const FEATURES = [
  'Core Platform',
  'Mobile App',
  'Integrations',
  'Analytics',
  'Automation',
  'Support',
  'Pricing',
  'Ease of Use',
  'Customization',
  'Security'
];

const DEFAULT_COMPETITORS = [
  {
    id: 'default-1',
    name: 'CompetitorCo',
    logo: 'C',
    website: 'https://competitor.co',
    threatLevel: 'high',
    description: 'Primary competitor in the enterprise segment',
    strengths: ['Strong brand recognition', 'Large customer base', 'Feature-rich platform'],
    weaknesses: ['Expensive pricing', 'Complex implementation', 'Poor customer support'],
    pricing: '$500-2000/mo',
    featureScores: { 'Core Platform': 4, 'Mobile App': 3, 'Integrations': 5, 'Analytics': 4 },
    winRate: 45,
    lossRate: 55,
    notes: 'Main competitor for enterprise deals'
  },
  {
    id: 'default-2',
    name: 'StartupRival',
    logo: 'S',
    website: 'https://startuprival.io',
    threatLevel: 'medium',
    description: 'Fast-growing startup targeting SMB market',
    strengths: ['Modern UI', 'Affordable pricing', 'Quick setup'],
    weaknesses: ['Limited features', 'New to market', 'Small team'],
    pricing: '$99-499/mo',
    featureScores: { 'Core Platform': 3, 'Mobile App': 5, 'Ease of Use': 5, 'Pricing': 5 },
    winRate: 65,
    lossRate: 35,
    notes: 'Growing quickly in the SMB segment'
  }
];

const CompetitiveIntel = () => {
  const [loading, setLoading] = useState(true);
  const [competitors, setCompetitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    threatLevel: 'medium',
    strengths: ['', '', ''],
    weaknesses: ['', '', ''],
    pricing: '',
    featureScores: {},
    notes: ''
  });

  useEffect(() => {
    fetchCompetitors();
  }, []);

  const fetchCompetitors = async () => {
    setLoading(true);
    try {
      const competitorsSnap = await getDocs(
        query(collection(db, 'corporate_competitors'), orderBy('createdAt', 'desc'))
      );
      let competitorsData = competitorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (competitorsData.length === 0) {
        competitorsData = DEFAULT_COMPETITORS;
      }
      
      setCompetitors(competitorsData);
    } catch (err) {
      console.error("Error fetching competitors:", err);
      setCompetitors(DEFAULT_COMPETITORS);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      strengths: formData.strengths.filter(s => s.trim()),
      weaknesses: formData.weaknesses.filter(w => w.trim()),
      logo: formData.name[0]?.toUpperCase() || 'C',
      winRate: 50,
      lossRate: 50
    };

    try {
      if (editingCompetitor && !editingCompetitor.startsWith('default-')) {
        await updateDoc(doc(db, 'corporate_competitors', editingCompetitor), {
          ...cleanedData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'corporate_competitors'), {
          ...cleanedData,
          createdAt: serverTimestamp()
        });
      }
      setShowEditor(false);
      setEditingCompetitor(null);
      resetForm();
      fetchCompetitors();
    } catch (err) {
      console.error("Error saving competitor:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this competitor?')) return;
    if (id.startsWith('default-')) {
      setCompetitors(competitors.filter(c => c.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'corporate_competitors', id));
      fetchCompetitors();
    } catch (err) {
      console.error("Error deleting competitor:", err);
    }
  };

  const handleEdit = (competitor) => {
    setFormData({
      name: competitor.name,
      website: competitor.website || '',
      description: competitor.description || '',
      threatLevel: competitor.threatLevel || 'medium',
      strengths: [...(competitor.strengths || []), '', ''].slice(0, 3),
      weaknesses: [...(competitor.weaknesses || []), '', ''].slice(0, 3),
      pricing: competitor.pricing || '',
      featureScores: competitor.featureScores || {},
      notes: competitor.notes || ''
    });
    setEditingCompetitor(competitor.id);
    setShowEditor(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      description: '',
      threatLevel: 'medium',
      strengths: ['', '', ''],
      weaknesses: ['', '', ''],
      pricing: '',
      featureScores: {},
      notes: ''
    });
  };

  const updateStrength = (index, value) => {
    const newStrengths = [...formData.strengths];
    newStrengths[index] = value;
    setFormData({ ...formData, strengths: newStrengths });
  };

  const updateWeakness = (index, value) => {
    const newWeaknesses = [...formData.weaknesses];
    newWeaknesses[index] = value;
    setFormData({ ...formData, weaknesses: newWeaknesses });
  };

  const filteredCompetitors = competitors.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highThreats = competitors.filter(c => c.threatLevel === 'high');
  const avgWinRate = competitors.length > 0 
    ? Math.round(competitors.reduce((acc, c) => acc + (c.winRate || 50), 0) / competitors.length)
    : 0;

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
          <h1 className="text-3xl font-bold text-corporate-navy">Competitive Intelligence</h1>
          <p className="text-slate-500 mt-1">Track competitors, analyze strengths, and win more deals</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setEditingCompetitor(null);
            setShowEditor(true);
          }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={18} /> Add Competitor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{competitors.length}</div>
              <div className="text-sm text-slate-500">Competitors</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{highThreats.length}</div>
              <div className="text-sm text-slate-500">High Threats</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{avgWinRate}%</div>
              <div className="text-sm text-slate-500">Avg Win Rate</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Zap className="text-purple-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{FEATURES.length}</div>
              <div className="text-sm text-slate-500">Features Tracked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search competitors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Competitors Grid */}
      {filteredCompetitors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-medium text-slate-600 mb-1">No competitors tracked</h3>
          <p className="text-sm text-slate-400">Add your first competitor to start building intelligence</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredCompetitors.map(competitor => {
            const threatStyle = THREAT_LEVELS[competitor.threatLevel] || THREAT_LEVELS.medium;
            return (
              <div 
                key={competitor.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-600">{competitor.logo || competitor.name[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{competitor.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${threatStyle.color}`}>
                          {threatStyle.label}
                        </span>
                      </div>
                    </div>
                    {competitor.website && (
                      <a 
                        href={competitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-corporate-teal"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{competitor.description}</p>

                  {/* Win Rate Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600">Win {competitor.winRate || 50}%</span>
                      <span className="text-red-600">Loss {competitor.lossRate || 50}%</span>
                    </div>
                    <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${competitor.winRate || 50}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Points */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-400 uppercase mb-1">Strengths</div>
                      <ul className="space-y-1">
                        {competitor.strengths?.slice(0, 2).map((s, i) => (
                          <li key={i} className="flex items-center gap-1 text-slate-600">
                            <CheckCircle size={12} className="text-green-500" />
                            <span className="truncate">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase mb-1">Weaknesses</div>
                      <ul className="space-y-1">
                        {competitor.weaknesses?.slice(0, 2).map((w, i) => (
                          <li key={i} className="flex items-center gap-1 text-slate-600">
                            <XCircle size={12} className="text-red-500" />
                            <span className="truncate">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    <DollarSign size={14} className="inline" /> {competitor.pricing || 'Unknown'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => setSelectedCompetitor(competitor)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => handleEdit(competitor)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(competitor.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Matrix */}
      {competitors.length > 0 && (
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-bold text-corporate-navy flex items-center gap-2">
              <BarChart2 size={18} />
              Feature Comparison Matrix
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 text-sm font-medium text-slate-500">Feature</th>
                  <th className="text-center p-4 text-sm font-medium text-corporate-teal">Us</th>
                  {filteredCompetitors.slice(0, 4).map(c => (
                    <th key={c.id} className="text-center p-4 text-sm font-medium text-slate-600">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.slice(0, 6).map(feature => (
                  <tr key={feature} className="border-b border-slate-100">
                    <td className="p-4 text-sm text-slate-700">{feature}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${i <= 4 ? 'bg-corporate-teal' : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                    </td>
                    {filteredCompetitors.slice(0, 4).map(c => {
                      const score = c.featureScores?.[feature] || 3;
                      return (
                        <td key={c.id} className="p-4 text-center">
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full ${i <= score ? 'bg-slate-400' : 'bg-slate-200'}`}
                              />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-corporate-navy">
                  {editingCompetitor ? 'Edit Competitor' : 'Add Competitor'}
                </h3>
                <button 
                  onClick={() => {
                    setShowEditor(false);
                    setEditingCompetitor(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Threat Level</label>
                  <select
                    value={formData.threatLevel}
                    onChange={(e) => setFormData({ ...formData, threatLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pricing</label>
                  <input
                    type="text"
                    value={formData.pricing}
                    onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                    placeholder="$X-Y/mo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Strengths</label>
                <div className="space-y-2">
                  {formData.strengths.map((s, i) => (
                    <input
                      key={i}
                      type="text"
                      value={s}
                      onChange={(e) => updateStrength(i, e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                      placeholder={`Strength ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weaknesses</label>
                <div className="space-y-2">
                  {formData.weaknesses.map((w, i) => (
                    <input
                      key={i}
                      type="text"
                      value={w}
                      onChange={(e) => updateWeakness(i, e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                      placeholder={`Weakness ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg h-20 resize-none"
                  placeholder="Additional notes, battle tactics, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditor(false);
                    setEditingCompetitor(null);
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
                  {editingCompetitor ? 'Update' : 'Add Competitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Competitor Detail Modal */}
      {selectedCompetitor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-600">{selectedCompetitor.logo}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-corporate-navy">{selectedCompetitor.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${THREAT_LEVELS[selectedCompetitor.threatLevel]?.color}`}>
                      {THREAT_LEVELS[selectedCompetitor.threatLevel]?.label}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCompetitor(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-slate-600">{selectedCompetitor.description}</p>

              {/* Win Rate */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-green-600">Win Rate: {selectedCompetitor.winRate || 50}%</span>
                  <span className="font-medium text-red-600">Loss Rate: {selectedCompetitor.lossRate || 50}%</span>
                </div>
                <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${selectedCompetitor.winRate || 50}%` }}
                  />
                </div>
              </div>

              {/* SWOT-like grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {selectedCompetitor.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <XCircle size={16} /> Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {selectedCompetitor.weaknesses?.map((w, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pricing & Website */}
              <div className="flex gap-4">
                <div className="flex-1 bg-slate-50 rounded-lg p-4">
                  <div className="text-xs text-slate-400 uppercase mb-1">Pricing</div>
                  <div className="font-semibold text-slate-800">{selectedCompetitor.pricing || 'Unknown'}</div>
                </div>
                {selectedCompetitor.website && (
                  <a 
                    href={selectedCompetitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition"
                  >
                    <div className="text-xs text-slate-400 uppercase mb-1">Website</div>
                    <div className="font-semibold text-corporate-teal flex items-center gap-1">
                      Visit Site <ExternalLink size={14} />
                    </div>
                  </a>
                )}
              </div>

              {selectedCompetitor.notes && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Notes</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">{selectedCompetitor.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitiveIntel;
