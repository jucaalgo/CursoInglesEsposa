// AudioWorkletProcessor for PCM audio capture
// Runs in AudioWorkletGlobalScope — no ES module imports allowed.
// Converts Float32 samples to Int16 PCM, base64-encodes, and posts to main thread.

class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0];
    const len = channelData.length;

    // Convert Float32 → Int16
    const int16 = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Base64 encode
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    this.port.postMessage({
      type: 'pcm',
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    });

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);