import {JsonDecoder} from "ts.data.json"

export interface CategoryItem {
    readonly name: string
    readonly description: string
    readonly spellings: Array<string>
    readonly url: string | null
    readonly imageUrl: string | null
}

export const categoryItemDecoder = JsonDecoder.object<CategoryItem>({
    name: JsonDecoder.string,
    description: JsonDecoder.string,
    spellings: JsonDecoder.array(JsonDecoder.string, "string[]"),
    url: JsonDecoder.failover(null, JsonDecoder.string),
    imageUrl: JsonDecoder.failover(null, JsonDecoder.string),
}, "CategoryItem")
