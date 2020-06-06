import {useDispatch} from "react-redux";
import React, {useState} from "react";
import {changeDisplayName} from "../redux/Store";
import {AppName} from "../Constants";
import classNames from "classnames";

export default function AnonymousPage() {
    const dispatch = useDispatch();
    const [displayName, setDisplayName] = useState("");
    const [saving, setSaving] = useState(false)

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSaving(true)
        dispatch(changeDisplayName(displayName))
    }

    return (
        <div className="section">
            <div className="container">
                <h1 className="title">Hi</h1>
                <p className="content">
                    Welcome to {AppName}. You'll soon be able to start,
                    but first we need to know how to display your name.
                </p>
                <form onSubmit={submit}>
                    <div className="field">
                        <label className="label">
                            <p>What should we call you?</p>
                        </label>
                        <div className="field has-addons">
                            <div
                                className={classNames(
                                    {
                                        "control": true,
                                        "is-loading": saving,
                                    }
                                )}
                            >
                                <input
                                    placeholder="Display name"
                                    name="displayName"
                                    className="input"
                                    type="text"
                                    disabled={saving}
                                    value={displayName}
                                    onChange={event => setDisplayName(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="control">
                                <button className="button is-primary" type="submit" disabled={saving}>Continue</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}