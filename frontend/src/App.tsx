import React from 'react';
import {Link, Route, Switch} from "react-router-dom";
import HomePage from "./page/HomePage";
import GamePage from "./page/GamePage";
import {useSelector} from "react-redux";
import AnonymousPage from "./page/AnonymousPage";
import 'bulma/css/bulma.css'
import {AppName} from "./Constants";
import CategoriesPage from "./page/CategoriesPage";
import {categoriesPagePath} from "./navigation";

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
                <Route exact path={categoriesPagePath}>
                    <CategoriesPage/>
                </Route>
            </Switch>
        )
    } else {
        content = <AnonymousPage/>
    }

    return (
        <div>
            <nav className="navbar has-shadow is-spaced">
                <Link to="/">
                    <div className="navbar-brand">
                        <div className="navbar-item">
                            <img src="/logo512.png" className="is-spaced" alt="Website logo"/>
                        </div>
                        <div className="navbar-item">
                            <span>{AppName}</span>
                        </div>
                    </div>
                </Link>
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
