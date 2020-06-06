import {DocumentNode, MutationHookOptions, useQuery} from "@apollo/client";
import {RemoteData} from "remote-data-ts";

export function useRemoteDataQuery<TData, TVariables>(query: DocumentNode, options: MutationHookOptions<TData, TVariables> = {}) {
    if (typeof options.errorPolicy === "undefined") {
        options = {...options, errorPolicy: "all"}
    }
    const {data, loading, called, error} = useQuery<TData, TVariables>(query, options);
    if (!called) {
        return RemoteData.notAsked()
    }
    if (loading) {
        return RemoteData.loading()
    }
    if (error) {
        return RemoteData.failure(error)
    }
    if (data) {
        return RemoteData.success(data)
    }
    return RemoteData.failure(new Error("No data, no error"))
}