import {gql, MutationHookOptions} from "@apollo/client";
import {useRemoteDataQuery} from "./index";
import {CategoryFragment, categoryFragment} from "../fragment/CategoryFragment";

const query = gql`
    query Categories {
        categories {
            ...CategoryFragment
        }
    }
    ${categoryFragment}
`

interface TData {
    categories: CategoryFragment[]
}

interface TVariables {}

export function useCategories(options?: MutationHookOptions<TData, TVariables>) {
    return useRemoteDataQuery(query, options)
}
