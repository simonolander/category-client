import React from "react";

interface LoadingProps {
    title?: string
}

export function Loading(
    {title = "Loading"}: LoadingProps
) {
    return (
        <section className="section">
            <div className="container">
                <h1 className="title">{title}</h1>
                <progress className="progress is-small is-light" max="100"/>
            </div>
        </section>
    )
}