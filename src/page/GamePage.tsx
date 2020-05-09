import React, {useEffect, useRef, useState} from 'react';
import {subscribeGame} from "../service/firestore";
import {useParams} from 'react-router-dom';
import {Category, Game, getCurrentGuesser, getRemainingGuessTime} from "../common";
import {useSelector} from "react-redux";
import {gql, useMutation, useQuery} from "@apollo/client";

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

let GET_CATEGORIES = gql`
    {
        categories {
            id
            name
            description
        }
    }
`

interface GetCategoriesResult {
    readonly categories: Category[];
}

function Participants({game}: { game: Game }) {
    return (
        <ul>
            {game.participants.map(({id, name}) =>
                <li key={id}>{name}</li>
            )}
        </ul>
    )
}

function Lobby({userId, game}: { game: Game, userId: string }) {
    const [leaveGame, {loading: leaving}] = useMutation(LEAVE_GAME);
    const [joinGame, {loading: joining}] = useMutation(JOIN_GAME);
    const [startGame, {loading: starting}] = useMutation(START_GAME);
    const {data: categories, loading: loadingCategories} = useQuery<GetCategoriesResult>(GET_CATEGORIES)

    if (game.admin.id === userId) {
        return (
            <div>
                <Participants game={game}/>
                <form onSubmit={event => {
                    event.preventDefault()
                    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                    return startGame({variables: {...values, gameId: game.id}})
                }}>
                    <label>
                        <p>Category</p>
                        <select required name="categoryId">
                            {categories?.categories.map(({id, name}) => <option key={id} value={id}>{name}</option>)}
                        </select>
                    </label>
                    <button disabled={starting} type="submit">Start</button>
                </form>
            </div>
        )
    }

    const isParticipant = game.participants.some(participant => participant.id === userId);
    return (
        <div>
            <Participants game={game}/>
            {isParticipant
                ? <button disabled={leaving} onClick={() => leaveGame({variables: {gameId: game.id}})}>Leave</button>
                : <button disabled={joining} onClick={() => joinGame({variables: {gameId: game.id}})}>Join</button>
            }
        </div>
    )
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


function RunningGame({game}: { game: Game, userId: string }) {
    const [time, setTime] = useState(Date.now())
    const [makeGuess, {loading: guessing, error: guessError}] = useMutation(MAKE_GUESS);
    const remainingGuessTime = getRemainingGuessTime(game, time) || NaN

    useAnimationFrame(time => setTime(Date.now()))

    useEffect(() => {
        if (remainingGuessTime > 0) {
            const handle = setTimeout(() => console.log("Timed out!"), remainingGuessTime)
            return () => clearTimeout(handle)
        }
    }, [game.startedTime, game.guessTime, game.guesses.length])

    if (guessError) {
        return <pre>{guessError.message}</pre>
    }

    const currentGuesser = getCurrentGuesser(game);
    if (!currentGuesser) {
        return <pre>Current guesser is null</pre>
    }

    return (
        <div>
            <ul>
                {game.guesses.map(guess =>
                    <li key={guess.id}>{guess.value}</li>
                )}
            </ul>
            {game.participants.map(participant => {
                const isCurrentGuesser = currentGuesser.id === participant.id
                return (
                    <div key={participant.id}>
                        <p>{participant.name}</p>
                        <p>{(remainingGuessTime / 1000).toFixed(2)}</p>
                        <p>{isCurrentGuesser ? ">" : "!"}</p>
                        {isCurrentGuesser && (
                            <form onSubmit={event => {
                                event.preventDefault()
                                const values = Object.fromEntries(new FormData(event.currentTarget).entries());
                                return makeGuess({variables: {...values, gameId: game.id}})
                            }}>
                                <fieldset disabled={guessing}>
                                    <label>
                                        <p>Guess</p>
                                        <input type="text" name="guessValue" required/>
                                    </label>
                                    <input type="submit" value="Guess"/>
                                </fieldset>
                            </form>
                        )}
                    </div>
                )
            })}
        </div>
    )
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
        return <div>loading</div>;
    }

    if (!game.startedTime) {
        return <Lobby game={game} userId={userId}/>
    }

    if (game.finishedTime) {
        return <pre>Game over</pre>
    }

    return <RunningGame game={game} userId={userId}/>
}
