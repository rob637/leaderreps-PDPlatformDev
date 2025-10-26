// src/components/screens/AdminDataMaintenance.jsx
import React, { useMemo, useEffect } from 'react';

// ⬇️ UPDATE THIS IMPORT if your hook lives elsewhere.
//   examples:
//     import { useAppServices } from '../../services/useAppServices';
//     import { useAppServices } from '../../hooks/useAppServices';
import { useAppServices } from '../../services/useAppServices';

/** Turn the nested READING_CATALOG_SERVICE into flat table rows */
function flattenReadingCatalog(catalogObj) {
  if (!catalogObj || typeof catalogObj !== 'object') return [];
  const IGNORE = new Set(['_meta', 'catalog_data']);
  const rows = [];

  const preferredOrder = Array.isArray(catalogObj?._meta?.keys)
    ? catalogObj._meta.keys
    : null;

  const keys = preferredOrder ?? Object.keys(catalogObj).filter(k => !IGNORE.has(k));

  for (const category of keys) {
    if (IGNORE.has(category)) continue;
    const list = catalogObj[category];
    if (!Array.isArray(list)) continue;

    for (const item of list) {
      rows.push({
        category,
        id: item?.id ?? '',
        title: item?.title ?? '',
        author: item?.author ?? '',
        duration: item?.duration ?? '',
        complexity: item?.complexity ?? '',
        theme: item?.theme ?? '',
        focus: item?.focus ?? '',
      });
    }
  }
  return rows;
}

function Section({ title, children, note }) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        {note ? <div className="text-xs text-gray-500">{note}</div> : null}
      </div>
      {children}
    </div>
  );
}

function SimpleTable({ columns, rows, keyField }) {
  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="text-left px-3 py-2 font-medium text-gray-600">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-gray-500" colSpan={columns.length}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={row[keyField] ?? `${keyField}-${idx}`} className={idx % 2 ? 'bg-gray-50/40' : ''}>
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2 align-top">
                    {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDataMaintenance() {
  const { metadata, isAuthReady } = useAppServices();

  // quick diagnostics in the console to confirm what this screen sees
  useEffect(() => {
    console.log('[ADMIN] isAuthReady:', isAuthReady);
    console.log('[ADMIN] metadata keys:', Object.keys(metadata || {}));
    console.log('[ADMIN] READING_CATALOG_SERVICE keys:', Object.keys(metadata?.READING_CATALOG_SERVICE || {}));
    if (typeof window !== 'undefined') window.__lastAdminMeta = metadata; // handy for manual inspection
  }, [isAuthReady, metadata]);

  // pull sections from merged metadata (logs you posted show these keys present)
  const quickChallenges = metadata?.QUICK_CHALLENGE_CATALOG ?? [];
  const tiers           = metadata?.LEADERSHIP_TIERS ?? {};
  const targetReps      = metadata?.TARGET_REP_CATALOG ?? [];
  const scenarios       = metadata?.SCENARIO_CATALOG ?? [];

  // reading catalog: new merged location
  const readingRows = useMemo(
    () => flattenReadingCatalog(metadata?.READING_CATALOG_SERVICE),
    [metadata?.READING_CATALOG_SERVICE]
  );

  // normalize tiers for table rows
  const tierRows = useMemo(() => {
    const out = [];
    for (const [id, v] of Object.entries(tiers || {})) {
      out.push({
        id,
        name: v?.name ?? id,
        hex: v?.hex ?? '',
        icon: v?.icon ?? '',
        color: v?.color ?? '',
      });
    }
    return out;
  }, [tiers]);

  // table column configs
  const qcColumns = [
    { key: 'tier', header: 'Tier' },
    { key: 'rep', header: 'Prompt' },
  ];

  const tierColumns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'hex', header: 'Hex' },
    { key: 'icon', header: 'Icon' },
    { key: 'color', header: 'Color' },
  ];

  const repColumns = [
    { key: 'id', header: 'ID' },
    { key: 'linkedTier', header: 'Tier' },
    { key: 'linkedGoal', header: 'Goal' },
    { key: 'text', header: 'Text' },
  ];

  const scenarioColumns = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'persona', header: 'Persona' },
    { key: 'difficultyLevel', header: 'Difficulty' },
    { key: 'description', header: 'Description' },
  ];

  const readingColumns = [
    { key: 'category', header: 'Category' },
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Title' },
    { key: 'author', header: 'Author' },
    { key: 'duration', header: 'Min' },
    { key: 'complexity', header: 'Complexity' },
    { key: 'theme', header: 'Theme' },
    {
      key: 'focus',
      header: 'Focus',
      render: (val) => (Array.isArray(val) ? val.join(', ') : String(val ?? '')),
    },
  ];

  return (
    <div className="p-4 space-y-8" data-admin-meta-check>
      <header className="mb-2">
        <h1 className="text-2xl font-bold">Admin Data — Metadata Viewer</h1>
        <div className="text-xs text-gray-500 mt-1">
          Auth ready: {String(isAuthReady)} · Keys: {Object.keys(metadata || {}).join(', ')}
        </div>
      </header>

      <Section title="Quick Challenge Catalog" note={`${quickChallenges.length} items`}>
        <SimpleTable columns={qcColumns} rows={quickChallenges} keyField="rep" />
      </Section>

      <Section title="Leadership Tiers" note={`${tierRows.length} items`}>
        <SimpleTable columns={tierColumns} rows={tierRows} keyField="id" />
      </Section>

      <Section title="Target Rep Catalog" note={`${targetReps.length} items`}>
        <SimpleTable columns={repColumns} rows={targetReps} keyField="id" />
      </Section>

      <Section title="Scenario Catalog" note={`${scenarios.length} items`}>
        <SimpleTable columns={scenarioColumns} rows={scenarios} keyField="id" />
      </Section>

      <Section title="Reading Catalog (from READING_CATALOG_SERVICE)" note={`${readingRows.length} items`}>
        <SimpleTable columns={readingColumns} rows={readingRows} keyField="id" />
      </Section>
    </div>
  );
}
