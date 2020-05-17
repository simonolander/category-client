import {JsonDecoder} from "ts.data.json";
import {Category, Guess, guessDecoder, isGuessCorrect, User, userDecoder} from "main";

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

export function isGameFinished(game: Game): boolean {
    return !!game.finishedTime
}

export function isGameStarted(game: Game): boolean {
    return !!game.startedTime
}

export function isGameRunning(game: Game): boolean {
    return isGameStarted(game) && !isGameFinished(game)
}

export function getCurrentGuesser(game: Game): User | null {
    if (!isGameRunning(game)) {
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

export function getLatestGuess(game: Game, userId?: string): Guess | undefined {
    if (!userId) {
        return game.guesses[game.guesses.length - 1]
    }

    return game.guesses.filter(guess => guess.guesser.id === userId).pop()
}

export function getRemainingGuessTime(game: Game, currentTime: number) {
    if (!game.startedTime) {
        return game.guessTime
    }
    if (game.guesses.length === 0) {
        return game.startedTime - currentTime + game.guessTime
    }
    return game.guesses[game.guesses.length - 1].createdTime - currentTime + game.guessTime
}

export function getRemainingParticipants(game: Game) {
    const incorrectGuessers = game.guesses.filter(guess => !isGuessCorrect(guess))
        .reduce((previousValue: { [key: string]: number }, {guesser: {id}}) => {
            previousValue[id] = (previousValue[id] || 0) + 1
            return previousValue
        }, {});
    return game.participants.filter(participant => !incorrectGuessers[participant.id])
}

export function getParticipantMap(game: Game): { [key: string]: User } {
    return game.participants.reduce((map: { [key: string]: User }, participant) => {
        map[participant.id] = participant
        return map
    }, {})
}

export function getNotGuessedCategoryItems(game: Game, category: Category) {
    const guessedCategoryItemNames = new Set()
    for (let guess of game.guesses) {
        if (guess.categoryItem) {
            guessedCategoryItemNames.add(guess.categoryItem.name)
        }
    }
    return category.items.filter(categoryItem => !guessedCategoryItemNames.has(categoryItem.name))
}

export function isAdmin(game: Game, userId: string) {
    return game.admin.id === userId
}

export function canJoinGame(game: Game, userId: string) {
    if (isGameStarted(game)) {
        return false
    }

    return !game.participants.some(participant => participant.id === userId)
}

export function canLeaveGame(game: Game, userId: string) {
    if (isGameStarted(game)) {
        return false
    }

    if (game.admin.id === userId) {
        return false
    }

    return game.participants.some(participant => participant.id === userId)
}

export function getCorrectGuessCount(game: Game): { [p: string]: number } {
    const correctGuessCount: { [key: string]: number } = {}
    for (const {id} of game.participants) {
        correctGuessCount[id] = 0
    }
    for (const {guesser: {id}} of game.guesses) {
        correctGuessCount[id] = 0
    }
    for (const guess of game.guesses) {
        if (isGuessCorrect(guess)) {
            correctGuessCount[guess.guesser.id] += 1
        }
    }
    return correctGuessCount
}

export function addGuessToGame(game: Game, guess: Guess, category: Category, currentTime: number): Game {
    game = {
        ...game,
        guesses: [...game.guesses, guess]
    }

    const remainingParticipants = getRemainingParticipants(game);
    const isFinished = remainingParticipants.length === 0
        || (remainingParticipants.length === 1 && game.participants.length > 1)
        || getNotGuessedCategoryItems(game, category).length === 0

    return {
        ...game,
        finishedTime: isFinished ? currentTime : game.finishedTime
    }
}