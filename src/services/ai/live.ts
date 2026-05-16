import { Modality, LiveServerMessage, GoogleGenAI } from "@google/genai";
import { getLiveApiKey } from "./client";
import { decode, decodeAudioData } from "./audio";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// Vite resolves the worklet file as a URL for audioWorklet.addModule()
const PCM_PROCESSOR_URL = new URL("../../worklets/pcm-processor.js", import.meta.url);

export class LiveSession {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sessionPromise: Promise<any> | null = null;
    private inputContext: AudioContext;
    private outputContext: AudioContext;
    private inputSource: MediaStreamAudioSourceNode | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private nextStartTime: number = 0;
    private onMessageCallback: (text: string | null, isInterrupted: boolean) => void;
    private stream: MediaStream | null = null;
    private idleTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;
    private client: GoogleGenAI | null = null;

    constructor(onMessage: (text: string | null, isInterrupted: boolean) => void) {
        this.onMessageCallback = onMessage;
        this.inputContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
        this.outputContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
    }

    private resetIdleTimer() {
        if (this.idleTimer !== null) {
            clearTimeout(this.idleTimer);
        }
        this.idleTimer = setTimeout(() => {
            this.disconnect();
        }, IDLE_TIMEOUT_MS);
    }

    private clearIdleTimer() {
        if (this.idleTimer !== null) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    async connect(systemInstruction: string, voiceName: string = 'Puck') {
        if (this.destroyed) return;

        // Get API key via authenticated endpoint instead of env var
        const apiKey = await getLiveApiKey();
        this.client = new GoogleGenAI({ apiKey });

        if (this.outputContext.state === 'suspended') await this.outputContext.resume();
        if (this.inputContext.state === 'suspended') await this.inputContext.resume();

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const config = {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: async () => {
                    if (this.destroyed) return;
                    if (this.stream) await this.startAudioStream(this.stream);
                    this.resetIdleTimer();
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (this.destroyed) return;
                    this.resetIdleTimer();

                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) this.playAudio(base64Audio);
                    const transcript = message.serverContent?.modelTurn?.parts?.[0]?.text;
                    const interrupted = !!message.serverContent?.interrupted;
                    if (transcript || interrupted) this.onMessageCallback(transcript || null, interrupted);
                    if (interrupted) {
                        this.nextStartTime = 0;
                        this.onMessageCallback("Interrupted", true);
                    }
                },
                onclose: () => { },
                onerror: (err: unknown) => console.error("Live Session Error", err)
            },
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: systemInstruction,
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
                }
            }
        };
        this.sessionPromise = this.client.live.connect(config);
        await this.sessionPromise;
    }

    private async startAudioStream(stream: MediaStream) {
        this.inputSource = this.inputContext.createMediaStreamSource(stream);

        // Load AudioWorklet processor (replaces deprecated ScriptProcessorNode)
        try {
            await this.inputContext.audioWorklet.addModule(PCM_PROCESSOR_URL);
            this.workletNode = new AudioWorkletNode(this.inputContext, 'pcm-processor');

            this.workletNode.port.onmessage = (event: MessageEvent) => {
                if (this.destroyed) return;
                const { data, mimeType } = event.data as { data: string; mimeType: string };
                if (this.sessionPromise) {
                    this.sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: { data, mimeType } });
                    });
                }
            };

            this.inputSource.connect(this.workletNode);
            this.workletNode.connect(this.inputContext.destination);
        } catch (err) {
            // Fallback to ScriptProcessorNode if AudioWorklet is not supported
            console.warn("AudioWorklet not available, falling back to ScriptProcessorNode", err);
            this.startLegacyAudioStream(stream);
        }
    }

    /** Legacy fallback for browsers without AudioWorklet support */
    private startLegacyAudioStream(stream: MediaStream) {
        this.inputSource = this.inputContext.createMediaStreamSource(stream);
        const processor = this.inputContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
            if (this.destroyed) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = this.createBlob(inputData);
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
        };
        this.inputSource.connect(processor);
        processor.connect(this.inputContext.destination);
        // Store as workletNode for consistent cleanup (type doesn't matter for disconnect)
        this.workletNode = null;
        // We need to track the legacy processor separately for cleanup
        (this as any)._legacyProcessor = processor;
    }

    private async playAudio(base64: string) {
        if (this.destroyed) return;
        this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
        const audioBuffer = await decodeAudioData(decode(base64), this.outputContext, 24000, 1);
        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputContext.destination);
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
    }

    private createBlob(data: Float32Array) {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        return {
            data: this.encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    private encode(bytes: Uint8Array) {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async disconnect() {
        if (this.destroyed) return;

        this.destroyed = true;
        this.clearIdleTimer();

        // Clean up AudioWorklet node
        if (this.workletNode) {
            this.workletNode.port.onmessage = null;
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        // Clean up legacy processor if fallback was used
        const legacyProcessor = (this as any)._legacyProcessor as ScriptProcessorNode | undefined;
        if (legacyProcessor) {
            legacyProcessor.onaudioprocess = null;
            legacyProcessor.disconnect();
            delete (this as any)._legacyProcessor;
        }
        if (this.inputSource) {
            this.inputSource.disconnect();
            this.inputSource = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.sessionPromise) {
            try {
                const session = await this.sessionPromise;
                session.close();
            } catch (_e) { /* already closed */ }
            this.sessionPromise = null;
        }
        if (this.inputContext.state !== 'closed') {
            await this.inputContext.close().catch(() => {});
        }
        if (this.outputContext.state !== 'closed') {
            await this.outputContext.close().catch(() => {});
        }
    }

    async destroy() {
        await this.disconnect();
    }
}