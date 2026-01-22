import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Mail, Phone, Globe, Edit2, Trash2, 
  ExternalLink, Briefcase, ShieldCheck, Truck, Users, ArrowRight,
  Filter, MoreHorizontal, Send, X
} from 'lucide-react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';

const VendorPartnerManager = () => {
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'vendors'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    type: 'partner', // or 'vendor'
    status: 'active',
    notes: '',
    partnershipTier: 'referral' // For partners: referral, reseller, strategic
  });

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const loadItems = async () => {
    setLoading(true);
    try {
      // We share the 'corporate_prospects' collection but use 'category' field
      // If category is missing, we assume it's a prospect (so we exclude it here implicitly by querying FOR partner/vendor)
      const q = query(
        collection(db, 'corporate_prospects'), 
        where('category', '==', activeTab === 'partners' ? 'partner' : 'vendor')
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category: activeTab === 'partners' ? 'partner' : 'vendor', // Explicit category
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'corporate_prospects', editingItem.id), payload);
      } else {
        await addDoc(collection(db, 'corporate_prospects'), {
          ...payload,
          createdAt: new Date().toISOString(),
          status: 'new' // outreach status
        });
      }
      setShowModal(false);
      resetForm();
      loadItems();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save.");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      website: '',
      type: 'partner',
      status: 'active',
      notes: '',
      partnershipTier: 'referral'
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      company: item.company || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      type: item.category || 'partner',
      status: item.status || 'active',
      notes: item.notes || '',
      partnershipTier: item.partnershipTier || 'referral'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'corporate_prospects', id));
      loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const addToCampaign = async (item) => {
      // Logic to add to Outreach (same as Prospect list)
      try {
          await updateDoc(doc(db, 'corporate_prospects', item.id), {
              status: 'sequence_active',
              campaignId: 'c3', // Use partnership campaign for both partners and vendors for now
              nextTaskDate: new Date().toISOString(),
              nextTaskType: 'email'
          });
          alert(`Added ${item.company} to outreach sequence.`);
      } catch (e) {
          console.error(e);
      }
  };

  const filteredItems = items.filter(item => 
      (item.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy">Network Management</h1>
          <p className="text-slate-500 mt-1">Manage strategic partners and vendor relationships</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-corporate-teal/90 shadow-sm font-medium"
        >
          <Plus size={18} />
          Add {activeTab === 'partners' ? 'Partner' : 'Vendor'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
          <button 
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === 'partners' ? 'bg-white text-corporate-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={16} /> Strategic Partners
          </button>
          <button 
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${activeTab === 'vendors' ? 'bg-white text-corporate-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Truck size={16} /> Vendors & Suppliers
          </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 items-center justify-between border-b border-slate-200 rounded-t-xl border flex gap-4">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-corporate-teal"
            />
        </div>
        <div className="flex items-center gap-2">
            <button className="text-slate-500 hover:text-corporate-navy border border-slate-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Filter size={16} /> Filter
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
        <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company / Entity</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    {activeTab === 'partners' && <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tier</th>}
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
                ) : filteredItems.length === 0 ? (
                    <tr><td colSpan="5" className="p-12 text-center text-slate-400">No {activeTab} found. Add one to get started.</td></tr>
                ) : (
                    filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition group">
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === 'partners' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-corporate-navy">{item.company}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {item.website && (
                                                <a href={item.website} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-corporate-teal flex items-center gap-1">
                                                    <Globe size={10} /> Website
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                <div className="text-sm font-medium text-slate-700">{item.name}</div>
                                <div className="text-xs text-slate-400">{item.email}</div>
                            </td>
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                    item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {item.status || 'Active'}
                                </span>
                            </td>
                            {activeTab === 'partners' && (
                                <td className="py-3 px-4">
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-200">
                                        {item.partnershipTier || 'Referral'}
                                    </span>
                                </td>
                            )}
                            <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => addToCampaign(item)}
                                        className="p-1.5 text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded" title="Add to Outreach Sequence"
                                    >
                                        <Send size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-corporate-navy">
                        {editingItem ? 'Edit' : 'Add New'} {activeTab === 'partners' ? 'Partner' : 'Vendor'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name</label>
                            <input 
                                required
                                value={formData.company}
                                onChange={e => setFormData({...formData, company: e.target.value})}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-corporate-teal outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Name</label>
                            <input 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-corporate-teal outline-none" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-corporate-teal outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website</label>
                            <input 
                                value={formData.website}
                                onChange={e => setFormData({...formData, website: e.target.value})}
                                placeholder="https://"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-corporate-teal outline-none" 
                            />
                        </div>
                    </div>

                    {activeTab === 'partners' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Partnership Tier</label>
                            <select 
                                value={formData.partnershipTier}
                                onChange={e => setFormData({...formData, partnershipTier: e.target.value})}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="referral">Referral Partner</option>
                                <option value="reseller">Reseller</option>
                                <option value="strategic">Strategic Alliance</option>
                                <option value="tech">Technology Integrator</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                        <textarea 
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-24 resize-none outline-none" 
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg">
                            Cancel
                        </button>
                        <button type="submit" className="bg-corporate-navy text-white px-6 py-2 rounded-lg font-bold hover:bg-corporate-navy/90">
                            Save {activeTab === 'partners' ? 'Partner' : 'Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default VendorPartnerManager;
