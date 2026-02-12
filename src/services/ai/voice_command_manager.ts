export type VoiceCommandType =
    | 'NEXT'
    | 'PREVIOUS'
    | 'REPEAT_AUDIO'
    | 'SELECT_OPTION'
    | 'NO_MATCH';

export interface VoiceCommand {
    type: VoiceCommandType;
    payload?: any;
    originalTranscript: string;
}

const COMMAND_PATTERNS: Record<VoiceCommandType, RegExp[]> = {
    NEXT: [
        /next( slide| page| question)?/i,
        /continue/i,
        /go on/i,
        /move on/i,
        /skip/i,
        /start/i
    ],
    PREVIOUS: [
        /previous( slide| page)?/i,
        /go back/i,
        /back/i
    ],
    REPEAT_AUDIO: [
        /repeat( audio| that)?/i,
        /say (it |that )?again/i,
        /what did (you|he|she) say/i,
        /play (it )?again/i
    ],
    SELECT_OPTION: [
        /(select|choose|pick) (option |number )?(\d+)/i,
        /option (\d+)/i,
        /number (\d+)/i,
        /the (\w+) one/i // fuzzy matching might be hard here without NLP, keeping simple for now
    ],
    NO_MATCH: []
};

const NUMBER_WORDS: Record<string, number> = {
    'one': 1, 'first': 1,
    'two': 2, 'second': 2,
    'three': 3, 'third': 3,
    'four': 4, 'fourth': 4
};

export class VoiceCommandManager {
    static parseCommand(transcript: string): VoiceCommand {
        const lowerTranscript = transcript.toLowerCase().trim();

        // Check for specific intents
        for (const [type, patterns] of Object.entries(COMMAND_PATTERNS)) {
            if (type === 'NO_MATCH' || type === 'SELECT_OPTION') continue; // Handle separately

            for (const pattern of patterns) {
                if (pattern.test(lowerTranscript)) {
                    return { type: type as VoiceCommandType, originalTranscript: transcript };
                }
            }
        }

        // Handle Options (Numbers) specifically
        // Check for "Option 1", "Number 2" patterns
        for (const pattern of COMMAND_PATTERNS.SELECT_OPTION) {
            const match = lowerTranscript.match(pattern);
            if (match) {
                const numberStr = match[match.length - 1]; // last group is usually the number
                const number = parseInt(numberStr);
                if (!isNaN(number)) {
                    return { type: 'SELECT_OPTION', payload: number, originalTranscript: transcript };
                }
            }
        }

        // Check for word numbers ("Option one")
        for (const [word, num] of Object.entries(NUMBER_WORDS)) {
            if (lowerTranscript.includes(word)) {
                // Simple heuristic: if it says "one" or "first", assume option 1 if context implies? 
                // To be safe, let's require "option" or just enable strictly if meaningful.
                // For now, let's strictly check if the transcript *is* just the number word or contains "option {word}"
                if (lowerTranscript === word || lowerTranscript.includes(`option ${word}`) || lowerTranscript.includes(`number ${word}`)) {
                    return { type: 'SELECT_OPTION', payload: num, originalTranscript: transcript };
                }
            }
        }

        return { type: 'NO_MATCH', originalTranscript: transcript };
    }
}
