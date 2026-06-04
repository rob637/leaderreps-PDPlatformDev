// AudioWorklet processor for PCM16 capture at 16 kHz.
// Runs in the audio thread. Posts ArrayBuffers of PCM16 LE to the main thread.
//
// Loaded via `audioContext.audioWorklet.addModule('/pcm-processor.js')`.
// Lives in /public so Vite serves it untransformed at a stable URL.

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // 100ms chunks at 16 kHz = 1600 samples. Tune for latency vs overhead.
    this.bufferSize = 1600;
    this.buffer = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.writeIndex++] = channel[i];
      if (this.writeIndex >= this.bufferSize) {
        // Convert Float32 [-1,1] to PCM16 LE.
        const pcm = new Int16Array(this.bufferSize);
        for (let j = 0; j < this.bufferSize; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]));
          pcm[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
        this.writeIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
