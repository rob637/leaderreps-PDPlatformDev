// Thin wrapper around @google/genai Live API for Phase 0 spike.
//
// Connects with audio output, streams mic in, surfaces:
//   - text transcripts (input + output)
//   - audio output chunks (PCM16 @ 24kHz)
//   - latency events (first-audio-byte after a turn begins)
//   - turn boundaries (so we can flush playback on barge-in)
//
// Phase 0: API key in browser. Phase 2: replace with ephemeral-token mint via Cloud Function.

import { GoogleGenAI, Modality } from '@google/genai';

const MODEL = 'gemini-2.0-flash-live-001'; // native audio live model

export async function connectLiveSession({
  apiKey,                 // long-lived key (Phase 0 local-only fallback)
  ephemeralToken,         // short-lived token from mintSimulatorToken (preferred)
  systemInstruction,
  onAudioChunk,           // (ArrayBuffer) — PCM16 @ 24kHz
  onInputTranscript,      // (text, isFinal) — user speech transcribed
  onOutputTranscript,     // (text, isFinal) — model speech transcribed
  onTurnComplete,         // () — model finished its turn
  onInterrupted,          // () — user spoke over model; flush playback
  onError,                // (err)
  onOpen,                 // ()
  onClose,                // ()
}) {
  if (!apiKey && !ephemeralToken) {
    throw new Error('connectLiveSession requires either apiKey or ephemeralToken');
  }
  // Ephemeral tokens are issued under v1alpha and the client must use the
  // matching API surface; the long-lived key works with the default version.
  const ai = ephemeralToken
    ? new GoogleGenAI({ apiKey: ephemeralToken, httpOptions: { apiVersion: 'v1alpha' } })
    : new GoogleGenAI({ apiKey });

  const session = await ai.live.connect({
    model: MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
      },
    },
    callbacks: {
      onopen: () => onOpen?.(),
      onmessage: (msg) => {
        try {
          // Audio data
          const audioPart = msg.serverContent?.modelTurn?.parts?.find(
            (p) => p.inlineData?.mimeType?.startsWith('audio/pcm'),
          );
          if (audioPart?.inlineData?.data) {
            const buf = base64ToArrayBufferLocal(audioPart.inlineData.data);
            onAudioChunk?.(buf);
          }

          if (msg.serverContent?.inputTranscription?.text) {
            onInputTranscript?.(
              msg.serverContent.inputTranscription.text,
              !!msg.serverContent.inputTranscription.finished,
            );
          }
          if (msg.serverContent?.outputTranscription?.text) {
            onOutputTranscript?.(
              msg.serverContent.outputTranscription.text,
              !!msg.serverContent.outputTranscription.finished,
            );
          }
          if (msg.serverContent?.interrupted) onInterrupted?.();
          if (msg.serverContent?.turnComplete) onTurnComplete?.();
        } catch (err) {
          onError?.(err);
        }
      },
      onerror: (e) => onError?.(e),
      onclose: (e) => onClose?.(e),
    },
  });

  return {
    sendAudioChunk(arrayBuffer) {
      const b64 = arrayBufferToBase64Local(arrayBuffer);
      session.sendRealtimeInput({
        audio: { data: b64, mimeType: 'audio/pcm;rate=16000' },
      });
    },
    close() {
      try { session.close(); } catch (_) { /* ignore */ }
    },
  };
}

// Local copies to keep this module self-contained (audio.js also exports these).
function arrayBufferToBase64Local(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
function base64ToArrayBufferLocal(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
