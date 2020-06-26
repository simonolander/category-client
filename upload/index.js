const admin = require("firebase-admin")
const shared = require("../functions/shared/package/index.js")

admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccount.json")),
    databaseURL: "https://category-131ad.firebaseio.com"
});

const firestore = admin.firestore();

async function deleteCollection(collection) {
    if (typeof collection === "string") {
        collection = firestore.collection(collection);
    }
    const documents = await collection.listDocuments();
    for (let document of documents) {
        const collections = await document.listCollections();
        for (let collection of collections) {
            await deleteCollection(collection)
        }
        await document.delete();
        console.log(`Deleted document ${document.path}`)
    }
}

function verifyCategory(category) {
    const decode = shared.categoryDecoder.decode(category);
    if (!decode.isOk()) {
        throw new Error(decode.error)
    }
    const itemNames = {}
    for (const item of category.items) {
        if (itemNames[item.name]) {
            throw new Error(`Multiple instance of item name ${item.name} in category ${category.name}`)
        }
        itemNames[item.name] = true
    }
    const spellings = {}
    for (const item of category.items) {
        for (const spelling of item.spellings) {
            if (spellings[spelling]) {
                throw new Error(`Multiple instance of spelling ${spelling} in category ${category.name}`)
            }
            spellings[spelling] = true
        }
    }
}

(async () => {
    const categories = [
        require("./data/category/java-keywords"),
        require("./data/category/swedish-alphabet"),
        require("./data/category/pokemon"),
        require("./data/category/prime-numbers-below-twenty.json"),
        require("./data/category/paris-metro-line-4.json"),
        require("./data/category/c-sharp-keywords.json"),
        require("./data/category/countries_europe.json"),
        require("./data/category/countries_africa.json"),
        require("./data/category/countries_asia.json"),
        require("./data/category/currencies.json"),
        require("./data/category/dinosaurs.json"),
        require("./data/category/regions_france.json"),
        require("./data/category/presidents-usa.json"),
    ];
    const categoryCollectionName = "category";

    for (const category of categories) {
        verifyCategory(category)
    }

    const cleanUpload = false
    if (cleanUpload) {
        const collections = await firestore.listCollections()
        console.log("Fetched collections")
        for (const collection of collections) {
            await deleteCollection(collection)
            console.log(`Deleted collection ${collection.path}`)
        }
    }

    for (const category of categories) {
        await firestore.collection(categoryCollectionName)
            .doc(category.id)
            .set(category)
            .then(() => console.log(`Added category ${category.name}`))
    }
})();

