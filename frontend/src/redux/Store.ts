import {configureStore, createAsyncThunk, createReducer} from "@reduxjs/toolkit";
import {DefaultRootState} from "react-redux";
import firebase from "firebase";
import {User} from "common";

declare module "react-redux" {
    interface DefaultRootState {
        user: User
    }
}

export const changeDisplayName = createAsyncThunk<string, string>("CHANGE_USERNAME_ASYNC",
    async (arg, thunkAPI) => {
        await firebase.auth()
            .currentUser
            ?.updateProfile({displayName: arg})
        return arg;
    })

export async function initializeStore() {
    const userCredential = await firebase.auth().signInAnonymously();
    const user = userCredential.user
    if (!user) {
        throw new Error(`User not signed in: ${userCredential}`)
    }
    const rootReducer = createReducer<DefaultRootState>(
        {
            user: {
                id: user.uid,
                name: user.displayName || "",
            }
        },
        builder =>
            builder
                .addCase(changeDisplayName.fulfilled, (state, {payload}) => {
                    state.user.name = payload
                })
                .addCase(changeDisplayName.rejected, (state, action) => console.log("changeUsernameAsync.rejected", action))
    );

    return configureStore({
        reducer: rootReducer,
    });
}
