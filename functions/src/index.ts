/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {Request} from 'express'
import {ApolloServer, gql} from "apollo-server-express"
import * as credentials from "./serviceAccount.json"
import {categoryRepository} from "./repository";
import {Context} from "./Context";
import {Category} from "common/src/main";
import {createGame, joinGame, leaveGame, makeGuess, startGame, timeout} from "./resolver/resolver";

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
    }

    type Mutation {
        createGame: Game
        joinGame(gameId: ID!): Game
        leaveGame(gameId: ID!): Game
        startGame(gameId: ID!, categoryId: ID!): Game
        makeGuess(gameId: ID!, guessValue: String!): Game
        timeout(gameId: ID!): Game
    }

    type User {
        id: ID
        displayName: String
    }

    type Category {
        id: ID
        name: String
        description: String
        items: [CategoryItem]
    }

    type CategoryItem {
        name: String
        description: String
        spellings: [String]
    }

    type Game {
        id: String
        admin: User
        categoryId: String
        guesses: [Guess]
        participants: [User]
        createdTime: Int
        startedTime: Int
        finishedTime: Int
    }

    type Guess {
        value: String
        guesser: User
        createdTime: String
    }
`

const resolvers = {
    Query: {
        async categories(parent: undefined, args: {}, context: Context): Promise<Category[]> {
            return categoryRepository.findAll()
        },
        async category(parent: undefined, {categoryId}: { categoryId: string }, context: Context): Promise<Category | null> {
            return categoryRepository.findById(categoryId)
        }
    },
    Mutation: {
        createGame,
        joinGame,
        makeGuess,
        leaveGame,
        startGame,
        timeout
    },
};

async function context({req}: { req: Request }): Promise<Context> {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.warn("Missing authorization header")
        return {}
    }

    const authorizationPrefix = "Bearer "
    if (!authHeader.startsWith(authorizationPrefix)) {
        console.warn(`Invalid authorization header, must have the format '${authorizationPrefix}<token>'`)
        return {}
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
            }
        }
    } catch (e) {
        console.warn(e.message)
        return {}
    }
}

const apolloServer = new ApolloServer({typeDefs, resolvers, context})

app.use(corsHandler);
apolloServer.applyMiddleware({app, path: "/"})

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
export const graphql = functions.https.onRequest(app);