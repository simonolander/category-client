import {swap} from "typescript-collections/dist/lib/arrays";

export function shuffle<T>(array: T[]) {
    const copy = [...array]
    for (let i = 0; i < copy.length; ++i) {
        swap(copy, i, Math.floor(Math.random() * copy.length))
    }
    return copy
}