import {JsonDecoder} from "ts.data.json"
import {CategoryItem, categoryItemDecoder} from "./CategoryItem"
import {IStorable, levenshtein} from "../.."

export interface CategoryEntity {
    readonly id: string
    readonly name: string
    readonly description: string
    readonly items: CategoryItem[]
    readonly languages: string[]
    readonly tags: string[]
    readonly imageUrl: string
}

export const categoryDecoder = JsonDecoder.object<CategoryEntity>({
    id: JsonDecoder.string,
    name: JsonDecoder.string,
    description: JsonDecoder.string,
    items: JsonDecoder.array(categoryItemDecoder, "CategoryItem[]"),
    languages: JsonDecoder.failover([], JsonDecoder.array(JsonDecoder.string, "string[]")),
    tags: JsonDecoder.failover([], JsonDecoder.array(JsonDecoder.string, "string[]")),
    imageUrl: JsonDecoder.string,
}, "Category")

export class Category implements IStorable<CategoryEntity> {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly items: CategoryItem[],
        public readonly languages: string[],
        public readonly tags: string[],
        public readonly imageUrl: string,
    ) {
    }

    getItemByGuess(guessValue: string): CategoryItem | null {
        if (!guessValue) {
            return null
        }

        for (const item of this.items) {
            if (item.name === guessValue) {
                return item
            }
        }

        const lowerCaseGuess = guessValue.toLowerCase()
        if (lowerCaseGuess !== guessValue) {
            for (const item of this.items) {
                if (item.name.toLowerCase() === lowerCaseGuess) {
                    return item
                }
            }
        }

        for (const item of this.items) {
            for (const spelling of item.spellings) {
                if (spelling.toLowerCase() === lowerCaseGuess) {
                    return item
                }
            }
        }

        const maxLevenshteinDistance = 2
        const closestItemsByName = this.items.reduce(
            (reduction: { distance: number, items: CategoryItem[] }, item) => {
                const distance = levenshtein(item.name.toLowerCase(), lowerCaseGuess, maxLevenshteinDistance + 1)
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
        )
        if (closestItemsByName.distance <= maxLevenshteinDistance && closestItemsByName.items.length === 1) {
            return closestItemsByName.items[0]
        }

        const closestItemsBySpelling = this.items.reduce(
            (reduction: { distance: number, items: CategoryItem[] }, item) => {
                const distance = item.spellings.reduce((previousDistance, spelling) => Math.min(previousDistance, levenshtein(spelling, lowerCaseGuess, maxLevenshteinDistance + 1)), Infinity)
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
        )
        if (closestItemsBySpelling.distance <= maxLevenshteinDistance && closestItemsBySpelling.items.length === 1) {
            return closestItemsBySpelling.items[0]
        }

        return null
    }

    toEntity(): CategoryEntity {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            items: this.items,
            languages: this.languages,
            tags: this.tags,
            imageUrl: this.imageUrl,
        }
    }

    static fromEntity(entity: CategoryEntity): Category {
        return new Category(
            entity.id,
            entity.name,
            entity.description,
            entity.items,
            entity.languages,
            entity.tags,
            entity.imageUrl,
        )
    }
}