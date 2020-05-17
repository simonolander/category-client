import {useDispatch} from "react-redux";
import React, {useState} from "react";
import {changeDisplayName} from "../redux/Store";
import {Title} from "../Components/Title";

export default function SetDisplayName() {
    const dispatch = useDispatch();
    const [displayName, setDisplayName] = useState("");
    const [saving, setSaving] = useState(false)

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        dispatch(changeDisplayName(displayName))
    }

    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <Title/>
            <form onSubmit={submit}>
                <fieldset disabled={saving} style={{display: "flex", flexDirection: "column", minWidth: "30vw"}}>
                    <label>
                        <p>Display name</p>
                        <input value={displayName} onChange={event => setDisplayName(event.target.value)} required/>
                    </label>
                    <button type="submit">Continue</button>
                    <legend>What should we call you?</legend>
                </fieldset>
            </form>
        </div>
    )
}