import {gql, MutationHookOptions} from "@apollo/client";
import {useRemoteDataQuery} from "./index";
import {fromGameEntity, GameEntity, gameEntityFragment, TGame} from "shared";
import {cata, RemoteData} from "remote-data-ts";

const query = gql`
    query Games(
        $limit: Int, 
        $startAt: String, 
        $endAt: String, 
        $orderByField: GameOrderByField, 
        $orderByDirection: OrderByDirection
    ) {
        games(
            limit: $limit, 
            startAt: $startAt, 
            endAt: $endAt,
            orderByField: $orderByField,
            orderByDirection: $orderByDirection,
        ) {
            ...GameEntityFragment
        }
    }
    ${gameEntityFragment}
`

interface TData {
    games: GameEntity[]
}

interface TVariables {
    limit?: number
    startAt?: string
    endAt?: string,
    orderByField?: "id" | "createdTime",
    orderByDirection?: "asc" | "desc",
}

const cataFn = cata<TData, Error, RemoteData<TGame[], Error>>({
    notAsked() {
        return RemoteData.notAsked()
    },
    loading() {
        return RemoteData.loading()
    },
    failure(error) {
        return RemoteData.failure(error)
    },
    success(data) {
        const games = []
        for (let d of data.games) {
            const game = fromGameEntity(d);
            if (game) {
                games.push(game)
            }
        }
        return RemoteData.success(games)
    }
})

export function useGames(options?: MutationHookOptions<TData, TVariables>) {
    const useGameEntityRD = useRemoteDataQuery(query, options);
    return cataFn(useGameEntityRD)
}
