import { useState, useEffect } from 'react';
import { 
  Settings, Key, Sparkles, ExternalLink, Eye, EyeOff, 
  Check, AlertCircle, HelpCircle, Loader2, CreditCard,
  Sun, Moon, Mail, Linkedin, MailCheck, RefreshCw
} from 'lucide-react';
import { useApolloStore } from '../stores/apolloStore';
// DEPRECATED: Original Instantly.ai - replaced by LR-Instantly (sequenceStore.js)
// import { useInstantlyStore } from '../stores/instantlyStore';
import { useLinkedHelperStore } from '../stores/linkedHelperStore';
import { useGmailStore } from '../stores/gmailStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
  // Apollo store
  const { 
    apiKey: apolloApiKey, 
    apiKeyLoaded: apolloKeyLoaded, 
    creditsUsed, 
    creditsLimit,
    loadApiKey: loadApolloKey, 
    saveApiKey: saveApolloKey 
  } = useApolloStore();
  
  // DEPRECATED: Instantly.ai store - replaced by LR-Instantly
  // const {
  //   apiKey: instantlyApiKey,
  //   apiKeyLoaded: instantlyKeyLoaded,
  //   loadApiKey: loadInstantlyKey,
  //   saveApiKey: saveInstantlyKey,
  //   removeApiKey: removeInstantlyKey
  // } = useInstantlyStore();
  
  // LinkedHelper store
  const {
    apiKey: linkedHelperApiKey,
    apiKeyLoaded: linkedHelperKeyLoaded,
    loadApiKey: loadLinkedHelperKey,
    saveApiKey: saveLinkedHelperKey,
    removeApiKey: removeLinkedHelperKey
  } = useLinkedHelperStore();
  
  // Gmail store (team-level accounts)
  const {
    connectedAccounts,
    accountsLoaded,
    accountsLoading,
    loadConnectedAccounts,
    getConnectUrl: getGmailConnectUrl,
    disconnectAccount
  } = useGmailStore();
  
  // Apollo state
  const [newApolloKey, setNewApolloKey] = useState('');
  const [showApolloKey, setShowApolloKey] = useState(false);
  const [savingApollo, setSavingApollo] = useState(false);
  const [showApolloHelp, setShowApolloHelp] = useState(false);
  
  // DEPRECATED: Instantly state - replaced by LR-Instantly
  // const [newInstantlyKey, setNewInstantlyKey] = useState('');
  // const [showInstantlyKey, setShowInstantlyKey] = useState(false);
  // const [savingInstantly, setSavingInstantly] = useState(false);
  // const [showInstantlyHelp, setShowInstantlyHelp] = useState(false);
  
  // LinkedHelper state
  const [newLinkedHelperKey, setNewLinkedHelperKey] = useState('');
  const [showLinkedHelperKey, setShowLinkedHelperKey] = useState(false);
  const [savingLinkedHelper, setSavingLinkedHelper] = useState(false);
  const [showLinkedHelperHelp, setShowLinkedHelperHelp] = useState(false);
  
  // Gmail OAuth state
  const [showGmailHelp, setShowGmailHelp] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [disconnectingGmail, setDisconnectingGmail] = useState(false);
  
  // Load all API keys on mount
  useEffect(() => {
    if (user?.uid) {
      loadApolloKey(user.uid);
      // loadInstantlyKey(user.uid); // DEPRECATED: replaced by LR-Instantly
      loadLinkedHelperKey(user.uid);
      loadConnectedAccounts(); // Team-level Gmail accounts
    }
  }, [user?.uid, loadApolloKey, loadLinkedHelperKey, loadConnectedAccounts]);
  
  // Gmail OAuth handlers
  const handleConnectGmail = async () => {
    setConnectingGmail(true);
    try {
      const url = await getGmailConnectUrl(user.uid);
      if (url) {
        window.open(url, '_blank', 'width=500,height=700');
      } else {
        toast.error('Gmail OAuth not configured. Contact support.');
      }
    } catch (error) {
      console.error('Error getting OAuth URL:', error);
      toast.error('Failed to start Gmail connection');
    } finally {
      setConnectingGmail(false);
    }
  };
  
  const handleDisconnectGmail = async () => {
    if (confirm('Disconnect Gmail? Your email sync history will be preserved.')) {
      setDisconnectingGmail(true);
      await disconnectGmail(user.uid);
      setDisconnectingGmail(false);
    }
  };
  
  // Apollo handlers
  const handleSaveApolloKey = async () => {
    if (!newApolloKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    setSavingApollo(true);
    await saveApolloKey(user.uid, newApolloKey.trim());
    setNewApolloKey('');
    setShowApolloKey(false);
    setSavingApollo(false);
  };
  
  const handleRemoveApolloKey = async () => {
    if (confirm('Remove your Apollo API key? You can add it back anytime.')) {
      await saveApolloKey(user.uid, '');
      toast.success('API key removed');
    }
  };
  
  // DEPRECATED: Instantly handlers - replaced by LR-Instantly
  // const handleSaveInstantlyKey = async () => {
  //   if (!newInstantlyKey.trim()) {
  //     toast.error('Please enter an API key');
  //     return;
  //   }
  //   setSavingInstantly(true);
  //   await saveInstantlyKey(user.uid, newInstantlyKey.trim());
  //   setNewInstantlyKey('');
  //   setShowInstantlyKey(false);
  //   setSavingInstantly(false);
  // };
  // const handleRemoveInstantlyKey = async () => {
  //   if (confirm('Remove your Instantly API key? You can add it back anytime.')) {
  //     await removeInstantlyKey(user.uid);
  //   }
  // };
  
  // LinkedHelper handlers
  const handleSaveLinkedHelperKey = async () => {
    if (!newLinkedHelperKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    setSavingLinkedHelper(true);
    await saveLinkedHelperKey(user.uid, newLinkedHelperKey.trim());
    setNewLinkedHelperKey('');
    setShowLinkedHelperKey(false);
    setSavingLinkedHelper(false);
  };
  
  const handleRemoveLinkedHelperKey = async () => {
    if (confirm('Remove your LinkedHelper API key? You can add it back anytime.')) {
      await removeLinkedHelperKey(user.uid);
    }
  };
  
  const maskApiKey = (key) => {
    if (!key) return '';
    if (key.length < 8) return '••••••••';
    return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white dark:text-slate-100">Settings</h1>
        <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400">Manage your account and integrations</p>
      </div>
      
      {/* Apollo Integration Card */}
      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-100">Apollo.io Integration</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">Search and enrich prospect data</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${apolloApiKey ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-500'}`} />
              <span className="font-medium text-slate-900 dark:text-white dark:text-slate-100">
                {apolloApiKey ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {apolloApiKey && (
              <a 
                href="https://app.apollo.io/#/settings/credits/current"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 hover:underline"
              >
                <CreditCard className="w-4 h-4" />
                <span>View Credits in Apollo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          
          {/* Usage Stats */}
          {apolloApiKey && creditsUsed > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <Sparkles className="w-4 h-4" />
                <span><strong>{creditsUsed}</strong> searches/enrichments made through LR-HubSpot</span>
              </div>
            </div>
          )}
          
          {/* Current Key Display */}
          {apolloApiKey && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300">
                Your API Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-lg font-mono text-sm text-slate-900 dark:text-white dark:text-slate-200">
                  <span>{showApolloKey ? apolloApiKey : maskApiKey(apolloApiKey)}</span>
                  <button
                    onClick={() => setShowApolloKey(!showApolloKey)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 dark:text-slate-300"
                  >
                    {showApolloKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleRemoveApolloKey}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
              >
                Remove API key
              </button>
            </div>
          )}
          
          {/* Add/Update Key Form */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300">
              {apolloApiKey ? 'Update API Key' : 'Add Your API Key'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newApolloKey}
                onChange={(e) => setNewApolloKey(e.target.value)}
                placeholder="Paste your Apollo API key here"
                className="flex-1 px-4 py-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-slate-800 dark:bg-slate-700 text-slate-900 dark:text-white dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              />
              <button
                onClick={handleSaveApolloKey}
                disabled={savingApollo || !newApolloKey.trim()}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {savingApollo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
          
          {/* Help Section */}
          <div className="border-t dark:border-slate-700 pt-6">
            <button
              onClick={() => setShowApolloHelp(!showApolloHelp)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-slate-100"
            >
              <HelpCircle className="w-4 h-4" />
              How do I get an Apollo API key?
            </button>
            
            {showApolloHelp && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Go to Apollo.io</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Sign up for a free account at{' '}
                        <a 
                          href="https://app.apollo.io" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          app.apollo.io
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Open API Settings</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Click Settings → Integrations → API Keys
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Create a New API Key</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Click "Create New Key", name it "LR-HubSpot", and copy the key
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Paste it here</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Paste your key in the field above and click Save
                      </p>
                    </div>
                  </div>
                </div>
                
                <a
                  href="https://app.apollo.io/#/settings/integrations/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Apollo API Settings
                </a>
                
                <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">Free Plan Includes:</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      200 email credits/month • Unlimited search • Basic enrichment
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* DEPRECATED: Instantly.ai Integration Card - Replaced by LR-Instantly (see Outreach → Automation) */}
      {/* 
      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-100">Instantly.ai Integration</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">Cold email campaigns and outreach</p>
            </div>
          </div>
        </div>
        ... Instantly card content removed for brevity - see git history ...
      </div>
      */}
      
      {/* LinkedHelper Integration Card */}
      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-700 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-xl">
              <Linkedin className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white dark:text-slate-100">LinkedHelper Integration</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">LinkedIn automation and outreach</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${linkedHelperApiKey ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-500'}`} />
              <span className="font-medium text-slate-900 dark:text-white dark:text-slate-100">
                {linkedHelperApiKey ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {linkedHelperApiKey && (
              <a 
                href="https://www.linkedhelper.com/account"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 hover:underline"
              >
                <span>Open LinkedHelper Account</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          
          {/* Current Key Display */}
          {linkedHelperApiKey && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300">
                Your API Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-slate-700 rounded-lg font-mono text-sm text-slate-900 dark:text-white dark:text-slate-200">
                  <span>{showLinkedHelperKey ? linkedHelperApiKey : maskApiKey(linkedHelperApiKey)}</span>
                  <button
                    onClick={() => setShowLinkedHelperKey(!showLinkedHelperKey)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 dark:text-slate-300"
                  >
                    {showLinkedHelperKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleRemoveLinkedHelperKey}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"
              >
                Remove API key
              </button>
            </div>
          )}
          
          {/* Add/Update Key Form */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300">
              {linkedHelperApiKey ? 'Update API Key' : 'Add Your API Key'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newLinkedHelperKey}
                onChange={(e) => setNewLinkedHelperKey(e.target.value)}
                placeholder="Paste your LinkedHelper API key here"
                className="flex-1 px-4 py-3 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white dark:bg-slate-800 dark:bg-slate-700 text-slate-900 dark:text-white dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              />
              <button
                onClick={handleSaveLinkedHelperKey}
                disabled={savingLinkedHelper || !newLinkedHelperKey.trim()}
                className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {savingLinkedHelper ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
          
          {/* Help Section */}
          <div className="border-t dark:border-slate-700 pt-6">
            <button
              onClick={() => setShowLinkedHelperHelp(!showLinkedHelperHelp)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-slate-100"
            >
              <HelpCircle className="w-4 h-4" />
              How do I get a LinkedHelper API key?
            </button>
            
            {showLinkedHelperHelp && (
              <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Open LinkedHelper 2</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Launch the LinkedHelper 2 desktop application
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Go to Settings → API</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Navigate to the Settings menu and find the API section
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-sky-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Enable API Access</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Enable the API and copy your API key or token
                      </p>
                    </div>
                  </div>
                </div>
                
                <a
                  href="https://docs.linkedhelper.com/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  View LinkedHelper API Docs
                </a>
                
                <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">Note:</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      LinkedHelper 2 must be running on your computer for campaigns to execute
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Gmail Integration Card - Team Level */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-700 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                <MailCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">LR-Instantly Gmail Accounts</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Team sending accounts for cold outreach</p>
              </div>
            </div>
            <button
              onClick={() => loadConnectedAccounts()}
              disabled={accountsLoading}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${accountsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Connected Accounts List */}
          {accountsLoading && !accountsLoaded ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : connectedAccounts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Connected Accounts ({connectedAccounts.length})
              </p>
              {connectedAccounts.map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${account.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{account.email}</span>
                      {account.connectedAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Connected {new Date(account.connectedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Disconnect ${account.email}?`)) {
                        disconnectAccount(account.id);
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4" />
                <span>No Gmail accounts connected yet</span>
              </div>
            </div>
          )}
          
          {/* Connect Another Account */}
          <div className="pt-4 border-t dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Connect @leaderreps.biz Gmail accounts for cold outreach. Each account can send emails through LR-Instantly sequences.
            </p>
            <button
              onClick={handleConnectGmail}
              disabled={connectingGmail}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connectingGmail ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mail className="w-5 h-5" />
              )}
              {connectingGmail ? 'Connecting...' : 'Connect Gmail Account'}
            </button>
          </div>
          
          {/* Help Section */}
          <div className="border-t dark:border-slate-700 pt-6">
            <button
              onClick={() => setShowGmailHelp(!showGmailHelp)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <HelpCircle className="w-4 h-4" />
              How does Gmail sync work?
            </button>
            
            {showGmailHelp && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Connect your Gmail</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Click the button above to authorize LR-HubSpot to access your Gmail
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Automatic Syncing</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Emails to and from your prospects are automatically logged to their timeline
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">Send from App</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400">
                        Compose and send emails directly from prospect profiles
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">Privacy First:</p>
                    <p className="text-amber-700 dark:text-amber-400">
                      Only emails matching your tracked prospects are synced. We never read your personal emails.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Display Settings */}
      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-4">Display</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            <div>
              <p className="font-medium text-slate-900 dark:text-white dark:text-slate-100">
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
                Toggle between light and dark themes
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-800 transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Account Info */}
      <div className="bg-white dark:bg-slate-800 dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white dark:text-slate-100 mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-300 dark:text-slate-400">Email</span>
            <span className="font-medium text-slate-900 dark:text-white dark:text-slate-100">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600 dark:text-slate-300 dark:text-slate-400">Name</span>
            <span className="font-medium text-slate-900 dark:text-white dark:text-slate-100">{user?.displayName || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
