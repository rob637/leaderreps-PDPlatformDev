/**
 * CommandPalette — global ⌘K search and navigation for the CRM.
 *
 * Replaces the previous react-router-based version. Uses the in-CRM
 * `useCRMNavigation()` hook and searches across prospects, accounts,
 * deals, and tasks loaded into Zustand stores. Navigation actions and
 * common commands appear when the input is empty.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Users,
  Sparkles,
  Mail,
  Activity,
  BarChart3,
  CheckSquare,
  Settings,
  UserPlus,
  Briefcase,
  Workflow as WorkflowIcon,
  Building2,
  DollarSign,
  FileBarChart,
  Database,
  ChevronRight,
} from 'lucide-react';

import { useUIStore } from '../stores/uiStore';
import { useProspectsStore } from '../stores/prospectsStore';
import { useAccountsStore } from '../stores/accountsStore';
import { useDealsStore } from '../stores/dealsStore';
import { useTasksStore } from '../stores/tasksStore';
import { useCRMNavigation } from '../CRMApp';

const NAV_COMMANDS = [
  { key: 'prospects', label: 'Go to Prospects', icon: Users, tab: 'prospects' },
  { key: 'apollo', label: 'Apollo Search', icon: Sparkles, tab: 'apollo' },
  { key: 'outreach', label: 'Go to Outreach', icon: Mail, tab: 'outreach' },
  { key: 'activities', label: 'Go to Activities', icon: Activity, tab: 'activities' },
  { key: 'analytics', label: 'Go to Analytics', icon: BarChart3, tab: 'analytics' },
  { key: 'reports', label: 'Go to Reports', icon: FileBarChart, tab: 'reports' },
  { key: 'tasks', label: 'Go to Tasks', icon: CheckSquare, tab: 'tasks' },
  { key: 'workflows', label: 'Go to Workflows', icon: WorkflowIcon, tab: 'workflows' },
  { key: 'datahub', label: 'Go to Data Hub', icon: Database, tab: 'datahub' },
  { key: 'settings', label: 'Settings', icon: Settings, tab: 'settings' },
];

const ACTION_COMMANDS = [
  {
    key: 'add-prospect',
    label: 'Add New Prospect',
    icon: UserPlus,
    run: ({ openModal }) => openModal('addProspect'),
  },
];

function highlight(text, query) {
  if (!text || !query) return text || '';
  const lower = String(text).toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 dark:bg-amber-500/40 text-inherit rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const CommandPalette = () => {
  const { commandPaletteOpen, closeCommandPalette, openModal } = useUIStore();
  const { navigate } = useCRMNavigation();

  const prospects = useProspectsStore((s) => s.prospects);
  const setSelectedProspect = useProspectsStore((s) => s.setSelectedProspect);
  const accounts = useAccountsStore((s) => s.accounts) || [];
  const deals = useDealsStore((s) => s.deals) || [];
  const tasks = useTasksStore((s) => s.tasks) || [];

  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [commandPaletteOpen]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const navMatches = NAV_COMMANDS.filter(
      (c) => !q || c.label.toLowerCase().includes(q)
    ).map((c) => ({
      kind: 'nav',
      key: `nav:${c.key}`,
      label: c.label,
      icon: c.icon,
      run: () => navigate(`/${c.tab}`),
    }));

    const actionMatches = ACTION_COMMANDS.filter(
      (c) => !q || c.label.toLowerCase().includes(q)
    ).map((c) => ({
      kind: 'action',
      key: `action:${c.key}`,
      label: c.label,
      icon: c.icon,
      run: () => c.run({ openModal }),
    }));

    let prospectMatches = [];
    let accountMatches = [];
    let dealMatches = [];
    let taskMatches = [];

    if (q) {
      prospectMatches = prospects
        .filter((p) => {
          const name = `${p.firstName || ''} ${p.lastName || ''} ${p.name || ''}`.toLowerCase();
          return (
            name.includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.company?.toLowerCase().includes(q) ||
            p.title?.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
        .map((p) => ({
          kind: 'prospect',
          key: `prospect:${p.id}`,
          label:
            (p.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : null) ||
            p.name ||
            p.email ||
            'Prospect',
          sub: [p.title, p.company].filter(Boolean).join(' • '),
          icon: Users,
          run: () => {
            navigate('/prospects');
            setSelectedProspect(p);
          },
        }));

      accountMatches = accounts
        .filter(
          (a) =>
            a.name?.toLowerCase().includes(q) ||
            a.domain?.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .map((a) => ({
          kind: 'account',
          key: `account:${a.id}`,
          label: a.name || a.domain || 'Account',
          sub: a.domain || '',
          icon: Building2,
          run: () => navigate('/prospects'),
        }));

      dealMatches = deals
        .filter(
          (d) =>
            d.name?.toLowerCase().includes(q) ||
            d.title?.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .map((d) => ({
          kind: 'deal',
          key: `deal:${d.id}`,
          label: d.name || d.title || 'Deal',
          sub: [d.stage, d.value ? `$${Number(d.value).toLocaleString()}` : null]
            .filter(Boolean)
            .join(' • '),
          icon: DollarSign,
          run: () => navigate('/prospects'),
        }));

      taskMatches = tasks
        .filter((t) => t.title?.toLowerCase().includes(q))
        .slice(0, 4)
        .map((t) => ({
          kind: 'task',
          key: `task:${t.id}`,
          label: t.title || 'Task',
          sub: t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : '',
          icon: CheckSquare,
          run: () => navigate('/tasks'),
        }));
    }

    const groups = [];
    if (prospectMatches.length)
      groups.push({ heading: 'Prospects', items: prospectMatches });
    if (accountMatches.length)
      groups.push({ heading: 'Accounts', items: accountMatches });
    if (dealMatches.length)
      groups.push({ heading: 'Deals', items: dealMatches });
    if (taskMatches.length)
      groups.push({ heading: 'Tasks', items: taskMatches });
    if (actionMatches.length)
      groups.push({ heading: 'Actions', items: actionMatches });
    if (navMatches.length)
      groups.push({ heading: 'Navigate', items: navMatches });

    return groups;
  }, [query, prospects, accounts, deals, tasks, navigate, openModal, setSelectedProspect]);

  const flatItems = useMemo(
    () => sections.flatMap((g) => g.items),
    [sections]
  );

  useEffect(() => {
    if (activeIdx >= flatItems.length) setActiveIdx(0);
  }, [flatItems.length, activeIdx]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeCommandPalette();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[activeIdx];
      if (item) {
        item.run();
        closeCommandPalette();
      }
    }
  };

  if (!commandPaletteOpen) return null;

  let renderedIdx = -1;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCommandPalette}
      />
      <div
        className="absolute left-1/2 top-[12%] -translate-x-1/2 w-full max-w-xl px-4"
        onKeyDown={handleKeyDown}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-elevated overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              placeholder="Search prospects, accounts, deals, tasks…"
              className="flex-1 py-4 text-base outline-none placeholder:text-slate-400 bg-transparent text-slate-900 dark:text-slate-100"
            />
            <kbd className="text-xs text-slate-400 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5">
              Esc
            </kbd>
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {sections.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No matches.
              </div>
            )}
            {sections.map((group) => (
              <div key={group.heading} className="px-2 pb-2">
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.heading}
                </div>
                {group.items.map((item) => {
                  renderedIdx += 1;
                  const isActive = renderedIdx === activeIdx;
                  const Icon = item.icon || Briefcase;
                  return (
                    <button
                      key={item.key}
                      onMouseEnter={() => setActiveIdx(renderedIdx)}
                      onClick={() => {
                        item.run();
                        closeCommandPalette();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                        isActive
                          ? 'bg-slate-100 dark:bg-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-900 dark:text-slate-100 truncate">
                          {highlight(item.label, query)}
                        </div>
                        {item.sub && (
                          <div className="text-xs text-slate-500 truncate">
                            {item.sub}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
            <span>↑↓ navigate · Enter select</span>
            <span>Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
