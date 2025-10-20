// ---- Normalize model & choose correct path segment ----
const raw = String((payload.model || DEFAULT_MODEL)).trim();

// Full publisher path? (e.g. publishers/google/models/...)
const publisherMatch = raw.match(/^publishers\/[^/]+\/models\/.+$/i);

let modelPath;
if (publisherMatch) {
  // Use publisher path verbatim (preserve case except normalize leading/trailing ws)
  modelPath = raw.replace(/\s+/g, ''); // no spaces
} else {
  // Strip ANY number of leading models/ or tunedModels/ prefixes (case-insensitive)
  const cleaned = raw.replace(/^(?:models\/|tunedmodels\/)+/i, '').trim();

  // Is the original referring to a tuned model?
  const isTuned = /^tunedmodels\//i.test(raw);

  // Stock IDs are lowercase; tuned IDs keep their case
  const id = isTuned ? cleaned : cleaned.toLowerCase();

  modelPath = isTuned ? `tunedModels/${id}` : `models/${id}`;
}

// never send model in body
delete payload.model;
