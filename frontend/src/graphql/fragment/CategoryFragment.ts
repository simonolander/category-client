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
        languages
        tags
        imageUrl
    }
`

export interface CategoryFragment {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly items: {
        readonly name: string
        readonly description: string
    }[]
    readonly languages: string[],
    readonly tags: string[],
    readonly imageUrl: string,
}