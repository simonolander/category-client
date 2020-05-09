import React, {useEffect} from 'react';
import {useHistory} from 'react-router-dom';
import {gql, useMutation} from "@apollo/client";

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
    const [createGame, {data, loading, error}] = useMutation<TData>(CREATE_GAME);

    useEffect(() => {
        if (data) {
            push(`/game/${data.createGame.id}`)
        }
    }, [data])

    if (loading) {
        return <div>Loading</div>
    }

    if (error) {
        return <pre>{error.message}</pre>
    }

    return (
        <div>
            <button onClick={() => createGame()}>Create new game</button>
        </div>
    );
}
