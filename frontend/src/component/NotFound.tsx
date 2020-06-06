import React from "react";
import {Link} from "react-router-dom";

type ObjectType = "game"

export function NotFound(props: {
    objectType: ObjectType;
    id: string;
}) {
    return (
        <section className="section">
            <div className="container">
                <h1 className="title">Not found</h1>
                <p className="content">The {props.objectType.toLowerCase()} with id <code>{props.id}</code> was not found.</p>
                <Link to="/">Go to home</Link>
            </div>
        </section>
    )
}