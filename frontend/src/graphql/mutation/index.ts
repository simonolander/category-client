import {DocumentNode, MutationFunctionOptions, MutationHookOptions, useMutation} from "@apollo/client";
import {RemoteData} from "remote-data-ts";

export function useGraphQLMutation<TData, TVariables>(
    mutation: DocumentNode,
    options: MutationHookOptions<TData, TVariables> = {}
): [((options?: MutationFunctionOptions<TData, TVariables>) => Promise<{ data: TData, errors: Error[] }>), RemoteData<TData, Error>] {
    if (typeof options.errorPolicy === "undefined") {
        options = {...options, errorPolicy: "all"}
    }
    const [callMutation, {loading, data, error, called}] = useMutation<TData, TVariables>(mutation, options);
    if (!called) {
        return [callMutation, RemoteData.notAsked()]
    }
    if (loading) {
        return [callMutation, RemoteData.loading()]
    }
    if (error) {
        return [callMutation, RemoteData.failure(error)]
    }
    if (data) {
        return [callMutation, RemoteData.success(data)]
    }
    return [callMutation, RemoteData.failure(new Error("No data, no error"))]
}