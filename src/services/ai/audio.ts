export function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// --- AUDIO PLAYBACK WITH CANCELLATION & SPEED CONTROL ---

let playbackContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentGainNode: GainNode | null = null;

export const getAudioContext = (): AudioContext => {
    if (!playbackContext) {
        playbackContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (playbackContext.state === 'suspended') {
        playbackContext.resume();
    }
    return playbackContext;
};

/** Stop any currently playing audio */
export const stopCurrentAudio = () => {
    if (currentSource) {
        try { currentSource.stop(); } catch {}
        currentSource.disconnect();
        currentSource = null;
    }
    if (currentGainNode) {
        currentGainNode.disconnect();
        currentGainNode = null;
    }
};

/** Playback speed multiplier (0.5 = half speed, 1.0 = normal, 1.5 = fast) */
let playbackSpeed: number = 1.0;

export const setPlaybackSpeed = (speed: number) => {
    playbackSpeed = Math.max(0.5, Math.min(2.0, speed));
};

export const getPlaybackSpeed = (): number => playbackSpeed;

export const playRawAudio = async (base64Str: string) => {
    if (!base64Str) return;
    const ctx = getAudioContext();

    // Stop previous audio before playing new one
    stopCurrentAudio();

    try {
        const bytes = decode(base64Str);
        const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = playbackSpeed;

        const gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        currentSource = source;
        currentGainNode = gainNode;

        source.onended = () => {
            if (currentSource === source) {
                currentSource = null;
                currentGainNode = null;
            }
        };

        source.start(0);
    } catch (e) {
        console.error("Audio playback error:", e);
    }
};
