import {gql} from "@apollo/client";

export const userFragment = gql`
    fragment UserFragment on User {
        id
        name
    }
`

export interface UserFragment {
    id: string
    name: string
}