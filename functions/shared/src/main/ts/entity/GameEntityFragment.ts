import gql from 'graphql-tag';

export const gameEntityFragment = gql `
    fragment GameEntityFragment on Game {
        id
        participants {
            id
            name
        }
        admin {
            id
            name
        }
        category {
            id
            name
            description
            items {
                description
                name
                spellings
            }
        }
        guesses {
            value
            createdTime
            guesser {
                id
                name
            }
        }
        createdTime
        startedTime
        finishedTime
        guessTime
        nextGameId
    }
`