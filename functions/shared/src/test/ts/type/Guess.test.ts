import {guessConverter, GuessEntity} from "../../../main";

it('test duplicate', function () {
    const entity: GuessEntity = {
        categoryItem: {
            name: "category_name",
            spellings: [],
            description: "category_description",
            imageUrl: null,
            url: null
        },
        createdTime: 123,
        error: "duplicate",
        guesser: {
            id: "guesser_id",
            name: "guesser_name"
        },
        id: "guess_id",
        value: "int"
    }
    expect(guessConverter.fromFirestore(entity)?.isCorrect()).toEqual(false)
    expect(guessConverter.fromFirestore(entity)?.isDuplicate()).toEqual(true)
    expect(guessConverter.fromFirestore(entity)?.isTimedOut()).toEqual(false)
    expect(guessConverter.fromFirestore(entity)?.isIncorrect()).toEqual(false)
});