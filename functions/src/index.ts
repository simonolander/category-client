import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {Request} from 'express'
import {ApolloServer, gql} from "apollo-server-express"
import * as credentials from "./serviceAccount.json"
import {Context} from "./Context";
import {createGame, games, joinGame, leaveGame, makeGuess, startGame, timeout} from "./resolver/resolver";
import {CategoryEntity} from "shared";
import {categoryRepository} from "./repository";
import * as about from "./about.json";

admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: "https://category-131ad.firebaseio.com"
});

const app = require("express")();
const corsHandler = require("cors")({origin: true});

const typeDefs = gql`
    type Query {
        hello: String
        categories: [Category]
        category(categoryId: ID!): Category
        games(limit: Int, startAt: String, endAt: String, orderByField: GameOrderByField, orderByDirection: OrderByDirection): [Game]
        about: About!
    }

    type Mutation {
        createGame(previousGameId: ID): Game
        joinGame(gameId: ID!): Game
        leaveGame(gameId: ID!): Game
        startGame(gameId: ID!, categoryId: ID!, guessTime: Int!): Game
        makeGuess(gameId: ID!, guessValue: String!): Game
        timeout(gameId: ID!): Game
    }

    type User {
        id: ID
        name: String
    }

    type Category {
        id: ID
        name: String
        description: String
        items: [CategoryItem]
        languages: [String]
        tags: [String]
        imageUrl: String
    }

    type CategoryItem {
        name: String
        description: String
        spellings: [String]
    }

    type Guess {
        id: String
        value: String
        guesser: User
        createdTime: Float
        categoryItem: CategoryItem
        error: String
    }

    type Game {
        id: String
        admin: User
        category: Category
        guesses: [Guess]
        participants: [User]
        createdTime: Float
        startedTime: Float
        finishedTime: Float
        guessTime: Int
        nextGameId: String
    }
    
    enum GameOrderByField {
        id
        createdTime
    }
    
    enum OrderByDirection {
        asc
        desc
    }
    
    type About {
        version: String!
        buildTime: String!
    }
`

const resolvers = {
    Query: {
        async categories(parent: undefined, args: {}, ctx: Context): Promise<CategoryEntity[]> {
            return categoryRepository.findAll()
                .then(categories => categories.map(category => category.toEntity()))
        },
        async category(parent: undefined, {categoryId}: { categoryId: string }, ctx: Context): Promise<CategoryEntity | null> {
            return categoryRepository.findById(categoryId)
                .then(category => category && category.toEntity())
        },
        games,
        async about() {
            return about
        }
    },
    Mutation: {
        createGame,
        joinGame,
        makeGuess,
        leaveGame,
        startGame,
        timeout,
    },
};

async function context({req}: { req: Request }): Promise<Context> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.warn("Missing authorization header")
        return {req}
    }

    const authorizationPrefix = "Bearer "
    if (!authHeader.startsWith(authorizationPrefix)) {
        console.warn(`Invalid authorization header, must have the format '${authorizationPrefix}<token>'`)
        return {req}
    }
    const idToken = authHeader.substring(authorizationPrefix.length)

    try {
        const auth = admin.auth();
        const decodedIdToken = await auth.verifyIdToken(idToken);
        const userRecord = await auth.getUser(decodedIdToken.uid);

        // TODO Remove wait
        await new Promise(resolve => setTimeout(resolve, 1))

        return {
            user: {
                id: userRecord.uid,
                name: userRecord.displayName || "anon"
            },
            req
        }
    } catch (e) {
        console.warn(e.message)
        return {req}
    }
}

const apolloServer = new ApolloServer({typeDefs, resolvers, context})

app.use(corsHandler);
apolloServer.applyMiddleware({app, path: "/"})

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
export const graphql = functions.https.onRequest(app);