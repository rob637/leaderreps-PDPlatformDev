// Mic capture (16kHz PCM16) + speaker playback queue (24kHz PCM16).
// Returns a small controller; caller wires it into a Live session.

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export async function createAudioPipeline({ onInputChunk }) {
  // Separate contexts so we can pick exact sample rates per direction.
  const inputCtx = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: INPUT_SAMPLE_RATE,
  });
  const outputCtx = new (window.AudioContext || window.webkitAudioContext)({
    sampleRate: OUTPUT_SAMPLE_RATE,
  });

  await inputCtx.audioWorklet.addModule('/pcm-processor.js');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  const source = inputCtx.createMediaStreamSource(stream);
  const worklet = new AudioWorkletNode(inputCtx, 'pcm-processor');

  worklet.port.onmessage = (event) => {
    onInputChunk(event.data); // ArrayBuffer of PCM16 LE
  };

  source.connect(worklet);
  // Do NOT connect worklet to destination — we don't want mic echo locally.

  // --- Output playback queue ---
  // Incoming chunks are PCM16 LE @ 24kHz. We decode to Float32 and play sequentially.
  let nextStartTime = 0;
  const activeSources = new Set();

  function playChunk(arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return;
    const pcm16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x8000;
    }
    const audioBuffer = outputCtx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32, 0);

    const src = outputCtx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(outputCtx.destination);

    const now = outputCtx.currentTime;
    const startAt = Math.max(now, nextStartTime);
    src.start(startAt);
    nextStartTime = startAt + audioBuffer.duration;

    activeSources.add(src);
    src.onended = () => activeSources.delete(src);
  }

  function flushPlayback() {
    // Hard-stop any queued audio (used for barge-in).
    activeSources.forEach((src) => {
      try { src.stop(); } catch (_) { /* ignore */ }
    });
    activeSources.clear();
    nextStartTime = outputCtx.currentTime;
  }

  async function close() {
    flushPlayback();
    try { worklet.disconnect(); } catch (_) {}
    try { source.disconnect(); } catch (_) {}
    stream.getTracks().forEach((t) => t.stop());
    try { await inputCtx.close(); } catch (_) {}
    try { await outputCtx.close(); } catch (_) {}
  }

  return { playChunk, flushPlayback, close };
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
