
import { Exercise } from "../../types";

export const generateVoiceScript = (exercise: Exercise): string => {
    if (!exercise) return "";

    switch (exercise.type) {
        case "pronunciation":
            return `Please repeat the following phrase: ${exercise.content.text}`;

        case "quiz": {
            const options = exercise.content.options.map((opt: string, i: number) => `Option ${i + 1}: ${opt}`).join(". ");
            return `Question: ${exercise.content.question}. ${options}.`;
        }

        case "fill_blank": {
            const parts = exercise.content.sentence.split("____");
            return `Complete the sentence: ${parts[0]} blank ${parts[1] || ""}. Options are: ${exercise.content.options.join(", ")}.`;
        }

        case "scramble":
            // shuffle the words just for reading?? No, read the words to arrange
            return `Arrange the following words to form a correct sentence: ${exercise.content.scramble.join(", ")}.`;

        case "listening":
            return `Listen carefully. ${exercise.content.audioScript || "This is a listening exercise."}`;

        default:
            return "Ready for the next exercise.";
    }
};

export const normalizeAnswer = (input: string): string => {
    return input.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
}
