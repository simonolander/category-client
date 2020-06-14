import {Context} from "../Context";
import {NotSignedInError} from "../error/NotSignedInError";
import {CategoryNotFoundError, GameNotFoundError, GameNotRunningError} from "../error/NotFoundError";
import {AuthenticationError, ForbiddenError, UserInputError} from "apollo-server-express";
import {Correct, Duplicate, Incorrect} from "../../shared/src/main";
import {GameEntity, Lobby, maximumGuessTime, minimumGuessTime, TimedOut} from "shared";
import {categoryRepository, gameRepository, Repository} from "../repository";

export async function createGame(parent: undefined, {previousGameId}: { previousGameId?: string }, {user}: Context): Promise<GameEntity> {
    if (!user) {
        throw new AuthenticationError("You need to be signed in to create a new lobby")
    }

    const gameId = Repository.generateId()

    if (previousGameId) {
        const previousGame = await gameRepository.findById(previousGameId)
        if (!previousGame) {
            throw new GameNotFoundError(previousGameId)
        }
        if (!previousGame.isFinishedGame()) {
            throw new UserInputError(`Can't set game ${previousGameId} as previousGame. Game ${previousGameId} has not finished.`)
        }
        if (previousGame.admin.id !== user.id) {
            throw new ForbiddenError(`User ${user.id} not allowed to modify game ${previousGameId}`)
        }
        if (previousGame.nextGameId) {
            throw new UserInputError(`Game ${previousGameId} already has a next game`)
        }
        await gameRepository.save(previousGame.withNextGame(gameId))
    }

    return gameRepository.save(
        new Lobby(
            gameId,
            user,
            [user],
            new Date()
        )
    ).then(lobby => lobby.toEntity())
}

export async function joinGame(
    parent: undefined,
    {gameId}: { gameId: string },
    {user}: Context
): Promise<GameEntity | null> {
    if (!user) {
        throw new AuthenticationError("You need to be signed in to join a lobby")
    }

    const game = await gameRepository.findById(gameId);
    if (!game) {
        throw new UserInputError(`Game ${gameId} doesn't exist`)
    }

    if (!game.isLobby()) {
        throw new UserInputError(`Game ${game.id} is not in lobby`)
    }

    return gameRepository.save(game.addParticipant(user))
        .then(savedGame => savedGame.toEntity())
}

export async function makeGuess(
    parent: undefined,
    {gameId, guessValue}: { guessValue: string, gameId: string },
    {user}: Context): Promise<GameEntity> {

    if (!user) {
        throw new NotSignedInError()
    }

    const game = await gameRepository.findById(gameId);
    if (!game) {
        throw new GameNotFoundError(gameId)
    }

    if (!game.isRunningGame()) {
        throw new GameNotRunningError(gameId)
    }

    const currentGuesser = game.getCurrentGuesser();
    if (currentGuesser?.id !== user.id) {
        throw new UserInputError(`User ${user.id} guessed out of turn`)
    }

    const categoryItem = game.category.getItemByGuess(guessValue)
    const alreadyGuessed = categoryItem
        && game.guesses.some(previousGuess =>
            previousGuess.isCorrect() && previousGuess.categoryItem.name === categoryItem.name
        )
    let guess;
    if (!categoryItem) {
        guess = new Incorrect(
            Repository.generateId(),
            guessValue,
            user,
            new Date()
        )
    } else if (alreadyGuessed) {
        guess = new Duplicate(
            Repository.generateId(),
            guessValue,
            user,
            new Date(),
            categoryItem
        )
    } else {
        guess = new Correct(
            Repository.generateId(),
            guessValue,
            user,
            new Date(),
            categoryItem
        )
    }

    return gameRepository.save(game.addGuess(guess))
        .then(savedGame => savedGame.toEntity())
}

export async function startGame(
    parent: undefined,
    {
        gameId,
        categoryId,
        guessTime
    }: {
        gameId: string,
        categoryId: string,
        guessTime: number
    },
    {user}: Context
): Promise<GameEntity> {
    if (!user) {
        throw new NotSignedInError()
    }
    const [category, lobby] = await Promise.all([
        categoryRepository.findById(categoryId),
        gameRepository.findById(gameId)
    ]);
    if (!category) {
        throw new CategoryNotFoundError(categoryId)
    }
    if (!lobby) {
        throw new GameNotFoundError(gameId)
    }
    if (!lobby.isLobby()) {
        throw new UserInputError(`Game ${gameId} needs to be in lobby`)
    }
    if (lobby.admin.id !== user.id) {
        throw new ForbiddenError(`User ${user.id} not allowed to start game ${gameId}`)
    }
    if (!Number.isInteger(guessTime) || guessTime < minimumGuessTime || guessTime > maximumGuessTime) {
        throw new UserInputError(`Invalid guessTime (${guessTime}): must be an integer between ${minimumGuessTime} and ${maximumGuessTime}`)
    }

    return gameRepository.save(lobby.start(category, guessTime, new Date()))
        .then(game => game.toEntity())
}

export async function leaveGame(parent: undefined, {gameId}: { gameId: string }, {user}: Context): Promise<GameEntity | null> {
    if (!user) {
        throw new AuthenticationError("You need to be signed in to leave a lobby")
    }

    const lobby = await gameRepository.findById(gameId);
    if (!lobby) {
        throw new UserInputError(`Game ${gameId} doesn't exist`)
    }

    if (!lobby.isLobby()) {
        throw new UserInputError(`Game ${gameId} is not in lobby`)
    }

    const isAdmin = lobby.admin.id === user.id;
    if (isAdmin) {
        throw new UserInputError(`User ${user.id} is admin in ${gameId} and cannot leave`)
    }

    return gameRepository.save(lobby.removeParticipant(user))
        .then(game => game.toEntity())
}

export async function timeout(parent: undefined, {gameId}: { gameId: string }, {user}: Context): Promise<GameEntity> {
    if (!user) {
        throw new NotSignedInError()
    }

    const game = await gameRepository.findById(gameId);
    if (!game) {
        throw new GameNotFoundError(gameId)
    }

    if (!game.isRunningGame()) {
        throw new GameNotRunningError(game.id)
    }

    const remainingGuessTime = game.getRemainingGuessTime(new Date());
    if (remainingGuessTime > 0) {
        return game.toEntity()
    }

    const currentGuesser = game.getCurrentGuesser();
    if (!currentGuesser) {
        console.error(`No current guesser for running game ${gameId}`)
        return game.toEntity()
    }

    const guess = new TimedOut(
        Repository.generateId(),
        currentGuesser,
        new Date(),
    )

    return gameRepository.save(game.addGuess(guess))
        .then(savedGame => savedGame.toEntity())
}

export async function games(
    parent: undefined,
    args: { limit?: number, startAt?: string, endAt?: string, orderByField?: string, orderByDirection?: 'asc' | 'desc' },
    context: Context
): Promise<GameEntity[]> {
    const defaultLimit = 1000
    return gameRepository.findAll({
        limit: args.limit || defaultLimit,
        startAt: args.startAt,
        endAt: args.endAt,
        orderByField: args.orderByField,
        orderByDirection: args.orderByDirection
    })
        .then(games => games.map(game => game.toEntity()))
}

// noinspection JSUnusedLocalSymbols
export async function templateResolver(parent: undefined, args: {}, context: Context): Promise<never> {
    throw new Error("not implemented")
}