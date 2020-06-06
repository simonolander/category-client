import {CategoryItem, GuessEntity, User} from "../..";

export type TGuess = Correct | Duplicate | Incorrect | TimedOut

export const guessConverter = {
    fromFirestore(guess: GuessEntity): TGuess | null {
        if (guess.categoryItem) {
            if (!guess.value) {
                console.error(`Invalid guess ${guess.id}: has categoryItem but not value`)
                return null
            }
            if (!guess.error) {
                return new Correct(
                    guess.id,
                    guess.value,
                    guess.guesser,
                    new Date(guess.createdTime),
                    guess.categoryItem
                )
            }
            if (guess.error === "duplicate") {
                return new Duplicate(
                    guess.id,
                    guess.value,
                    guess.guesser,
                    new Date(guess.createdTime),
                    guess.categoryItem
                )
            }
            console.error(`Invalid error for guess result with categoryItem: ${guess.error}`)
            return null
        }

        if (guess.value) {
            return new Incorrect(
                guess.id,
                guess.value,
                guess.guesser,
                new Date(guess.createdTime),
            )
        }

        return new TimedOut(
            guess.id,
            guess.guesser,
            new Date(guess.createdTime)
        )
    },
    toFirestore(guess: TGuess): GuessEntity {
        if (guess.isCorrect()) {
            return {
                categoryItem: guess.categoryItem,
                createdTime: guess.createdTime.getTime(),
                error: null,
                guesser: guess.guesser,
                id: guess.id,
                value: guess.value,
            }
        } else if (guess.isDuplicate()) {
            return {
                categoryItem: guess.categoryItem,
                createdTime: guess.createdTime.getTime(),
                error: "duplicate",
                guesser: guess.guesser,
                id: guess.id,
                value: guess.value,
            }
        } else if (guess.isIncorrect()) {
            return {
                categoryItem: null,
                createdTime: guess.createdTime.getTime(),
                error: "incorrect",
                guesser: guess.guesser,
                id: guess.id,
                value: guess.value,
            }
        } else {
            return {
                categoryItem: null,
                createdTime: guess.createdTime.getTime(),
                error: "timed out",
                guesser: guess.guesser,
                id: guess.id,
                value: null,
            }
        }
    }
}

abstract class Guess {
    protected constructor(
        public readonly id: string,
        public readonly guesser: User,
        public readonly createdTime: Date,
    ) {
    }

    isCorrect(): this is Correct {
        return this instanceof Correct
    }

    isDuplicate(): this is Duplicate {
        return this instanceof Duplicate
    }

    isIncorrect(): this is Incorrect {
        return this instanceof Incorrect
    }

    isTimedOut(): this is TimedOut {
        return this instanceof TimedOut
    }
}

export class Correct extends Guess {
    constructor(
        id: string,
        public readonly value: string,
        guesser: User,
        createdTime: Date,
        public readonly categoryItem: CategoryItem,
    ) {
        super(
            id,
            guesser,
            createdTime
        )
    }
}

export class Duplicate extends Guess {
    constructor(
        id: string,
        public readonly value: string,
        guesser: User,
        createdTime: Date,
        public readonly categoryItem: CategoryItem,
    ) {
        super(
            id,
            guesser,
            createdTime
        )
    }
}

export class Incorrect extends Guess {
    public readonly categoryItem = null
    constructor(
        public readonly id: string,
        public readonly value: string,
        public readonly guesser: User,
        public readonly createdTime: Date,
    ) {
        super(
            id,
            guesser,
            createdTime,
        )
    }
}

export class TimedOut extends Guess {
    public readonly value = null
    public readonly categoryItem = null
    constructor(
        public readonly id: string,
        public readonly guesser: User,
        public readonly createdTime: Date,
    ) {
        super(
            id,
            guesser,
            createdTime,
        )
    }
}