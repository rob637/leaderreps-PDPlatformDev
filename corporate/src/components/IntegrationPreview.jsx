import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Linkedin, Calendar, Mail, Database, Zap, 
  CheckCircle, AlertCircle, Settings, ArrowRight,
  RefreshCw, ExternalLink, Webhook
} from 'lucide-react';

/**
 * IntegrationPreview - Dripify-inspired integration status display
 * 
 * Shows connected integrations at a glance, similar to how
 * Dripify displays Make, Zapier, and other integrations prominently.
 */

const INTEGRATIONS = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Sales Navigator',
    icon: Linkedin,
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2]/10',
    status: 'connected', // connected, disconnected, syncing
    lastSync: '2 mins ago',
    metrics: { contacts: 1250, synced: 1248 }
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Scheduling',
    icon: Calendar,
    color: '#006BFF',
    bgColor: 'bg-[#006BFF]/10',
    status: 'connected',
    lastSync: '5 mins ago',
    metrics: { bookings: 42, slots: 156 }
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Google Workspace',
    icon: Mail,
    color: '#EA4335',
    bgColor: 'bg-[#EA4335]/10',
    status: 'connected',
    lastSync: 'Just now',
    metrics: { sent: 523, delivered: '98.5%' }
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Firestore',
    icon: Database,
    color: '#FF9100',
    bgColor: 'bg-[#FF9100]/10',
    status: 'connected',
    lastSync: 'Real-time',
    metrics: { prospects: 89, deals: 12 }
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automation',
    icon: Zap,
    color: '#FF4A00',
    bgColor: 'bg-[#FF4A00]/10',
    status: 'disconnected',
    setupUrl: '/integration',
    metrics: null
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Custom',
    icon: Webhook,
    color: '#6366F1',
    bgColor: 'bg-[#6366F1]/10',
    status: 'disconnected',
    setupUrl: '/integration',
    metrics: null
  }
];

const IntegrationPreview = ({ compact = false }) => {
  const [syncing, setSyncing] = useState({});

  const handleSync = (integrationId) => {
    setSyncing({ ...syncing, [integrationId]: true });
    // Simulate sync
    setTimeout(() => {
      setSyncing({ ...syncing, [integrationId]: false });
    }, 2000);
  };

  const connectedCount = INTEGRATIONS.filter(i => i.status === 'connected').length;
  const totalCount = INTEGRATIONS.length;

  if (compact) {
    // Compact horizontal bar for headers
    return (
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
        <span className="text-xs font-medium text-slate-500">Integrations:</span>
        <div className="flex items-center gap-2">
          {INTEGRATIONS.filter(i => i.status === 'connected').map(integration => {
            const Icon = integration.icon;
            return (
              <div 
                key={integration.id}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${integration.color}15` }}
                title={`${integration.name} - Connected`}
              >
                <Icon className="w-3 h-3" style={{ color: integration.color }} />
              </div>
            );
          })}
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <span className="text-xs text-emerald-600 font-medium">{connectedCount}/{totalCount} active</span>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-corporate-navy flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Integrations
          </h2>
          <p className="text-sm text-slate-500">{connectedCount} of {totalCount} integrations active</p>
        </div>
        <Link 
          to="/integration"
          className="text-sm text-corporate-teal font-medium flex items-center gap-1 hover:underline"
        >
          Manage All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {INTEGRATIONS.map(integration => {
          const Icon = integration.icon;
          const isConnected = integration.status === 'connected';
          const isSyncing = syncing[integration.id];

          return (
            <div 
              key={integration.id}
              className={`relative bg-white rounded-xl border p-4 transition-all ${
                isConnected 
                  ? 'border-slate-200 hover:shadow-md' 
                  : 'border-dashed border-slate-300 opacity-60 hover:opacity-100'
              }`}
            >
              {/* Status Indicator */}
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-slate-300'
              }`} />

              {/* Icon */}
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${integration.bgColor}`}
              >
                <Icon className="w-5 h-5" style={{ color: integration.color }} />
              </div>

              {/* Info */}
              <h4 className="font-semibold text-sm text-slate-800">{integration.name}</h4>
              <p className="text-xs text-slate-500">{integration.description}</p>

              {isConnected ? (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : integration.lastSync}
                  </span>
                  <button 
                    onClick={() => handleSync(integration.id)}
                    className="text-[10px] text-corporate-teal font-medium hover:underline"
                  >
                    Sync
                  </button>
                </div>
              ) : (
                <Link
                  to={integration.setupUrl || '/integration'}
                  className="mt-3 text-xs text-corporate-teal font-medium flex items-center gap-1 hover:underline"
                >
                  Connect <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats for Connected Integrations */}
      <div className="mt-4 bg-slate-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600">Email Health: <strong className="text-emerald-600">98.5%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600">LinkedIn Synced: <strong>1,248 contacts</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600">This Month: <strong>42 bookings</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">See all integrations →</span>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPreview;
