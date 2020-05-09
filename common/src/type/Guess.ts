import {User, userDecoder} from "./User";
import {JsonDecoder} from "ts.data.json";
import {CategoryItem, categoryItemDecoder} from "./CategoryItem";

export interface Guess {
    readonly id: string;
    readonly value: string | null;
    readonly guesser: User;
    readonly createdTime: number;
    readonly categoryItem: CategoryItem | null
}

export const guessDecoder = JsonDecoder.object<Guess>({
    id: JsonDecoder.string,
    value: JsonDecoder.nullable(JsonDecoder.string),
    guesser: userDecoder,
    createdTime: JsonDecoder.number,
    categoryItem: JsonDecoder.nullable(categoryItemDecoder)
}, "Guess");
