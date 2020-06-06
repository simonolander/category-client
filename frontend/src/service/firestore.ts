import {firestore} from "firebase";
import {useEffect, useState} from "react";
import {RemoteData} from "remote-data-ts";
import {fromGameEntity, gameDecoder, GameEntity, TGame} from "shared";

/**
 * Subscribe to changes in a given GameEntity
 * @param gameId The id of the game to subscribe to
 * @param next A callback with a new GameEntity every time a change has been made
 * @param error A callback for whenever an error occurs
 * @return A function that you're supposed to call to cancel the subscription
 */
export function subscribeGame(
    gameId: string,
    next: ((game: GameEntity) => void),
    error: ((error: firestore.FirestoreError) => void) = console.error
): () => void {
    return firestore().collection("game")
        .doc(gameId)
        .onSnapshot({
            next(snapshot) {
                const data = snapshot.data();
                if (data) {
                    gameDecoder.decodePromise(data)
                        .then(next)
                        .catch((reason: string) => error({
                            code: "unavailable",
                            message: reason,
                            name: "Decode error"
                        }))
                } else {
                    error({
                        code: "not-found",
                        message: `Game ${gameId} not found`,
                        name: "Not found",
                    })
                }
            },
            error
        });
}

export function useGameSubscription(gameId: string): RemoteData<TGame | null, Error> {
    const [gameRD, setGameRD] = useState<RemoteData<TGame | null, Error>>(RemoteData.notAsked());
    useEffect(() => {
        setGameRD(RemoteData.loading())
        return firestore()
            .collection("game")
            .doc(gameId)
            .onSnapshot({
                next(snapshot) {
                    const result = gameDecoder.decode(snapshot.data());
                    if (result.isOk()) {
                        setGameRD(RemoteData.success(fromGameEntity(result.value)))
                    } else {
                        setGameRD(RemoteData.success(null))
                    }
                },
                error(error) {
                    setGameRD(RemoteData.failure(error))
                }
            })
    }, [gameId, setGameRD])

    return gameRD
}