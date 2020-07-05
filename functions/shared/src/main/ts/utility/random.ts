import {swap} from "typescript-collections/dist/lib/arrays";

export function shuffle<T>(array: T[]) {
    const copy = [...array]
    for (let i = 0; i < copy.length; ++i) {
        swap(copy, i, Math.floor(Math.random() * copy.length))
    }
    return copy
}

export function xmur3(value: string): () => number {
    let h = 1779033703 ^ value.length
    for (let i = 0; i < value.length; i++) {
        h = Math.imul(h ^ value.charCodeAt(i), 3432918353)
        h = h << 13 | h >>> 19;
    }
    return function () {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

export class SFC32 {
    private a: number = 0x9e3779b9
    private b: number = 0x243f6a88
    private c: number = 0xb7e15162
    private d: number

    constructor(seed: number | string = Math.random()) {
        if (typeof seed === "number") {
            this.d = seed ^ 0xdeadbeef
            for (let i = 0; i < 15; ++i) {
                this.next()
            }
        } else {
            const xmur = xmur3(seed);
            this.a = xmur()
            this.b = xmur()
            this.c = xmur()
            this.d = xmur()
        }
    }

    next() {
        this.a >>>= 0;
        this.b >>>= 0;
        this.c >>>= 0;
        this.d >>>= 0;
        let t = (this.a + this.b) | 0;
        this.a = this.b ^ this.b >>> 9;
        this.b = this.c + (this.c << 3) | 0;
        this.c = (this.c << 21 | this.c >>> 11);
        this.d = this.d + 1 | 0;
        t = t + this.d | 0;
        this.c = this.c + t | 0;
        return (t >>> 0) / 4294967296;
    }

    nextBoolean() {
        return this.next() < 0.5
    }

    nextInt(max = Number.MAX_SAFE_INTEGER, min = 0) {
        return Math.floor(this.next() * (max - min)) + min
    }
}