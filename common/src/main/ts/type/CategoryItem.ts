import {JsonDecoder} from "ts.data.json";

export interface CategoryItem {
    readonly name: string;
    readonly description: string;
    readonly spellings: Array<string>;
}

export const categoryItemDecoder = JsonDecoder.object<CategoryItem>({
    name: JsonDecoder.string,
    description: JsonDecoder.string,
    spellings: JsonDecoder.array(JsonDecoder.string, "string[]"),
}, "CategoryItem");
