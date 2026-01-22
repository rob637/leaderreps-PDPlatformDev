import React, { useState, useEffect } from 'react';
import { 
  Play, Link as LinkIcon, Eye, Clock, Users, BarChart2, 
  Plus, Copy, CheckCircle, ExternalLink, MoreHorizontal,
  MousePointer, Video, FileText, Lock, TrendingUp, Target,
  Calendar, ArrowRight, Mail, Activity, AlertCircle, HelpCircle
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, orderBy, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebase';

const DemoManager = () => {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'activity' | 'analytics'
  const [demos, setDemos] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [prospectName, setProspectName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showAnalyticsDetail, setShowAnalyticsDetail] = useState(null);

  // Available System Demos
  const DEMO_LIBRARY = [
    {
      id: 'demo_tour_v1',
      title: 'Interactive Product Tour',
      type: 'interactive',
      duration: '5 min',
      thumbnail: 'bg-blue-100',
      views: 0,
      avgCompletion: '0%',
      status: 'active'
    },
    {
      id: 'demo_manager_walkthrough',
      title: 'Manager Dashboard Walkthrough',
      type: 'video',
      duration: '8 min',
      thumbnail: 'bg-purple-100',
      views: 0,
      avgCompletion: '0%',
      status: 'active'
    },
    {
      id: 'demo_admin_setup',
      title: 'Admin Setup & Configuration',
      type: 'video',
      duration: '12 min',
      thumbnail: 'bg-slate-100',
      views: 0,
      avgCompletion: '0%',
      status: 'draft'
    }
  ];

  useEffect(() => {
    setDemos(DEMO_LIBRARY);
    loadActivity();
  }, []);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'corporate_demo_links'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivity(data);
    } catch (e) {
      console.warn("Could not load activity (collection might not exist yet)", e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (demo) => {
    setSelectedDemo(demo);
    setGeneratedLink('');
    setProspectName('');
    setShowShareModal(true);
  };

  const generateLink = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    try {
      const newCtx = {
        demoId: selectedDemo.id,
        demoTitle: selectedDemo.title,
        prospect: prospectName,
        createdAt: new Date().toISOString(),
        views: 0,
        lastViewed: null,
        status: 'active',
        ownerId: user?.uid,
        ownerName: user?.displayName
      };
      
      const docRef = await addDoc(collection(db, 'corporate_demo_links'), newCtx);
      // Use current origin to support Dev/Test/Prod automatically
      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}/view/${selectedDemo.id}?ref=${docRef.id}`);
      loadActivity(); // Refresh list
    } catch (e) {
      console.error("Error generating link:", e);
      alert("Failed to generate link");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Copied to clipboard!");
    setShowShareModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy">Demo Experience Center</h1>
          <p className="text-slate-500 mt-1">Manage interactive tours and track prospect engagement</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => alert("Player configuration coming in V2")}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed hover:bg-white"
            >
                Configure Player
            </button>
            <button 
                onClick={() => alert("Custom asset upload coming in V2")} // Disable for now
                className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed shadow-none font-medium"
            >
                <Plus size={18} /> New Demo Asset
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
            { label: 'Total Views', value: activity.reduce((acc, curr) => acc + (curr.views || 0), 0), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg. Completion', value: '-', icon: BarChart2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Active Links', value: activity.filter(a => a.status === 'active').length || '0', icon: LinkIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Conversions', value: '-', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-corporate-navy">{stat.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                    <stat.icon size={20} />
                </div>
            </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6 flex gap-8">
          {['library', 'activity', 'analytics'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-medium capitalize relative ${activeTab === tab ? 'text-corporate-navy' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  {tab === 'library' ? 'Demo Library' : tab === 'activity' ? 'Shared Links' : 'Engagement Analytics'}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-corporate-teal"></div>}
              </button>
          ))}
      </div>

      {/* Content */}
      {activeTab === 'library' && (
        <div className="grid grid-cols-3 gap-6">
            {demos.map(demo => (
                <div key={demo.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition group">
                    <div className={`h-40 ${demo.thumbnail} flex items-center justify-center relative`}>
                        {demo.type === 'interactive' ? <MousePointer size={40} className="text-blue-400 opacity-50" /> : <Video size={40} className="text-purple-400 opacity-50" />}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                             <button className="bg-white text-corporate-navy px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50">
                                <Play size={12} /> Preview
                             </button>
                        </div>
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                            <Clock size={10} /> {demo.duration}
                        </span>
                    </div>
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-corporate-navy text-sm">{demo.title}</h3>
                                <p className="text-xs text-slate-500 capitalize">{demo.type} Demo</p>
                            </div>
                            <button className="text-slate-300 hover:text-slate-500"><MoreHorizontal size={16} /></button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                            <span className="flex items-center gap-1"><Eye size={12} /> {demo.views}</span>
                            <span className="flex items-center gap-1"><BarChart2 size={12} /> {demo.avgCompletion}</span>
                        </div>

                        <button 
                            onClick={() => handleShare(demo)}
                            className="w-full bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-white hover:border-corporate-teal hover:text-corporate-teal transition flex items-center justify-center gap-2"
                        >
                            <LinkIcon size={14} /> Create Magic Link
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {activeTab === 'activity' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* Instructions Banner */}
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
              <HelpCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 text-sm">How Demo Tracking Works</h4>
                <p className="text-xs text-blue-700 mt-1">
                  When you generate a "Magic Link" and share it with a prospect, we track when they view the demo.
                  View counts update in real-time and appear in the Engagement Analytics tab.
                </p>
              </div>
            </div>
            
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Recipient</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Demo Asset</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Views</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Last Viewed</th>
                        <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {activity.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-400 text-sm">No links generated yet. Go to Demo Library to create Magic Links.</td></tr>
                    ) : (
                        activity.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 text-xs text-slate-500">
                                  {new Date(row.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-medium text-sm text-corporate-navy">{row.prospect || 'Anonymous'}</div>
                                </td>
                                <td className="py-3 px-4 text-sm text-slate-600">{row.demoTitle}</td>
                                <td className="py-3 px-4 text-sm">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${
                                      row.views > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <Eye size={10} /> {row.views} views
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-500">
                                  {row.lastViewed ? new Date(row.lastViewed).toLocaleString() : 'Not yet viewed'}
                                </td>
                                <td className="py-3 px-4">
                                    <button 
                                      onClick={() => {
                                        const baseUrl = window.location.origin;
                                        const link = `${baseUrl}/view/${row.demoId}?ref=${row.id}`;
                                        navigator.clipboard.writeText(link);
                                        alert("Link copied!");
                                      }}
                                      className="text-xs text-corporate-teal hover:underline flex items-center gap-1"
                                    >
                                      <Copy size={12} /> Copy Link
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Views</span>
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-corporate-navy">
                {activity.reduce((acc, curr) => acc + (curr.views || 0), 0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Across all shared demos</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Engagement Rate</span>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-corporate-navy">
                {activity.length > 0 
                  ? Math.round((activity.filter(a => a.views > 0).length / activity.length) * 100) 
                  : 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Links with at least 1 view</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Links Shared</span>
                <LinkIcon className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-corporate-navy">
                {activity.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total magic links created</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Hot Leads</span>
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold text-corporate-navy">
                {activity.filter(a => a.views >= 2).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Viewed 2+ times (high interest)</p>
            </div>
          </div>

          {/* Engagement Breakdown by Demo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-corporate-navy flex items-center gap-2">
                <BarChart2 size={18} />
                Engagement by Demo Asset
              </h3>
              <span className="text-xs text-slate-400">Click a row for detailed analytics</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {demos.map(demo => {
                const demoActivity = activity.filter(a => a.demoId === demo.id);
                const totalViews = demoActivity.reduce((acc, curr) => acc + (curr.views || 0), 0);
                const uniqueViewers = demoActivity.filter(a => a.views > 0).length;
                const engagementRate = demoActivity.length > 0 
                  ? Math.round((uniqueViewers / demoActivity.length) * 100) 
                  : 0;
                
                return (
                  <div 
                    key={demo.id} 
                    className="p-4 hover:bg-slate-50 cursor-pointer transition"
                    onClick={() => setShowAnalyticsDetail(demo)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${demo.thumbnail}`}>
                          {demo.type === 'interactive' ? (
                            <MousePointer size={20} className="text-blue-500 opacity-60" />
                          ) : (
                            <Video size={20} className="text-purple-500 opacity-60" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-corporate-navy">{demo.title}</h4>
                          <p className="text-xs text-slate-500">{demo.type} • {demo.duration}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-xl font-bold text-corporate-navy">{demoActivity.length}</div>
                          <div className="text-[10px] text-slate-400 uppercase">Links</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">{totalViews}</div>
                          <div className="text-[10px] text-slate-400 uppercase">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{engagementRate}%</div>
                          <div className="text-[10px] text-slate-400 uppercase">Engaged</div>
                        </div>
                        <ArrowRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hot Leads Section */}
          {activity.filter(a => a.views >= 2).length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-6">
              <h3 className="font-bold text-orange-800 flex items-center gap-2 mb-4">
                <TrendingUp size={18} />
                🔥 Hot Leads - Ready for Follow-up
              </h3>
              <p className="text-sm text-orange-700 mb-4">
                These prospects have viewed your demos multiple times, indicating high interest. Consider reaching out!
              </p>
              <div className="grid grid-cols-2 gap-4">
                {activity.filter(a => a.views >= 2).map(lead => (
                  <div key={lead.id} className="bg-white rounded-lg border border-orange-200 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-corporate-navy">{lead.prospect || 'Anonymous Viewer'}</h4>
                      <p className="text-xs text-slate-500">{lead.demoTitle} • Viewed {lead.views}x</p>
                    </div>
                    <button 
                      className="bg-corporate-teal text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 flex items-center gap-1"
                      onClick={() => {
                        // Navigate to outreach or open email composer
                        alert(`Trigger follow-up for ${lead.prospect || 'this prospect'}.\n\nIn production, this would open the Outreach composer or add to a sequence.`);
                      }}
                    >
                      <Mail size={12} /> Follow Up
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
              <HelpCircle size={16} />
              Understanding Demo Analytics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-700">What is tracked:</p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Total view count per shared link</li>
                  <li>Last viewed timestamp</li>
                  <li>Engagement rate (links that got at least 1 view)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700">Coming soon:</p>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-slate-400">
                  <li>Time spent on each demo section</li>
                  <li>Drop-off points (where viewers leave)</li>
                  <li>Auto-trigger outreach when demo is viewed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Detail Modal */}
      {showAnalyticsDetail && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAnalyticsDetail(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`p-6 ${showAnalyticsDetail.thumbnail} bg-opacity-50`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-corporate-navy">{showAnalyticsDetail.title}</h2>
                  <p className="text-slate-600 text-sm">{showAnalyticsDetail.type} Demo • {showAnalyticsDetail.duration}</p>
                </div>
                <button 
                  onClick={() => setShowAnalyticsDetail(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <h3 className="font-bold text-corporate-navy mb-4">Viewers for this Demo</h3>
              
              {activity.filter(a => a.demoId === showAnalyticsDetail.id).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <LinkIcon size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No links shared yet for this demo</p>
                  <button 
                    onClick={() => {
                      setShowAnalyticsDetail(null);
                      handleShare(showAnalyticsDetail);
                    }}
                    className="mt-4 bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    Create First Magic Link
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.filter(a => a.demoId === showAnalyticsDetail.id).map(viewer => (
                    <div key={viewer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <h4 className="font-medium text-corporate-navy">{viewer.prospect || 'Anonymous'}</h4>
                        <p className="text-xs text-slate-500">
                          Shared: {new Date(viewer.createdAt).toLocaleDateString()} • 
                          Last viewed: {viewer.lastViewed ? new Date(viewer.lastViewed).toLocaleString() : 'Not yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          viewer.views >= 2 ? 'bg-orange-100 text-orange-700' :
                          viewer.views > 0 ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-400'
                        }`}>
                          {viewer.views} views
                        </span>
                        {viewer.views >= 2 && (
                          <span className="text-[10px] text-orange-600 font-bold">🔥 HOT</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-bold text-corporate-navy mb-1">Share Demo</h3>
                <p className="text-sm text-slate-500 mb-4">{selectedDemo?.title}</p>
                
                {!generatedLink ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prospect Name (Optional)</label>
                            <input 
                                value={prospectName}
                                onChange={e => setProspectName(e.target.value)}
                                placeholder="e.g. John Doe from Acme"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-corporate-teal outline-none" 
                            />
                        </div>
                        <button 
                            onClick={generateLink}
                            className="w-full bg-corporate-navy text-white py-2 rounded-lg font-bold hover:bg-corporate-navy/90"
                        >
                            Generate Magic Link
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                             <CheckCircle size={16} /> Link created successfully
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Magic Link</label>
                            <div className="flex gap-2">
                                <input readOnly value={generatedLink} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600" />
                                <button onClick={copyToClipboard} className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-2 rounded-lg"><Copy size={16} /></button>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={() => setShowShareModal(false)} className="mt-6 w-full text-slate-400 text-xs hover:text-slate-600 font-medium">Close</button>
            </div>
        </div>
      )}

    </div>
  );
};

export default DemoManager;
