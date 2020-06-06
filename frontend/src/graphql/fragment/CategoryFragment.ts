import {gql} from "@apollo/client";

export const categoryFragment = gql`
    fragment CategoryFragment on Category {
        id
        name
        description
        items {
            name
            description
        }
    }
`

export interface CategoryFragment {
    id: string
    name: string
    description: string
    items: {
        name: string
        description: string
    }[]
}