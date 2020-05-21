import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {BrowserRouter} from "react-router-dom";
import {Provider} from "react-redux";
import {initializeStore} from "./redux/Store";
import {ApolloClient, ApolloLink, ApolloProvider, HttpLink, InMemoryCache} from "@apollo/client"
import firebase from "firebase";
import {setContext} from "@apollo/link-context"

const firebaseConfig = {
    apiKey: "AIzaSyC5ce_rmF-DkhmhUBIghNVpcBjF2ul_3sg",
    authDomain: "category-131ad.firebaseapp.com",
    databaseURL: "https://category-131ad.firebaseio.com",
    projectId: "category-131ad",
    storageBucket: "category-131ad.appspot.com",
    messagingSenderId: "497743195440",
    appId: "1:398238074184:web:e5f1741c78b687955c1f7d",
    measurementId: "G-7HW2N6D8BD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

async function render() {
    const store = await initializeStore()

    const apolloClient = new ApolloClient({
        cache: new InMemoryCache(),
        link: ApolloLink.concat(
            setContext(async (operation, prevContext) => {
                try {
                    const token = await firebase.auth().currentUser?.getIdToken();
                    if (token) {
                        return {
                            ...prevContext,
                            headers: {
                                authorization: `Bearer ${token}`
                            }
                        }
                    }
                } catch (e) {
                    console.log(e)
                    return {...prevContext}
                }
            }),
            new HttpLink({
                uri: 'http://localhost:5001/category-131ad/us-central1/graphql',
            })
        )
    });

    ReactDOM.render(
        <React.StrictMode>
            <BrowserRouter>
                <Provider store={store}>
                    <ApolloProvider client={apolloClient}>
                        <App/>
                    </ApolloProvider>
                </Provider>
            </BrowserRouter>
        </React.StrictMode>,
        document.getElementById('root')
    );
}

render().catch(console.error)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
