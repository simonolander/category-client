import {FetchResult, gql, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";
import {useGraphQLMutation} from "./index";

const mutation = gql`
    mutation JoinGame($gameId: ID!) {
        joinGame(gameId: $gameId) {
            id
        }
    }
`

interface TData {
    joinGame: { id: string }
}

interface TVariables {
    gameId?: string
}

export function useJoinGame(options?: MutationHookOptions<TData, TVariables>) {
    return useGraphQLMutation(mutation, options)
}
