import {AppName} from "../Constants";
import React, {CSSProperties} from "react";

const style: CSSProperties = {
    fontSize: "xxx-large",
    marginTop: "10vh",
}

export function Title() {
    return (
        <h1 style={style}>{AppName}</h1>
    )
}