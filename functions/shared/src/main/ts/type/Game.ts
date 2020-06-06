import {guessConverter, TGuess} from "./Guess";
import {IStorable} from "./IStorable";
import {Category, GameEntity, User} from "../..";
import {shuffle} from "../utility/random";

export type TGame = Lobby | RunningGame | FinishedGame

export function fromGameEntity(entity: GameEntity): TGame | null {
    if (!entity.startedTime) {
        return new Lobby(
            entity.id,
            entity.admin,
            entity.participants,
            new Date(entity.createdTime),
        );
    }

    if (!entity.category) {
        console.error(`Missing category in started game ${entity.id}`)
        return null
    }

    const guesses = []
    for (const guessEntity of entity.guesses) {
        const guess = guessConverter.fromFirestore(guessEntity)
        if (guess) {
            guesses.push(guess)
        }
    }

    if (!entity.finishedTime) {
        return new RunningGame(
            entity.id,
            entity.admin,
            entity.participants,
            new Date(entity.createdTime),
            Category.fromEntity(entity.category),
            guesses,
            new Date(entity.startedTime),
            entity.guessTime,
        );
    }

    return new FinishedGame(
        entity.id,
        entity.admin,
        entity.participants,
        new Date(entity.createdTime),
        Category.fromEntity(entity.category),
        guesses,
        new Date(entity.startedTime),
        entity.guessTime,
        new Date(entity.finishedTime),
        entity.nextGameId || undefined
    )
}

abstract class AGame implements IStorable<GameEntity> {
    protected constructor(
        public readonly id: string,
        public readonly admin: User,
        public readonly participants: User[],
        public readonly createdTime: Date,
    ) {
    }

    isLobby(): this is Lobby {
        return this instanceof Lobby;
    }

    isRunningGame(): this is RunningGame {
        return this instanceof RunningGame;
    }

    isFinishedGame(): this is FinishedGame {
        return this instanceof FinishedGame;
    }

    getParticipantMap(): { [key: string]: User } {
        return this.participants.reduce((map: { [key: string]: User }, participant) => {
            map[participant.id] = participant
            return map
        }, {})
    }

    hasParticipant(user: User): boolean {
        return this.participants.some(participant => participant.id === user.id)
    }

    abstract toEntity(): GameEntity
}

abstract class AStartedGame extends AGame {
    protected constructor(
        id: string,
        admin: User,
        participants: User[],
        createdTime: Date,
        public readonly category: Category,
        public readonly guesses: TGuess[],
        public readonly startedTime: Date,
        public readonly guessTime: number,
    ) {
        super(
            id,
            admin,
            participants,
            createdTime,
        );
    }

    getRemainingParticipants() {
        const incorrectGuessers = this.guesses.filter(guess => !guess.isCorrect())
            .reduce((previousValue: { [key: string]: number }, {guesser: {id}}) => {
                previousValue[id] = (previousValue[id] || 0) + 1
                return previousValue
            }, {});
        return this.participants.filter(participant => !incorrectGuessers[participant.id])
    }

    getLatestGuess(userId?: string): TGuess | undefined {
        if (!userId) {
            return this.guesses[this.guesses.length - 1]
        }

        return this.guesses.filter(guess => guess.guesser.id === userId).pop()
    }

    getNotGuessedCategoryItems() {
        const guessedCategoryItemNames = new Set()
        for (const guess of this.guesses) {
            if (guess.isCorrect()) {
                guessedCategoryItemNames.add(guess.categoryItem.name)
            }
        }
        return this.category.items.filter(categoryItem => !guessedCategoryItemNames.has(categoryItem.name))
    }

    getCorrectGuessCount(): { [p: string]: number } {
        const correctGuessCount: { [key: string]: number } = {}
        for (const {id} of this.participants) {
            correctGuessCount[id] = 0
        }
        for (const {guesser: {id}} of this.guesses) {
            correctGuessCount[id] = 0
        }
        for (const guess of this.guesses) {
            if (guess.isCorrect()) {
                correctGuessCount[guess.guesser.id] += 1
            }
        }
        return correctGuessCount
    }
}

export class Lobby extends AGame {
    constructor(id: string, admin: User, participants: User[], createdTime: Date) {
        super(id, admin, participants, createdTime);
    }

    canJoinGame(userId: string) {
        return !this.participants.some(participant => participant.id === userId)
    }

    canLeaveGame(userId: string) {
        if (this.admin.id === userId) {
            return false
        }

        return this.participants.some(participant => participant.id === userId)
    }

    toEntity(): GameEntity {
        return {
            admin: this.admin,
            category: null,
            createdTime: this.createdTime.getTime(),
            finishedTime: null,
            guessTime: 30,
            guesses: [],
            id: this.id,
            nextGameId: null,
            participants: this.participants,
            startedTime: null,
        }
    }

    addParticipant(user: User): Lobby {
        if (this.hasParticipant(user)) {
            return this
        }

        return new Lobby(
            this.id,
            this.admin,
            [...this.participants, user],
            this.createdTime
        )
    }

    removeParticipant(user: User): Lobby {
        if (!this.hasParticipant(user)) {
            return this
        }

        return new Lobby(
            this.id,
            this.admin,
            this.participants.filter(participant => participant.id !== user.id),
            this.createdTime
        )
    }

    start(category: Category, guessTime: number, currentTime: Date): RunningGame {
        return new RunningGame(
            this.id,
            this.admin,
            shuffle(this.participants),
            this.createdTime,
            category,
            [],
            currentTime,
            guessTime
        )
    }
}

export class RunningGame extends AStartedGame {
    constructor(
        id: string,
        admin: User,
        participants: User[],
        createdTime: Date,
        category: Category,
        guesses: TGuess[],
        startedTime: Date,
        guessTime: number,
    ) {
        super(
            id,
            admin,
            participants,
            createdTime,
            category,
            guesses,
            startedTime,
            guessTime,
        );
    }

    getCurrentGuesser() {
        const remainingParticipants = this.getRemainingParticipants();
        if (remainingParticipants.length === 0) {
            return null
        }

        const latestGuess = this.getLatestGuess();
        if (!latestGuess) {
            return remainingParticipants[0]
        }

        for (let i = 0; i < remainingParticipants.length; ++i) {
            const participant = remainingParticipants[i];
            if (participant.id === latestGuess.guesser.id) {
                return remainingParticipants[(i + 1) % remainingParticipants.length]
            }
        }

        console.error(`Latest guesser is not a participant, game id ${this.id}`)
        return remainingParticipants[0]
    }

    getRemainingGuessTime(currentTime: Date) {
        if (!this.startedTime) {
            return this.guessTime
        }
        const latestGuess = this.getLatestGuess();
        if (latestGuess) {
            return latestGuess.createdTime.getTime() - currentTime.getTime() + this.guessTime
        }
        return this.startedTime.getTime() - currentTime.getTime() + this.guessTime
    }

    addGuess(guess: TGuess): RunningGame | FinishedGame {
        let numberOfUnguessedCategoryItems = this.getNotGuessedCategoryItems().length
        let numberOfRemainingParticipants = this.getRemainingParticipants().length
        const numberOfInitialParticipants = this.participants.length
        console.assert(numberOfInitialParticipants > 0)
        console.assert(numberOfRemainingParticipants > 0)
        console.assert(numberOfInitialParticipants > 0)
        if (guess.isCorrect()) {
            numberOfUnguessedCategoryItems -= 1
        } else {
            numberOfRemainingParticipants -= 1
        }

        const isFinished = numberOfRemainingParticipants === 0
            || (numberOfRemainingParticipants === 1 && numberOfInitialParticipants > 1)
            || numberOfUnguessedCategoryItems === 0

        const guesses = [...this.guesses, guess]

        if (isFinished) {
            return new FinishedGame(
                this.id,
                this.admin,
                this.participants,
                this.createdTime,
                this.category,
                guesses,
                this.startedTime,
                this.guessTime,
                guess.createdTime,
                undefined,
            )
        } else {
            return new RunningGame(
                this.id,
                this.admin,
                this.participants,
                this.createdTime,
                this.category,
                guesses,
                this.startedTime,
                this.guessTime,
            )
        }
    }

    toEntity(): GameEntity {
        return {
            admin: this.admin,
            category: this.category.toEntity(),
            createdTime: this.createdTime.getTime(),
            finishedTime: null,
            guessTime: this.guessTime,
            guesses: this.guesses.map(guessConverter.toFirestore),
            id: this.id,
            nextGameId: null,
            participants: this.participants,
            startedTime: this.startedTime.getTime(),
        }
    }
}

export class FinishedGame extends AStartedGame {
    constructor(
        id: string,
        admin: User,
        participants: User[],
        createdTime: Date,
        category: Category,
        guesses: TGuess[],
        startedTime: Date,
        guessTime: number,
        public readonly finishedTime: Date,
        public readonly nextGameId?: string,
    ) {
        super(
            id,
            admin,
            participants,
            createdTime,
            category,
            guesses,
            startedTime,
            guessTime,
        )
    }

    withNextGame(nextGameId: string) {
        return new FinishedGame(
            this.id,
            this.admin,
            this.participants,
            this.createdTime,
            this.category,
            this.guesses,
            this.startedTime,
            this.guessTime,
            this.finishedTime,
            nextGameId,
        )
    }

    toEntity(): GameEntity {
        return {
            admin: this.admin,
            category: this.category.toEntity(),
            createdTime: this.createdTime.getTime(),
            finishedTime: this.finishedTime.getTime(),
            guessTime: this.guessTime,
            guesses: this.guesses.map(guessConverter.toFirestore),
            id: this.id,
            nextGameId: this.nextGameId || null,
            participants: this.participants,
            startedTime: this.startedTime.getTime(),
        }
    }
}