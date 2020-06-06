import {gql, MutationHookOptions} from "@apollo/client";
import {useRemoteDataQuery} from "./index";
import {CategoryFragment, categoryFragment} from "../fragment/CategoryFragment";

const query = gql`
    query Category($categoryId: ID!) {
        category(categoryId: $categoryId) {
            ...CategoryFragment
        }
    }
    ${categoryFragment}
`

interface TData {
    category: CategoryFragment
}

interface TVariables {
    categoryId: string
}

export function useCategory(options?: MutationHookOptions<TData, TVariables>) {
    return useRemoteDataQuery(query, options)
}
