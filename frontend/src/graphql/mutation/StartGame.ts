import {FetchResult, gql, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";
import {useGraphQLMutation} from "./index";

const mutation = gql`
    mutation StartGame($gameId: ID!, $categoryId: ID!, $guessTime: Int!) {
        startGame(gameId: $gameId, categoryId: $categoryId, guessTime: $guessTime) {
            id
        }
    }
`

interface TData {
    startGame: { id: string }
}

interface TVariables {
    gameId: string
    categoryId: string
    guessTime: number
}

export function useStartGame(options?: MutationHookOptions<TData, TVariables>) {
    return useGraphQLMutation(mutation, options)
}
