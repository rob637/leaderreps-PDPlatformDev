import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, Users, FileText, MessageSquare, Calendar,
  Upload, Download, Eye, Share2, Lock, Unlock, Settings,
  Plus, RefreshCw, Clock, CheckCircle, AlertCircle, Link,
  Copy, Mail, Edit, Trash2, X, Folder, ChevronRight,
  DollarSign, Target, Activity
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Client Portal / Deal Room
 * 
 * Features:
 * - Shared deal rooms for each prospect
 * - Document sharing
 * - Activity timeline
 * - Proposal tracking
 * - Client messaging
 * - Access management
 */

const STATUS_COLORS = {
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
  closed: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Closed' },
  won: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Won' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', label: 'Lost' }
};

const ClientPortal = () => {
  const [loading, setLoading] = useState(true);
  const [dealRooms, setDealRooms] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [formData, setFormData] = useState({
    prospectId: '',
    name: '',
    accessCode: '',
    isPublic: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch deal rooms
      const roomsSnap = await getDocs(
        query(collection(db, 'corporate_deal_rooms'), orderBy('createdAt', 'desc'))
      );
      const roomsData = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDealRooms(roomsData);

      // Fetch prospects
      const prospectsSnap = await getDocs(collection(db, 'corporate_prospects'));
      const prospectsData = prospectsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProspects(prospectsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const prospect = prospects.find(p => p.id === formData.prospectId);
    
    try {
      await addDoc(collection(db, 'corporate_deal_rooms'), {
        ...formData,
        prospectName: prospect?.company || formData.name,
        status: 'active',
        documents: [],
        activities: [],
        messages: [],
        views: 0,
        lastViewed: null,
        createdAt: serverTimestamp()
      });
      setShowCreateRoom(false);
      setFormData({ prospectId: '', name: '', accessCode: '', isPublic: false });
      fetchData();
    } catch (err) {
      console.error("Error creating deal room:", err);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Delete this deal room?')) return;
    try {
      await deleteDoc(doc(db, 'corporate_deal_rooms', id));
      fetchData();
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  };

  const copyShareLink = (room) => {
    const link = `${window.location.origin}/portal/${room.id}?code=${room.accessCode}`;
    navigator.clipboard.writeText(link);
    alert('Share link copied to clipboard!');
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeRooms = dealRooms.filter(r => r.status === 'active');
  const totalValue = dealRooms.reduce((acc, r) => {
    const prospect = prospects.find(p => p.id === r.prospectId);
    return acc + (prospect?.value || 0);
  }, 0);

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
          <h1 className="text-3xl font-bold text-corporate-navy">Client Portal</h1>
          <p className="text-slate-500 mt-1">Create shared deal rooms for seamless client collaboration</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ 
              prospectId: '', 
              name: '', 
              accessCode: generateAccessCode(), 
              isPublic: false 
            });
            setShowCreateRoom(true);
          }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-teal-600"
        >
          <Plus size={18} /> Create Deal Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Folder className="text-blue-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{dealRooms.length}</div>
              <div className="text-sm text-slate-500">Total Rooms</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Activity className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{activeRooms.length}</div>
              <div className="text-sm text-slate-500">Active</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Eye className="text-purple-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {dealRooms.reduce((acc, r) => acc + (r.views || 0), 0)}
              </div>
              <div className="text-sm text-slate-500">Total Views</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-slate-500">Pipeline Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Rooms Grid */}
      {dealRooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Folder className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="font-medium text-slate-600 mb-1">No deal rooms yet</h3>
          <p className="text-sm text-slate-400">Create your first deal room to collaborate with clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {dealRooms.map(room => {
            const prospect = prospects.find(p => p.id === room.prospectId);
            const statusStyle = STATUS_COLORS[room.status] || STATUS_COLORS.pending;
            return (
              <div 
                key={room.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition group"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-corporate-navy/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-corporate-navy">
                          {(room.prospectName || room.name || 'D')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{room.prospectName || room.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>
                    <button 
                      className={`p-1.5 rounded ${room.isPublic ? 'text-green-500' : 'text-slate-300'}`}
                      title={room.isPublic ? 'Public link' : 'Private (code required)'}
                    >
                      {room.isPublic ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-2">
                        <FileText size={14} /> Documents
                      </span>
                      <span className="font-medium">{room.documents?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-2">
                        <Eye size={14} /> Views
                      </span>
                      <span className="font-medium">{room.views || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-2">
                        <DollarSign size={14} /> Deal Value
                      </span>
                      <span className="font-medium text-green-600">{formatCurrency(prospect?.value)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Last viewed: {room.lastViewed ? formatDate(room.lastViewed) : 'Never'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyShareLink(room)}
                      className="flex-1 py-2 text-xs bg-corporate-teal/10 text-corporate-teal rounded-lg hover:bg-corporate-teal/20 flex items-center justify-center gap-1"
                    >
                      <Share2 size={12} /> Share Link
                    </button>
                    <button 
                      onClick={() => setSelectedRoom(room)}
                      className="flex-1 py-2 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1"
                    >
                      <Eye size={12} /> View
                    </button>
                    <button 
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-2 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Access Code */}
                <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Access Code</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {room.accessCode}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(room.accessCode);
                        alert('Access code copied!');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-corporate-navy">Create Deal Room</h3>
                <button 
                  onClick={() => setShowCreateRoom(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Prospect</label>
                <select
                  value={formData.prospectId}
                  onChange={(e) => setFormData({ ...formData, prospectId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Select a prospect...</option>
                  {prospects.map(p => (
                    <option key={p.id} value={p.id}>{p.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Name (optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                  placeholder="Q1 Enterprise Deal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Access Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg font-mono"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessCode: generateAccessCode() })}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-medium text-slate-800">Public Access</div>
                  <div className="text-xs text-slate-500">Anyone with link can view (no code needed)</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                  className={`p-2 rounded-lg transition ${
                    formData.isPublic 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {formData.isPublic ? <Unlock size={20} /> : <Lock size={20} />}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-corporate-navy/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-corporate-navy">
                      {(selectedRoom.prospectName || 'D')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-corporate-navy">{selectedRoom.prospectName || selectedRoom.name}</h3>
                    <p className="text-sm text-slate-500">Deal Room</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-corporate-navy">{selectedRoom.documents?.length || 0}</div>
                  <div className="text-sm text-slate-500">Documents</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-corporate-navy">{selectedRoom.views || 0}</div>
                  <div className="text-sm text-slate-500">Views</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-corporate-navy">{selectedRoom.messages?.length || 0}</div>
                  <div className="text-sm text-slate-500">Messages</div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800">Shared Documents</h4>
                  <button className="text-sm text-corporate-teal hover:underline flex items-center gap-1">
                    <Upload size={14} /> Add Document
                  </button>
                </div>
                {selectedRoom.documents?.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center text-sm text-slate-400">
                    No documents shared yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedRoom.documents?.map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <FileText size={18} className="text-slate-400" />
                        <span className="flex-1">{doc.name}</span>
                        <button className="text-slate-400 hover:text-slate-600">
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Activity</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-700">Deal room created</p>
                      <p className="text-xs text-slate-400">{formatDate(selectedRoom.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Link */}
              <div className="mt-6 p-4 bg-corporate-teal/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-corporate-navy">Share this deal room</div>
                    <div className="text-xs text-slate-500">Access Code: {selectedRoom.accessCode}</div>
                  </div>
                  <button 
                    onClick={() => copyShareLink(selectedRoom)}
                    className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"
                  >
                    <Link size={16} /> Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
