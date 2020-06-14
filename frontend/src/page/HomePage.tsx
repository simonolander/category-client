import React, {useState} from 'react';
import {Link, useHistory} from 'react-router-dom';
import {AppName} from "../Constants";
import classNames from "classnames";
import {ErrorPage} from "../component/ErrorPage";
import {is, RemoteData} from "remote-data-ts";
import {useCreateGame} from "../graphql/mutation/CreateGame";
import {useGames} from "../graphql/query/Games";
import {Loading} from "../component/Loading";

function GamesTableView() {
    const gamesRD = useGames({variables: {limit: 10, orderByField: "createdTime", orderByDirection: "desc"}});
    const title = "Games"
    if (is.notAsked(gamesRD)) {
        return null
    }

    if (is.loading(gamesRD)) {
        return <Loading title={title}/>
    }

    if (is.failure(gamesRD)) {
        return <ErrorPage error={gamesRD.error}/>
    }

    return (
        <section className="section">
            <div className="container">
                <h1 className="title">{title}</h1>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Game</th>
                        <th>Status</th>
                        <th>Category</th>
                        <th>Admin</th>
                        <th>Participants</th>
                    </tr>
                    </thead>
                    <tbody>
                    {gamesRD.data.map((game, index) => {
                        let categoryName = null
                        let status
                        if (game.isLobby()) {
                            status = "Lobby"
                        }
                        else if (game.isRunningGame()) {
                            status = "Running"
                            categoryName = game.category.name
                        }
                        else {
                            status = "Finished"
                            categoryName = game.category.name
                        }

                        return (
                            <tr key={game.id}>
                                <td><Link className="is-family-code" to={`/game/${game.id}`}>{game.id}</Link></td>
                                <td>{status}</td>
                                <td>{categoryName}</td>
                                <td>{game.admin.name}</td>
                                <td>{game.participants.length}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default function HomePage() {
    const {push} = useHistory();
    const [createGame, remoteData] = useCreateGame();

    if (is.failure(remoteData)) {
        return <ErrorPage error={remoteData.error}/>
    }

    const creatingGame = is.loading(remoteData)
    return (
        <div>
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
            <GamesTableView/>
        </div>
    );
}
