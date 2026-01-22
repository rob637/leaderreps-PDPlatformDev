import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, XCircle, Server, Mail, RefreshCw,
  ExternalLink, ChevronRight, ChevronDown, Copy, Inbox, FileText, Ban, Trash2, Plus, Edit2,
  Shield, Activity, Search as SearchIcon, Box
} from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../../firebase';

const EmailControl = () => {
    const [activeTab, setActiveTab] = useState('inbox'); // inbox, templates, health, unsubscribes
    const [loading, setLoading] = useState(false);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-corporate-navy">Email Command Center</h1>
                    <p className="text-slate-500 mt-1">Manage templates, monitor health, and track deliverability.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'inbox' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Inbox size={18} /> Activity Log
                    </button>
                    <button 
                        onClick={() => setActiveTab('templates')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'templates' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText size={18} /> Templates
                    </button>
                    <button 
                        onClick={() => setActiveTab('health')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'health' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <ShieldCheck size={18} /> Health & DNS
                    </button>
                    <button 
                        onClick={() => setActiveTab('unsubscribes')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'unsubscribes' ? 'border-corporate-teal text-corporate-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Ban size={18} /> Unsubscribes
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'inbox' && <ActivityLog />}
                    {activeTab === 'templates' && <TemplateManager />}
                    {activeTab === 'health' && <DeliverabilityCheck />}
                    {activeTab === 'unsubscribes' && <UnsubscribeManager />}
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const ActivityLog = () => {
    // In a real app with high volume, this would query a dedicated 'email_logs' collection.
    // For now, we will aggregate from prospect history or use a mock if empty.
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivity();
    }, []);

    const loadActivity = async () => {
        setLoading(true);
        try {
            // Mocking for immediate UI feedback as backend logging isn't fully set up to a collection yet
            // In future: const q = query(collection(db, 'email_logs'), orderBy('sentAt', 'desc'), limit(50));
            // For now, let's fetch recent updated prospects and show their last action
            const q = query(collection(db, 'corporate_prospects'), orderBy('updatedAt', 'desc'), limit(20));
            const snapshot = await getDocs(q);
            const items = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.history && data.history.length > 0) {
                    // Get recent history items
                    data.history.reverse().forEach(evt => {
                        items.push({
                            id: Math.random(), // transient ID
                            recipient: data.email,
                            name: data.name,
                            company: data.company,
                            subject: "Sequence Step", // Details might be missing in history string
                            status: 'sent',
                            timestamp: evt.date,
                            details: evt.action
                        });
                    });
                }
            });
            
            // Sort merged histories
            items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setActivities(items.slice(0, 50));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Recent Outbound Activity</h3>
                <button onClick={loadActivity} className="text-corporate-teal hover:underline text-sm">Refresh</button>
            </div>
            
            {activities.length === 0 ? (
                 <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No recent activity found.
                 </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Recipient</th>
                                <th className="px-4 py-3 text-left">Action / Template</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activities.map(item => (
                                <tr key={item.id} className="text-sm hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-corporate-navy">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.company}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{item.details}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Sent
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const TemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    // Mock template data for now, ideally fetched from 'corporate_settings/email_templates'
    
    return (
         <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-corporate-navy mb-2">Global Templates Coming Soon</h3>
            <p className="text-slate-500 max-w-md mx-auto">
                Currently, templates are managed directly within Campaigns in the Outreach tab. 
                Global shared templates are being built.
            </p>
         </div>
    );
};

const UnsubscribeManager = () => {
    const [unsubs, setUnsubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');

    useEffect(() => {
        loadUnsubs();
    }, []);

    const loadUnsubs = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, 'unsubscribes'));
            setUnsubs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addUnsub = async () => {
        if (!newEmail) return;
        try {
            await addDoc(collection(db, 'unsubscribes'), { email: newEmail, date: new Date().toISOString(), reason: 'Manual Admin Add' });
            setNewEmail('');
            loadUnsubs();
        } catch (e) { alert("Error adding email"); }
    };

    const removeUnsub = async (id) => {
        if (!confirm("Are you sure? This will allow emailing this person again.")) return;
        try {
            await deleteDoc(doc(db, 'unsubscribes', id));
            loadUnsubs();
        } catch (e) { alert("Error removing email"); }
    };

    return (
        <div>
            <div className="flex gap-4 mb-6">
                <input 
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="Manually add email to blacklist..." 
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                />
                <button onClick={addUnsub} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100">
                    Block Email
                </button>
            </div>
            
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Blocked Date</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {unsubs.map(u => (
                            <tr key={u.id} className="text-sm">
                                <td className="px-4 py-3 font-medium text-slate-700">{u.email}</td>
                                <td className="px-4 py-3 text-slate-500">{new Date(u.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => removeUnsub(u.id)} className="text-slate-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {unsubs.length === 0 && (
                            <tr><td colSpan="3" className="px-4 py-8 text-center text-slate-500">No unsubscribed emails found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ... (Validator Wizard)
const DeliverabilityCheck = () => {
    const [domain, setDomain] = useState('leaderreps.com');
    const [selector, setSelector] = useState('google');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const checkDNS = async () => {
        setLoading(true);
        setResults(null);
        
        try {
            // 1. SPF Check
            const spfResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
            const spfData = await spfResponse.json();
            const spfRecords = spfData.Answer ? spfData.Answer.map(r => r.data.replace(/"/g, '')) : [];
            const spfRecord = spfRecords.find(r => r.startsWith('v=spf1'));
            
            // 2. DMARC Check
            const dmarcResponse = await fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`);
            const dmarcData = await dmarcResponse.json();
            const dmarcRecords = dmarcData.Answer ? dmarcData.Answer.map(r => r.data.replace(/"/g, '')) : [];
            const dmarcRecord = dmarcRecords.find(r => r.startsWith('v=DMARC1'));

            // 3. DKIM Check (approximate, requires selector)
            let dkimRecord = null;
            let dkimStatus = "skipped";
            if (selector) {
                const dkimResponse = await fetch(`https://dns.google/resolve?name=${selector}._domainkey.${domain}&type=TXT`);
                const dkimData = await dkimResponse.json();
                if (dkimData.Status === 0 && dkimData.Answer) {
                     dkimRecord = dkimData.Answer[0].data.replace(/"/g, '');
                     dkimStatus = "found";
                } else {
                    dkimStatus = "missing";
                }
            }

            setResults({
                domain,
                timestamp: new Date(),
                spf: {
                    valid: !!spfRecord,
                    record: spfRecord || "No SPF record found",
                    status: !!spfRecord ? "pass" : "fail"
                },
                dmarc: {
                    valid: !!dmarcRecord,
                    record: dmarcRecord || "No DMARC record found",
                    policy: dmarcRecord ? (dmarcRecord.match(/p=(\w+)/) || [])[1] : "none",
                    status: !!dmarcRecord ? "pass" : "fail"
                },
                dkim: {
                    valid: dkimStatus === "found",
                    record: dkimRecord || `No DKIM found at ${selector}._domainkey.${domain}`,
                    selector: selector,
                    status: dkimStatus === "found" ? "pass" : (dkimStatus === "missing" ? "fail" : "skipped")
                }
            });

        } catch (error) {
            console.error(error);
            setResults({ error: "Network error performing checks" });
        } finally {
            setLoading(false);
        }
    };

    const sendTest = async () => {
        if (!testEmail) return;
        setSendingTest(true);
        setTestResult(null);
        try {
            const functions = getFunctions();
            const sendOutreachEmail = httpsCallable(functions, 'sendOutreachEmail');
            const result = await sendOutreachEmail({
                to: testEmail,
                subject: `[Test] Deliverability Check - ${new Date().toLocaleTimeString()}`,
                text: "This is a test email from the LeaderReps Email Control Center. Please check headers for SPF/DKIM/DMARC pass.",
                html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2>Deliverability Test</h2>
                    <p>This email was sent to verify inbox placement.</p>
                    <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                    <hr/>
                    <small>LeaderReps Internal Tool</small>
                </div>`,
                isTest: true
            });
            
            if (result.data.success) {
                setTestResult({ type: 'success', msg: `Email successfully sent to ${testEmail}. Check your inbox (and spam folder!).` });
            } else {
                 setTestResult({ type: 'error', msg: `Failed: ${result.data.message}` });
            }
        } catch (e) {
            setTestResult({ type: 'error', msg: `Error: ${e.message}` });
        } finally {
            setSendingTest(false);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            
            {/* Intro Guide */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
                <h2 className="font-bold text-lg text-blue-900 mb-2">3-Step Validation Process</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-800">
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-800 flex-shrink-0">1</div>
                        <div>
                            <span className="font-bold block">Validate Technical Setup</span>
                            Ensure SPF, DMARC, and DKIM records are published so servers trust you.
                        </div>
                    </div>
                     <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-800 flex-shrink-0">2</div>
                         <div>
                            <span className="font-bold block">Live Inbox Test</span>
                            Send a real email to verify it lands in the Inbox, not Spam/Junk.
                        </div>
                    </div>
                     <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-800 flex-shrink-0">3</div>
                         <div>
                            <span className="font-bold block">Monitor Reputation</span>
                            Use Google Postmaster Tools to track your domain's health over time.
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Technical Check */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-corporate-navy mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-bold">1</div>
                    Technical DNS Verification
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
                    <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Domain to Check</label>
                        <input 
                            value={domain}
                            onChange={e => setDomain(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-corporate-teal outline-none"
                            placeholder="e.g. yourcompany.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">DKIM Selector</label>
                        <input 
                            value={selector}
                            onChange={e => setSelector(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-corporate-teal outline-none"
                            placeholder="e.g. google, default"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <button 
                            onClick={checkDNS} 
                            disabled={loading} 
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-medium"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <SearchIcon size={18} />}
                            {loading ? "Analyzing DNS Records..." : "Run Technical Diagnostics"}
                        </button>
                    </div>
                </div>

                {/* Results Display */}
                {results && !results.error && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatusCard 
                                title="SPF Record" 
                                status={results.spf.status} 
                                description="Authorizes senders for your domain."
                                details={results.spf.record}
                                fixRecommendation="Log in to your DNS provider (e.g. GoDaddy, Cloudflare) and add a TXT record for your root domain (@) with value: 'v=spf1 include:_spf.google.com ~all' (if using Google Workspace)."
                            />
                            <StatusCard 
                                title="DMARC Policy" 
                                status={results.dmarc.status} 
                                description="Instructions for receiving servers."
                                details={results.dmarc.record}
                                extra={results.dmarc.valid ? `Policy: ${results.dmarc.policy}` : null}
                                fixRecommendation={`Log in to your DNS provider and add a TXT record for '_dmarc.${domain}' with value: 'v=DMARC1; p=none; rua=mailto:admin@${domain}' (Start with p=none for monitoring).`}
                            />
                            <StatusCard 
                                title={`DKIM Value`}
                                status={results.dkim.status} 
                                description="Cryptographic signature verification."
                                details={results.dkim.record}
                                fixRecommendation={`Go to Google Admin Console > Apps > Gmail > Authenticate Email. Generate a new record, and add the TXT record to your DNS for '${selector}._domainkey'. Wait 24-48 hours.`}
                            />
                        </div>
                    </div>
                )}
                {results && results.error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        {results.error}
                    </div>
                )}
            </div>

            {/* Step 2: Live Test */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg text-corporate-navy mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-bold">2</div>
                    Live Delivery Test
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                    Send a test email to yourself or a service like <a href="https://www.mail-tester.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Mail-Tester</a> to verify headers and placement.
                </p>
                <div className="flex gap-4">
                    <input 
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        placeholder="Enter email address (e.g. test-123@mail-tester.com)"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button 
                        onClick={sendTest}
                        disabled={sendingTest || !testEmail}
                        className="bg-corporate-teal text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {sendingTest ? <RefreshCw className="animate-spin" size={18} /> : <Mail size={18} />}
                        Send Test
                    </button>
                </div>
                 {testResult && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${testResult.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {testResult.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        {testResult.msg}
                    </div>
                )}
            </div>

             {/* Step 3: Reputation */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                         <h3 className="font-bold text-lg text-corporate-navy flex items-center gap-2">
                             <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-sm font-bold">3</div>
                             Long-term Reputation Monitoring
                        </h3>
                    </div>
                    <a 
                        href="https://postmaster.google.com/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                        Open Postmaster Tools <ExternalLink size={14} />
                    </a>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Activity size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800">Spam Rate Threshold</h4>
                                <p className="text-sm text-slate-600 mt-1">
                                    Google requires spam rates to be kept <strong>below 0.10%</strong>. 
                                    Consistently exceeding <strong>0.30%</strong> will result in emails being blocked or sent to spam folders automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 text-sm">
                        <h4 className="font-semibold text-corporate-navy mb-3">Health Checklist:</h4>
                        <ul className="space-y-2">
                            <CheckItem label="Verify domain in Google Postmaster Tools" />
                            <CheckItem label="Maintain < 0.1% spam rate reported by users" />
                            <CheckItem label="Implement One-Click Unsubscribe (RFC 8058)" />
                            <CheckItem label="Warm up new domains (limit < 50 emails/day initially)" />
                        </ul>
                    </div>
                </div>
             </div>
        </div>
    );
};const CheckItem = ({ label }) => (
    <li className="flex items-center gap-2 text-slate-600">
        <div className="w-1.5 h-1.5 rounded-full bg-corporate-teal" />
        {label}
    </li>
);

const StatusCard = ({ title, status, description, details, extra, fixRecommendation }) => {
    const isPass = status === 'pass';
    const isFail = status === 'fail';
    
    return (
        <div className={`p-4 rounded-lg border ${isPass ? 'border-green-200 bg-green-50' : isFail ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex justify-between items-start mb-2">
                <h4 className={`font-bold ${isPass ? 'text-green-800' : isFail ? 'text-red-800' : 'text-slate-700'}`}>{title}</h4>
                {isPass && <CheckCircle className="text-green-600" size={20} />}
                {isFail && <XCircle className="text-red-600" size={20} />}
                {!isPass && !isFail && <AlertTriangle className="text-amber-500" size={20} />}
            </div>
            <p className="text-xs text-slate-600 mb-3">{description}</p>
            {extra && <div className="mb-2 text-xs font-bold uppercase tracking-wider">{extra}</div>}
            
            <div className="bg-white bg-opacity-60 p-2 rounded border border-black/5 text-[10px] font-mono break-all text-slate-500 overflow-hidden line-clamp-3 mb-2">
                {details || 'N/A'}
            </div>

            {isFail && fixRecommendation && (
                 <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> Fix Required:
                    </p>
                    <p className="text-xs text-red-700 leading-relaxed">
                        {fixRecommendation}
                    </p>
                 </div>
            )}
        </div>
    );
}
// Icons (Shield, Activity, SearchIcon, Box) added to main import at top

export default EmailControl;
