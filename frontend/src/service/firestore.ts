import {Game, gameDecoder} from "shared";
import {firestore} from "firebase";

/**
 * Subscribe to changes in a given Game
 * @param gameId The id of the game to subscribe to
 * @param next A callback with a new Game every time a change has been made
 * @param error A callback for whenever an error occurs
 * @return A function that you're supposed to call to cancel the subscription
 */
export function subscribeGame(
    gameId: string,
    next: ((game: Game) => void),
    error: ((error: firebase.firestore.FirestoreError) => void) = console.error
): () => void {
    return firestore().collection("game")
        .doc(gameId)
        .onSnapshot({
            next(snapshot) {
                gameDecoder.decodePromise(snapshot.data())
                    .then(next)
                    .catch(error)
            },
            error
        });
}