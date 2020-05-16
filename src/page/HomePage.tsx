import React, {useEffect} from 'react';
import {useHistory} from 'react-router-dom';
import {gql, useMutation} from "@apollo/client";
import {AppName} from "../Constants";
import classNames from "classnames";

const CREATE_GAME = gql`
    mutation CreateGame {
        createGame {
            id
        }
    }
`

interface Game {
    readonly id: string;
}

interface TData {
    readonly createGame: Game
}

export default function HomePage() {
    const {push} = useHistory();
    const [createGame, {data, loading: creatingGame, error}] = useMutation<TData>(CREATE_GAME);

    useEffect(() => {
        if (data) {
            push(`/game/${data.createGame.id}`)
        }
    }, [data])

    if (error) {
        return <pre>{error.message}</pre>
    }

    return (
        <div className="section">
            <div className="container">
                <header className="is-centered">
                    <h1 className="title">{AppName}</h1>
                    <button
                        disabled={creatingGame}
                        className={classNames({
                            button: true,
                            "is-loading": creatingGame
                        })}
                        onClick={() => createGame()}
                    >
                        Create new game
                    </button>
                </header>
            </div>
        </div>
    );
}
