import {CategoryItem, categoryItemDecoder} from "./CategoryItem";
import {JsonDecoder} from "ts.data.json";
import {levenshtein} from "../utility/levenshtein";

export interface Category {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly items: Array<CategoryItem>;
}

export const categoryDecoder = JsonDecoder.object<Category>({
    id: JsonDecoder.string,
    name: JsonDecoder.string,
    description: JsonDecoder.string,
    items: JsonDecoder.array(categoryItemDecoder, "CategoryItem[]"),
}, "Category");

export function findCategoryItemByGuess(category: Category, guess: string): CategoryItem | null {
    if (!guess) {
        return null
    }

    for (const item of category.items) {
        if (item.name === guess) {
            return item
        }
    }

    const lowerCaseGuess = guess.toLowerCase()
    if (lowerCaseGuess !== guess) {
        for (const item of category.items) {
            if (item.name.toLowerCase() === lowerCaseGuess) {
                return item
            }
        }
    }

    for (const item of category.items) {
        for (let spelling of item.spellings) {
            if (spelling.toLowerCase() === lowerCaseGuess) {
                return item
            }
        }
    }

    const maxLevenshteinDistance = 2
    const closestItemsByName = category.items.reduce(
        (reduction: { distance: number; items: CategoryItem[] }, item) => {
            const distance = levenshtein(item.name.toLowerCase(), lowerCaseGuess, maxLevenshteinDistance);
            if (distance === reduction.distance) {
                reduction.items.push(item)
                return reduction
            }
            if (distance < reduction.distance) {
                return {
                    distance,
                    items: [item]
                }
            }
            return reduction
        },
        {
            distance: Infinity,
            items: []
        }
    );
    if (closestItemsByName.distance <= maxLevenshteinDistance && closestItemsByName.items.length === 1) {
        return closestItemsByName.items[0]
    }

    const closestItemsBySpelling = category.items.reduce(
        (reduction: { distance: number; items: CategoryItem[] }, item) => {
            const distance = item.spellings.reduce((previousDistance, spelling) => Math.min(previousDistance, levenshtein(spelling, lowerCaseGuess, maxLevenshteinDistance)), Infinity)
            if (distance === reduction.distance) {
                reduction.items.push(item)
                return reduction
            }
            if (distance < reduction.distance) {
                return {
                    distance,
                    items: [item]
                }
            }
            return reduction
        },
        {
            distance: Infinity,
            items: []
        }
    );
    if (closestItemsBySpelling.distance <= maxLevenshteinDistance && closestItemsBySpelling.items.length === 1) {
        return closestItemsBySpelling.items[0]
    }

    return null
}