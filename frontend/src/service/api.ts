import {User} from "shared";
import firebase from "firebase";
import axios from "axios"

async function getIdToken(): Promise<string> {
    const user = firebase.auth().currentUser;
    if (!user) {
        throw new Error(`User not signed in`);
    }
    return user.getIdToken()
}

export async function joinLobby(lobbyId: string) {
    throw new Error("Not implemented")
}

export async function leaveLobby(lobbyId: string, user: User, secret: string) {
    throw new Error("Not implemented")
}

export async function startLobby(lobbyId: string, user: User, secret: string) {
    throw new Error("Not implemented")
}

export async function createLobby() {
    const idToken = await getIdToken();
    console.log("idToken", idToken);
    return axios.get("http://localhost:5001/category-131ad/us-central1/api/hello", {
        headers: {
            Authorization: `Bearer ${idToken}`
        }
    })
        .then(console.log)
}