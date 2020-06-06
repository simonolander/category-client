import {JsonDecoder} from "ts.data.json";
import {User, userDecoder} from "./User";
import {CategoryItem, categoryItemDecoder} from "./CategoryItem";

export type GuessError = "duplicate" | "incorrect" | "timed out"
export const guessErrorDecoder: JsonDecoder.Decoder<GuessError> = JsonDecoder.oneOf(
    [
        JsonDecoder.isExactly("duplicate"),
        JsonDecoder.isExactly("incorrect"),
        JsonDecoder.isExactly("timed out"),
    ],
    "GuessError"
)

export interface GuessEntity {
    readonly id: string;
    readonly value: string | null;
    readonly guesser: User;
    readonly createdTime: number;
    readonly categoryItem: CategoryItem | null
    readonly error: GuessError | null
}

export const guessDecoder: JsonDecoder.Decoder<GuessEntity> = JsonDecoder.object({
    id: JsonDecoder.string,
    value: JsonDecoder.nullable(JsonDecoder.string),
    guesser: userDecoder,
    createdTime: JsonDecoder.number,
    categoryItem: JsonDecoder.nullable(categoryItemDecoder),
    error: JsonDecoder.nullable(guessErrorDecoder),
}, "Guess");