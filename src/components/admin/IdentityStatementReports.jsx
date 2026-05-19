// src/components/admin/IdentityStatementReports.jsx
// Trainer view of all leaders' Identity Statements.
// Mirrors the structure of LeaderProfileReports.jsx.
//
// Source: modules/{uid}/daily_practice/current  (field: leadershipIdentity)
//   { admiredLeaders: [{name, qualities[]}], qualities: [], statement: '', intentions: [{scenario, intention}], updatedAt, createdAt }

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import {
  Loader, Download, Search, ChevronUp, ChevronDown, X,
  User, Heart, Sparkles, Target, MessageSquare,
} from 'lucide-react';

// ============================================
// CONSTANTS
// ============================================
const COMPLETENESS_FIELDS = [
  // 5 dimensions, each weighted 20%
  'hasAdmiredLeaders',
  'hasQualities',
  'hasStatement',
  'hasIntentions',
  'hasMultipleIntentions',
];

const SORTABLE_COLUMNS = [
  { key: 'userName', label: 'Leader' },
  { key: 'admiredCount', label: 'Admired Leaders' },
  { key: 'qualitiesCount', label: 'My Qualities' },
  { key: 'intentionsCount', label: 'Intentions' },
  { key: 'completeness', label: 'Complete %' },
  { key: 'updatedAt', label: 'Updated' },
];

// ============================================
// HELPERS
// ============================================
const truncate = (str, n = 80) => {
  if (!str) return '';
  return str.length > n ? `${str.slice(0, n - 1)}\u2026` : str;
};

const computeCompleteness = (id) => {
  const checks = {
    hasAdmiredLeaders: (id.admiredLeaders || []).length >= 1,
    hasQualities: (id.qualities || []).length >= 3,
    hasStatement: typeof id.statement === 'string' && id.statement.trim().length > 0,
    hasIntentions: (id.intentions || []).length >= 1,
    hasMultipleIntentions: (id.intentions || []).length >= 3,
  };
  const passed = COMPLETENESS_FIELDS.filter(k => checks[k]).length;
  return Math.round((passed / COMPLETENESS_FIELDS.length) * 100);
};

const formatTs = (ts) => {
  if (!ts) return 'N/A';
  try {
    const d = ts?.toDate?.() || new Date(ts);
    return d.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

// ============================================
// DETAIL MODAL
// ============================================
const IdentityDetailModal = ({ row, onClose }) => {
  if (!row) return null;
  const id = row.identity || {};

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-teal-ink text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{row.userName}</h2>
              <p className="text-white/80 text-sm">{row.userEmail}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-white/80">
                <span>Updated {formatTs(id.updatedAt)}</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Statement */}
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Identity Statement
            </h3>
            {id.statement ? (
              <blockquote className="text-base bg-corporate-teal/5 border-l-4 border-corporate-teal p-4 rounded italic text-corporate-navy dark:text-white">
                &ldquo;{id.statement}&rdquo;
              </blockquote>
            ) : (
              <p className="text-sm text-slate-400 italic">Not yet articulated.</p>
            )}
          </div>

          {/* Qualities */}
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Qualities I Want to Embody ({(id.qualities || []).length})
            </h3>
            {(id.qualities || []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {id.qualities.map((q, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-corporate-teal/10 text-corporate-teal-ink text-sm font-medium">
                    {q}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">None listed.</p>
            )}
          </div>

          {/* Admired Leaders */}
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" /> Admired Leaders ({(id.admiredLeaders || []).length})
            </h3>
            {(id.admiredLeaders || []).length > 0 ? (
              <div className="space-y-2">
                {id.admiredLeaders.map((l, i) => (
                  <div key={i} className="p-3 rounded border border-slate-200 dark:border-slate-700">
                    <div className="font-medium text-corporate-navy dark:text-white">{l.name || 'Unnamed'}</div>
                    {Array.isArray(l.qualities) && l.qualities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {l.qualities.map((q, j) => (
                          <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {q}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">None listed.</p>
            )}
          </div>

          {/* Intentions */}
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" /> Intentions ({(id.intentions || []).length})
            </h3>
            {(id.intentions || []).length > 0 ? (
              <div className="space-y-2">
                {id.intentions.map((it, i) => (
                  <div key={i} className="p-3 rounded border border-slate-200 dark:border-slate-700">
                    {it.scenario && (
                      <div className="text-xs uppercase text-slate-500 mb-1">When: {it.scenario}</div>
                    )}
                    <div className="text-sm">{it.intention || <span className="italic text-slate-400">(no intention text)</span>}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">None listed.</p>
            )}
          </div>

          <div className="text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
            <span>User ID: {row.userId?.slice(0, 12)}...</span>
            <span>Created {formatTs(id.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// SORTABLE TABLE HEADER
// ============================================
const SortableHeader = ({ column, currentSort, onSort }) => {
  const isActive = currentSort.key === column.key;
  const isAsc = currentSort.direction === 'asc';
  return (
    <button
      onClick={() => onSort(column.key)}
      className="flex items-center gap-1 hover:text-corporate-teal-ink transition-colors group"
    >
      <span>{column.label}</span>
      <div className="flex flex-col">
        <ChevronUp className={`w-3 h-3 -mb-1 ${isActive && isAsc ? 'text-corporate-teal-ink' : 'text-slate-300 group-hover:text-slate-400'}`} />
        <ChevronDown className={`w-3 h-3 ${isActive && !isAsc ? 'text-corporate-teal-ink' : 'text-slate-300 group-hover:text-slate-400'}`} />
      </div>
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const IdentityStatementReports = () => {
  const { db } = useAppServices();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const results = await Promise.all(users.map(async (u) => {
          try {
            const dpRef = doc(db, `modules/${u.id}/daily_practice/current`);
            const dpSnap = await getDoc(dpRef);
            if (!dpSnap.exists()) return null;
            const dp = dpSnap.data();
            const identity = dp.leadershipIdentity || null;
            // Skip if user has nothing meaningful
            if (!identity) return null;
            const isEmpty =
              !(identity.statement && identity.statement.trim()) &&
              (!Array.isArray(identity.qualities) || identity.qualities.length === 0) &&
              (!Array.isArray(identity.admiredLeaders) || identity.admiredLeaders.length === 0) &&
              (!Array.isArray(identity.intentions) || identity.intentions.length === 0);
            if (isEmpty) return null;
            return {
              userId: u.id,
              userName: u.displayName || u.name || u.email || 'Unknown',
              userEmail: u.email || '',
              identity,
            };
          } catch {
            return null;
          }
        }));

        setRows(results.filter(Boolean));
      } catch (err) {
        console.error('Error fetching identity statements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [db]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const processedRows = useMemo(() => {
    const enriched = rows.map(r => {
      const id = r.identity || {};
      return {
        ...r,
        admiredCount: (id.admiredLeaders || []).length,
        qualitiesCount: (id.qualities || []).length,
        intentionsCount: (id.intentions || []).length,
        statement: id.statement || '',
        completeness: computeCompleteness(id),
        updatedAt: id.updatedAt || null,
      };
    });

    const term = searchTerm.toLowerCase();
    const filtered = term
      ? enriched.filter(r =>
          r.userName.toLowerCase().includes(term) ||
          r.userEmail.toLowerCase().includes(term) ||
          r.statement.toLowerCase().includes(term))
      : enriched;

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'updatedAt') {
        aVal = aVal?.toDate?.()?.getTime?.() || (aVal ? new Date(aVal).getTime() : 0);
        bVal = bVal?.toDate?.()?.getTime?.() || (bVal ? new Date(bVal).getTime() : 0);
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return filtered;
  }, [rows, searchTerm, sortConfig]);

  const exportCSV = () => {
    const headers = [
      'Name', 'Email',
      'Admired Leaders Count', 'Admired Leader Names',
      'Qualities Count', 'Qualities',
      'Intentions Count', 'Intentions',
      'Statement', 'Completeness %', 'Updated',
    ];
    const csv = [
      headers.join(','),
      ...processedRows.map(r => {
        const id = r.identity || {};
        const admiredNames = (id.admiredLeaders || []).map(l => l.name).filter(Boolean).join('; ');
        const qualities = (id.qualities || []).join('; ');
        const intentions = (id.intentions || [])
          .map(i => `${i.scenario || ''}\u2192${i.intention || ''}`).join(' | ');
        return [
          `"${r.userName}"`,
          `"${r.userEmail}"`,
          r.admiredCount,
          `"${admiredNames.replace(/"/g, '""')}"`,
          r.qualitiesCount,
          `"${qualities.replace(/"/g, '""')}"`,
          r.intentionsCount,
          `"${intentions.replace(/"/g, '""')}"`,
          `"${(r.statement || '').replace(/"/g, '""')}"`,
          r.completeness,
          formatTs(r.updatedAt),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `identity_statements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">Identity Statements</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {processedRows.length} leader{processedRows.length !== 1 ? 's' : ''} have started an identity statement &bull; Click any row for full detail
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, email, or statement text..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 bg-white dark:bg-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                {SORTABLE_COLUMNS.map(col => (
                  <th key={col.key} className="px-4 py-3">
                    <SortableHeader column={col} currentSort={sortConfig} onSort={handleSort} />
                  </th>
                ))}
                <th className="px-4 py-3">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {processedRows.map(r => (
                <tr
                  key={r.userId}
                  onClick={() => setSelectedRow(r)}
                  className="hover:bg-corporate-teal/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-corporate-navy" />
                      </div>
                      <div>
                        <div className="font-medium text-corporate-navy dark:text-white">{r.userName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      {r.admiredCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Sparkles className="w-3.5 h-3.5 text-corporate-teal" />
                      {r.qualitiesCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Target className="w-3.5 h-3.5 text-corporate-orange" />
                      {r.intentionsCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            r.completeness >= 80 ? 'bg-green-500' :
                            r.completeness >= 50 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${r.completeness}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        r.completeness >= 80 ? 'text-green-600' :
                        r.completeness >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {r.completeness}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {formatTs(r.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-sm italic max-w-md">
                    {r.statement ? `\u201c${truncate(r.statement, 90)}\u201d` : <span className="text-slate-400">No statement yet</span>}
                  </td>
                </tr>
              ))}
              {processedRows.length === 0 && (
                <tr>
                  <td colSpan={SORTABLE_COLUMNS.length + 1} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No leaders have started an identity statement yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow && (
        <IdentityDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
};

export default IdentityStatementReports;
