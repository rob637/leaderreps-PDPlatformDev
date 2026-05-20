// src/components/conditioning/polishTranscript.js
// Lightly cleans a raw spoken transcript into well-punctuated sentences
// using the existing Gemini proxy. Fails open: returns the raw text on any
// error so the user never loses what they said.

const POLISH_SYSTEM_INSTRUCTION = `You clean up raw speech-to-text transcripts.
Rules:
- Add proper punctuation, capitalization, and paragraph breaks.
- Remove filler words (um, uh, like, you know, sort of, kind of) and obvious false starts.
- Fix obvious transcription errors only when meaning is unambiguous.
- Preserve the speaker's voice, tone, and meaning. Do NOT rephrase, summarize, expand, or add new ideas.
- Do NOT add greetings, sign-offs, headings, bullet points, or markdown.
- Output ONLY the cleaned text. No preamble, no quotes, no commentary.`;

/**
 * Polish a raw speech transcript via the Gemini proxy.
 *
 * @param {string} rawText
 * @param {object} options
 * @param {Function} options.callSecureGeminiAPI - from useAppServices()
 * @param {string}   [options.model]              - optional Gemini model id
 * @param {number}   [options.timeoutMs=8000]    - hard timeout
 * @returns {Promise<string>} the polished text (or rawText on failure)
 */
export async function polishTranscript(rawText, { callSecureGeminiAPI, model, timeoutMs = 8000 } = {}) {
  const raw = (rawText || '').trim();
  if (!raw) return '';
  // Skip the round-trip for trivially short input.
  if (raw.length < 8) return raw;
  if (typeof callSecureGeminiAPI !== 'function') return raw;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: raw }] }],
    systemInstruction: { parts: [{ text: POLISH_SYSTEM_INSTRUCTION }] },
    generationConfig: { temperature: 0.2 },
  };
  if (model) payload.model = model;

  try {
    const result = await Promise.race([
      callSecureGeminiAPI(payload),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('polish-timeout')), timeoutMs)
      ),
    ]);
    const polished = (
      result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    ).trim();
    if (!polished) return raw;
    // Strip wrapping quotes the model sometimes adds.
    return polished.replace(/^["'\u201C\u2018]+|["'\u201D\u2019]+$/g, '').trim() || raw;
  } catch (err) {
    if (typeof console !== 'undefined') {
      console.warn('[polishTranscript] failed, using raw text:', err?.message || err);
    }
    return raw;
  }
}

export default polishTranscript;
