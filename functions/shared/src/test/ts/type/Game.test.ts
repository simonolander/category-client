import {Category, CategoryItem, Correct, FinishedGame, Incorrect, Lobby, User} from "../../../main";

const now = new Date(1593247873642)
const user1: User = {
    id: "W1",
    name: "user1",
}
const user2: User = {
    id: "k2",
    name: "user2",
}
const user3: User = {
    id: "Y5",
    name: "user3",
}
const user4: User = {
    id: "bW",
    name: "user4",
}
const user5: User = {
    id: "WA",
    name: "user5",
}
const users = [user1, user2, user3, user4, user5]
const admin = user2;
const lobby = new Lobby("5s", admin, users, now)
const items: CategoryItem[] = []
for (const index in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    items.push({
        name: index.toString(),
        description: "",
        spellings: [],
        url: null,
        imageUrl: null
    })
}
const category = new Category("X1", "category", "description", items, [], [], "imageUrl")

it('Test game 1. All guesses correct.', function () {
    let runningGame = lobby.start(category, 30000, now)
    const participants = runningGame.participants
    const guesses = [
        new Correct("c0", "0", participants[0], now, items[0]),
        new Correct("c1", "1", participants[1], now, items[1]),
        new Correct("c2", "2", participants[2], now, items[2]),
        new Correct("c3", "3", participants[3], now, items[3]),
        new Correct("c4", "4", participants[4], now, items[4]),
        new Correct("c5", "5", participants[0], now, items[5]),
        new Correct("c6", "6", participants[1], now, items[6]),
        new Correct("c7", "7", participants[2], now, items[7]),
        new Correct("c8", "8", participants[3], now, items[8]),
        new Correct("c9", "9", participants[4], now, items[9]),
    ]
    let finishedGame: FinishedGame | null = null
    for (let index = 0; index < guesses.length; ++index) {
        const guess = guesses[index]
        expect(runningGame.getCurrentGuesser()).toEqual(guess.guesser)
        expect(runningGame.getRemainingParticipants()).toHaveLength(5)
        for (let participant of participants) {
            expect(runningGame.getRemainingParticipants()).toContainEqual(participant)
        }
        const tempGame = runningGame.addGuess(guess)
        if (tempGame.isFinishedGame()) {
            expect(index).toEqual(guesses.length - 1)
            finishedGame = tempGame
            break
        }
        runningGame = tempGame
    }
    expect(finishedGame).not.toBeNull()
    if (!finishedGame) {
        throw new Error("Finished game is null")
    }
});

it('Test game 2. One incorrect guess.', function () {
    let runningGame = lobby.start(category, 30000, now)
    const participants = runningGame.participants
    const guesses = [
        new Correct("c0", "0", participants[0], now, items[0]),
        new Correct("c1", "1", participants[1], now, items[1]),
        new Correct("c2", "2", participants[2], now, items[2]),
        new Incorrect("i0", "a", participants[3], now),
        new Correct("c3", "3", participants[4], now, items[3]),
        new Correct("c4", "4", participants[0], now, items[4]),
        new Correct("c5", "5", participants[1], now, items[5]),
        new Correct("c6", "6", participants[2], now, items[6]),
        new Correct("c7", "7", participants[4], now, items[7]),
        new Correct("c8", "8", participants[0], now, items[8]),
        new Correct("c9", "9", participants[1], now, items[9]),
    ]
    let finishedGame: FinishedGame | null = null
    for (let index = 0; index < guesses.length; ++index) {
        const guess = guesses[index]
        expect(runningGame.getCurrentGuesser()).toEqual(guess.guesser)
        const tempGame = runningGame.addGuess(guess)
        if (tempGame.isFinishedGame()) {
            expect(index).toEqual(guesses.length - 1)
            finishedGame = tempGame
            break
        }
        runningGame = tempGame
    }
    expect(finishedGame).not.toBeNull()
    if (!finishedGame) {
        throw new Error("Finished game is null")
    }
});

it('Test game 3. Two incorrect guesses.', function () {
    let runningGame = lobby.start(category, 30000, now)
    const participants = runningGame.participants
    const guesses = [
        new Correct("c0", "0", participants[0], now, items[0]),
        new Correct("c1", "1", participants[1], now, items[1]),
        new Correct("c2", "2", participants[2], now, items[2]),
        new Incorrect("i0", "a", participants[3], now),
        new Correct("c3", "3", participants[4], now, items[3]),
        new Correct("c4", "4", participants[0], now, items[4]),
        new Correct("c5", "5", participants[1], now, items[5]),
        new Incorrect("i1", "a", participants[2], now),
        new Correct("c6", "6", participants[4], now, items[6]),
        new Correct("c7", "7", participants[0], now, items[7]),
        new Correct("c8", "8", participants[1], now, items[8]),
        new Correct("c9", "9", participants[4], now, items[9]),
    ]
    let finishedGame: FinishedGame | null = null
    for (let index = 0; index < guesses.length; ++index) {
        const guess = guesses[index]
        expect(runningGame.getCurrentGuesser()).toEqual(guess.guesser)
        const tempGame = runningGame.addGuess(guess)
        if (tempGame.isFinishedGame()) {
            expect(index).toEqual(guesses.length - 1)
            finishedGame = tempGame
            break
        }
        runningGame = tempGame
    }
    expect(finishedGame).not.toBeNull()
    if (!finishedGame) {
        throw new Error("Finished game is null")
    }
});

it('Test game 4. Three incorrect guesses.', function () {
    let runningGame = lobby.start(category, 30000, now)
    const participants = runningGame.participants
    const guesses = [
        new Correct("c0", "0", participants[0], now, items[0]),
        new Correct("c1", "1", participants[1], now, items[1]),
        new Correct("c2", "2", participants[2], now, items[2]),
        new Incorrect("i0", "a", participants[3], now),
        new Correct("c3", "3", participants[4], now, items[3]),
        new Correct("c4", "4", participants[0], now, items[4]),
        new Correct("c5", "5", participants[1], now, items[5]),
        new Incorrect("i1", "a", participants[2], now),
        new Correct("c6", "6", participants[4], now, items[6]),
        new Incorrect("i2", "a", participants[0], now),
        new Correct("c7", "7", participants[1], now, items[7]),
        new Correct("c8", "8", participants[4], now, items[8]),
        new Correct("c9", "9", participants[1], now, items[9]),
    ]
    let finishedGame: FinishedGame | null = null
    for (let index = 0; index < guesses.length; ++index) {
        const guess = guesses[index]
        expect(runningGame.getCurrentGuesser()).toEqual(guess.guesser)
        const tempGame = runningGame.addGuess(guess)
        if (tempGame.isFinishedGame()) {
            expect(index).toEqual(guesses.length - 1)
            finishedGame = tempGame
            break
        }
        runningGame = tempGame
    }
    expect(finishedGame).not.toBeNull()
    if (!finishedGame) {
        throw new Error("Finished game is null")
    }
});

it('Test game 4. Four incorrect guesses.', function () {
    let runningGame = lobby.start(category, 30000, now)
    const participants = runningGame.participants
    const guesses = [
        new Correct("c0", "0", participants[0], now, items[0]),
        new Correct("c1", "1", participants[1], now, items[1]),
        new Correct("c2", "2", participants[2], now, items[2]),
        new Incorrect("i0", "a", participants[3], now),
        new Correct("c3", "3", participants[4], now, items[3]),
        new Correct("c4", "4", participants[0], now, items[4]),
        new Correct("c5", "5", participants[1], now, items[5]),
        new Incorrect("i1", "a", participants[2], now),
        new Correct("c6", "6", participants[4], now, items[6]),
        new Incorrect("i2", "a", participants[0], now),
        new Incorrect("i3", "a", participants[1], now),
    ]
    let finishedGame: FinishedGame | null = null
    for (let index = 0; index < guesses.length; ++index) {
        const guess = guesses[index]
        expect(runningGame.getCurrentGuesser()).toEqual(guess.guesser)
        const tempGame = runningGame.addGuess(guess)
        if (tempGame.isFinishedGame()) {
            expect(index).toEqual(guesses.length - 1)
            finishedGame = tempGame
            break
        }
        runningGame = tempGame
    }
    expect(finishedGame).not.toBeNull()
    if (!finishedGame) {
        throw new Error("Finished game is null")
    }
});
