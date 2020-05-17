import React, {useEffect, useRef, useState} from 'react';
import {subscribeGame} from "../service/firestore";
import {useParams} from 'react-router-dom';
import {
    canJoinGame,
    canLeaveGame,
    Category,
    Game,
    getCorrectGuessCount,
    getCurrentGuesser,
    getLatestGuess,
    getParticipantMap,
    getRemainingGuessTime,
    getRemainingParticipants,
    Guess,
    isAdmin,
    isGameFinished,
    isGameRunning,
    isGameStarted
} from "common";
import {useSelector} from "react-redux";
import {gql, useMutation, useQuery} from "@apollo/client";
import classNames from "classnames";

const JOIN_GAME = gql`
    mutation JoinGame($gameId: ID!) {
        joinGame(gameId: $gameId) {
            id
        }
    }
`

const LEAVE_GAME = gql`
    mutation LeaveGame($gameId: ID!) {
        leaveGame(gameId: $gameId) {
            id
        }
    }
`

const START_GAME = gql`
    mutation StartGame($gameId: ID!, $categoryId: ID!) {
        startGame(gameId: $gameId, categoryId: $categoryId) {
            id
        }
    }
`

const MAKE_GUESS = gql`
    mutation MakeGuess($gameId: ID!, $guessValue: String!) {
        makeGuess(gameId: $gameId, guessValue: $guessValue) {
            id
        }
    }
`

const TIMEOUT = gql`
    mutation Timeout($gameId: ID!) {
        timeout(gameId: $gameId) {
            id
        }
    }
`

let GET_CATEGORIES = gql`
    {
        categories {
            id
            name
            description
        }
    }
`

let GET_CATEGORY = gql`
    query Category($categoryId: ID!) {
        category(categoryId: $categoryId) {
            id
            name
            description
        }
    }
`

interface GetCategoriesResult {
    readonly categories: Category[];
}

interface GetCategoryResult {
    readonly category: Category;
}

function useAnimationFrame(callback: (time: number) => void) {
    const handle = useRef(0);

    function animate(time: number) {
        callback(time)
        handle.current = requestAnimationFrame(animate);
    }

    useEffect(() => {
        handle.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(handle.current);
    }, []);
}

function StatusIcon({guess: {error}}: { guess: Guess }) {
    switch (error) {
        case "already guessed":
            return (
                <span className="icon" title="Already guessed">
                    <i className="fas fa-copy"/>
                </span>
            )
        case "wrong":
            return (
                <span className="icon" title="Incorrect">
                    <i className="fas fa-times"/>
                </span>
            )
        case "timed out":
            return (
                <span className="icon" title="Timed out">
                    <i className="fas fa-hourglass-end"/>
                </span>
            )
        case null:
            return (
                <span className="icon" title="Correct">
                    <i className="fas fa-check"/>
                </span>
            )
    }
}

export default function GamePage() {
    const {gameId} = useParams();
    const [game, setGame] = useState<Game | undefined>();
    const userId = useSelector(state => state.user.id);

    useEffect(() => {
        if (gameId) {
            return subscribeGame(gameId, setGame)
        }
    }, [gameId, setGame])

    if (!gameId) {
        return <pre>Missing game id</pre>
    }

    if (!game) {
        return <pre>Loading game</pre>
    }

    const Lobby = function () {
        const [leaveGame, {loading: leaving}] = useMutation(LEAVE_GAME);
        const [joinGame, {loading: joining}] = useMutation(JOIN_GAME);
        const [startGame, {loading: starting}] = useMutation(START_GAME);
        const {data: categories, loading: loadingCategories} = useQuery<GetCategoriesResult>(GET_CATEGORIES)

        const options = {
            variables: {
                gameId
            }
        }

        return (
            <div>
                <section className="hero">
                    <div className="hero-body">
                        <div className="container">
                            <h1 className="title is-spaced">
                                Waiting for players to join
                            </h1>
                            <h2 className="subtitle">
                                Share this link to anyone you would like to invite
                            </h2>
                            <pre>{window.location.href}</pre>
                        </div>
                    </div>
                    <div className="container">
                        {canJoinGame(game, userId) && (
                            <button
                                onClick={() => joinGame(options)}
                                disabled={joining}
                                className={classNames({
                                    "button": true,
                                    "is-large": true,
                                    "is-loading": joining,
                                    "is-primary": true,
                                })}
                            >
                                Click here to join
                            </button>
                        )}
                        {canLeaveGame(game, userId) && (
                            <button
                                onClick={() => leaveGame(options)}
                                disabled={leaving}
                                className={classNames({
                                    "button": true,
                                    "is-large": true,
                                    "is-loading": leaving,
                                    "is-warning": true,
                                    "is-outlined": false,
                                })}
                            >
                                Leave game
                            </button>
                        )}
                    </div>
                </section>
                {isAdmin(game, userId) && (
                    <section className="section">
                        <div className="container">
                            <h1 className="title">Game options</h1>
                            <form onSubmit={async event => {
                                event.preventDefault()
                                const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                                await startGame({variables: {...values, gameId: game.id}})
                            }}>
                                <div className="field">
                                    <label className="label">Category</label>
                                    <div className="control">
                                        <div
                                            className={classNames({
                                                "select": true,
                                                "is-loading": loadingCategories
                                            })}
                                        >
                                            <select name="categoryId" required>
                                                {categories?.categories.map(({id, name}) => (
                                                    <option key={id} value={id}>{name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="field">
                                    <div className="control">
                                        <button
                                            type="submit"
                                            disabled={starting}
                                            className={classNames({
                                                "button": true,
                                                "is-loading": starting,
                                                "is-primary": true
                                            })}
                                        >
                                            Start game
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </section>
                )}
                <section className="section">
                    <div className="container">
                        <h1 className="title">Players</h1>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Players ({game.participants.length})</th>
                            </tr>
                            </thead>
                            <tbody>
                            {game.participants.map(({id, name}) => {
                                const admin =
                                    isAdmin(game, id)
                                        ? (
                                            <span className="icon has-text-warning" title="Admin">
                                                <i className="fas fa-crown"/>
                                            </span>
                                        )
                                        : null
                                const you = id === userId
                                    ? <span className="has-text-grey-light">you</span>
                                    : null
                                return (
                                    <tr key={id}>
                                        <td>{name} {admin} {you}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        )
    }

    const RunningGame = function () {
        const [time, setTime] = useState(Date.now())
        const [makeGuess, {loading: guessing, error: guessError}] = useMutation(MAKE_GUESS);
        const [timeout] = useMutation(TIMEOUT);

        useAnimationFrame(time => setTime(Date.now()))

        const remainingGuessTime = getRemainingGuessTime(game, time)
        useEffect(() => {
            if (!game.finishedTime) {
                const handle = setTimeout(
                    () => timeout({variables: {gameId: game.id}}),
                    remainingGuessTime
                )
                return () => clearTimeout(handle)
            }
        }, [game.finishedTime, game.startedTime, game.guessTime, game.guesses.length])

        const currentGuesser = getCurrentGuesser(game);
        if (!currentGuesser) {
            return <code>no current guesser !</code>
        }
        const isCurrentGuesser = userId === currentGuesser.id
        return (
            <div>
                <section className="section">
                    <div className="container">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Last guess</th>
                                <th>Item</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Time</th>
                            </tr>
                            </thead>
                            <tbody>
                            {game.participants.map(({id, name}) => {
                                const isCurrentGuesser = currentGuesser?.id === id
                                const latestGuess = getLatestGuess(game, id);
                                return (
                                    <tr key={id}>
                                        <td>{name}</td>
                                        <td>{latestGuess?.value}</td>
                                        <td>{latestGuess?.categoryItem?.name}</td>
                                        <td>{latestGuess?.categoryItem?.description}</td>
                                        <td>{latestGuess && <StatusIcon guess={latestGuess}/>}</td>
                                        <td>{isCurrentGuesser && (remainingGuessTime / 1000).toFixed(2)}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                    {isCurrentGuesser &&
                    (<div className="container">
                            <form onSubmit={async event => {
                                event.preventDefault()
                                const currentTarget = event.currentTarget;
                                const values = Object.fromEntries(new FormData(currentTarget).entries());
                                await makeGuess({variables: {...values, gameId: game.id}})
                                currentTarget.reset()
                            }}>
                                <div className="field">
                                    <label className="label">Guess</label>
                                    <div className="control">
                                        <input
                                            name="guessValue"
                                            disabled={guessing}
                                            autoFocus
                                            required
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div className="field">
                                    <div className="control">
                                        <button
                                            type="submit"
                                            disabled={guessing}
                                            className={classNames({
                                                "button": true,
                                                "is-loading": guessing,
                                                "is-primary": true
                                            })}
                                        >
                                            Make guess
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </section>
            </div>
        )
    }

    const FinishedGame = function () {
        const {data: categoryResult, loading: loadingCategory} = useQuery<GetCategoryResult>(GET_CATEGORY, {variables: {categoryId: game.categoryId}})
        const participantMap = getParticipantMap(game)
        const remainingParticipants = getRemainingParticipants(game);
        const correctGuessCount = getCorrectGuessCount(game)
        const sortedCorrectGuessCount = Object.entries(correctGuessCount)
            .sort(([, left], [, right]) => right - right)
        return (
            <div>
                <section className="hero">
                    <div className="hero-body">
                        <div className="container">
                            <h1 className="title is-spaced">Game finished</h1>
                            <h2 className="subtitle">
                                {remainingParticipants.length === 0 && "Everybody lost!"}
                                {remainingParticipants.length === 1 && `${remainingParticipants[0].name} won this game!`}
                                {remainingParticipants.length > 1 && "There was no single winner in this game. All the items in the category where guessed!"}
                            </h2>
                        </div>
                    </div>
                </section>
                <section className="section">
                    <div className="container">
                        <h1 className="title is-spaced">Score board</h1>
                        <table className="table">
                            <thead>
                            <tr>
                                <td>Placement</td>
                                <td>Name</td>
                                <td>Score</td>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedCorrectGuessCount.map(([id, score]) => {
                                const placement = 1 + sortedCorrectGuessCount.filter(count => count[1] > score).length
                                return (
                                    <tr key={id}>
                                        <td>{placement}</td>
                                        <td>{participantMap[id].name}</td>
                                        <td>{score}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="section">
                    <div className="container">
                        <h1 className="title is-spaced">Game options</h1>
                        <div className="field">
                            <label className="label">Category</label>
                            <p title="subtitle">{categoryResult?.category.name}</p>
                            <p title="subtitle">{categoryResult?.category.description}</p>
                        </div>
                    </div>
                </section>
                <section className="section">
                    <div className="container">
                        <h1 className="title is-spaced">Guesses</h1>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Guesser</th>
                                <th>Guessed value</th>
                                <th>Item</th>
                                <th>Description</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {game.guesses.map((guess, index) => {
                                return (
                                    <tr key={guess.id}>
                                        <td>{index + 1}</td>
                                        <td>{guess.guesser.name}</td>
                                        <td>{guess.value}</td>
                                        <td>{guess.categoryItem?.name}</td>
                                        <td>{guess.categoryItem?.description}</td>
                                        <td><StatusIcon guess={guess}/></td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        )
    }

    return (
        <div>
            {!isGameStarted(game) && <Lobby/>}
            {isGameRunning(game) && <RunningGame/>}
            {isGameFinished(game) && <FinishedGame/>}
        </div>
    )
}
