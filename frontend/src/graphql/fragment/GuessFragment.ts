import {gql} from "@apollo/client";
import {CategoryItem, GuessError} from "../../../../functions/shared/src/main";
import {User} from "shared";

export const userFragment = gql`
    fragment GuessFragment on Guess {
        id
        value
        guesser
        createdTime
        categoryItem
        error
    }
`

export interface GuessFragment {
    readonly id: string;
    readonly value: string | null;
    readonly guesser: User;
    readonly createdTime: number;
    readonly categoryItem: CategoryItem | null
    readonly error: GuessError | null
}