import React from 'react';
import './App.css';
import {Route, Switch} from "react-router-dom";
import HomePage from "./page/HomePage";
import GamePage from "./page/GamePage";
import {useSelector} from "react-redux";
import SetDisplayName from "./page/SetDisplayName";

function App() {
    const username = useSelector(state => state.user.name);

    if (!username) {
        return <SetDisplayName/>
    }

    return (
        <Switch>
            <Route exact path="/">
                <HomePage/>
            </Route>
            <Route exact path="/game/:gameId">
                <GamePage/>
            </Route>
        </Switch>
    );
}

export default App;
