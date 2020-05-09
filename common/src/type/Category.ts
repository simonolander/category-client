import {CategoryItem, categoryItemDecoder} from "./CategoryItem";
import {JsonDecoder} from "ts.data.json";

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
