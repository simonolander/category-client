import {JsonDecoder} from "ts.data.json";
import {User, userDecoder} from "./User";
import {Guess, guessDecoder} from "./Guess";

export interface Game {
    readonly id: string;
    readonly participants: User[];
    readonly admin: User;
    readonly categoryId: string | null;
    readonly guesses: Guess[];
    readonly createdTime: number;
    readonly startedTime: number | null;
    readonly finishedTime: number | null;

    /**
     * The amount of time participants have to guess in milli-seconds
     */
    readonly guessTime: number;
}

export const gameDecoder = JsonDecoder.object<Game>({
    id: JsonDecoder.string,
    participants: JsonDecoder.array(userDecoder, "User[]"),
    admin: userDecoder,
    categoryId: JsonDecoder.nullable(JsonDecoder.string),
    guesses: JsonDecoder.array(guessDecoder, "Guess[]"),
    createdTime: JsonDecoder.number,
    startedTime: JsonDecoder.nullable(JsonDecoder.number),
    finishedTime: JsonDecoder.nullable(JsonDecoder.number),
    guessTime: JsonDecoder.number,
}, "Game");

export function getCurrentGuesser(game: Game): User | null {
    if (!game.startedTime) {
        return null
    }

    if (game.finishedTime) {
        return null
    }

    const remainingParticipants = getRemainingParticipants(game);
    if (remainingParticipants.length === 0) {
        return null
    }

    const latestGuess = getLatestGuess(game);
    if (!latestGuess) {
        return remainingParticipants[0]
    }

    for (let i = 0; i < remainingParticipants.length; ++i) {
        const participant = remainingParticipants[i];
        if (participant.id === latestGuess.guesser.id) {
            return remainingParticipants[(i + 1) % remainingParticipants.length]
        }
    }

    console.error("Latest guesser is not a participant", game)
    return remainingParticipants[0]
}

export function getLatestGuess(game: Game): Guess | undefined {
    return game.guesses[game.guesses.length - 1]
}

export function getRemainingGuessTime(game: Game, currentTime: number) {
    if (!game.startedTime) {
        return undefined
    }
    if (game.guesses.length === 0) {
        return game.startedTime - currentTime + game.guessTime
    }
    return game.guesses[game.guesses.length - 1].createdTime - currentTime + game.guessTime
}

export function getRemainingParticipants(game: Game) {
    const incorrectGuessers = game.guesses.filter(guess => !guess.categoryItem)
        .reduce((previousValue: {[key: string]: number}, {guesser: {id}}) => {
            previousValue[id] = (previousValue[id] || 0) + 1
            return previousValue
        }, {});
    return game.participants.filter(participant => !incorrectGuessers[participant.id])
}