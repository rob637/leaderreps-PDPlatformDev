/**
 * DataHubPage — data quality + integrations control center.
 *
 * Sections:
 *   1. Validation summary (counts of errors/warnings across prospects)
 *   2. Duplicate clusters with one-click merge
 *   3. AI enrichment (run on a single prospect by ID, surface suggestions)
 *   4. Integrations status (Gmail, LinkedHelper, Apollo) + outbound webhooks
 */

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy as CopyIcon,
  GitMerge,
  Sparkles,
  Plug,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useProspectsStore } from '../stores/prospectsStore';
import {
  validateProspect,
  getValidationSummary,
  findDuplicateClusters,
  mergeProspects,
} from '../lib/dataQuality';
import { enrichProspect } from '../services/aiService';
import { useConfirm } from '../components/ConfirmDialog';
import useGmailStore from '../stores/gmailStore';
import { useLinkedHelperStore } from '../stores/linkedHelperStore';
import { useApolloStore } from '../stores/apolloStore';

const Section = ({ icon: Icon, title, subtitle, children, action }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const ValidationCard = ({ prospects }) => {
  const summary = useMemo(() => getValidationSummary(prospects), [prospects]);
  const flagged = useMemo(() => {
    return prospects
      .map((p) => ({ p, v: validateProspect(p) }))
      .filter(({ v }) => v.issues.length > 0)
      .slice(0, 25);
  }, [prospects]);

  return (
    <Section
      icon={ShieldCheck}
      title="Data Validation"
      subtitle={`${prospects.length} prospects scanned`}
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {prospects.length - flagged.length}
          </div>
          <div className="text-xs text-slate-500">Clean</div>
        </div>
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {summary.warnCount}
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-400">Warnings</div>
        </div>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {summary.errorCount}
          </div>
          <div className="text-xs text-red-700 dark:text-red-400">Errors</div>
        </div>
      </div>
      {flagged.length === 0 ? (
        <div className="text-sm text-slate-500 italic">No validation issues found.</div>
      ) : (
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
          {flagged.map(({ p, v }) => (
            <div key={p.id} className="py-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {p.firstName ? `${p.firstName} ${p.lastName || ''}` : p.name || p.email || 'Unnamed'}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {p.company || ''} {p.email ? `• ${p.email}` : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 max-w-md justify-end">
                {v.issues.map((i, idx) => (
                  <span
                    key={idx}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      i.level === 'error'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                        : i.level === 'warn'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                    title={i.message}
                  >
                    {i.field}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

const DuplicateCluster = ({ cluster, onMerge }) => {
  const [survivorId, setSurvivorId] = useState(cluster.prospects[0].id);
  const survivor = cluster.prospects.find((p) => p.id === survivorId);
  const others = cluster.prospects.filter((p) => p.id !== survivorId);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {cluster.reason}
          </div>
          <div className="text-xs text-slate-500">{cluster.detail}</div>
        </div>
        <button
          onClick={() => onMerge(survivor, others)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-corporate-teal text-white rounded text-xs hover:bg-corporate-teal/90"
        >
          <GitMerge className="w-3 h-3" />
          Merge into selected
        </button>
      </div>
      <div className="space-y-1">
        {cluster.prospects.map((p) => {
          const isSurvivor = p.id === survivorId;
          return (
            <label
              key={p.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer ${
                isSurvivor
                  ? 'bg-corporate-teal/10 border border-corporate-teal/40'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name={`survivor-${cluster.key}`}
                checked={isSurvivor}
                onChange={() => setSurvivorId(p.id)}
              />
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {p.firstName ? `${p.firstName} ${p.lastName || ''}` : p.name || 'Unnamed'}
              </span>
              <span className="text-slate-500 text-xs truncate">
                {[p.title, p.company, p.email].filter(Boolean).join(' • ')}
              </span>
              {isSurvivor && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-corporate-teal text-white rounded">
                  KEEP
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};

const DedupeCard = ({ prospects }) => {
  const updateProspect = useProspectsStore((s) => s.updateProspect);
  const deleteProspect = useProspectsStore((s) => s.deleteProspect);
  const confirm = useConfirm();
  const clusters = useMemo(() => findDuplicateClusters(prospects), [prospects]);
  const [busyKey, setBusyKey] = useState(null);

  const handleMerge = async (cluster, survivor, others) => {
    const ok = await confirm({
      title: 'Merge duplicates?',
      message: `Keep "${survivor.firstName || survivor.name || 'selected'}" and delete ${others.length} other record(s)? Missing fields will be copied to the survivor. This cannot be undone.`,
      confirmLabel: 'Merge & Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyKey(cluster.key);
    try {
      await mergeProspects(survivor, others, { updateProspect, deleteProspect });
      toast.success('Merged duplicate prospects');
    } catch (err) {
      console.error(err);
      toast.error(`Merge failed: ${err.message}`);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Section
      icon={CopyIcon}
      title="Duplicate Detection"
      subtitle={`${clusters.length} potential cluster${clusters.length === 1 ? '' : 's'} found`}
    >
      {clusters.length === 0 ? (
        <div className="text-sm text-slate-500 italic">No duplicates detected. ✨</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {clusters.map((c) => (
            <div key={c.key} className={busyKey === c.key ? 'opacity-50 pointer-events-none' : ''}>
              <DuplicateCluster
                cluster={c}
                onMerge={(s, o) => handleMerge(c, s, o)}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
};

const EnrichmentCard = ({ prospects }) => {
  const updateProspect = useProspectsStore((s) => s.updateProspect);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [accepted, setAccepted] = useState({});

  const selected = prospects.find((p) => p.id === selectedId) || null;

  const runEnrich = async () => {
    if (!selected) return;
    setLoading(true);
    setSuggestion(null);
    setAccepted({});
    try {
      const out = await enrichProspect({ prospect: selected });
      setSuggestion(out);
    } catch (err) {
      toast.error(`Enrichment failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!selected || !suggestion) return;
    const updates = {};
    for (const [k, v] of Object.entries(suggestion)) {
      if (accepted[k] && v && !Array.isArray(v)) updates[k] = v;
    }
    if (accepted.talkingPoints && Array.isArray(suggestion.talkingPoints)) {
      const existing = selected.notes ? `${selected.notes}\n\n` : '';
      updates.notes = `${existing}Talking points:\n- ${suggestion.talkingPoints.join('\n- ')}`;
    }
    if (Object.keys(updates).length === 0) {
      toast('Nothing selected to apply');
      return;
    }
    try {
      await updateProspect(selected.id, updates);
      toast.success('Enrichment applied');
      setSuggestion(null);
      setAccepted({});
    } catch (err) {
      toast.error(`Failed to apply: ${err.message}`);
    }
  };

  return (
    <Section
      icon={Sparkles}
      title="AI Enrichment"
      subtitle="Suggest missing prospect fields using AI"
    >
      <div className="flex items-center gap-2 mb-3">
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setSuggestion(null);
          }}
          className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="">Select a prospect…</option>
          {prospects.slice(0, 200).map((p) => (
            <option key={p.id} value={p.id}>
              {(p.firstName ? `${p.firstName} ${p.lastName || ''}` : p.name || p.email) +
                (p.company ? ` — ${p.company}` : '')}
            </option>
          ))}
        </select>
        <button
          onClick={runEnrich}
          disabled={!selected || loading}
          className="inline-flex items-center gap-1 px-3 py-2 bg-corporate-teal text-white rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Suggest
        </button>
      </div>
      {suggestion && (
        <div className="space-y-2">
          {Object.entries(suggestion).map(([k, v]) => {
            if (Array.isArray(v) && !v.length) return null;
            const display = Array.isArray(v) ? v.join(' · ') : v;
            if (!display) return null;
            const existing = selected?.[k];
            return (
              <label
                key={k}
                className="flex items-start gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <input
                  type="checkbox"
                  checked={!!accepted[k]}
                  onChange={(e) => setAccepted((a) => ({ ...a, [k]: e.target.checked }))}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {k}
                  </div>
                  <div className="text-sm text-slate-900 dark:text-slate-100 break-words">
                    {display}
                  </div>
                  {existing && (
                    <div className="text-xs text-slate-400 mt-0.5 line-through truncate">
                      current: {String(existing).slice(0, 80)}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
          <div className="flex justify-end pt-2">
            <button
              onClick={apply}
              className="px-3 py-1.5 bg-corporate-navy text-white rounded text-sm hover:bg-corporate-navy/90"
            >
              Apply selected
            </button>
          </div>
        </div>
      )}
    </Section>
  );
};

const IntegrationRow = ({ name, connected, detail, onAction, actionLabel }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
    <div className="flex items-center gap-3">
      {connected ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <XCircle className="w-4 h-4 text-slate-300" />
      )}
      <div>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{name}</div>
        {detail && <div className="text-xs text-slate-500">{detail}</div>}
      </div>
    </div>
    {onAction && (
      <button
        onClick={onAction}
        className="text-xs text-corporate-teal hover:underline"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const IntegrationsCard = () => {
  const { connectedAccounts } = useGmailStore();
  const linkedHelperConfigured = useLinkedHelperStore?.((s) => !!s?.apiKey) ?? false;
  const apolloConfigured = useApolloStore?.((s) => !!s?.apiKey) ?? false;

  return (
    <Section
      icon={Plug}
      title="Integrations"
      subtitle="Connection status for external services"
    >
      <IntegrationRow
        name="Gmail"
        connected={connectedAccounts?.length > 0}
        detail={
          connectedAccounts?.length
            ? `${connectedAccounts.length} account${connectedAccounts.length === 1 ? '' : 's'} connected`
            : 'No Gmail accounts connected'
        }
      />
      <IntegrationRow
        name="LinkedHelper"
        connected={linkedHelperConfigured}
        detail={linkedHelperConfigured ? 'API key configured' : 'Set API key in Settings'}
      />
      <IntegrationRow
        name="Apollo.io"
        connected={apolloConfigured}
        detail={apolloConfigured ? 'API key configured' : 'Set API key in Settings'}
      />
      <IntegrationRow
        name="Workflow Automations"
        connected={true}
        detail="Cloud Functions: crmWorkflowOnDealWritten, crmNoActivitySweep"
      />
      <IntegrationRow
        name="Audit Log"
        connected={true}
        detail="Active on prospects, accounts, deals"
      />
    </Section>
  );
};

const DataHubPage = () => {
  const prospects = useProspectsStore((s) => s.prospects);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Data Hub
        </h2>
        <p className="text-sm text-slate-500">
          Validation, deduplication, AI enrichment, and integrations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ValidationCard prospects={prospects} />
        <DedupeCard prospects={prospects} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EnrichmentCard prospects={prospects} />
        <IntegrationsCard />
      </div>
    </div>
  );
};

export default DataHubPage;
