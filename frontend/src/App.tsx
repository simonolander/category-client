import React from 'react';
import {Route, Switch} from "react-router-dom";
import HomePage from "./page/HomePage";
import GamePage from "./page/GamePage";
import {useSelector} from "react-redux";
import SetDisplayName from "./page/SetDisplayName";
import 'bulma/css/bulma.css'
import {AppName} from "./Constants";

function App() {
    const username = useSelector(state => state.user.name);

    if (!username) {
        return <SetDisplayName/>
    }

    return (
        <div>
            <nav className="navbar has-shadow is-spaced">
                <div className="navbar-brand">
                    <div className="navbar-item">
                        <span>{AppName}</span>
                    </div>
                </div>
                <div className="navbar-menu">
                    <div className="navbar-end">
                        <div className="navbar-item">
                            <span>{username}</span>
                        </div>
                    </div>
                </div>
            </nav>
            <Switch>
                <Route exact path="/">
                    <HomePage/>
                </Route>
                <Route exact path="/game/:gameId">
                    <GamePage/>
                </Route>
            </Switch>
        </div>
    );
}

export default App;
