import {useDispatch} from "react-redux";
import React, {useState} from "react";
import {changeDisplayName} from "../redux/Store";

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
        <div>
            <form onSubmit={submit}>
                <fieldset disabled={saving}>
                    <label>
                        <p>Display name</p>
                        <input value={displayName} onChange={event => setDisplayName(event.target.value)} required/>
                    </label>
                    <input type="submit" value="Submit"/>
                </fieldset>
            </form>
        </div>
    )
}