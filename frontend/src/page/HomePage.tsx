import React from 'react';
import {useHistory} from 'react-router-dom';
import {AppName} from "../Constants";
import classNames from "classnames";
import {ErrorPage} from "../component/ErrorPage";
import {is} from "remote-data-ts";
import {useCreateGame} from "../graphql/mutation/CreateGame";

export default function HomePage() {
    const {push} = useHistory();
    const [createGame, remoteData] = useCreateGame();

    if (is.failure(remoteData)) {
        return <ErrorPage error={remoteData.error}/>
    }

    const creatingGame = is.loading(remoteData)
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
                        onClick={async () => {
                            const remoteData = await createGame();
                            const gameId = remoteData.data.createGame?.id
                            if (gameId) {
                                push(`/game/${gameId}`)
                            }
                        }}
                    >
                        Create new game
                    </button>
                </header>
            </div>
        </div>
    );
}
