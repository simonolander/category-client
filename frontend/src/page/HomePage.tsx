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
                <h1 className="title is-4">{title}</h1>
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
                        } else if (game.isRunningGame()) {
                            status = "Running"
                            categoryName = game.category.name
                        } else {
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
            <section className="section">
                <div className="container">
                    <h1 className="title">{AppName}</h1>
                    <h2 className="title is-4">About</h2>
                    <p className="content">
                        {AppName} is a quiz game where you need to guess objects in a category.
                        A category can be almost anything, for example songs
                        by <span className="is-italic">Linkin Park</span>
                        , <span className="is-italic">countries in Asia</span>,
                        or <span className="is-italic">names of Disney princesses</span>.
                        Each player takes turn to guess an object in the category,
                        e.g. <span className="is-italic">In The End</span>.
                        A guess is correct if it corresponds to an object in the category, and if that object hasn't
                        been previously guessed. Last player standing wins.
                    </p>
                    <p className="content">
                        You can either create a new game, or search for a game to join below.
                    </p>
                    <button
                        disabled={creatingGame}
                        className={classNames({
                            "button": true,
                            "is-primary": true,
                            "is-loading": creatingGame,
                        })}
                        onClick={async () => {
                            const remoteData = await createGame();
                            const gameId = remoteData.data.createGame?.id
                            if (gameId) {
                                push(`/game/${gameId}`)
                            }
                        }}
                    >
                        <span className="icon">
                            <i className="fas fa-game"/>
                        </span>
                        <span>Create new game</span>
                    </button>
                </div>
            </section>
            <GamesTableView/>
        </div>
    );
}
