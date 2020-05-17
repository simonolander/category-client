import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {BrowserRouter} from "react-router-dom";
import {Provider} from "react-redux";
import {initializeStore} from "./redux/Store";
import {ApolloClient, ApolloLink, ApolloProvider, HttpLink, InMemoryCache} from "@apollo/client"
import firebase from "firebase";
import {setContext} from "@apollo/link-context"

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
