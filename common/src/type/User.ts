import {JsonDecoder} from "ts.data.json";

export interface User {
    readonly id: string;
    readonly name: string;
}

export const userDecoder = JsonDecoder.object<User>({
    id: JsonDecoder.string,
    name: JsonDecoder.string,
}, "User");
