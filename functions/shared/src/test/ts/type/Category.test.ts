import {Category, CategoryItem} from "../../../main";

const bulbasaur: CategoryItem = {
    name: "Bulbasaur",
    description: "Pokemon #1",
    spellings: []
}
const nidoran_female: CategoryItem = {
    name: "Nidoran♀",
    description: "Pokemon #29",
    spellings: [
        "nidoran",
        "nidoran female",
        "female nidoran"
    ]
}
const nidorina: CategoryItem = {
    name: "Nidorina",
    description: "Pokemon #30",
    spellings: []
}
const nidoran_male: CategoryItem = {
    name: "Nidoran♂",
    description: "Pokemon #32",
    spellings: [
        "nidoran male",
        "male nidoran"
    ]
}
const abra: CategoryItem = {
    name: "Abra",
    description: "Pokemon #63",
    spellings: []
}
const golem: CategoryItem = {
    name: "Golem",
    description: "Pokemon #76",
    spellings: []
}
const farfetchd: CategoryItem = {
    name: "Farfetch'd",
    description: "Pokemon #83",
    spellings: []
}
const seel: CategoryItem = {
    name: "Seel",
    description: "Pokemon #86",
    spellings: []
}
const muk: CategoryItem = {
    name: "Muk",
    description: "Pokemon #89",
    spellings: []
}
const mrmime: CategoryItem = {
    name: "Mr. Mime",
    description: "Pokemon #122",
    spellings: [
        "mister mime",
        "mime"
    ]
}
const mew: CategoryItem = {
    name: "Mew",
    description: "Pokemon #151",
    spellings: []
}

const category: Category =
    new Category(
        "Hb3vxyf",
        "Pokémon subset",
        "Description of category",
        [
            bulbasaur,
            nidoran_female,
            nidorina,
            nidoran_male,
            abra,
            golem,
            farfetchd,
            seel,
            muk,
            mrmime,
            mew,
        ]
    )

it.each<[string, CategoryItem | null]>([
    ["bulbasaur", bulbasaur],
    ["BULBASAUR", bulbasaur],
    ["BULBASAU", bulbasaur],
    ["BULBASA", bulbasaur],
    ["BULlBASAUR", bulbasaur],
    ["BULlBASAURe", bulbasaur],
    ["BULlBASAUe", bulbasaur],
    ["BULBoSAor", bulbasaur],
    ["BULBoSAor", bulbasaur],
    ["bulbasaur123", null],
    ["", null],
    ["m", null],
    ["muk", muk],
    ["mku", muk],
    ["mu", muk],
    ["k", muk],
    ["mew", mew],
    ["w", mew],
    ["Mr. Mime", mrmime],
    ["Mime", mrmime],
    ["mister mime", mrmime],
    ["mime mister", null],
    ["mr mime", mrmime],
    ["mr mim", mrmime],
    ["mr mi", null],
    ["nidoran", nidoran_female],
    ["female nidoran", nidoran_female],
    ["male nidoran", nidoran_male],
    ["Nidoran♂", nidoran_male],
    ["Nidoran♀", nidoran_female],
    ["Nidorani", nidoran_female],
    ["Nidorina", nidorina],
    ["Nidorin", nidorina],
    ["Nidoroni", nidoran_female], // Because Nidoran♀ is the only one with the spelling "nidoran"
])(`find("%s") is %o`, (guess, categoryItem) => {
    expect(category.getItemByGuess(guess)).toEqual(categoryItem)
})
