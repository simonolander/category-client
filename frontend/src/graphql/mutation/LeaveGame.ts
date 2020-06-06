import {FetchResult, gql, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";
import {useGraphQLMutation} from "./index";

const mutation = gql`
    mutation LeaveGame($gameId: ID!) {
        leaveGame(gameId: $gameId) {
            id
        }
    }
`

interface TData {
    leaveGame: { id: string }
}

interface TVariables {
    gameId?: string
}

export function useLeaveGame(options?: MutationHookOptions<TData, TVariables>) {
    return useGraphQLMutation(mutation, options)
}
