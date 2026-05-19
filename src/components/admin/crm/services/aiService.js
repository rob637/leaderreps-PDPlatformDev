/**
 * CRM AI Service
 * -----------------------------------------------------------------------------
 * Thin wrapper around the geminiProxy Cloud Function that powers
 * sales-pipeline-specific AI features:
 *   - composeOutreach({ prospect, channel, tone, intent, context })
 *   - summarizeActivities({ prospect, activities, maxBullets })
 *   - analyzeSentiment({ text }) -> { label, score, rationale }
 *   - scoreProspect({ prospect, activities, deal }) -> { score, tier, factors }
 *   - nextBestAction({ prospect, activities, deal }) -> { action, why, when }
 *
 * All functions return parsed objects (never raw text). Errors throw.
 */

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const GEMINI_PROXY_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/geminiProxy`;

const DEFAULT_MODEL = 'gemini-2.0-flash';

async function callGemini({ prompt, systemInstruction, model = DEFAULT_MODEL }) {
  const res = await fetch(GEMINI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, systemInstruction, model }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AI request failed (${res.status}): ${body || res.statusText}`);
  }
  const data = await res.json();
  if (!data?.success || typeof data.text !== 'string') {
    throw new Error(`AI returned invalid payload: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data.text;
}

/** Pull the first JSON object/array from a free-form response. */
function extractJson(text) {
  if (!text) return null;
  // Strip ```json ... ``` fences if present.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  // Find first {...} or [...] block.
  const match = body.match(/[{[][\s\S]*[}\]]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function describeProspect(p = {}) {
  if (!p) return '(no prospect)';
  const lines = [
    p.firstName || p.lastName
      ? `Name: ${[p.firstName, p.lastName].filter(Boolean).join(' ')}`
      : null,
    p.title ? `Title: ${p.title}` : null,
    p.company ? `Company: ${p.company}` : null,
    p.industry ? `Industry: ${p.industry}` : null,
    p.location ? `Location: ${p.location}` : null,
    p.email ? `Email: ${p.email}` : null,
    p.linkedin ? `LinkedIn: ${p.linkedin}` : null,
    p.notes ? `Notes: ${String(p.notes).slice(0, 400)}` : null,
  ].filter(Boolean);
  return lines.join('\n') || '(no details available)';
}

function describeActivities(activities = [], { limit = 15 } = {}) {
  if (!activities?.length) return '(no recorded activities)';
  return activities
    .slice(0, limit)
    .map((a) => {
      const when = a.createdAt
        ? new Date(a.createdAt).toISOString().slice(0, 10)
        : 'unknown date';
      const type = a.type || a.activityType || 'note';
      const text = (a.note || a.subject || a.content || '').toString().slice(0, 280);
      return `- [${when}] ${type}: ${text}`;
    })
    .join('\n');
}

// ---------- 1. Compose outreach ----------
export async function composeOutreach({
  prospect,
  channel = 'email',
  tone = 'warm-professional',
  intent = 'introduce',
  context = '',
  senderName = '',
} = {}) {
  const systemInstruction =
    'You are a senior B2B sales copywriter for a leadership development company. ' +
    'Write concise, personalized outreach. Avoid clichés ("Hope this finds you well"), ' +
    'avoid superlatives, and never invent facts about the recipient. ' +
    'Output STRICT JSON only.';

  const channelGuide =
    channel === 'linkedin'
      ? 'Channel: LinkedIn DM. Maximum 600 characters. No subject line.'
      : 'Channel: Email. Subject line under 60 characters. Body 4-6 short sentences.';

  const intentGuide = {
    introduce: 'First-touch introduction. Lead with relevance, end with a soft ask.',
    followup: 'Follow-up after silence. Acknowledge prior touch, offer fresh value.',
    book_meeting: 'Direct ask for a 20-minute meeting. Propose two specific time windows.',
    reengage: 'Re-engage cold contact. New angle, no guilt-tripping.',
    proposal: 'Send proposal next-steps. Confirm scope and ask to lock a review call.',
  }[intent] || 'Outreach.';

  const prompt = `Recipient:\n${describeProspect(prospect)}

Sender: ${senderName || 'a sales executive at LeaderReps'}
Tone: ${tone}
${channelGuide}
Intent: ${intentGuide}
${context ? `Additional context: ${context}` : ''}

Return JSON with this exact shape:
{
  "subject": "string (empty for linkedin)",
  "body": "string",
  "rationale": "1-sentence explanation of the personalization angle used"
}`;

  const text = await callGemini({ prompt, systemInstruction });
  const parsed = extractJson(text);
  if (!parsed || typeof parsed.body !== 'string') {
    throw new Error('AI compose returned malformed payload.');
  }
  return {
    subject: parsed.subject || '',
    body: parsed.body,
    rationale: parsed.rationale || '',
  };
}

// ---------- 2. Summarize activities ----------
export async function summarizeActivities({
  prospect,
  activities = [],
  maxBullets = 5,
} = {}) {
  const systemInstruction =
    'You summarize sales activity history. Be factual, avoid speculation. ' +
    'Output STRICT JSON only.';

  const prompt = `Prospect:
${describeProspect(prospect)}

Activity history (most recent first):
${describeActivities(activities)}

Return JSON:
{
  "headline": "1 sentence overview of the relationship status",
  "bullets": ["up to ${maxBullets} short factual bullets, no emojis"],
  "openQuestions": ["up to 3 questions a rep should ask to move the deal forward"]
}`;

  const text = await callGemini({ prompt, systemInstruction });
  const parsed = extractJson(text);
  if (!parsed) throw new Error('AI summarize returned malformed payload.');
  return {
    headline: parsed.headline || '',
    bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, maxBullets) : [],
    openQuestions: Array.isArray(parsed.openQuestions)
      ? parsed.openQuestions.slice(0, 3)
      : [],
  };
}

// ---------- 3. Analyze sentiment ----------
export async function analyzeSentiment({ text } = {}) {
  if (!text || !text.trim()) {
    return { label: 'neutral', score: 0, rationale: 'No text provided.' };
  }
  const systemInstruction =
    'You classify sentiment of B2B sales replies. Output STRICT JSON only.';
  const prompt = `Reply text:
"""${String(text).slice(0, 2000)}"""

Return JSON:
{
  "label": "positive|neutral|negative",
  "score": -1.0 to 1.0,
  "intent": "interested|objection|not_now|unsubscribe|out_of_office|question|other",
  "rationale": "1 short sentence"
}`;
  const out = await callGemini({ prompt, systemInstruction });
  const parsed = extractJson(out);
  if (!parsed) throw new Error('AI sentiment returned malformed payload.');
  const label = ['positive', 'neutral', 'negative'].includes(parsed.label)
    ? parsed.label
    : 'neutral';
  const scoreNum = Number(parsed.score);
  return {
    label,
    score: Number.isFinite(scoreNum) ? Math.max(-1, Math.min(1, scoreNum)) : 0,
    intent: parsed.intent || 'other',
    rationale: parsed.rationale || '',
  };
}

// ---------- 4. Lead score ----------
export async function scoreProspect({
  prospect,
  activities = [],
  deal = null,
} = {}) {
  const systemInstruction =
    'You score B2B sales leads on a 0-100 scale based on engagement and fit. ' +
    'Output STRICT JSON only.';
  const dealLine = deal
    ? `Deal: stage=${deal.stage} amount=$${deal.amount || 0} closeDate=${deal.closeDate || 'n/a'}`
    : 'No deal record.';
  const prompt = `Prospect:
${describeProspect(prospect)}

${dealLine}

Activity history:
${describeActivities(activities)}

Return JSON:
{
  "score": 0-100,
  "tier": "hot|warm|cold",
  "factors": [
    {"label": "short factor name", "weight": "+|-", "detail": "1 short sentence"}
  ]
}`;
  const out = await callGemini({ prompt, systemInstruction });
  const parsed = extractJson(out);
  if (!parsed) throw new Error('AI score returned malformed payload.');
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
  const tier = ['hot', 'warm', 'cold'].includes(parsed.tier)
    ? parsed.tier
    : score >= 70
    ? 'hot'
    : score >= 40
    ? 'warm'
    : 'cold';
  return {
    score,
    tier,
    factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 6) : [],
  };
}

// ---------- 5. Next best action ----------
export async function nextBestAction({
  prospect,
  activities = [],
  deal = null,
} = {}) {
  const systemInstruction =
    'You are a sales coach recommending the single most valuable next action. ' +
    'Output STRICT JSON only.';
  const dealLine = deal
    ? `Deal: stage=${deal.stage} amount=$${deal.amount || 0} closeDate=${deal.closeDate || 'n/a'}`
    : 'No deal record.';
  const prompt = `Prospect:
${describeProspect(prospect)}

${dealLine}

Activity history:
${describeActivities(activities)}

Return JSON:
{
  "action": "send_email|send_linkedin|call|book_meeting|wait|enrich|hand_off",
  "title": "5-7 word title for the action",
  "why": "1-2 sentence rationale grounded in the activity history",
  "when": "today|this_week|next_week",
  "draft": "optional 1-2 sentence opener if applicable, else empty string"
}`;
  const out = await callGemini({ prompt, systemInstruction });
  const parsed = extractJson(out);
  if (!parsed) throw new Error('AI nextBestAction returned malformed payload.');
  return {
    action: parsed.action || 'wait',
    title: parsed.title || '',
    why: parsed.why || '',
    when: parsed.when || 'this_week',
    draft: parsed.draft || '',
  };
}

/**
 * Suggest enrichment values for a prospect using only the fields already
 * present (name, title, company, location). Returns a partial prospect
 * object containing ONLY fields the caller should consider applying.
 * Never overwrites — caller must decide which suggestions to merge.
 */
export async function enrichProspect({ prospect } = {}) {
  if (!prospect) throw new Error('prospect is required');
  const sys =
    'You are a B2B research assistant. Based on the partial contact info ' +
    'provided, infer plausible values for missing fields. NEVER fabricate ' +
    'a specific email address or phone number. Return strict JSON.';
  const prompt = `Contact:
${describeProspect(prospect)}

Respond with JSON in this shape:
{
  "industry": "string or empty",
  "companySize": "string or empty (e.g. 11-50, 51-200, 201-1000, 1000+)",
  "seniority": "IC|Manager|Director|VP|C-Level|Owner|empty",
  "department": "string or empty (e.g. Sales, HR, Operations)",
  "summary": "1-sentence professional summary",
  "talkingPoints": ["string", "..."],
  "notes": "string or empty"
}`;
  const text = await callGemini({ prompt, systemInstruction: sys });
  const parsed = extractJson(text) || {};
  const out = {};
  for (const key of [
    'industry',
    'companySize',
    'seniority',
    'department',
    'summary',
    'notes',
  ]) {
    if (parsed[key] && typeof parsed[key] === 'string') out[key] = parsed[key];
  }
  if (Array.isArray(parsed.talkingPoints))
    out.talkingPoints = parsed.talkingPoints.filter(
      (t) => typeof t === 'string'
    );
  return out;
}

export default {
  composeOutreach,
  summarizeActivities,
  analyzeSentiment,
  scoreProspect,
  nextBestAction,
  enrichProspect,
};
