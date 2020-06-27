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
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faArrowRight,
    faCheck,
    faCog,
    faCopy,
    faCrown,
    faHourglassEnd,
    faPlay,
    faRedoAlt, faThumbsUp,
    faTimes,
    faUserMinus,
    faUserPlus,
    faUsers
} from "@fortawesome/free-solid-svg-icons";
import {useMakeGuess} from "../graphql/mutation/MakeGuess";
import {useTimeout} from "../graphql/mutation/Timeout";
import {useCreateGame} from "../graphql/mutation/CreateGame";

function millisToString(milliseconds: number): any {
    if (milliseconds < 0) {
        return <progress className="progress is-small is-light" title="Sending time out"/>
    }
    const secondsInMillis = 1000
    const minutesInMillis = secondsInMillis * 60
    const hoursInMillis = minutesInMillis * 60
    const daysInMillis = hoursInMillis * 24

    let remainingTime = milliseconds
    const days = Math.floor(remainingTime / daysInMillis)
    remainingTime %= daysInMillis
    const hours = Math.floor(remainingTime / hoursInMillis)
    remainingTime %= hoursInMillis
    const minutes = Math.floor(remainingTime / minutesInMillis)
    remainingTime %= minutesInMillis
    const seconds = Math.floor(remainingTime / secondsInMillis)
    remainingTime %= secondsInMillis
    const millis = remainingTime
    if (days) {
        return `${days.toString().padStart(2, "0")}:${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`
    }
    else if (hours) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`
    }
    else if (minutes) {
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`
    }
    else {
        return `${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`
    }
}

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
                <FontAwesomeIcon icon={faCheck}/>
            </span>
        )
    } else if (guess.isIncorrect()) {
        return (
            <span className="icon" title="Incorrect">
                <FontAwesomeIcon icon={faTimes}/>
            </span>
        )
    } else if (guess.isDuplicate()) {
        return (
            <span className="icon" title="Already guessed">
                <FontAwesomeIcon icon={faCopy}/>
            </span>
        )
    } else {
        return (
            <span className="icon" title="Timed out">
                <FontAwesomeIcon icon={faHourglassEnd}/>
            </span>
        )
    }
}

function AdminControls({game}: { game: Lobby }) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [startGame, startGameRemoteData] = useStartGame();
    const starting = is.loading(startGameRemoteData)
    const categoriesRemoteData = useCategories()

    const CategoriesSelect = function () {
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
        const selectDisabled = starting || !is.success(categoriesRemoteData)

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
                            disabled={selectDisabled}
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

    const submitDisabled = starting || !is.success(categoriesRemoteData)

    return (
        <section className="section">
            <div className="container">
                <h1 className="title is-4">
                    <FontAwesomeIcon icon={faCog}/> Game options
                </h1>
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
                                    <FontAwesomeIcon icon={faHourglassEnd}/>
                                </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="columns">
                        <div className="column is-narrow">
                            <div className="field">
                                <div className="control">
                                    <button
                                        type="submit"
                                        disabled={submitDisabled}
                                        className={classNames({
                                            "button": true,
                                            "is-primary": true,
                                            "is-fullwidth": true,
                                            "is-loading": starting,
                                        })}
                                    >
                                    <span className="icon">
                                        <FontAwesomeIcon icon={faPlay}/>
                                    </span>
                                        <span>Start game</span>
                                    </button>
                                </div>
                            </div>
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
            <section className="section">
                <div className="container">
                    <h1 className="title">Lobby</h1>
                    <h1 className="subtitle">Waiting for players to join</h1>
                    <p className="content">Share this link to anyone you would like to invite</p>
                    <pre className="content">{window.location.href}</pre>
                    {game.canJoinGame(userId) && (
                        <div className="columns">
                            <div className="column is-narrow">
                                <div className="field">
                                    <div className="control">
                                        <button
                                            disabled={joining}
                                            onClick={() => joinGame(options)}
                                            className={classNames({
                                                "button": true,
                                                "is-loading": joining,
                                                "is-primary": true,
                                                "is-fullwidth": true,
                                            })}
                                        >
                                            <span className="icon">
                                                <FontAwesomeIcon icon={faUserPlus}/>
                                            </span>
                                            <span>Join game</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {game.canLeaveGame(userId) && (
                        <div className="columns">
                            <div className="column is-narrow">
                                <div className="field">
                                    <div className="control">
                                        <button
                                            onClick={() => leaveGame(options)}
                                            disabled={leaving}
                                            className={classNames({
                                                "button": true,
                                                "is-loading": leaving,
                                                "is-warning": true,
                                                "is-light": true,
                                                "is-fullwidth": true,
                                            })}
                                        >
                                            <span className="icon">
                                                <FontAwesomeIcon icon={faUserMinus}/>
                                            </span>
                                            <span>Leave game</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            {game.admin.id === userId && <AdminControls game={game}/>}
            <section className="section">
                <div className="container">
                    <h1 className="title is-4">
                        <FontAwesomeIcon icon={faUsers}/> Players
                    </h1>
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
                                            <FontAwesomeIcon icon={faCrown}/>
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
    const anyHasDescription = game.participants.some(({id}) => game.getLatestGuess(id)?.categoryItem?.description)
    const anyHasImageUrl = game.participants.some(({id}) => game.getLatestGuess(id)?.categoryItem?.imageUrl)
    return (
        <div>
            <section className="section">
                <div className="container">
                    <h1 className="title">{game.category.name}</h1>
                    <h1 className="subtitle is-spaced">{game.category.description}</h1>
                    <h1 className="title is-4">Guesses</h1>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Last guess</th>
                            <th className="is-hidden-mobile">Object</th>
                            {anyHasDescription && <th className="is-hidden-mobile">Description</th>}
                            <th>Status</th>
                            {anyHasImageUrl && <th className="is-hidden-mobile">Image</th>}
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
                                    <td className="is-hidden-mobile">{latestGuess?.categoryItem?.name}</td>
                                    {anyHasDescription && (
                                        <td className="is-hidden-mobile">{latestGuess?.categoryItem?.description}</td>
                                    )}
                                    <td>{latestGuess && <StatusIcon guess={latestGuess}/>}</td>
                                    {anyHasImageUrl && (
                                        <td>
                                            {latestGuess?.categoryItem?.imageUrl && (
                                                <img
                                                    style={{maxHeight: "2.5em"}}
                                                    src={latestGuess.categoryItem.imageUrl}
                                                    alt="Object image"
                                                />
                                            )}
                                        </td>
                                    )}
                                    <td className="is-family-code">{isCurrentGuesser && millisToString(remainingGuessTime)}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
                <br/>
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
                            <div className="columns">
                                <div className="column is-one-third">
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
                                </div>
                            </div>
                            <div className="columns">
                                <div className="column is-narrow">
                                    <div className="field">
                                        <div className="control">
                                            <button
                                                type="submit"
                                                disabled={guessing}
                                                className={classNames({
                                                    "button": true,
                                                    "is-loading": guessing,
                                                    "is-primary": true,
                                                    "is-fullwidth": true,
                                                })}
                                            >
                                                <span className="icon">
                                                    <FontAwesomeIcon icon={faThumbsUp}/>
                                                </span>
                                                <span>Make guess</span>
                                            </button>
                                        </div>
                                    </div>
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
    const remainingParticipants = game.getRemainingParticipants()
    const admin = game.admin.id === userId
    const NextGameSection = function () {
        const [createGame, remoteData] = useCreateGame({variables: {previousGameId: game.id}});
        if (game.nextGameId) {
            return (
                <Link className="button is-primary" to={`/game/${game.nextGameId}`}>
                    <span className="icon">
                        <FontAwesomeIcon icon={faArrowRight}/>
                    </span>
                    <span>Next game</span>
                </Link>
            )
        } else if (admin) {
            if (is.failure(remoteData)) {
                return <ErrorPage error={remoteData.error}/>
            }
            const creatingGame = is.loading(remoteData)
            return (
                <button
                    className={classNames({
                        "button": true,
                        "is-primary": true,
                        "is-loading": creatingGame,
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
                    <span className="icon">
                        <FontAwesomeIcon icon={faRedoAlt}/>
                    </span>
                    <span>Play another game</span>
                </button>
            )
        } else {
            return <p>Waiting for <strong>{game.admin.name}</strong> to create a new game.</p>
        }
    }
    const someGuessHasObject = game.guesses.some(guess => guess.categoryItem)
    const someGuessHasDescription = game.guesses.some(guess => guess.categoryItem?.description)
    const someGuessHasUrl = game.guesses.some(guess => guess.categoryItem?.url)
    const someGuessHasImageUrl = game.guesses.some(guess => guess.categoryItem?.imageUrl)
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
                            <th>Placement</th>
                            <th>Name</th>
                            <th>Score</th>
                        </tr>
                        </thead>
                        <tbody>
                        {game.getPlacements().map(placement => (
                            <tr key={placement.participant.id}>
                                <td>{ordinal(placement.placement)}</td>
                                <td>{placement.participant.name}</td>
                                <td>{placement.numberOfCorrectGuesses}</td>
                            </tr>
                        ))}
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
                            {someGuessHasObject && <th>Object</th>}
                            {someGuessHasDescription && <th>Description</th>}
                            <th>Status</th>
                            {someGuessHasUrl && <th>Info</th>}
                            {someGuessHasImageUrl && <th>Image</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {game.guesses.map((guess, index) => {
                            return (
                                <tr key={guess.id}>
                                    <td>{index + 1}</td>
                                    <td>{guess.guesser.name}</td>
                                    <td>{guess.value}</td>
                                    {someGuessHasObject && (
                                        <td>{guess.categoryItem?.name}</td>
                                    )}
                                    {someGuessHasDescription && (
                                        <td>{guess.categoryItem?.description}</td>
                                    )}
                                    <td><StatusIcon guess={guess}/></td>
                                    {someGuessHasUrl && (
                                        <td>
                                            {guess.categoryItem?.url && (
                                                <a href={guess.categoryItem.url}>Learn more</a>
                                            )}
                                        </td>
                                    )}
                                    {someGuessHasImageUrl && (
                                        <td>
                                            {guess.categoryItem?.imageUrl && (
                                                <img
                                                    style={{maxHeight: "10em"}}
                                                    src={guess.categoryItem.imageUrl}
                                                    alt="Object image"
                                                />
                                            )}
                                        </td>
                                    )}
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
