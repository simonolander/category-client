import {JsonDecoder} from "ts.data.json";
import {User, userDecoder} from "./User";
import {CategoryItem, categoryItemDecoder} from "./CategoryItem";

export type GuessError = "already guessed" | "wrong" | "timed out"
export const guessErrorDecoder: JsonDecoder.Decoder<GuessError> = JsonDecoder.oneOf(
    [
        JsonDecoder.isExactly("already guessed"),
        JsonDecoder.isExactly("wrong"),
        JsonDecoder.isExactly("timed out"),
    ],
    "GuessStatus"
)

export interface Guess {
    readonly id: string;
    readonly value: string | null;
    readonly guesser: User;
    readonly createdTime: number;
    readonly categoryItem: CategoryItem | null
    readonly error: GuessError | null
}

export const guessDecoder: JsonDecoder.Decoder<Guess> = JsonDecoder.object({
    id: JsonDecoder.string,
    value: JsonDecoder.nullable(JsonDecoder.string),
    guesser: userDecoder,
    createdTime: JsonDecoder.number,
    categoryItem: JsonDecoder.nullable(categoryItemDecoder),
    error: JsonDecoder.nullable(guessErrorDecoder),
}, "Guess");

export function isGuessCorrect(guess: Guess): boolean {
    return !guess.error
}