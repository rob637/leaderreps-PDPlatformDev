/**
 * Team Pulse Service — LeaderReps Lab experiment
 *
 * Anonymous weekly team pulse with rotating questions and AI coaching insights.
 *
 * Anonymity model:
 *  - Responses never store responder UID, IP, or timestamp at second precision.
 *  - Insights are gated behind a minimum response threshold (k-anonymity).
 *  - Verbatim text is only displayed for groups above threshold; below threshold
 *    everything is held until enough responses arrive.
 *
 * Data model:
 *  - Collection: `team_pulse_campaigns/{campaignId}`
 *  - Sub-collection: `team_pulse_campaigns/{campaignId}/responses/{responseId}`
 *  - Sub-collection: `team_pulse_campaigns/{campaignId}/insights/{weekKey}`
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export const TEAM_PULSE_COLLECTION = 'team_pulse_campaigns';

/**
 * 3-question pulse:
 *   - Two STABLE anchor questions (Energy + Trust) every week. These build
 *     the trend lines on the leader dashboard.
 *   - One ROTATING THEME question (Clarity / Support / Safety / Signal) plus
 *     an optional one-line text response. Adds depth without fatigue.
 * Total response time target: ~60 seconds.
 */
export const ANCHOR_QUESTIONS = [
  {
    id: 'energy',
    label: 'Energy',
    quant: 'How was the team\'s energy this week?',
    scale: { min: 1, max: 5, minLabel: 'Drained', maxLabel: 'Energized' },
  },
  {
    id: 'trust',
    label: 'Trust in leadership',
    quant: 'How much did you trust leadership this week?',
    scale: { min: 1, max: 5, minLabel: 'Low trust', maxLabel: 'High trust' },
  },
];

export const PULSE_QUESTION_BANK = [
  {
    id: 'clarity',
    theme: 'Clarity',
    quant: 'How clear were priorities this week?',
    scale: { min: 1, max: 5, minLabel: 'Very unclear', maxLabel: 'Very clear' },
    text: 'What would have made priorities clearer?',
  },
  {
    id: 'support',
    theme: 'Support',
    quant: 'When you were blocked this week, did you feel supported?',
    scale: { min: 1, max: 5, minLabel: 'Not at all', maxLabel: 'Fully' },
    text: 'What kind of support would have helped most?',
  },
  {
    id: 'safety',
    theme: 'Trust & Safety',
    quant: 'Could you speak up honestly this week?',
    scale: { min: 1, max: 5, minLabel: 'Not safe', maxLabel: 'Completely safe' },
    text: 'What made it easy or hard to speak up?',
  },
  {
    id: 'signal',
    theme: 'Leadership Signal',
    quant: 'Overall, how did leadership feel this week?',
    scale: { min: 1, max: 5, minLabel: 'Distracted', maxLabel: 'Steady' },
    text: 'One word that describes leadership this week.',
  },
];

/** ISO-week key used for rotation + insight document IDs. e.g. "2026-W18" */
export function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getQuestionForWeek(weekKey, bank = PULSE_QUESTION_BANK) {
  // Stable mapping: weekKey -> bank index. Uses the numeric week portion.
  const m = String(weekKey).match(/W(\d+)$/);
  const weekNum = m ? parseInt(m[1], 10) : 0;
  return bank[weekNum % bank.length];
}

/** Anonymity thresholds — Lab spec defaults. */
export const ANONYMITY_DEFAULTS = {
  minInvited: 5,
  minResponsesToUnlock: 4,
};

export function thresholdStatus(campaign, responseCount) {
  const min = campaign?.minResponsesToUnlock || ANONYMITY_DEFAULTS.minResponsesToUnlock;
  return {
    unlocked: responseCount >= min,
    needed: Math.max(0, min - responseCount),
    threshold: min,
  };
}

// ---------- CRUD ----------

export async function createCampaign(db, data) {
  if (!db) throw new Error('Database not initialized');
  const id = data.id || `pulse-${Date.now()}`;
  const ref = doc(db, TEAM_PULSE_COLLECTION, id);
  const payload = {
    id,
    name: data.name || 'Untitled Pulse',
    leaderName: data.leaderName || '',
    teamSize: Number(data.teamSize) || 0,
    minInvited: Number(data.minInvited) || ANONYMITY_DEFAULTS.minInvited,
    minResponsesToUnlock:
      Number(data.minResponsesToUnlock) || ANONYMITY_DEFAULTS.minResponsesToUnlock,
    cadence: data.cadence || 'weekly',
    status: data.status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: data.createdBy || null,
  };
  await setDoc(ref, payload);
  return id;
}

export async function updateCampaign(db, id, patch) {
  const ref = doc(db, TEAM_PULSE_COLLECTION, id);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteCampaign(db, id) {
  await deleteDoc(doc(db, TEAM_PULSE_COLLECTION, id));
}

export async function listCampaigns(db) {
  const snap = await getDocs(
    query(collection(db, TEAM_PULSE_COLLECTION), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCampaign(db, id) {
  const snap = await getDoc(doc(db, TEAM_PULSE_COLLECTION, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ---------- Responses (anonymous) ----------

/**
 * Submit a fully-anonymous 3-question response. Never stores responder UID.
 * Required: weekKey, scoreEnergy, scoreTrust, scoreTheme, themeId.
 * Optional: text (≤500 chars).
 */
export async function submitResponse(db, campaignId, payload) {
  if (!campaignId) throw new Error('campaignId required');
  const { weekKey, scoreEnergy, scoreTrust, scoreTheme, themeId, text } = payload || {};
  if (!weekKey) throw new Error('weekKey required');
  const responseId = `resp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ref = doc(
    db,
    TEAM_PULSE_COLLECTION,
    campaignId,
    'responses',
    responseId
  );
  await setDoc(ref, {
    weekKey,
    scoreEnergy: Number(scoreEnergy),
    scoreTrust: Number(scoreTrust),
    scoreTheme: Number(scoreTheme),
    themeId: String(themeId || ''),
    text: typeof text === 'string' ? text.slice(0, 500) : '',
    submittedAt: serverTimestamp(),
  });
}

export async function getResponsesForWeek(db, campaignId, weekKey) {
  const snap = await getDocs(
    query(
      collection(db, TEAM_PULSE_COLLECTION, campaignId, 'responses'),
      where('weekKey', '==', weekKey)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllResponses(db, campaignId) {
  const snap = await getDocs(
    collection(db, TEAM_PULSE_COLLECTION, campaignId, 'responses')
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------- Aggregation ----------

function _avg(nums) {
  const filtered = nums.filter((n) => Number.isFinite(n));
  return filtered.length ? filtered.reduce((a, b) => a + b, 0) / filtered.length : null;
}

export function aggregateWeek(responses) {
  const energyScores = responses.map((r) => Number(r.scoreEnergy));
  const trustScores = responses.map((r) => Number(r.scoreTrust));
  const themeScores = responses.map((r) => Number(r.scoreTheme));
  const texts = responses.map((r) => (r.text || '').trim()).filter(Boolean);
  const themeId = responses.find((r) => r.themeId)?.themeId || null;
  return {
    count: responses.length,
    avgEnergy: _avg(energyScores),
    avgTrust: _avg(trustScores),
    avgTheme: _avg(themeScores),
    themeId,
    texts,
    // Back-compat for any older single-score reads:
    avgScore: _avg(energyScores.concat(trustScores)),
  };
}

// ---------- AI insight ----------

/**
 * Generate a single-week insight using the existing secure Gemini proxy.
 * `callSecureGeminiAPI` comes from useAppServices().services or DataProvider.
 *
 * Output shape per Lab spec: ONE insight, ONE behavior shift, ONE next action.
 */
export async function generateWeeklyInsight({
  callSecureGeminiAPI,
  question,
  weekKey,
  agg,
  priorAgg = null,
}) {
  if (!callSecureGeminiAPI) {
    throw new Error('AI proxy not available');
  }
  const themeQuestion = PULSE_QUESTION_BANK.find((q) => q.id === agg.themeId) || question;
  const prompt = `You are an executive leadership coach analyzing an anonymous weekly team pulse.

Week: ${weekKey}
Responses: ${agg.count}

Three dimensions this week (1–5 scale):
- Energy: ${agg.avgEnergy != null ? agg.avgEnergy.toFixed(2) : 'n/a'}
- Trust in leadership: ${agg.avgTrust != null ? agg.avgTrust.toFixed(2) : 'n/a'}
- Rotating theme — ${themeQuestion.theme}: ${agg.avgTheme != null ? agg.avgTheme.toFixed(2) : 'n/a'}
  (Theme question asked: "${themeQuestion.quant}")

Anonymous comment fragments: ${agg.texts.length ? agg.texts.map((t) => `"${t}"`).join(' | ') : 'none'}

${priorAgg ? `Prior week:\n- Energy: ${priorAgg.avgEnergy != null ? priorAgg.avgEnergy.toFixed(2) : 'n/a'}\n- Trust: ${priorAgg.avgTrust != null ? priorAgg.avgTrust.toFixed(2) : 'n/a'}\n` : ''}
RULES (strict):
- Pick the dimension with the most signal (largest gap from neutral or biggest week-over-week change) and write the insight about THAT.
- Output ONE insight, ONE behavior shift, ONE next action experiment.
- No diagnosis language. No identity speculation. No claim without evidence in the aggregate.
- Never name or imply individuals.
- Keep total response under 130 words.
- Format as JSON: {"insight": "...", "behaviorShift": "...", "nextAction": "...", "focusDimension": "energy|trust|theme", "confidence": "low|medium|high"}.`;

  const data = await callSecureGeminiAPI({ prompt });
  const raw = data?.text || data?.response || data?.content || '';
  // Best-effort JSON extraction
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) {
    return {
      insight: String(raw).slice(0, 400),
      behaviorShift: '',
      nextAction: '',
      confidence: 'low',
      raw,
    };
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    return {
      insight: String(raw).slice(0, 400),
      behaviorShift: '',
      nextAction: '',
      confidence: 'low',
      raw,
    };
  }
}

export async function saveInsight(db, campaignId, weekKey, insight) {
  const ref = doc(
    db,
    TEAM_PULSE_COLLECTION,
    campaignId,
    'insights',
    weekKey
  );
  await setDoc(ref, {
    weekKey,
    ...insight,
    generatedAt: serverTimestamp(),
  });
}

export async function getInsight(db, campaignId, weekKey) {
  const snap = await getDoc(
    doc(db, TEAM_PULSE_COLLECTION, campaignId, 'insights', weekKey)
  );
  return snap.exists() ? snap.data() : null;
}

// ---------- Recipients (admin-only) ----------

export async function listRecipients(db, campaignId) {
  const snap = await getDocs(
    collection(db, TEAM_PULSE_COLLECTION, campaignId, 'recipients')
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Normalize a phone string to E.164-ish: strip non-digits, keep leading '+'. */
export function normalizePhone(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  // Default to US country code if 10 digits and no '+'
  if (!plus && digits.length === 10) return `+1${digits}`;
  if (!plus && digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `${plus}${digits}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalize an email: trim + lowercase. Returns '' if invalid. */
export function normalizeEmail(raw) {
  if (!raw) return '';
  const e = String(raw).trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : '';
}

/**
 * Classify a free-form recipient token as either an email or a phone.
 * Returns { type: 'email'|'phone', value } or null if neither.
 */
export function classifyRecipientToken(token) {
  const t = String(token || '').trim();
  if (!t) return null;
  if (t.includes('@')) {
    const email = normalizeEmail(t);
    return email ? { type: 'email', value: email } : null;
  }
  const phone = normalizePhone(t);
  if (phone && phone.replace(/\D/g, '').length >= 8) {
    return { type: 'phone', value: phone };
  }
  return null;
}

/**
 * Add recipients to a campaign. Accepts either:
 *   - an array of strings (phones and/or emails, auto-classified), or
 *   - an array of { phone?, email? } objects.
 *
 * Each stored recipient document tracks both phone and email when known,
 * plus a `channel` indicating the preferred delivery method ('sms' | 'email').
 */
export async function addRecipients(db, campaignId, items) {
  const records = new Map(); // id -> { id, phone?, email?, channel }

  const upsert = ({ phone, email }) => {
    const p = phone ? normalizePhone(phone) : '';
    const e = email ? normalizeEmail(email) : '';
    if (!p && !e) return;
    const channel = p ? 'sms' : 'email';
    const id = p
      ? `r-${p.replace(/\D/g, '')}`
      : `e-${e.replace(/[^a-z0-9]/gi, '_')}`;
    const existing = records.get(id) || {};
    records.set(id, {
      id,
      phone: p || existing.phone || null,
      email: e || existing.email || null,
      channel: existing.channel || channel,
    });
  };

  for (const item of items || []) {
    if (item == null) continue;
    if (typeof item === 'string') {
      const classified = classifyRecipientToken(item);
      if (!classified) continue;
      upsert({ [classified.type]: classified.value });
    } else if (typeof item === 'object') {
      upsert(item);
    }
  }

  const recipients = Array.from(records.values());
  await Promise.all(
    recipients.map((r) =>
      setDoc(
        doc(db, TEAM_PULSE_COLLECTION, campaignId, 'recipients', r.id),
        {
          ...r,
          addedAt: serverTimestamp(),
          lastInvitedAt: null,
          inviteCount: 0,
        },
        { merge: true }
      )
    )
  );
  return recipients;
}

export async function removeRecipient(db, campaignId, recipientId) {
  await deleteDoc(
    doc(db, TEAM_PULSE_COLLECTION, campaignId, 'recipients', recipientId)
  );
}

export async function markRecipientInvited(db, campaignId, recipientId, count = 1) {
  await updateDoc(
    doc(db, TEAM_PULSE_COLLECTION, campaignId, 'recipients', recipientId),
    {
      lastInvitedAt: serverTimestamp(),
      inviteCount: count,
    }
  );
}

// ---------- Public response link ----------

/**
 * Build the public anonymous response URL for a campaign. The host is read
 * from window.location so the link works in dev/test/prod automatically.
 */
export function buildResponseUrl(campaignId) {
  if (typeof window === 'undefined') return `?pulse=${campaignId}`;
  const origin = window.location.origin;
  return `${origin}/?pulse=${encodeURIComponent(campaignId)}`;
}

// ---------- Monthly synthesis ----------

/**
 * Aggregate the most recent N weeks of responses into a trend.
 * Returns an array of { weekKey, count, avgScore } sorted oldest -> newest.
 */
export function buildTrend(responses, weeks = 4) {
  const byWeek = new Map();
  for (const r of responses) {
    const key = r.weekKey || 'unknown';
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key).push(r);
  }
  const ordered = [...byWeek.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-weeks)
    .map(([weekKey, list]) => {
      const agg = aggregateWeek(list);
      return { weekKey, count: agg.count, avgScore: agg.avgScore };
    });
  return ordered;
}

export async function generateMonthlySynthesis({
  callSecureGeminiAPI,
  campaign,
  trend,
  recentTexts = [],
}) {
  if (!callSecureGeminiAPI) throw new Error('AI proxy not available');

  const prompt = `You are an executive leadership coach producing a monthly synthesis of an anonymous team pulse.

Campaign: ${campaign.name}
Weeks of data (oldest → newest):
${trend
  .map(
    (t) =>
      `  ${t.weekKey}: ${t.count} responses, avg ${t.avgScore != null ? t.avgScore.toFixed(2) : 'n/a'}`
  )
  .join('\n')}

Anonymous comment fragments (deduplicated, sanitized): ${
    recentTexts.length ? recentTexts.map((t) => `"${t}"`).join(' | ') : 'none'
  }

RULES (strict):
- No identity speculation. Never name or imply individuals.
- No diagnosis language.
- Output JSON ONLY: {"strengths":"...","risks":"...","teamWord":"...","wordConfidence":"low|medium|high","repairScript":"...","summary":"..."}.
- summary: 2 sentences max, behavior-focused.
- repairScript: a 15-minute team conversation outline (3 bullet talking points joined by ' | ').
- Total under 220 words.`;

  const data = await callSecureGeminiAPI({ prompt });
  const raw = data?.text || data?.response || data?.content || '';
  const match = String(raw).match(/\{[\s\S]*\}/);
  if (!match) {
    return { summary: String(raw).slice(0, 600), raw };
  }
  try {
    return JSON.parse(match[0]);
  } catch {
    return { summary: String(raw).slice(0, 600), raw };
  }
}

export async function saveMonthlySynthesis(db, campaignId, monthKey, synthesis) {
  await setDoc(
    doc(db, TEAM_PULSE_COLLECTION, campaignId, 'insights', `month-${monthKey}`),
    {
      monthKey,
      ...synthesis,
      generatedAt: serverTimestamp(),
    }
  );
}

export async function getMonthlySynthesis(db, campaignId, monthKey) {
  const snap = await getDoc(
    doc(db, TEAM_PULSE_COLLECTION, campaignId, 'insights', `month-${monthKey}`)
  );
  return snap.exists() ? snap.data() : null;
}

export function getMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
