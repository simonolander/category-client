import {Context} from "../Context";
import {NotSignedInError} from "../error/NotSignedInError";
import {categoryRepository, gameRepository, Repository} from "../repository";
import {CategoryNotFoundError, GameNotFoundError, GameNotRunningError} from "../error/NotFoundError";
import {
    addGuessToGame,
    findCategoryItemByGuess,
    Game,
    getCurrentGuesser,
    getRemainingGuessTime,
    Guess,
    isGameRunning,
    isGuessCorrect
} from "common/src/main";
import {AuthenticationError, ForbiddenError, UserInputError} from "apollo-server-express";

export async function createGame(parent: undefined, args: {}, {user}: Context): Promise<Game> {
    if (!user) {
        throw new AuthenticationError("You need to be signed in to create a new lobby")
    }

    return gameRepository.save({
        id: Repository.generateId(),
        participants: [user],
        admin: user,
        categoryId: null,
        guesses: [],
        createdTime: Date.now(),
        startedTime: null,
        finishedTime: null,
        guessTime: 30000
    })
}

export async function joinGame(parent: undefined, {gameId}: { gameId: string }, {user}: Context):
    Promise<Game | null> {
    if (!
        user
    ) {
        throw new AuthenticationError("You need to be signed in to join a lobby")
    }

    const game = await gameRepository.findById(gameId);
    if (!game) {
        throw new UserInputError(`Game ${gameId} doesn't exist`)
    }

    const isParticipant = game.participants.some(participant => participant.id === user.id)
    if (isParticipant) {
        throw new UserInputError(`User ${user.id} already participating in lobby ${gameId}`)
    }

    if (game.startedTime) {
        throw new UserInputError(`Game ${game.id} has already started`)
    }

    return gameRepository.save({
        ...game,
        participants: [...game.participants, user]
    })
}

export async function makeGuess(
    parent: undefined,
    {gameId, guessValue}: { guessValue: string, gameId: string },
    {user}: Context): Promise<Game> {

    if (!user) {
        throw new NotSignedInError()
    }

    let game = await gameRepository.findById(gameId);
    if (!game) {
        throw new GameNotFoundError(gameId)
    }

    if (!isGameRunning(game)) {
        throw new GameNotRunningError(gameId)
    }

    if (!game.categoryId) {
        throw new UserInputError(`Game ${game.id} has no category yet`)
    }

    const currentGuesser = getCurrentGuesser(game);
    if (currentGuesser?.id !== user.id) {
        throw new UserInputError(`User ${user.id} guessed out of turn`)
    }

    const category = await categoryRepository.findById(game.categoryId);
    if (!category) {
        throw new CategoryNotFoundError(game.categoryId)
    }

    const categoryItem = findCategoryItemByGuess(category, guessValue)
    const isIncorrect = !categoryItem
    const alreadyGuessed = categoryItem && game.guesses.some(guess => isGuessCorrect(guess) && guess?.categoryItem?.name === categoryItem.name);
    const error = isIncorrect ? "wrong" : alreadyGuessed ? "already guessed" : null
    const guess: Guess = {
        id: Repository.generateId(),
        categoryItem: categoryItem,
        createdTime: Date.now(),
        guesser: user,
        value: guessValue,
        error
    }
    return gameRepository.save(addGuessToGame(game, guess, category, Date.now()))
}

export async function startGame(parent: undefined, {gameId, categoryId}: { gameId: string, categoryId: string }, {user}: Context): Promise<Game> {
    if (!user) {
        throw new NotSignedInError()
    }
    const [category, game] = await Promise.all([
        categoryRepository.findById(categoryId),
        gameRepository.findById(gameId)
    ]);
    if (!category) {
        throw new CategoryNotFoundError(categoryId)
    }
    if (!game) {
        throw new GameNotFoundError(gameId)
    }
    if (game.admin.id !== user.id) {
        throw new ForbiddenError(`User ${user.id} not allowed to start game lobby ${gameId}`)
    }
    if (game.startedTime) {
        throw new UserInputError(`Game already started`)
    }
    if (game.finishedTime) {
        throw new UserInputError(`Game already finished`)
    }

    await gameRepository.save({
        ...game,
        categoryId,
        startedTime: Date.now()
    })

    return game
}

export async function leaveGame(parent: undefined, {gameId}: { gameId: string }, {user}: Context): Promise<Game | null> {
    if (!user) {
        throw new AuthenticationError("You need to be signed in to leave a lobby")
    }

    const game = await gameRepository.findById(gameId);
    if (!game) {
        throw new UserInputError(`Game ${gameId} doesn't exist`)
    }

    const isAdmin = game.admin.id === user.id;
    if (isAdmin) {
        throw new UserInputError(`User ${user.id} is admin in ${gameId} and cannot leave`)
    }

    const isParticipant = game.participants.some(participant => participant.id === user.id)
    if (!isParticipant) {
        throw new UserInputError(`User ${user.id} already not participating in lobby ${gameId}`)
    }

    if (game.finishedTime) {
        throw new UserInputError(`Game ${game.id} has already finished`)
    }

    return gameRepository.save({
        ...game,
        participants: game.participants.filter(participant => participant.id !== user.id)
    })
}

export async function timeout(parent: undefined, {gameId}: { gameId: string }, {user}: Context): Promise<Game> {
    if (!user) {
        throw new NotSignedInError()
    }

    const game = await gameRepository.findById(gameId);
    if (!game) {
        throw new GameNotFoundError(gameId)
    }

    if (!isGameRunning(game)) {
        throw new GameNotRunningError(game.id)
    }

    if (!game.categoryId) {
        throw new UserInputError(`Game ${game.id} has no category yet`)
    }

    const category = await categoryRepository.findById(game.categoryId);
    if (!category) {
        throw new CategoryNotFoundError(game.categoryId)
    }

    const remainingGuessTime = getRemainingGuessTime(game, Date.now());
    if (remainingGuessTime > 0) {
        return game
    }

    const currentGuesser = getCurrentGuesser(game);
    if (!currentGuesser) {
        return game
    }

    const guess: Guess = {
        id: Repository.generateId(),
        categoryItem: null,
        createdTime: Date.now(),
        guesser: currentGuesser,
        value: "",
        error: "timed out"
    }

    return gameRepository.save(addGuessToGame(game, guess, category, Date.now()))
}

// noinspection JSUnusedLocalSymbols
export async function templateResolver(parent: undefined, args: {}, context: Context): Promise<never> {
    throw "not implemented"
}