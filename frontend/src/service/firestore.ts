import firebase from "../Components/Firebase";
import {Game, gameDecoder} from "common/build/src/main";

const firestore = firebase.firestore();

export function subscribeGame(
    gameId: string,
    next: ((game: Game) => void),
    error: ((error: firebase.firestore.FirestoreError) => void) = console.error
): () => void {
    return firestore.collection("game")
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