import {Context} from "../Context";
import {NotSignedInError} from "../error/NotSignedInError";
import {categoryRepository, gameRepository, Repository} from "../repository";
import {CategoryNotFoundError, GameNotFoundError} from "../error/NotFoundError";
import {Game, getCurrentGuesser, getRemainingParticipants, Guess} from "../../../common/src";
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
    args: { guessValue: string, gameId: string },
    {user}: Context): Promise<Game> {

    if (!user) {
        throw new NotSignedInError()
    }

    const game = await gameRepository.findById(args.gameId);
    if (!game) {
        throw new GameNotFoundError(args.gameId)
    }

    // TODO Check game started, not finished etc

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

    const categoryItem = category.items.find(item => item.name === args.guessValue) || null;

    const guess: Guess = {
        id: Repository.generateId(),
        categoryItem,
        createdTime: Date.now(),
        guesser: user,
        value: args.guessValue
    }

    const guesses = [...game.guesses, guess]

    const remainingParticipants = getRemainingParticipants({...game, guesses});

    return gameRepository.save({
        ...game,
        guesses,
        finishedTime: remainingParticipants.length === 0 ? Date.now() : null
    })
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

// noinspection JSUnusedLocalSymbols
export async function templateResolver(parent: undefined, args: {}, context: Context): Promise<never> {
    throw "not implemented"
}