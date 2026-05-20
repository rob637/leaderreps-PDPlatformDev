/**
 * Migration: Create crm_accounts + crm_deals from existing corporate_prospects
 *
 * What it does:
 * 1. Groups all `corporate_prospects` by company (or email domain when company
 *    is missing) and creates one `crm_accounts/{accountId}` per group.
 * 2. Updates each prospect with `accountId` pointing to its account.
 * 3. For every prospect that has a numeric `value` and is not in a closed
 *    pipeline stage, creates a `crm_deals/{dealId}` linked to that account
 *    and prospect (primaryContactId).
 * 4. Updates account rollups: contactCount, openDealCount, openDealValue.
 *
 * Idempotent: prospects that already have an `accountId` are reattached to
 * that existing account; deals are only created when none exists for the
 * (accountId, primaryContactId) pair.
 *
 * Usage:
 *   ENV=dev  node scripts/migrations/migrate-accounts-deals.cjs        # dry-run
 *   ENV=dev  node scripts/migrations/migrate-accounts-deals.cjs --apply
 *   ENV=test node scripts/migrations/migrate-accounts-deals.cjs --apply
 *   ENV=prod node scripts/migrations/migrate-accounts-deals.cjs --apply
 */

const admin = require('firebase-admin');
const path = require('path');

const ENV = process.env.ENV || 'dev';
const APPLY = process.argv.includes('--apply');

const SERVICE_ACCOUNT_FILE = {
  dev: 'leaderreps-pd-platform-firebase-adminsdk.json',
  test: 'leaderreps-test-firebase-adminsdk.json',
  prod: 'leaderreps-prod-firebase-adminsdk.json',
}[ENV];

if (!SERVICE_ACCOUNT_FILE) {
  console.error(`Unknown ENV "${ENV}". Use dev | test | prod.`);
  process.exit(1);
}

const serviceAccount = require(path.resolve(__dirname, '..', '..', SERVICE_ACCOUNT_FILE));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ---------- helpers (mirror src/components/admin/crm/config/dealMeta.js) ----------

function extractDomain(str) {
  if (!str) return '';
  const s = String(str).trim().toLowerCase();
  if (s.includes('@')) return s.split('@').pop().split('?')[0];
  return s
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
}

function normalizeCompanyName(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/&/g, 'and')
    .replace(
      /\b(inc|incorporated|llc|llp|ltd|limited|corp|corporation|co|company|gmbh|sa|plc|pllc)\.?\b/g,
      ''
    )
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'msn.com', 'live.com', 'me.com', 'protonmail.com',
]);

const STAGE_PROBABILITY = {
  prospect: 10, qualified: 25, proposal: 50, negotiation: 75,
  closed_won: 100, closed_lost: 0,
};

const OPEN_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation', 'new', 'contacted'];

function pipelineStageToDealStage(stage) {
  // Map legacy prospect.stage values to deal.stage values
  if (!stage) return 'prospect';
  if (stage === 'won' || stage === 'closed_won') return 'closed_won';
  if (stage === 'lost' || stage === 'closed_lost') return 'closed_lost';
  if (['proposal', 'negotiation', 'qualified'].includes(stage)) return stage;
  return 'prospect';
}

// ---------- migration ----------

async function migrate() {
  console.log(`\n=== Accounts + Deals migration ===`);
  console.log(`Env: ${ENV}   Mode: ${APPLY ? 'APPLY (writes!)' : 'DRY-RUN'}\n`);

  // Load existing accounts so we can detect already-migrated state.
  const existingAccountsSnap = await db.collection('crm_accounts').get();
  const existingAccounts = existingAccountsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  console.log(`Existing accounts: ${existingAccounts.length}`);

  // Load existing deals to avoid duplicates.
  const existingDealsSnap = await db.collection('crm_deals').get();
  const existingDealKeys = new Set(
    existingDealsSnap.docs.map(
      (d) => `${d.data().accountId || ''}|${d.data().primaryContactId || ''}`
    )
  );
  console.log(`Existing deals: ${existingDealsSnap.size}`);

  // Load prospects.
  const prospectsSnap = await db.collection('corporate_prospects').get();
  console.log(`Prospects: ${prospectsSnap.size}\n`);

  // --- Group prospects into account buckets ---
  const buckets = new Map(); // key -> { name, domain, ownerEmail, prospects: [] }

  for (const doc of prospectsSnap.docs) {
    const p = { id: doc.id, ...doc.data() };
    const company = (p.company || '').trim();
    const emailDomain = extractDomain(p.email);
    const websiteDomain = extractDomain(p.companyWebsite || p.website || '');
    const domain =
      websiteDomain ||
      (emailDomain && !FREE_EMAIL_DOMAINS.has(emailDomain) ? emailDomain : '');

    let key;
    let bucketName;
    let bucketDomain;
    if (company) {
      key = `name:${normalizeCompanyName(company)}`;
      bucketName = company;
      bucketDomain = domain;
    } else if (domain) {
      key = `domain:${domain}`;
      bucketName = domain;
      bucketDomain = domain;
    } else {
      // No grouping signal; one-off account named after the prospect.
      const fallback =
        [p.firstName, p.lastName].filter(Boolean).join(' ') || p.name || p.email || p.id;
      key = `solo:${p.id}`;
      bucketName = fallback;
      bucketDomain = '';
    }

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        name: bucketName,
        domain: bucketDomain,
        ownerEmail: p.ownerEmail || p.owner || null,
        existingAccountId: p.accountId || null,
        prospects: [],
      });
    }
    const b = buckets.get(key);
    if (!b.existingAccountId && p.accountId) b.existingAccountId = p.accountId;
    if (!b.ownerEmail && (p.ownerEmail || p.owner)) {
      b.ownerEmail = p.ownerEmail || p.owner;
    }
    b.prospects.push(p);
  }

  console.log(`Bucketed into ${buckets.size} accounts.\n`);

  // --- Reconcile each bucket against existing accounts ---
  let accountsCreated = 0;
  let accountsReused = 0;
  let prospectsLinked = 0;
  let dealsCreated = 0;
  const accountWriteOps = [];
  const prospectWriteOps = [];
  const dealWriteOps = [];

  for (const bucket of buckets.values()) {
    let accountId = bucket.existingAccountId;
    let account = null;

    if (accountId) {
      account = existingAccounts.find((a) => a.id === accountId);
    }
    if (!account) {
      // Try to match an existing account by name/domain
      account = existingAccounts.find((a) => {
        if (
          bucket.domain &&
          a.domain &&
          a.domain.toLowerCase() === bucket.domain.toLowerCase()
        ) {
          return true;
        }
        return (
          bucket.name &&
          normalizeCompanyName(a.name) === normalizeCompanyName(bucket.name)
        );
      });
      if (account) accountId = account.id;
    }

    if (!account) {
      // Create new account
      const ref = db.collection('crm_accounts').doc();
      accountId = ref.id;
      const newAccount = {
        name: bucket.name,
        domain: bucket.domain || '',
        industry: '',
        employeeCount: null,
        website: bucket.domain ? `https://${bucket.domain}` : '',
        location: '',
        linkedin: '',
        description: '',
        tier: 'standard',
        ownerEmail: bucket.ownerEmail || null,
        tags: [],
        contactCount: 0,
        openDealCount: 0,
        openDealValue: 0,
        lastActivityAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'migration:accounts-deals',
      };
      account = { id: accountId, ...newAccount };
      existingAccounts.push(account);
      accountWriteOps.push({ type: 'set', ref, data: newAccount });
      accountsCreated++;
    } else {
      accountsReused++;
    }

    // Link prospects to account; build deals where applicable.
    let openDealCount = account.openDealCount || 0;
    let openDealValue = account.openDealValue || 0;

    for (const p of bucket.prospects) {
      if (p.accountId !== accountId) {
        prospectWriteOps.push({
          type: 'update',
          ref: db.collection('corporate_prospects').doc(p.id),
          data: { accountId, updatedAt: new Date().toISOString() },
        });
        prospectsLinked++;
      }

      // Create a deal if prospect has a value and there's no deal yet
      // for (accountId, prospectId).
      const dealKey = `${accountId}|${p.id}`;
      const value = Number(p.value) || 0;
      if (value > 0 && !existingDealKeys.has(dealKey)) {
        const stage = pipelineStageToDealStage(p.stage);
        const ref = db.collection('crm_deals').doc();
        const dealName =
          (p.company ? `${p.company} — ` : '') +
          ([p.firstName, p.lastName].filter(Boolean).join(' ') ||
            p.name ||
            'Opportunity');
        const newDeal = {
          name: dealName,
          accountId,
          primaryContactId: p.id,
          stage,
          amount: value,
          probability: STAGE_PROBABILITY[stage] ?? 10,
          closeDate: null,
          ownerEmail: p.ownerEmail || p.owner || bucket.ownerEmail || null,
          source: p.source || '',
          description: '',
          lostReason: '',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          closedAt:
            stage === 'closed_won' || stage === 'closed_lost'
              ? new Date().toISOString()
              : null,
          createdBy: 'migration:accounts-deals',
        };
        dealWriteOps.push({ type: 'set', ref, data: newDeal });
        existingDealKeys.add(dealKey);
        dealsCreated++;
        if (OPEN_STAGES.includes(stage) || stage === 'prospect') {
          openDealCount++;
          openDealValue += value;
        }
      }
    }

    // Schedule rollup update on the account.
    accountWriteOps.push({
      type: 'update',
      ref: db.collection('crm_accounts').doc(accountId),
      data: {
        contactCount: bucket.prospects.length,
        openDealCount,
        openDealValue,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // --- Report ---
  console.log('--- Plan ---');
  console.log(`  Accounts to create:  ${accountsCreated}`);
  console.log(`  Accounts to reuse:   ${accountsReused}`);
  console.log(`  Prospects to link:   ${prospectsLinked}`);
  console.log(`  Deals to create:     ${dealsCreated}`);
  console.log(`  Total writes:        ${accountWriteOps.length + prospectWriteOps.length + dealWriteOps.length}`);

  if (!APPLY) {
    console.log('\nDRY-RUN complete. Re-run with --apply to commit.');
    return;
  }

  // --- Commit in chunks of 400 ---
  console.log('\nCommitting writes...');
  const allOps = [...accountWriteOps, ...prospectWriteOps, ...dealWriteOps];
  const CHUNK = 400;
  for (let i = 0; i < allOps.length; i += CHUNK) {
    const batch = db.batch();
    const slice = allOps.slice(i, i + CHUNK);
    for (const op of slice) {
      if (op.type === 'set') batch.set(op.ref, op.data);
      else if (op.type === 'update') batch.update(op.ref, op.data);
    }
    await batch.commit();
    console.log(`  Committed ${Math.min(i + CHUNK, allOps.length)} / ${allOps.length}`);
  }
  console.log('\nMigration complete.');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
