
import { Exercise, ExerciseContent, QuizQuestion, FillInBlankExercise, ScrambleExercise, ListeningExercise } from "../../types";

function isQuiz(c: ExerciseContent): c is QuizQuestion {
    return 'question' in c && 'options' in c && 'correctIndex' in c;
}

function isFillBlank(c: ExerciseContent): c is FillInBlankExercise {
    return 'sentence' in c && 'correctWord' in c && 'options' in c;
}

function isScramble(c: ExerciseContent): c is ScrambleExercise {
    return 'sentence' in c && 'scrambledParts' in c;
}

function isListening(c: ExerciseContent): c is ListeningExercise {
    return 'phrase' in c && 'answer' in c;
}

export const generateVoiceScript = (exercise: Exercise): string => {
    if (!exercise) return "";

    const content = exercise.content;

    switch (exercise.type) {
        case "pronunciation":
            if (content && typeof content === 'object' && 'text' in content && typeof (content as any).text === 'string') {
                return `Please repeat the following phrase: ${(content as any).text}`;
            }
            return "Pronunciation exercise: please repeat the phrase shown on screen.";

        case "quiz":
            if (isQuiz(content)) {
                const options = content.options.map((opt: string, i: number) => `Option ${i + 1}: ${opt}`).join(". ");
                return `Question: ${content.question}. ${options}.`;
            }
            return "Quiz exercise ready.";

        case "fill_blank":
            if (isFillBlank(content)) {
                const parts = content.sentence.split("____");
                return `Complete the sentence: ${parts[0]} blank ${parts[1] || ""}. Options are: ${content.options.join(", ")}.`;
            }
            return "Fill in the blank exercise ready.";

        case "scramble":
            if (isScramble(content)) {
                return `Arrange the following words to form a correct sentence: ${content.scrambledParts.join(", ")}.`;
            }
            return "Scramble exercise ready.";

        case "listening":
            if (isListening(content)) {
                return `Listen carefully. ${content.phrase || "This is a listening exercise."}`;
            }
            return "Listening exercise ready.";

        default:
            return "Ready for the next exercise.";
    }
};

export const normalizeAnswer = (input: string): string => {
    return input.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
}