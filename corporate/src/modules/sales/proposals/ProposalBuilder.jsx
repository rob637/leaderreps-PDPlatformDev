import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, DollarSign, Calculator, Send, Download, 
  CheckCircle, Clock, AlertCircle, TrendingUp, Briefcase,
  ExternalLink, Eye, PenTool, Copy, Sparkles, RefreshCw,
  HelpCircle, Mail, X
} from 'lucide-react';
import { collection, addDoc, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebase';

/**
 * ProposalBuilder - Sales Proposal & ROI Calculator
 * 
 * HOW TO USE:
 * 1. Click "New Proposal" to create a new proposal
 * 2. Configure engagement type, seats, and pricing
 * 3. Generate proposal to save as draft
 * 4. Use "Preview PDF" to see the proposal document
 * 5. Send for e-signature when ready
 * 
 * PDF GENERATION:
 * - Uses browser print functionality for PDF export
 * - Styled for professional A4 output
 * 
 * E-SIGNATURE:
 * - Generates a unique signing link per proposal
 * - Tracks signature status in Firestore
 */

const ProposalBuilder = () => {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'builder'
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(null);
  const [showSignatureModal, setShowSignatureModal] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const pdfRef = useRef(null);

  // Builder State
  const [proposalData, setProposalData] = useState({
    clientName: '',
    projectType: 'enterprise_pilot', // 'single_cohort', 'enterprise_pilot', 'full_rollout'
    seats: 20,
    pricePerSeat: 495,
    discount: 0,
    customServices: 5000,
    status: 'draft',
    notes: ''
  });

  const PRICING_TIERS = {
    'single_cohort': { label: 'Single Cohort (8 Weeks)', basePrice: 495, minSeats: 5 },
    'enterprise_pilot': { label: 'Enterprise Pilot (3 Cohorts)', basePrice: 395, minSeats: 20 },
    'full_rollout': { label: 'Annual License (Unlimited)', basePrice: 250, minSeats: 100 },
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'corporate_proposals'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProposals(data);
    } catch (e) {
      console.error("Error loading proposals:", e);
      // Fallback empty state if collection doesn't exist yet
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
      const base = proposalData.seats * proposalData.pricePerSeat;
      const subtotal = base + parseInt(proposalData.customServices || 0);
      const discountAmount = (subtotal * (proposalData.discount / 100));
      return subtotal - discountAmount;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      const totalAmount = calculateTotal();
      const newProposal = {
          clientName: proposalData.clientName,
          amount: totalAmount,
          status: 'draft',
          createdAt: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          items: `${proposalData.seats} Seats, ${PRICING_TIERS[proposalData.projectType].label}`,
          data: proposalData, // Store full raw data for editing later
          ownerId: user?.uid,
          ownerName: user?.displayName
      };

      const docRef = await addDoc(collection(db, 'corporate_proposals'), newProposal);
      
      // Update local state with real ID
      setProposals([{ id: docRef.id, ...newProposal }, ...proposals]);
      setShowBuilder(false);
      resetForm();
    } catch (e) {
      console.error("Error saving proposal:", e);
      alert("Failed to save proposal. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProposalData({
      clientName: '',
      projectType: 'pilot',
      seats: 5,
      pricePerSeat: 495,
      customServices: 0,
      discount: 0,
      notes: ''
    });
  };

  // Generate PDF (uses browser print)
  const handleDownloadPDF = (proposal) => {
    setShowPDFPreview(proposal);
    // Allow DOM to render, then trigger print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Generate e-signature link
  const generateSignatureLink = async (proposal) => {
    try {
      const baseUrl = window.location.origin;
      const signToken = `${proposal.id}-${Date.now().toString(36)}`;
      const link = `${baseUrl}/sign/${signToken}`;
      
      // Update proposal with signature info
      await updateDoc(doc(db, 'corporate_proposals', proposal.id), {
        signatureToken: signToken,
        signatureStatus: 'pending',
        signatureSentAt: new Date().toISOString()
      });

      // Update local state
      setProposals(proposals.map(p => 
        p.id === proposal.id 
          ? { ...p, signatureToken: signToken, signatureStatus: 'pending', signatureSentAt: new Date().toISOString() }
          : p
      ));

      setSignatureUrl(link);
      setShowSignatureModal(proposal);
    } catch (err) {
      console.error("Error generating signature link:", err);
      alert("Failed to generate signature link");
    }
  };

  // Mark proposal as sent
  const markAsSent = async (proposal) => {
    try {
      await updateDoc(doc(db, 'corporate_proposals', proposal.id), {
        status: 'sent',
        sentAt: new Date().toISOString()
      });
      setProposals(proposals.map(p => 
        p.id === proposal.id ? { ...p, status: 'sent', sentAt: new Date().toISOString() } : p
      ));
    } catch (err) {
      console.error("Error updating proposal:", err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy">Proposals & ROI</h1>
          <p className="text-slate-500 mt-1">Generate contracts and calculate detailed ROI for prospects.</p>
        </div>
        <button 
            onClick={() => setShowBuilder(true)}
            className="bg-corporate-teal text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-corporate-teal/90 shadow-sm font-medium"
        >
            <Plus size={18} /> New Proposal
        </button>
      </div>

      {!showBuilder ? (
          <div className="grid grid-cols-1 gap-6">
              {/* Pipeline View */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-200">
                      <h3 className="font-bold text-lg text-corporate-navy">Recent Proposals</h3>
                  </div>
                  <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Client</th>
                              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Value</th>
                              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Details</th>
                              <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase">Status</th>
                              <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 uppercase">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {proposals.map(p => (
                              <tr key={p.id} className="hover:bg-slate-50 group">
                                  <td className="py-4 px-6 font-medium text-corporate-navy">{p.clientName}</td>
                                  <td className="py-4 px-6 font-mono text-slate-700">${p.amount.toLocaleString()}</td>
                                  <td className="py-4 px-6 text-sm text-slate-500">{p.items}</td>
                                  <td className="py-4 px-6">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                        ${p.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                          p.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}
                                      `}>
                                          {p.status}
                                      </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => setShowPDFPreview(p)}
                                          className="text-corporate-teal hover:bg-teal-50 px-2 py-1 rounded text-sm font-medium flex items-center gap-1"
                                        >
                                          <Eye size={14} /> Preview
                                        </button>
                                        <button 
                                          onClick={() => handleDownloadPDF(p)}
                                          className="text-slate-500 hover:bg-slate-100 px-2 py-1 rounded text-sm font-medium flex items-center gap-1"
                                        >
                                          <Download size={14} /> PDF
                                        </button>
                                        {p.status === 'draft' && (
                                          <button 
                                            onClick={() => generateSignatureLink(p)}
                                            className="bg-corporate-teal text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1 hover:bg-teal-600"
                                          >
                                            <PenTool size={14} /> Send for Signature
                                          </button>
                                        )}
                                        {p.signatureStatus === 'pending' && (
                                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                            <Clock size={12} /> Awaiting Signature
                                          </span>
                                        )}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-3 gap-8">
              {/* Builder Form */}
              <div className="col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-corporate-navy mb-6">Proposal Configuration</h2>
                  
                  <div className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Client Name</label>
                          <input 
                              value={proposalData.clientName}
                              onChange={e => setProposalData({...proposalData, clientName: e.target.value})}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2" placeholder="e.g. Wayne Enterprises" 
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Engagement Type</label>
                              <select 
                                  value={proposalData.projectType}
                                  onChange={e => setProposalData({...proposalData, projectType: e.target.value, pricePerSeat: PRICING_TIERS[e.target.value].basePrice})}
                                  className="w-full border border-slate-200 rounded-lg px-4 py-2"
                              >
                                  {Object.entries(PRICING_TIERS).map(([key, tier]) => (
                                      <option key={key} value={key}>{tier.label}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Seats / Licenses</label>
                              <input 
                                  type="number"
                                  value={proposalData.seats}
                                  onChange={e => setProposalData({...proposalData, seats: parseInt(e.target.value)})}
                                  className="w-full border border-slate-200 rounded-lg px-4 py-2"
                              />
                          </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <h4 className="font-bold text-sm text-slate-600 mb-3 flex items-center gap-2">
                              <DollarSign size={16} /> Commercial Terms
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price / Seat</label>
                                  <div className="relative">
                                      <span className="absolute left-3 top-2 text-slate-400">$</span>
                                      <input 
                                          type="number"
                                          value={proposalData.pricePerSeat}
                                          onChange={e => setProposalData({...proposalData, pricePerSeat: parseInt(e.target.value)})}
                                          className="w-full border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">One-time Services</label>
                                  <div className="relative">
                                      <span className="absolute left-3 top-2 text-slate-400">$</span>
                                      <input 
                                          type="number"
                                          value={proposalData.customServices}
                                          onChange={e => setProposalData({...proposalData, customServices: parseInt(e.target.value)})}
                                          className="w-full border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-sm"
                                      />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Discount %</label>
                                  <input 
                                      type="number"
                                      value={proposalData.discount}
                                      onChange={e => setProposalData({...proposalData, discount: parseInt(e.target.value || 0)})}
                                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Summary Card */}
              <div className="col-span-1">
                  <div className="bg-corporate-navy text-white p-6 rounded-xl shadow-lg sticky top-6">
                      <h3 className="text-xl font-bold mb-6">Investment Summary</h3>
                      
                      <div className="space-y-4 mb-8">
                          <div className="flex justify-between text-sm text-blue-100">
                              <span>Plan Licenses ({proposalData.seats})</span>
                              <span>${(proposalData.seats * proposalData.pricePerSeat).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-blue-100">
                              <span>Implementation</span>
                              <span>${(proposalData.customServices || 0).toLocaleString()}</span>
                          </div>
                          {proposalData.discount > 0 && (
                              <div className="flex justify-between text-sm text-green-300 font-medium">
                                  <span>Partner Discount ({proposalData.discount}%)</span>
                                  <span>-${((calculateTotal() / (1 - proposalData.discount/100)) - calculateTotal()).toLocaleString()}</span>
                              </div>
                          )}
                          <div className="border-t border-white/20 pt-4 flex justify-between font-bold text-2xl">
                              <span>Total</span>
                              <span>${calculateTotal().toLocaleString()}</span>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <button 
                            onClick={handleSave}
                            className="w-full bg-corporate-teal text-white py-3 rounded-lg font-bold hover:bg-corporate-teal/90"
                          >
                              Generate Proposal
                          </button>
                          <button 
                            onClick={() => setShowBuilder(false)}
                            className="w-full bg-transparent border border-white/30 text-white py-3 rounded-lg font-medium hover:bg-white/10"
                          >
                              Cancel
                          </button>
                      </div>

                      {/* ROI Calculator Teaser */}
                      <div className="mt-8 bg-white/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-sm font-bold text-green-300 mb-2">
                              <TrendingUp size={16} /> ROI Projection
                          </div>
                          <p className="text-xs text-blue-100 mb-2">Based on avg. retention improvement of 12%:</p>
                          <div className="text-lg font-bold text-white">
                              ${(calculateTotal() * 4.2).toLocaleString()} <span className="text-xs font-normal opacity-70">est. return</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4" onClick={() => setShowPDFPreview(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-corporate-navy flex items-center gap-2">
                <FileText size={18} />
                Proposal Preview - {showPDFPreview.clientName}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="bg-corporate-teal text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-teal-600"
                >
                  <Download size={14} /> Download PDF
                </button>
                <button 
                  onClick={() => setShowPDFPreview(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* PDF Content (printable) */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div ref={pdfRef} className="bg-white max-w-[800px] mx-auto shadow-lg print:shadow-none" style={{ aspectRatio: '8.5/11', padding: '48px' }}>
                {/* Letterhead */}
                <div className="flex justify-between items-start mb-12 border-b border-slate-200 pb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-corporate-navy">LeaderReps</h1>
                    <p className="text-sm text-slate-500">Leadership Development Platform</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>Proposal #{showPDFPreview.id?.slice(0, 8).toUpperCase()}</p>
                    <p>{new Date(showPDFPreview.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-corporate-navy mb-2">Prepared For:</h2>
                  <p className="text-xl font-bold text-slate-800">{showPDFPreview.clientName}</p>
                </div>

                {/* Executive Summary */}
                <div className="mb-8">
                  <h3 className="text-md font-bold text-corporate-navy mb-3 uppercase tracking-wide">Executive Summary</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This proposal outlines the LeaderReps Leadership Development Program designed to enhance 
                    leadership capabilities, improve retention, and drive organizational performance at {showPDFPreview.clientName}.
                  </p>
                </div>

                {/* Investment Details */}
                <div className="mb-8">
                  <h3 className="text-md font-bold text-corporate-navy mb-3 uppercase tracking-wide">Investment Details</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-500">Description</th>
                        <th className="text-right py-2 text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-3">{showPDFPreview.items}</td>
                        <td className="py-3 text-right font-mono">${showPDFPreview.amount?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="font-bold text-lg">
                        <td className="pt-4">Total Investment</td>
                        <td className="pt-4 text-right font-mono text-corporate-navy">${showPDFPreview.amount?.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ROI Projection */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <TrendingUp size={16} /> Projected ROI
                  </h4>
                  <p className="text-sm text-green-700">
                    Based on industry averages for leadership development programs, this investment is projected 
                    to deliver <strong>${(showPDFPreview.amount * 4.2).toLocaleString()}</strong> in value through 
                    improved retention, productivity, and engagement.
                  </p>
                </div>

                {/* Signature Block */}
                <div className="mt-auto pt-8 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs text-slate-400 mb-8">Client Signature</p>
                      <div className="border-b border-slate-300 h-8"></div>
                      <p className="text-sm text-slate-600 mt-2">{showPDFPreview.clientName}</p>
                      <p className="text-xs text-slate-400">Date: _______________</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-8">LeaderReps Representative</p>
                      <div className="border-b border-slate-300 h-8"></div>
                      <p className="text-sm text-slate-600 mt-2">{showPDFPreview.ownerName || 'Account Executive'}</p>
                      <p className="text-xs text-slate-400">Date: _______________</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center z-50 p-4" onClick={() => setShowSignatureModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-corporate-navy to-corporate-teal">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PenTool size={20} />
                E-Signature Ready
              </h3>
              <p className="text-blue-100 text-sm mt-1">Send this link to your client for electronic signature</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Signature Link */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Signature Link
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    readOnly
                    value={signatureUrl}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(signatureUrl);
                      alert('Link copied!');
                    }}
                    className="bg-corporate-teal text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-600 flex items-center gap-1"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              </div>

              {/* Email Draft */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <Mail size={14} /> Suggested Email
                </h4>
                <div className="text-sm text-slate-600 space-y-2">
                  <p><strong>Subject:</strong> Your LeaderReps Proposal is Ready for Review</p>
                  <p className="text-xs bg-white p-3 rounded border border-slate-200 leading-relaxed">
                    Hi,<br/><br/>
                    Thank you for your interest in LeaderReps! Attached is your customized proposal 
                    for {showSignatureModal.clientName}.<br/><br/>
                    To proceed, please review and sign the proposal using the secure link below:<br/>
                    <span className="text-corporate-teal font-medium">{signatureUrl}</span><br/><br/>
                    Feel free to reach out with any questions.<br/><br/>
                    Best regards
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    markAsSent(showSignatureModal);
                    setShowSignatureModal(null);
                  }}
                  className="flex-1 bg-corporate-teal text-white py-2.5 rounded-lg font-bold hover:bg-teal-600"
                >
                  Mark as Sent
                </button>
                <button 
                  onClick={() => setShowSignatureModal(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              {/* Instructions */}
              <div className="text-xs text-slate-400 flex items-start gap-2">
                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  When the client signs via this link, the proposal status will automatically 
                  update to "Accepted" and you'll receive a notification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalBuilder;
