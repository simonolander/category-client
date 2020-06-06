import {Link} from "react-router-dom";
import React from "react";
import {ApolloError} from "@apollo/client";

export function ErrorPage({error}: { error: Error }) {
    let content
    if (error instanceof ApolloError) {
        content = (
            <div className="content">
                {error.graphQLErrors.map((error, index) =>
                    <div key={index}>
                        <p className="subtitle">{error.message}</p>
                    </div>
                )}
            </div>
        )
    } else {
        content = <p className="content">{error.message}</p>
    }
    const raw = JSON.stringify(error, null, 2)
    return (
        <section className="section">
            <div className="container">
                <h1 className="title">An unexpected error occurred</h1>
                {content}
                <p className="content">
                    Try <Link to="/">going back to home</Link> or refreshing the page.
                </p>
                <label className="label">Raw error</label>
                <pre>{raw}</pre>
            </div>
        </section>
    )

}