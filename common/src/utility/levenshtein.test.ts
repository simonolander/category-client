import {levenshtein} from "./levenshtein";
import casual from "casual"

const seed = casual.integer()
casual.seed(seed)
console.info(`Seed: ${seed}`)

it.each<[string, string, number | undefined, number]>([
    ["aaa", "bbb", undefined, 3],
    ["a", "bbb", undefined, 3],
    ["a cat", "ac dc", undefined, 3],
    ["A", "a", undefined, 1],
    ["a long string", "a very long string", undefined, 5],
    ["the dog is the best pet", "the cat is the worst pet", undefined, 6],
    ["zuSut4", "Rv6pQ", 2, 2],
    ["k", "muk", 2, 2],
    ["k", "muk", undefined, 2],
    ["Nidoroni", "Nidorina", undefined, 2],
    ["Nidoroni", "Nidoran♀", undefined, 2],
])('lev("%s", "%s", %s) === %d', (a, b, limit, expected) => {
    expect(levenshtein(a, b, limit)).toEqual(expected)
})

it('limit < 0 -> lev(a, b, limit) throws', function () {
    const a = casual.string
    const b = casual.string
    const limit = -casual.integer(1)
    expect(() => levenshtein(a, b, limit)).toThrow()
});

it('limit === NaN -> lev(a, b, NaN) throws', function () {
    const a = casual.string
    const b = casual.string
    const limit = NaN
    expect(() => levenshtein(a, b, limit)).toThrow()
});

it('lev(a, b, Infinity) throws', function () {
    const a = casual.string
    const b = casual.string
    const limit = Infinity
    expect(() => levenshtein(a, b, limit)).toThrow()
});

it('lev(a, b, -Infinity) throws', function () {
    const a = casual.string
    const b = casual.string
    const limit = -Infinity
    expect(() => levenshtein(a, b, limit)).toThrow()
});

it('!Number.isInteger(limit) -> lev(a, b, limit) throws', function () {
    const a = casual.string
    const b = casual.string
    const limit = casual.double()
    expect(Number.isInteger(limit)).toEqual(false)
    expect(() => levenshtein(a, b, limit)).toThrow()
});

it('lev("", "", limit) === 0', function () {
    const limit = casual.integer(0)
    expect(levenshtein("", "", limit)).toEqual(0)
});

it('lev("", a, limit) === min(a.length, limit)', function () {
    const a = casual.string
    const limit = casual.integer(0)
    expect(levenshtein("", a, limit)).toEqual(Math.min(a.length, limit))
});

it('lev(a, "", limit) === min(a.length, limit)', function () {
    const a = casual.string
    const limit = casual.integer(0)
    expect(levenshtein(a, "", limit)).toEqual(Math.min(a.length, limit))
});

it('lev(a, a, limit) === 0', function () {
    const a = casual.string
    const limit = casual.integer(0)
    expect(levenshtein(a, a, limit)).toEqual(0)
});

it('lev(a, b, limit) === lev(b, a, limit)', function () {
    const a = casual.string
    const b = casual.string
    const limit = casual.integer(0)
    expect(levenshtein(a, b, limit)).toEqual(levenshtein(b, a, limit))
});

it('limit > 0 -> lev("a", "b", limit) === 1', function () {
    const limit = casual.integer(1)
    expect(levenshtein("a", "b", limit)).toEqual(1)
});

it('limit > 0 -> lev("ab", "ba", limit) === 1', function () {
    const limit = casual.integer(1)
    expect(levenshtein("ab", "ba", limit)).toEqual(1)
});

it('lev(a, b, limit) <= limit', function () {
    const a = casual.string
    const b = casual.string
    const limit = casual.integer(0)
    expect(levenshtein(a, b, limit)).toBeLessThanOrEqual(limit)
});

it('limit > 0 -> lev("abc", "acb", limit) === 1', function () {
    const limit = casual.integer(1)
    expect(levenshtein("abc", "acb", limit)).toEqual(1)
});

it('0 <= limit < 5 -> lev("a long string", "a very long string", limit) === limit', function () {
    const limit = casual.integer(0, 5)
    expect(levenshtein("a long string", "a very long string", limit)).toEqual(limit)
});

it('0 <= limit <= lev(a, b) <- lev(a, b, limit) === limit', function () {
    const a = casual.string
    const b = casual.string
    const limit = casual.integer(0, levenshtein(a, b))
    expect(levenshtein(a, b, limit)).toEqual(limit)
});