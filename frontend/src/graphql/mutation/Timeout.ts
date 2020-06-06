import {FetchResult, gql, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";
import {useGraphQLMutation} from "./index";

const mutation = gql`
    mutation Timeout($gameId: ID!) {
        timeout(gameId: $gameId) {
            id
        }
    }
`

interface TData {
    timeout: { id: string }
}

interface TVariables {
    gameId?: string
}

export function useTimeout(options?: MutationHookOptions<TData, TVariables>) {
    return useGraphQLMutation(mutation, options)
}
