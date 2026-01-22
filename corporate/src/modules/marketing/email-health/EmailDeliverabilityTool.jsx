import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Server, 
  Mail, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Copy
} from 'lucide-react';

const EmailDeliverabilityTool = () => {
    const [domain, setDomain] = useState('leaderreps.com');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('health'); // health, setup

    const checkDNS = async (domainName) => {
        setLoading(true);
        setResults(null);
        
        try {
            // Use Google DNS API to fetch TXT records
            const response = await fetch(`https://dns.google/resolve?name=${domainName}&type=TXT`);
            const data = await response.json();
            
            if (data.Status !== 0) {
                // Error looking up domain
                setResults({ error: "Could not resolve domain. check spelling." });
                setLoading(false);
                return;
            }

            const txtRecords = data.Answer ? data.Answer.map(r => r.data.replace(/"/g, '')) : [];
            
            // Analyze SPF
            const spfRecord = txtRecords.find(r => r.startsWith('v=spf1'));
            let spfStatus = { valid: false, record: spfRecord, issues: [] };
            
            if (spfRecord) {
                spfStatus.valid = true;
                if (!spfRecord.includes('include:_spf.google.com')) spfStatus.issues.push({ type: 'warning', msg: 'Missing Google SPF include' });
                if (!spfRecord.includes('~all') && !spfRecord.includes('-all')) spfStatus.issues.push({ type: 'error', msg: 'Missing policy terminator (~all or -all)' });
            } else {
                spfStatus.issues.push({ type: 'error', msg: 'No SPF record found' });
            }

            // Analyze DMARC (Lookup _dmarc.domain)
            const dmarcRes = await fetch(`https://dns.google/resolve?name=_dmarc.${domainName}&type=TXT`);
            const dmarcData = await dmarcRes.json();
            const dmarcRecords = dmarcData.Answer ? dmarcData.Answer.map(r => r.data.replace(/"/g, '')) : [];
            const dmarcRecord = dmarcRecords.find(r => r.startsWith('v=DMARC1'));
            
            let dmarcStatus = { valid: false, record: dmarcRecord, issues: [] };
            if (dmarcRecord) {
                dmarcStatus.valid = true;
                if (dmarcRecord.includes('p=none')) dmarcStatus.issues.push({ type: 'warning', msg: 'Policy is "none" (Monitor Only). Emails are not protected.' });
                if (!dmarcRecord.includes('rua=')) dmarcStatus.issues.push({ type: 'warning', msg: 'No reporting address (rua=) configured.' });
            } else {
                dmarcStatus.issues.push({ type: 'error', msg: 'No DMARC record found' });
            }

            // Analyze DKIM (Lookup google._domainkey.domain) - Default selector
            // Note: This only checks the 'google' selector.
            const dkimRes = await fetch(`https://dns.google/resolve?name=google._domainkey.${domainName}&type=TXT`);
            const dkimData = await dkimRes.json();
            const dkimRecords = dkimData.Answer ? dkimData.Answer.map(r => r.data.replace(/"/g, '')) : [];
            const dkimRecord = dkimRecords.join(''); // DKIM is often split
            
            let dkimStatus = { valid: false, record: dkimRecord.substring(0, 50) + (dkimRecord.length > 50 ? '...' : ''), issues: [] };
            
            if (dkimRecord && (dkimRecord.includes('v=DKIM1') || dkimRecord.includes('k=rsa'))) {
                dkimStatus.valid = true;
            } else {
                dkimStatus.issues.push({ type: 'error', msg: 'No DKIM record found for default Google Workspace selector ("google").' });
            }

            setResults({
                domain: domainName,
                spf: spfStatus,
                dmarc: dmarcStatus,
                dkim: dkimStatus,
                timestamp: new Date().toLocaleString()
            });

        } catch (error) {
            console.error(error);
            setResults({ error: "Failed to run checks. Network error." });
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ valid, issues }) => {
        if (!valid) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Missing/Invalid</span>;
        if (issues && issues.some(i => i.type === 'error')) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Error</span>;
        if (issues && issues.length > 0) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</span>;
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Good</span>;
    };

    const CopyButton = ({ text }) => {
        const [copied, setCopied] = useState(false);
        const copy = () => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };
        return (
            <button onClick={copy} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors" title="Copy to clipboard">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-corporate-teal" />
                        Email Deliverability Command Center
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Protect domain reputation and prevent spam.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('health')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'health' ? 'bg-corporate-teal text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Health Check
                    </button>
                    <button 
                        onClick={() => setActiveTab('setup')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'setup' ? 'bg-corporate-teal text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Setup Instructions
                    </button>
                </div>
            </div>

            {activeTab === 'health' && (
                <div className="p-6">
                    <div className="flex gap-4 mb-8">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                value={domain} 
                                onChange={(e) => setDomain(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-corporate-teal focus:border-transparent pl-10"
                                placeholder="Enter domain (e.g. leaderreps.com)"
                            />
                            <Server className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                        </div>
                        <button 
                            onClick={() => checkDNS(domain)}
                            disabled={loading}
                            className="px-6 py-3 bg-corporate-teal hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            Run Diagnostic
                        </button>
                    </div>

                    {results && !results.error && (
                        <div className="space-y-6">
                             {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-xl border ${results.spf.valid && results.spf.issues.length === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-700">SPF</h3>
                                        <StatusBadge valid={results.spf.valid} issues={results.spf.issues} />
                                    </div>
                                    <p className="text-xs text-slate-500">Sender Policy Framework</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${results.dkim.valid ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-700">DKIM</h3>
                                        <StatusBadge valid={results.dkim.valid} issues={results.dkim.issues} />
                                    </div>
                                    <p className="text-xs text-slate-500">DomainKeys Identified Mail</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${results.dmarc.valid && results.dmarc.issues.length === 0 ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-700">DMARC</h3>
                                        <StatusBadge valid={results.dmarc.valid} issues={results.dmarc.issues} />
                                    </div>
                                    <p className="text-xs text-slate-500">Domain-based Authentication</p>
                                </div>
                            </div>

                            {/* Detail List */}
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-700">SPF Record</h4>
                                        <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">TXT @</span>
                                    </div>
                                    <div className="font-mono text-sm bg-white p-3 rounded border border-slate-200 text-slate-600 break-all">
                                        {results.spf.record || 'No record found'}
                                    </div>
                                    {results.spf.issues.map((issue, i) => (
                                        <div key={i} className={`mt-2 text-sm flex items-center gap-2 ${issue.type === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                            {issue.msg}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-700">DKIM Record</h4>
                                        <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">TXT google._domainkey</span>
                                    </div>
                                    <div className="font-mono text-sm bg-white p-3 rounded border border-slate-200 text-slate-600 break-all">
                                        {results.dkim.record || 'No record found'}
                                    </div>
                                    {results.dkim.issues.map((issue, i) => (
                                        <div key={i} className={`mt-2 text-sm flex items-center gap-2 ${issue.type === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                            {issue.msg}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-700">DMARC Record</h4>
                                        <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">TXT _dmarc</span>
                                    </div>
                                    <div className="font-mono text-sm bg-white p-3 rounded border border-slate-200 text-slate-600 break-all">
                                        {results.dmarc.record || 'No record found'}
                                    </div>
                                    {results.dmarc.issues.map((issue, i) => (
                                        <div key={i} className={`mt-2 text-sm flex items-center gap-2 ${issue.type === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                                            <AlertTriangle className="w-4 h-4" />
                                            {issue.msg}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <a 
                                href="https://postmaster.google.com/" 
                                target="_blank" 
                                className="block p-4 mt-6 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-blue-900">Check Reputation Score</h4>
                                            <p className="text-sm text-blue-700">Open Google Postmaster Tools</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-blue-400" />
                                </div>
                            </a>
                        </div>
                    )}
                    
                    {(!results || results.error) && !loading && (
                        <div className="text-center py-12">
                             <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                             <p className="text-slate-500">Enter your domain above to run a health check.</p>
                             {results?.error && <p className="text-red-500 mt-2">{results.error}</p>}
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12">
                            <RefreshCw className="w-12 h-12 text-corporate-teal animate-spin mx-auto mb-4" />
                            <p className="text-slate-500">Querying DNS records...</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'setup' && (
                <div className="p-6 space-y-8">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                        <h3 className="font-bold text-amber-800 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Critical For {domain}
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                            Copy these records exactly and add them to your DNS provider (GoDaddy, Wix, Cloudflare, Namecheap).
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-corporate-navy mb-2">1. Email Authentication (SPF)</h3>
                            <p className="text-slate-500 text-sm mb-3">Tells the world that Google is allowed to send email for you.</p>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 mb-2">
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Host/Name</div>
                                    <div className="col-span-8">Value</div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 text-sm items-center">
                                    <div className="col-span-2 font-mono">TXT</div>
                                    <div className="col-span-2 font-mono">@</div>
                                    <div className="col-span-8 bg-white p-2 rounded border border-slate-200 font-mono flex items-center justify-between group">
                                        <span>v=spf1 include:_spf.google.com ~all</span>
                                        <CopyButton text="v=spf1 include:_spf.google.com ~all" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 italic">Note: If you use other mail services (like SendGrid or Wix), include them too, e.g., `include:spf.wix.com`.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-corporate-navy mb-2">2. Digital Signature (DKIM)</h3>
                            <p className="text-slate-500 text-sm mb-3">Prevents tampering. You must generate this in Google Admin first.</p>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 mb-4">
                                    <li>Go to <strong>admin.google.com</strong> &gt; Apps &gt; Gmail &gt; Authenticate email.</li>
                                    <li>Click <strong>Generate new record</strong>.</li>
                                    <li>Select 2048-bit key length.</li>
                                    <li>Copy the TXT record name (usually <code>google._domainkey</code>) and value.</li>
                                </ol>
                                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 mb-2">
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Host/Name</div>
                                    <div className="col-span-8">Value</div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 text-sm items-center">
                                    <div className="col-span-2 font-mono">TXT</div>
                                    <div className="col-span-2 font-mono">google._domainkey</div>
                                    <div className="col-span-8 bg-white p-2 rounded border border-slate-200 font-mono text-slate-400 italic">
                                        (Paste the long key from Google Admin here)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-corporate-navy mb-2">3. Policy & Reporting (DMARC)</h3>
                            <p className="text-slate-500 text-sm mb-3">Instructs Gmail what to do with fakes. Start with "monitor only" (p=none).</p>
                             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 mb-2">
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Host/Name</div>
                                    <div className="col-span-8">Value</div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 text-sm items-center">
                                    <div className="col-span-2 font-mono">TXT</div>
                                    <div className="col-span-2 font-mono">_dmarc</div>
                                    <div className="col-span-8 bg-white p-2 rounded border border-slate-200 font-mono flex items-center justify-between group">
                                        <span>v=DMARC1; p=none; rua=mailto:admin@{domain}</span>
                                        <CopyButton text={`v=DMARC1; p=none; rua=mailto:admin@${domain}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailDeliverabilityTool;
