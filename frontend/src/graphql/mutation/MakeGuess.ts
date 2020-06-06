import {FetchResult, gql, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";
import {useGraphQLMutation} from "./index";

const mutation = gql`
    mutation MakeGuess($gameId: ID!, $guessValue: String!) {
        makeGuess(gameId: $gameId, guessValue: $guessValue) {
            id
        }
    }
`

interface TData {
    makeGuess: { id: string }
}

interface TVariables {
    gameId: string
    guessValue: string
}

export function useMakeGuess(options?: MutationHookOptions<TData, TVariables>) {
    return useGraphQLMutation(mutation, options)
}
