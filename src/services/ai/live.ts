import { Modality, LiveServerMessage } from "@google/genai";
import { getClient } from "./client";
import { decode, decodeAudioData, encode } from "./audio";

export class LiveSession {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sessionPromise: Promise<any> | null = null;
    private inputContext: AudioContext;
    private outputContext: AudioContext;
    private inputSource: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private nextStartTime: number = 0;
    private onMessageCallback: (text: string | null, isInterrupted: boolean) => void;
    private stream: MediaStream | null = null;

    constructor(onMessage: (text: string | null, isInterrupted: boolean) => void) {
        this.onMessageCallback = onMessage;
        this.inputContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 16000 });
        this.outputContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
    }

    async connect(systemInstruction: string, voiceName: string = 'Puck') {
        const client = getClient();
        if (this.outputContext.state === 'suspended') await this.outputContext.resume();
        if (this.inputContext.state === 'suspended') await this.inputContext.resume();

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Updated to latest live model
        const config = {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: async () => {
                    if (this.stream) this.startAudioStream(this.stream);
                },
                onmessage: async (message: LiveServerMessage) => {
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
        this.sessionPromise = client.live.connect(config);
        await this.sessionPromise;
    }

    private startAudioStream(stream: MediaStream) {
        this.inputSource = this.inputContext.createMediaStreamSource(stream);
        this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);
        this.processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = this.createBlob(inputData);
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            }
        };
        this.inputSource.connect(this.processor);
        this.processor.connect(this.inputContext.destination);
    }

    private async playAudio(base64: string) {
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
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
        };
    }

    async disconnect() {
        if (this.inputSource) this.inputSource.disconnect();
        if (this.processor) this.processor.disconnect();
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.sessionPromise) {
            try {
                const session = await this.sessionPromise;
                session.close();
            } catch (_e) { }
        }
        await this.inputContext.close();
        await this.outputContext.close();
    }
}
