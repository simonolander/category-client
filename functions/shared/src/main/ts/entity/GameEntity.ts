import {JsonDecoder} from "ts.data.json";
import {User, userDecoder} from "./User";
import {guessDecoder, GuessEntity} from "./GuessEntity";
import {categoryDecoder, CategoryEntity} from "./CategoryEntity";

export const minimumGuessTime = 1000
export const maximumGuessTime = 1000 * 60 * 60 * 24 * 7

export interface GameEntity {
    readonly id: string;
    readonly participants: User[];
    readonly admin: User;
    readonly category: CategoryEntity | null;
    readonly guesses: GuessEntity[];
    readonly createdTime: number;
    readonly startedTime: number | null;
    readonly finishedTime: number | null;

    /**
     * The amount of time participants have to guess in milli-seconds
     */
    readonly guessTime: number;

    readonly nextGameId: string | null;
}

export const gameDecoder = JsonDecoder.object<GameEntity>({
    id: JsonDecoder.string,
    participants: JsonDecoder.array(userDecoder, "User[]"),
    admin: userDecoder,
    category: JsonDecoder.nullable(categoryDecoder),
    guesses: JsonDecoder.array(guessDecoder, "Guess[]"),
    createdTime: JsonDecoder.number,
    startedTime: JsonDecoder.nullable(JsonDecoder.number),
    finishedTime: JsonDecoder.nullable(JsonDecoder.number),
    guessTime: JsonDecoder.number,
    nextGameId: JsonDecoder.nullable(JsonDecoder.string),
}, "GameEntity");
