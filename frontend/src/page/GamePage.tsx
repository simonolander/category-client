import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useGameSubscription} from "../service/firestore";
import {Link, useHistory, useParams} from 'react-router-dom';
import {FinishedGame, Lobby, maximumGuessTime, minimumGuessTime, RunningGame, TGuess} from "shared";
import {useSelector} from "react-redux";
import classNames from "classnames";
import {Loading} from "../component/Loading";
import {is} from "remote-data-ts";
import {NotFound} from "../component/NotFound";
import {ordinal} from "../utility/language";
import {ErrorPage} from "../component/ErrorPage";
import {useCategories} from "../graphql/query/Categories";
import {useStartGame} from "../graphql/mutation/StartGame";
import {useLeaveGame} from "../graphql/mutation/LeaveGame";
import {useJoinGame} from "../graphql/mutation/JoinGame";
import {useTimeout} from "../graphql/mutation/Timeout";
import {useMakeGuess} from "../graphql/mutation/MakeGuess";
import {useCreateGame} from "../graphql/mutation/CreateGame";

function useAnimationFrame(callback: (time: number) => void) {
    const handle = useRef(0);

    useEffect(() => {
        function animate(time: number) {
            callback(time)
            handle.current = requestAnimationFrame(animate);
        }

        handle.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(handle.current);
    }, [callback]);
}

function StatusIcon({guess}: { guess: TGuess }) {
    if (guess.isCorrect()) {
        return (
            <span className="icon has-text-primary" title="Correct">
                <i className="fas fa-check"/>
            </span>
        )
    } else if (guess.isIncorrect()) {
        return (
            <span className="icon" title="Incorrect">
                <i className="fas fa-times"/>
            </span>
        )
    } else if (guess.isDuplicate()) {
        return (
            <span className="icon" title="Already guessed">
                <i className="fas fa-copy"/>
            </span>
        )
    } else {
        return (
            <span className="icon" title="Timed out">
                <i className="fas fa-hourglass-end"/>
            </span>
        )
    }
}

function AdminControls({game}: {game: Lobby}) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [startGame, startGameRemoteData] = useStartGame();
    const starting = is.loading(startGameRemoteData)

    const CategoriesSelect = function () {
        const categoriesRemoteData = useCategories()
        let selectedCategory = undefined
        const classes: { [key: string]: boolean } = {
            "select": true,
            "is-fullwidth": true
        }
        let options
        if (is.loading(categoriesRemoteData) || is.notAsked(categoriesRemoteData)) {
            classes["is-loading"] = true
            options = [
                <option key="loading" disabled hidden value="">Loading categories</option>
            ]
        } else if (is.failure(categoriesRemoteData)) {
            classes["is-danger"] = true
            options = [
                <option key="error" disabled hidden value="">Error loading categories</option>
            ]
        } else {
            options = [
                <option key="select" disabled hidden value="">Select a category</option>,
                ...categoriesRemoteData.data.categories.map(({id, name}) => (
                    <option key={id} value={id}>{name}</option>
                ))
            ]
            selectedCategory = categoriesRemoteData.data.categories.find(category => category.id === selectedCategoryId)
        }

        return (
            <div className="field">
                <label className="label">Category</label>
                <div className="control">
                    <div
                        className={classNames(classes)}
                    >
                        <select
                            name="categoryId"
                            required
                            disabled={starting}
                            onChange={event => setSelectedCategoryId(event.currentTarget.value)}
                            value={selectedCategoryId}
                        >
                            {options}
                        </select>
                    </div>
                </div>
                <p className="help">{selectedCategory?.description}</p>
            </div>
        )
    }

    return (
        <section className="section">
            <div className="container">
                <h1 className="title">Game options</h1>
                <form onSubmit={async event => {
                    event.preventDefault()
                    const formData = new FormData(event.currentTarget)
                    const categoryId = formData.get("categoryId")
                    const guessTime = formData.get("guessTime")
                    if (typeof categoryId !== "string") {
                        throw new Error(`Invalid categoryId: ${categoryId}`)
                    }
                    if (typeof guessTime !== "string") {
                        throw new Error(`Invalid guessTime: ${guessTime}`)
                    }
                    await startGame({
                        variables: {
                            categoryId,
                            gameId: game.id,
                            guessTime: Number.parseInt(guessTime) * 1000
                        }
                    })
                }}>
                    <div className="columns">
                        <div className="column is-one-quarter">
                            <CategoriesSelect/>
                        </div>
                        <div className="column is-one-quarter">
                            <div className="field">
                                <label className="label">Guess time (seconds)</label>
                                <div className="control has-icons-left">
                                    <input
                                        className="input"
                                        name="guessTime"
                                        required
                                        disabled={starting}
                                        type="number"
                                        min={minimumGuessTime / 1000}
                                        max={maximumGuessTime / 1000}
                                        defaultValue={30}
                                    />
                                    <span className="icon is-small is-left">
                                    <i className="fas fa-hourglass-end"/>
                                </span>
                                </div>
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
    )
}

function LobbyView({game, userId}: { game: Lobby, userId: string }) {
    const [leaveGame, leaveGameRD] = useLeaveGame()
    const [joinGame, joinGameRD] = useJoinGame()
    const leaving = is.loading(leaveGameRD)
    const joining = is.loading(joinGameRD)

    const options = {
        variables: {
            gameId: game.id
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
                    {game.canJoinGame(userId) && (
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
                    {game.canLeaveGame(userId) && (
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
            {game.admin.id === userId && <AdminControls game={game}/>}
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
                                game.admin.id === id
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

function RunningGameView({game, userId}: { game: RunningGame, userId: string }) {
    const [time, setTime] = useState(Date.now())
    const [makeGuess, makeGuessRD] = useMakeGuess();
    const [timeout] = useTimeout({variables: {gameId: game.id}});
    const [guessValue, setGuessValue] = useState("")
    const guessing = is.loading(makeGuessRD)

    const setCurrentTime = useCallback(() => setTime(Date.now()), [setTime])
    useAnimationFrame(setCurrentTime)

    const remainingGuessTime = game.getRemainingGuessTime(new Date(time))
    useEffect(() => {
        const handle = setTimeout(timeout, remainingGuessTime)
        return () => clearTimeout(handle)
    }, [game.startedTime, game.guessTime, game.guesses.length])

    const currentGuesser = game.getCurrentGuesser()
    if (!currentGuesser) {
        return <code>no current guesser !</code>
    }
    const isCurrentGuesser = userId === currentGuesser.id
    return (
        <div>
            <section className="section">
                <div className="container">
                    <h1 className="title">{game.category.name}</h1>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Last guess</th>
                            <th>Object</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                        </thead>
                        <tbody>
                        {game.participants.map(({id, name}) => {
                            const isCurrentGuesser = currentGuesser?.id === id
                            const latestGuess = game.getLatestGuess(id);
                            return (
                                <tr key={id}>
                                    <td>{name}</td>
                                    <td>{latestGuess?.value}</td>
                                    <td>{latestGuess?.categoryItem?.name}</td>
                                    <td>{latestGuess?.categoryItem?.description}</td>
                                    <td>{latestGuess && <StatusIcon guess={latestGuess}/>}</td>
                                    <td className="is-family-code">{isCurrentGuesser && (remainingGuessTime / 1000).toFixed(2)}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                {isCurrentGuesser && (
                    <div className="container">
                        <form
                            autoComplete="off"
                            onSubmit={event => {
                                event.preventDefault()
                                makeGuess({variables: {gameId: game.id, guessValue}})
                                    .finally(() => setGuessValue(""))
                            }}
                        >
                            <div className="field">
                                <label className="label">Guess</label>
                                <div className="control">
                                    <input
                                        name="guessValue"
                                        disabled={guessing}
                                        autoFocus
                                        required
                                        className="input"
                                        value={guessValue}
                                        onChange={event => setGuessValue(event.target.value)}
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

function FinishedGameView({game, userId}: { game: FinishedGame, userId: string }) {
    const {push} = useHistory();
    const participantMap = game.getParticipantMap()
    const remainingParticipants = game.getRemainingParticipants()
    const correctGuessCount = game.getCorrectGuessCount()
    const admin = game.admin.id === userId
    const sortedCorrectGuessCount = Object.entries(correctGuessCount)
        .sort(([, left], [, right]) => right - right)
    const NextGameSection = function () {
        const [createGame, remoteData] = useCreateGame({variables: {previousGameId: game.id}});
        if (game.nextGameId) {
            return <Link to={`/game/${game.nextGameId}`}>Next game</Link>
        } else if (admin) {
            if (is.failure(remoteData)) {
                return <ErrorPage error={remoteData.error}/>
            }
            const creatingGame = is.loading(remoteData)
            return (
                <button
                    className={classNames({
                        "button": true,
                        "loading": creatingGame,
                    })}
                    disabled={creatingGame}
                    onClick={async () => {
                        const remoteData = await createGame();
                        const gameId = remoteData.data.createGame?.id
                        if (gameId) {
                            push(`/game/${gameId}`)
                        }
                    }}
                >
                    Play another game
                </button>
            )
        } else {
            return <p>Waiting for <strong>{game.admin.name}</strong> to create a new game.</p>
        }
    }
    return (
        <div>
            <section className="section">
                <div className="container">
                    <h1 className="title is-spaced">Game finished</h1>
                    <h2 className="subtitle">
                        {remainingParticipants.length === 0 && "Everybody lost!"}
                        {remainingParticipants.length === 1 && `${remainingParticipants[0].name} won this game!`}
                        {remainingParticipants.length > 1 && "There was no single winner in this game. All the objects in the category where guessed!"}
                    </h2>
                    <NextGameSection/>
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
                            const placementNumber = 1 + sortedCorrectGuessCount.filter(count => count[1] > score).length
                            const placement = ordinal(placementNumber)
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
                    <h1 className="title is-spaced">Game details</h1>
                    <div className="field">
                        <label className="label">Category name</label>
                        <p title="content">{game.category.name}</p>
                    </div>
                    <div className="field">
                        <label className="label">Category description</label>
                        <p title="content">{game.category.description}</p>
                    </div>
                    <div className="field">
                        <label className="label">Correct guesses</label>
                        <p title="content">{game.guesses.filter(guess => guess.isCorrect()).length}</p>
                    </div>
                    <div className="field">
                        <label className="label">Remaining unguessed objects</label>
                        <p title="content">{game.getNotGuessedCategoryItems().length}</p>
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
                            <th>Object</th>
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

export default function GamePage() {
    const {gameId} = useParams();
    const gameRD = useGameSubscription(gameId || "");
    const userId = useSelector(state => state.user.id);

    if (!gameId) {
        return <p>Missing <code>gameId</code></p>
    }

    if (is.notAsked(gameRD)) {
        return null
    }

    if (is.loading(gameRD)) {
        return <Loading/>
    }

    if (is.failure(gameRD)) {
        return <NotFound id={gameId} objectType="game"/>
    }

    const game = gameRD.data

    if (!game) {
        return <NotFound id={gameId} objectType="game"/>
    }

    if (game.isLobby()) {
        return <LobbyView game={game} userId={userId}/>
    }

    if (game.isRunningGame()) {
        return <RunningGameView game={game} userId={userId}/>
    }

    return <FinishedGameView game={game} userId={userId}/>
}
