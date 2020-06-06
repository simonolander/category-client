import React from "react";

export function Loading() {
    return (
        <section className="section">
            <div className="container">
                <h1 className="title">Loading</h1>
                <progress className="progress is-small is-light" max="100"/>
            </div>
        </section>
    )
}