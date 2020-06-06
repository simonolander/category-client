import React from 'react';
import {Route, Switch} from "react-router-dom";
import HomePage from "./page/HomePage";
import GamePage from "./page/GamePage";
import {useSelector} from "react-redux";
import AnonymousPage from "./page/AnonymousPage";
import 'bulma/css/bulma.css'
import {AppName} from "./Constants";

function App() {
    const username = useSelector(state => state.user.name);

    let content;
    if (username) {
        content = (
            <Switch>
                <Route exact path="/">
                    <HomePage/>
                </Route>
                <Route exact path="/game/:gameId">
                    <GamePage/>
                </Route>
            </Switch>
        )
    } else {
        content = <AnonymousPage/>
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
            {content}
        </div>
    );
}

export default App;
