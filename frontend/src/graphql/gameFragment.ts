import {gql} from "@apollo/client";

export const GameFragment = gql`
    fragment GameFragment on Game {
        id
        admin {
            id
            displayName
        }
        categoryId
#        createdTime
#        startedTime
#        finishedTime
    }
`