/**
 * Data quality utilities for the CRM.
 *
 * - validateProspect(p): returns { ok, issues: [{field, level, message}] }
 * - findDuplicateClusters(prospects): returns Array<{key, reason, prospects[]}>
 * - mergeProspects(survivor, others, updateProspect, deleteProspect):
 *     copies missing fields from `others` into `survivor`, then deletes
 *     `others`. Caller is responsible for migrating activities/tasks
 *     references upstream if needed.
 */

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const URL_RE = /^https?:\/\/[\w.-]+(\.[a-z]{2,})/i;
const LINKEDIN_RE = /linkedin\.com\/in\/[A-Za-z0-9_\-%]+/i;
const PHONE_RE = /^[+]?[\d\s().-]{7,}$/;

export function validateProspect(p) {
  const issues = [];
  if (!p) return { ok: false, issues: [{ field: '_root', level: 'error', message: 'Missing prospect' }] };

  const name = (p.firstName || p.name || '').trim();
  if (!name) issues.push({ field: 'firstName', level: 'error', message: 'Name is required' });

  if (p.email) {
    if (!EMAIL_RE.test(p.email))
      issues.push({ field: 'email', level: 'error', message: 'Invalid email format' });
  } else {
    issues.push({ field: 'email', level: 'warn', message: 'No email on file' });
  }

  if (p.linkedinUrl) {
    if (!URL_RE.test(p.linkedinUrl) || !LINKEDIN_RE.test(p.linkedinUrl))
      issues.push({ field: 'linkedinUrl', level: 'warn', message: 'LinkedIn URL looks unusual' });
  }

  if (p.phone && !PHONE_RE.test(p.phone))
    issues.push({ field: 'phone', level: 'warn', message: 'Phone format looks invalid' });

  if (!p.company) issues.push({ field: 'company', level: 'warn', message: 'No company' });
  if (!p.title) issues.push({ field: 'title', level: 'info', message: 'No title' });
  if (!p.owner && !p.ownerEmail)
    issues.push({ field: 'ownerEmail', level: 'warn', message: 'No owner assigned' });

  const errors = issues.filter((i) => i.level === 'error');
  return { ok: errors.length === 0, issues };
}

export function getValidationSummary(prospects) {
  let errorCount = 0;
  let warnCount = 0;
  for (const p of prospects) {
    const { issues } = validateProspect(p);
    for (const i of issues) {
      if (i.level === 'error') errorCount += 1;
      else if (i.level === 'warn') warnCount += 1;
    }
  }
  return { errorCount, warnCount };
}

function normEmail(e) {
  return (e || '').toLowerCase().trim();
}

function normName(p) {
  const full = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || '';
  return full.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function emailDomain(e) {
  const at = (e || '').lastIndexOf('@');
  return at === -1 ? '' : e.slice(at + 1).toLowerCase().trim();
}

export function findDuplicateClusters(prospects) {
  const byEmail = new Map();
  const byNameDomain = new Map();

  for (const p of prospects) {
    const email = normEmail(p.email);
    if (email) {
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email).push(p);
    }
    const name = normName(p);
    const dom = emailDomain(p.email);
    if (name && dom) {
      const key = `${name}@@${dom}`;
      if (!byNameDomain.has(key)) byNameDomain.set(key, []);
      byNameDomain.get(key).push(p);
    }
  }

  const clusters = [];
  const seenIds = new Set();

  for (const [email, group] of byEmail) {
    if (group.length < 2) continue;
    const ids = group.map((p) => p.id).sort().join('|');
    if (seenIds.has(ids)) continue;
    seenIds.add(ids);
    clusters.push({
      key: `email:${email}`,
      reason: 'Same email',
      detail: email,
      prospects: group,
    });
  }

  for (const [key, group] of byNameDomain) {
    if (group.length < 2) continue;
    const ids = group.map((p) => p.id).sort().join('|');
    if (seenIds.has(ids)) continue;
    seenIds.add(ids);
    const [name, dom] = key.split('@@');
    clusters.push({
      key: `namedomain:${key}`,
      reason: 'Same name + email domain',
      detail: `${name} @ ${dom}`,
      prospects: group,
    });
  }

  // Sort: largest clusters first, then by reason
  clusters.sort((a, b) => b.prospects.length - a.prospects.length);
  return clusters;
}

const COPY_FIELDS = [
  'email',
  'phone',
  'title',
  'company',
  'linkedinUrl',
  'website',
  'industry',
  'location',
  'notes',
];

/**
 * Merge `others` into `survivor`. Returns the merged updates applied
 * to the survivor (excluding owner/stage which are preserved).
 */
export async function mergeProspects(survivor, others, { updateProspect, deleteProspect }) {
  if (!survivor || !others?.length) return null;
  const merged = {};
  for (const field of COPY_FIELDS) {
    if (!survivor[field]) {
      const found = others.find((o) => o[field]);
      if (found) merged[field] = found[field];
    }
  }
  // Preserve newest createdAt
  const allCreated = [survivor, ...others]
    .map((p) => p.createdAt)
    .filter(Boolean)
    .sort();
  if (allCreated.length) merged.createdAt = allCreated[0];

  if (Object.keys(merged).length) {
    await updateProspect(survivor.id, merged);
  }
  for (const o of others) {
    await deleteProspect(o.id);
  }
  return merged;
}
