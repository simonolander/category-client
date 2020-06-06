import {FetchResult, gql, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";
import {useGraphQLMutation} from "./index";

const mutation = gql`
    mutation CreateGame($previousGameId: ID) {
        createGame(previousGameId: $previousGameId) {
            id
        }
    }
`

interface TData {
    createGame: { id: string } | null
}

interface TVariables {
    previousGameId?: string
}

export function useCreateGame(options?: MutationHookOptions<TData, TVariables>) {
    return useGraphQLMutation(mutation, options)
}
