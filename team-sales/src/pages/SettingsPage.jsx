import { useState, useEffect } from 'react';
import { 
  Settings, Key, Sparkles, ExternalLink, Eye, EyeOff, 
  Check, AlertCircle, HelpCircle, Loader2, CreditCard
} from 'lucide-react';
import { useApolloStore } from '../stores/apolloStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { 
    apiKey, 
    apiKeyLoaded, 
    creditsUsed, 
    creditsLimit,
    loadApiKey, 
    saveApiKey 
  } = useApolloStore();
  
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  useEffect(() => {
    if (user?.uid) {
      loadApiKey(user.uid);
    }
  }, [user?.uid, loadApiKey]);
  
  const handleSaveKey = async () => {
    if (!newApiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    
    setSaving(true);
    await saveApiKey(user.uid, newApiKey.trim());
    setNewApiKey('');
    setShowKey(false);
    setSaving(false);
  };
  
  const handleRemoveKey = async () => {
    if (confirm('Remove your Apollo API key? You can add it back anytime.')) {
      await saveApiKey(user.uid, '');
      toast.success('API key removed');
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and integrations</p>
      </div>
      
      {/* Apollo Integration Card */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Apollo.io Integration</h2>
              <p className="text-sm text-gray-600">Search and enrich prospect data</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${apiKey ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-900">
                {apiKey ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {apiKey && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <CreditCard className="w-4 h-4" />
                  <span>{creditsUsed} credits used</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Current Key Display */}
          {apiKey && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Your API Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-between px-4 py-3 bg-gray-100 rounded-lg font-mono text-sm">
                  <span>{showKey ? apiKey : maskApiKey(apiKey)}</span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleRemoveKey}
                className="text-sm text-red-600 hover:text-red-700 hover:underline"
              >
                Remove API key
              </button>
            </div>
          )}
          
          {/* Add/Update Key Form */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              {apiKey ? 'Update API Key' : 'Add Your API Key'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Paste your Apollo API key here"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                onClick={handleSaveKey}
                disabled={saving || !newApiKey.trim()}
                className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
          
          {/* Help Section */}
          <div className="border-t pt-6">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <HelpCircle className="w-4 h-4" />
              How do I get an Apollo API key?
            </button>
            
            {showHelp && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Go to Apollo.io</p>
                      <p className="text-sm text-gray-600">
                        Sign up for a free account at{' '}
                        <a 
                          href="https://app.apollo.io" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
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
                      <p className="font-medium text-gray-900">Open API Settings</p>
                      <p className="text-sm text-gray-600">
                        Click Settings → Integrations → API Keys
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create a New API Key</p>
                      <p className="text-sm text-gray-600">
                        Click "Create New Key", name it "LeaderReps Sales Hub", and copy the key
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Paste it here</p>
                      <p className="text-sm text-gray-600">
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
                
                <div className="flex items-start gap-2 p-3 bg-amber-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Free Plan Includes:</p>
                    <p className="text-amber-700">
                      200 email credits/month • Unlimited search • Basic enrichment
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Account Info */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-600">Email</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Name</span>
            <span className="font-medium text-gray-900">{user?.displayName || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
